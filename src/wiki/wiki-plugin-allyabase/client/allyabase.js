let allyabaseUser;

async function post(url, payload) {
  return await fetch(url, {
    method: 'post',
    body: JSON.stringify(payload),
    headers: {'Content-Type': 'application/json'}
  });
};

function getPage($item) {
  return $item.parents('.page').data('data');
};

function getAllyabaseUser(item) {
  if(item.allyabaseUser) {
    return item.allyabaseUser;
  } else {
    return fetch('/plugin/allyabase/user').then(res => res.json());
  }
};

function addDeploymentControls($item, item) {
  const deploymentDiv = document.createElement('div');
  deploymentDiv.style.cssText = 'margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px;';

  const title = document.createElement('h3');
  title.textContent = '🚀 Deployment Controls';
  deploymentDiv.appendChild(title);

  // Token input
  const tokenLabel = document.createElement('label');
  tokenLabel.textContent = 'Deployment Token: ';
  tokenLabel.style.cssText = 'display: block; margin: 10px 0 5px 0;';

  const tokenInput = document.createElement('input');
  tokenInput.type = 'password';
  tokenInput.id = 'deployment-token';
  tokenInput.placeholder = 'Enter deployment token';
  tokenInput.style.cssText = 'width: 100%; padding: 5px; margin-bottom: 10px;';

  tokenLabel.appendChild(tokenInput);
  deploymentDiv.appendChild(tokenLabel);

  // Deploy button
  const deployButton = document.createElement('button');
  deployButton.textContent = '🚀 Deploy All Services';
  deployButton.style.cssText = 'padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;';

  // Status button
  const statusButton = document.createElement('button');
  statusButton.textContent = '📊 Check Status';
  statusButton.style.cssText = 'padding: 10px 20px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer;';

  // Output div
  const outputDiv = document.createElement('div');
  outputDiv.id = 'deployment-output';
  outputDiv.style.cssText = 'margin-top: 15px; padding: 10px; background: white; border: 1px solid #ddd; border-radius: 5px; font-family: monospace; font-size: 12px; max-height: 400px; overflow-y: auto; display: none;';

  // Deploy button handler
  deployButton.addEventListener('click', async () => {
    const token = tokenInput.value;
    if (!token) {
      alert('Please enter a deployment token');
      return;
    }

    deployButton.disabled = true;
    deployButton.textContent = '⏳ Deploying...';
    outputDiv.style.display = 'block';
    outputDiv.innerHTML = '<p>🚀 Starting deployment process...</p>';

    try {
      const response = await post('/plugin/allyabase/deploy', { token });
      const result = await response.json();

      if (result.success) {
        outputDiv.innerHTML = '<p style="color: green;">✅ Deployment completed successfully!</p>';
      } else {
        outputDiv.innerHTML = '<p style="color: orange;">⚠️ Deployment completed with some issues</p>';
      }

      // Show detailed results
      outputDiv.innerHTML += `<p><strong>Timestamp:</strong> ${result.timestamp}</p>`;

      for (const [service, serviceResult] of Object.entries(result.services)) {
        const color = serviceResult.errors.length > 0 ? 'red' : 'green';
        outputDiv.innerHTML += `
          <div style="margin: 10px 0; padding: 10px; border-left: 3px solid ${color};">
            <strong>${service}</strong><br/>
            Pulled: ${serviceResult.pulled ? '✅' : '❌'}<br/>
            Restarted: ${serviceResult.restarted ? '✅' : '❌'}<br/>
            ${serviceResult.errors.length > 0 ? `<span style="color: red;">Errors: ${serviceResult.errors.join(', ')}</span>` : ''}
          </div>
        `;
      }
    } catch (err) {
      outputDiv.innerHTML = `<p style="color: red;">❌ Deployment failed: ${err.message}</p>`;
    } finally {
      deployButton.disabled = false;
      deployButton.textContent = '🚀 Deploy All Services';
    }
  });

  // Status button handler
  statusButton.addEventListener('click', async () => {
    const token = tokenInput.value;
    if (!token) {
      alert('Please enter a deployment token');
      return;
    }

    statusButton.disabled = true;
    statusButton.textContent = '⏳ Checking...';
    outputDiv.style.display = 'block';
    outputDiv.innerHTML = '<p>📊 Checking service status...</p>';

    try {
      const response = await fetch(`/plugin/allyabase/deploy/status?token=${encodeURIComponent(token)}`);
      const result = await response.json();

      if (result.success) {
        outputDiv.innerHTML = '<p style="color: green;">✅ Status retrieved successfully!</p>';

        for (const [service, status] of Object.entries(result.services)) {
          outputDiv.innerHTML += `
            <div style="margin: 10px 0; padding: 10px; border-left: 3px solid #2196F3;">
              <strong>${service}</strong><br/>
              ${status.error ? `<span style="color: red;">Error: ${status.error}</span>` : `
                Commit: ${status.commit}<br/>
                Has Changes: ${status.hasChanges ? '⚠️ Yes' : '✅ No'}
              `}
            </div>
          `;
        }
      } else {
        outputDiv.innerHTML = `<p style="color: red;">❌ ${result.error}</p>`;
      }
    } catch (err) {
      outputDiv.innerHTML = `<p style="color: red;">❌ Failed to check status: ${err.message}</p>`;
    } finally {
      statusButton.disabled = false;
      statusButton.textContent = '📊 Check Status';
    }
  });

  deploymentDiv.appendChild(deployButton);
  deploymentDiv.appendChild(statusButton);
  deploymentDiv.appendChild(outputDiv);

  $item.append(deploymentDiv);
}

function showStartingUp($item, item) {
  $item.empty();

  const statusDiv = document.createElement('div');
  statusDiv.style.cssText = 'padding: 20px; text-align: center; color: #666;';
  statusDiv.innerHTML = `
    <p style="font-size: 1.1em;">⏳ Allyabase services are starting up...</p>
    <p style="font-size: 0.9em; color: #999;">This takes up to 20 seconds after the wiki restarts. The page will refresh automatically when ready.</p>
  `;
  $item.append(statusDiv);

  // Poll until ready, then re-emit
  const poll = setInterval(async () => {
    try {
      const res = await fetch('/plugin/allyabase/status');
      const json = await res.json();
      if (json.ready) {
        clearInterval(poll);
        emit($item, item);
      }
    } catch (e) {
      // still starting, keep polling
    }
  }, 3000);
}

function emit($item, item) {
  $item.empty(item);

  // Check if services are ready before trying to connect
  fetch('/plugin/allyabase/status')
    .then(res => res.json())
    .then(status => {
      if (status.startingUp) {
        showStartingUp($item, item);
        return;
      }

      const gettingUserDiv = document.createElement('div');
      gettingUserDiv.innerHTML = '<p>Getting your allyabase user, and signatures...</p>';
      $item.append(gettingUserDiv);

      // Show Stripe Connect setup prompt if the host hasn't completed onboarding
      fetch('/plugin/allyabase/get-paid')
        .then(res => {
          if (res.status === 204) {
            const stripeDiv = document.createElement('div');
            stripeDiv.style.cssText = 'margin: 16px 0; padding: 14px 16px; background: #fff8e1; border-left: 4px solid #f59e0b; border-radius: 4px; font-size: 14px;';
            stripeDiv.innerHTML =
              '<strong>⚠️ Stripe not connected</strong> — your allyabase host commission won\'t be collected until you complete Stripe Connect. ' +
              'Open <code>/plugin/allyabase/setup/stripe?token=YOUR_TOKEN</code> in your browser to finish setup.';
            $item.append(stripeDiv);
          }
        })
        .catch(() => {}); // non-fatal

      // Add deployment controls first (doesn't require user)
      addDeploymentControls($item, item);

      getAllyabaseUser(item)
        .then(_allyabaseUser => {
          allyabaseUser = _allyabaseUser;

          addExplainer();
          addFeeds();
          addContracts();
          addInventory();
        })
        .catch(err => console.warn('received an error emitting in contract plugin', err))
        .finally(() => {
          bind($item, item);
        });
    })
    .catch(() => {
      // If status endpoint is unreachable, fall through normally
      addDeploymentControls($item, item);
      getAllyabaseUser(item)
        .then(_allyabaseUser => {
          allyabaseUser = _allyabaseUser;
          addExplainer();
          addFeeds();
          addContracts();
          addInventory();
        })
        .catch(err => console.warn('received an error emitting in contract plugin', err))
        .finally(() => { bind($item, item); });
    });
};

function bind($item, item) {
};

if(window) {
  window.plugins['contract'] = {emit, bind};
}

export const contract = typeof window == 'undefined' ? { emit, bind } : undefined;
