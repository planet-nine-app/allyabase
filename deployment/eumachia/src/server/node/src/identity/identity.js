import sessionless from 'sessionless-node';
import bdo from 'bdo-js';
import addie from 'addie-js';
import config from '../../config/local.js';

bdo.baseURL = config.bdoBaseURL;
addie.baseURL = config.addieBaseURL;

// sessionless-node has no default persistence — every service brings its
// own saveKeys/getKeys (see bdo.js's own `global.keys` pattern, which we
// deliberately do NOT copy: that loses identity on every process restart,
// the exact bug found and fixed in idothis's sessionless usage this
// session). This used to persist to a flat JSON file via raw fs calls,
// which broke identity bootstrap outright once bundled as a Netlify
// Function — the filesystem there is read-only outside of /tmp (ENOENT on
// every mkdir), the same gotcha every other service in this repo already
// solved via a Blobs-backed persistence client. Ported to the identical
// client.js/client.netlify-blobs.js pattern db.js uses elsewhere, lazily
// resolved since esbuild's CJS bundle target doesn't support top-level await.
const IDENTITY_KEY = 'identity:eumachia';

const client = (async () => {
  const { createClient } = process.env.PERSISTENCE_BACKEND === 'netlify-blobs'
    ? await import('../persistence/client.netlify-blobs.js')
    : await import('../persistence/client.js');

  return createClient()
    .on('error', err => console.log('Client Error', err))
    .connect();
})();

async function readIdentity() {
  const stored = await (await client).get(IDENTITY_KEY);
  return stored ? JSON.parse(stored) : null;
}

async function writeIdentity(identity) {
  await (await client).set(IDENTITY_KEY, JSON.stringify(identity, null, 2));
}

// In-memory fast path for the current warm process — Netlify Blobs is NOT
// read-your-own-writes consistent within a single request: bdo-js/addie-js
// both call saveKeys(freshKeys) and then, milliseconds later in the same
// call, sign their request by invoking getKeys() again. A getKeys() that
// only ever re-reads from Blobs can and does lose that race, throwing
// "Cannot destructure property 'privateKey' of null" mid-mint (confirmed
// live this session). Caching here means getKeys() never depends on a
// same-process round-trip to Blobs having already propagated.
let cachedKeys = null;

const saveKeys = async (keys) => {
  // Never clobber a real, already-persisted identity with a throwaway
  // freshly-generated one — sessionless.generateKeys() always computes new
  // random keys unconditionally, this is what makes calling it again on an
  // already-bootstrapped install a safe no-op.
  const existing = await readIdentity();
  if (!existing) {
    cachedKeys = { privateKey: keys.privateKey, pubKey: keys.pubKey };
    await writeIdentity(cachedKeys);
  }
};

const getKeys = async () => {
  if (cachedKeys) return cachedKeys;
  const existing = await readIdentity();
  if (existing) cachedKeys = { privateKey: existing.privateKey, pubKey: existing.pubKey };
  return cachedKeys;
};

let bdoUuid = null;
let addieUuid = null;

// Idempotent: safe to call on every startup. First run creates eumachia's
// own identity AND its one payment-status BDO record (paymentsHash) in one
// call; every later run just re-registers the same persisted keys — it does
// NOT re-create the BDO record, because bdo.createUser's underlying PUT
// /user/create always overwrites whatever content it's given (confirmed
// against BDO's real route this session), which would silently wipe payment
// history on every restart if called unconditionally.
async function ensureIdentity() {
  const existing = await readIdentity();

  if (existing && existing.bdoUuid && existing.addieUuid) {
    await sessionless.generateKeys(saveKeys, getKeys);
    bdoUuid = existing.bdoUuid;
    addieUuid = existing.addieUuid;
    return { bdoUuid, addieUuid };
  }

  bdoUuid = await bdo.createUser(config.paymentsHash, { payments: {} }, saveKeys, getKeys);
  addieUuid = await addie.createUser(saveKeys, getKeys);

  // A partial mint (one of these silently returning null/undefined instead
  // of throwing — observed from addie.createUser live this session) must
  // NOT be cached as "ready": bootstrapIdentity()'s retry-on-throw loop is
  // the only thing that recovers from a failed mint, so a partial result
  // has to actually throw to reach it, rather than getting treated as a
  // usable identity with a broken field for the rest of this warm process.
  if (!bdoUuid || !addieUuid) {
    const failure = `bdoUuid=${bdoUuid || 'MISSING'}, addieUuid=${addieUuid || 'MISSING'}`;
    bdoUuid = null;
    addieUuid = null;
    throw new Error(`ensureIdentity: mint produced an incomplete identity (${failure})`);
  }

  const keys = await getKeys();
  await writeIdentity({ ...keys, bdoUuid, addieUuid });
  return { bdoUuid, addieUuid };
}

function getBdoUuid() { return bdoUuid; }
function getAddieUuid() { return addieUuid; }

// Clears the persisted identity so the next ensureIdentity() call mints a
// fresh one — used when a cached addieUuid/bdoUuid no longer resolves
// against the current addie/BDO backend (e.g. this identity was minted
// against a since-reset or since-swapped deployment). Safe to re-mint
// unconditionally here, unlike an owner-facing identity such as Gelder's
// own seller identity (see that fix's history): eumachia's identity is a
// throwaway buyer-of-record used only to construct a PaymentIntent, never
// connected to a real Stripe account or holding any state worth
// preserving, so losing it costs nothing.
async function resetIdentity() {
  await (await client).del(IDENTITY_KEY);
  cachedKeys = null;
  bdoUuid = null;
  addieUuid = null;
}

// netlify-gateway bundles 13+ independently-identitied services into one
// process, and sessionless-node keeps exactly ONE shared, mutable
// `getKeysFromDisk` slot for the whole module (see sessionless.js: `let
// getKeysFromDisk`, reassigned by whichever service last called
// generateKeys/registered a getKeys). Any bdo-js/addie-js call elsewhere in
// the bundle that does `sessionless.getKeys = someOtherServicesGetKeys`
// silently steals that slot. This is called synchronously (no await) right
// before every payments.js call that ends up inside sessionless.sign(), so
// eumachia reclaims the slot with its own keys immediately beforehand -
// nothing else runs on this single-threaded event loop between the
// reassignment and the read inside sign(), so this is race-free as long as
// every signing call site remembers to call it first.
function claimIdentity() {
  sessionless.getKeys = getKeys;
}

export default { ensureIdentity, getBdoUuid, getAddieUuid, claimIdentity, resetIdentity };
