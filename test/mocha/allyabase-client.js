import { should } from 'chai';
should();
import sessionless from 'sessionless-node';
import superAgent from 'superagent';
import allyabase from 'allyabase-js';
const { addie, bdo, castSpell, continuebee, fount, joan, julia, pref } = allyabase;

addie.baseURL = 'http://127.0.0.1:3005/';
bdo.baseURL = 'http://127.0.0.1:3003/';
continuebee.baseURL = 'http://127.0.0.1:2999/';
fount.baseURL = 'http://127.0.0.1:3006/';
joan.baseURL = 'http://127.0.0.1:3004/';
julia.baseURL = 'http://127.0.0.1:3000/';
pref.baseURL = 'http://127.0.0.1:3002/';

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
let hash = 'testhash';

it('should cast joinup', async () => {
  // So the question is, should the client know about spells outside of connecting to the system at all. 
  // Here we give that a try, but the commented out code below would be a way of getting a spellbook
  // with how things are setup currently

/*  keys = await sessionless.generateKeys((k) => { keysToReturn = k; }, () => {return keysToReturn;});
  savedUser.bdoUUID = await bdo.createUser(hash, {}, () => {}, () => {return keysToReturn});

  const { fountUUID = uuid, fountPubKey = pubKey } = await fount.createUser(() => {}, () => {return keysToReturn;});
  const spellbook = await bdo.getBDO(savedUser.bdoUUID, hash, fountPubKey);
*/

try {
  const res = await castSpell('joinup', 400, true, null, null, (k) => { keysToReturn = k; }, () => {return keysToReturn;});
  console.log(res);
  const body = await res.json();
  console.log('vvvvvvvvvvvvvvvvvvv');
  console.log(body);
  console.log('^^^^^^^^^^^^^^^^^^^');
} catch(err) {
console.warn('this is throwing', err);
}


});
