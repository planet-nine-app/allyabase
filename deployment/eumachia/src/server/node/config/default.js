const SUBDOMAIN = process.env.SUBDOMAIN || 'dev';

// NOTE: intentionally NOT `https://${SUBDOMAIN}.bdo.allyabase.com/` etc, even
// though that's the convention every other allyabase service falls back to
// (see bdo.js's own fount.baseURL/continuebeeURL). Confirmed live: the
// dev.*.allyabase.com boxes for bdo/fount/addie currently serve a cert for
// `ninapbx.3cx.us`, so any request to them fails with
// ERR_TLS_CERT_ALTNAME_INVALID — this was silently breaking every real pay
// page (GET /pay/:uuid rethrows on this, which eumachia.js's route catch
// turns into "Something went wrong loading this invoice"), since whether
// LOCALHOST=true is actually set on the deployed Netlify site isn't
// something this service can verify or control. Falling back to the
// gateway's own public routes instead — the exact URLs Gelder itself
// already calls directly and that have been proven reliable all session —
// sidesteps that uncertainty entirely, at the cost of one extra HTTP hop
// through the gateway instead of a true in-process/localhost call even when
// LOCALHOST=true is in fact set correctly. Fine for this traffic volume.
const GATEWAY_URL = 'https://allyabase-gateway.netlify.app/';

export default {
  bdoBaseURL: process.env.BDO_BASE_URL || `${GATEWAY_URL}bdo/`,
  addieBaseURL: process.env.ADDIE_BASE_URL || `${GATEWAY_URL}addie/`,
  paymentsHash: 'eumachia-payments',
  currency: 'usd',
  stripeProcessor: 'stripe',
  port: process.env.PORT || 3011
};
