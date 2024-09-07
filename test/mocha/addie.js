import { should } from 'chai';
should();
import sessionless from 'sessionless-node';
import superAgent from 'superagent';

const subdomain = process.env.SUBDOMAIN;

const baseURL = subdomain ? `https://${subdomain}.addie.allyabase.com/` : 'http://127.0.0.1:3005/';

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

/*
 * uncomment these tests once you have added a processor or two
 *
it('should put an account to a processor', async () => {
  const payload = {
    timestamp: new Date().getTime() + '',
    name: "Foo",
    email: "zach+" + (Math.floor(Math.random() * 100000)) + "@planetnine.app"
  };

  const message = payload.timestamp + savedUser.uuid;

  payload.signature = await sessionless.sign(message);

  const res = await put(`${baseURL}user/${savedUser.uuid}/processor/stripe`, payload);
  savedUser = res.body;
console.log('stripe account id', savedUser.stripeAccountId);
  savedUser.stripeAccountId.should.not.equal(null);
}).timeout(60000);

it('should get user with account id', async () => {
  const timestamp = new Date().getTime() + '';
  
  const signature = await sessionless.sign(timestamp + savedUser.uuid);

  const res = await get(`${baseURL}user/${savedUser.uuid}?timestamp=${timestamp}&signature=${signature}`);
  savedUser = res.body;
  savedUser.stripeAccountId.should.not.equal(null);
});

it('should get a payment intent', async () => {
  const payload = {
    timestamp: new Date().getTime() + '',
    amount: 2000,
    currency: 'USD',
    payees: []
  };

  const message = payload.timestamp + savedUser.uuid + payload.amount + payload.currency;

  payload.signature = await sessionless.sign(message);

  const res = await post(`${baseURL}user/${savedUser.uuid}/processor/stripe/intent`, payload);
  res.body.paymentIntent.should.not.equal(null);
});
*/

it('should delete a user', async () => {
  const timestamp = new Date().getTime() + '';
  const uuid = savedUser.uuid;

  const signature = await sessionless.sign(timestamp + uuid);
  const payload = {timestamp, uuid, signature};


  const res = await _delete(`${baseURL}user/${uuid}`, payload);
console.log(res.body);
  res.status.should.equal(200);
});
