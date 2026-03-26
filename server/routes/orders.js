const express = require('express');
const router = express.Router();
const store = require('../models/store');

// POST /api/orders — place order
router.post('/', async (req, res) => {
  const username = req.headers['x-username'] || 'guest';
  const { customerName, address, phone, paymentMethod, paymentDetails, couponCode } = req.body;
  if (!customerName || !address || !phone) {
    return res.status(400).json({ error: 'customerName, address, and phone are required' });
  }
  const result = await store.placeOrder(username, customerName, address, phone, paymentMethod, paymentDetails, couponCode);
  if (result.error) return res.status(400).json(result);
  res.status(201).json(result);
});

// GET /api/orders — user's orders
router.get('/', async (req, res) => {
  const username = req.headers['x-username'] || 'guest';
  res.json(await store.getOrders(username));
});

// GET /api/orders/all — admin: all orders
router.get('/all', async (req, res) => {
  res.json(await store.getAllOrders());
});

// PUT /api/orders/:id/status — admin: update order status
router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  const result = await store.updateOrderStatus(parseInt(req.params.id), status);
  if (result.error) return res.status(404).json(result);
  res.json(result);
});

// GET /api/admin/stats
router.get('/admin/stats', async (req, res) => {
  res.json(await store.getAdminStats());
});

module.exports = router;
