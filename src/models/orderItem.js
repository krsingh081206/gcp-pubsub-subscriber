const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class OrderItem extends Model {
    static associate(models) {
      this.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }
  }

  OrderItem.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      productId: DataTypes.STRING,
      productName: DataTypes.STRING,
      quantity: DataTypes.INTEGER,
      price: DataTypes.DECIMAL(10, 2),
      orderId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'orders',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
    },
    {
      sequelize,
      modelName: 'OrderItem',
      tableName: 'order_items',
      timestamps: false,
    }
  );

  return OrderItem;
};
