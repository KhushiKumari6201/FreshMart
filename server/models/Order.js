const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: Number, required: true },
  name: { type: String, required: true },
  image: { type: String, default: '' },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  subtotal: { type: Number, required: true }
});

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  time: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  username: { type: String, required: true },
  items: [orderItemSchema],
  total: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  couponCode: { type: String, default: null },
  customerName: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  paymentMethod: { type: String, default: 'cod' },
  paymentDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, default: 'ordered' },
  statusHistory: [statusHistorySchema],
  paymentStatus: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
