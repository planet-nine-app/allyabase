import continuebee from 'continuebee-js';
import addie from 'addie-js';
import bdo from 'bdo-js';
import pref from 'pn-pref-js';
import joan from 'joan-js';
import julia from 'julia-js';
import fount from 'fount-js';
import sessionless from 'sessionless-node';

const castSpell = async (spellName, totalCost, mp, _bdoUUID, _fountUUID, saveKeys, getKeys) => {
  sessionless.getKeys = getKeys;
console.log(saveKeys);
console.log(getKeys);
  const bdoUUID = _bdoUUID ? _bdoUUID : (await bdo.createUser('spellbooks', {}, saveKeys, getKeys));
console.log(bdoUUID);
  const spellbooks = await bdo.getSpellbooks(bdoUUID, 'spellbooks');
console.log(spellbooks);
  if(!spellbooks || spellbooks.length < 1) {
    throw new Error('no spellbooks');
  }
  const spellbook = spellbooks.filter(spellbook => spellbook[spellName]).pop();
console.log('spellbook', spellbook);
  if(!spellbook) {
    throw new Error('spell not found');
  }
  const spell = spellbook[spellName];

  const fountUser = _fountUUID ? (await fount.getUserByUUID(_fountUUID)) : (await fount.createUser(saveKeys, getKeys));

console.log('fountUser', fountUser);
console.log('fountBaseURL', fount.baseURL);

  const payload = {
    timestamp: new Date().getTime() + '',
    spell: spellName,
    casterUUID: fountUser.uuid,
    totalCost,
    mp,
    ordinal: fountUser.ordinal
  };

  const message = payload.timestamp + spellName + payload.casterUUID + totalCost + mp + fountUser.ordinal;
  payload.casterSignature = await sessionless.sign(message);
  payload.gateways = [];
  payload.user = fountUser;

  const res = await fetch(spell.destinations[0].stopURL + spellName, {
    method: 'post',
    body: JSON.stringify(payload),
    headers: {'Content-Type': 'application/json'}
  });
  console.log(res);
  return res;
};

export default {
  continuebee,
  addie,
  bdo,
  pref,
  joan,
  julia,
  fount,
  castSpell
};
