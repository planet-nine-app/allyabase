import { should } from 'chai';
should();
import sessionless from 'sessionless-node';
import superAgent from 'superagent';

const baseURL = process.env.DEV ? 'https://dev.pref.allyabase.com/' : 'http://127.0.0.1:3002/';

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

const hash = "hereisanexampleofahash";
let savedUser = {};
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
    hash,
    preferences: {
      foo: "bar",
      baz: "bop"
    }
  };

  payload.signature = await sessionless.sign(payload.timestamp + payload.pubKey + hash);

  const res = await put(`${baseURL}user/create`, payload);
console.log(res.body);
  savedUser = res.body;
  res.body.uuid.length.should.equal(36);
});

it('should update preferences', async () => {
  const timestamp = new Date().getTime() + '';
  const uuid = savedUser.uuid;

  const newPreferences = {
    foo: "bar",
    baz: "updated"
  };

  const signature = await sessionless.sign(timestamp + uuid + hash);
  const payload = {
    timestamp, 
    uuid, 
    hash, 
    preferences: newPreferences, 
    signature
  };

  const res = await put(`${baseURL}user/${savedUser.uuid}/preferences`, payload);
console.log(res.body);
  res.body.preferences.baz.should.equal("updated");
});

it('should get preferences', async () => {
  const timestamp = new Date().getTime() + '';
  const uuid = savedUser.uuid;

  const signature = await sessionless.sign(timestamp + uuid + hash);

  const res = await get(`${baseURL}user/${uuid}/preferences?timestamp=${timestamp}&signature=${signature}&hash=${hash}`);
console.log(res.body);
  res.body.preferences.baz.should.equal("updated");   
});

it('should update global preferences', async () => {
  const timestamp = new Date().getTime() + '';
  const uuid = savedUser.uuid;

  const newPreferences = {
    foo: "bar",
    baz: "updated"
  };

  const signature = await sessionless.sign(timestamp + uuid + hash);
  const payload = {
    timestamp, 
    uuid, 
    hash, 
    preferences: newPreferences, 
    signature
  };

  const res = await put(`${baseURL}user/${savedUser.uuid}/global/preferences`, payload);
console.log(res.body);
  res.body.preferences.baz.should.equal("updated");
});

it('should get global preferences', async () => {
  const timestamp = new Date().getTime() + '';
  const uuid = savedUser.uuid;

  const signature = await sessionless.sign(timestamp + uuid + hash);

  const res = await get(`${baseURL}user/${uuid}/global/preferences?timestamp=${timestamp}&signature=${signature}`);
console.log(res.body);
  res.body.preferences.baz.should.equal("updated");   
});

it('should delete a user', async () => {
  const timestamp = new Date().getTime() + '';
  const uuid = savedUser.uuid;

  const signature = await sessionless.sign(timestamp + uuid + hash);
  const payload = {timestamp, uuid, hash, signature};


  const res = await _delete(`${baseURL}user/delete`, payload);
console.log(res.body);
  res.status.should.equal(200);
});
