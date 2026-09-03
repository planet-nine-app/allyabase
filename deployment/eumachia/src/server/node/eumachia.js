import config from './config/local.js';
import express from 'express';
import cors from 'cors';
import identity from './src/identity/identity.js';
import invoices from './src/invoices/invoices.js';
import payments from './src/payments/payments.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Invoice content comes from Gelder (an outside app, semi-trusted at best)
// and is rendered into a REAL, unsanitized HTML page here — unlike savage,
// which strips scripts, this page has no such protection, so every field
// gets escaped before interpolation. Skipping this would be a real XSS hole
// (a crafted invoice description could run script against anyone loading
// the pay page, including mid-payment).
function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatAmount(amountCents, currency) {
  const amount = (amountCents / 100).toFixed(2);
  return `${(currency || 'usd').toUpperCase()} $${amount}`;
}

function renderPayPage({ uuid, hash, timestamp, signature, invoice, alreadyPaid }) {
  const description = escapeHtml(invoice.description);
  const fromName = escapeHtml(invoice.fromName || '');
  const toName = escapeHtml(invoice.toName || '');
  const amountLabel = formatAmount(invoice.amountCents, invoice.currency);

  const paidBlock = `
    <div class="paid-banner">✅ This invoice has already been paid.</div>
  `;

  // hash/timestamp/signature are the exact pre-signed read credentials
  // Gelder generated for this invoice's BDO record — embedded here so this
  // page's own JS can pass them straight through on /intent and /complete,
  // the same way they arrived on this page's own URL.
  const paymentElementBlock = `
    <div id="payment-element"></div>
    <div id="pay-error" class="pay-error"></div>
  `;

  const payFooterBlock = `
    <div class="pay-footer">
      <button id="pay-btn" class="pay-button">Pay ${amountLabel}</button>
    </div>
  `;

  const payScriptBlock = `
    <script src="https://js.stripe.com/v3/"></script>
    <script>
      const readCreds = { hash: ${JSON.stringify(hash)}, timestamp: ${JSON.stringify(timestamp)}, signature: ${JSON.stringify(signature)} };
      let stripeInst, elements, clientSecret, paymentElement, started = false;

      // Every path below either succeeds or leaves the button re-enabled
      // with a visible message in #pay-error — nothing is allowed to throw
      // past this wrapper and leave the button silently stuck disabled,
      // which is exactly what an uncaught rejection (a network drop, or a
      // non-JSON error page from an upstream failure) used to do here.
      async function withPayButton(fn) {
        const btn = document.getElementById('pay-btn');
        const errorEl = document.getElementById('pay-error');
        btn.disabled = true;
        errorEl.textContent = '';
        try {
          await fn();
        } catch (err) {
          errorEl.textContent = (err && err.message) || 'Something went wrong. Please try again.';
        } finally {
          // Re-enable on success too (e.g. after startPayment mounts the
          // Stripe form, "Confirm Payment" needs to be tappable) — not just
          // on error. confirmPayment's own success path replaces the whole
          // page body, so re-enabling a button that's about to be detached
          // is harmless there.
          btn.disabled = false;
        }
      }

      // Single dispatcher bound once below, instead of an addEventListener
      // for startPayment plus a later onclick reassignment to confirmPayment
      // — that combination left the original startPayment listener attached
      // forever, so the *second* click (meant to confirm) fired startPayment
      // AND confirmPayment together, remounting a brand-new Payment Element
      // (wiping whatever the payer had just typed) right as confirmPayment
      // tried to submit it. This dispatcher only ever runs one path per click.
      async function handlePayClick() {
        if (!started) {
          await startPayment();
        } else {
          await confirmPayment();
        }
      }

      async function startPayment() {
        await withPayButton(async () => {
          const resp = await fetch('/eumachia/pay/${encodeURIComponent(uuid)}/intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(readCreds)
          });
          let data;
          try {
            data = await resp.json();
          } catch {
            throw new Error(\`Server error (\${resp.status}) starting payment. Please try again.\`);
          }
          if (!resp.ok || data.error) {
            throw new Error(data.error || \`Server error (\${resp.status}) starting payment.\`);
          }
          clientSecret = data.clientSecret;
          stripeInst = Stripe(data.publishableKey);
          elements = stripeInst.elements({ clientSecret });
          paymentElement = elements.create('payment');
          paymentElement.mount('#payment-element');
          document.getElementById('pay-btn').textContent = 'Confirm Payment';
          started = true;
        });
      }

      // Shared by both confirmPayment's own success path and the
      // redirect-return path below — either way, Stripe has told us the
      // charge succeeded, and this is the one place that tells eumachia so.
      async function finalizeComplete() {
        const resp = await fetch('/eumachia/pay/${encodeURIComponent(uuid)}/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(readCreds)
        });
        if (!resp.ok) {
          throw new Error('Payment succeeded, but confirming it with the server failed — refresh this page before trying again.');
        }
        document.body.innerHTML = '<div class="paid-banner">✅ Payment successful. Thank you!</div>';
      }

      async function confirmPayment() {
        await withPayButton(async () => {
          // Lock the card fields for the duration of the confirm call so the
          // payer can't edit them (or double-submit) while it's in flight.
          paymentElement.update({ readOnly: true });
          try {
            const { error } = await stripeInst.confirmPayment({
              elements,
              confirmParams: { return_url: window.location.href },
              redirect: 'if_required'
            });
            if (error) {
              throw new Error(error.message || 'Payment failed');
            }
            // 'if_required' only skips the redirect when the payment method
            // didn't need one (e.g. a card with no 3D Secure step). When one
            // IS required, the line above navigates the browser away and
            // this function never resumes — completion happens on the way
            // back in, below.
            await finalizeComplete();
          } catch (err) {
            paymentElement.update({ readOnly: false });
            throw err;
          }
        });
      }

      // Stripe appends redirect_status (and its own payment_intent params)
      // to return_url when it sends the payer back here after an off-page
      // authentication step (3D Secure, many bank/card flows). That used to
      // land back on a plain, unhandled '/pay/:uuid' load — showing the
      // initial "Pay" button again and never calling /complete — so a
      // payment Stripe had already charged was never recorded as paid here.
      const redirectStatus = new URLSearchParams(window.location.search).get('redirect_status');
      if (redirectStatus === 'succeeded') {
        withPayButton(finalizeComplete);
      } else {
        if (redirectStatus) {
          document.getElementById('pay-error').textContent = 'Payment was not completed. Please try again.';
        }
        document.getElementById('pay-btn').addEventListener('click', handlePayClick);
      }
    </script>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Invoice from ${fromName || 'Gelder'}</title>
<style>
  html, body { height: 100%; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a001a; color: white; margin: 0; padding: 20px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; }
  .invoice-card { max-width: 440px; width: 100%; max-height: calc(100vh - 40px); display: flex; flex-direction: column; background: rgba(255,255,255,0.05); border: 1px solid rgba(16,185,129,0.3); border-radius: 20px; overflow: hidden; }
  .invoice-scroll { overflow-y: auto; padding: 32px 28px 8px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .amount { font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #10b981 0%, #a78bfa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 12px 0; }
  .meta { font-size: 13px; color: rgba(255,255,255,0.7); margin-bottom: 4px; }
  .description { font-size: 15px; margin: 20px 0; line-height: 1.5; }
  /* Sticky footer so "Confirm Payment" stays reachable no matter how tall
     the mounted Payment Element gets (multiple payment method tabs, Link,
     etc.) or how far the payer has scrolled the card's content. */
  .pay-footer { flex-shrink: 0; padding: 16px 28px 28px; border-top: 1px solid rgba(255,255,255,0.08); }
  .pay-button { width: 100%; padding: 14px 20px; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; }
  .pay-button:disabled { opacity: 0.6; }
  #payment-element { margin-top: 16px; }
  .pay-error { color: #ef4444; font-size: 13px; margin-top: 8px; }
  .paid-banner { max-width: 440px; margin: 80px auto; text-align: center; font-size: 18px; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.4); border-radius: 16px; padding: 32px; }
</style>
</head>
<body>
  <div class="invoice-card">
    <div class="invoice-scroll">
      <h1>Invoice</h1>
      ${fromName ? `<p class="meta">From: ${fromName}</p>` : ''}
      ${toName ? `<p class="meta">To: ${toName}</p>` : ''}
      <div class="amount">${amountLabel}</div>
      <p class="description">${description}</p>
      ${alreadyPaid ? paidBlock : paymentElementBlock}
    </div>
    ${alreadyPaid ? '' : payFooterBlock}
  </div>
  ${alreadyPaid ? '' : payScriptBlock}
</body>
</html>`;
}

// Gelder's pay_url shape: /pay/{uuid}?hash={hash}&timestamp={ts}&signature={sig}
// — the exact same pre-signed-read-URL scheme already proven working for
// savage share links all session (plain ASCII query params, no emoji/
// unicode path segments — deliberately not using BDO's /emoji/:code
// mechanism, which has a real, confirmed netlify-gateway proxy bug with
// multi-byte characters in a URL path).
app.get('/pay/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const { hash, timestamp, signature } = req.query;
    if (!hash || !timestamp || !signature) {
      return res.status(400).send('This invoice link is missing required parameters.');
    }
    const invoice = await invoices.getInvoice(uuid, hash, timestamp, signature);
    if (!invoice) {
      return res.status(404).send('Invoice not found.');
    }
    const status = await payments.readPaymentStatus(uuid);
    res.set('Content-Type', 'text/html');
    res.send(renderPayPage({ uuid, hash, timestamp, signature, invoice, alreadyPaid: !!status?.paid }));
  } catch (err) {
    console.error('Error rendering pay page:', err);
    res.status(500).send('Something went wrong loading this invoice.');
  }
});

app.post('/pay/:uuid/intent', async (req, res) => {
  try {
    const { uuid } = req.params;
    const { hash, timestamp, signature } = req.body || {};
    if (!hash || !timestamp || !signature) {
      return res.status(400).json({ error: 'Missing read credentials' });
    }
    const invoice = await invoices.getInvoice(uuid, hash, timestamp, signature);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    const status = await payments.readPaymentStatus(uuid);
    if (status?.paid) {
      return res.status(400).json({ error: 'This invoice has already been paid' });
    }
    const intent = await payments.createIntent(uuid, invoice.amountCents, invoice.currency || config.currency, invoice.creatorAddiePubKey);
    res.json(intent);
  } catch (err) {
    console.error('Error creating payment intent:', err);
    res.status(500).json({ error: 'Could not start payment' });
  }
});

// Trusts the client's confirmPayment() success callback, same model
// wiki-plugin-agora's purchase/complete uses — Addie exposes no server-side
// webhook/verification route to check against (confirmed this session).
// Acceptable for a personal invoicing tool; a known, documented limitation,
// not an oversight.
app.post('/pay/:uuid/complete', async (req, res) => {
  try {
    const { uuid } = req.params;
    const { hash, timestamp, signature } = req.body || {};
    if (!hash || !timestamp || !signature) {
      return res.status(400).json({ error: 'Missing read credentials' });
    }
    const invoice = await invoices.getInvoice(uuid, hash, timestamp, signature);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Captured BEFORE markPaid, so a retried /complete call for an invoice
    // that was already paid never re-triggers a payout — Addie's
    // process-connected-transfers has no idempotency guard of its own.
    const alreadyPaid = (await payments.readPaymentStatus(uuid))?.paid;
    const result = await payments.markPaid(uuid);

    if (!alreadyPaid && invoice.creatorAddiePubKey) {
      try {
        await payments.payOutCreator(uuid);
      } catch (err) {
        // The invoice is still correctly marked paid even if the payout
        // itself fails — worth surfacing/retrying manually, not a reason
        // to fail the payer's own confirmation.
        console.error(`Payout failed for invoice ${uuid}:`, err);
      }
    }

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error marking invoice paid:', err);
    res.status(500).json({ error: 'Could not record payment' });
  }
});

// Used by Gelder itself (not the payer's browser) to poll for online
// payment — eumachia owns this record, so no read credentials needed here.
app.get('/pay/:uuid/status', async (req, res) => {
  try {
    const status = await payments.readPaymentStatus(req.params.uuid);
    res.json(status || { paid: false });
  } catch (err) {
    console.error('Error reading payment status:', err);
    res.status(500).json({ error: 'Could not read payment status' });
  }
});

app.get('/health', (req, res) => {
  res.send({ status: 'healthy', service: 'eumachia', version: '0.0.1', timestamp: new Date().toISOString() });
});

// Same self-healing retry every other bundled service uses for its own
// bootstrap call (see bdo.js's `repeat`/`bootstrap`): this module finishes
// importing - including this very call - before netlify-gateway/services.js
// has run startAll() and bound bdo/addie's in-process ports, so the first
// attempt reliably loses that race with ECONNREFUSED. Without a retry here,
// bdoUuid/addieUuid stay null for the rest of that warm Lambda instance's
// life, silently breaking every /pay/:uuid route it serves afterward.
const retryBootstrap = () => setTimeout(bootstrapIdentity, 2000);

function bootstrapIdentity() {
  identity.ensureIdentity()
    .then(({ bdoUuid, addieUuid }) => {
      console.log(`eumachia identity ready (bdoUuid=${bdoUuid}, addieUuid=${addieUuid})`);
    })
    .catch((err) => {
      console.error('eumachia identity bootstrap failed, retrying in 2s:', err);
      retryBootstrap();
    });
}

bootstrapIdentity();

// Only bind a port when this file is run directly (`node eumachia.js`), e.g.
// on the droplet via pm2. When imported by the netlify-gateway bundle
// (services.js), that bundle's own startAll() binds the same `app` object
// itself — matching bdo.js's/addie.js's exact pattern, since eumachia is
// meant to be gateway-bundled the same way they are.
if (import.meta.url === `file://${process.argv[1]}`) {
  const PORT = config.port || 3011;
  app.listen(PORT, () => {
    console.log(`Eumachia listening on port ${PORT}`);
  });
}

export default app;
