const express = require('express');
const router = express.Router();
const store = require('../models/store');

// POST /api/orders — place order
router.post('/', (req, res) => {
  const username = req.headers['x-username'] || 'guest';
  const { customerName, address, phone, paymentMethod, paymentDetails, couponCode } = req.body;
  if (!customerName || !address || !phone) {
    return res.status(400).json({ error: 'customerName, address, and phone are required' });
  }
  const result = store.placeOrder(username, customerName, address, phone, paymentMethod, paymentDetails, couponCode);
  if (result.error) return res.status(400).json(result);
  res.status(201).json(result);
});

// GET /api/orders — user's orders
router.get('/', (req, res) => {
  const username = req.headers['x-username'] || 'guest';
  res.json(store.getOrders(username));
});

// GET /api/orders/all — admin: all orders
router.get('/all', (req, res) => {
  res.json(store.getAllOrders());
});

// PUT /api/orders/:id/status — admin: update order status
router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  const result = store.updateOrderStatus(parseInt(req.params.id), status);
  if (result.error) return res.status(404).json(result);
  res.json(result);
});

// GET /api/admin/stats
router.get('/admin/stats', (req, res) => {
  res.json(store.getAdminStats());
});

module.exports = router;
