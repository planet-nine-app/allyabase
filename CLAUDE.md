# Allyabase - Planet Nine Ecosystem

## Overview

Allyabase is the foundational ecosystem for Planet Nine, providing a complete microservices architecture with federated wiki integration, sessionless authentication, and MAGIC protocol support.

**Location**: `/allyabase/`

## Core Architecture

### 🌐 **Federated Wiki Proxy Routing (November 2025)**

Allyabase now supports routing all service traffic through Federated Wiki as a single entry point, matching production architecture.

#### Wiki Plugin: wiki-plugin-allyabase
**Location**: `/src/wiki/wiki-plugin-allyabase/`

The wiki plugin provides:
- **Service Proxy Routes**: All microservices accessible via `/plugin/allyabase/{service}/*`
- **Feed Management**: Dolores feed subscriptions
- **Inventory System**: BDO-based inventory management
- **Deployment Tools**: Service deployment and configuration

#### Proxy Route Mapping

All Planet Nine services are accessible through the wiki proxy:

```
/plugin/allyabase/julia/*        → julia:3000
/plugin/allyabase/continuebee/*  → continuebee:2999
/plugin/allyabase/pref/*         → pref:3002
/plugin/allyabase/bdo/*          → bdo:3003
/plugin/allyabase/joan/*         → joan:3004
/plugin/allyabase/addie/*        → addie:3005
/plugin/allyabase/fount/*        → fount:3006
/plugin/allyabase/dolores/*      → dolores:3007
/plugin/allyabase/minnie/*       → minnie:2525
/plugin/allyabase/aretha/*       → aretha:7277
/plugin/allyabase/sanora/*       → sanora:7243
/plugin/allyabase/glyphenge/*    → glyphenge:3010
/plugin/allyabase/linkitylink/*  → glyphenge:3010 (alias)
```

#### Implementation Details

**Server-side Plugin Entry**: `/src/wiki/wiki-plugin-allyabase/index.js`
```javascript
module.exports = {
  server: require('./server/server.js')
};
```

**Proxy Route Handler**: `/src/wiki/wiki-plugin-allyabase/server/proxy.js`
- Handles all `/plugin/allyabase/{service}/*` routes
- Proxies HTTP requests to backend services
- Preserves method (GET, POST, PUT, DELETE)
- Forwards headers and body
- Returns responses transparently

### 🐳 **Docker Test Environment**

**Location**: `/deployment/docker/`

#### Flexible Multi-Base Architecture

The Docker setup supports running multiple isolated allyabase instances simultaneously:

**Scripts**:
- `spin-up-bases.sh` - Start 1-3 test bases with configurable options
- `Dockerfile-flexible` - Multi-service container image
- `start-with-ports.sh` - Service startup with dynamic port mapping

**Port Mapping** (Test Environment):
- Base 1: Host ports 5111-5125 → Docker internal ports
- Base 2: Host ports 5211-5225 → Docker internal ports
- Base 3: Host ports 5311-5325 → Docker internal ports

Each base includes:
- All 14 microservices
- Federated Wiki on port 3333 (mapped to 5x24)
- Glyphenge on port 3010 (mapped to 5x25)
- Wiki plugin with proxy routes enabled

#### Usage Examples

```bash
# Start 3 bases with clean rebuild
./spin-up-bases.sh --clean --build

# Start with seeding on Base 1
./spin-up-bases.sh --seed --seed-base=1

# Start with prof service enabled
./spin-up-bases.sh --enable-prof

# Test wiki proxy on Base 1
curl http://localhost:5124/plugin/allyabase/fount/health
```

### 📦 **Microservices**

**Location**: `/deployment/{service}/`

#### Core Services
1. **Fount** (3006) - Authentication and experience/nineum management
2. **BDO** (3003) - Big Dumb Object storage
3. **Joan** (3004) - Identity management
4. **Julia** (3000) - Messaging and coordination
5. **Pref** (3002) - User preferences
6. **Continuebee** (2999) - Session continuity

#### Application Services
7. **Addie** (3005) - AI assistant and payment processing
8. **Sanora** (7243) - E-commerce and product management
9. **Dolores** (3007) - Content discovery and feeds
10. **Aretha** (7277) - Ticket and access management
11. **Minnie** (2525) - Email service

#### Platform Services
13. **Glyphenge** (3010) - Server-side SVG rendering and link tapestries
14. **Prof** (3008) - Profile management (optional)

### 🔐 **Sessionless Authentication**

All services use cryptographic signature-based authentication:
- No passwords or sessions
- secp256k1 keypairs
- Message signing with timestamps
- Per-service authentication middleware

### ⚡ **MAGIC Protocol**

Cross-service operations coordinated through MAGIC spells:
- Centralized Fount authentication
- Multi-service workflows
- Experience granting
- Gateway rewards

See individual service CLAUDE.md files for available spells.

## Test Environment Configuration

### SDK Configuration

Client SDKs support test-wiki mode for wiki proxy routing:

**BDO SDK** (`bdo-js`):
```javascript
bdo.configure({
  env: 'test-wiki',
  base: 1  // Uses Base 1 wiki proxy (port 5124)
});
```

**Fount SDK** (`fount-js`):
```javascript
fount.configure({
  env: 'test-wiki',
  base: 2  // Uses Base 2 wiki proxy (port 5224)
});
```

**Addie SDK** (`addie-js`):
```javascript
addie.configure({
  env: 'test-wiki',
  base: 3  // Uses Base 3 wiki proxy (port 5324)
});
```

### iOS App Configuration

**Location**: `/the-advancement/src/The Advancement/Shared (App)/Configuration.swift`

Test-wiki environment available:
```swift
case testWiki
// Routes all service traffic through wiki proxy at localhost:5124
```

### Seeding Test Data

**Script**: `/deployment/docker/seed-ecosystem.js`

Supports multiple environments:
- `local` - Direct service access on localhost
- `test` - Docker container ports (51xx, 52xx, 53xx)
- `test-wiki` - Via wiki proxy routes

```bash
# Seed via wiki proxy
node seed-ecosystem.js test-wiki 1
```

## Local Development

### Sanora Store Testing

**Location**: `/sharon/tests/sanora/`

Tools for testing Sanora feed generation and serving:

**make-store.js**:
- Scans folder for artifacts (books, music, posts)
- Generates federated feeds (Libris, Canimus, Scribus)
- Starts HTTP server on port 8080
- Beautiful landing page with feed links

**serve-store.js**:
- Serves existing .store directory
- Fast restart without regenerating feeds
- Static file serving for artifacts

```bash
# Create and serve store
cd /path/to/artifacts
node /path/to/sharon/tests/sanora/make-store.js "My Store"

# Access at http://localhost:8080
# Feeds at http://localhost:8080/feeds/
```

**Note**: Store server (port 8080) is independent of wiki proxy (port 5124). Both can run simultaneously.

## Wiki Proxy Testing

### Manual Testing

```bash
# Start bases
cd /allyabase/deployment/docker
./spin-up-bases.sh --clean --build

# Test proxy routes (Base 1 on port 5124)
curl http://localhost:5124/plugin/allyabase/bdo/health
curl http://localhost:5124/plugin/allyabase/fount/resolve
curl -X POST http://localhost:5124/plugin/allyabase/julia/magic/spell/spellTest

# Test Base 2 (port 5224) and Base 3 (port 5324) similarly
```

### Sharon Integration Tests

**Location**: `/sharon/tests/`

Wiki proxy tests available in service-specific test suites. Configure test environment to use wiki proxy URLs.

## Production vs Test Architecture

### Production
- Single wiki instance serves all traffic
- Services on private network
- Wiki on public domain
- All access via `/plugin/allyabase/{service}/*`

### Test (Docker)
- 3 independent bases for parallel testing
- Each base has own wiki on 5x24
- Each base has complete service set
- Simulates production routing

### Local Development
- Services run directly on localhost
- Wiki optional
- Direct service access for debugging
- Store server for feed testing (port 8080)

## File Structure

```
allyabase/
├── src/
│   └── wiki/
│       └── wiki-plugin-allyabase/
│           ├── index.js              # Plugin entry point
│           ├── package.json
│           ├── client/               # Client-side MAGIC spells
│           └── server/
│               ├── server.js         # Server initialization
│               ├── proxy.js          # Service proxy routes
│               ├── feeds.js          # Dolores integration
│               ├── inventory.js      # BDO inventory system
│               └── deployment.js     # Deployment tools
├── deployment/
│   ├── docker/
│   │   ├── Dockerfile-flexible       # Multi-service container
│   │   ├── spin-up-bases.sh          # Multi-base orchestration
│   │   ├── start-with-ports.sh       # Service startup script
│   │   ├── seed-ecosystem.js         # Test data seeding
│   │   └── test-bases-config.json    # Port mappings
│   ├── addie/                        # Service deployment files
│   ├── aretha/
│   ├── bdo/
│   ├── continuebee/
│   ├── dolores/
│   ├── fount/
│   ├── joan/
│   ├── julia/
│   ├── minnie/
│   ├── pref/
│   ├── prof/
│   └── sanora/
└── CLAUDE.md                         # This file
```

## Recent Updates

### November 2025 - Wiki Proxy Routing
- ✅ Implemented complete wiki proxy routing infrastructure
- ✅ Created wiki-plugin-allyabase with service proxy support
- ✅ Updated Docker setup to install plugin from GitHub
- ✅ Added test-wiki environment to all SDK configurations
- ✅ Updated iOS Configuration.swift with test-wiki mode
- ✅ Verified proxy routes working in test environment

### Key Implementation Details
- Wiki plugin requires `index.js` entry point exporting server module
- Plugin installed via `cp -r` from GitHub clone into wiki's node_modules
- Proxy routes use http module for request forwarding
- All HTTP methods (GET, POST, PUT, DELETE) supported
- Headers and request bodies forwarded transparently

## Related Documentation

- Wiki Plugin: `/src/wiki/wiki-plugin-allyabase/README.md`
- Docker Setup: `/deployment/docker/README.md`
- Service Docs: `/deployment/{service}/CLAUDE.md`
- Sharon Tests: `/sharon/CLAUDE.md`
- Test Environment: `/deployment/docker/README-SEEDING.md`

## Last Updated
November 30, 2025 - Added comprehensive wiki proxy routing documentation and test environment configuration details.
