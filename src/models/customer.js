const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Customer extends Model {
    static associate(models) {
      this.hasMany(models.Order, {
        foreignKey: 'customerId',
        as: 'orders',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }
  }

  Customer.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: 'Customer',
      tableName: 'customers',
      timestamps: true,
    }
  );

  return Customer;
};
