#!/usr/bin/env node

/**
 * Simple HTTP proxy server for allyabase Docker environment
 *
 * Routes wiki-style paths to direct service ports:
 * /plugin/allyabase/bdo/* → http://localhost:3003/*
 * /plugin/allyabase/sanora/* → http://localhost:7243/*
 * etc.
 *
 * This allows tests to use consistent URLs whether running against:
 * - Local services (direct ports)
 * - Docker with proxy (wiki-style paths)
 */

import http from 'http';
import httpProxy from 'http-proxy';

const PORT = process.env.PROXY_PORT || 5124;
const PORT_OFFSET = parseInt(process.env.PORT_OFFSET || '0');

// Service port mapping (base ports + offset)
const SERVICE_PORTS = {
  'julia': 3000 + PORT_OFFSET,
  'continuebee': 2999 + PORT_OFFSET,
  'joan': 3004 + PORT_OFFSET,
  'pref': 3002 + PORT_OFFSET,
  'bdo': 3003 + PORT_OFFSET,
  'fount': 3006 + PORT_OFFSET,
  'addie': 3005 + PORT_OFFSET,
  'aretha': 7277 + PORT_OFFSET,
  'sanora': 7243 + PORT_OFFSET,
  'dolores': 3007 + PORT_OFFSET,
  'minnie': 2525 + PORT_OFFSET,
  'glyphenge': 3010 + PORT_OFFSET,
  'linkitylink': 3010 + PORT_OFFSET, // Alias for glyphenge
  'prof': 3008 + PORT_OFFSET
};

// Create proxy instance
const proxy = httpProxy.createProxyServer({});

// Error handling
proxy.on('error', (err, req, res) => {
  console.error(`Proxy error for ${req.url}:`, err.message);
  res.writeHead(500, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: false,
    error: 'Service unavailable',
    message: err.message
  }));
});

// Create HTTP server
const server = http.createServer((req, res) => {
  const url = req.url;

  // Parse wiki-style path: /plugin/allyabase/{service}/{path}
  const match = url.match(/^\/plugin\/allyabase\/([^\/]+)(\/.*)?$/);

  if (match) {
    const serviceName = match[1];
    const servicePath = match[2] || '/';
    const servicePort = SERVICE_PORTS[serviceName];

    if (servicePort) {
      const target = `http://localhost:${servicePort}`;
      console.log(`Proxying: ${url} → ${target}${servicePath}`);

      // Rewrite the URL to remove the wiki prefix
      req.url = servicePath;

      // Proxy the request
      proxy.web(req, res, { target });
    } else {
      console.error(`Unknown service: ${serviceName}`);
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Service not found',
        service: serviceName,
        availableServices: Object.keys(SERVICE_PORTS)
      }));
    }
  } else {
    // Not a wiki-style path, return 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found. Use /plugin/allyabase/{service}/{path}');
  }
});

server.listen(PORT, () => {
  console.log(`🔀 Allyabase proxy server running on port ${PORT}`);
  console.log(`   Port offset: ${PORT_OFFSET}`);
  console.log(`   Example: http://localhost:${PORT}/plugin/allyabase/bdo/health`);
  console.log(`   Available services:`, Object.keys(SERVICE_PORTS).join(', '));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down proxy server...');
  server.close(() => {
    console.log('Proxy server stopped');
    process.exit(0);
  });
});
