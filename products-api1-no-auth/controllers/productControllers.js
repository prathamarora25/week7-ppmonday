const Product = require('../models/productModel');
const mongoose = require('mongoose');

// GET /api/products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/products
const createProduct = async (req, res) => {
  const { title, category, description, price, stockQuantity, supplier } = req.body;
  try {
    const product = await Product.create({ title, category, description, price, stockQuantity, supplier });
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// GET /api/products/:productId
const getProductById = async (req, res) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(404).json({ error: 'Product not found' });
  }
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/products/:productId
const updateProduct = async (req, res) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(404).json({ error: 'Product not found' });
  }
  try {
    const product = await Product.findOneAndUpdate(
      { _id: productId },
      { ...req.body },
      // { new: true } //this option is now deprecated.     
      { returnDocument: 'after' }, //This is the new, preferred option 
    );
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE /api/products/:productId
const deleteProduct = async (req, res) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(404).json({ error: 'Product not found' });
  }
  try {
    const product = await Product.findOneAndDelete({ _id: productId });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
};
