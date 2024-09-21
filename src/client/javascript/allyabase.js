import continuebee from 'continuebee-js';
import addie from 'addie-js';
import bdo from 'bdo-js';
import pref from 'pn-pref-js';
import joan from 'joan-js';
import julia from 'julia-js';
import fount from 'fount-js';

const castSpell = async (spellName, totalCost, mp, _bdoUUID, _fountUUID, saveKeys, getKeys) => {
  const bdoUUID = _bdoUUID ? _bdoUUID : (await bdo.createUser(saveKeys, getKeys));
  const spellbooks = await bdo.getSpellbooks();
  const spellbook = spellbooks.filter(spellbook => spellbook[spellName]);
  if(spellbook.length < 1) {
    throw new Error('spell not found');
  }
  const spell = spellbook[spellName];

  const fountUser = _fountUUID ? (await fount.getUserByUUID(_fountUUID)) : (await fount.createUser(saveKeys, getKeys));

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

  const res = await fetch(spell.destinations[0].stopURL + '/' + spellName, {
    method: 'post',
    body: JSON.stringify(payload),
    headers: {'Content-Type': 'application/json'}
  });
  console.log(res);
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
