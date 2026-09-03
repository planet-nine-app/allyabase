import defaultConfig from './default.js';

export default {
  ...defaultConfig,
  // LOCALHOST=true is set both by allyabase_setup.sh's pm2 ecosystem (every
  // service on its own conventional port on one droplet) and by the
  // netlify-gateway bundle (same ports, in-process loopback instead of a
  // network hop) — matches bdo.js/addie.js's own LOCALHOST-conditional
  // exactly, same ports as netlify-gateway/services.js's SERVICES map.
  bdoBaseURL: process.env.LOCALHOST ? 'http://localhost:3003/' : defaultConfig.bdoBaseURL,
  addieBaseURL: process.env.LOCALHOST ? 'http://localhost:3005/' : defaultConfig.addieBaseURL
};
