const express = require('express');
const router = express.Router();
const store = require('../models/store');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password, name } = req.body;
  const result = await store.register(username, password, name);
  if (result.error) return res.status(400).json(result);
  res.status(201).json(result);
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const result = await store.login(username, password);
  if (result.error) return res.status(401).json(result);
  res.json(result);
});

// GET /api/auth/me?username=xxx
router.get('/me', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'Username required' });
  const user = await store.getUser(username);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

module.exports = router;
