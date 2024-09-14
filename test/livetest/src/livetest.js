const validate = (name, email, country) => {
  return email.split('@').pop().split('.').length === 2 && country.length === 2;
};

window.onload = async () => {
console.log('foo');
  const submitButton = document.getElementById('submitButton');
console.log(submitButton);

  submitButton.addEventListener('click', async () => {
    const name = document.getElementById('nameInput').value;
    const email = document.getElementById('email').value;
    const country = document.getElementById('country').value;
console.log('i\'ve been clicked');
    if(name && email && country) {
      if(validate(name, email, country)) {
        const payload = {
          timestamp: new Date().getTime() + '',
          country,
          name,
          email
        };

        try {
	  const res = await fetch(`http://localhost:4000/user/processor/stripe`, {
	    method: 'put',
	    body: JSON.stringify(payload),
	    headers: {'Content-Type': 'application/json'}
	  });

          const body = await res.json();
      
          if(res.status !== 200) {
            throw body;
          }
	 
	  const updatedUser = body;
	  const stripeAccountId = updatedUser.stripeAccountId;

          const addiePublicKey = updatedUser.pubKey;

          window.alert(`Thank you for registering! Please send the following three lines to planetnineisaspaceship:\naddie publicKey: ${addiePublicKey}\nstripe account id: ${stripeAccountId}\naddie uuid: ${updatedUser.uuid}`);
        } catch(err) {
          window.alert(`This error happened: ${JSON.stringify(err)}, you should send it to planetnineisaspaceship because he did not set up logging for this.`);
        }
      } else {
        window.alert('Please enter a valid email, and a two character country code');
      }
    } else {
      window.alert('Please fill out all fields');
    }
  });
};

