import bdo from 'bdo-js';
import addie from 'addie-js';
import config from '../../config/local.js';
import identity from '../identity/identity.js';

bdo.baseURL = config.bdoBaseURL;
addie.baseURL = config.addieBaseURL;

// Real amount, read server-side from the invoice — never trust a
// client-supplied amount for what to charge. When `merchantPubKey` is
// present (the invoice creator has connected Stripe), requests a 91%/
// 9%-minus-fees split via Addie's buildPayeeMetadata; Addie only embeds
// this into the PaymentIntent's metadata at this point — it does NOT
// transfer anything yet, so simply loading the pay page can never move
// real money. The actual transfer only happens later, via payOutCreator,
// after independently re-verifying the payment succeeded.
async function requestPaymentIntent(amountCents, currency, merchant) {
  identity.claimIdentity();
  const uuid = identity.getAddieUuid();
  const intent = await addie.getPaymentIntent(uuid, config.stripeProcessor, amountCents, currency, [], merchant);
  if (!intent || intent.error) {
    const message = intent?.error?.raw?.message || intent?.error?.message || intent?.error || 'Addie returned no payment intent';
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }
  return intent;
}

async function createIntent(invoiceUuid, amountCents, currency, merchantPubKey) {
  const merchant = merchantPubKey ? { pubKey: merchantPubKey } : null;
  let intent;
  try {
    intent = await requestPaymentIntent(amountCents, currency, merchant);
  } catch (err) {
    // Addie's "unknown uuid" error is generically unhelpful (see the
    // documented `{error: err}` -> `{}` bug in addie.js's own catch
    // blocks), so this can't reliably distinguish "cached identity is
    // stale" from any other failure by message alone. Re-minting and
    // retrying once is cheap and safe here (see resetIdentity's doc
    // comment on why, unlike Gelder's owner-facing identity) — a genuine
    // unrelated failure (Stripe down, bad amount, etc.) will just fail the
    // same way again on the retry and surface normally.
    console.error(`createIntent failed with cached identity, re-minting and retrying once: ${err}`);
    await identity.resetIdentity();
    await identity.ensureIdentity();
    intent = await requestPaymentIntent(amountCents, currency, merchant);
  }
  // addie-js's field naming is a direct passthrough of Addie's own
  // (misleadingly-named) response: `paymentIntent` holds the Stripe
  // clientSecret string, not a PaymentIntent object. Stripe's client secret
  // has the well-known format `{paymentIntentId}_secret_{secret}` — the raw
  // ID is what process-connected-transfers is keyed by, so it's extracted
  // and persisted here rather than trusted from the client later.
  const paymentIntentId = (intent.paymentIntent || '').split('_secret_')[0];

  identity.claimIdentity();
  const record = await bdo.getBDO(identity.getBdoUuid(), config.paymentsHash);
  const payments = record?.bdo?.payments || {};
  payments[invoiceUuid] = { ...(payments[invoiceUuid] || {}), paid: false, paymentIntentId };
  identity.claimIdentity();
  await bdo.updateBDO(identity.getBdoUuid(), config.paymentsHash, { payments }, false);

  return { clientSecret: intent.paymentIntent, publishableKey: intent.publishableKey };
}

// eumachia owns this record (created once at identity bootstrap) — a plain
// map of invoice uuid -> {paid, paidAt}, read/written with eumachia's own
// signing key, never Gelder's or the invoice's. This is the read-modify-
// write pattern already accepted for idothis's shared directory this
// session, with the same known race window on genuinely concurrent writes;
// acceptable here for the same reason (personal-tool scale, not a
// high-stakes ledger).
async function readPaymentStatus(invoiceUuid) {
  identity.claimIdentity();
  const record = await bdo.getBDO(identity.getBdoUuid(), config.paymentsHash);
  const payments = record?.bdo?.payments || {};
  return payments[invoiceUuid] || null;
}

async function markPaid(invoiceUuid) {
  identity.claimIdentity();
  const record = await bdo.getBDO(identity.getBdoUuid(), config.paymentsHash);
  const payments = record?.bdo?.payments || {};
  payments[invoiceUuid] = { ...(payments[invoiceUuid] || {}), paid: true, paidAt: Date.now() };
  identity.claimIdentity();
  await bdo.updateBDO(identity.getBdoUuid(), config.paymentsHash, { payments }, false);
  return payments[invoiceUuid];
}

// Re-verifies with Stripe (via Addie) that the underlying PaymentIntent
// actually succeeded before transferring anything — never trusts the
// client's confirmPayment() callback on its own for moving real money.
// Callers are responsible for only invoking this once per invoice (see the
// double-processing guard in eumachia.js's /pay/:uuid/complete route) —
// Addie's process-connected-transfers route has no idempotency guard of
// its own, confirmed by reading its implementation.
async function payOutCreator(invoiceUuid) {
  identity.claimIdentity();
  const record = await bdo.getBDO(identity.getBdoUuid(), config.paymentsHash);
  const payments = record?.bdo?.payments || {};
  const paymentIntentId = payments[invoiceUuid]?.paymentIntentId;
  if (!paymentIntentId) return null;
  identity.claimIdentity();
  return await addie.processConnectedTransfers(paymentIntentId);
}

export default { createIntent, readPaymentStatus, markPaid, payOutCreator };
