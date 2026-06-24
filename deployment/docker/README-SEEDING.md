# Planet Nine Ecosystem Data Seeding

This directory contains a comprehensive data seeding system for populating Planet Nine allyabase environments with realistic sample data.

## Overview

The seeding system creates sample data across all major Planet Nine services:

- **Prof**: User profiles for IDothis and MyBase applications
- **Sanora**: Products for Ninefy marketplace and blog posts for Rhapsold
- **Dolores**: Social media posts and interactions  
- **BDO**: Base discovery data for cross-base networking
- **Julia**: Messages for StackChat communication (future)

## Quick Start

### 1. Setup Dependencies

First, install the required Node.js dependencies:

```bash
cd /path/to/allyabase/deployment/docker
./setup-seeding.sh
```

This will:
- Check for Node.js 16+ installation
- Install `sessionless-node` and `node-fetch` dependencies
- Verify the setup is ready

### 2. Seed Local Environment

If you have local Planet Nine services running:

```bash
./spin-up-bases.sh --env=local --seed
```

This assumes services are running on standard ports:
- dolores: `localhost:3007`
- prof: `localhost:3008` 
- sanora: `localhost:7243`
- bdo: `localhost:3003`
- etc.

### 3. Seed Test Environment

For the 3-base Docker test ecosystem:

```bash
# Start all 3 bases with seeding on Base 1
./spin-up-bases.sh --clean --build --env=test --seed --seed-base=1

# Or seed a specific base after startup
./spin-up-bases.sh --env=test --seed --seed-base=2
```

## Command Reference

### Spin-up Script Options

```bash
./spin-up-bases.sh [OPTIONS]

Options:
  --clean              Clean up existing containers before starting
  --build              Build Docker image before starting  
  --env=ENV            Environment: local or test (default: test)
  --seed               Seed the environment with sample data
  --seed-base=BASE     Which base to seed (1, 2, or 3, default: 1)
  -h, --help           Show help message

Examples:
  ./spin-up-bases.sh --clean --build --env=test --seed
  ./spin-up-bases.sh --env=local --seed --seed-base=2
  ./spin-up-bases.sh --clean --build
```

### Direct Seeding Commands

```bash
# Using npm scripts
npm run seed:local           # Seed local environment
npm run seed:test:base1      # Seed test Base 1
npm run seed:test:base2      # Seed test Base 2  
npm run seed:test:base3      # Seed test Base 3

# Direct script execution
node seed-ecosystem.js local
node seed-ecosystem.js test 1
node seed-ecosystem.js test 2
node seed-ecosystem.js test 3
```

## Sample Data Generated

### User Profiles (Prof Service)
- **9 realistic professional profiles** with diverse skills and backgrounds
- Names: Alice Developer, Bob Designer, Charlie Analytics, Diana Marketing, etc.
- Each includes: name, email, bio, skills, website, location, "I do this" specialty
- Supports both IDothis professional discovery and MyBase networking

### Products (Sanora Service)
- **9 digital products** for Ninefy marketplace
- Categories: courses, templates, toolkits, ebooks, frameworks, workshops
- Examples: "React Mastery Course", "UI Design System Template", "Python Data Analysis Toolkit"
- Realistic pricing ($19-$199), tags, and descriptions
- **🪄 NEW**: Products created via `enchant-product` MAGIC spell (200 MP) - creates both product AND shareable BDO with emoji shortcode!

### Blog Posts (Sanora Service)
- **9 technical blog posts** for Rhapsold blogging platform
- Topics: web development, UI/UX, data privacy, remote work, CI/CD, etc.
- External URL references with proper categorization
- Comprehensive tagging for discovery

### Social Posts (Dolores Service)
- **9 social media posts** from various professionals
- Content includes emojis, hashtags, and professional insights
- Topics range from technical achievements to project updates
- Attributed to the generated user profiles for consistency

### Base Discovery Data (BDO Service)
- **3 sample bases** for cross-base networking
- "Tech Hub Base", "Creative Collective", "Business Network"
- Categorized content: lexary (text), photary (images), viewary (videos)
- Supports MyBase base discovery and aggregation features

## Environment Configuration

### Local Environment
- Uses standard localhost ports
- Assumes you're running individual services manually
- No Docker containers required
- Good for development and testing individual services

### Test Environment  
- Uses Docker containers with port mapping
- Base 1: ports 5111-5122
- Base 2: ports 5211-5222  
- Base 3: ports 5311-5322
- Complete isolated ecosystem for integration testing

## Troubleshooting

### Common Issues

**"Node.js not found"**
```bash
# Install Node.js 16+ from nodejs.org or use nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
```

**"Failed to create user" errors**
- Ensure services are running and accessible
- Check service health endpoints
- Wait for services to fully start (script waits 10 seconds)

**"Seed script not found"**
- Run commands from the `allyabase/deployment/docker/` directory
- Ensure `seed-ecosystem.js` is present and executable

**Connection refused errors**
- Verify service URLs and ports
- Check Docker containers are running: `docker ps`
- Check local services are started

### Health Checking

The seeding script automatically checks service health before attempting to seed:

```bash
# Manual health check examples
curl http://localhost:3007/health  # dolores
curl http://localhost:3008/health  # prof  
curl http://localhost:7243/health  # sanora
curl http://localhost:3003/health  # bdo
```

## Architecture

### Seeding Script Structure

```
seed-ecosystem.js
├── Environment Configuration  # Local vs test port mapping
├── HTTP Helper Functions      # Authenticated requests
├── Sample Data Generators     # Realistic data creation
├── Service Seeder Classes     # Per-service integration
│   ├── ProfSeeder            # User profiles
│   ├── SanoraSeeder          # Products & blog posts
│   ├── DoloresSeeder         # Social posts
│   └── BDOSeeder             # Base discovery
└── Health Checking           # Service availability
```

### Authentication
- Uses `sessionless-node` for cryptographic authentication
- Generates unique keys for each service interaction
- No passwords or shared secrets required
- Follows Planet Nine's privacy-first authentication model

### Data Consistency
- User profiles are created with consistent professional themes
- Social posts reference the same professionals
- Products align with user specializations
- Contracts reflect realistic professional service scenarios

## 🪄 MAGIC Protocol Integration (January 2025)

The seeding system now uses Sanora's MAGIC protocol for creating products with associated BDOs (Base Data Objects) in a single action.

### Enchant-Product Spell

**What it does**: Creates both a Sanora product AND a shareable BDO together
**Cost**: 200 MP (Mana Points)
**Location**: `/sanora/src/server/node/src/magic/magic.js`

### How it Works in Seeding

**Before** (Direct Product Upload):
```javascript
const product = await this.createProduct(user, productData);
```

**Now** (Spell-Based with BDO):
```javascript
const result = await this.castEnchantProductSpell(user, productData);
// Creates:
// 1. Product in Sanora
// 2. Public BDO with auto-generated SVG
// 3. Emoji shortcode for easy sharing
```

### Spell Casting Flow

1. **Create Sanora user** (if needed)
2. **Build spell payload** with product components:
   - title, description, price, tags, category
   - contentType, productId, metadata
3. **Cast spell** via POST to `/magic/spell/enchant-product`
4. **Get results** with both product UUID and BDO emoji shortcode

### Example Result

```javascript
{
  success: true,
  product: {
    uuid: "user-uuid",
    title: "React Mastery Course",
    productId: "react-mastery-course",
    price: 9900
  },
  bdo: {
    uuid: "bdo-uuid",
    pubKey: "02a1b2c3d4e5f6a7...",
    emojiShortcode: "🌍🔑💎🌟💎🎨🐉📌"
  }
}
```

### Benefits for Seeding

- **Automatic BDOs**: All seeded products get shareable BDOs for free
- **Cross-Base Discovery**: BDOs are public and discoverable across bases
- **Auto-Generated SVGs**: Professional product cards created automatically
- **Emoji Shortcodes**: Easy-to-share identifiers for all products
- **Production Pattern**: Same spell available in Ninefy for user uploads

### Configuration

The `SanoraSeeder` class in `seed-ecosystem.js` uses the spell by default for all products:

```javascript
async seedProducts() {
  for (const productData of sampleProducts) {
    // Cast enchant-product spell (200 MP) to create product + BDO
    const result = await this.castEnchantProductSpell(user, productData);
    if (result && result.success) {
      console.log(`✅ Created product + BDO: ${productData.title}`);
      if (result.bdo && result.bdo.emojiShortcode) {
        console.log(`   Emoji: ${result.bdo.emojiShortcode}`);
      }
    }
  }
}
```

### Documentation

- **Sanora README**: Full spell documentation at `/sanora/README.md`
- **Ninefy CLAUDE.md**: User-facing spell integration at `/the-nullary/ninefy/CLAUDE.md`
- **Seed Script**: Implementation at `/allyabase/deployment/docker/seed-ecosystem.js` (lines 299-371)

## Integration with Nullary Apps

The seeded data is designed to work seamlessly with all Planet Nine client applications:

- **IDothis**: Professional profiles for discovery and networking
- **MyBase**: User profiles and base discovery data
- **Ninefy**: Digital products marketplace with realistic inventory
- **Rhapsold**: Blog posts for content discovery and reading
- **StackChat**: Future message seeding for P2P communication testing

## Contributing

To add new seed data:

1. Add sample data generators in `seed-ecosystem.js`
2. Create or extend seeder classes for new services
3. Update service URL configuration for new environments
4. Test with both local and test environments
5. Update this documentation

### Adding New Services

```javascript
class NewServiceSeeder {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }
  
  async seedData() {
    // Implementation
  }
}

// Add to main seeding function
const seeders = [
  // ... existing seeders
  new NewServiceSeeder(SERVICES.newservice).seedData()
];
```

## Related Documentation

- [Complete Testing System](README-COMPLETE-TESTING.md)
- [Docker Integration](README-INTEGRATED-TESTING.md)
- [Bootstrap Testing](README-BOOTSTRAP-TESTING.md)
- [Nullary App Testing](nullary-tests/README.md)

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Dependencies**: Node.js 16+, sessionless-node, node-fetch