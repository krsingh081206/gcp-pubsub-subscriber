const { sequelize, Customer, Order, OrderItem, ShippingAddress } = require('../models');
const logger = require('../services/logger');

/**
 * Processes and persists an order event from a Pub/Sub message.
 * Implements idempotency by checking if the order already exists.
 * Uses a transaction to ensure all or nothing persistence.
 * @param {object} orderData - The parsed JSON data from the Pub/Sub message.
 */
const processOrder = async (orderData) => {
  const { orderId, timestamp, customer, items, totalAmount, shippingAddress } = orderData;

  const existingOrder = await Order.findByPk(orderId);
  if (existingOrder) {
    logger.warn(`Order [${orderId}] already exists. Skipping processing.`);
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
        id: orderId,
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

    await transaction.commit();
    logger.info(`Successfully processed and persisted order [${orderId}].`);
  } catch (error) {
    await transaction.rollback();
    logger.error(`Failed to process order [${orderId}]. Rolling back transaction.`, {
      error: error.message,
      stack: error.stack,
      orderData,
    });
    throw error;
  }
};

module.exports = { processOrder };
