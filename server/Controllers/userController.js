import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import UserModel from '../Models/userModel.js';
import {
  forgotPasswordEmailTemplate,
  resetPasswordConfirmationEmailTemplate,
} from '../template/userAccountEmailTemplates.js';

const getFromEmail = () => process.env.EMAIL_USER || 'ayoub.nightraid123@gmail.com';
const getAuthPassword = () => process.env.EMAIL_PASSWORD || 'hnuzvwvyqfthoskc';
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID || '';

const getApiEndpoint = () =>
  process.env.NODE_ENV === 'production'
    ? process.env.PRODUCTION_API_URL
    : process.env.DEVELOPMENT_API_URL;

const DEFAULT_COUNTRY_CODE = '216';

const normalizePhone = (value = '') => {
  const cleaned = String(value).replace(/[\s\-().]/g, '').trim();
  if (!cleaned) return '';

  if (cleaned.startsWith('00')) {
    const digits = cleaned.slice(2).replace(/\D/g, '');
    return digits ? `+${digits}` : '';
  }

  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1).replace(/\D/g, '');
    return digits ? `+${digits}` : '';
  }

  const digitsOnly = cleaned.replace(/\D/g, '');
  if (!digitsOnly) return '';

  // Tunisia local formats: 8 digits (or 0 + 8 digits)
  if (digitsOnly.length === 8) {
    return `+${DEFAULT_COUNTRY_CODE}${digitsOnly}`;
  }

  if (digitsOnly.length === 9 && digitsOnly.startsWith('0')) {
    return `+${DEFAULT_COUNTRY_CODE}${digitsOnly.slice(1)}`;
  }

  if (digitsOnly.startsWith(DEFAULT_COUNTRY_CODE)) {
    return `+${digitsOnly}`;
  }

  return `+${digitsOnly}`;
};

const isValidPhoneE164 = (phone = '') => /^\+[1-9]\d{7,14}$/.test(phone);

const findUserByPhone = async (phoneInput) => {
  const normalizedInput = normalizePhone(phoneInput);
  if (!normalizedInput) {
    return null;
  }

  const users = await UserModel.find({ phone: { $exists: true, $ne: null } });
  const foundUser = users.find((candidate) => normalizePhone(candidate.phone) === normalizedInput);

  if (foundUser && foundUser.phone !== normalizedInput) {
    foundUser.phone = normalizedInput;
    await foundUser.save();
  }

  return foundUser || null;
};

const sendSmsCode = async (phoneNumber, purpose = 'login') => {
  const accountSid = TWILIO_ACCOUNT_SID;
  const authToken = TWILIO_AUTH_TOKEN;
  const verifyServiceSid = TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !verifyServiceSid) {
    throw new Error('Twilio Verify is not configured. Missing SID, token or verify service SID.');
  }

  const authHeader = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;
  const payload = new URLSearchParams({
    To: phoneNumber,
    Channel: 'sms',
  });

  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${verifyServiceSid}/Verifications`,
    {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload.toString(),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio Verify send failed: ${errorText}`);
  }

  return { sent: true, provider: 'twilio-verify', purpose };
};

const verifySmsCode = async (phoneNumber, code) => {
  const accountSid = TWILIO_ACCOUNT_SID;
  const authToken = TWILIO_AUTH_TOKEN;
  const verifyServiceSid = TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !verifyServiceSid) {
    throw new Error('Twilio Verify is not configured. Missing SID, token or verify service SID.');
  }

  const authHeader = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;
  const payload = new URLSearchParams({
    To: phoneNumber,
    Code: String(code || '').trim(),
  });

  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationCheck`,
    {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload.toString(),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio Verify check failed: ${errorText}`);
  }

  const result = await response.json();
  return result?.status === 'approved';
};

const getSmtpTransport = () => {
  const fromEmail = getFromEmail();
  const authPassword = getAuthPassword();

  if (!fromEmail || !authPassword) {
    return null;
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    service: 'gmail',
    auth: {
      user: fromEmail,
      pass: authPassword,
    },
  });
};

class UserController {
  // Register/Signup
  static async signup(req, res) {
    try {
      const { email, password, first_name, last_name, phone } = req.body;
      const normalizedEmail = String(email || '').toLowerCase().trim();
      const normalizedPhone = normalizePhone(phone);

      // Validate input
      if (!normalizedEmail || !password || !normalizedPhone) {
        return res.status(400).json({ 
          error: 'Email, password and phone are required' 
        });
      }

      if (!isValidPhoneE164(normalizedPhone)) {
        return res.status(400).json({
          error: 'Invalid phone number format. Use international format like +21654278027 or local 54278027.',
        });
      }

      if (password.length < 6) {
        return res.status(400).json({ 
          error: 'Password must be at least 6 characters' 
        });
      }

      // Check if user already exists
      let user = await UserModel.findOne({ email: normalizedEmail });

      if (user && user.phone_verified) {
        return res.status(400).json({
          error: 'User with this email already exists',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      if (!user) {
        user = await UserModel.create({
          email: normalizedEmail,
          password: hashedPassword,
          first_name: first_name || undefined,
          last_name: last_name || undefined,
          phone: normalizedPhone,
          phone_verified: false,
          is_admin: false,
        });
      } else {
        user.password = hashedPassword;
        user.first_name = first_name || user.first_name || undefined;
        user.last_name = last_name || user.last_name || undefined;
        user.phone = normalizedPhone;
        user.phone_verified = false;
        user.signup_phone_token = null;
        user.signup_phone_expires = null;
        await user.save();
      }

      await sendSmsCode(normalizedPhone, 'signup');

      const payload = {
        message: 'Verification code sent by SMS',
        requires_phone_verification: true,
        email: normalizedEmail,
        phone: normalizedPhone,
      };

      return res.status(201).json(payload);
    } catch (error) {
      console.error('Signup error:', error);
      const message = error?.message || 'Internal server error';
      const statusCode = message.toLowerCase().includes('twilio') ? 502 : 500;
      res.status(statusCode).json({ error: message });
    }
  }

  static async verifySignupPhone(req, res) {
    try {
      const { email, phone, code } = req.body;
      const normalizedEmail = String(email || '').toLowerCase().trim();
      const normalizedPhone = normalizePhone(phone);
      const cleanCode = String(code || '').trim();

      if (!normalizedEmail || !normalizedPhone || !cleanCode) {
        return res.status(400).json({ error: 'Email, phone and code are required' });
      }

      const user = await UserModel.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(401).json({ error: 'Invalid verification request' });
      }

      if (normalizePhone(user.phone) !== normalizedPhone) {
        return res.status(401).json({ error: 'Phone number mismatch' });
      }

      const isApproved = await verifySmsCode(normalizedPhone, cleanCode);
      if (!isApproved) {
        return res.status(401).json({ error: 'Invalid code' });
      }

      user.phone_verified = true;
      user.signup_phone_token = null;
      user.signup_phone_expires = null;
      await user.save();

      const token = jwt.sign(
        { id: user._id.toString(), email: user.email },
        process.env.JWT_SECRET || 'your-secret-jwt-key-change-this-in-production',
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Signup phone verified successfully',
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          is_admin: user.is_admin,
        },
      });
    } catch (error) {
      console.error('Verify signup phone error:', error);
      const message = error?.message || 'Unable to verify signup code';
      const statusCode = message.toLowerCase().includes('twilio') ? 502 : 500;
      return res.status(statusCode).json({ error: message });
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

      if (user.phone && user.phone_verified === false) {
        return res.status(403).json({
          error: 'Please verify your phone number before logging in',
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
      if (phone !== undefined) user.phone = phone ? normalizePhone(phone) : undefined;

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

  static async requestPhoneLoginCode(req, res) {
    try {
      const { phone } = req.body;
      const normalizedPhone = normalizePhone(phone);

      if (!normalizedPhone) {
        return res.status(400).json({ error: 'Phone number is required' });
      }

      if (!isValidPhoneE164(normalizedPhone)) {
        return res.status(400).json({
          error: 'Invalid phone number format. Use +21654278027 or local 54278027.',
        });
      }

      const user = await findUserByPhone(normalizedPhone);

      if (!user) {
        return res.json({
          message: 'If this phone number exists, a code has been sent',
        });
      }

      const now = Date.now();
      if (user.phone_login_last_sent_at && now - user.phone_login_last_sent_at.getTime() < 30 * 1000) {
        return res.status(429).json({ error: 'Please wait before requesting a new code' });
      }

      user.phone_login_token = null;
      user.phone_login_expires = null;
      user.phone_login_last_sent_at = new Date(now);
      await user.save();

      await sendSmsCode(normalizedPhone, 'login');

      return res.json({
        message: 'Verification code sent by SMS',
      });
    } catch (error) {
      console.error('Request phone login code error:', error);
      const message = error?.message || 'Unable to send SMS code';
      const statusCode = message.toLowerCase().includes('twilio') ? 502 : 500;
      return res.status(statusCode).json({ error: message });
    }
  }

  static async verifyPhoneLoginCode(req, res) {
    try {
      const { phone, code } = req.body;
      const normalizedPhone = normalizePhone(phone);
      const cleanCode = String(code || '').trim();

      if (!normalizedPhone || !cleanCode) {
        return res.status(400).json({ error: 'Phone number and code are required' });
      }

      if (!isValidPhoneE164(normalizedPhone)) {
        return res.status(400).json({
          error: 'Invalid phone number format. Use +21654278027 or local 54278027.',
        });
      }

      const user = await findUserByPhone(normalizedPhone);

      if (!user) {
        return res.status(401).json({ error: 'Invalid code' });
      }

      const isApproved = await verifySmsCode(normalizedPhone, cleanCode);
      if (!isApproved) {
        return res.status(401).json({ error: 'Invalid code' });
      }

      user.phone_login_token = null;
      user.phone_login_expires = null;
      await user.save();

      const token = jwt.sign(
        { id: user._id.toString(), email: user.email },
        process.env.JWT_SECRET || 'your-secret-jwt-key-change-this-in-production',
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Phone login successful',
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          is_admin: user.is_admin,
        },
      });
    } catch (error) {
      console.error('Verify phone login code error:', error);
      const message = error?.message || 'Unable to verify SMS code';
      const statusCode = message.toLowerCase().includes('twilio') ? 502 : 500;
      return res.status(statusCode).json({ error: message });
    }
  }

  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const user = await UserModel.findOne({ email: email.toLowerCase().trim() });

      // Always return the same response to avoid email enumeration.
      const genericMessage = 'If an account exists, a reset code has been sent';

      if (!user) {
        return res.json({ message: genericMessage });
      }

      const resetToken = String(crypto.randomInt(100000, 1000000));
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      user.reset_password_token = resetToken;
      user.reset_password_expires = expiresAt;
      await user.save();

      const smtpTransport = getSmtpTransport();
      const fromEmail = getFromEmail();

      if (smtpTransport && fromEmail) {
        const html = forgotPasswordEmailTemplate(
          user.first_name || user.last_name || 'client',
          user.email,
          getApiEndpoint() || 'http://localhost:5173',
          resetToken
        );

        await smtpTransport.sendMail({
          from: fromEmail,
          to: user.email,
          subject: 'Sunny Beach - Code de reinitialisation',
          html,
        });
      }

      return res.json({
        message: genericMessage,
        expires_at: expiresAt,
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async checkResetToken(req, res) {
    try {
      const { email, token } = req.body;

      if (!email || !token) {
        return res.status(400).json({ error: 'Email and token are required' });
      }

      const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
      if (!user || !user.reset_password_token || !user.reset_password_expires) {
        return res.status(400).json({ valid: false, error: 'Invalid token' });
      }

      const notExpired = user.reset_password_expires.getTime() > Date.now();
      const sameToken = user.reset_password_token === String(token).trim();

      if (!sameToken || !notExpired) {
        return res.status(400).json({ valid: false, error: 'Token invalid or expired' });
      }

      return res.json({ valid: true, message: 'Token is valid' });
    } catch (error) {
      console.error('Check reset token error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { email, token, newPassword } = req.body;

      if (!email || !token || !newPassword) {
        return res.status(400).json({ error: 'Email, token and newPassword are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
      if (!user || !user.reset_password_token || !user.reset_password_expires) {
        return res.status(400).json({ error: 'Invalid reset request' });
      }

      const notExpired = user.reset_password_expires.getTime() > Date.now();
      const sameToken = user.reset_password_token === String(token).trim();

      if (!sameToken || !notExpired) {
        return res.status(400).json({ error: 'Token invalid or expired' });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.reset_password_token = null;
      user.reset_password_expires = null;
      await user.save();

      const smtpTransport = getSmtpTransport();
      const fromEmail = getFromEmail();

      if (smtpTransport && fromEmail) {
        const html = resetPasswordConfirmationEmailTemplate(
          user.first_name || user.last_name || 'client',
          getApiEndpoint() || 'http://localhost:3001'
        );
        await smtpTransport.sendMail({
          from: fromEmail,
          to: user.email,
          subject: 'Sunny Beach - Mot de passe reinitialise',
          html,
        });
      }

      return res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async resendForgotPasswordEmail(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
      const genericMessage = 'If an account exists, a new reset code has been sent';

      if (!user) {
        return res.json({ message: genericMessage });
      }

      const resetToken = String(crypto.randomInt(100000, 1000000));
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      user.reset_password_token = resetToken;
      user.reset_password_expires = expiresAt;
      await user.save();

      const smtpTransport = getSmtpTransport();
      const fromEmail = getFromEmail();

      if (smtpTransport && fromEmail) {
        const html = forgotPasswordEmailTemplate(
          user.first_name || user.last_name || 'client',
          user.email,
          getApiEndpoint() || 'http://localhost:5173',
          resetToken
        );

        await smtpTransport.sendMail({
          from: fromEmail,
          to: user.email,
          subject: 'Sunny Beach - Nouveau code de reinitialisation',
          html,
        });
      }

      return res.json({
        message: genericMessage,
        expires_at: expiresAt,
      });
    } catch (error) {
      console.error('Resend forgot password email error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default UserController;
