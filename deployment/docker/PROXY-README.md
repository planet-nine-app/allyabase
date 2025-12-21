# Allyabase Docker Proxy Server

## Overview

The proxy server provides wiki-style path routing for the allyabase Docker environment. It routes requests from `/plugin/allyabase/{service}/*` paths to direct service ports, enabling unified testing across both Docker and local environments.

## Purpose

This proxy allows tests to use consistent wiki-style URLs whether running against:
- **Docker environment**: Services accessible via proxy on port 5124 (Base 1), 5224 (Base 2), or 5324 (Base 3)
- **Local environment**: Services accessible via wiki plugin on federated wiki

## How It Works

The proxy intercepts requests matching the pattern `/plugin/allyabase/{service}/{path}` and forwards them to the appropriate service port:

```
/plugin/allyabase/bdo/health     → http://localhost:3003/health
/plugin/allyabase/sanora/classes → http://localhost:7243/classes
/plugin/allyabase/fount/resolve  → http://localhost:3006/resolve
```

## Service Port Mapping

```javascript
{
  'julia': 3000,
  'continuebee': 2999,
  'joan': 3004,
  'pref': 3002,
  'bdo': 3003,
  'fount': 3006,
  'addie': 3005,
  'aretha': 7277,
  'sanora': 7243,
  'dolores': 3007,
  'minnie': 2525,
  'covenant': 3011,
  'glyphenge': 3010,
  'linkitylink': 3010, // Alias for glyphenge
  'prof': 3008
}
```

All ports are adjusted by `PORT_OFFSET` when running in Docker multi-base mode.

## Usage

### Running Standalone (for testing)

```bash
cd /path/to/allyabase/deployment/docker
npm install
PROXY_PORT=5124 PORT_OFFSET=0 node proxy-server.js
```

### Running in Docker

The proxy starts automatically as part of the PM2 ecosystem when you start allyabase Docker:

```bash
cd /path/to/allyabase/deployment/docker
./spin-up-bases.sh --bases=1
```

- **Base 1**: Proxy on port 5124 (PORT_OFFSET=0)
- **Base 2**: Proxy on port 5224 (PORT_OFFSET=100)
- **Base 3**: Proxy on port 5324 (PORT_OFFSET=200)

### Testing the Proxy

```bash
# Test BDO health endpoint via proxy
curl http://localhost:5124/plugin/allyabase/bdo/health

# Test Sanora classes endpoint via proxy
curl http://localhost:5124/plugin/allyabase/sanora/classes

# Test Fount resolve endpoint via proxy
curl http://localhost:5124/plugin/allyabase/fount/resolve
```

## Integration with Tests

The Sawyer test suite in Sharon uses the proxy for consistent testing:

```javascript
// Tests automatically use Docker service URLs via proxy
const SAWYER_URL = 'http://localhost:3013';
const BDO_URL = 'http://localhost:5124/plugin/allyabase/bdo';
const SANORA_URL = 'http://localhost:5124/plugin/allyabase/sanora';
const FOUNT_URL = 'http://localhost:5124/plugin/allyabase/fount';
```

## Environment Variables

- `PROXY_PORT`: Port for the proxy server (default: 5124)
- `PORT_OFFSET`: Offset to add to all service ports (default: 0)

## Error Handling

The proxy provides helpful error messages:

**Unknown service**:
```json
{
  "success": false,
  "error": "Service not found",
  "service": "invalid-service",
  "availableServices": ["julia", "bdo", "fount", ...]
}
```

**Service unavailable**:
```json
{
  "success": false,
  "error": "Service unavailable",
  "message": "ECONNREFUSED"
}
```

## Files

- **proxy-server.js**: Main proxy server implementation
- **package.json**: Includes `http-proxy` dependency
- **start-with-ports.sh**: Starts proxy as part of PM2 ecosystem
- **Dockerfile-flexible**: Installs proxy dependencies

## Architecture

```
┌─────────────────────────────────────────┐
│         Test Suite (Sharon)              │
│                                          │
│  http://localhost:5124/plugin/           │
│         allyabase/bdo/health             │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Proxy Server (5124)              │
│                                          │
│  Pattern: /plugin/allyabase/{service}/*  │
│  Rewrites: /{path}                       │
│  Forwards to: localhost:{port}           │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         BDO Service (3003)               │
│                                          │
│  GET /health → {"status": "ok"}          │
└─────────────────────────────────────────┘
```

## Benefits

1. **Unified Testing**: Same URL pattern works in Docker and local environments
2. **Easy Switching**: Switch between Docker and local by changing base URL
3. **No Mock Data**: Tests use real services, no mocking required
4. **Consistent Behavior**: Production wiki plugin and Docker proxy work identically

## Last Updated

December 15, 2025 - Initial implementation of Docker proxy server for unified testing
