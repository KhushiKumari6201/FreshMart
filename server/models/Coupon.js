const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discount: { type: Number, required: true }, // e.g. 0.1 for 10%
  minAmount: { type: Number, default: 0 },
  type: { type: String, enum: ['percent', 'flat'], default: 'percent' }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
