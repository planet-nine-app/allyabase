import express from 'express';
import sessionless from 'sessionless-node';
import allyabase from 'allyabase-js';
import { dirname } from 'path';
const fount = allyabase.fount;
const addie = allyabase.addie;

const myKeys = {};

const saveFountKeys = (keys) => {
  myKeys.fountKeys = keys;
};

const getFountKeys = () => {
  return myKeys.fountKeys;
};

const saveAddieKeys = (keys) => {
  myKeys.addieKeys = keys;
};

const getAddieKeys = () => {
  return myKeys.addieKeys;
};

const app = express();
app.use(express.json());

app.put('/user/processor/stripe', async (req, res) => {
  const fountUUID = await fount.createUser(saveFountKeys, getFountKeys);
  const addieUUID = await addie.createUser(saveAddieKeys, getAddieKeys);
  const payload = req.body;

  const message = payload.timestamp + addieUUID;

  payload.signature = await sessionless.sign(message);

  try {
    const resp = await fetch(`http://localhost:3005/user/${addieUUID}processor/stripe`, {
      method: 'put',
      body: JSON.stringify(payload),
      headers: {'Content-Type': 'application/json'}
    });

    res.send(resp.body);

  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.use(express.static('./'));

app.listen(4000);
