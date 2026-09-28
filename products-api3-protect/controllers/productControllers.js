const Product = require('../models/productModel');
const mongoose = require('mongoose');

// GET /api/products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

// POST /api/products
const createProduct = async (req, res) => {
  try {
    const user_id = req.user._id;
    const newProduct = new Product({
      ...req.body,
      user_id,
    });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

// GET /api/products/:productId
const getProductById = async (req, res) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(404).json({ error: 'No such product' });
  }
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

// PUT /api/products/:productId
const updateProduct = async (req, res) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(404).json({ error: 'No such product' });
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
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

// DELETE /api/products/:productId
const deleteProduct = async (req, res) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(404).json({ error: 'No such product' });
  }
  try {
    const product = await Product.findOneAndDelete({ _id: productId });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

module.exports = {
  getAllProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
};
