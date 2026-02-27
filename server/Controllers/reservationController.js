import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import ReservationModel from '../Models/reservationModel.js';
import UserModel from '../Models/userModel.js';
import InventoryModel from '../Models/inventoryModel.js';

// Static table types
const TABLE_TYPES = [
  { name: 'Parasol', capacity_min: 1, capacity_max: 4, price_per_hour: 15.00 },
  { name: 'Mini Cabane', capacity_min: 1, capacity_max: 5, price_per_hour: 25.00 },
  { name: 'Cabane', capacity_min: 1, capacity_max: 20, price_per_hour: 35.00 },
];

class ReservationController {
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

  // Get available table types (static)
  static async getTableTypes(req, res) {
    try {
      res.json({ tableTypes: TABLE_TYPES });
    } catch (error) {
      console.error('Get table types error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Create a new reservation
  static async createReservation(req, res) {
    try {
      // Check MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        console.error('❌ MongoDB not connected! ReadyState:', mongoose.connection.readyState);
        return res.status(503).json({ error: 'Database not available. Please check MongoDB connection.' });
      }

      const userId = this.getUserIdFromToken(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log('📝 Creating reservation for user:', userId);

      const { table_type, reservation_date, num_people } = req.body;

      console.log('📋 Reservation data:', { table_type, reservation_date, num_people });

      // Validate input (reservation = full day, fixed price, no start/end time)
      if (!table_type || !reservation_date || !num_people) {
        return res.status(400).json({
          error: 'Champs requis : type de table, date de réservation, nombre de personnes'
        });
      }

      // Find table type
      const tableTypeInfo = TABLE_TYPES.find(t => t.name === table_type);
      if (!tableTypeInfo) {
        return res.status(400).json({ error: 'Invalid table type' });
      }

      // Validate number of people
      if (num_people < tableTypeInfo.capacity_min || num_people > tableTypeInfo.capacity_max) {
        return res.status(400).json({
          error: `Number of people must be between ${tableTypeInfo.capacity_min} and ${tableTypeInfo.capacity_max} for ${table_type}`
        });
      }

      // Fixed price per day (price_per_hour used as daily rate)
      const totalPrice = parseFloat(parseFloat(tableTypeInfo.price_per_hour).toFixed(2));

      // Convert reservation_date to Date object (UTC to avoid timezone shift)
      // Parse as YYYY-MM-DD → UTC noon, then build UTC day range
      const parts = reservation_date.split('-');
      const dateObj = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0));
      const startOfDay = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 0, 0, 0));
      const nextDay = new Date(startOfDay);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);

      // Check for overlapping reservations based on inventory
      const inventory = await InventoryModel.findOne({ table_type });
      const totalAvailable = inventory ? inventory.total_count : 0;

      if (totalAvailable === 0) {
        return res.status(400).json({
          error: `Aucun(e) ${table_type} n'est configuré(e). Veuillez contacter l'administration.`
        });
      }

      const reservedCount = await ReservationModel.countDocuments({
        table_type,
        reservation_date: {
          $gte: startOfDay,
          $lt: nextDay
        },
        status: { $in: ['pending', 'confirmed', 'accepted'] },
      });

      if (reservedCount >= totalAvailable) {
        return res.status(400).json({
          error: `Tous les ${table_type}s sont réservés pour cette date (${reservedCount}/${totalAvailable})`
        });
      }

      // Convert userId to ObjectId
      let userObjectId;
      try {
        userObjectId = new mongoose.Types.ObjectId(userId);
      } catch (err) {
        console.error('Invalid userId format:', userId);
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      // Verify user exists
      const userExists = await UserModel.findById(userObjectId);
      if (!userExists) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Create reservation (full day, default times stored for compatibility)
      const reservation = await ReservationModel.create({
        user_id: userObjectId,
        table_type,
        reservation_date: dateObj,
        num_people: parseInt(num_people),
        total_price: totalPrice,
        status: 'pending',
      });

      // Populate user data
      await reservation.populate('user_id', 'email first_name last_name');

      const reservationObj = reservation.toObject();
      
      // Format response
      const response = {
        ...reservationObj,
        id: reservation._id.toString(),
        user_id: reservationObj.user_id && reservationObj.user_id._id 
          ? reservationObj.user_id._id.toString() 
          : (reservationObj.user_id ? reservationObj.user_id.toString() : userObjectId.toString())
      };
      
      console.log('✅ Reservation created successfully:', response.id);
      res.status(201).json({
        message: 'Reservation created successfully',
        reservation: response
      });
    } catch (error) {
      console.error('❌ Create reservation error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      if (error.errors) {
        console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
      }
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Get all reservations for the current user
  static async getMyReservations(req, res) {
    try {
      // Check MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        console.error('❌ MongoDB not connected! ReadyState:', mongoose.connection.readyState);
        return res.status(503).json({ error: 'Database not available. Please check MongoDB connection.' });
      }

      const userId = this.getUserIdFromToken(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log('📋 Getting reservations for user:', userId);

      // Convert userId to ObjectId
      let userObjectId;
      try {
        userObjectId = new mongoose.Types.ObjectId(userId);
      } catch (err) {
        console.error('Invalid userId format:', userId);
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      const reservations = await ReservationModel.find({ user_id: userObjectId })
        .populate('user_id', 'email first_name last_name')
        .sort({ reservation_date: -1, start_time: -1 });

      console.log(`✅ Found ${reservations.length} reservations`);

      res.json({ 
        reservations: reservations.map(r => {
          const obj = r.toObject();
          const reservationDate = obj.reservation_date instanceof Date 
            ? obj.reservation_date.toISOString().split('T')[0]
            : (typeof obj.reservation_date === 'string' ? obj.reservation_date.split('T')[0] : obj.reservation_date);
          
          return {
            ...obj,
            id: r._id.toString(),
            reservation_date: reservationDate
          };
        })
      });
    } catch (error) {
      console.error('❌ Get reservations error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Get a single reservation by ID
  static async getReservationById(req, res) {
    try {
      const userId = this.getUserIdFromToken(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const reservation = await ReservationModel.findById(id)
        .populate('user_id', 'email first_name last_name');

      if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }

      // Check if user owns this reservation or is admin
      const user = await UserModel.findById(userId);
      const userObjectId = new mongoose.Types.ObjectId(userId);
      if (reservation.user_id.toString() !== userObjectId.toString() && !user?.is_admin) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({ 
        reservation: {
          ...reservation.toObject(),
          id: reservation._id.toString()
        }
      });
    } catch (error) {
      console.error('Get reservation error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Update a reservation
  static async updateReservation(req, res) {
    try {
      // Check MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        console.error('❌ MongoDB not connected! ReadyState:', mongoose.connection.readyState);
        return res.status(503).json({ error: 'Database not available. Please check MongoDB connection.' });
      }

      const userId = ReservationController.getUserIdFromToken(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid reservation ID format' });
      }

      const reservation = await ReservationModel.findById(id);

      if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }

      // Convert userId to ObjectId
      let userObjectId;
      try {
        userObjectId = new mongoose.Types.ObjectId(userId);
      } catch (err) {
        console.error('Invalid userId format:', userId);
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      // Check if user owns this reservation or is admin
      const user = await UserModel.findById(userObjectId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (reservation.user_id.toString() !== userObjectId.toString() && !user?.is_admin) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { table_type, reservation_date, start_time, end_time, num_people, status } = req.body;

      console.log('📝 Updating reservation:', id, 'Status:', status, 'Is Admin:', user.is_admin);

      // Update fields if provided
      if (table_type !== undefined) {
        const tableTypeInfo = TABLE_TYPES.find(t => t.name === table_type);
        if (!tableTypeInfo) {
          return res.status(400).json({ error: 'Invalid table type' });
        }
        reservation.table_type = table_type;
      }

      if (reservation_date !== undefined) {
        const dp = reservation_date.split('-');
        reservation.reservation_date = new Date(Date.UTC(parseInt(dp[0]), parseInt(dp[1]) - 1, parseInt(dp[2]), 12, 0, 0));
      }
      if (start_time !== undefined) reservation.start_time = start_time;
      if (end_time !== undefined) reservation.end_time = end_time;
      if (num_people !== undefined) reservation.num_people = num_people;
      if (status !== undefined && user?.is_admin) {
        // Admin can change status to 'accepted' or 'denied' from 'confirmed'
        if (status === 'accepted' || status === 'denied') {
          if (reservation.status === 'confirmed') {
            reservation.status = status;
            console.log(`✅ Admin ${user.is_admin ? 'is admin' : 'is not admin'} changing status from 'confirmed' to '${status}'`);
          } else {
            console.log(`⚠️ Cannot change status from '${reservation.status}' to '${status}'. Only 'confirmed' reservations can be accepted/denied.`);
            return res.status(400).json({ 
              error: `Cannot change status from '${reservation.status}' to '${status}'. Only 'confirmed' reservations can be accepted or denied.` 
            });
          }
        } else {
          console.log(`⚠️ Invalid status for admin: '${status}'. Admin can only set 'accepted' or 'denied'.`);
          return res.status(400).json({ 
            error: `Invalid status '${status}'. Admin can only set status to 'accepted' or 'denied'.` 
          });
        }
      } else if (status !== undefined && !user?.is_admin) {
        return res.status(403).json({ error: 'Only admins can change reservation status' });
      }

      // Recalculate fixed daily price if table type changed
      if (table_type !== undefined) {
        const currentTableType = TABLE_TYPES.find(t => t.name === reservation.table_type);
        if (currentTableType) {
          reservation.total_price = parseFloat(parseFloat(currentTableType.price_per_hour).toFixed(2));
        }
      }

      await reservation.save();
      await reservation.populate('user_id', 'email first_name last_name');

      console.log('✅ Reservation updated successfully:', reservation._id, 'New status:', reservation.status);

      res.json({
        message: 'Reservation updated successfully',
        reservation: {
          ...reservation.toObject(),
          id: reservation._id.toString()
        }
      });
    } catch (error) {
      console.error('❌ Update reservation error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Confirm a reservation
  static async confirmReservation(req, res) {
    try {
      // Check MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        console.error('❌ MongoDB not connected! ReadyState:', mongoose.connection.readyState);
        return res.status(503).json({ error: 'Database not available. Please check MongoDB connection.' });
      }

      const userId = this.getUserIdFromToken(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      console.log('✅ Confirming reservation:', id);

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid reservation ID format' });
      }

      const reservation = await ReservationModel.findById(id);

      if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }

      // Check if user owns this reservation or is admin
      const user = await UserModel.findById(userId);
      const userObjectId = new mongoose.Types.ObjectId(userId);
      if (reservation.user_id.toString() !== userObjectId.toString() && !user?.is_admin) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Allow admins to confirm any non-cancelled reservation, users can only confirm pending
      if (reservation.status !== 'pending' && !user?.is_admin) {
        return res.status(400).json({ 
          error: `Cannot confirm reservation with status: ${reservation.status}` 
        });
      }
      
      // Don't allow confirming already cancelled reservations
      if (reservation.status === 'cancelled') {
        return res.status(400).json({ 
          error: 'Cannot confirm a cancelled reservation' 
        });
      }

      reservation.status = 'confirmed';
      await reservation.save();
      await reservation.populate('user_id', 'email first_name last_name');

      console.log('✅ Reservation confirmed successfully');

      res.json({
        message: 'Reservation confirmed successfully',
        reservation: {
          ...reservation.toObject(),
          id: reservation._id.toString()
        }
      });
    } catch (error) {
      console.error('❌ Confirm reservation error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Cancel a reservation
  static async cancelReservation(req, res) {
    try {
      // Check MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        console.error('❌ MongoDB not connected! ReadyState:', mongoose.connection.readyState);
        return res.status(503).json({ error: 'Database not available. Please check MongoDB connection.' });
      }

      const userId = this.getUserIdFromToken(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      console.log('🗑️ Cancelling reservation:', id);

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid reservation ID format' });
      }

      const reservation = await ReservationModel.findById(id);

      if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }

      // Check if user owns this reservation or is admin
      const user = await UserModel.findById(userId);
      const userObjectId = new mongoose.Types.ObjectId(userId);
      if (reservation.user_id.toString() !== userObjectId.toString() && !user?.is_admin) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (reservation.status === 'cancelled') {
        return res.status(400).json({ error: 'Reservation is already cancelled' });
      }

      // Prevent cancelling confirmed reservations (unless admin)
      if (reservation.status === 'confirmed' && !user?.is_admin) {
        return res.status(400).json({ error: 'Cannot cancel a confirmed reservation' });
      }

      reservation.status = 'cancelled';
      await reservation.save();
      await reservation.populate('user_id', 'email first_name last_name');

      console.log('✅ Reservation cancelled successfully');

      res.json({
        message: 'Reservation cancelled successfully',
        reservation: {
          ...reservation.toObject(),
          id: reservation._id.toString()
        }
      });
    } catch (error) {
      console.error('❌ Cancel reservation error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Get all reservations (admin only)
  static async getAllReservations(req, res) {
    try {
      // Check MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        console.error('❌ MongoDB not connected! ReadyState:', mongoose.connection.readyState);
        return res.status(503).json({ error: 'Database not available. Please check MongoDB connection.' });
      }

      const userId = ReservationController.getUserIdFromToken(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Convert userId to ObjectId
      let userObjectId;
      try {
        userObjectId = new mongoose.Types.ObjectId(userId);
      } catch (err) {
        console.error('Invalid userId format:', userId);
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      const user = await UserModel.findById(userObjectId);
      if (!user || !user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      console.log('📋 Getting all reservations for admin:', user.email);

      try {
        // Admin only sees confirmed, accepted, and denied reservations (not pending or cancelled by user)
        const reservationsRaw = await ReservationModel.find({
          status: { $in: ['confirmed', 'accepted', 'denied'] }
        })
          .sort({ reservation_date: -1, start_time: -1 })
          .lean();

        console.log(`✅ Found ${reservationsRaw.length} reservations (raw)`);

        // Now populate user data separately to avoid issues
        const reservations = [];
        for (const r of reservationsRaw) {
          try {
            // Get user data if user_id exists
            let userData = null;
            if (r.user_id) {
              try {
                const user = await UserModel.findById(r.user_id)
                  .select('email first_name last_name')
                  .lean();
                if (user) {
                  userData = {
                    id: user._id.toString(),
                    email: user.email || '',
                    first_name: user.first_name || '',
                    last_name: user.last_name || ''
                  };
                }
              } catch (userError) {
                console.error('Error fetching user for reservation:', r._id, userError);
              }
            }

            // Format reservation date
            let reservationDate;
            if (r.reservation_date instanceof Date) {
              reservationDate = r.reservation_date.toISOString().split('T')[0];
            } else if (typeof r.reservation_date === 'string') {
              reservationDate = r.reservation_date.split('T')[0];
            } else {
              reservationDate = r.reservation_date;
            }

            reservations.push({
              id: r._id.toString(),
              user_id: userData || r.user_id?.toString() || r.user_id,
              table_type: r.table_type,
              reservation_date: reservationDate,
              start_time: r.start_time,
              end_time: r.end_time,
              num_people: r.num_people,
              total_price: r.total_price,
              status: r.status || 'pending',
              created_at: r.createdAt,
              updated_at: r.updatedAt
            });
          } catch (mapError) {
            console.error('Error mapping reservation:', mapError);
            console.error('Reservation ID:', r._id);
            // Still add the reservation with minimal data
            reservations.push({
              id: r._id?.toString() || 'unknown',
              error: 'Error processing reservation data'
            });
          }
        }

        console.log(`✅ Mapped ${reservations.length} reservations`);

        res.json({ 
          reservations: reservations
        });
      } catch (queryError) {
        console.error('❌ Error in query:', queryError);
        throw queryError;
      }
    } catch (error) {
      console.error('❌ Get all reservations error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}

export default ReservationController;
