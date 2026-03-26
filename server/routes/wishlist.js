const express = require('express');
const router = express.Router();
const store = require('../models/store');

// GET /api/wishlist
router.get('/', async (req, res) => {
  const username = req.headers['x-username'] || 'guest';
  res.json(await store.getWishlist(username));
});

// POST /api/wishlist/toggle/:id
router.post('/toggle/:id', async (req, res) => {
  const username = req.headers['x-username'] || 'guest';
  const productId = parseInt(req.params.id);
  res.json(await store.toggleWishlist(username, productId));
});

module.exports = router;
