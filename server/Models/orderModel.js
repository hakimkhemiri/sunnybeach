import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  food_item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem', required: true },
  quantity: { type: Number, required: true, min: 1 },
  unit_price: { type: Number, required: true, min: 0 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reservation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', required: true },
  total_price: { type: Number, required: true, min: 0 },
  status: { type: String, default: 'pending', enum: ['pending', 'confirmed', 'ready', 'completed'] },
  items: [orderItemSchema],
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
