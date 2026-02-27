import express from 'express';
import InventoryController from '../Controllers/inventoryController.js';

const router = express.Router();

// Public routes
router.get('/', InventoryController.getInventory);
router.get('/availability', InventoryController.getAvailability);

// Admin routes
router.put('/', (req, res, next) => {
  InventoryController.updateInventory(req, res).catch(next);
});
router.get('/units', (req, res, next) => {
  InventoryController.getUnitsForDate(req, res).catch(next);
});
router.post('/walk-in', (req, res, next) => {
  InventoryController.createWalkInReservation(req, res).catch(next);
});

export default router;
