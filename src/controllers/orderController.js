const { sequelize, Customer, Order, OrderItem, ShippingAddress } = require('../models');
const config = require('../config');
const logger = require('../services/logger');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Processes and persists an order event from a Pub/Sub message.
 * Implements idempotency by checking if the order already exists.
 * Uses a transaction to ensure all or nothing persistence.
 * @param {object} orderData - The parsed JSON data from the Pub/Sub message.
 */
const processOrder = async (orderData) => {
  const { orderId, timestamp, customer, items, totalAmount, shippingAddress } = orderData;
  const normalizedOrderId = String(orderId);

  const existingOrder = await Order.findByPk(normalizedOrderId);
  if (existingOrder) {
    logger.warn(`Order [${normalizedOrderId}] already exists. Skipping processing.`);
    return;
  }

  const transaction = await sequelize.transaction();

  try {
    const [customerRecord] = await Customer.findOrCreate({
      where: { email: customer.email },
      defaults: { name: customer.name },
      transaction,
    });

    const orderRecord = await Order.create(
      {
        id: normalizedOrderId,
        timestamp,
        totalAmount,
        customerId: customerRecord.id,
      },
      { transaction }
    );

    await ShippingAddress.create(
      {
        ...shippingAddress,
        orderId: orderRecord.id,
      },
      { transaction }
    );

    const orderItems = items.map((item) => ({
      ...item,
      orderId: orderRecord.id,
    }));
    await OrderItem.bulkCreate(orderItems, { transaction });

    if (config.processingDelayMs > 0) {
      logger.info(`Holding transaction open for ${config.processingDelayMs}ms for order [${normalizedOrderId}].`);
      await sleep(config.processingDelayMs);
    }

    await transaction.commit();
    logger.info(`Successfully processed and persisted order [${normalizedOrderId}].`);
  } catch (error) {
    await transaction.rollback();
    logger.error(`Failed to process order [${normalizedOrderId}]. Rolling back transaction.`, {
      error: error.message,
      stack: error.stack,
      orderData,
    });
    throw error;
  }
};

module.exports = { processOrder };
