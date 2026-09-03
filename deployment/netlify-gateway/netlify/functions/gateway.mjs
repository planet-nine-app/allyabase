import serverless from 'serverless-http';
import { connectLambda } from '@netlify/blobs';
import app from '../../gateway.js';

const rawHandler = serverless(app);

export const handler = async (event, context) => {
  // `event.blobs` is only present on real Netlify infra - absent when running
  // locally against a BLOBS_LOCAL_URL/BLOBS_LOCAL_TOKEN dev server instead.
  if (event.blobs) {
    connectLambda(event);
  }

  return rawHandler(event, context);
};
