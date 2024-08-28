import { should } from 'chai';
should();
import sessionless from 'sessionless-node';
import superAgent from 'superagent';

const baseURL = 'http://127.0.0.1:3000/';
//const baseURL = 'https://juliaswitch.com/';

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
let keys2 = {};
let keysToReturn = {};
let savedPrompt = {};

it('should register a user', async () => {
  keys = await sessionless.generateKeys((k) => { keysToReturn = k; }, () => {return keysToReturn;});
/*  keys = {
    privateKey: 'd6bfebeafa60e27114a40059a4fe82b3e7a1ddb3806cd5102691c3985d7fa591',
    pubKey: '03f60b3bf11552f5a0c7d6b52fcc415973d30b52ab1d74845f1b34ae8568a47b5f'
  };*/
  const payload = {
    timestamp: new Date().getTime() + '',
    pubKey: keys.pubKey,
    user: {
      handle: 'foo',
      otherStuff: 'bar',
      pubKey: keys.pubKey
    }
  };

  payload.signature = await sessionless.sign(payload.timestamp + payload.pubKey);

  const res = await put(`${baseURL}user/create`, payload);
  savedUser = res.body;
  res.body.uuid.length.should.equal(36);
});

it('should create a second user', async () => {
  keys2 = await sessionless.generateKeys((k) => { keysToReturn = k; }, () => {return keysToReturn;});

  const payload = {
    timestamp: new Date().getTime() + '',
    pubKey: keys2.pubKey,
    user: {
      handle: 'foo',
      otherStuff: 'bar',
      pubKey: keys2.pubKey
    }
  };

  payload.signature = await sessionless.sign(payload.timestamp + payload.pubKey);

  const res = await put(`${baseURL}user/create`, payload);
  savedUser2 = res.body;
  res.body.uuid.length.should.equal(36);
console.log('savedUser2.uuid starts out as: ' + savedUser2.uuid);
});

it('should get a prompt', async () => {
  keysToReturn = keys;
  const timestamp = new Date().getTime() + '';
  const signature = await sessionless.sign(timestamp + savedUser.uuid);

  const res = await get(`${baseURL}user/${savedUser.uuid}/associate/prompt?timestamp=${timestamp}&signature=${signature}`);
console.log(res.body);
  savedPrompt = Object.keys(res.body.pendingPrompts).pop();
  savedPrompt.length.should.equal(4);
});

it('should post a signed prompt', async () => {
  keysToReturn = keys2;

console.log('savedUser2.uuid is: ' + savedUser2.uuid);
  const payload = {
    timestamp: new Date().getTime() + '',
    uuid: savedUser2.uuid,
    pubKey: keys2.pubKey,
    prompt: savedPrompt
  };

console.log('signed prompt message: ' + payload.timestamp + payload.uuid + payload.pubKey + payload.prompt);

  payload.signature = await sessionless.sign(payload.timestamp + payload.uuid + payload.pubKey + payload.prompt);

  const res = await post(`${baseURL}user/${savedUser2.uuid}/associate/signedPrompt`, payload);
  res.body.success.should.equal(true);
});

it('should get a user with a prompt', async () => {
  keysToReturn = keys;
  const timestamp = new Date().getTime() + '';
  const signature = await sessionless.sign(timestamp + savedUser.uuid);
  
  const res = await get(`${baseURL}user/${savedUser.uuid}?timestamp=${timestamp}&signature=${signature}`);
  savedUser = res.body;
console.log(savedUser.pendingPrompts);
console.log(savedUser.pendingPrompts[savedPrompt]);
  res.body.pendingPrompts[savedPrompt].newUUID.should.equal(savedUser2.uuid);
});

it('should associate two users', async () => {
  keysToReturn = keys;
  const payload = {
    timestamp: new Date().getTime() + '',
    newTimestamp: savedUser.pendingPrompts[savedPrompt].newTimestamp,
    newUUID: savedUser.pendingPrompts[savedPrompt].newUUID,
    newPubKey: savedUser.pendingPrompts[savedPrompt].newPubKey,
    prompt: savedPrompt,
    newSignature: savedUser.pendingPrompts[savedPrompt].newSignature
  };

console.log('new uuid ends up being: ' + payload.newUUID);

  const message = payload.newTimestamp + payload.newUUID + payload.newPubKey + payload.prompt;
console.log('associating user message: ' + message);
  payload.signature = await sessionless.sign(message);

  const res = await post(`${baseURL}user/${savedUser.uuid}/associate`, payload);
console.log(res.body);
  res.body.keys.interactingKeys[savedUser2.uuid].length.should.equal(66);
});

it('should send a message', async () => {
  keysToReturn = keys2;
  const payload = {
    timestamp: new Date().getTime() + '',
    senderUUID: savedUser2.uuid,
    receiverUUID: savedUser.uuid,
    message: 'Hello this is a message'
  };

  payload.signature = await sessionless.sign(payload.timestamp + payload.senderUUID + payload.receiverUUID + payload.message);

  const res = await post(`${baseURL}message`, payload);
console.log(`res from send message is`, res.body);
  res.body.success.should.equal(true);
});

it('should get messages', async () => {
  keysToReturn = keys;
  const timestamp = new Date().getTime() + '';
  const message = timestamp + savedUser.uuid;
  const signature = await sessionless.sign(message);

  const res = await get(`${baseURL}messages/user/${savedUser.uuid}?timestamp=${timestamp}&signature=${signature}`);
  res.body.messages.length.should.equal(1);
});

it('should delete association', async () => {
  const timestamp = new Date().getTime() + '';
  const associatedUUID = savedUser2.uuid;
  const message = timestamp + associatedUUID + savedUser.uuid;
  const signature = await sessionless.sign(message);
 
  const payload = {
    timestamp,
    signature
  };

  const res = await _delete(`${baseURL}associated/${savedUser2.uuid}/user/${savedUser.uuid}`, payload);
  const noKey = res.body.keys.interactingKeys[savedUser2.uuid] === undefined;
  noKey.should.equal(true);;
});

it('should delete a user', async () => {
  const timestamp = new Date().getTime() + '';
  const message = timestamp + savedUser.uuid;
  const signature = await sessionless.sign(message);

  const payload = {
    timestamp,
    signature
  };

  const res = await _delete(`${baseURL}user/${savedUser.uuid}`, payload);
  res.body.success.should.equal(true);
});

