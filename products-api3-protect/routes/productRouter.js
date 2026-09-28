const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/productControllers');
const requireAuth = require('../middleware/requireAuth');

// Public routes (no authentication needed)
router.get('/', getAllProducts);
router.get('/:productId', getProductById);

// All routes below this line require authentication
router.use(requireAuth);

// Protected routes
router.post('/', createProduct);
router.put('/:productId', updateProduct);
router.delete('/:productId', deleteProduct);

module.exports = router;
