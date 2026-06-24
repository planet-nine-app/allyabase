/**
 * get-paid.js
 *
 * Manages the allyabase server's own Addie user so it can receive a
 * commission on purchases that flow through plugins hosted on this wiki.
 *
 * Any plugin that knows the allyabase URL calls:
 *   GET /plugin/allyabase/get-paid
 * and receives a payee descriptor { pubKey, addieURL, percent, signature }
 * that it adds to the `payees` array when creating a payment intent.
 * Addie's /verify-payee validates the signature before transferring.
 *
 * Stripe Connect setup (owner only):
 *   GET /plugin/allyabase/setup/stripe?token=DEPLOYMENT_TOKEN
 *   GET /plugin/allyabase/setup/stripe/done   ← Stripe return URL
 *
 * Config stored at ~/.allyabase/addie-keys.json:
 *   { uuid, pubKey, privateKey, stripeOnboarded }
 *
 * Wiki startup args:
 *   --allyabase_commission N    commission percent, 1–9 (default 1)
 *   --owner_email EMAIL         required for Stripe Connect
 *   --deployment_token TOKEN    protects the setup/stripe endpoint
 */

const sessionless = require('sessionless-node');
const fs = require('fs');
const path = require('path');
const os = require('os');

const KEYS_PATH = path.join(os.homedir(), '.allyabase', 'addie-keys.json');
const LOCAL_ADDIE_URL = 'http://localhost:3005';
const DEFAULT_COMMISSION = 1;

let cachedKeys = null;

function loadKeys() {
  try {
    return JSON.parse(fs.readFileSync(KEYS_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function saveKeysToDisk(keys) {
  const dir = path.dirname(KEYS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(KEYS_PATH, JSON.stringify(keys, null, 2));
}

// Sign with a specific private key without disturbing the shared sessionless singleton.
// Safe in Node.js single-threaded model as long as no await occurs between set and sign.
function signWith(message, privateKey) {
  const saved = sessionless.getKeys;
  sessionless.getKeys = () => ({ privateKey });
  const sig = sessionless.sign(message);
  sessionless.getKeys = saved;
  return sig;
}

function wikiOrigin(req) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  return `${proto}://${req.get('host')}`;
}

async function ensureAddieUser() {
  cachedKeys = loadKeys();
  if (cachedKeys && cachedKeys.uuid) return cachedKeys;

  let generated = {};
  await sessionless.generateKeys(
    (k) => { generated = k; },
    () => generated
  );

  const timestamp = Date.now().toString();
  const signature = signWith(timestamp + generated.pubKey, generated.privateKey);

  const resp = await fetch(`${LOCAL_ADDIE_URL}/user/create`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timestamp, pubKey: generated.pubKey, signature })
  });

  if (!resp.ok) throw new Error(`Addie user create failed: ${resp.status}`);

  const addieUser = await resp.json();
  if (addieUser.error) throw new Error(`Addie: ${addieUser.error}`);

  const keys = {
    uuid: addieUser.uuid,
    pubKey: generated.pubKey,
    privateKey: generated.privateKey,
    stripeOnboarded: false
  };
  saveKeysToDisk(keys);
  cachedKeys = keys;
  return keys;
}

async function addRoutes(params) {
  const app = params.app;
  const argv = params.argv;

  const commission = Math.min(9, Math.max(1, parseInt(argv.allyabase_commission || DEFAULT_COMMISSION, 10)));
  const DEPLOYMENT_TOKEN = argv.deployment_token || process.env.DEPLOYMENT_TOKEN;

  try {
    await ensureAddieUser();
    console.log(`[wiki-plugin-allyabase] 💰 Get-paid user ready (${commission}% commission, Stripe ${cachedKeys.stripeOnboarded ? 'connected' : 'not yet connected'})`);
  } catch (err) {
    console.error('[wiki-plugin-allyabase] ❌ Failed to create get-paid Addie user:', err.message);
  }

  // ── GET /plugin/allyabase/get-paid ──────────────────────────────────────────
  // Returns a payee descriptor for this allyabase host.
  // Only returns a descriptor when Stripe Connect is complete — otherwise the
  // commission would be taken but never land anywhere.
  app.get('/plugin/allyabase/get-paid', function(req, res) {
    if (!cachedKeys || !cachedKeys.uuid) {
      return res.status(503).json({ error: 'Get-paid not ready' });
    }
    if (!cachedKeys.stripeOnboarded) {
      // 204 = no content: caller should skip adding this payee
      return res.status(204).end();
    }

    const addieURL = `${wikiOrigin(req)}/plugin/allyabase/addie`;
    const signature = signWith(cachedKeys.pubKey + addieURL + commission, cachedKeys.privateKey);

    res.json({ pubKey: cachedKeys.pubKey, addieURL, percent: commission, signature });
  });

  // ── GET /plugin/allyabase/setup/stripe ──────────────────────────────────────
  // Initiates Stripe Connect Express onboarding for the allyabase host.
  // Protected by deployment token — open in a browser with ?token=YOUR_TOKEN.
  app.get('/plugin/allyabase/setup/stripe', async function(req, res) {
    const token = req.query.token;
    if (!DEPLOYMENT_TOKEN || token !== DEPLOYMENT_TOKEN) {
      return res.status(403).send('<h1>Forbidden</h1><p>Provide your deployment token as ?token=TOKEN</p>');
    }
    if (!cachedKeys || !cachedKeys.uuid) {
      return res.status(503).send('<h1>Not ready</h1><p>Addie user not initialized yet — wait a moment and retry.</p>');
    }

    const email = argv.owner_email || process.env.OWNER_EMAIL;
    if (!email) {
      return res.status(400).send(
        '<h1>Owner email required</h1>' +
        '<p>Start the wiki with <code>--owner_email YOUR@EMAIL.COM</code> to enable Stripe Connect.</p>'
      );
    }

    try {
      const origin = wikiOrigin(req);
      const refreshUrl = `${origin}/plugin/allyabase/setup/stripe?token=${encodeURIComponent(token)}`;
      const returnUrl  = `${origin}/plugin/allyabase/setup/stripe/done?token=${encodeURIComponent(token)}`;

      const timestamp = Date.now().toString();
      const signature = signWith(timestamp + cachedKeys.uuid + email, cachedKeys.privateKey);

      const resp = await fetch(`${LOCAL_ADDIE_URL}/user/${cachedKeys.uuid}/processor/stripe/express`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp, country: 'US', email, refreshUrl, returnUrl, signature })
      });

      const result = await resp.json();
      if (result.error) {
        return res.status(500).send(`<h1>Stripe setup error</h1><p>${result.error}</p>`);
      }

      if (result.alreadyConnected) {
        cachedKeys.stripeOnboarded = true;
        saveKeysToDisk(cachedKeys);
        return res.send(`<!doctype html><html><head><title>Stripe Already Connected</title>
          <style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:80px auto;text-align:center;color:#1d1d1f;}</style></head>
          <body><h1>✅ Stripe already connected</h1>
          <p>Your allyabase Stripe account is already set up.</p>
          <a href="javascript:window.close()">Close this tab</a></body></html>`);
      }

      const onboardingUrl = result.stripeOnboardingUrl;
      if (!onboardingUrl) return res.status(500).send('<h1>No onboarding URL returned from Addie</h1>');

      res.redirect(onboardingUrl);
    } catch (err) {
      console.error('[wiki-plugin-allyabase] Stripe setup error:', err);
      res.status(500).send(`<h1>Setup failed</h1><p>${err.message}</p>`);
    }
  });

  // ── GET /plugin/allyabase/setup/stripe/done ─────────────────────────────────
  // Stripe redirects here after onboarding completes.
  app.get('/plugin/allyabase/setup/stripe/done', function(req, res) {
    const token = req.query.token;
    if (!DEPLOYMENT_TOKEN || token !== DEPLOYMENT_TOKEN) {
      return res.status(403).send('<h1>Forbidden</h1>');
    }
    if (cachedKeys) {
      cachedKeys.stripeOnboarded = true;
      saveKeysToDisk(cachedKeys);
    }
    console.log('[wiki-plugin-allyabase] ✅ Stripe Connect onboarding complete');
    res.send(`<!doctype html><html><head><title>Stripe Setup Complete</title>
      <style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:80px auto;text-align:center;color:#1d1d1f;}
      h1{font-size:28px;margin-bottom:12px;} p{font-size:15px;color:#555;line-height:1.6;}
      code{display:block;background:#f4f4f4;padding:10px 16px;border-radius:8px;font-size:13px;margin:16px auto;}</style></head>
      <body><h1>✅ Allyabase payouts enabled</h1>
      <p>Your allyabase server is now connected to Stripe. You'll receive a ${commission}% commission on all purchases flowing through this base.</p>
      <p>Any plugin that calls <code>${LOCAL_ADDIE_URL.replace('localhost', 'your-wiki-host')}/plugin/allyabase/get-paid</code> will automatically include you as a payee.</p>
      <a href="javascript:window.close()">Close this tab</a></body></html>`);
  });
}

module.exports = { addRoutes };
