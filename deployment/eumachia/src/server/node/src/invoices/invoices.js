import fetch from 'node-fetch';
import config from '../../config/local.js';

// Gelder computes a pre-signed read URL once, the same way BizBuz/
// Linkitylink/idothis already compute their permanent savage share links
// this session (timestamp+uuid+hash, signed with the invoice's OWN key) —
// and hands the four pieces (uuid/hash/timestamp/signature) to eumachia via
// the pay-page URL. Eumachia isn't the record's owner and can't re-sign a
// fresh request for it, so it just forwards the exact signature Gelder
// already computed straight through to BDO's own `GET /user/:uuid/bdo`
// route, instead of using bdo-js's getBDO (which always signs with
// eumachia's OWN key — wrong key for reading someone else's record).
//
// Deliberately NOT using BDO's /emoji/:code public-read mechanism: it
// requires an emoji-containing URL path segment, and a real bug was found
// this session in the netlify-gateway's proxy layer (`ERR_UNESCAPED_CHARACTERS`
// from http-proxy-middleware when forwarding a path with multi-byte emoji)
// that breaks it when accessed through the gateway. uuid/hash/timestamp/
// signature are all plain ASCII, so this sidesteps that bug entirely.
async function getInvoice(uuid, hash, timestamp, signature) {
  const url = `${config.bdoBaseURL}user/${uuid}/bdo?timestamp=${encodeURIComponent(timestamp)}&hash=${encodeURIComponent(hash)}&signature=${encodeURIComponent(signature)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const invoice = data?.bdo;
  if (!invoice || typeof invoice.amountCents !== 'number' || !invoice.description) {
    return null;
  }
  return invoice;
}

export default { getInvoice };
