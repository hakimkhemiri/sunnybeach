import express from 'express';
import * as OrderController from '../Controllers/orderController.js';

const router = express.Router();

router.post('/', (req, res, next) => {
  OrderController.createOrder(req, res).catch(next);
});

export default router;
