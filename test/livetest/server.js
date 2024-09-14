import express from 'express';
import sessionless from 'sessionless-node';
import allyabase from 'allyabase-js';
import cors from 'cors';
import { dirname } from 'path';
const fount = allyabase.fount;
const addie = allyabase.addie;

fount.baseURL = 'https://livetest.fount.allyabase.com/';
addie.baseURL = 'https://livetest.addie.allyabase.com/';

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
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log('got request');
        console.log(req.path);
  next();
});

app.put('/user/processor/stripe', async (req, res) => {
  const fountUUID = await fount.createUser(saveFountKeys, getFountKeys);
  const addieUUID = await addie.createUser(saveAddieKeys, getAddieKeys);
  const payload = req.body;

  const message = payload.timestamp + addieUUID;

  payload.signature = await sessionless.sign(message);

        console.log('sending', payload);

  try {
    const resp = await fetch(`https://livetest.addie.allyabase.com/user/${addieUUID}/processor/stripe`, {
      method: 'put',
      body: JSON.stringify(payload),
      headers: {'Content-Type': 'application/json'}
    });
    console.log(resp);

          const body = await resp.json();

    console.log(body);

    res.status = resp.status;
    res.send(body);

  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.use(express.static('./'));

app.listen(4000);
