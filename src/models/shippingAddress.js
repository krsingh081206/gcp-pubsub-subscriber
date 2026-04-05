const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class ShippingAddress extends Model {
    static associate(models) {
      this.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order',
      });
    }
  }

  ShippingAddress.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      street: DataTypes.STRING,
      city: DataTypes.STRING,
      zipCode: DataTypes.STRING,
      country: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'ShippingAddress',
      timestamps: false,
    }
  );

  return ShippingAddress;
};
