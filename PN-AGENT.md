# Planet Nine Ecosystem - Agent Context

## 🤖 Agent Guidelines

### Core Operating Principles
1. **NO MOCKING**: Never implement mock data, fake signatures, or placeholder functionality. Everything must be real and production-ready.
2. **NO FALLBACKS**: When something fails, it fails clearly with informative error messages. No fallback data that masks real issues.
3. **NO GIT COMMANDS**: Never run git commands (add, commit, push, etc.) unless explicitly requested by the user. Always ask permission first.

## Project Overview

The Planet Nine ecosystem is a comprehensive collection of open-source software designed to create an interoperable, privacy-focused alternative to traditional web services. The ecosystem consists of three main layers: **allyabase** (backend services), **The Stack** (core protocols), and **the-nullary** (client applications).

## Agent Capabilities

### What This Agent Can Help With

#### Backend Services (allyabase)
- **BDO**: Big Dumb Object storage - cryptographically signed distributed storage
- **Sanora**: Product hosting with marketplace and teleportation endpoints
- **Addie**: Payment processing with multi-party transaction splitting
- **Fount**: MAGIC protocol integration and nineum currency management
- **Dolores**: Social feeds and PostWidget component system
- **Additional Services**: Joan (recovery), Julia (P2P messaging), Minnie (email), Pref (preferences), Aretha (limited products), Continuebee (state verification)

#### Core Protocols (The Stack)
- **sessionless**: Passwordless authentication using secp256k1 keys
- **MAGIC**: Multi-device consensus protocol for secure transactions
- **teleportation**: Content discovery and verification across bases

#### Client Applications (the-nullary)
- **Rhapsold**: Minimalist blogging platform (flagship reference implementation)
- **Ninefy**: Digital goods marketplace with type-specific product forms
- **StackChat**: P2P messaging with cross-base communication
- **MyBase**: Personal base management and content aggregation
- **Nexus**: Web-based ecosystem portal showcasing all Planet Nine services
- **Plus**: Screenary, IDO This, Grocary, Viewary, Lexary, Photary, Blogary, Viewaris, Eventary, MagiCard

#### Browser Extensions (the-advancement)
- Safari Extension: Complete Planet Nine integration with native cryptography
- Chrome Extension: Input detection and typing simulation
- Payment Processing: Multi-party Stripe integration
- Ad Covering System: Dual-mode experience (peaceful plants OR interactive monsters)
- MAGIC Protocol: Universal spell casting across applications
- Emojicoding: Revolutionary UUID ↔ emoji conversion system

### Development Tasks

#### Running Services
```bash
# Docker (recommended)
cd allyabase/deployment/docker
./test-complete-ecosystem.sh

# Individual services
cd allyabase/[service-name]
npm install && node src/server/node/[service].js

# PM2 for all services
pm2 start ecosystem.config.js
```

#### Building Applications
```bash
# Nullary applications
cd the-nullary/[app-name]
npm run tauri dev

# Browser extensions
cd the-advancement/src/extensions/safari
swift build -c release
```

#### Testing
```bash
# Complete ecosystem testing (6-phase validation)
cd allyabase/deployment/docker
./test-complete-ecosystem.sh

# Individual service tests
cd allyabase/[service]/test/mocha
npm test
```

## Project Context

### Core Philosophy
- **Interoperability over Federation**: True interoperability where users can connect across services without platform lock-in
- **Privacy by Design**: Cryptographic keys for authentication without requiring personal information
- **Open Source & Self-Hostable**: All components can be self-hosted
- **No Advertising Model**: Designed without surveillance capitalism
- **Production Code Only**: No mock data, test stubs, or demo content in production applications

### Architecture Layers

**Layer 1 - Backend (allyabase)**: 12+ microservices providing backend functionality
**Layer 2 - Protocols (The Stack)**: sessionless, MAGIC, teleportation
**Layer 3 - Applications (the-nullary)**: 16+ cross-platform apps with SVG-first architecture
**Layer 4 - Extensions (the-advancement)**: Privacy-focused browser extensions

### Environment Configuration
- **`dev`**: Production dev server (https://dev.*.allyabase.com)
- **`test`**: Local 3-base test ecosystem (localhost:5111-5122)
- **`local`**: Standard local development (localhost:3000-3008)

### Key Port Allocations
- **Core Services**: BDO (3003), Fount (3002), Addie (3005), Sanora (7243)
- **Test Environment**: 3-base Docker system (ports 5114-5128)
- **Applications**: Nexus Portal (3333), The Advancement Test Server (3456)

## Agent Constraints

### What NOT to Do
1. Never implement mock data or placeholder functionality
2. Never use fallback data that masks real issues
3. Never run git commands without explicit permission
4. Never create app-specific code without checking `/the-nullary/shared/` first
5. Never skip environment support (dev/test/local)
6. Never add features without corresponding tests

### Development Rules
1. **Shared Code First**: Always check `/the-nullary/shared/` before adding app-specific functionality
2. **Real Integrations Only**: All implementations must use real service integrations
3. **Environment Support Required**: All components must support dev/test/local environments
4. **Testing Required**: New features require tests and integration validation

## Documentation References

For detailed information, see:
- **[Allyabase Services](docs/ALLYABASE-SERVICES.md)** - Complete backend service documentation
- **[The Stack Protocols](docs/THE-STACK-PROTOCOLS.md)** - Protocol specifications
- **[The Nullary Apps](docs/THE-NULLARY-APPS.md)** - Client application documentation
- **[Development Environment](docs/DEVELOPMENT-ENVIRONMENT.md)** - Setup and deployment
- **[Testing Ecosystem](docs/TESTING-ECOSYSTEM.md)** - 6-phase testing system

## Key Files & Directories
- `build-em-all.sh`: Build all services
- `test-em-all.sh`: Run all tests
- `ecosystem.config.js`: PM2 configuration
- `data/`: Local file storage for development
- `artifacts/`: Generated content and exports
- `the-nullary/shared/`: Shared components and utilities
- `allyabase/deployment/docker/`: Complete ecosystem testing

## Current Status (January 2025)

### Production Ready
- ✅ Safari Extension with complete ecosystem integration
- ✅ Payment Infrastructure with multi-party commerce
- ✅ Testing System with 6-phase validation
- ✅ Cross-Base Functionality (P2P messaging, content aggregation)
- ✅ Real Cryptography (production secp256k1 with compressed keys)

### Key Achievements
- **First Working Decentralized Commerce**: Complete payment infrastructure without intermediaries
- **Universal Cryptographic Authentication**: Sessionless protocol across all components
- **Cross-Base Interoperability**: True interoperability vs traditional federation
- **Complete Testing Infrastructure**: 6-phase validation ensuring production readiness
- **Privacy-First Design**: No surveillance, tracking, or advertising-based revenue models

---

**Mission**: Planet Nine demonstrates that it's possible to build comprehensive, production-ready alternatives to traditional web services while maintaining user privacy, enabling true interoperability, and providing creators with fair compensation without surveillance capitalism.
