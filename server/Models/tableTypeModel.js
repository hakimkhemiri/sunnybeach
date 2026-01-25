import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const TableTypeModel = sequelize.define(
  'TableType',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    capacity_min: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    capacity_max: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price_per_hour: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    tableName: 'table_types',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default TableTypeModel;
