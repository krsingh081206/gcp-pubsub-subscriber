const { sequelize } = require('../models');
const config = require('../config');
const logger = require('../services/logger');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const findExistingOrder = async (sourceOrderId) => {
  const [orderRecords] = await sequelize.query(
    `
      SELECT id, source_order_id AS "sourceOrderId"
      FROM orders
      WHERE source_order_id = $sourceOrderId
      LIMIT 1
    `,
    {
      bind: {
        sourceOrderId,
      },
    }
  );

  return orderRecords[0] || null;
};

const getOrInsertCustomer = async (customer, transaction) => {
  const [customerRecords] = await sequelize.query(
    `
      INSERT INTO customers (name, email, "createdAt", "updatedAt")
      VALUES ($name, $email, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE
        SET email = EXCLUDED.email
      RETURNING id, name, email, "createdAt", "updatedAt"
    `,
    {
      bind: {
        name: customer.name,
        email: customer.email,
      },
      transaction,
    }
  );

  return customerRecords[0];
};

const createOrder = async ({ sourceOrderId, timestamp, totalAmount, customerId }, transaction) => {
  const [orderRecords] = await sequelize.query(
    `
      INSERT INTO orders (source_order_id, "timestamp", "totalAmount", "customerId")
      VALUES ($sourceOrderId, $timestamp, $totalAmount, $customerId)
      ON CONFLICT (source_order_id) DO NOTHING
      RETURNING id, source_order_id AS "sourceOrderId", "timestamp", "totalAmount", "customerId"
    `,
    {
      bind: {
        sourceOrderId,
        timestamp,
        totalAmount,
        customerId,
      },
      transaction,
    }
  );

  return orderRecords[0] || null;
};

const createShippingAddress = async (shippingAddress, orderId, transaction) => {
  const [addressRecords] = await sequelize.query(
    `
      INSERT INTO shipping_addresses (street, city, "zipCode", country, "orderId")
      VALUES ($street, $city, $zipCode, $country, $orderId)
      RETURNING id, street, city, "zipCode", country, "orderId"
    `,
    {
      bind: {
        street: shippingAddress.street,
        city: shippingAddress.city,
        zipCode: shippingAddress.zipCode,
        country: shippingAddress.country,
        orderId,
      },
      transaction,
    }
  );

  return addressRecords[0];
};

const createOrderItems = async (items, orderId, transaction) => {
  if (!items.length) {
    return [];
  }

  const bind = {};
  const values = items.map((item, index) => {
    bind[`productId${index}`] = item.productId;
    bind[`productName${index}`] = item.productName;
    bind[`quantity${index}`] = item.quantity;
    bind[`price${index}`] = item.price;
    bind[`orderId${index}`] = orderId;

    return `($productId${index}, $productName${index}, $quantity${index}, $price${index}, $orderId${index})`;
  });

  const [itemRecords] = await sequelize.query(
    `
      INSERT INTO order_items ("productId", "productName", quantity, price, "orderId")
      VALUES ${values.join(', ')}
      RETURNING id, "productId", "productName", quantity, price, "orderId"
    `,
    {
      bind,
      transaction,
    }
  );

  return itemRecords;
};

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

  const existingOrder = await findExistingOrder(sourceOrderId);
  if (existingOrder) {
    logger.warn(`Order with source_order_id [${sourceOrderId}] already exists as id [${existingOrder.id}]. Skipping processing.`);
    return;
  }

  const transaction = await sequelize.transaction();

  try {
    const customerRecord = await getOrInsertCustomer(customer, transaction);

    const orderRecord = await createOrder(
      {
        sourceOrderId,
        timestamp,
        totalAmount,
        customerId: customerRecord.id,
      },
      transaction
    );

    if (!orderRecord) {
      await transaction.rollback();
      logger.warn(`Order with source_order_id [${sourceOrderId}] already exists. Skipping processing.`);
      return;
    }

    await createShippingAddress(shippingAddress, orderRecord.id, transaction);
    await createOrderItems(items, orderRecord.id, transaction);

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
