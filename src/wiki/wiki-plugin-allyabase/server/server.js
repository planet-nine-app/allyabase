const contracts = require('./contracts.js');
const feeds = require('./feeds.js');
const inventory = require('./inventory.js');
const deployment = require('./deployment.js');
const proxy = require('./proxy.js');
const getPaid = require('./get-paid.js');

// Track plugin state
let isInitialized = false;
let servicesReady = false;

const STARTUP_DELAY_MS = 20000; // 20 seconds — gives the wiki time to finish booting

(function() {
  async function startServer(params) {
    // Check if already initialized (wiki restart scenario)
    if (isInitialized) {
      console.log('[wiki-plugin-allyabase] ✅ Plugin already initialized, skipping route registration');
      return;
    }

    console.log('[wiki-plugin-allyabase] 🚀 Registering proxy routes...');

    // Service proxy routes are safe to register immediately (no outbound HTTP calls)
    proxy.addRoutes(params);

    // Status endpoint — lets the client know whether services are ready
    params.app.get('/plugin/allyabase/status', function(req, res) {
      res.json({ ready: servicesReady, startingUp: !servicesReady });
    });

    isInitialized = true;

    // Delay connecting to allyabase microservices until the wiki has finished booting.
    // Without this delay, the outbound calls in contracts/feeds/inventory fire while
    // the wiki process is still spinning up, which can interrupt service startup.
    console.log(`[wiki-plugin-allyabase] ⏳ Waiting ${STARTUP_DELAY_MS / 1000}s for wiki to finish booting before starting allyabase services...`);
    setTimeout(async () => {
      console.log('[wiki-plugin-allyabase] 🔌 Starting allyabase service connections...');
      try {
        // Validate required environment variables
        if (!process.env.ADDIE_STRIPE_URL) {
          throw new Error(
            'ADDIE_STRIPE_URL environment variable is required but not set. ' +
            'Please set it in your allyabase instance configuration.'
          );
        }

        await getPaid.addRoutes(params);
        await contracts.addRoutes(params);
        await feeds.addRoutes(params);
        await inventory.addRoutes(params);
        deployment.addRoutes(params);

        servicesReady = true;
        console.log('[wiki-plugin-allyabase] ✅ Allyabase services ready');
      } catch (err) {
        console.error('[wiki-plugin-allyabase] ❌ Failed to start allyabase services:', err.message);
      }
    }, STARTUP_DELAY_MS);
  };

module.exports = {startServer};
}).call(this);
