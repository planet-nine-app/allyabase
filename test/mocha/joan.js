import { should } from 'chai';
should();
import sessionless from 'sessionless-node';
import superAgent from 'superagent';
import { createHash } from 'crypto';

const baseURL = process.env.DEV ? 'https://dev.joan.allyabase.com/' : 'http://127.0.0.1:3004/';

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



const hash = createHash('sha256');
const hash2 = createHash('sha256');

hash.update('email@foo.bar:PASSWORD');
hash2.update('email@foo.bar:NEWPASSWORD');

const digest = hash.digest('hex');
const digest2 = hash2.digest('hex');

let savedUser = {};
let keys = {};

it('should register a user', async () => {
  keys = await sessionless.generateKeys(() => { return keys; }, () => {return keys;});
/*  keys = {
    privateKey: 'd6bfebeafa60e27114a40059a4fe82b3e7a1ddb3806cd5102691c3985d7fa591',
    pubKey: '03f60b3bf11552f5a0c7d6b52fcc415973d30b52ab1d74845f1b34ae8568a47b5f'
  };*/
  const payload = {
    timestamp: new Date().getTime() + '',
    pubKey: keys.pubKey,
    hash: digest
  };

  payload.signature = await sessionless.sign(payload.timestamp + payload.hash + payload.pubKey);

  const res = await put(`${baseURL}user/create`, payload);
  savedUser = res.body;
  res.body.uuid.length.should.equal(36);
});

it('should get uuid, and save new pubKey', async () => {
  const timestamp = new Date().getTime() + '';
  const hash = digest;

  const signature = await sessionless.sign(timestamp + hash);

  const res = await get(`${baseURL}user/${hash}?timestamp=${timestamp}&signature=${signature}`);
  res.status.should.equal(200);
});

it('should update hash', async () => {
  const timestamp = new Date().getTime() + '';
  const uuid = savedUser.uuid;
  const hash = digest;
  const newHash = digest2;

  const signature = await sessionless.sign(timestamp + uuid + hash + newHash);
  const payload = {timestamp, uuid, hash, newHash, signature};


  const res = await put(`${baseURL}user/${uuid}/update-hash`, payload);
  res.status.should.equal(202);
});

it('should delete a user', async () => {
  const timestamp = new Date().getTime() + '';
  const uuid = savedUser.uuid;
  const hash = digest2;

  const signature = await sessionless.sign(timestamp + uuid + hash);
  const payload = {timestamp, uuid, hash, signature};


  const res = await _delete(`${baseURL}user/${uuid}`, payload);
  res.status.should.equal(200);
});
