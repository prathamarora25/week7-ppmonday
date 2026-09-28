const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/productControllers');

// GET /api/products
router.get('/', getAllProducts);

// POST /api/products
router.post('/', createProduct);

// GET /api/products/:productId
router.get('/:productId', getProductById);

// PUT /api/products/:productId
router.put('/:productId', updateProduct);

// DELETE /api/products/:productId
router.delete('/:productId', deleteProduct);

module.exports = router;
