const express = require('express');
const router = express.Router();
const store = require('../models/store');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ── Google Gemini Configuration ─────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Middleware to get username from header
const getUsername = (req) => req.headers['x-username'] || null;

/**
 * GET /api/chat/history
 * Fetches persistence chat history for the logged-in user.
 */
router.get('/history', async (req, res) => {
  const username = getUsername(req);
  if (!username) return res.status(200).json([]);
  const history = await store.getChatHistory(username);
  res.json(history);
});

/**
 * POST /api/chat/message
 * Handles real-time AI conversation using Google Gemini.
 */
router.post('/message', async (req, res) => {
  let { message } = req.body;
  const username = getUsername(req);

  if (!message) return res.status(400).json({ error: 'Message is required' });
  message = message.trim();

  try {
    // 1. Fetch PREVIOUS history before saving the current message
    const history = username ? await store.getChatHistory(username) : [];

    // 2. Save NEW user message to persistent storage
    if (username) await store.saveChatMessage(username, message, 'user');

    // 3. Prepare Gemini-safe history (must alternate User-Model-User-Model)
    let chatHistory = history.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: String(m.text) }]
    }));

    // Find the first index where role is 'user' (Gemini requirement)
    const firstUserIdx = chatHistory.findIndex(m => m.role === 'user');
    chatHistory = firstUserIdx !== -1 ? chatHistory.slice(firstUserIdx) : [];
    
    // Ensure history ends with a 'model' response before starting a fresh chat
    if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user') {
       chatHistory.pop(); // Remove the last user message if it didn't have a bot reply yet
    }

    // Limit to last 12 messages for better focus
    chatHistory = chatHistory.slice(-12);

    // 4. Initialize the Gemini chat
    const chat = model.startChat({
      history: chatHistory
    });

    // Send the message to Gemini (No fixed personas or constraints)
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const reply = response.text();

    // Save AI response back to persistent history
    if (username) await store.saveChatMessage(username, reply, 'bot');
    
    res.json({ reply });

  } catch (error) {
    console.error('Gemini API Error:', error.message);
    const errorMsg = "I'm having a technical glitch connecting to my Gemini brain! Please try again later.";
    
    if (username) await store.saveChatMessage(username, errorMsg, 'bot');
    res.json({ reply: errorMsg });
  }
});

module.exports = router;
