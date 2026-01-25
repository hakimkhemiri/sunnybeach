import express from 'express';
import ReservationController from '../Controllers/reservationController.js';

const router = express.Router();

// Public routes
router.get('/table-types', ReservationController.getTableTypes);

// User routes (require authentication)
router.post('/', (req, res, next) => {
  ReservationController.createReservation(req, res).catch(next);
});
router.get('/my-reservations', (req, res, next) => {
  ReservationController.getMyReservations(req, res).catch(next);
});

// Admin routes (must be before /:id routes)
router.get('/admin/all', ReservationController.getAllReservations);

// Confirm/Cancel routes (must be before /:id routes)
router.post('/:id/confirm', (req, res, next) => {
  ReservationController.confirmReservation(req, res).catch(next);
});
router.post('/:id/cancel', (req, res, next) => {
  ReservationController.cancelReservation(req, res).catch(next);
});

// Parameterized routes (must be last to avoid conflicts)
router.get('/:id', ReservationController.getReservationById);
router.put('/:id', ReservationController.updateReservation);
router.delete('/:id', ReservationController.cancelReservation);

export default router;
