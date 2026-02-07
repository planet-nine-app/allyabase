const contracts = require('./contracts.js');
const feeds = require('./feeds.js');
const inventory = require('./inventory.js');
const deployment = require('./deployment.js');
const proxy = require('./proxy.js');

// Track if plugin has been initialized (prevents duplicate route registration on wiki restart)
let isInitialized = false;

(function() {
  async function startServer(params) {
    // Check if already initialized (wiki restart scenario)
    if (isInitialized) {
      console.log('[wiki-plugin-allyabase] ✅ Plugin already initialized, skipping route registration');
      return;
    }

    console.log('[wiki-plugin-allyabase] 🚀 Initializing plugin...');

    // Validate required environment variables
    if (!process.env.ADDIE_STRIPE_URL) {
      throw new Error(
        'ADDIE_STRIPE_URL environment variable is required but not set. ' +
        'Please set it in your allyabase instance configuration.'
      );
    }

    // Add service proxy routes first (most commonly used)
    proxy.addRoutes(params);

    // Add plugin-specific routes
    contracts.addRoutes(params);
    feeds.addRoutes(params);
    inventory.addRoutes(params);
    deployment.addRoutes(params);

    // Mark as initialized to prevent duplicate route registration
    isInitialized = true;
    console.log('[wiki-plugin-allyabase] ✅ Plugin initialization complete');
  };

module.exports = {startServer};
}).call(this);
