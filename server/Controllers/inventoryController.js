import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import InventoryModel from '../Models/inventoryModel.js';
import ReservationModel from '../Models/reservationModel.js';
import UserModel from '../Models/userModel.js';

class InventoryController {
  // Get user ID from token
  static getUserIdFromToken(req) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return null;
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-jwt-key-change-this-in-production'
      );
      return decoded.id;
    } catch (error) {
      return null;
    }
  }

  // Get inventory (public — so clients can see totals)
  static async getInventory(req, res) {
    try {
      const inventory = await InventoryModel.find({});
      // Return all three types, defaulting to 0 if not set
      const types = ['Parasol', 'Mini Cabane', 'Cabane'];
      const result = types.map(type => {
        const found = inventory.find(i => i.table_type === type);
        return {
          table_type: type,
          total_count: found ? found.total_count : 0
        };
      });
      res.json({ inventory: result });
    } catch (error) {
      console.error('Get inventory error:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  // Update inventory (admin only)
  static async updateInventory(req, res) {
    try {
      const userId = InventoryController.getUserIdFromToken(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const user = await UserModel.findById(userId);
      if (!user || !user.is_admin) return res.status(403).json({ error: 'Admin access required' });

      const { inventory } = req.body; // [{ table_type, total_count }]
      if (!Array.isArray(inventory)) {
        return res.status(400).json({ error: 'inventory must be an array' });
      }

      const results = [];
      for (const item of inventory) {
        if (!item.table_type || item.total_count === undefined) continue;
        const updated = await InventoryModel.findOneAndUpdate(
          { table_type: item.table_type },
          { total_count: Math.max(0, parseInt(item.total_count)) },
          { upsert: true, new: true }
        );
        results.push(updated);
      }

      res.json({ inventory: results });
    } catch (error) {
      console.error('Update inventory error:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  // Get availability for a given date (public)
  // Returns how many of each type are free on that date
  static async getAvailability(req, res) {
    try {
      const { date } = req.query;
      if (!date) {
        return res.status(400).json({ error: 'date query parameter is required (YYYY-MM-DD)' });
      }

      const dp = date.split('-');
      const dateObj = new Date(Date.UTC(parseInt(dp[0]), parseInt(dp[1]) - 1, parseInt(dp[2]), 0, 0, 0));
      const nextDay = new Date(dateObj);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);

      // Get inventory totals
      const inventory = await InventoryModel.find({});
      const types = ['Parasol', 'Mini Cabane', 'Cabane'];

      const result = [];
      for (const type of types) {
        const found = inventory.find(i => i.table_type === type);
        const total = found ? found.total_count : 0;

        // Count active reservations for this type and date
        const reserved = await ReservationModel.countDocuments({
          table_type: type,
          reservation_date: { $gte: dateObj, $lt: nextDay },
          status: { $in: ['pending', 'confirmed', 'accepted'] }
        });

        result.push({
          table_type: type,
          total: total,
          reserved: reserved,
          available: Math.max(0, total - reserved)
        });
      }

      res.json({ availability: result, date });
    } catch (error) {
      console.error('Get availability error:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  // Admin: get detailed view of all units for a date
  // Returns each individual unit (numbered) and whether it's free or reserved
  static async getUnitsForDate(req, res) {
    try {
      const userId = InventoryController.getUserIdFromToken(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const user = await UserModel.findById(userId);
      if (!user || !user.is_admin) return res.status(403).json({ error: 'Admin access required' });

      const { date } = req.query;
      if (!date) {
        return res.status(400).json({ error: 'date query parameter is required (YYYY-MM-DD)' });
      }

      const dp2 = date.split('-');
      const dateObj = new Date(Date.UTC(parseInt(dp2[0]), parseInt(dp2[1]) - 1, parseInt(dp2[2]), 0, 0, 0));
      const nextDay = new Date(dateObj);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);

      const inventory = await InventoryModel.find({});
      const types = ['Parasol', 'Mini Cabane', 'Cabane'];

      // Get all reservations for that date
      const reservations = await ReservationModel.find({
        reservation_date: { $gte: dateObj, $lt: nextDay },
        status: { $in: ['pending', 'confirmed', 'accepted'] }
      }).populate('user_id', 'email first_name last_name');

      const result = [];
      for (const type of types) {
        const found = inventory.find(i => i.table_type === type);
        const total = found ? found.total_count : 0;

        // Get reservations for this type
        const typeReservations = reservations
          .filter(r => r.table_type === type)
          .map(r => {
            const obj = r.toObject();
            return {
              id: r._id.toString(),
              user_id: obj.user_id,
              num_people: obj.num_people,
              total_price: obj.total_price,
              status: obj.status
            };
          });

        // Build units array: each unit is numbered 1..total
        const units = [];
        for (let i = 1; i <= total; i++) {
          const reservation = i <= typeReservations.length ? typeReservations[i - 1] : null;
          units.push({
            unit_number: i,
            status: reservation ? 'reserved' : 'free',
            reservation: reservation
          });
        }

        result.push({
          table_type: type,
          total: total,
          reserved: typeReservations.length,
          available: Math.max(0, total - typeReservations.length),
          units: units
        });
      }

      res.json({ units: result, date });
    } catch (error) {
      console.error('Get units error:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  // Admin: create a walk-in reservation (sur place)
  static async createWalkInReservation(req, res) {
    try {
      const userId = InventoryController.getUserIdFromToken(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const user = await UserModel.findById(userId);
      if (!user || !user.is_admin) return res.status(403).json({ error: 'Admin access required' });

      const { table_type, date, num_people, client_name } = req.body;
      if (!table_type || !date) {
        return res.status(400).json({ error: 'table_type and date are required' });
      }

      const dp3 = date.split('-');
      const dateObj = new Date(Date.UTC(parseInt(dp3[0]), parseInt(dp3[1]) - 1, parseInt(dp3[2]), 0, 0, 0));
      const nextDay = new Date(dateObj);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);

      // Check availability
      const inventory = await InventoryModel.findOne({ table_type });
      const total = inventory ? inventory.total_count : 0;

      const reserved = await ReservationModel.countDocuments({
        table_type,
        reservation_date: { $gte: dateObj, $lt: nextDay },
        status: { $in: ['pending', 'confirmed', 'accepted'] }
      });

      if (reserved >= total) {
        return res.status(400).json({ error: `Aucun(e) ${table_type} disponible pour cette date` });
      }

      // Static table types for pricing
      const TABLE_TYPES = [
        { name: 'Parasol', price: 15.00 },
        { name: 'Mini Cabane', price: 25.00 },
        { name: 'Cabane', price: 35.00 },
      ];
      const typeInfo = TABLE_TYPES.find(t => t.name === table_type);
      const totalPrice = typeInfo ? typeInfo.price : 0;

      // Create reservation under the admin user (walk-in)
      const reservation = await ReservationModel.create({
        user_id: new mongoose.Types.ObjectId(userId),
        table_type,
        reservation_date: dateObj,
        num_people: parseInt(num_people) || 1,
        total_price: totalPrice,
        status: 'accepted', // Walk-in = immediately accepted
      });

      res.status(201).json({
        message: 'Réservation sur place créée',
        reservation: {
          ...reservation.toObject(),
          id: reservation._id.toString(),
          client_name: client_name || 'Sur place'
        }
      });
    } catch (error) {
      console.error('Walk-in reservation error:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }
}

export default InventoryController;
