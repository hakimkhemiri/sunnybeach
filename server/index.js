import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import reservationRoutes from './routes/reservations.js';
import contactMessageRoutes from './routes/contactMessages.js';
import foodItemRoutes from './routes/foodItems.js';
import orderRoutes from './routes/orders.js';
import { testConnection, syncDatabase } from './config/db.js';
import UserModel from './Models/userModel.js';
import ReservationModel from './Models/reservationModel.js';
import bcrypt from 'bcryptjs';

// Verify routes are loaded
try {
  console.log('✅ Routes loaded successfully');
  console.log('  - Auth routes:', authRoutes ? 'OK' : 'FAILED');
  console.log('  - Reservation routes:', reservationRoutes ? 'OK' : 'FAILED');
  console.log('  - Contact message routes:', contactMessageRoutes ? 'OK' : 'FAILED');
  console.log('  - Food item routes:', foodItemRoutes ? 'OK' : 'FAILED');
  console.log('  - Order routes:', orderRoutes ? 'OK' : 'FAILED');
} catch (error) {
  console.error('❌ Error loading routes:', error);
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server default port
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads (images for menu items)
app.use('/uploads', express.static('uploads'));

// Test database connection and initialize
testConnection().then(async (connected) => {
  if (connected) {
    await syncDatabase();
    
    // Create default admin user if it doesn't exist
    const adminExists = await UserModel.findOne({ email: 'admin@gmail.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await UserModel.create({
        email: 'admin@gmail.com',
        password: hashedPassword,
        is_admin: true
      });
      console.log('✅ Admin user created: admin@gmail.com / admin123');
    }

  } else {
    console.log('⚠️  Please make sure MongoDB is running and accessible');
  }
});

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Sunny Beach Restaurant API',
    status: 'running',
    version: '1.0.0'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/contact-messages', contactMessageRoutes);
app.use('/api/food-items', foodItemRoutes);
app.use('/api/orders', orderRoutes);

// Test endpoint to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Test MongoDB connection endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const mongoose = (await import('./config/db.js')).default;
    const isConnected = mongoose.connection.readyState === 1;
    res.json({ 
      mongodb: isConnected ? 'connected' : 'disconnected',
      readyState: mongoose.connection.readyState,
      dbName: mongoose.connection.name
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 404 handler for unmatched routes (must be last, after all routes)
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ 
      error: 'Route not found',
      path: req.path,
      method: req.method
    });
  } else {
    res.status(404).send('Not Found');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled Error:', err);
  console.error('Error stack:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
