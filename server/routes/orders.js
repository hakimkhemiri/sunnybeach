import express from 'express';
import * as OrderController from '../Controllers/orderController.js';

const router = express.Router();

router.post('/', (req, res, next) => {
  OrderController.createOrder(req, res).catch(next);
});

// Client: get my orders
router.get('/mine', (req, res, next) => {
  OrderController.getMyOrders(req, res).catch(next);
});

// Admin routes
router.get('/admin/today', (req, res, next) => {
  OrderController.getTodayOrders(req, res).catch(next);
});

router.put('/admin/:id/status', (req, res, next) => {
  OrderController.updateOrderStatus(req, res).catch(next);
});

export default router;
