const fs = require('fs');
const path = require('path');

class Store {
  constructor() {
    this.products = [];
    this.carts = {};       // keyed by username
    this.wishlists = {};   // keyed by username
    this.orders = [];
    this.users = [];
    this.coupons = [
      { code: 'SAVE10', discount: 0.10, minAmount: 500 },
      { code: 'FRESH20', discount: 0.20, minAmount: 1000 },
      { code: 'WELCOME50', discount: 0.50, minAmount: 2000 }
    ];
    this.orderIdCounter = 1000;
    this.productIdCounter = 100;
    this.loadProducts();
    this.seedAdmin();
  }

  loadProducts() {
    this.productsPath = path.join(__dirname, '..', 'data', 'products.json');
    const raw = fs.readFileSync(this.productsPath, 'utf-8');
    this.products = JSON.parse(raw);
    this.productIdCounter = Math.max(...this.products.map(p => p.id), 100) + 1;
  }

  saveProducts() {
    try {
      fs.writeFileSync(this.productsPath, JSON.stringify(this.products, null, 2));
      return true;
    } catch (e) {
      console.error('Failed to save products:', e);
      return false;
    }
  }

  seedAdmin() {
    this.users.push({
      username: 'admin',
      password: 'admin123',
      name: 'Administrator',
      role: 'admin',
      createdAt: new Date().toISOString()
    });
  }

  // ── Auth ──────────────────────────────────────
  register(username, password, name) {
    if (!username || !password || !name) return { error: 'All fields are required' };
    if (username.length < 3) return { error: 'Username must be at least 3 characters' };
    if (password.length < 4) return { error: 'Password must be at least 4 characters' };
    if (this.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { error: 'Username already exists' };
    }
    const user = {
      username: username.toLowerCase(),
      password,
      name,
      role: 'user',
      createdAt: new Date().toISOString()
    };
    this.users.push(user);
    this.carts[user.username] = { items: [] };
    return { username: user.username, name: user.name, role: user.role };
  }

  login(username, password) {
    if (!username || !password) return { error: 'Username and password required' };
    const user = this.users.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    if (!user) return { error: 'Invalid username or password' };
    return { username: user.username, name: user.name, role: user.role };
  }

  getUser(username) {
    const user = this.users.find(u => u.username === username);
    if (!user) return null;
    return { username: user.username, name: user.name, role: user.role };
  }

  // ── Products ──────────────────────────────────
  getAllProducts(category, search) {
    let results = this.products.filter(p => !p.deleted);
    if (category) {
      results = results.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    return results;
  }

  getProductById(id) {
    return this.products.find(p => p.id === parseInt(id) && !p.deleted);
  }

  rateProduct(productId, rating) {
    const product = this.getProductById(productId);
    if (!product) return { error: 'Product not found' };
    if (!product.ratingsCount) {
      product.ratingsCount = 10; // Base count for realism
      product.ratingSum = (product.rating || 4.5) * 10;
    }
    product.ratingSum += parseFloat(rating);
    product.ratingsCount += 1;
    product.rating = parseFloat((product.ratingSum / product.ratingsCount).toFixed(1));
    this.saveProducts(); // PERSIST TO FILE
    return { id: product.id, rating: product.rating, ratingsCount: product.ratingsCount };
  }

  getCategories() {
    const cats = [...new Set(this.products.filter(p => !p.deleted).map(p => p.category))];
    return cats.sort();
  }

  // Admin product CRUD
  addProduct(data) {
    const product = {
      id: this.productIdCounter++,
      name: data.name,
      category: data.category,
      price: parseFloat(data.price),
      unit: data.unit || 'each',
      image: data.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop&auto=format',
      description: data.description || '',
      inStock: data.inStock !== false
    };
    this.products.push(product);
    return product;
  }

  updateProduct(id, data) {
    const product = this.products.find(p => p.id === id);
    if (!product) return { error: 'Product not found' };
    if (data.name) product.name = data.name;
    if (data.category) product.category = data.category;
    if (data.price !== undefined) product.price = parseFloat(data.price);
    if (data.unit) product.unit = data.unit;
    if (data.image) product.image = data.image;
    if (data.description !== undefined) product.description = data.description;
    if (data.inStock !== undefined) product.inStock = data.inStock;
    return product;
  }

  deleteProduct(id) {
    const product = this.products.find(p => p.id === id);
    if (!product) return { error: 'Product not found' };
    product.deleted = true;
    return { success: true };
  }

  getAllProductsAdmin() {
    return this.products.filter(p => !p.deleted);
  }

  // ── Cart (per-user) ───────────────────────────
  _getUserCart(username) {
    if (!this.carts[username]) this.carts[username] = { items: [] };
    return this.carts[username];
  }

  getCart(username) {
    const cart = this._getUserCart(username);
    return {
      items: cart.items.map(item => {
        const product = this.getProductById(item.productId);
        const price = item.variationPrice !== undefined ? item.variationPrice : (product ? product.price : 0);
        const nameSuffix = item.variationName && item.variationName !== 'Standard' ? ` (${item.variationName})` : '';
        return {
          ...item,
          product: product ? { ...product, name: product.name + nameSuffix, price } : null,
          subtotal: +(price * item.quantity).toFixed(2)
        };
      }),
      total: this.getCartTotal(username)
    };
  }

  getCartTotal(username) {
    const cart = this._getUserCart(username);
    return +cart.items.reduce((sum, item) => {
      const product = this.getProductById(item.productId);
      const price = item.variationPrice !== undefined ? item.variationPrice : (product ? product.price : 0);
      return sum + (price * item.quantity);
    }, 0).toFixed(2);
  }

  getCartItemCount(username) {
    const cart = this._getUserCart(username);
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  addToCart(username, productId, quantity = 1, variationName = null, variationPrice = null) {
    const product = this.getProductById(productId);
    if (!product) return { error: 'Product not found' };
    if (!product.inStock) return { error: 'Product is out of stock' };

    const cart = this._getUserCart(username);
    const priceToUse = variationPrice !== null ? parseFloat(variationPrice) : product.price;
    const vName = variationName || 'Standard';

    const existing = cart.items.find(i => i.productId === productId && i.variationName === vName);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({ 
        id: Date.now() + Math.random().toString(36).substring(2, 9), 
        productId, 
        quantity, 
        variationName: vName, 
        variationPrice: priceToUse 
      });
    }
    return this.getCart(username);
  }

  updateCartItem(username, cartItemId, quantity) {
    const cart = this._getUserCart(username);
    const idx = cart.items.findIndex(i => i.id === cartItemId || i.productId === cartItemId);
    if (idx === -1) return { error: 'Item not in cart' };

    if (quantity <= 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = quantity;
    }
    return this.getCart(username);
  }

  removeFromCart(username, cartItemId) {
    const cart = this._getUserCart(username);
    const idx = cart.items.findIndex(i => i.id === cartItemId || i.productId === cartItemId);
    if (idx === -1) return { error: 'Item not in cart' };
    cart.items.splice(idx, 1);
    return this.getCart(username);
  }

  // ── Wishlist (per-user) ────────────────────────
  _getUserWishlist(username) {
    if (!this.wishlists[username]) this.wishlists[username] = [];
    return this.wishlists[username];
  }

  getWishlist(username) {
    const list = this._getUserWishlist(username);
    return list.map(id => this.getProductById(id)).filter(p => !!p);
  }

  toggleWishlist(username, productId) {
    const list = this._getUserWishlist(username);
    const idx = list.indexOf(productId);
    if (idx === -1) {
      list.push(productId);
      return { added: true };
    } else {
      list.splice(idx, 1);
      return { added: false };
    }
  }

  // ── Coupons ────────────────────────────────────
  validateCoupon(code, amount) {
    const coupon = this.coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
    if (!coupon) return { error: 'Invalid coupon code' };
    if (amount < coupon.minAmount) return { error: `Minimum order amount for this coupon is ₹${coupon.minAmount}` };
    return { success: true, discount: +(amount * coupon.discount).toFixed(2), finalAmount: +(amount * (1 - coupon.discount)).toFixed(2) };
  }

  // ── Orders ────────────────────────────────────
  placeOrder(username, customerName, address, phone, paymentMethod, paymentDetails, couponCode = null) {
    const cart = this._getUserCart(username);
    if (cart.items.length === 0) return { error: 'Cart is empty' };

    const originalTotal = this.getCartTotal(username);
    let discount = 0;
    let finalTotal = originalTotal;

    if (couponCode) {
      const v = this.validateCoupon(couponCode, originalTotal);
      if (v.error) return v;
      discount = v.discount;
      finalTotal = v.finalAmount;
    }

    const order = {
      id: ++this.orderIdCounter,
      username,
      items: cart.items.map(item => {
        const product = this.getProductById(item.productId);
        const price = item.variationPrice !== undefined ? item.variationPrice : (product ? product.price : 0);
        const nameSuffix = item.variationName && item.variationName !== 'Standard' ? ` (${item.variationName})` : '';
        return {
          productId: item.productId,
          name: (product ? product.name : 'Unknown Product') + nameSuffix,
          image: product ? product.image : '',
          price: price,
          quantity: item.quantity,
          subtotal: +(price * item.quantity).toFixed(2)
        };
      }),
      total: finalTotal,
      discount: discount,
      couponCode: couponCode,
      customerName,
      address,
      phone,
      paymentMethod: paymentMethod || 'cod',
      paymentDetails: paymentDetails || {},
      status: 'ordered',
      statusHistory: [
        { status: 'ordered', time: new Date().toISOString() }
      ],
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      createdAt: new Date().toISOString()
    };

    this.orders.push(order);
    this.carts[username] = { items: [] };
    return order;
  }

  getOrders(username) {
    return this.orders
      .filter(o => o.username === username)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Admin
  getAllOrders() {
    return this.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  updateOrderStatus(orderId, status) {
    const order = this.orders.find(o => o.id === parseInt(orderId));
    if (!order) return { error: 'Order not found' };
    order.status = status;
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({ status, time: new Date().toISOString() });
    return order;
  }

  // ── Admin Stats ───────────────────────────────
  getAdminStats() {
    const totalProducts = this.products.filter(p => !p.deleted).length;
    const totalOrders = this.orders.length;
    const totalRevenue = this.orders.reduce((sum, o) => sum + o.total, 0);
    const totalUsers = this.users.filter(u => u.role === 'user').length;
    const recentOrders = this.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    const ordersByStatus = {
      confirmed: this.orders.filter(o => o.status === 'confirmed').length,
      preparing: this.orders.filter(o => o.status === 'preparing').length,
      delivered: this.orders.filter(o => o.status === 'delivered').length,
      cancelled: this.orders.filter(o => o.status === 'cancelled').length
    };
    return { totalProducts, totalOrders, totalRevenue, totalUsers, recentOrders, ordersByStatus };
  }
}

module.exports = new Store();
