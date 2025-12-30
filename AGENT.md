# Allyabase - Agent Context

## 🤖 Agent Guidelines

### Core Operating Principles
1. **Production-Ready Services**: All microservices must use real integrations and cryptographic authentication
2. **Wiki Proxy First**: In production and test environments, all service access goes through wiki proxy routes
3. **Multi-Base Testing**: Use the 3-base Docker architecture to test cross-base functionality
4. **Sessionless Authentication**: All services use secp256k1 signature-based auth (no passwords/sessions)
5. **Real Cryptography**: Use production-ready cryptographic implementations, no mocks

## Project Overview

Allyabase is the foundational microservices ecosystem for Planet Nine, providing 14+ backend services with federated wiki integration, sessionless authentication, and MAGIC protocol support. All services are accessible through a unified wiki proxy architecture that matches production deployment.

**Location**: `/allyabase/`

## Agent Capabilities

### What This Agent Can Help With

#### 1. Federated Wiki Proxy System
**Location**: `/src/wiki/wiki-plugin-allyabase/`

The wiki plugin (`wiki-plugin-allyabase`) provides single-entry-point access to all microservices:

**Proxy Routes** (all services accessible via `/plugin/allyabase/{service}/*`):
- `/plugin/allyabase/julia/*` → julia:3000 (P2P messaging)
- `/plugin/allyabase/continuebee/*` → continuebee:2999 (session continuity)
- `/plugin/allyabase/pref/*` → pref:3002 (preferences)
- `/plugin/allyabase/bdo/*` → bdo:3003 (object storage)
- `/plugin/allyabase/joan/*` → joan:3004 (identity)
- `/plugin/allyabase/addie/*` → addie:3005 (payments)
- `/plugin/allyabase/fount/*` → fount:3006 (auth & currency)
- `/plugin/allyabase/dolores/*` → dolores:3007 (feeds)
- `/plugin/allyabase/minnie/*` → minnie:2525 (email)
- `/plugin/allyabase/aretha/*` → aretha:7277 (tickets)
- `/plugin/allyabase/sanora/*` → sanora:7243 (e-commerce)
- `/plugin/allyabase/covenant/*` → covenant:3011 (contracts)
- `/plugin/allyabase/glyphenge/*` → glyphenge:3010 (SVG rendering)

**Plugin Capabilities**:
- Service proxy routing (all HTTP methods)
- Contract management (Covenant integration)
- Feed management (Dolores subscriptions)
- Inventory system (BDO-based)
- Deployment tools

#### 2. Docker Multi-Base Test Environment
**Location**: `/deployment/docker/`

**3-Base Architecture**: Run 1-3 isolated allyabase instances simultaneously for testing cross-base functionality.

**Port Mapping**:
- **Base 1**: Host ports 5111-5125 (wiki on 5124)
- **Base 2**: Host ports 5211-5225 (wiki on 5224)
- **Base 3**: Host ports 5311-5325 (wiki on 5324)

Each base includes all 14 microservices + federated wiki + glyphenge.

**Key Scripts**:
- `spin-up-bases.sh` - Start 1-3 bases with configurable options
- `Dockerfile-flexible` - Multi-service container image
- `start-with-ports.sh` - Dynamic port-mapped service startup
- `seed-ecosystem.js` - Test data seeding

#### 3. Microservices (14 Services)

**Core Services**:
1. **Fount** (3006) - Authentication, experience/nineum management, MAGIC coordination
2. **BDO** (3003) - Big Dumb Object storage with cryptographic signatures
3. **Joan** (3004) - Identity management and recovery
4. **Julia** (3000) - P2P messaging and coordination
5. **Pref** (3002) - User preferences
6. **Continuebee** (2999) - Session continuity

**Application Services**:
7. **Addie** (3005) - AI assistant and payment processing
8. **Sanora** (7243) - E-commerce, product management, feed generation
9. **Dolores** (3007) - Content discovery and social feeds
10. **Aretha** (7277) - Ticket and access management
11. **Covenant** (3011) - Contract management with SVG visualization
12. **Minnie** (2525) - Email service

**Platform Services**:
13. **Glyphenge** (3010) - Server-side SVG rendering and link tapestries
14. **Prof** (3008) - Profile management (optional)

#### 4. Authentication & Security

**Sessionless Authentication** (all services):
- secp256k1 keypairs (no passwords)
- Message signing with timestamps
- Per-service authentication middleware
- Cryptographic signature verification

**MAGIC Protocol**:
- Centralized Fount coordination
- Multi-service workflows
- Experience granting
- Gateway rewards
- Cross-service spell casting

## Development Tasks

### Starting the Docker Environment

```bash
# Start 3 bases with clean rebuild
cd /allyabase/deployment/docker
./spin-up-bases.sh --clean --build

# Start with seeding on Base 1
./spin-up-bases.sh --seed --seed-base=1

# Start with prof service enabled
./spin-up-bases.sh --enable-prof

# Start just Base 1 for quick testing
./spin-up-bases.sh --bases=1
```

### Testing Wiki Proxy Routes

```bash
# Test Base 1 (port 5124)
curl http://localhost:5124/plugin/allyabase/bdo/health
curl http://localhost:5124/plugin/allyabase/fount/resolve

# Test POST request to Julia
curl -X POST http://localhost:5124/plugin/allyabase/julia/magic/spell/spellTest

# Test Base 2 (port 5224) and Base 3 (port 5324) similarly
curl http://localhost:5224/plugin/allyabase/fount/health
curl http://localhost:5324/plugin/allyabase/bdo/health
```

### Seeding Test Data

```bash
# Seed via wiki proxy on Base 1
cd /allyabase/deployment/docker
node seed-ecosystem.js test-wiki 1

# Seed via direct port access (test environment)
node seed-ecosystem.js test 1

# Seed local development
node seed-ecosystem.js local
```

### Local Sanora Store Testing

```bash
# Create and serve Sanora store (port 8080)
cd /path/to/artifacts
node /path/to/sharon/tests/sanora/make-store.js "My Store"

# Access store at http://localhost:8080
# Feeds at http://localhost:8080/feeds/

# Serve existing store (fast restart)
node /path/to/sharon/tests/sanora/serve-store.js
```

### SDK Configuration Examples

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

```swift
case testWiki
// Routes all service traffic through wiki proxy at localhost:5124
```

## Project Context

### Architecture Comparison

**Production**:
- Single wiki instance serves all traffic
- Services on private network
- Wiki on public domain
- All access via `/plugin/allyabase/{service}/*`

**Test (Docker)**:
- 3 independent bases for parallel testing
- Each base has own wiki on 5x24 port
- Each base has complete service set
- Simulates production routing

**Local Development**:
- Services run directly on localhost
- Wiki optional
- Direct service access for debugging
- Store server for feed testing (port 8080)

### Environment Support

All SDKs and applications support:
- **`local`** - Direct service access on localhost
- **`test`** - Docker container ports (51xx, 52xx, 53xx)
- **`test-wiki`** - Via wiki proxy routes (5124, 5224, 5324)
- **`dev`** - Production dev servers

### File Structure

```
allyabase/
├── src/
│   └── wiki/
│       └── wiki-plugin-allyabase/
│           ├── index.js              # Plugin entry point
│           ├── client/               # Client-side MAGIC spells
│           └── server/
│               ├── server.js         # Server initialization
│               ├── proxy.js          # Service proxy routes
│               ├── contracts.js      # Covenant integration
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
│   └── {service}/                    # Individual service deployments
└── CLAUDE.md
```

## Agent Constraints

### What NOT to Do
1. **Never bypass wiki proxy in production/test environments** - Always use `/plugin/allyabase/{service}/*` routes
2. **Never use mock authentication** - All services require real secp256k1 signatures
3. **Never skip multi-base testing** - Cross-base functionality must be tested on 3-base setup
4. **Never hardcode ports** - Use environment-specific configurations
5. **Never skip service health checks** - Always verify services are running before testing

### Development Rules
1. **Wiki Proxy First**: In test environments, access services through wiki proxy routes
2. **Environment Configuration**: All components must support local/test/test-wiki/dev environments
3. **Real Cryptography**: Use production secp256k1 implementations
4. **Multi-Base Aware**: Test cross-base functionality (P2P messaging, content aggregation)
5. **Health Check First**: Always verify service availability before integration testing

## Documentation References

**Service-Specific Docs**: Each service has `/deployment/{service}/CLAUDE.md`

**Key Documentation**:
- Wiki Plugin: `/src/wiki/wiki-plugin-allyabase/README.md`
- Docker Setup: `/deployment/docker/README.md`
- Test Environment: `/deployment/docker/README-SEEDING.md`
- Sharon Tests: `/sharon/CLAUDE.md`

**Individual Service Docs**: `/deployment/{service}/CLAUDE.md` where service is:
- addie, aretha, bdo, continuebee, covenant, dolores
- fount, joan, julia, minnie, pref, prof, sanora

## Recent Updates (November 2025)

### Wiki Proxy Routing Implementation
- ✅ Complete wiki proxy routing infrastructure
- ✅ wiki-plugin-allyabase with service proxy support
- ✅ Docker setup installs plugin from GitHub
- ✅ test-wiki environment in all SDK configurations
- ✅ iOS Configuration.swift with test-wiki mode
- ✅ Verified proxy routes in test environment

### Implementation Details
- Wiki plugin requires `index.js` entry point exporting server module
- Plugin installed via `cp -r` from GitHub clone
- Proxy routes use http module for request forwarding
- All HTTP methods (GET, POST, PUT, DELETE) supported
- Headers and request bodies forwarded transparently

## Testing Checklist

When testing allyabase functionality:

1. **Start Docker bases**: `./spin-up-bases.sh --clean --build`
2. **Verify wiki proxy routes**: Test health endpoints on all bases
3. **Seed test data**: `node seed-ecosystem.js test-wiki 1`
4. **Test cross-base**: P2P messaging between Base 1 and Base 2
5. **Verify authentication**: All requests use real secp256k1 signatures
6. **Check MAGIC spells**: Test spell casting through Fount coordination

---

**Mission**: Allyabase provides a production-ready microservices backend that demonstrates federated wiki integration, sessionless authentication, and true cross-base interoperability without platform lock-in.
