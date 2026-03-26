const express = require('express');
const router = express.Router();
const store = require('../models/store');

// POST /api/coupons/validate
router.post('/validate', async (req, res) => {
  const { code, amount } = req.body;
  if (!code || amount === undefined) return res.status(400).json({ error: 'code and amount required' });
  const result = await store.validateCoupon(code, amount);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

module.exports = router;
