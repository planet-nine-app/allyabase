# Allyabase Feed Specifications

This directory contains feed format specifications for distributing content across federated platforms in The Advancement ecosystem.

## Available Specifications

### 📖 [Canipub](./canipub.md) - Book Feed Specification
**Status**: Draft (v1.0.0)

JSON-based feed format for distributing books with support for:
- Multiple access models (purchase, subscription, rental, free, library)
- Standard metadata (ISBN, BISAC, ONIX-compatible)
- Physical and digital books
- DRM-optional content distribution

**Use cases**: Publishers, community libraries, independent authors

---

### 🎵 [Canimus](./canimus.md) - Audio Feed Specification
**Status**: Reference (External Spec)

RSS-based feed format for distributing audio content (music, podcasts, audiobooks).

**Official Spec**: https://github.com/PlaidWeb/Canimus

**Implementations**:
- Sanora: `/feeds/music/:uuid` endpoint
- Mutopia: wiki-plugin-mutopia for community music hosting

---

### 📝 [Caniblog](./caniblog.md) - Blog Feed Specification
**Status**: Draft (v1.0.0)

JSON-based feed format for distributing blog posts and articles with support for:
- Multiple access models (free, subscription, paid posts, newsletter)
- Rich content (HTML, Markdown, plain text)
- Series and collections
- Comments and engagement
- Federation and syndication

**Use cases**: Bloggers, publications, newsletters, community wikis

---

### 🍳 [Canicook](./canicook.md) - Recipe Feed Specification
**Status**: Draft (v1.0.0)

JSON-based feed format for distributing recipes with support for:
- Structured ingredients and instructions
- Timing, nutrition, and dietary information
- Multiple access models (free, premium, subscription, bundles)
- Recipe collections and meal plans
- Chef attribution and source tracking
- Federation and recipe sharing

**Use cases**: Chefs, food bloggers, recipe sites, meal planning services

---

## Coming Soon

### 🎬 [TBD] - Video Feed Specification
Feed format for video content distribution

### 🎨 [TBD] - Art/Image Feed Specification
Feed format for visual art and photography

---

## Design Principles

All Allyabase feed specifications follow these principles:

1. **Interoperability**: Work across platforms and implementations
2. **Federation-ready**: Enable content sharing across communities
3. **Multiple access models**: Support various distribution strategies
4. **Standards-compliant**: Use industry standards (ISBN, BISAC, ONIX, etc.)
5. **DRM-optional**: Publishers control their own policies
6. **Privacy-first**: No tracking or surveillance required

## Implementation Guide

### For Content Creators
1. Choose appropriate feed specification
2. Generate feed with your content metadata
3. Host feed at predictable URL
4. Distribute feed URL to your community

### For Platform Builders
1. Parse feeds from content creators
2. Display content with accurate metadata
3. Support multiple access models
4. Link to source platforms for fulfillment
5. Respect licensing and DRM settings

### For Allyabase Services

Allyabase services implement these specs:

- **Sanora** (`/sanora`): Products → Canipub/Canimus/Caniblog/Canicook feeds
- **Mutopia** (`/third-party/wiki-plugin-mutopia`): Canimus archive upload
- **Books** (`/third-party/wiki-plugin-books`): Canipub book upload
- **Blogs** (`/third-party/wiki-plugin-blogs`): Caniblog blog publishing
- **[Future] Recipes**: Recipe platform using Canicook

## Contributing

These specifications are open for community input:

1. **Issues**: Report problems or suggest improvements
2. **Pull Requests**: Propose specific changes
3. **Discussions**: Share use cases and implementation experiences

## Related Documentation

- [The Advancement](../../third-party/wiki-plugin-linkitylink/THE-ADVANCEMENT.md) - Vision for community-owned platforms
- [Sanora](../../sanora/CLAUDE.md) - Product hosting service with feed endpoints
- [Mutopia](../../third-party/wiki-plugin-mutopia/README.md) - Music platform using Canimus

---

**Built with 💚 for The Advancement**
