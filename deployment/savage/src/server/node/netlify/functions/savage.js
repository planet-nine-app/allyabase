import serverless from 'serverless-http';
import app from '../../savage.js';

// No persistence, no Blobs context needed - savage is a pure pass-through/
// transform in front of BDO.
export const handler = serverless(app);
