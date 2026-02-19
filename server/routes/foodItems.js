import express from 'express';
import * as FoodItemController from '../Controllers/foodItemController.js';
import upload from '../config/multer.js';

const router = express.Router();

router.get('/', (req, res, next) => {
  FoodItemController.getAll(req, res).catch(next);
});

router.get('/admin/all', (req, res, next) => {
  FoodItemController.getAllAdmin(req, res).catch(next);
});

router.post('/', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Upload error' });
    }
    next();
  });
}, (req, res, next) => {
  FoodItemController.create(req, res).catch(next);
});

router.put('/:id', (req, res, next) => {
  console.log('PUT /api/food-items/:id route matched', req.params.id);
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Upload error' });
    }
    FoodItemController.update(req, res).catch(next);
  });
});

router.delete('/:id', (req, res, next) => {
  FoodItemController.remove(req, res).catch(next);
});

export default router;
