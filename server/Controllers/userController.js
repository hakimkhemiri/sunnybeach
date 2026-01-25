import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserModel from '../Models/userModel.js';

class UserController {
  // Register/Signup
  static async signup(req, res) {
    try {
      const { email, password, first_name, last_name, phone } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Email and password are required' 
        });
      }

      if (password.length < 6) {
        return res.status(400).json({ 
          error: 'Password must be at least 6 characters' 
        });
      }

      // Check if user already exists
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          error: 'User with this email already exists' 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user using Mongoose
      const user = await UserModel.create({
        email,
        password: hashedPassword,
        first_name: first_name || undefined,
        last_name: last_name || undefined,
        phone: phone || undefined,
        is_admin: false
      });

      // Create JWT token
      const token = jwt.sign(
        { id: user._id.toString(), email },
        process.env.JWT_SECRET || 'your-secret-jwt-key-change-this-in-production',
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'User created successfully',
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          is_admin: user.is_admin
        }
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ 
        error: 'Internal server error' 
      });
    }
  }

  // Login
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Email and password are required' 
        });
      }

      // Find user using Mongoose
      let user = await UserModel.findOne({ email });

      // If user doesn't exist and it's admin, create it
      if (!user && email === 'admin@gmail.com') {
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await UserModel.create({
          email: 'admin@gmail.com',
          password: hashedPassword,
          is_admin: true
        });
        
        const token = jwt.sign(
          { id: user._id.toString(), email },
          process.env.JWT_SECRET || 'your-secret-jwt-key-change-this-in-production',
          { expiresIn: '7d' }
        );

        return res.json({
          message: 'Admin account created and logged in',
          token,
          user: {
            id: user._id.toString(),
            email: user.email,
            is_admin: user.is_admin
          }
        });
      }

      if (!user) {
        return res.status(401).json({ 
          error: 'Invalid email or password' 
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          error: 'Invalid email or password' 
        });
      }

      // Create JWT token
      const token = jwt.sign(
        { id: user._id.toString(), email: user.email },
        process.env.JWT_SECRET || 'your-secret-jwt-key-change-this-in-production',
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          is_admin: user.is_admin
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        error: 'Internal server error' 
      });
    }
  }

  // Get current user (verify token)
  static async getMe(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ 
          error: 'No token provided' 
        });
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-jwt-key-change-this-in-production'
      );

      const user = await UserModel.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      res.json({
        user: {
          id: user._id.toString(),
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          is_admin: user.is_admin
        }
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Invalid token' 
        });
      }
      console.error('Get me error:', error);
      res.status(500).json({ 
        error: 'Internal server error' 
      });
    }
  }

  // Get user profile
  static async getProfile(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ 
          error: 'No token provided' 
        });
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-jwt-key-change-this-in-production'
      );

      const user = await UserModel.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      res.json({
        profile: {
          id: user._id.toString(),
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          is_admin: user.is_admin
        }
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Invalid token' 
        });
      }
      console.error('Get profile error:', error);
      res.status(500).json({ 
        error: 'Internal server error' 
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ 
          error: 'No token provided' 
        });
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-jwt-key-change-this-in-production'
      );

      const { first_name, last_name, phone } = req.body;

      const user = await UserModel.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      // Update user profile
      if (first_name !== undefined) user.first_name = first_name || undefined;
      if (last_name !== undefined) user.last_name = last_name || undefined;
      if (phone !== undefined) user.phone = phone || undefined;

      await user.save();

      res.json({
        message: 'Profile updated successfully',
        profile: {
          id: user._id.toString(),
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          is_admin: user.is_admin
        }
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Invalid token' 
        });
      }
      console.error('Update profile error:', error);
      res.status(500).json({ 
        error: 'Internal server error' 
      });
    }
  }
}

export default UserController;
