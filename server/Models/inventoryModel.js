import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  table_type: {
    type: String,
    required: true,
    unique: true,
    enum: ['Parasol', 'Mini Cabane', 'Cabane']
  },
  total_count: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  }
}, {
  timestamps: true
});

const InventoryModel = mongoose.model('Inventory', inventorySchema);

export default InventoryModel;
