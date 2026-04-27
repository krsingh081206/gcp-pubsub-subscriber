const { sequelize, Customer, Order, OrderItem, ShippingAddress } = require('../models');
const config = require('../config');
const logger = require('../services/logger');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getBigintOrderId = (orderId) => {
  if (orderId === undefined || orderId === null) {
    return undefined;
  }

  if (typeof orderId === 'number') {
    return Number.isSafeInteger(orderId) && orderId > 0 ? orderId : undefined;
  }

  if (typeof orderId === 'string' && /^[1-9]\d*$/.test(orderId)) {
    return orderId;
  }

  return undefined;
};

/**
 * Processes and persists an order event from a Pub/Sub message.
 * Implements idempotency for numeric source order ids by checking if the order already exists.
 * Uses a transaction to ensure all or nothing persistence.
 * @param {object} orderData - The parsed JSON data from the Pub/Sub message.
 */
const processOrder = async (orderData) => {
  const { orderId, timestamp, customer, items, totalAmount, shippingAddress } = orderData;
  const sourceOrderId = getBigintOrderId(orderId);
  const orderLogId = sourceOrderId || orderId || 'missing';

  if (!sourceOrderId) {
    throw new Error(`Incoming orderId [${orderId}] is required and must be a positive bigint.`);
  }

  const existingOrder = await Order.findOne({ where: { sourceOrderId } });
  if (existingOrder) {
    logger.warn(`Order with source_order_id [${sourceOrderId}] already exists as id [${existingOrder.id}]. Skipping processing.`);
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
        sourceOrderId,
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
      logger.info(`Holding transaction open for ${config.processingDelayMs}ms for order [${orderRecord.id}].`);
      await sleep(config.processingDelayMs);
    }

    await transaction.commit();
    logger.info(`Successfully processed and persisted order [${orderLogId}].`);
  } catch (error) {
    await transaction.rollback();
    logger.error(`Failed to process order [${orderLogId}]. Rolling back transaction.`, {
      error: error.message,
      stack: error.stack,
      orderData,
    });
    throw error;
  }
};

module.exports = { processOrder };
