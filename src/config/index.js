const path = require('path');
//const dotenv = require('dotenv');

//dotenv.config({ path: path.resolve(process.cwd(), '.env') });

module.exports = {
  env: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  processingDelayMs: Number(process.env.PROCESSING_DELAY_MS || 0),
  gcp: {
    projectId: process.env.GCP_PROJECT_ID,
    subscriptionId: process.env.GCP_SUBSCRIPTION_ID,
    flowControl: {
      maxMessages: Number(process.env.GCP_SUBSCRIPTION_FLOW_MAX_MESSAGES || 5),
      maxBytes: Number(process.env.GCP_SUBSCRIPTION_FLOW_MAX_BYTES || 10485760),
      allowExcessMessages: process.env.GCP_SUBSCRIPTION_FLOW_ALLOW_EXCESS_MESSAGES === 'true',
    },
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'orders_db',
  },
};
