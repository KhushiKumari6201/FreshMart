const express = require('express');
const router = express.Router();
const store = require('../models/store');

// POST /api/cart — add item (requires username header)
router.post('/', (req, res) => {
  const username = req.headers['x-username'] || 'guest';
  const { productId, quantity, variationName, variationPrice } = req.body;
  const result = store.addToCart(username, parseInt(productId), quantity || 1, variationName, variationPrice);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// GET /api/cart
router.get('/', (req, res) => {
  const username = req.headers['x-username'] || 'guest';
  res.json(store.getCart(username));
});

// PUT /api/cart/:id — update quantity
router.put('/:id', (req, res) => {
  const username = req.headers['x-username'] || 'guest';
  const { quantity } = req.body;
  const result = store.updateCartItem(username, parseInt(req.params.id), quantity);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// DELETE /api/cart/:id
router.delete('/:id', (req, res) => {
  const username = req.headers['x-username'] || 'guest';
  const result = store.removeFromCart(username, parseInt(req.params.id));
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// GET /api/cart/count
router.get('/count', (req, res) => {
  const username = req.headers['x-username'] || 'guest';
  res.json({ count: store.getCartItemCount(username) });
});

module.exports = router;
