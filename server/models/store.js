const Product = require('./Product');
const User = require('./User');
const Order = require('./Order');
const Chat = require('./Chat');
const Coupon = require('./Coupon');
const path = require('path');
const fs = require('fs');

class Store {
  constructor() {
    this.seedStarted = false;
    // We will ensure data is seeded when needed.
  }

  async seedDataIfNeeded() {
    if (this.seedStarted) return;
    this.seedStarted = true;
    try {
      const count = await Product.countDocuments();
      if (count === 0) {
        console.log('🌱 Seeding initial data from JSON files...');
        const productsPath = path.join(__dirname, '..', 'data', 'products.json');
        const dbPath = path.join(__dirname, '..', 'data', 'db.json');

        if (fs.existsSync(productsPath)) {
          const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
          await Product.insertMany(products);
          console.log(`✅ Loaded ${products.length} products`);
        }

        if (fs.existsSync(dbPath)) {
          const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
          if (db.users && Array.isArray(db.users)) {
            // Deduplicate local users list before inserting
            const uniqueUsers = [];
            const usernames = new Set();
            for (const u of db.users) {
              const uname = u.username.toLowerCase();
              if (!usernames.has(uname)) {
                usernames.add(uname);
                uniqueUsers.push(u);
              }
            }
            // Use try-catch or ordered:false if you want to skip duplicates
            try {
              await User.insertMany(uniqueUsers, { ordered: false });
            } catch (e) {
              console.warn('Some users were already present/duplicates, skipped.');
            }
          }
          if (db.orders && Array.isArray(db.orders)) {
             try {
              await Order.insertMany(db.orders, { ordered: false });
            } catch (e) {
              console.warn('Some orders were already present/duplicates, skipped.');
            }
          }
          // Migrate coupons too
          const initialCoupons = [
            { code: 'SAVE10', discount: 0.1, minAmount: 500, type: 'percent' },
            { code: 'FRESH20', discount: 0.2, minAmount: 800, type: 'percent' },
            { code: 'WELCOME50', discount: 50, minAmount: 0, type: 'flat' }
          ];
          try {
            await Coupon.insertMany(initialCoupons, { ordered: false });
          } catch (e) {}
          console.log('✅ Loaded database entries');
        }
      }
      
      // Ensure admin exists
      const admin = await User.findOne({ role: 'admin' });
      if (!admin) {
        await User.create({
          username: 'admin',
          password: 'admin123',
          name: 'Administrator',
          role: 'admin'
        });
        console.log('✅ Created default admin account');
      }

      // Ensure coupons exist if missing
      const couponCount = await Coupon.countDocuments();
      if (couponCount === 0) {
         await Coupon.insertMany([
          { code: 'SAVE10', discount: 0.1, minAmount: 500, type: 'percent' },
          { code: 'FRESH20', discount: 0.2, minAmount: 800, type: 'percent' },
          { code: 'WELCOME50', discount: 50, minAmount: 0, type: 'flat' }
        ]);
      }
    } catch (e) {
      console.error('❌ Seeding failed:', e);
    }
  }

  // ── Chat ─────────────────────────────────────────
  async getChatHistory(username) {
    if (!username) return [];
    const chat = await Chat.findOne({ username });
    return chat ? chat.messages : [];
  }

  async saveChatMessage(username, text, role) {
    if (!username) return;
    let chat = await Chat.findOne({ username });
    if (!chat) chat = new Chat({ username, messages: [] });
    chat.messages.push({ text, role, time: new Date() });
    if (chat.messages.length > 50) chat.messages.shift();
    await chat.save();
  }

  // ── Auth ──────────────────────────────────────
  async register(username, password, name) {
    if (!username || !password || !name) return { error: 'All fields are required' };
    if (username.length < 3) return { error: 'Username must be at least 3 characters' };
    if (password.length < 4) return { error: 'Password must be at least 4 characters' };
    
    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) return { error: 'Username already exists' };

    const user = await User.create({
      username: username.toLowerCase(),
      password,
      name,
      role: 'user',
      cart: { items: [] }
    });
    return { username: user.username, name: user.name, role: user.role };
  }

  async login(username, password) {
    if (!username || !password) return { error: 'Username and password required' };
    const user = await User.findOne({ username: username.toLowerCase(), password });
    if (!user) return { error: 'Invalid username or password' };
    return { username: user.username, name: user.name, role: user.role };
  }

  async getUser(username) {
    const user = await User.findOne({ username });
    if (!user) return null;
    return { username: user.username, name: user.name, role: user.role };
  }

  // ── Products ──────────────────────────────────
  async getAllProducts(category, search) {
    let query = { deleted: false };
    if (category) query.category = { $regex: new RegExp('^' + category + '$', 'i') };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    return await Product.find(query).sort({ id: 1 }).lean();
  }

  async getProductById(id) {
    return await Product.findOne({ id: parseInt(id), deleted: false }).lean();
  }

  async rateProduct(productId, rating) {
    const product = await Product.findOne({ id: parseInt(productId) });
    if (!product) return { error: 'Product not found' };
    
    product.ratingSum = (product.ratingSum || 0) + parseFloat(rating);
    product.ratingsCount = (product.ratingsCount || 0) + 1;
    product.rating = parseFloat((product.ratingSum / product.ratingsCount).toFixed(1));
    await product.save();
    return { id: product.id, rating: product.rating, ratingsCount: product.ratingsCount };
  }

  async getCategories() {
    return await Product.distinct('category', { deleted: false });
  }

  // Admin product CRUD
  async addProduct(data) {
    const lastProduct = await Product.findOne().sort({ id: -1 });
    const nextId = lastProduct ? lastProduct.id + 1 : 100;

    const product = await Product.create({
      id: nextId,
      name: data.name,
      category: data.category,
      price: parseFloat(data.price),
      unit: data.unit || 'each',
      image: data.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop&auto=format',
      description: data.description || '',
      inStock: data.inStock !== false
    });
    return product;
  }

  async updateProduct(id, data) {
    const product = await Product.findOne({ id: parseInt(id) });
    if (!product) return { error: 'Product not found' };
    
    if (data.name) product.name = data.name;
    if (data.category) product.category = data.category;
    if (data.price !== undefined) product.price = parseFloat(data.price);
    if (data.unit) product.unit = data.unit;
    if (data.image) product.image = data.image;
    if (data.description !== undefined) product.description = data.description;
    if (data.inStock !== undefined) product.inStock = data.inStock;
    
    await product.save();
    return product;
  }

  async deleteProduct(id) {
    const product = await Product.findOne({ id: parseInt(id) });
    if (!product) return { error: 'Product not found' };
    product.deleted = true;
    await product.save();
    return { success: true };
  }

  async getAllProductsAdmin() {
    return await Product.find({ deleted: false }).sort({ id: 1 }).lean();
  }

  // ── Cart ───────────────────────────────────────
  async _getUser(username) {
    let user = await User.findOne({ username: username.toLowerCase() });
    if (!user) throw new Error('User not found');
    if (!user.cart) user.cart = { items: [] };
    return user;
  }

  async getCart(username) {
    const user = await this._getUser(username);
    const cartItems = [];
    let total = 0;

    for (const item of user.cart.items) {
      const product = await this.getProductById(item.productId);
      const price = item.variationPrice !== undefined ? item.variationPrice : (product ? product.price : 0);
      const nameSuffix = item.variationName && item.variationName !== 'Standard' ? ` (${item.variationName})` : '';
      const subtotal = +(price * item.quantity).toFixed(2);
      
      cartItems.push({
        ...item.toObject(),
        product: product ? { ...product, name: product.name + nameSuffix, price } : null,
        subtotal
      });
      total += subtotal;
    }

    return { items: cartItems, total: +total.toFixed(2) };
  }

  async getCartItemCount(username) {
    const user = await this._getUser(username);
    return user.cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  async addToCart(username, productId, quantity = 1, variationName = null, variationPrice = null) {
    const product = await this.getProductById(productId);
    if (!product) return { error: 'Product not found' };
    if (!product.inStock) return { error: 'Product is out of stock' };

    const user = await this._getUser(username);
    const priceToUse = variationPrice !== null ? parseFloat(variationPrice) : product.price;
    const vName = variationName || 'Standard';

    const existing = user.cart.items.find(i => i.productId === parseInt(productId) && i.variationName === vName);
    if (existing) {
      existing.quantity += quantity;
    } else {
      user.cart.items.push({ 
        id: Date.now() + Math.random().toString(36).substring(2, 9), 
        productId: parseInt(productId), 
        quantity, 
        variationName: vName, 
        variationPrice: priceToUse 
      });
    }
    await user.save();
    return await this.getCart(username);
  }

  async updateCartItem(username, cartItemId, quantity) {
    const user = await this._getUser(username);
    const idx = user.cart.items.findIndex(i => i.id === cartItemId || String(i.productId) === String(cartItemId));
    if (idx === -1) return { error: 'Item not in cart' };

    if (quantity <= 0) {
      user.cart.items.splice(idx, 1);
    } else {
      user.cart.items[idx].quantity = quantity;
    }
    await user.save();
    return await this.getCart(username);
  }

  async removeFromCart(username, cartItemId) {
    const user = await this._getUser(username);
    const idx = user.cart.items.findIndex(i => i.id === cartItemId || String(i.productId) === String(cartItemId));
    if (idx === -1) return { error: 'Item not in cart' };
    user.cart.items.splice(idx, 1);
    await user.save();
    return await this.getCart(username);
  }

  // ── Wishlist ──────────────────────────────────
  async getWishlist(username) {
    const user = await this._getUser(username);
    const products = [];
    for (const id of user.wishlist) {
      const p = await this.getProductById(id);
      if (p) products.push(p);
    }
    return products;
  }

  async toggleWishlist(username, productId) {
    const user = await this._getUser(username);
    const pid = parseInt(productId);
    const idx = user.wishlist.indexOf(pid);
    let added = false;
    if (idx === -1) {
      user.wishlist.push(pid);
      added = true;
    } else {
      user.wishlist.splice(idx, 1);
      added = false;
    }
    await user.save();
    return { added };
  }

  // ── Coupons ────────────────────────────────────
  async validateCoupon(code, amount) {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) return { error: 'Invalid coupon code' };
    if (amount < coupon.minAmount) return { error: `Minimum order amount for this coupon is ₹${coupon.minAmount}` };
    
    let discount = 0;
    if (coupon.type === 'percent') {
      discount = +(amount * coupon.discount).toFixed(2);
    } else {
      discount = coupon.discount;
    }
    
    return { 
      success: true, 
      discount, 
      finalAmount: +(amount - discount).toFixed(2) 
    };
  }

  // ── Orders ────────────────────────────────────
  async placeOrder(username, customerName, address, phone, paymentMethod, paymentDetails, couponCode = null) {
    const user = await this._getUser(username);
    const cart = await this.getCart(username);
    if (cart.items.length === 0) return { error: 'Cart is empty' };

    const originalTotal = cart.total;
    let discount = 0;
    let finalTotal = originalTotal;

    if (couponCode) {
      const v = await this.validateCoupon(couponCode, originalTotal);
      if (v.error) return v;
      discount = v.discount;
      finalTotal = v.finalAmount;
    }

    const lastOrder = await Order.findOne().sort({ id: -1 });
    const nextId = lastOrder ? lastOrder.id + 1 : 1001;

    const order = await Order.create({
      id: nextId,
      username,
      items: cart.items.map(item => ({
        productId: item.productId,
        name: item.product ? item.product.name : 'Unknown Product',
        image: item.product ? item.product.image : '',
        price: item.variationPrice,
        quantity: item.quantity,
        subtotal: item.subtotal
      })),
      total: finalTotal,
      discount: discount,
      couponCode: couponCode,
      customerName,
      address,
      phone,
      paymentMethod: paymentMethod || 'cod',
      paymentDetails: paymentDetails || {},
      status: 'ordered',
      statusHistory: [{ status: 'ordered', time: new Date() }],
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid'
    });

    user.cart.items = [];
    await user.save();
    return order;
  }

  async getOrders(username) {
    return await Order.find({ username }).sort({ createdAt: -1 }).lean();
  }

  async getAllOrders() {
    return await Order.find().sort({ createdAt: -1 }).lean();
  }

  async updateOrderStatus(orderId, status) {
    const order = await Order.findOne({ id: parseInt(orderId) });
    if (!order) return { error: 'Order not found' };
    order.status = status;
    order.statusHistory.push({ status, time: new Date() });
    await order.save();
    return order;
  }

  // ── Admin Stats ───────────────────────────────
  async getAdminStats() {
    const totalProducts = await Product.countDocuments({ deleted: false });
    const orders = await Order.find();
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalUsers = await User.countDocuments({ role: 'user' });
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).lean();
    
    const ordersByStatus = {
    };
    return { totalProducts, totalOrders, totalRevenue, totalUsers, recentOrders, ordersByStatus };
  }
}

const store = new Store();

module.exports = store;
