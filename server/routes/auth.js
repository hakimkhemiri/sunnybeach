import express from 'express';
import UserController from '../Controllers/userController.js';

const router = express.Router();

// Routes
router.post('/signup', UserController.signup);
router.post('/signup/verify-phone', UserController.verifySignupPhone);
router.post('/login', UserController.login);
router.post('/phone-login/request-code', UserController.requestPhoneLoginCode);
router.post('/phone-login/verify-code', UserController.verifyPhoneLoginCode);
router.post('/forgot-password', UserController.forgotPassword);
router.post('/forgot-password/resend', UserController.resendForgotPasswordEmail);
router.post('/check-reset-token', UserController.checkResetToken);
router.post('/reset-password', UserController.resetPassword);
router.get('/me', UserController.getMe);
router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);

export default router;
