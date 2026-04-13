const { Sequelize } = require('sequelize');
const config = require('../config');
const logger = require('../services/logger');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: 'postgres',
  logging: (message) => logger.debug(message),
  pool: {
    max: 200,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

const db = {};

const modelDefiners = [
  require('./customer'),
  require('./order'),
  require('./orderItem'),
  require('./shippingAddress'),
];

for (const modelDefiner of modelDefiners) {
  const model = modelDefiner(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
}

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
