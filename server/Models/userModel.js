import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true
  },
  first_name: {
    type: String,
    trim: true
  },
  last_name: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  phone_verified: {
    type: Boolean,
    default: false
  },
  signup_phone_token: {
    type: String,
    default: null
  },
  signup_phone_expires: {
    type: Date,
    default: null
  },
  phone_login_token: {
    type: String,
    default: null
  },
  phone_login_expires: {
    type: Date,
    default: null
  },
  phone_login_last_sent_at: {
    type: Date,
    default: null
  },
  reset_password_token: {
    type: String,
    default: null
  },
  reset_password_expires: {
    type: Date,
    default: null
  },
  is_admin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const UserModel = mongoose.model('User', userSchema);

export default UserModel;
