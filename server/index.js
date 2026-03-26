require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const store = require('./models/store');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
const MONGODB_URI = "mongodb://localhost:27017/freshmart";

const connectDB = async () => {

  try {
    const connect = await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB connected: ${connect.connection.host}`);
    store.seedDataIfNeeded();

  } catch (error) {
    console.log("Error while connecting to MongoDB", error);
  }
}


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/chat', require('./routes/chat'));


// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  🛒  FreshMart Grocery App is running!`);
  console.log(`  ➜  Local:  http://localhost:${PORT}\n`);
});
