# Deployment Feature

The wiki-plugin-allyabase now includes a deployment management system that allows you to pull and restart all allyabase microservices from the federated wiki UI.

## Features

### 🚀 Deploy All Services
- Pulls latest code from git for all 12 microservices
- Restarts each service using PM2
- Shows detailed results for each service

### 📊 Check Status
- Shows current git commit for each service
- Indicates if there are uncommitted changes
- Helps verify deployment state

## Setup

### 1. Configure Deployment Token

Add a deployment token to your federated wiki startup:

```bash
wiki --security_type friends \
     --cookieSecret your-secret \
     --deployment_token "your-secure-token-here"
```

Or set it as an environment variable:

```bash
export DEPLOYMENT_TOKEN="your-secure-token-here"
wiki --security_type friends --cookieSecret your-secret
```

**Security Note**: Choose a strong, random token. This controls access to deployment operations.

### 2. Install PM2 (Optional but Recommended)

PM2 is used to restart services after deployment:

```bash
npm install -g pm2
```

Start your services with PM2:

```bash
# In each service directory
pm2 start npm --name "fount" -- start
pm2 start npm --name "bdo" -- start
# ... etc for all services
```

Or use the ecosystem file:

```bash
pm2 start ecosystem.config.js
```

## Usage

### In the Federated Wiki

1. **Add the plugin** to a page by dragging the "allyabase" plugin from the factory
2. **Enter your deployment token** in the password field
3. **Click "🚀 Deploy All Services"** to pull and restart all microservices
4. **Click "📊 Check Status"** to view current git status of all services

### Deployment Process

When you click "Deploy All Services", the system:

1. ✅ For each of the 12 microservices:
   - Runs `git pull` in the service directory
   - Attempts to restart the service with PM2
   - Records success/failure for each step

2. 📊 Shows results:
   - Green border = successful
   - Red border = errors occurred
   - Detailed output for each service

### Status Check

When you click "Check Status", the system shows:

- Current git commit hash
- Whether there are uncommitted changes
- Any errors accessing the repository

## Microservices Deployed

The following services are automatically deployed:

1. **fount** - User management and nineum
2. **bdo** - Big Data Object storage
4. **prof** - Profiles and data
5. **addie** - Payment processing
6. **julia** - Product management
7. **sanora** - Order processing
8. **dolores** - Data services
9. **joan** - Authorization
10. **pref** - Preferences
11. **aretha** - Authentication
12. **continuebee** - Continuous services

## API Endpoints

### POST /plugin/allyabase/deploy

Deploy all services.

**Request:**
```json
{
  "token": "your-deployment-token"
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2025-11-01T12:00:00.000Z",
  "services": {
    "fount": {
      "pulled": true,
      "restarted": true,
      "errors": [],
      "pullOutput": "Already up to date.",
      "restartOutput": "fount restarted"
    },
    // ... other services
  }
}
```

### GET /plugin/allyabase/deploy/status?token=your-token

Check deployment status.

**Response:**
```json
{
  "success": true,
  "services": {
    "fount": {
      "commit": "a1b2c3d",
      "hasChanges": false
    },
    // ... other services
  }
}
```

## Troubleshooting

### "Invalid deployment token"
- Verify you've set the `--deployment_token` argument or `DEPLOYMENT_TOKEN` environment variable
- Make sure you're entering the correct token in the UI

### "Deployment endpoint will be disabled"
- No deployment token was configured on server startup
- Add the token to your wiki startup command

### PM2 restart fails
- Services will still be pulled, but won't auto-restart
- Install PM2 globally: `npm install -g pm2`
- Or manually restart services after deployment

### Git pull fails
- Verify the paths in `deployment.js` match your setup
- Check file permissions for git operations
- Ensure no uncommitted changes blocking pulls

## Security Considerations

1. **Token Protection**: Keep your deployment token secret
2. **Access Control**: Only share the token with authorized deployers
3. **Audit Trail**: All deployment attempts are logged to console
4. **Environment Isolation**: Consider using different tokens for dev/staging/production

## Example PM2 Ecosystem File

Create `ecosystem.config.js` in your planet-nine directory:

```javascript
module.exports = {
  apps: [
    { name: 'fount', cwd: './fount/src/server/node', script: 'npm', args: 'start' },
    { name: 'bdo', cwd: './bdo/src/server/node', script: 'npm', args: 'start' },
    { name: 'prof', cwd: './prof/src/server/node', script: 'npm', args: 'start' },
    { name: 'addie', cwd: './addie/src/server/node', script: 'npm', args: 'start' },
    { name: 'julia', cwd: './julia/src/server/node', script: 'npm', args: 'start' },
    { name: 'sanora', cwd: './sanora/src/server/node', script: 'npm', args: 'start' },
    { name: 'dolores', cwd: './dolores/src/server/node', script: 'npm', args: 'start' },
    { name: 'joan', cwd: './joan/src/server/node', script: 'npm', args: 'start' },
    { name: 'pref', cwd: './pref/src/server/node', script: 'npm', args: 'start' },
    { name: 'aretha', cwd: './aretha/src/server/node', script: 'npm', args: 'start' },
    { name: 'continuebee', cwd: './continuebee/src/server/node', script: 'npm', args: 'start' }
  ]
};
```

Then start all services:
```bash
pm2 start ecosystem.config.js
```

## Future Enhancements

- [ ] Selective service deployment (deploy only specific services)
- [ ] Rollback capability
- [ ] Deployment history/audit log
- [ ] Webhook notifications (Slack, Discord, etc.)
- [ ] Health checks after restart
- [ ] Blue-green deployments
