const express = require('express');
const router = express.Router();
const store = require('../models/store');

// Middleware to get username from header
const getUsername = (req) => req.headers['x-username'] || null;

router.get('/history', (req, res) => {
  const username = getUsername(req);
  if (!username) return res.status(200).json([]); // Return empty if not logged in
  const history = store.getChatHistory(username);
  res.json(history);
});

router.post('/message', async (req, res) => {
  let { message } = req.body;
  const username = getUsername(req);
  
  if (!message) return res.status(400).json({ error: 'Message is required' });
  
  // Clean up message
  message = message.trim();
  
  // Save user msg to history
  if (username) store.saveChatMessage(username, message, 'user');
  
  // ── AI Matching Logic (Simulated ML) ─────────────
  const lq = message.toLowerCase();
  const products = store.products;
  let reply = "I'm still learning about that! You can ask me about **prices**, **health benefits**, or **breakfast recommendations**. I can also tell you today's **deals**! 🍏";
  
  // Fuzzy match product
  const found = products.find(p => 
    lq.includes(p.name.toLowerCase()) || 
    p.name.toLowerCase().includes(lq) ||
    lq.split(' ').some(w => w.length > 3 && p.name.toLowerCase().includes(w))
  );

  const healthTips = {
    'apple': 'Apples are heart-healthy and high in fiber! 🍎',
    'orange': 'Oranges boost immunity with Vitamin C! 🍊',
    'banana': 'Bananas provide instant energy and Potassium! 🍌',
    'milk': 'Dairy builds strong bones with Calcium! 🥛',
    'egg': 'Eggs are an excellent protein source! 🥚',
    'broccoli': 'Broccoli is a nutritional powerhouse! 🥦',
    'almond': 'Almonds are great for your brain and heart! 🥜',
    'spinach': 'Spinach is high in iron and vitamins! 🥬'
  };

  // Rule-based Decision system (AI simulation)
  if (lq.includes('hi') || lq.includes('hello') || lq.includes('hey')) {
    reply = "Hello there! I'm **FreshBot AI**, your personal shopping assistant. How can I make your day fresh? 👋✨";
  }
  else if (lq.includes('price') && found) {
    reply = `The **${found.name}** costs **₹${found.price.toFixed(2)}** / ${found.unit}. It is currently **${found.inStock ? 'In Stock' : 'Out of Stock'}**. 📈`;
  }
  else if ((lq.includes('health') || lq.includes('good') || lq.includes('benefit')) && found) {
    const key = Object.keys(healthTips).find(k => found.name.toLowerCase().includes(k));
    reply = healthTips[key] || `Our ${found.name} is super fresh and 100% organic, making it a very healthy choice for you! ✨`;
  }
  else if (found) {
    reply = `**${found.name}**: ${found.description}\nPrice: ₹${found.price.toFixed(2)} / ${found.unit}.\nWould you like me to help you order some? 🛍️`;
  }
  else if (lq.includes('breakfast')) {
    reply = "For a heavy breakfast, try our **Artisan Bread (₹95)** and **Organic Eggs (₹140)**. They are super fresh right now! 🥣";
  }
  else if (lq.includes('deal') || lq.includes('offer') || lq.includes('discount')) {
    reply = "Use coupon code **SAVE10** for 10% off on orders above ₹500! We also have a flat ₹50 off for new users using **WELCOME50**. 🎟️💰";
  }
  else if (lq.includes('who are you') || lq.includes('your name')) {
    reply = "I'm **FreshBot AI**, powered by the latest grocery prediction models (simulated). My goal is to help you eat fresh and save money! 🤖🍎";
  }
  else if (lq.includes('delivery') || lq.includes('time') || lq.includes('how long')) {
    reply = "We usually deliver in **30-45 minutes** in your area. Our riders are lightning fast! 🚚💨";
  }
  else if (lq.includes('thank')) {
    reply = "It's my pleasure! Happy shopping! 😊🛒";
  }
  else if (lq.includes('categories') || lq.includes('what do you have')) {
    const cats = [...new Set(products.map(p=>p.category))];
    reply = `We have everything you need in these categories: **${cats.join(', ')}**. Which one would you like to explore? 🥦`;
  }

  // Save bot response to history
  if (username) store.saveChatMessage(username, reply, 'bot');
  
  res.json({ reply });
});

module.exports = router;
