# Canimus: Audio Feed Specification

**Official Specification**: https://github.com/PlaidWeb/Canimus

## Overview

Canimus is an RSS-based feed format for distributing audio content (music, podcasts, audiobooks). It extends standard RSS with iTunes podcast tags to create a simple, interoperable format for audio distribution.

## Key Features

- **RSS 2.0 Based**: Uses familiar RSS structure
- **iTunes Extensions**: Includes iTunes podcast namespace for rich metadata
- **Audio Enclosures**: Each item has an audio file enclosure
- **Album/Track Model**: Designed for music albums and audio collections
- **Order Support**: Tracks can specify playback order
- **Duration**: Track length in standardized format

## Basic Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>Album Title</title>
    <description>Album description</description>
    <itunes:author>Artist Name</itunes:author>
    <itunes:image href="cover.jpg"/>

    <item>
      <title>Track Title</title>
      <description>Track description</description>
      <enclosure url="track.mp3" type="audio/mpeg" length="5242880"/>
      <itunes:duration>3:42</itunes:duration>
      <itunes:order>1</itunes:order>
    </item>
  </channel>
</rss>
```

## Usage in Allyabase

### Sanora Integration

Sanora implements Canimus feeds at `/feeds/music/:uuid`:

- Auto-categorizes products with audio file extensions (`.mp3`, `.flac`, `.m4a`, `.ogg`, `.wav`)
- Converts products to Canimus format via `productToCanimusTrack()`
- Supports album metadata and track ordering
- Provides JSON-based Canimus feed (not XML RSS)

### Payee Structure (Optional)

Tracks can include an optional `payees` array for royalty distribution in the JSON feed format. Each payee is defined by the Addie four-tuple:

```json
{
  "payees": [
    {
      "pubKey": "02a1b2c3d4e5f6...",
      "addie-url": "https://addie.planetnine.app",
      "percent": 10,
      "signature": "3045022100..."
    },
    {
      "pubKey": "02f6e5d4c3b2a1...",
      "addie-url": "https://addie.planetnine.app",
      "percent": 90,
      "signature": "3046022100..."
    }
  ]
}
```

**Payee Fields:**
- **pubKey**: Artist's Sessionless public key (secp256k1)
- **addie-url**: Addie payment service URL for processing payments
- **percent**: Percentage of revenue (0-100)
- **signature**: Cryptographic signature of `(pubKey + addie-url + percent)` to verify payee authenticity

**Use Cases:**
- Artist royalties (artist 70%, label 30%)
- Collaborations (artist 1: 50%, artist 2: 50%)
- Platform splits (artist 85%, platform 15%)
- Producer/mixer credits (artist 80%, producer 10%, mixer 10%)

Payees are processed when payment is triggered (track purchase, album sale, streaming revenue) via Addie's payment infrastructure.

### Mutopia Plugin

wiki-plugin-mutopia uses Canimus for music distribution:

- Parses Canimus RSS feeds from ZIP archives
- Uploads tracks to Sanora as products
- Preserves album metadata and track order
- Enables community music hosting

## Example: Canimus Archive Structure

```
album.zip
├── feed.xml          # Canimus RSS feed
├── cover.jpg         # Album artwork
├── track1.mp3
├── track2.mp3
└── track3.mp3
```

## Canimus vs Canipub

| Feature | Canimus | Canipub |
|---------|---------|---------|
| Format | XML/RSS | JSON |
| Content | Audio (music) | Books (text) |
| Primary Use | Music albums | Book catalog |
| Enclosures | Audio files | EPUB/PDF files |
| Ordering | Track order | Chapter/volume |
| Federation | ✅ | ✅ |

## Resources

- **Specification**: https://github.com/PlaidWeb/Canimus
- **Sanora Implementation**: `/sanora/src/server/node/sanora.js` (lines 1735-1777, 1847-1878)
- **Mutopia Integration**: `/third-party/wiki-plugin-mutopia/server/server.js`

## Related Specs

- [Canipub](./canipub.md) - Book feed specification (JSON-based)
- [Libris](./libris.md) - Book-specific Canimus variant
- [Scribus](./scribus.md) - Blog post feed specification

---

**Canimus**: Audio feeds for the federated web

**Built with 💚 by the community**
