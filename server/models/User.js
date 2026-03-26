const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  productId: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  variationName: { type: String, default: 'Standard' },
  variationPrice: { type: Number, required: true }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  cart: {
    items: [cartItemSchema]
  },
  wishlist: [{ type: Number }], // array of product ids
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
