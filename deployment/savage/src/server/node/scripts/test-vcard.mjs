import sessionless from 'sessionless-node';

const BASE_URL = process.argv[2] || 'http://localhost:8080';
const BDO_URL = `${BASE_URL}/bdo`;
const SAVAGE_URL = `${BASE_URL}/savage`;

let keys = null;
await sessionless.generateKeys((k) => { keys = k; }, () => keys);

const hash = 'vcard-test-hash';
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><circle cx="100" cy="100" r="80" fill="tomato"/></svg>';
const vcard = 'BEGIN:VCARD\nVERSION:3.0\nFN:Test Person\nTEL:+15551234567\nEND:VCARD';

const createTimestamp = Date.now().toString();
const createPayload = {
  timestamp: createTimestamp,
  pubKey: keys.pubKey,
  hash,
  bdo: { title: 'Test Person', svg, vcard },
  signature: await sessionless.sign(createTimestamp + keys.pubKey + hash),
};
const createRes = await fetch(`${BDO_URL}/user/create`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(createPayload),
});
const { uuid } = await createRes.json();
console.log('created BDO with svg+vcard ->', createRes.status, uuid);

const getTimestamp = Date.now().toString();
const signature = await sessionless.sign(getTimestamp + uuid + hash);
const qs = new URLSearchParams({ timestamp: getTimestamp, hash, signature }).toString();

// Main HTML route - should include a Save Contact link now
const htmlRes = await fetch(`${SAVAGE_URL}/user/${uuid}/bdo?${qs}`);
const html = await htmlRes.text();
const vcardUrl = html.match(/href="([^"]+bdo\/vcard[^"]*)"/)?.[1];
console.log('\n--- HTML route ---');
console.log('status:', htmlRes.status);
console.log('has Save Contact link:', !!vcardUrl);
console.log('vcard link ->', vcardUrl);

// Direct vcard route
const vcardRes = await fetch(`${SAVAGE_URL}/user/${uuid}/bdo/vcard?${qs}`);
const vcardBody = await vcardRes.text();
console.log('\n--- vcard route ---');
console.log('status:', vcardRes.status);
console.log('content-type:', vcardRes.headers.get('content-type'));
console.log('content-disposition:', vcardRes.headers.get('content-disposition'));
console.log('content matches:', vcardBody === vcard);

// Fetch the exact vcard link found in the HTML
if (vcardUrl) {
  const linkedRes = await fetch(vcardUrl);
  console.log('\n--- fetching the exact link found in HTML ---');
  console.log('status:', linkedRes.status);
  console.log('matches:', (await linkedRes.text()) === vcard);
}

// BDO with svg but no vcard - should have no Save Contact link
const createTimestamp2 = Date.now().toString();
const createPayload2 = {
  timestamp: createTimestamp2,
  pubKey: keys.pubKey,
  hash: 'no-vcard-hash',
  bdo: { title: 'No Vcard', svg },
  signature: await sessionless.sign(createTimestamp2 + keys.pubKey + 'no-vcard-hash'),
};
const createRes2 = await fetch(`${BDO_URL}/user/create`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(createPayload2),
});
const { uuid: uuid2 } = await createRes2.json();
const ts2 = Date.now().toString();
const sig2 = await sessionless.sign(ts2 + uuid2 + 'no-vcard-hash');
const qs2 = new URLSearchParams({ timestamp: ts2, hash: 'no-vcard-hash', signature: sig2 }).toString();
const htmlRes2 = await fetch(`${SAVAGE_URL}/user/${uuid2}/bdo?${qs2}`);
const html2 = await htmlRes2.text();
console.log('\n--- BDO with svg but no vcard ---');
console.log('has Save Contact link (should be false):', html2.includes('Save Contact'));

const vcardRes2 = await fetch(`${SAVAGE_URL}/user/${uuid2}/bdo/vcard?${qs2}`);
console.log('vcard route on svg-only BDO -> status', vcardRes2.status, '(should be 404)');
