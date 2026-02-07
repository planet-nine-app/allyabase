const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Federation configuration file
const FEDERATION_CONFIG_FILE = path.join(__dirname, '../.federation-config.json');

// Feed types to aggregate
const FEED_TYPES = ['music', 'books', 'blogs', 'recipes'];

// Plugin name mapping
const PLUGIN_NAMES = {
  music: 'mutopia',
  books: 'books',
  blogs: 'blogs',
  recipes: 'recipes'
};

/**
 * Load federation configuration
 * Returns list of federated wiki URLs
 */
function loadFederationConfig() {
  if (fs.existsSync(FEDERATION_CONFIG_FILE)) {
    try {
      const data = fs.readFileSync(FEDERATION_CONFIG_FILE, 'utf8');
      const config = JSON.parse(data);
      return config.wikis || [];
    } catch (err) {
      console.warn('[allyabase-feeds] Failed to load federation config:', err.message);
    }
  }

  // Return empty list if no config
  return [];
}

/**
 * Save federation configuration
 */
function saveFederationConfig(wikis) {
  try {
    fs.writeFileSync(FEDERATION_CONFIG_FILE, JSON.stringify({ wikis }, null, 2));
    console.log('[allyabase-feeds] Saved federation config with', wikis.length, 'wikis');
  } catch (err) {
    console.error('[allyabase-feeds] Failed to save federation config:', err.message);
  }
}

/**
 * Fetch feed from a single wiki
 */
async function fetchFeedFromWiki(wikiUrl, feedType) {
  const pluginName = PLUGIN_NAMES[feedType];
  const feedUrl = `${wikiUrl}/plugin/${pluginName}/feed?format=json`;

  console.log(`[allyabase-feeds] Fetching ${feedType} feed from ${feedUrl}`);

  try {
    const response = await fetch(feedUrl, {
      timeout: 10000,
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.warn(`[allyabase-feeds] Failed to fetch from ${feedUrl}: ${response.status}`);
      return null;
    }

    const feed = await response.json();
    return feed;
  } catch (err) {
    console.warn(`[allyabase-feeds] Error fetching from ${feedUrl}:`, err.message);
    return null;
  }
}

/**
 * Aggregate feeds from all federated wikis
 */
async function aggregateFeedsForType(feedType) {
  const wikis = loadFederationConfig();

  if (wikis.length === 0) {
    console.log(`[allyabase-feeds] No federated wikis configured for ${feedType}`);
    return {
      type: 'feed',
      version: '1.0',
      name: `Federated ${feedType.charAt(0).toUpperCase() + feedType.slice(1)} Feed`,
      description: `Aggregated ${feedType} from federated wikis`,
      updated: new Date().toISOString(),
      items: []
    };
  }

  console.log(`[allyabase-feeds] Aggregating ${feedType} feeds from ${wikis.length} wikis`);

  // Fetch feeds from all wikis in parallel
  const feedPromises = wikis.map(wiki => fetchFeedFromWiki(wiki, feedType));
  const feeds = await Promise.all(feedPromises);

  // Aggregate all items
  const allItems = [];
  const seenIds = new Set();

  for (const feed of feeds) {
    if (!feed || !feed.items) continue;

    for (const item of feed.items) {
      // Deduplicate by ID or URL
      const itemId = item.id || item.uid || item.url;
      if (itemId && seenIds.has(itemId)) {
        continue;
      }

      if (itemId) {
        seenIds.add(itemId);
      }

      allItems.push(item);
    }
  }

  // Sort by date (most recent first)
  allItems.sort((a, b) => {
    const dateA = new Date(a.date_published || a.published || a.updated || 0);
    const dateB = new Date(b.date_published || b.published || b.updated || 0);
    return dateB - dateA;
  });

  return {
    type: 'feed',
    version: '1.0',
    name: `Federated ${feedType.charAt(0).toUpperCase() + feedType.slice(1)} Feed`,
    description: `Aggregated ${feedType} from ${wikis.length} federated wikis`,
    updated: new Date().toISOString(),
    items: allItems,
    _metadata: {
      source_count: wikis.length,
      item_count: allItems.length,
      last_aggregated: new Date().toISOString()
    }
  };
}

/**
 * Store aggregated feed in BDO for Dolores to serve
 */
async function storeAggregatedFeed(feedType, aggregatedFeed) {
  // For now, store in filesystem where Dolores can read it
  // TODO: Integrate with actual Dolores storage mechanism
  const feedDir = path.join(__dirname, '../.aggregated-feeds');

  if (!fs.existsSync(feedDir)) {
    fs.mkdirSync(feedDir, { recursive: true });
  }

  const feedFile = path.join(feedDir, `${feedType}-federated.json`);
  fs.writeFileSync(feedFile, JSON.stringify(aggregatedFeed, null, 2));

  console.log(`[allyabase-feeds] Stored aggregated ${feedType} feed (${aggregatedFeed.items.length} items)`);
}

/**
 * Update all federated feeds
 * Called hourly by scheduler
 */
async function updateAllFederatedFeeds() {
  console.log('[allyabase-feeds] 🔄 Starting federated feed update...');

  for (const feedType of FEED_TYPES) {
    try {
      const aggregatedFeed = await aggregateFeedsForType(feedType);
      await storeAggregatedFeed(feedType, aggregatedFeed);
    } catch (err) {
      console.error(`[allyabase-feeds] Error aggregating ${feedType} feed:`, err);
    }
  }

  console.log('[allyabase-feeds] ✅ Federated feed update complete');
}

/**
 * Start hourly polling for federated feeds
 */
function startFeedPolling() {
  // Update immediately on startup
  updateAllFederatedFeeds().catch(err => {
    console.error('[allyabase-feeds] Initial feed update failed:', err);
  });

  // Then update every hour
  const HOUR_IN_MS = 60 * 60 * 1000;
  setInterval(() => {
    updateAllFederatedFeeds().catch(err => {
      console.error('[allyabase-feeds] Scheduled feed update failed:', err);
    });
  }, HOUR_IN_MS);

  console.log('[allyabase-feeds] ⏰ Hourly feed polling started');
}

async function addRoutes(params) {
  const app = params.app;

  /**
   * Get federation configuration
   * GET /plugin/allyabase/federation/config
   */
  app.get('/plugin/allyabase/federation/config', function(req, res) {
    const wikis = loadFederationConfig();
    res.json({
      success: true,
      wikis: wikis
    });
  });

  /**
   * Add wiki to federation
   * POST /plugin/allyabase/federation/add
   * Body: { wikiUrl: "https://example.wiki" }
   */
  app.post('/plugin/allyabase/federation/add', function(req, res) {
    const { wikiUrl } = req.body;

    if (!wikiUrl) {
      return res.status(400).json({
        success: false,
        error: 'wikiUrl is required'
      });
    }

    const wikis = loadFederationConfig();

    if (!wikis.includes(wikiUrl)) {
      wikis.push(wikiUrl);
      saveFederationConfig(wikis);
    }

    res.json({
      success: true,
      wikis: wikis
    });
  });

  /**
   * Remove wiki from federation
   * POST /plugin/allyabase/federation/remove
   * Body: { wikiUrl: "https://example.wiki" }
   */
  app.post('/plugin/allyabase/federation/remove', function(req, res) {
    const { wikiUrl } = req.body;

    if (!wikiUrl) {
      return res.status(400).json({
        success: false,
        error: 'wikiUrl is required'
      });
    }

    const wikis = loadFederationConfig();
    const index = wikis.indexOf(wikiUrl);

    if (index > -1) {
      wikis.splice(index, 1);
      saveFederationConfig(wikis);
    }

    res.json({
      success: true,
      wikis: wikis
    });
  });

  /**
   * Get aggregated feed for a type
   * GET /plugin/allyabase/feeds/:type/federated
   */
  app.get('/plugin/allyabase/feeds/:type/federated', function(req, res) {
    const feedType = req.params.type;

    if (!FEED_TYPES.includes(feedType)) {
      return res.status(404).json({
        success: false,
        error: `Unknown feed type: ${feedType}`
      });
    }

    const feedFile = path.join(__dirname, '../.aggregated-feeds', `${feedType}-federated.json`);

    if (!fs.existsSync(feedFile)) {
      return res.status(404).json({
        success: false,
        error: `No aggregated feed available for ${feedType}`
      });
    }

    try {
      const feed = JSON.parse(fs.readFileSync(feedFile, 'utf8'));
      res.json(feed);
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });

  /**
   * Manually trigger feed update
   * POST /plugin/allyabase/federation/update
   */
  app.post('/plugin/allyabase/federation/update', async function(req, res) {
    try {
      // Trigger update asynchronously
      updateAllFederatedFeeds().catch(err => {
        console.error('[allyabase-feeds] Manual update failed:', err);
      });

      res.json({
        success: true,
        message: 'Feed update triggered'
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });

  // Start hourly polling
  startFeedPolling();

  console.log('[allyabase-feeds] Federation routes added');
  console.log('[allyabase-feeds] Routes:');
  console.log('  GET /plugin/allyabase/federation/config - Get federated wikis');
  console.log('  POST /plugin/allyabase/federation/add - Add wiki to federation');
  console.log('  POST /plugin/allyabase/federation/remove - Remove wiki from federation');
  console.log('  GET /plugin/allyabase/feeds/:type/federated - Get aggregated feed');
  console.log('  POST /plugin/allyabase/federation/update - Manually trigger update');
}

module.exports = { addRoutes };
