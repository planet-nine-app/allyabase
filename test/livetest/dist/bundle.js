(()=>{"use strict";window.onload=async()=>{console.log("foo");const e=document.getElementById("submitButton");console.log(e),e.addEventListener("click",(async()=>{const e=document.getElementById("nameInput").value,t=document.getElementById("email").value,n=document.getElementById("country").value;if(console.log("i've been clicked"),e&&t&&n)if(((e,t,n)=>2===t.split("@").pop().split(".").length&&2===n.length)(0,t,n)){const o={timestamp:(new Date).getTime()+"",country:n,name:e,email:t};try{const e=await fetch("https://livetest.bdo.allyabase.com/user/processor/stripe",{method:"put",body:JSON.stringify(o),headers:{"Content-Type":"application/json"}}),t=await e.json();if(200!==e.status)throw t;const n=t,i=n.stripeAccountId,s=n.pubKey;window.alert(`Thank you for registering! Please send the following three lines to planetnineisaspaceship:\naddie publicKey: ${s}\nstripe account id: ${i}\naddie uuid: ${n.uuid}`)}catch(e){window.alert(`This error happened: ${JSON.stringify(e)}, you should send it to planetnineisaspaceship because he did not set up logging for this.`)}}else window.alert("Please enter a valid email, and a two character country code");else window.alert("Please fill out all fields")}))}})();