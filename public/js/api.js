/* ═══════════════════════════════════════════════════
   FreshMart — API Client
   ═══════════════════════════════════════════════════ */

const API = {
  BASE: '/api',

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const user = JSON.parse(localStorage.getItem('freshmart_user') || 'null');
    if (user) headers['X-Username'] = user.username;
    return headers;
  },

  async request(endpoint, options = {}) {
    try {
      const res = await fetch(this.BASE + endpoint, {
        ...options,
        headers: { ...this.getHeaders(), ...options.headers }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      return data;
    } catch (err) {
      throw err;
    }
  },

  // Auth
  login(username, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  register(username, password, name) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, name })
    });
  },

  // Products
  getProducts(category, search) {
    let url = '/products';
    const params = [];
    if (category) params.push('category=' + encodeURIComponent(category));
    if (search) params.push('search=' + encodeURIComponent(search));
    if (params.length) url += '?' + params.join('&');
    return this.request(url);
  },

  getCategories() {
    return this.request('/products/categories');
  },

  getProduct(id) {
    return this.request('/products/' + id);
  },

  // Admin product CRUD
  addProduct(data) {
    return this.request('/products', { method: 'POST', body: JSON.stringify(data) });
  },
  updateProduct(id, data) {
    return this.request('/products/' + id, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteProduct(id) {
    return this.request('/products/' + id, { method: 'DELETE' });
  },

  // Cart
  getCart() { return this.request('/cart'); },

  addToCart(productId, variationName = null, variationPrice = null, quantity = 1) {
    return this.request('/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, variationName, variationPrice, quantity })
    });
  },

  updateCartItem(productId, quantity) {
    return this.request('/cart/' + productId, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    });
  },

  removeFromCart(productId) {
    return this.request('/cart/' + productId, { method: 'DELETE' });
  },

  getCartCount() { return this.request('/cart/count'); },

  // Orders
  placeOrder(customerName, address, phone, paymentMethod, paymentDetails, couponCode = null) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify({ customerName, address, phone, paymentMethod, paymentDetails, couponCode })
    });
  },

  getOrders() { return this.request('/orders'); },

  // Wishlist
  getWishlist() { return this.request('/wishlist'); },
  toggleWishlist(productId) {
    return this.request('/wishlist/toggle/' + productId, { method: 'POST' });
  },

  // Coupons
  validateCoupon(code, amount) {
    return this.request('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, amount })
    });
  },

  // Admin
  getAllOrders() { return this.request('/orders/all'); },
  getAdminStats() { return this.request('/orders/admin/stats'); },
  updateOrderStatus(orderId, status) {
    return this.request('/orders/' + orderId + '/status', {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }
};
