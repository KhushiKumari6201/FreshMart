const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  messages: [{
    text: { type: String, required: true },
    role: { type: String, required: true }, // 'user' or 'ai'
    time: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
