const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class ShippingAddress extends Model {
    static associate(models) {
      this.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }
  }

  ShippingAddress.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      street: DataTypes.STRING,
      city: DataTypes.STRING,
      zipCode: DataTypes.STRING,
      country: DataTypes.STRING,
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
      modelName: 'ShippingAddress',
      tableName: 'shipping_addresses',
      timestamps: false,
    }
  );

  return ShippingAddress;
};
