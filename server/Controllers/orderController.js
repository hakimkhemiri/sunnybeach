import mongoose from 'mongoose';
import OrderModel from '../Models/orderModel.js';
import FoodItemModel from '../Models/foodItemModel.js';
import ReservationModel from '../Models/reservationModel.js';
import UserModel from '../Models/userModel.js';
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
    const { reservation_id, items } = req.body;

    if (!reservation_id || !mongoose.Types.ObjectId.isValid(reservation_id)) {
      return res.status(400).json({ error: 'Veuillez sélectionner une réservation valide.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Au moins un article est requis.' });
    }

    // Validate reservation belongs to user and is accepted
    const reservation = await ReservationModel.findById(reservation_id);
    if (!reservation) {
      return res.status(404).json({ error: 'Réservation introuvable.' });
    }
    if (reservation.user_id.toString() !== userObjectId.toString()) {
      return res.status(403).json({ error: 'Cette réservation ne vous appartient pas.' });
    }
    if (reservation.status !== 'accepted') {
      return res.status(400).json({ error: 'La réservation doit être acceptée pour passer commande.' });
    }

    // Validate reservation date is today or in the future
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const resDate = new Date(reservation.reservation_date);
    const resDateUTC = new Date(Date.UTC(resDate.getUTCFullYear(), resDate.getUTCMonth(), resDate.getUTCDate(), 0, 0, 0));
    if (resDateUTC < todayUTC) {
      return res.status(400).json({ error: 'Impossible de commander pour une réservation passée.' });
    }

    const orderItems = [];
    let totalPrice = 0;
    for (const it of items) {
      const fid = it.food_item_id;
      const qty = parseInt(it.quantity, 10);
      const up = parseFloat(it.unit_price);
      if (!fid || !mongoose.Types.ObjectId.isValid(fid) || isNaN(qty) || qty < 1 || isNaN(up) || up < 0) {
        return res.status(400).json({ error: 'Article invalide: food_item_id, quantity, unit_price requis.' });
      }
      const food = await FoodItemModel.findById(fid);
      if (!food || !food.available) {
        return res.status(400).json({ error: `Article ${fid} introuvable ou indisponible.` });
      }
      orderItems.push({ food_item_id: new mongoose.Types.ObjectId(fid), quantity: qty, unit_price: up });
      totalPrice += up * qty;
    }

    const doc = await OrderModel.create({
      user_id: userObjectId,
      reservation_id: new mongoose.Types.ObjectId(reservation_id),
      total_price: Math.round(totalPrice * 100) / 100,
      status: 'pending',
      items: orderItems,
    });

    res.status(201).json({
      message: 'Commande créée avec succès',
      order: {
        id: doc._id.toString(),
        reservation_id: doc.reservation_id.toString(),
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

// Get all orders for today (admin only)
export async function getTodayOrders(req, res) {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not available.' });
    }
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await UserModel.findById(userId);
    if (!user || !user.is_admin) return res.status(403).json({ error: 'Admin access required' });

    // Get today's date range (UTC)
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    // Find all orders where the linked reservation is for today
    const orders = await OrderModel.find()
      .populate('user_id', 'email first_name last_name')
      .populate('reservation_id', 'table_type reservation_date num_people')
      .populate('items.food_item_id', 'name price category')
      .sort({ createdAt: -1 })
      .lean();

    // Filter to only orders whose reservation is today
    const todayOrders = orders.filter(order => {
      if (!order.reservation_id || !order.reservation_id.reservation_date) return false;
      const resDate = new Date(order.reservation_id.reservation_date);
      const resDateUTC = new Date(Date.UTC(resDate.getUTCFullYear(), resDate.getUTCMonth(), resDate.getUTCDate(), 0, 0, 0));
      return resDateUTC >= today && resDateUTC < tomorrow;
    });

    const mapped = todayOrders.map(order => ({
      id: order._id.toString(),
      user: order.user_id ? {
        email: order.user_id.email || '',
        first_name: order.user_id.first_name || '',
        last_name: order.user_id.last_name || '',
      } : null,
      reservation: order.reservation_id ? {
        table_type: order.reservation_id.table_type || '',
        reservation_date: order.reservation_id.reservation_date,
        num_people: order.reservation_id.num_people || 0,
      } : null,
      items: (order.items || []).map(it => ({
        name: it.food_item_id?.name || 'Inconnu',
        quantity: it.quantity,
        unit_price: it.unit_price,
        subtotal: it.quantity * it.unit_price,
      })),
      total_price: order.total_price,
      status: order.status,
      created_at: order.createdAt,
    }));

    res.json({ orders: mapped });
  } catch (err) {
    console.error('getTodayOrders error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}

// Get current user's orders (client)
export async function getMyOrders(req, res) {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not available.' });
    }
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const orders = await OrderModel.find({ user_id: new mongoose.Types.ObjectId(userId) })
      .populate('reservation_id', 'table_type reservation_date num_people')
      .populate('items.food_item_id', 'name price category')
      .sort({ createdAt: -1 })
      .lean();

    const mapped = orders.map(order => ({
      id: order._id.toString(),
      reservation_id: order.reservation_id ? order.reservation_id._id.toString() : null,
      reservation: order.reservation_id ? {
        table_type: order.reservation_id.table_type,
        reservation_date: order.reservation_id.reservation_date,
        num_people: order.reservation_id.num_people,
      } : null,
      total_price: order.total_price,
      status: order.status,
      created_at: order.createdAt,
      items: (order.items || []).map(it => ({
        name: it.food_item_id?.name || 'Article inconnu',
        price: it.food_item_id?.price || it.unit_price,
        quantity: it.quantity,
        subtotal: it.quantity * (it.unit_price || 0),
      })),
    }));

    res.json({ orders: mapped });
  } catch (err) {
    console.error('getMyOrders error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}

// Update order status (admin only)
export async function updateOrderStatus(req, res) {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not available.' });
    }
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await UserModel.findById(userId);
    if (!user || !user.is_admin) return res.status(403).json({ error: 'Admin access required' });

    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'ready', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide.' });
    }

    const order = await OrderModel.findById(id);
    if (!order) return res.status(404).json({ error: 'Commande introuvable.' });

    order.status = status;
    await order.save();

    res.json({
      message: 'Statut mis à jour',
      order: { id: order._id.toString(), status: order.status },
    });
  } catch (err) {
    console.error('updateOrderStatus error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
