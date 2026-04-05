const { PubSub } = require('@google-cloud/pubsub');
const config = require('../config');
const logger = require('./logger');
const { processOrder } = require('../controllers/orderController');

const pubSubClient = new PubSub({ projectId: config.gcp.projectId });
const subscription = pubSubClient.subscription(config.gcp.subscriptionId);

const messageHandler = async (message) => {
  try {
    const messageData = JSON.parse(message.data.toString());
    logger.info(`Received message ${message.id}.`, { data: messageData });

    await processOrder(messageData);

    message.ack();
    logger.info(`Acked message ${message.id}.`);
  } catch (error) {
    logger.error(`Error processing message ${message.id}.`, {
      error: error.message,
      stack: error.stack,
    });
    message.nack();
    logger.info(`Nacked message ${message.id}.`);
  }
};

const startSubscriber = () => {
  subscription.on('message', messageHandler);
  subscription.on('error', (error) => {
    logger.error('Received error from Pub/Sub subscription.', { error });
  });

  logger.info(`Listening for messages on subscription: ${subscription.name}`);
};

const stopSubscriber = async () => {
  if (subscription) {
    logger.info('Closing Pub/Sub subscription...');
    await subscription.close();
    logger.info('Pub/Sub subscription closed.');
  }
};

module.exports = {
  startSubscriber,
  stopSubscriber,
};
