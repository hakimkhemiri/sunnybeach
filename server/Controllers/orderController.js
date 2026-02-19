import mongoose from 'mongoose';
import OrderModel from '../Models/orderModel.js';
import FoodItemModel from '../Models/foodItemModel.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-jwt-key-change-this-in-production';

function getUserIdFromToken(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.id;
  } catch {
    return null;
  }
}

export async function createOrder(req, res) {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not available.' });
    }
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { order_type, reservation_id, delivery_address, items } = req.body;

    if (!order_type || !['enligne', 'sur_place'].includes(order_type)) {
      return res.status(400).json({ error: 'order_type must be enligne or sur_place.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required.' });
    }
    if (order_type === 'sur_place' && !reservation_id) {
      return res.status(400).json({ error: 'reservation_id required for sur_place.' });
    }
    if (order_type === 'enligne' && (!delivery_address || !String(delivery_address).trim())) {
      return res.status(400).json({ error: 'delivery_address required for enligne.' });
    }

    const orderItems = [];
    let totalPrice = 0;
    for (const it of items) {
      const fid = it.food_item_id;
      const qty = parseInt(it.quantity, 10);
      const up = parseFloat(it.unit_price);
      if (!fid || !mongoose.Types.ObjectId.isValid(fid) || isNaN(qty) || qty < 1 || isNaN(up) || up < 0) {
        return res.status(400).json({ error: 'Invalid item: food_item_id, quantity, unit_price required.' });
      }
      const food = await FoodItemModel.findById(fid);
      if (!food || !food.available) {
        return res.status(400).json({ error: `Food item ${fid} not found or not available.` });
      }
      orderItems.push({ food_item_id: new mongoose.Types.ObjectId(fid), quantity: qty, unit_price: up });
      totalPrice += up * qty;
    }

    const doc = await OrderModel.create({
      user_id: userObjectId,
      reservation_id: order_type === 'sur_place' && reservation_id && mongoose.Types.ObjectId.isValid(reservation_id)
        ? new mongoose.Types.ObjectId(reservation_id)
        : undefined,
      order_type,
      total_price: Math.round(totalPrice * 100) / 100,
      status: 'pending',
      delivery_address: order_type === 'enligne' ? String(delivery_address).trim() : undefined,
      items: orderItems,
    });

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: doc._id.toString(),
        order_type: doc.order_type,
        total_price: doc.total_price,
        status: doc.status,
        created_at: doc.createdAt,
      },
    });
  } catch (err) {
    console.error('create order error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
