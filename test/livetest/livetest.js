const allyabase = require('allyabase-js');
const fount = allyabase.fount;
const addie = allyabase.addie;

const saveKeys = (keys) => {
  window.localStorage.setItem("keys", JSON.stringify(keys));
};

const getKeys = () => {
  const keyString = window.localStorage.getItem("keys");
  return JSON.parse(keyString);
};

window.onload = async () => {
  const uuid = await fount.createUser(saveKeys, getKeys);
  const submitButton = document.getElementById('submitButton');
  submitButton.onclick = () => {
    console.log('foo bar');
  };
};

