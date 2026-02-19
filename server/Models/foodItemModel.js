import mongoose from 'mongoose';

const categoryEnum = ['appetizer', 'main', 'dessert', 'drink'];

const foodItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  category: { type: String, required: true, enum: categoryEnum },
  price: { type: Number, required: true, min: 0 },
  image_path: { type: String, trim: true, default: null },
  available: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('FoodItem', foodItemSchema);
