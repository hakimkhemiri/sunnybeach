import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sunny_beach';

// Test database connection
export const testConnection = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully!');
    console.log(`📦 Database: ${MONGODB_URI}`);
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('💡 Make sure MongoDB is running:');
    console.error('   - Windows: Check if MongoDB service is running');
    console.error('   - macOS/Linux: Run "mongod" or "brew services start mongodb-community"');
    return false;
  }
};

// Initialize database (MongoDB doesn't need syncing like SQL)
export const syncDatabase = async () => {
  try {
    // MongoDB creates collections automatically when first document is inserted
    console.log('✅ MongoDB ready!');
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
  }
};

export default mongoose;
