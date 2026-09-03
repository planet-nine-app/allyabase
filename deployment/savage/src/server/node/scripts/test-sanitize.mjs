import sessionless from 'sessionless-node';

const BASE_URL = process.argv[2] || 'http://localhost:8080';
const BDO_URL = `${BASE_URL}/bdo`;
const SAVAGE_URL = `${BASE_URL}/savage`;

let keys = null;
await sessionless.generateKeys((k) => { keys = k; }, () => keys);

const hash = 'sanitize-test-hash';
const maliciousSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" onload="alert(1)"><script>alert(document.cookie)</script><circle cx="100" cy="100" r="80" fill="tomato" onclick="alert(2)"/><a href="javascript:alert(3)"><rect width="10" height="10"/></a></svg>';

const createTimestamp = Date.now().toString();
const createPayload = {
  timestamp: createTimestamp,
  pubKey: keys.pubKey,
  hash,
  bdo: { title: 'Malicious SVG Test', svg: maliciousSvg },
  signature: await sessionless.sign(createTimestamp + keys.pubKey + hash),
};
const createRes = await fetch(`${BDO_URL}/user/create`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(createPayload),
});
const { uuid } = await createRes.json();
console.log('created BDO with malicious svg ->', createRes.status, uuid);

const getTimestamp = Date.now().toString();
const signature = await sessionless.sign(getTimestamp + uuid + hash);
const qs = new URLSearchParams({ timestamp: getTimestamp, hash, signature }).toString();

const svgRes = await fetch(`${SAVAGE_URL}/user/${uuid}/bdo/svg?${qs}`);
const sanitized = await svgRes.text();
console.log('\nsanitized svg output:');
console.log(sanitized);

console.log('\n--- checks ---');
console.log('script tag stripped:', !sanitized.includes('<script>'));
console.log('onload attr stripped:', !sanitized.includes('onload'));
console.log('onclick attr stripped:', !sanitized.includes('onclick'));
console.log('javascript: href stripped (element removed):', !sanitized.includes('javascript:alert'));
console.log('circle still present (legit content preserved):', sanitized.includes('<circle'));
