const logger = require('./services/logger');
const { connectDatabase, closeDatabase } = require('./services/database');
const { startSubscriber, stopSubscriber } = require('./services/pubsub');

const shutdown = async (signal) => {
  logger.info(`${signal} signal received. Shutting down gracefully.`);

  try {
    await stopSubscriber();
    await closeDatabase();
    process.exit(0);
  } catch (error) {
    logger.error('Graceful shutdown failed.', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

const start = async () => {
  try {
    await connectDatabase();
    startSubscriber();
  } catch (error) {
    logger.error('Application failed to start.', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled promise rejection.', { error: error?.message, stack: error?.stack });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception.', { error: error.message, stack: error.stack });
  process.exit(1);
});

start();
