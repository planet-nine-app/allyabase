import { should } from 'chai';
should();
import sessionless from 'sessionless-node';
import superAgent from 'superagent';

const baseURL = process.env.DEV ? 'https://dev.fount.allyabase.com/' : 'http://127.0.0.1:3006/';

const get = async function(path) {
  console.info("Getting " + path);
  return await superAgent.get(path).set('Content-Type', 'application/json');
};

const put = async function(path, body) {
  console.info("Putting " + path);
  return await superAgent.put(path).send(body).set('Content-Type', 'application/json');
};

const post = async function(path, body) {
  console.info("Posting " + path);
console.log(body);
  return await superAgent.post(path).send(body).set('Content-Type', 'application/json');
};

const _delete = async function(path, body) {
  //console.info("deleting " + path);
  return await superAgent.delete(path).send(body).set('Content-Type', 'application/json');
};

let savedUser = {};
let savedUser2 = {};
let keys = {};
let keysToReturn = {};

it('should register a user', async () => {
  keys = await sessionless.generateKeys((k) => { keysToReturn = k; }, () => {return keysToReturn;});
/*  keys = {
    privateKey: 'd6bfebeafa60e27114a40059a4fe82b3e7a1ddb3806cd5102691c3985d7fa591',
    pubKey: '03f60b3bf11552f5a0c7d6b52fcc415973d30b52ab1d74845f1b34ae8568a47b5f'
  };*/
  const payload = {
    timestamp: new Date().getTime() + '',
    pubKey: keys.pubKey,
  };

  payload.signature = await sessionless.sign(payload.timestamp + payload.pubKey);

  const res = await put(`${baseURL}user/create`, payload);
console.log(res.body);
  savedUser = res.body;
  res.body.uuid.length.should.equal(36);
});

it('should register another user', async () => {
  const keys2 = await sessionless.generateKeys((k) => { keysToReturn = k; }, () => {return keysToReturn;});
/*  keys = {
    privateKey: 'd6bfebeafa60e27114a40059a4fe82b3e7a1ddb3806cd5102691c3985d7fa591',
    pubKey: '03f60b3bf11552f5a0c7d6b52fcc415973d30b52ab1d74845f1b34ae8568a47b5f'
  };*/
  const payload = {
    timestamp: new Date().getTime() + '',
    pubKey: keys2.pubKey,
  };

  payload.signature = await sessionless.sign(payload.timestamp + payload.pubKey);

  keysToReturn = keys;

  const res = await put(`${baseURL}user/create`, payload);
console.log(res.body);
  savedUser2 = res.body;
  res.body.uuid.length.should.equal(36);
});

it('should get user by uuid', async () => {
  const timestamp = new Date().getTime() + '';

  const message = timestamp + savedUser.uuid;

  const signature = await sessionless.sign(message);

  const res = await get(`${baseURL}user/${savedUser.uuid}?signature=${signature}&timestamp=${timestamp}`);
  savedUser = res.body;
  savedUser.uuid.length.should.equal(36);
}).timeout(60000);

it('should get user by public key', async () => {
  const timestamp = new Date().getTime() + '';
  
  const signature = await sessionless.sign(timestamp + savedUser.pubKey);

  const res = await get(`${baseURL}user/pubKey/${savedUser.pubKey}?timestamp=${timestamp}&signature=${signature}`);
  savedUser = res.body;
  savedUser.experience.should.not.equal(null);
});

it('should resolve a spell', async () => {
  const payload = {
    "timestamp": new Date().getTime() + '',
    "spell": "test",
    "casterUUID": savedUser.uuid,
    "totalCost": 400,
    "mp": 400,
    "ordinal": savedUser.ordinal,
    "gateways": []
  };

  const message = JSON.stringify({
    timestamp: payload.timestamp,
    spell: payload.spell,
    casterUUID: payload.casterUUID,
    totalCost: payload.totalCost,
    mp: payload.mp,
    ordinal: payload.ordinal,
  });
  
  payload.casterSignature = await sessionless.sign(message);

  const res = await post(`${baseURL}resolve`, payload);
  res.body.success.should.equal(true);
});

it('should grant experience', async () => {
  const payload = {
    timestamp: new Date().getTime(),
    destinationUUID: savedUser.uuid,
    amount: 200,
    description: "for testing"
  };

  const message = payload.timestamp + savedUser.uuid + payload.destinationUUID + payload.amount + payload.description;

  payload.signature = await sessionless.sign(message);
  
  const res = await post(`${baseURL}user/${savedUser.uuid}/grant`, payload);
});

it('should get a user\'s nineum', async () => {
  const timestamp = new Date().getTime() + '';
  
  const message = timestamp + savedUser.uuid;

  const signature = await sessionless.sign(message);

  const res = await get(`${baseURL}user/${savedUser.uuid}/nineum?timestamp=${timestamp}&signature=${signature}`);
  savedUser.nineum = res.body.nineum;
  res.body.nineum.length.should.equal(2);
});

it('should transfer nineum', async () => {
  const payload = {
    timestamp: new Date().getTime() + '',
    destinationUUID: savedUser2.uuid,
    nineumUniqueIds: savedUser.nineum,
    price: 0,
    currency: 'usd'
  };

  const message = payload.timestamp + savedUser.uuid + savedUser2.uuid + payload.nineumUniqueIds.join('') + payload.price + payload.currency;

  payload.signature = await sessionless.sign(message);

  const res = await post(`${baseURL}user/${savedUser.uuid}/transfer`, payload);
  res.body.nineumCount.should.equal(0);
});

it('should delete a user', async () => {
  const timestamp = new Date().getTime() + '';
  const uuid = savedUser.uuid;

  const signature = await sessionless.sign(timestamp + uuid);
  const payload = {timestamp, uuid, signature};


  const res = await _delete(`${baseURL}user/${uuid}`, payload);
console.log(res.body);
  res.status.should.equal(200);
});
