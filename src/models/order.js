const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Order extends Model {
    static associate(models) {
      this.belongsTo(models.Customer, {
        foreignKey: 'customerId',
        as: 'customer',
      });
      this.hasMany(models.OrderItem, {
        foreignKey: 'orderId',
        as: 'items',
      });
      this.hasOne(models.ShippingAddress, {
        foreignKey: 'orderId',
        as: 'shippingAddress',
      });
    }
  }

  Order.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      timestamp: DataTypes.DATE,
      totalAmount: DataTypes.DECIMAL(10, 2),
    },
    {
      sequelize,
      modelName: 'Order',
      tableName: 'orders',
      timestamps: false,
    }
  );

  return Order;
};
