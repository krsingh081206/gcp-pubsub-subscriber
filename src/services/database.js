const db = require('../models');
const logger = require('./logger');

const connectDatabase = async () => {
  await db.sequelize.authenticate();
  await db.sequelize.sync();
  logger.info('Database connection established and models synchronized.');
};

const closeDatabase = async () => {
  await db.sequelize.close();
  logger.info('Database connection closed.');
};

module.exports = {
  connectDatabase,
  closeDatabase,
};
