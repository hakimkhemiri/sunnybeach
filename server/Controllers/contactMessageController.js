import mongoose from 'mongoose';
import ContactMessageModel from '../Models/contactMessageModel.js';
import UserModel from '../Models/userModel.js';
import jwt from 'jsonwebtoken';

class ContactMessageController {
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

  // Create a new contact message (public - anyone can send)
  static async createMessage(req, res) {
    try {
      // Check MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        console.error('❌ MongoDB not connected! ReadyState:', mongoose.connection.readyState);
        return res.status(503).json({ error: 'Database not available. Please check MongoDB connection.' });
      }

      const { name, email, phone, message } = req.body;

      // Validate input
      if (!name || !email || !message) {
        return res.status(400).json({
          error: 'Name, email, and message are required'
        });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Invalid email format'
        });
      }

      // Get user_id if user is authenticated
      const userId = ContactMessageController.getUserIdFromToken(req);
      let userObjectId = null;
      if (userId) {
        try {
          userObjectId = new mongoose.Types.ObjectId(userId);
          // Verify user exists
          const userExists = await UserModel.findById(userObjectId);
          if (!userExists) {
            userObjectId = null; // User doesn't exist, continue without user_id
          }
        } catch (err) {
          console.error('Invalid userId format:', userId);
          userObjectId = null;
        }
      }

      console.log('📧 Creating contact message from:', email);
      console.log('📋 Message data:', { name, email, phone, messageLength: message?.length, hasUserId: !!userObjectId });

      // Prepare message data - Mongoose will handle trim and lowercase automatically
      const messageData = {
        name,
        email,
        message,
        status: 'new'
      };

      // Add optional fields only if they exist
      if (phone && phone.trim()) {
        messageData.phone = phone;
      }
      if (userObjectId) {
        messageData.user_id = userObjectId;
      }

      console.log('📦 Prepared message data:', messageData);

      // Create message
      let contactMessage;
      try {
        contactMessage = await ContactMessageModel.create(messageData);
      } catch (createError) {
        console.error('❌ Error during ContactMessageModel.create:', createError);
        if (createError.errors) {
          console.error('Mongoose validation errors:', JSON.stringify(createError.errors, null, 2));
        }
        throw createError;
      }

      console.log('✅ Contact message created successfully:', contactMessage._id);

      res.status(201).json({
        message: 'Message sent successfully',
        contactMessage: {
          ...contactMessage.toObject(),
          id: contactMessage._id.toString()
        }
      });
    } catch (error) {
      console.error('❌ Create contact message error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Log validation errors if they exist
      if (error.errors) {
        console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
      }
      
      // Handle validation errors specifically
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err) => err.message).join(', ');
        return res.status(400).json({
          error: 'Validation error',
          message: validationErrors,
          details: process.env.NODE_ENV === 'development' ? error.errors : undefined
        });
      }
      
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Get all messages (admin only)
  static async getAllMessages(req, res) {
    try {
      // Check MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        console.error('❌ MongoDB not connected! ReadyState:', mongoose.connection.readyState);
        return res.status(503).json({ error: 'Database not available. Please check MongoDB connection.' });
      }

      const userId = ContactMessageController.getUserIdFromToken(req);
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

      console.log('📋 Getting all contact messages for admin:', user.email);

      // Get all messages, sorted by newest first
      const messagesRaw = await ContactMessageModel.find()
        .populate('user_id', 'email first_name last_name')
        .sort({ createdAt: -1 })
        .lean();

      console.log(`✅ Found ${messagesRaw.length} messages`);

      // Map messages to response format
      const mappedMessages = messagesRaw.map(m => {
        try {
          // Handle user data
          let userData = null;
          if (m.user_id) {
            if (typeof m.user_id === 'object' && m.user_id._id) {
              userData = {
                id: m.user_id._id.toString(),
                email: m.user_id.email || '',
                first_name: m.user_id.first_name || '',
                last_name: m.user_id.last_name || ''
              };
            } else if (typeof m.user_id === 'object') {
              userData = m.user_id;
            }
          }

          return {
            id: m._id.toString(),
            name: m.name,
            email: m.email,
            phone: m.phone || null,
            message: m.message,
            user_id: userData || m.user_id?.toString() || m.user_id,
            status: m.status || 'new',
            created_at: m.createdAt,
            updated_at: m.updatedAt
          };
        } catch (mapError) {
          console.error('Error mapping message:', mapError);
          return {
            id: m._id?.toString() || 'unknown',
            error: 'Error processing message data'
          };
        }
      });

      res.json({
        messages: mappedMessages
      });
    } catch (error) {
      console.error('❌ Get all messages error:', error);
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

  // Update message status (admin only)
  static async updateMessageStatus(req, res) {
    try {
      // Check MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        console.error('❌ MongoDB not connected! ReadyState:', mongoose.connection.readyState);
        return res.status(503).json({ error: 'Database not available. Please check MongoDB connection.' });
      }

      const userId = ContactMessageController.getUserIdFromToken(req);
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

      const { id } = req.params;
      const { status } = req.body;

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid message ID format' });
      }

      // Validate status
      if (!status || !['new', 'read', 'replied', 'archived'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be: new, read, replied, or archived' });
      }

      const message = await ContactMessageModel.findById(id);
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      message.status = status;
      await message.save();
      await message.populate('user_id', 'email first_name last_name');

      console.log(`✅ Message status updated to '${status}'`);

      res.json({
        message: 'Message status updated successfully',
        contactMessage: {
          ...message.toObject(),
          id: message._id.toString()
        }
      });
    } catch (error) {
      console.error('❌ Update message status error:', error);
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

  // Delete a message (admin only)
  static async deleteMessage(req, res) {
    try {
      // Check MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        console.error('❌ MongoDB not connected! ReadyState:', mongoose.connection.readyState);
        return res.status(503).json({ error: 'Database not available. Please check MongoDB connection.' });
      }

      const userId = ContactMessageController.getUserIdFromToken(req);
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

      const { id } = req.params;

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid message ID format' });
      }

      const message = await ContactMessageModel.findByIdAndDelete(id);
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      console.log(`✅ Message deleted successfully`);

      res.json({
        message: 'Message deleted successfully'
      });
    } catch (error) {
      console.error('❌ Delete message error:', error);
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

export default ContactMessageController;
