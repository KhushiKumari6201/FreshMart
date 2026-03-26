const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: { type: Number, unique: true, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  unit: { type: String, default: 'each' },
  image: { type: String, default: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop&auto=format' },
  description: { type: String, default: '' },
  inStock: { type: Boolean, default: true },
  ratingsCount: { type: Number, default: 10 },
  ratingSum: { type: Number, default: 45 },
  rating: { type: Number, default: 4.5 },
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
