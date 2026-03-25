const express = require('express');
const router = express.Router();
const store = require('../models/store');

// GET /api/products/categories
router.get('/categories', (req, res) => {
  res.json(store.getCategories());
});

// GET /api/products
router.get('/', (req, res) => {
  const { category, search } = req.query;
  res.json(store.getAllProducts(category, search));
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const product = store.getProductById(parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// POST /api/products — admin add
router.post('/', (req, res) => {
  const result = store.addProduct(req.body);
  res.status(201).json(result);
});

// PUT /api/products/:id — admin edit
router.put('/:id', (req, res) => {
  const result = store.updateProduct(parseInt(req.params.id), req.body);
  if (result.error) return res.status(404).json(result);
  res.json(result);
});

// DELETE /api/products/:id — admin delete
router.delete('/:id', (req, res) => {
  const result = store.deleteProduct(parseInt(req.params.id));
  if (result.error) return res.status(404).json(result);
  res.json(result);
});

// POST /api/products/:id/rate
router.post('/:id/rate', (req, res) => {
  const { rating } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'rating (1-5) required' });
  const result = store.rateProduct(req.params.id, rating);
  if (result.error) return res.status(404).json(result);
  res.json(result);
});

module.exports = router;
