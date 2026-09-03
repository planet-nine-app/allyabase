import express from 'express';
// removeJavaScript isn't exported from teleportation-js's main entry (that's
// safeTeleportationParser, a different feature - parsing signed <teleport>
// tags out of a fetched page). It's the internal helper that actually strips
// <script>/<noscript> tags, javascript:/data: URLs, CSS expression()
// injections, and on* event handler attributes - which is what a BDO's svg
// property (arbitrary content from whoever had a valid signature to write
// it) needs before being served back as live, browser-rendered markup.
import removeJavaScript from 'teleportation-js/src/node-remove-javascript.js';
// Node 18+ has a native global fetch - no need for the node-fetch package.

const app = express();

const SUBDOMAIN = process.env.SUBDOMAIN || 'dev';
const BDO_URL = process.env.LOCALHOST
  ? 'http://127.0.0.1:3003/'
  : `https://${SUBDOMAIN}.bdo.allyabase.com/`;

// When bundled behind the gateway, http-proxy-middleware's pathRewrite
// strips the /savage prefix before savage ever sees the request, and
// changeOrigin rewrites Host to the internal loopback target - so neither
// the real external path nor the real external host survive by default.
// gateway.js restores both per-request via x-forwarded-prefix/host/proto
// headers; standalone deployments have none of these set, which is correct
// since there's no prefix and req.get('host')/req.protocol are already real.
// Deployed on Netlify, the request passes through two proxy hops - Netlify's
// own edge layer (which already sets x-forwarded-proto/host), then our own
// gateway->savage hop (xfwd: true adds them again) - and forwarded headers
// get comma-appended across hops rather than overwritten, so a header can
// arrive as "https,https". The first value is always the original
// client-facing one, so that's the one to keep.
const firstForwarded = (value) => value ? value.split(',')[0].trim() : null;

const absoluteUrl = (req, path) => {
  const host = firstForwarded(req.get('x-forwarded-host')) || req.get('host');
  const proto = firstForwarded(req.get('x-forwarded-proto')) || req.protocol;
  const prefix = firstForwarded(req.get('x-forwarded-prefix')) || '';
  return `${proto}://${host}${prefix}${path}`;
};

const wrapHTML = (svg, imageUrl, title, vcardUrl) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta property="og:type" content="website">
<meta property="og:image" content="${imageUrl}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${imageUrl}">
</head>
<body style="margin:0; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; background:#111; gap:20px;">
${svg}
${vcardUrl ? `<a href="${vcardUrl}" style="font-family:sans-serif; font-size:15px; font-weight:bold; padding:12px 28px; background:#10b981; color:#111; border-radius:8px; text-decoration:none;">Save Contact</a>` : ''}
</body>
</html>`;

// JSDOM parses its input as a full document even when it's just an <svg>
// fragment, wrapping it in <html><head></head><body>...</body></html> - so
// after stripping, pull the sanitized <svg> element back out rather than
// returning the whole wrapper document.
const sanitizeSvg = (rawSvg) => {
  const dom = removeJavaScript(rawSvg);
  const svgEl = dom.window.document.querySelector('svg');
  return svgEl ? svgEl.outerHTML : null;
};

// Forwards whatever it's given straight through to BDO's own auth (the
// query string - timestamp/hash/signature/pubKey/emojicode - is exactly
// what GET /user/:uuid/bdo already expects), sanitizes the svg property
// (this is untrusted content - anyone with a valid signature for a given
// uuid can have written it), and returns the parsed bdo object.
const fetchBdo = async (uuid, query) => {
  const qs = new URLSearchParams(query).toString();
  const res = await fetch(`${BDO_URL}user/${uuid}/bdo${qs ? `?${qs}` : ''}`);

  if (!res.ok) {
    return { error: true, status: res.status, body: await res.text() };
  }

  const { bdo } = await res.json();

  if (bdo && bdo.svg) {
    bdo.svg = sanitizeSvg(bdo.svg);
  }

  return { error: false, bdo };
};

app.get('/user/:uuid/bdo/svg', async (req, res) => {
  const result = await fetchBdo(req.params.uuid, req.query);

  if (result.error) {
    return res.status(result.status).send(result.body);
  }

  if (!result.bdo || !result.bdo.svg) {
    return res.status(404).send('No svg property on this BDO');
  }

  res.set('Content-Type', 'image/svg+xml');
  res.send(result.bdo.svg);
});

// vCard text is plain contact data, not markup - it's served with
// Content-Type: text/vcard so browsers download it rather than render or
// execute it, so unlike bdo.svg it needs no sanitization pass.
app.get('/user/:uuid/bdo/vcard', async (req, res) => {
  const result = await fetchBdo(req.params.uuid, req.query);

  if (result.error) {
    return res.status(result.status).send(result.body);
  }

  if (!result.bdo || !result.bdo.vcard) {
    return res.status(404).send('No vcard property on this BDO');
  }

  const name = (result.bdo.name || result.bdo.title || 'contact').replace(/[^a-zA-Z0-9.-]/g, '_');
  res.set('Content-Type', 'text/vcard; charset=utf-8');
  res.set('Content-Disposition', `attachment; filename="${name}.vcf"`);
  res.send(result.bdo.vcard);
});

app.get('/user/:uuid/bdo', async (req, res) => {
  try {
    const result = await fetchBdo(req.params.uuid, req.query);

    if (result.error) {
      return res.status(result.status).send(result.body);
    }

    if (!result.bdo || !result.bdo.svg) {
      return res.status(404).send('No svg property on this BDO');
    }

    const qs = new URLSearchParams(req.query).toString();
    const imageUrl = absoluteUrl(req, `/user/${req.params.uuid}/bdo/svg${qs ? `?${qs}` : ''}`);
    const vcardUrl = result.bdo.vcard
      ? absoluteUrl(req, `/user/${req.params.uuid}/bdo/vcard${qs ? `?${qs}` : ''}`)
      : null;
    const title = result.bdo.title || result.bdo.name || 'savage';

    res.set('Content-Type', 'text/html');
    res.send(wrapHTML(result.bdo.svg, imageUrl, title, vcardUrl));
  } catch (err) {
    console.warn('savage error:', err);
    res.status(500).send('Internal error');
  }
});

// Only bind a port when this file is run directly (`node savage.js`, e.g. on
// the droplet). When imported by a Netlify Function, serverless-http drives
// the same Express `app` per-invocation instead.
if (import.meta.url === `file://${process.argv[1]}`) {
  const PORT = process.env.PORT || 3009;
  app.listen(PORT, () => console.log(`savage listening on ${PORT}`));
}

export default app;
