import express from 'express';
import UserController from '../Controllers/userController.js';

const router = express.Router();

// Routes
router.post('/signup', UserController.signup);
router.post('/login', UserController.login);
router.get('/me', UserController.getMe);
router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);

export default router;
