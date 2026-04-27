const db = require('../models');
const logger = require('./logger');

const connectDatabase = async () => {
  await db.sequelize.authenticate();
  logger.info('Database connection established.');
};

const closeDatabase = async () => {
  await db.sequelize.close();
  logger.info('Database connection closed.');
};

module.exports = {
  connectDatabase,
  closeDatabase,
};
