import { getStore } from '@netlify/blobs';

const storeName = 'eumachia';

const getBlobStore = () => {
  if (process.env.NETLIFY_BLOBS_CONTEXT) {
    // Running inside a real Netlify Function/Edge Function - siteID/token/
    // edgeURL are auto-populated into the environment by Netlify.
    return getStore(storeName);
  }

  // Local dev / CI: point at a local BlobsServer (see scripts/blobs-dev-server.js),
  // which implements the same protocol backed by the local filesystem.
  const edgeURL = process.env.BLOBS_LOCAL_URL;
  const token = process.env.BLOBS_LOCAL_TOKEN;

  if (!edgeURL || !token) {
    throw new Error(
      'No Netlify Blobs context found and BLOBS_LOCAL_URL/BLOBS_LOCAL_TOKEN are not set. ' +
      'Run scripts/blobs-dev-server.js for local development, or deploy as a Netlify Function.'
    );
  }

  return getStore({ name: storeName, edgeURL, token, siteID: 'local-dev-site' });
};

const set = async (key, value) => {
  const store = getBlobStore();
  await store.set(key, value);

  return true;
};

const get = async (key) => {
  const store = getBlobStore();
  const value = await store.get(key);

  return value;
};

const del = async (key) => {
  const store = getBlobStore();
  await store.delete(key);

  return true;
};

const createClient = () => {
  return {
    on: () => createClient,
  };
};

createClient.connect = () => {
  return {
    set,
    get,
    del
  };
};

export { createClient };
