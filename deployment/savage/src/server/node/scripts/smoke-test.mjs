// Creates a BDO with an svg property, then verifies savage wraps it in HTML
// with a correctly-absolute, independently-fetchable og:image URL.
// Usage: node scripts/smoke-test.mjs [baseUrl]
// Defaults to the local gateway (LOCALHOST=true node gateway.js on :8080).
import sessionless from 'sessionless-node';

const BASE_URL = process.argv[2] || 'http://localhost:8080';
const BDO_URL = `${BASE_URL}/bdo`;
const SAVAGE_URL = `${BASE_URL}/savage`;

let keys = null;
await sessionless.generateKeys((k) => { keys = k; }, () => keys);

const hash = 'smoke-test-hash';
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><circle cx="100" cy="100" r="80" fill="tomato"/></svg>';

const createTimestamp = Date.now().toString();
const createPayload = {
  timestamp: createTimestamp,
  pubKey: keys.pubKey,
  hash,
  bdo: { title: 'Savage Smoke Test', svg },
  signature: await sessionless.sign(createTimestamp + keys.pubKey + hash),
};
const createRes = await fetch(`${BDO_URL}/user/create`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(createPayload),
});
const { uuid } = await createRes.json();
console.log('created BDO', uuid, '->', createRes.status);

const getTimestamp = Date.now().toString();
const signature = await sessionless.sign(getTimestamp + uuid + hash);
const qs = new URLSearchParams({ timestamp: getTimestamp, hash, signature }).toString();

const htmlRes = await fetch(`${SAVAGE_URL}/user/${uuid}/bdo?${qs}`);
const html = await htmlRes.text();
const imageUrl = html.match(/<meta property="og:image" content="([^"]+)">/)?.[1];
console.log('savage HTML ->', htmlRes.status, 'og:image ->', imageUrl);

const imgRes = await fetch(imageUrl);
const imgBody = await imgRes.text();
console.log('fetched og:image URL ->', imgRes.status, imgRes.headers.get('content-type'));

// Not a byte-exact comparison: savage runs every svg through
// removeJavaScript (see scripts/test-sanitize.mjs) even when there's
// nothing to strip, and jsdom's serializer normalizes markup along the way
// (e.g. self-closing <circle/> becomes <circle></circle>) - so check that
// the real content survived, not that the string is identical.
const contentPreserved = imgBody.includes('<circle') && imgBody.includes('fill="tomato"');
console.log('svg content preserved:', contentPreserved);

if (htmlRes.status !== 200 || imgRes.status !== 200 || !contentPreserved) {
  console.error('FAILED');
  process.exit(1);
}
console.log('OK');
