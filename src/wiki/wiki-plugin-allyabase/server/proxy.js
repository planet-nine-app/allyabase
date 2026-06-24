/**
 * Service Proxy Routes for wiki-plugin-allyabase
 *
 * Proxies requests from /plugin/allyabase/{service}/... to the backend services
 * This enables the wiki to act as a single entry point for all allyabase services
 */

const http = require('http');
const https = require('https');

// Service name to internal port mapping (inside Docker container)
// These are the ports services run on inside the container
const SERVICE_PORTS = {
  julia: 3000,
  continuebee: 2999,
  pref: 3002,
  bdo: 3003,
  joan: 3004,
  addie: 3005,
  fount: 3006,
  dolores: 3007,
  minnie: 2525,
  aretha: 7277,
  sanora: 7243,
  glyphenge: 3010,
  linkitylink: 3010  // Same as glyphenge in container
};

// Services that should be proxied
const PROXIED_SERVICES = Object.keys(SERVICE_PORTS);

/**
 * Create a proxy request to a backend service
 */
function proxyRequest(serviceName, req, res, targetPath) {
  const servicePort = SERVICE_PORTS[serviceName];

  if (!servicePort) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: `Unknown service: ${serviceName}` }));
  }

  // Build target URL (localhost inside container)
  const targetHost = '127.0.0.1';
  const targetUrl = `http://${targetHost}:${servicePort}${targetPath}`;

  console.log(`[proxy] ${req.method} ${req.url} -> ${targetUrl}`);

  // Parse the target URL
  const url = new URL(targetUrl);

  // Build proxy request options
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search,
    method: req.method,
    headers: { ...req.headers }
  };

  // Remove host header to avoid conflicts
  delete options.headers.host;

  // Create proxy request
  const proxyReq = http.request(options, (proxyRes) => {
    // Copy response headers
    res.writeHead(proxyRes.statusCode, proxyRes.headers);

    // Pipe response body
    proxyRes.pipe(res, { end: true });
  });

  // Handle proxy errors
  proxyReq.on('error', (err) => {
    console.error(`[proxy] Error proxying to ${serviceName}:`, err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Bad Gateway',
      message: `Failed to connect to ${serviceName} service`,
      details: err.message
    }));
  });

  // Pipe request body for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    req.pipe(proxyReq, { end: true });
  } else {
    proxyReq.end();
  }
}

/**
 * Add proxy routes to the Express app
 */
async function addRoutes(params) {
  const app = params.app;

  // Log that proxy routes are being added
  console.log('[wiki-plugin-allyabase] Adding service proxy routes...');

  // Create a route for each service
  for (const serviceName of PROXIED_SERVICES) {
    const routePath = `/plugin/allyabase/${serviceName}`;

    // Handle all methods for this service
    app.all(`${routePath}/*`, (req, res) => {
      // Extract the path after /plugin/allyabase/{service}/
      const targetPath = req.url.replace(`/plugin/allyabase/${serviceName}`, '') || '/';
      proxyRequest(serviceName, req, res, targetPath);
    });

    // Also handle requests to the service root (no trailing path)
    app.all(routePath, (req, res) => {
      proxyRequest(serviceName, req, res, '/');
    });

    console.log(`[wiki-plugin-allyabase]   -> ${routePath}/* -> localhost:${SERVICE_PORTS[serviceName]}`);
  }

  // Add a route to list available services
  app.get('/plugin/allyabase/services', (req, res) => {
    res.json({
      services: PROXIED_SERVICES,
      ports: SERVICE_PORTS,
      description: 'Available allyabase services accessible via /plugin/allyabase/{service}/...'
    });
  });

  console.log('[wiki-plugin-allyabase] Service proxy routes added successfully');
}

module.exports = { addRoutes, SERVICE_PORTS, PROXIED_SERVICES };
