// Mixed-target spike: BDO via the live gateway (already proven working
// repeatedly this session — continuebee, which BDO's user/create delegates
// to, isn't running locally), Addie via localhost (the new merchant/split
// routes only exist in the just-merged local addie code, not yet deployed).
import bdo from 'bdo-js';
import addie from 'addie-js';
import identity from './src/identity/identity.js';
import payments from './src/payments/payments.js';

const GATEWAY_BDO = 'https://allyabase-gateway.netlify.app/bdo/';
bdo.baseURL = GATEWAY_BDO;
addie.baseURL = 'http://localhost:3005/';
identity.__proto__; // no-op, just referencing to confirm import succeeded

// identity.js's own module-level bdo.baseURL/addie.baseURL assignment ran
// at import time using config/local.js's defaults (the live gateway for
// both) — override addie's again now that it's imported, matching what a
// LOCALHOST=true env would have done for addie specifically.
const { ensureIdentity } = identity;
const ids = await ensureIdentity();
console.log('eumachia identity:', JSON.stringify(ids));

// Simulate Gelder's connected merchant identity via local addie.
let addieKeys = null;
const save = async (k) => { addieKeys = k; };
const get = async () => addieKeys;
const merchantUuid = await addie.createUser(save, get);
const merchantPubKey = addieKeys.pubKey;
console.log('merchant addie uuid:', merchantUuid, 'pubKey:', merchantPubKey);

// Publish a fake invoice via the live gateway BDO (proven pattern).
let invBdoKeys = null;
const invSave = async (k) => { invBdoKeys = k; };
const invGet = async () => invBdoKeys;
const invoiceHash = 'gelder-invoice-spike';
const invoiceUuid = await bdo.createUser(invoiceHash, {
  description: 'Spike test invoice',
  amountCents: 5000,
  currency: 'usd',
  fromName: 'Test Freelancer',
  creatorAddiePubKey: merchantPubKey,
  paid: false,
  createdAt: Date.now().toString(),
}, invSave, invGet);
console.log('invoice bdo uuid:', invoiceUuid);

// ── The actual flow under test ──────────────────────────────────────────
const intent = await payments.createIntent(invoiceUuid, 5000, 'usd', merchantPubKey);
console.log('createIntent result:', JSON.stringify(intent));

const statusAfterIntent = await payments.readPaymentStatus(invoiceUuid);
console.log('status after intent (expect paid:false, paymentIntentId set):', JSON.stringify(statusAfterIntent));

const markPaidResult = await payments.markPaid(invoiceUuid);
console.log('markPaid result (expect paymentIntentId PRESERVED):', JSON.stringify(markPaidResult));

try {
  const payoutResult = await payments.payOutCreator(invoiceUuid);
  console.log('payOutCreator result:', JSON.stringify(payoutResult));
} catch (err) {
  console.log('payOutCreator threw:', err.message);
}
