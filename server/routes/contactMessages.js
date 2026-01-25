import express from 'express';
import ContactMessageController from '../Controllers/contactMessageController.js';

const router = express.Router();

// Public route - anyone can send a message
router.post('/', (req, res, next) => {
  ContactMessageController.createMessage(req, res).catch(next);
});

// Admin routes
router.get('/admin/all', (req, res, next) => {
  ContactMessageController.getAllMessages(req, res).catch(next);
});

router.put('/admin/:id/status', (req, res, next) => {
  ContactMessageController.updateMessageStatus(req, res).catch(next);
});

router.delete('/admin/:id', (req, res, next) => {
  ContactMessageController.deleteMessage(req, res).catch(next);
});

export default router;
