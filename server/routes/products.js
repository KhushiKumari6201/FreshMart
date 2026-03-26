const express = require('express');
const router = express.Router();
const store = require('../models/store');

// GET /api/products/categories
router.get('/categories', async (req, res) => {
  res.json(await store.getCategories());
});

// GET /api/products
router.get('/', async (req, res) => {
  const { category, search } = req.query;
  res.json(await store.getAllProducts(category, search));
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  const product = await store.getProductById(parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// POST /api/products — admin add
router.post('/', async (req, res) => {
  const result = await store.addProduct(req.body);
  res.status(201).json(result);
});

// PUT /api/products/:id — admin edit
router.put('/:id', async (req, res) => {
  const result = await store.updateProduct(parseInt(req.params.id), req.body);
  if (result.error) return res.status(404).json(result);
  res.json(result);
});

// DELETE /api/products/:id — admin delete
router.delete('/:id', async (req, res) => {
  const result = await store.deleteProduct(parseInt(req.params.id));
  if (result.error) return res.status(404).json(result);
  res.json(result);
});

// POST /api/products/:id/rate
router.post('/:id/rate', async (req, res) => {
  const { rating } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'rating (1-5) required' });
  const result = await store.rateProduct(req.params.id, rating);
  if (result.error) return res.status(404).json(result);
  res.json(result);
});

module.exports = router;
