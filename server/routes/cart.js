const express = require('express');
const router = express.Router();
const store = require('../models/store');

// POST /api/cart — add item (requires username header)
router.post('/', async (req, res) => {
  const username = req.headers['x-username'] || 'guest';
  const { productId, quantity, variationName, variationPrice } = req.body;
  const result = await store.addToCart(username, parseInt(productId), quantity || 1, variationName, variationPrice);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// GET /api/cart
router.get('/', async (req, res) => {
  const username = req.headers['x-username'] || 'guest';
  res.json(await store.getCart(username));
});

// PUT /api/cart/:id — update quantity
router.put('/:id', async (req, res) => {
  const username = req.headers['x-username'] || 'guest';
  const { quantity } = req.body;
  const result = await store.updateCartItem(username, req.params.id, quantity);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// DELETE /api/cart/:id
router.delete('/:id', async (req, res) => {
  const username = req.headers['x-username'] || 'guest';
  const result = await store.removeFromCart(username, req.params.id);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// GET /api/cart/count
router.get('/count', async (req, res) => {
  const username = req.headers['x-username'] || 'guest';
  const count = await store.getCartItemCount(username);
  res.json({ count });
});

module.exports = router;
