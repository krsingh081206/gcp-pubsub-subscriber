const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Order extends Model {
    static associate(models) {
      this.belongsTo(models.Customer, {
        foreignKey: 'customerId',
        as: 'customer',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
      this.hasMany(models.OrderItem, {
        foreignKey: 'orderId',
        as: 'items',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
      this.hasOne(models.ShippingAddress, {
        foreignKey: 'orderId',
        as: 'shippingAddress',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }
  }

  Order.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      sourceOrderId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'source_order_id',
        unique: true
      },
      timestamp: DataTypes.DATE,
      totalAmount: DataTypes.DECIMAL(10, 2),
      customerId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
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
