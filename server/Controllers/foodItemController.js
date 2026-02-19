import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FoodItemModel from '../Models/foodItemModel.js';
import UserModel from '../Models/userModel.js';
import jwt from 'jsonwebtoken';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
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

async function requireAdmin(req, res) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  let userObjectId;
  try {
    userObjectId = new mongoose.Types.ObjectId(userId);
  } catch {
    res.status(400).json({ error: 'Invalid user ID format' });
    return null;
  }
  const user = await UserModel.findById(userObjectId);
  if (!user || !user.is_admin) {
    res.status(403).json({ error: 'Admin access required' });
    return null;
  }
  return user;
}

function toFoodItemResponse(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  const id = o._id?.toString?.() || o.id;
  return {
    id: id,
    name: o.name,
    description: o.description || '',
    category: o.category,
    price: o.price,
    image_path: o.image_path || null,
    available: o.available !== false,
    created_at: o.createdAt || o.created_at,
  };
}

export async function getAll(req, res) {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not available.' });
    }
    const items = await FoodItemModel.find({ available: true }).sort({ category: 1, name: 1 }).lean();
    res.json({
      foodItems: items.map((m) => ({
        id: m._id.toString(),
        name: m.name,
        description: m.description || '',
        category: m.category,
        price: m.price,
        image_path: m.image_path || null,
        available: m.available !== false,
        created_at: m.createdAt,
      })),
    });
  } catch (err) {
    console.error('getAll food items error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}

export async function getAllAdmin(req, res) {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not available.' });
    }
    const user = await requireAdmin(req, res);
    if (!user) return;

    const items = await FoodItemModel.find().sort({ category: 1, name: 1 }).lean();
    res.json({
      foodItems: items.map((m) => ({
        id: m._id.toString(),
        name: m.name,
        description: m.description || '',
        category: m.category,
        price: m.price,
        image_path: m.image_path || null,
        available: m.available !== false,
        created_at: m.createdAt,
      })),
    });
  } catch (err) {
    console.error('getAllAdmin food items error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}

export async function create(req, res) {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not available.' });
    }
    const user = await requireAdmin(req, res);
    if (!user) return;

    const { name, description, category, price, available } = req.body;
    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required.' });
    }
    const categories = ['appetizer', 'main', 'dessert', 'drink'];
    if (!categories.includes(category)) {
      return res.status(400).json({ error: 'Category must be one of: appetizer, main, dessert, drink.' });
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: 'Price must be a non-negative number.' });
    }

    let image_path = null;
    if (req.file && req.file.filename) {
      image_path = req.file.filename;
    }

    const doc = await FoodItemModel.create({
      name: String(name).trim(),
      description: description ? String(description).trim() : '',
      category,
      price: numPrice,
      image_path,
      available: available === 'true' || available === true,
    });

    res.status(201).json({ foodItem: toFoodItemResponse(doc) });
  } catch (err) {
    console.error('create food item error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation error', message: err.message });
    }
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params;
    console.log('PUT /api/food-items update', id);

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not available.' });
    }
    const user = await requireAdmin(req, res);
    if (!user) return;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid food item ID.' });
    }

    const item = await FoodItemModel.findById(id);
    if (!item) {
      return res.status(404).json({ error: 'Food item not found.', id });
    }

    const { name, description, category, price, available, remove_image } = req.body;
    const categories = ['appetizer', 'main', 'dessert', 'drink'];

    if (name !== undefined && name !== null) {
      const s = String(name).trim();
      if (!s) return res.status(400).json({ error: 'Name cannot be empty.' });
      item.name = s;
    }
    if (description !== undefined && description !== null) item.description = String(description).trim();
    if (category !== undefined && category !== null) {
      if (!categories.includes(category)) {
        return res.status(400).json({ error: 'Category must be one of: appetizer, main, dessert, drink.' });
      }
      item.category = category;
    }
    if (price !== undefined && price !== null) {
      const numPrice = parseFloat(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return res.status(400).json({ error: 'Price must be a non-negative number.' });
      }
      item.price = numPrice;
    }
    if (available !== undefined && available !== null) {
      item.available = available === 'true' || available === true;
    }

    if (remove_image === 'true' || remove_image === true) {
      if (item.image_path) {
        const fp = path.join(UPLOADS_DIR, item.image_path);
        try {
          if (fs.existsSync(fp)) fs.unlinkSync(fp);
        } catch (e) {
          console.warn('Could not delete upload file:', fp, e);
        }
        item.image_path = null;
      }
    }
    if (req.file && req.file.filename) {
      if (item.image_path) {
        const fp = path.join(UPLOADS_DIR, item.image_path);
        try {
          if (fs.existsSync(fp)) fs.unlinkSync(fp);
        } catch (e) {
          console.warn('Could not delete old upload file:', fp, e);
        }
      }
      item.image_path = req.file.filename;
    }

    await item.save();
    res.json({ foodItem: toFoodItemResponse(item) });
  } catch (err) {
    console.error('update food item error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation error', message: err.message });
    }
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}

export async function remove(req, res) {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not available.' });
    }
    const user = await requireAdmin(req, res);
    if (!user) return;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid food item ID.' });
    }

    const item = await FoodItemModel.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ error: 'Food item not found.' });
    }

    if (item.image_path) {
      const fp = path.join(UPLOADS_DIR, item.image_path);
      try {
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      } catch (e) {
        console.warn('Could not delete upload file:', fp, e);
      }
    }

    res.json({ message: 'Food item deleted successfully.' });
  } catch (err) {
    console.error('delete food item error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
