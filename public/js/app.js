/* ═══════════════════════════════════════════════════
   FreshMart — Main Application (SPA)
   Admin + User + Payment System
   ═══════════════════════════════════════════════════ */

const App = {
  currentRoute: '',
  checkoutData: null,

  // ── Session ─────────────────────────────────────
  getUser() {
    return JSON.parse(localStorage.getItem('freshmart_user') || 'null');
  },
  setUser(user) {
    localStorage.setItem('freshmart_user', JSON.stringify(user));
    this.updateNav();
  },
  isAdmin() {
    const u = this.getUser();
    return u && u.role === 'admin';
  },
  isLoggedIn() {
    return !!this.getUser();
  },

  // ── Init ────────────────────────────────────────
  init() {
    window.addEventListener('hashchange', () => this.route());
    document.getElementById('search-input').addEventListener('input',
      this.debounce((e) => this.handleSearch(e.target.value), 350)
    );
    
    document.body.addEventListener('click', (e) => {
      // Close suggestions on outside click
      if (!e.target.closest('#search-container')) {
        const sugg = document.getElementById('search-suggestions');
        if (sugg) sugg.style.display = 'none';
      }
      const btn = e.target.closest('.btn');
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = `${e.clientX - rect.left}px`;
      ripple.style.top = `${e.clientY - rect.top}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });

    this.initTheme();
    this.updateNav();
    this.updateCartBadge();
    this.initChatbot();
    this.route();
  },

  initTheme() {
    const toggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('freshmart_theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    toggle?.addEventListener('click', () => {
      const current = document.body.getAttribute('data-theme') || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      document.body.setAttribute('data-theme', next);
      localStorage.setItem('freshmart_theme', next);
    });
  },

  updateNav() {
    const user = this.getUser();
    const loginLink = document.getElementById('nav-login');
    const userLink = document.getElementById('nav-user');
    const logoutLink = document.getElementById('nav-logout');
    const adminLink = document.getElementById('nav-admin');
    const usernameSpan = document.getElementById('nav-username');

    if (user) {
      loginLink.style.display = 'none';
      userLink.style.display = '';
      logoutLink.style.display = '';
      usernameSpan.textContent = user.name || 'Profile';
      adminLink.style.display = user.role === 'admin' ? '' : 'none';
    } else {
      loginLink.style.display = '';
      userLink.style.display = 'none';
      logoutLink.style.display = 'none';
      adminLink.style.display = 'none';
    }
  },

  logout() {
    localStorage.removeItem('freshmart_user');
    this.updateNav();
    this.showToast('Logged out successfully');
    window.location.hash = '#/';
  },

  // ── Router ──────────────────────────────────────
  route() {
    const hash = window.location.hash || '#/';
    const app = document.getElementById('app');
    
    app.classList.remove('page-transition');
    void app.offsetWidth;
    app.classList.add('page-transition');

    document.querySelectorAll('.header__nav-link').forEach(l => l.classList.remove('active'));
    if (hash.startsWith('#/cart')) document.getElementById('nav-cart').classList.add('active');
    else if (hash.startsWith('#/wishlist')) document.getElementById('nav-wishlist').classList.add('active');
    else if (hash.startsWith('#/orders') && !hash.includes('admin')) document.getElementById('nav-orders').classList.add('active');
    else if (hash.startsWith('#/admin')) document.getElementById('nav-admin').classList.add('active');
    else if (hash.startsWith('#/login') || hash.startsWith('#/signup')) document.getElementById('nav-login')?.classList.add('active');
    else if (hash.startsWith('#/profile')) document.getElementById('nav-user')?.classList.add('active');
    else document.getElementById('nav-home').classList.add('active');

    if (hash === '#/' || hash === '#') this.renderHome(app);
    else if (hash === '#/login') this.renderLogin(app);
    else if (hash === '#/signup') this.renderSignup(app);
    else if (hash === '#/cart') this.renderCart(app);
    else if (hash === '#/checkout') this.renderCheckout(app);
    else if (hash === '#/payment') this.renderPayment(app);
    else if (hash.startsWith('#/confirmation/')) this.renderConfirmation(app, hash.split('/')[2]);
    else if (hash.startsWith('#/product/')) this.renderProductDetail(app, hash.split('/')[2]);
    else if (hash === '#/wishlist') this.renderWishlist(app);
    else if (hash === '#/orders') this.renderOrders(app);
    else if (hash === '#/profile') this.renderProfile(app);
    else if (hash === '#/admin') this.renderAdminDashboard(app);
    else if (hash === '#/admin/products') this.renderAdminProducts(app);
    else if (hash === '#/admin/orders') this.renderAdminOrders(app);
    else if (hash === '#/delivery') this.renderDelivery(app);
    else if (hash === '#/returns') this.renderReturns(app);
    else if (hash === '#/contact') this.renderContact(app);
    else if (hash.startsWith('#/social/')) this.renderSocial(app, hash.split('/')[2]);
    else this.renderHome(app);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // ── Social Media Page ──────────────────────────────────
  renderSocial(container, platform) {
    const socialData = {
      facebook: { name: 'Facebook', icon: '🔵', color: '#1877f2', handle: '@FreshMartOfficial', stats: '50K+ Followers', desc: 'Join our community for daily recipe tips, customer spotlights, and exclusive Facebook-only flash sales!' },
      twitter: { name: 'Twitter (X)', icon: '🐦', color: '#1da1f2', handle: '@FreshMartApp', stats: '12K+ Followers', desc: 'Follow us for real-time stock updates, quick support, and trending grocery news. We tweet daily fresh arrivals!' },
      instagram: { name: 'Instagram', icon: '📸', color: '#e1306c', handle: '@freshmart_fresh', stats: '35K+ Followers', desc: 'See the beauty of fresh produce. Tag us in your cooking photos #FreshMartCooks for a chance to get featured!' },
      linkedin: { name: 'LinkedIn', icon: '💼', color: '#0077b5', handle: 'FreshMart Inc.', stats: '5K+ Professionals', desc: 'Follow our professional journey, career opportunities, and corporate social responsibility initiatives.' },
      youtube: { name: 'YouTube', icon: '📺', color: '#ff0000', handle: 'FreshMart Kitchen', stats: '100K+ Subscribers', desc: 'Cooking tutorials, farm tours, and behind-the-scenes looks at how we source your fresh groceries.' }
    };

    const data = socialData[platform] || socialData.facebook;

    container.innerHTML = `
      <div class="static-page" style="padding:var(--sp-8) var(--sp-6); max-width:800px; margin:0 auto; animation: fadeUp var(--transition) ease;">
        <div style="text-align:center; margin-bottom:var(--sp-8);">
          <div style="font-size:4rem; margin-bottom:var(--sp-4);">${data.icon}</div>
          <h1 class="section-title" style="margin-bottom:var(--sp-2);">FreshMart on ${data.name}</h1>
          <p style="font-size:1.2rem; color:${data.color}; font-weight:700;">${data.handle}</p>
          <div style="display:inline-block; padding:var(--sp-1) var(--sp-4); background:var(--clr-surface); border-radius:var(--radius-full); border:1px solid var(--clr-border); margin-top:var(--sp-2); font-weight:600; color:var(--clr-text-light);">${data.stats}</div>
        </div>
        
        <div class="static-content" style="background:var(--clr-surface); padding:var(--sp-8); border-radius:var(--radius-lg); border:1px solid var(--clr-border-light); font-size:1.1rem; line-height:1.7;">
          <h3 style="margin-bottom:var(--sp-3); color:var(--clr-primary-dark);">About Our ${data.name} Community</h3>
          <p style="margin-bottom:var(--sp-6);">${data.desc}</p>
          
          <div style="background:rgba(0,0,0,0.03); padding:var(--sp-6); border-radius:var(--radius-md); border-left:4px solid ${data.color};">
            <p style="margin-bottom:var(--sp-4); font-style:italic;">"FreshMart is more than just a store; it's a lifestyle. We love connecting with our community across all platforms to share the joy of fresh food."</p>
            <strong>— The FreshMart Social Team</strong>
          </div>

          <div style="margin-top:var(--sp-8); text-align:center;">
            <a href="javascript:void(0)" class="btn btn-primary btn-lg" style="background:${data.color}; border-color:${data.color};" onclick="App.showToast('Redirecting to official ${data.name} page...')">Follow Us on ${data.name} →</a>
            <br>
            <a href="#/" style="display:inline-block; margin-top:var(--sp-4); color:var(--clr-text-muted); text-decoration:none;">← Back to Home</a>
          </div>
        </div>
      </div>
    `;
  },

  // ── Login Page ──────────────────────────────────
  renderLogin(container) {
    container.innerHTML = `
      <div class="auth-page">
        <div class="auth-card">
          <div class="auth-card__icon">👤</div>
          <h2 class="auth-card__title">Welcome Back</h2>
          <p class="auth-card__subtitle">Login to your FreshMart account</p>
          <form id="login-form">
            <div class="form-group">
              <label for="login-username">Username</label>
              <input type="text" id="login-username" placeholder="Enter username" required>
            </div>
            <div class="form-group">
              <label for="login-password">Password</label>
              <input type="password" id="login-password" placeholder="Enter password" required>
            </div>
            <div class="auth-error" id="login-error" style="display:none"></div>
            <button type="submit" class="btn btn-primary btn-lg" style="width:100%">Login →</button>
          </form>
          <p class="auth-card__footer">Don't have an account? <a href="#/signup">Sign Up</a></p>
          <div class="auth-card__demo">
            <strong>Demo Accounts:</strong><br>
            👤 User: signup as new user<br>
            🔑 Admin: <code>admin</code> / <code>admin123</code>
          </div>
        </div>
      </div>
    `;
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('login-error');
      errEl.style.display = 'none';
      try {
        const user = await API.login(
          document.getElementById('login-username').value.trim(),
          document.getElementById('login-password').value
        );
        this.setUser(user);
        this.updateCartBadge();
        this.showToast('Welcome back, ' + user.name + '! 🎉');
        window.location.hash = user.role === 'admin' ? '#/admin' : '#/';
      } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
      }
    });
  },

  // ── Signup Page ──────────────────────────────────
  renderSignup(container) {
    container.innerHTML = `
      <div class="auth-page">
        <div class="auth-card">
          <div class="auth-card__icon">🌟</div>
          <h2 class="auth-card__title">Create Account</h2>
          <p class="auth-card__subtitle">Join FreshMart for fresh groceries</p>
          <form id="signup-form">
            <div class="form-group">
              <label for="signup-name">Full Name</label>
              <input type="text" id="signup-name" placeholder="John Doe" required>
            </div>
            <div class="form-group">
              <label for="signup-username">Username</label>
              <input type="text" id="signup-username" placeholder="Choose a username" required>
            </div>
            <div class="form-group">
              <label for="signup-password">Password</label>
              <input type="password" id="signup-password" placeholder="Create a password" required>
            </div>
            <div class="auth-error" id="signup-error" style="display:none"></div>
            <button type="submit" class="btn btn-primary btn-lg" style="width:100%">Create Account →</button>
          </form>
          <p class="auth-card__footer">Already have an account? <a href="#/login">Login</a></p>
        </div>
      </div>
    `;
    document.getElementById('signup-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('signup-error');
      errEl.style.display = 'none';
      try {
        const user = await API.register(
          document.getElementById('signup-username').value.trim(),
          document.getElementById('signup-password').value,
          document.getElementById('signup-name').value.trim()
        );
        this.setUser(user);
        this.showToast('Account created! Welcome, ' + user.name + '! 🎉');
        window.location.hash = '#/';
      } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
      }
    });
  },

  async renderHome(container, category = null, search = null) {
    container.innerHTML = `
      <section class="hero skeleton" style="height:320px; border-radius:16px; margin-bottom:32px;"></section>
      <div class="product-grid">
        ${Array(8).fill('<div class="product-card skeleton" style="height:400px; background:#fff; border-radius:16px;"></div>').join('')}
      </div>
    `;
    try {
      const [products, categories, wishlist] = await Promise.all([
        API.getProducts(category, search),
        API.getCategories(),
        this.isLoggedIn() ? API.getWishlist() : Promise.resolve([])
      ]);
      const wishIds = new Set(wishlist.map(p => p.id));
      const emojis = {'Fruits':'🍎','Vegetables':'🥬','Dairy':'🧀','Bakery':'🍞','Beverages':'☕','Snacks':'🍿','Meat & Seafood':'🥩','Pantry Staples':'🥫'};
      
      container.innerHTML = `
        <section class="hero">
          <div class="rotating-badge">
            <svg viewBox="0 0 100 100">
              <path id="circlePath" d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" fill="none" />
              <text font-size="10" font-weight="800" letter-spacing="2.5">
                <textPath href="#circlePath" startOffset="0%">100% ORGANIC • GUARANTEED FRESH • </textPath>
              </text>
            </svg>
            <div class="rotating-badge__inner">⭐</div>
          </div>
          <div class="hero-floating-icons">
            <div class="hero-icon" style="top:10%; right:15%; animation-delay:0s">🥑</div>
            <div class="hero-icon" style="top:40%; right:35%; animation-delay:1.5s; font-size:2.5rem">🛒</div>
            <div class="hero-icon" style="top:60%; right:10%; animation-delay:2.5s">🥦</div>
            <div class="hero-icon" style="top:80%; right:45%; animation-delay:4s; font-size:2rem">🧀</div>
          </div>
          <h1 class="hero__title">Fresh Groceries,<br>Delivered Fast 🚀</h1>
          <p class="hero__subtitle">Shop from 50+ premium quality items. From farm-fresh fruits to artisan bakery — everything you need in one place.</p>
          <a href="#/" class="hero__cta" onclick="document.querySelector('.categories')?.scrollIntoView({behavior:'smooth'})">Start Shopping →</a>
        </section>
        <div class="categories" id="category-filter">
          <button class="category-chip ${!category ? 'active' : ''}" data-category="">🏷️ All Items</button>
          ${categories.map(cat => `<button class="category-chip ${category === cat ? 'active' : ''}" data-category="${cat}">${emojis[cat]||'📦'} ${cat}</button>`).join('')}
        </div>
        <div>
          <h2 class="section-title">${category ? (emojis[category]||'') + ' ' + category : '🛍️ All Products'}
            <span style="font-size:0.9rem;color:var(--clr-text-muted);font-weight:400">(${products.length} items)</span>
          </h2>
          ${products.length === 0 ? `<div class="empty-state"><div class="empty-state__icon">🔍</div><h3 class="empty-state__title">No products found</h3><a href="#/" class="btn btn-primary">View All</a></div>` :
          `<div class="product-grid">${products.map((p, i) => this.renderProductCard(p, i, wishIds.has(p.id))).join('')}</div>`}
        </div>
      `;
      // Chip click events
      container.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          this.renderHome(container, chip.dataset.category || null, null);
          document.getElementById('search-input').value = '';
        });
      });
      // Add to cart events
      container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { 
          e.preventDefault(); 
          const id = parseInt(btn.dataset.id);
          const qty = parseInt(document.getElementById('qty-' + id)?.value) || 1;
          this.addToCart(id, null, null, qty, btn); 
          this.flyToCartAnimation(btn);
        });
      });

      // Initialize 3D Tilt and IntersectionObserver for Staggered Load
      const cards = container.querySelectorAll('.product-card');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.animationPlayState = 'running';
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      cards.forEach((card) => {
        observer.observe(card);
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -18;
          const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 18;
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(-2deg) scale(1.04) translateY(-10px)`;
          
          // Enhanced dynamic glare effect
          const gx = (x / rect.width) * 100;
          const gy = (y / rect.height) * 100;
          card.style.backgroundImage = `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.1) 0%, transparent 70%), var(--grad-card)`;
        });
        card.addEventListener('mouseleave', () => { 
          card.style.transform = ''; 
          card.style.backgroundImage = 'var(--grad-card)';
        });
      });

    } catch (err) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">⚠️</div><h3>${err.message}</h3></div>`;
    }
  },

  renderProductCard(p, i, isWishlisted = false) {
    const rating = p.rating || (Math.random() * (5 - 3.8) + 3.8).toFixed(1);
    const delTime = Math.floor(Math.random() * (45 - 20) + 20);
    return `
      <div class="product-card stagger-${(i % 8) + 1} ${!p.inStock ? 'out-of-stock' : ''}">
        <div class="product-card__image-wrap" style="position:relative;">
          <a href="#/product/${p.id}" class="product-card__image" style="display:flex; text-decoration:none;">
            <span class="product-card__category">${p.category}</span>
            <img src="${p.image}" alt="${p.name}" loading="lazy" style="${!p.inStock ? 'filter:grayscale(1) opacity(0.5)' : ''}">
          </a>
          <button class="product-card__wish ${isWishlisted ? 'active' : ''}" data-id="${p.id}" onclick="event.preventDefault(); event.stopPropagation(); App.toggleWishlist(${p.id}, this)">
            ${isWishlisted ? '❤️' : '🤍'}
          </button>
          ${!p.inStock ? '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.7);color:#fff;padding:4px 12px;border-radius:var(--radius-sm);font-weight:700;z-index:6;pointer-events:none;">OUT OF STOCK</div>' : ''}
        </div>
        <div class="product-card__body">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
            <a href="#/product/${p.id}" style="text-decoration:none; color:inherit; flex:1;">
              <h3 class="product-card__name">${p.name}</h3>
            </a>
            <div class="rating-badge-animated" style="font-size:var(--fs-xs); background:var(--clr-primary-glow); color:var(--clr-primary-dark); padding:2px 6px; border-radius:4px; font-weight:700; cursor:pointer;" onclick="event.preventDefault(); event.stopPropagation(); App.openRatingModal(${p.id}, '${p.name}', ${rating})">⭐ <span id="rating-val-${p.id}">${rating}</span></div>
          </div>
          <p class="product-card__desc">${p.description || 'Premium quality farm-fresh product.'}</p>
          <div style="font-size:0.7rem; color:var(--clr-text-muted); margin-bottom:var(--sp-4); display:flex; align-items:center; gap:4px;">🕒 Delivery: ${delTime} mins</div>
          <div class="product-card__footer">
            <div><span class="product-card__price">₹${p.price.toFixed(2)}</span><span class="product-card__unit">/ ${p.unit}</span></div>
            <div style="display:flex; align-items:center; gap:var(--sp-2);">
              ${p.inStock ? `
                <input type="number" id="qty-${p.id}" value="1" min="1" max="99" style="width:45px; height:28px; text-align:center; border:2px solid var(--clr-border); border-radius:var(--radius-sm); font-size:var(--fs-sm); outline:none;" onclick="event.preventDefault(); event.stopPropagation();">
                <button class="btn btn-primary btn-sm add-to-cart-btn" data-id="${p.id}">+ Add</button>
              ` : `
                <button class="btn btn-secondary btn-sm" disabled style="opacity:0.6;cursor:not-allowed;">📋 Remind Me</button>
              `}
            </div>
          </div>
        </div>
      </div>`;
  },

  // ── Product Detail Page ──────────────────────────
  async renderProductDetail(container, id) {
    container.innerHTML = `
      <div class="product-detail" style="padding:var(--sp-8) var(--sp-6)">
        <div class="product-detail__grid">
          <div class="product-detail__image skeleton" style="aspect-ratio:1/1;"></div>
          <div class="product-detail__info">
            <div class="skeleton" style="height:30px; width:150px; margin-bottom:20px;"></div>
            <div class="skeleton" style="height:60px; width:100%; margin-bottom:20px;"></div>
            <div class="skeleton" style="height:40px; width:200px; margin-bottom:40px;"></div>
            <div class="skeleton" style="height:150px; width:100%; margin-bottom:40px;"></div>
            <div class="skeleton" style="height:60px; width:100%;"></div>
          </div>
        </div>
      </div>
    `;
    try {
      const product = await API.getProduct(id);
      container.innerHTML = `
        <div class="product-detail" style="padding:var(--sp-8) var(--sp-6)">
          <a href="javascript:history.back()" class="product-detail__back">← Back to Shopping</a>
          <div class="product-detail__grid">
            <div class="product-detail__image">
              <span class="product-detail__category" style="position:absolute;top:var(--sp-4);left:var(--sp-4);z-index:1">${product.category}</span>
              <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-detail__info">
              <h1 class="product-detail__title">${product.name}</h1>
              <div class="product-detail__price-wrap" style="align-items:center; margin-bottom:var(--sp-4); padding-bottom:var(--sp-4);">
                <span class="product-detail__price" id="detail-price">₹${product.price.toFixed(2)}</span>
                <span class="product-detail__unit">/ ${product.unit}</span>
                ${product.inStock ? '<span class="status-badge status-confirmed" style="margin-left:var(--sp-4)">In Stock</span>' : '<span class="status-badge status-cancelled" style="margin-left:var(--sp-4)">Out of Stock</span>'}
              </div>

              ${(() => {
                const isKg = product.unit.toLowerCase() === 'kg';
                const qualities = [
                  { name: 'Standard', mult: 1 },
                  { name: 'Premium Grade A', mult: 1.15 },
                  { name: '100% Organic', mult: 1.30 }
                ];
                const sellers = [
                  { name: 'FreshMart Direct', add: 0 },
                  { name: 'GreenValley Farms', add: 15 },
                  { name: 'Wholesale Co.', add: -5 }
                ];
                const weights = isKg ? [
                  { name: '1 kg', mult: 1 },
                  { name: '500 g', mult: 0.5 },
                  { name: '250 g', mult: 0.25 },
                  { name: '2 kg', mult: 2.0 },
                  { name: '5 kg', mult: 5.0 }
                ] : [
                  { name: 'Standard', mult: 1 }
                ];

                const inlineLogic = `
                  const bp = ${product.price};
                  const qBtn = document.querySelector('.qual-chips .active');
                  const sBtn = document.querySelector('.sell-chips .active');
                  const wBtn = document.querySelector('.weight-chips .active');
                  
                  const wMult = parseFloat(wBtn.dataset.mult);
                  const isKg = ${isKg};
                  const wName = isKg ? ' [' + wBtn.dataset.name + ']' : '';
                  
                  const finalPrice = ((bp * parseFloat(qBtn.dataset.mult)) * wMult) + parseFloat(sBtn.dataset.add);
                  document.getElementById('detail-price').innerText = '₹' + finalPrice.toFixed(2);
                  document.getElementById('sel-var-name').value = qBtn.dataset.name + wName + ' (Sold by: ' + sBtn.dataset.name + ')';
                  document.getElementById('sel-var-price').value = finalPrice.toFixed(2);
                `.replace(/\n/g, ' ');

                return `
                  <div class="product-variations" style="margin-bottom:var(--sp-6);">
                    ${isKg ? `
                    <!-- Weight Section -->
                    <strong style="display:block;margin-bottom:var(--sp-2);font-size:var(--fs-sm);color:var(--clr-text-light);text-transform:uppercase;letter-spacing:1px;">Weight / Size</strong>
                    <div style="display:flex;gap:var(--sp-3);flex-wrap:wrap;margin-bottom:var(--sp-5);" class="weight-chips">
                      ${weights.map((w, i) => `
                        <button class="category-chip ${i === 0 ? 'active' : ''}" data-name="${w.name}" data-mult="${w.mult}" style="padding:var(--sp-2) var(--sp-4);"
                          onclick="document.querySelectorAll('.weight-chips .category-chip').forEach(c=>c.classList.remove('active')); this.classList.add('active'); ${inlineLogic}">
                          ${w.name}
                        </button>
                      `).join('')}
                    </div>
                    ` : '<div class="weight-chips" style="display:none;"><button class="category-chip active" data-name="Standard" data-mult="1"></button></div>'}

                    <!-- Quality Section -->
                    <strong style="display:block;margin-bottom:var(--sp-2);font-size:var(--fs-sm);color:var(--clr-text-light);text-transform:uppercase;letter-spacing:1px;">Quality Type</strong>
                    <div style="display:flex;gap:var(--sp-3);flex-wrap:wrap;margin-bottom:var(--sp-5);" class="qual-chips">
                      ${qualities.map((q, i) => `
                        <button class="category-chip ${i === 0 ? 'active' : ''}" data-name="${q.name}" data-mult="${q.mult}" style="padding:var(--sp-2) var(--sp-4);"
                          onclick="document.querySelectorAll('.qual-chips .category-chip').forEach(c=>c.classList.remove('active')); this.classList.add('active'); ${inlineLogic}">
                          ${q.name}
                        </button>
                      `).join('')}
                    </div>

                    <!-- Seller Section -->
                    <strong style="display:block;margin-bottom:var(--sp-2);font-size:var(--fs-sm);color:var(--clr-text-light);text-transform:uppercase;letter-spacing:1px;">Sold By</strong>
                    <div style="display:flex;gap:var(--sp-3);flex-wrap:wrap;" class="sell-chips">
                      ${sellers.map((s, i) => `
                        <button class="category-chip ${i === 0 ? 'active' : ''}" data-name="${s.name}" data-add="${s.add}" style="text-align:left;padding:var(--sp-2) var(--sp-4);height:auto;flex-direction:column;align-items:flex-start;gap:2px;"
                          onclick="document.querySelectorAll('.sell-chips .category-chip').forEach(c=>c.classList.remove('active')); this.classList.add('active'); ${inlineLogic}">
                          <div style="font-weight:600;">${s.name}</div>
                          <div style="font-size:var(--fs-xs);opacity:0.8;">${s.add > 0 ? '+₹'+s.add.toFixed(2) : s.add < 0 ? '-₹'+Math.abs(s.add).toFixed(2) : 'Free'} Delivery</div>
                        </button>
                      `).join('')}
                    </div>

                    <input type="hidden" id="sel-var-name" value="${qualities[0].name}${isKg ? ' ['+weights[0].name+']' : ''} (Sold by: ${sellers[0].name})">
                    <input type="hidden" id="sel-var-price" value="${((product.price * qualities[0].mult) * weights[0].mult + sellers[0].add).toFixed(2)}">
                  </div>
                `;
              })()}

              <p class="product-detail__desc" style="font-size:1.1rem; opacity:0.9;">${product.description}</p>
              
              <div class="product-detail__actions">
                ${product.inStock 
                  ? `<div style="display:flex; gap:var(--sp-4); width:100%;">
                       <div style="display:flex; align-items:center; gap:var(--sp-2); border:2px solid var(--clr-border); border-radius:var(--radius-md); padding:0 var(--sp-2);">
                         <span style="font-weight:600; color:var(--clr-text-light);">Qty:</span>
                         <input type="number" id="detail-qty" value="1" min="1" max="20" style="width:60px; height:100%; text-align:center; border:none; background:transparent; font-size:var(--fs-lg); font-weight:800; outline:none; color:var(--clr-primary-dark);">
                       </div>
                       <button class="btn btn-secondary btn-lg" style="flex:1;" onclick="App.addToCart(${product.id}, document.getElementById('sel-var-name') ? document.getElementById('sel-var-name').value : null, document.getElementById('sel-var-price') ? document.getElementById('sel-var-price').value : null, parseInt(document.getElementById('detail-qty').value)||1, this)">🛒 Add to Cart</button>
                       <button class="btn btn-primary btn-lg" style="flex:1;" onclick="App.buyNow(${product.id}, document.getElementById('sel-var-name') ? document.getElementById('sel-var-name').value : null, document.getElementById('sel-var-price') ? document.getElementById('sel-var-price').value : null, parseInt(document.getElementById('detail-qty').value)||1)">⚡ Buy Now</button>
                     </div>`
                  : `<button class="btn btn-secondary btn-lg" style="width:100%;" disabled>Out of Stock</button>`}
              </div>

              <div class="product-detail__meta">
                <div class="product-detail__meta-item">
                  <span>🚀</span>
                  <div class="product-detail__meta-text">
                    <strong>Express Delivery</strong>
                    <p>Delivered in 30-45 minutes to your doorstep.</p>
                  </div>
                </div>
                <div class="product-detail__meta-item">
                  <span>🛡️</span>
                  <div class="product-detail__meta-text">
                    <strong>Quality Guarantee</strong>
                    <p>100% fresh, hygienic, and thoroughly checked.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    } catch(err) {
      container.innerHTML = `<div class="empty-state" style="margin-top:var(--sp-12)"><div class="empty-state__icon">⚠️</div><h3>${err.message}</h3><a href="#/" class="btn btn-primary" style="margin-top:var(--sp-4)">Go Home</a></div>`;
    }
  },

  // ── Delivery Page ──────────────────────────────────
  renderDelivery(container) {
    container.innerHTML = `
      <div class="static-page" style="padding:var(--sp-8) var(--sp-6); max-width:800px; margin:0 auto; animation: fadeUp var(--transition) ease;">
        <h1 class="section-title">🚚 Delivery Information</h1>
        <div class="static-content" style="background:var(--clr-surface); padding:var(--sp-8); border-radius:var(--radius-lg); border:1px solid var(--clr-border-light); font-size:1.1rem; line-height:1.7;">
          <h3 style="margin-bottom:var(--sp-3); color:var(--clr-primary-dark);">Fast & Reliable Delivery</h3>
          <p style="margin-bottom:var(--sp-5);">We offer express delivery within 30-45 minutes for all orders. Free express delivery is available on orders over ₹500. We ensure that fresh goods are stored in insulated bags during transit.</p>
          <h3 style="margin-bottom:var(--sp-3); color:var(--clr-primary-dark);">Delivery Areas</h3>
          <p style="margin-bottom:var(--sp-5);">Currently, we deliver to all major areas within the city. Check your pincode at checkout to confirm service availability in your area.</p>
          <h3 style="margin-bottom:var(--sp-3); color:var(--clr-primary-dark);">Scheduling</h3>
          <p>You can also schedule your delivery for a later time during checkout to ensure you're available to receive your fresh groceries.</p>
        </div>
      </div>
    `;
  },

  // ── Returns Policy ──────────────────────────────────
  renderReturns(container) {
    container.innerHTML = `
      <div class="static-page" style="padding:var(--sp-8) var(--sp-6); max-width:800px; margin:0 auto; animation: fadeUp var(--transition) ease;">
        <h1 class="section-title">♻️ Returns & Refunds</h1>
        <div class="static-content" style="background:var(--clr-surface); padding:var(--sp-8); border-radius:var(--radius-lg); border:1px solid var(--clr-border-light); font-size:1.1rem; line-height:1.7;">
          <h3 style="margin-bottom:var(--sp-3); color:var(--clr-primary-dark);">100% Satisfaction Guarantee</h3>
          <p style="margin-bottom:var(--sp-5);">If you're not satisfied with the quality of our products, we offer a 100% money-back guarantee. Your satisfaction is our top priority.</p>
          <h3 style="margin-bottom:var(--sp-3); color:var(--clr-primary-dark);">How to Return</h3>
          <p style="margin-bottom:var(--sp-5);">You can initiate a return within 24 hours of delivery. Contact our support team or use the order history page to request a return or report an issue.</p>
          <h3 style="margin-bottom:var(--sp-3); color:var(--clr-primary-dark);">Refund Process</h3>
          <p>Refunds are processed immediately upon return approval and will reflect in your original payment method within 3-5 business days. For COD orders, refund will be deposited into your wallet.</p>
        </div>
      </div>
    `;
  },

  // ── Contact Us ──────────────────────────────────
  renderContact(container) {
    container.innerHTML = `
      <div class="static-page" style="padding:var(--sp-8) var(--sp-6); max-width:800px; margin:0 auto; animation: fadeUp var(--transition) ease;">
        <h1 class="section-title">📞 Contact Us</h1>
        <div class="static-content" style="background:var(--clr-surface); padding:var(--sp-8); border-radius:var(--radius-lg); border:1px solid var(--clr-border-light); font-size:1.1rem; line-height:1.7;">
          <h3 style="margin-bottom:var(--sp-5); color:var(--clr-primary-dark);">Get in Touch</h3>
          <p style="margin-bottom:var(--sp-5);">We're here to help! Reach out to us anytime regarding any questions, feedback, or issues. We usually reply within an hour.</p>
          <ul style="list-style:none; padding:0; margin:0;">
            <li style="margin-bottom:var(--sp-5); display:flex; align-items:center; gap:var(--sp-4);"><span style="font-size:2rem;">📧</span> <div><strong>Email:</strong><br><a href="mailto:support@freshmart.com" style="color:var(--clr-primary); text-decoration:none;">support@freshmart.com</a></div></li>
            <li style="margin-bottom:var(--sp-5); display:flex; align-items:center; gap:var(--sp-4);"><span style="font-size:2rem;">📱</span> <div><strong>Phone:</strong><br><a href="tel:18001234567" style="color:var(--clr-primary); text-decoration:none;">+91 1800-123-4567</a></div></li>
            <li style="display:flex; align-items:center; gap:var(--sp-4);"><span style="font-size:2rem;">🕒</span> <div><strong>Hours:</strong><br>24/7 Customer Support</div></li>
          </ul>
        </div>
      </div>
    `;
  },

  // ── Cart Page ──────────────────────────────────
  async renderCart(container) {
    if (!this.isLoggedIn()) { window.location.hash = '#/login'; return; }
    container.innerHTML = `
      <div class="cart-page">
        <div class="skeleton" style="height:50px; width:300px; margin-bottom:40px;"></div>
        <div class="cart-layout">
          <div class="cart-items">
            ${Array(3).fill('<div class="cart-item skeleton" style="height:120px; width:100%;"></div>').join('')}
          </div>
          <div class="cart-summary skeleton" style="height:400px; width:100%;"></div>
        </div>
      </div>
    `;
    try {
      const cart = await API.getCart();
      if (cart.items.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">🛒</div><h3 class="empty-state__title">Your cart is empty</h3><p class="empty-state__text">Add some fresh groceries!</p><a href="#/" class="btn btn-primary btn-lg">Browse Products</a></div>`;
        return;
      }
      const cnt = cart.items.reduce((s,i)=>s+i.quantity,0);
      container.innerHTML = `
        <div class="cart-page">
          <div class="cart-page__header"><h1 class="section-title">🛒 Your Cart</h1><span style="color:var(--clr-text-muted)">${cnt} item${cnt>1?'s':''}</span></div>
          <div class="cart-layout">
            <div class="cart-items">
              ${cart.items.map(item => `
                <div class="cart-item">
                  <div class="cart-item__image"><img src="${item.product.image}" alt="${item.product.name}"></div>
                  <div class="cart-item__info"><div class="cart-item__name">${item.product.name}</div><div class="cart-item__price">₹${item.product.price.toFixed(2)} / ${item.product.unit}</div></div>
                  <div class="cart-item__controls">
                    <div class="cart-item__qty">
                      <button class="btn-icon qty-btn" data-id="${item.id || item.productId}" data-action="decrease">−</button>
                      <span class="cart-item__qty-val">${item.quantity}</span>
                      <button class="btn-icon qty-btn" data-id="${item.id || item.productId}" data-action="increase">+</button>
                    </div>
                    <button class="btn btn-danger btn-sm remove-btn" data-id="${item.id || item.productId}">✕</button>
                  </div>
                  <div class="cart-item__subtotal">₹${item.subtotal.toFixed(2)}</div>
                </div>`).join('')}
            </div>
            <div class="cart-summary">
              <h3 class="cart-summary__title">Order Summary</h3>
              <div class="cart-summary__row"><span>Subtotal</span><span>₹${cart.total.toFixed(2)}</span></div>
              <div class="cart-summary__row"><span>Delivery Fee</span><span style="color:var(--clr-primary)">FREE</span></div>
              <div class="cart-summary__row"><span>Tax (est.)</span><span>₹${(cart.total*0.08).toFixed(2)}</span></div>
              <div class="cart-summary__total"><span>Total</span><span>₹${(cart.total*1.08).toFixed(2)}</span></div>
              <a href="#/checkout" class="btn btn-primary btn-lg">Proceed to Checkout →</a>
              <a href="#/" class="btn btn-secondary btn-lg" style="margin-top:var(--sp-3)">Continue Shopping</a>
            </div>
          </div>
        </div>
      `;
      container.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const isInc = btn.dataset.action === 'increase';
          const item = cart.items.find(i=>String(i.id)===id || String(i.productId)===id);
          if(!item) return;
          
          const nq = isInc ? item.quantity + 1 : item.quantity - 1;
          
          // Show "dynamic" update by disabling buttons immediately
          btn.parentElement.style.opacity = '0.5';
          btn.parentElement.style.pointerEvents = 'none';
          
          try {
            if(nq <= 0) {
              if (confirm('Remove this item from cart?')) await API.removeFromCart(id);
              else {
                btn.parentElement.style.opacity = '1';
                btn.parentElement.style.pointerEvents = 'auto';
                return;
              }
            } else {
              await API.updateCartItem(id, nq);
            }
            this.renderCart(container); 
            this.updateCartBadge();
          } catch(err) {
            this.showToast('Update failed');
            btn.parentElement.style.opacity = '1';
            btn.parentElement.style.pointerEvents = 'auto';
          }
        });
      });
      container.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('Are you sure you want to remove this item?')) {
            await API.removeFromCart(btn.dataset.id);
            this.showToast('Item removed'); 
            this.renderCart(container); 
            this.updateCartBadge();
          }
        });
      });
    } catch (err) { container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">⚠️</div><h3>${err.message}</h3></div>`; }
  },

  // ── Checkout Page ──────────────────────────────
  async renderCheckout(container) {
    if (!this.isLoggedIn()) { window.location.hash = '#/login'; return; }
    container.innerHTML = '<div class="spinner"></div>';
    try {
      const cart = await API.getCart();
      if (cart.items.length === 0) { window.location.hash = '#/cart'; return; }
      const user = this.getUser();
      let discount = 0;
      let couponCode = '';

      container.innerHTML = `
        <div class="checkout-page">
          <h1 class="section-title">📋 Checkout</h1>
          <div class="checkout-layout">
            <form class="checkout-form" id="checkout-form">
              <h3 style="margin-bottom:var(--sp-6);font-size:var(--fs-lg)">Delivery Details</h3>
              <div class="form-group"><label>Full Name *</label><input type="text" id="customer-name" placeholder="Your name" value="${user.name||''}" required><span class="error-msg">Required</span></div>
              <div class="form-group"><label>Phone Number *</label><input type="tel" id="customer-phone" placeholder="+91 98765 43210" required><span class="error-msg">Required</span></div>
              <div class="form-group"><label>Delivery Address *</label><textarea id="customer-address" placeholder="Full delivery address" required></textarea><span class="error-msg">Required</span></div>
              
              <div class="coupon-section" style="margin-top:var(--sp-8); background:var(--clr-bg-card); padding:var(--sp-4); border-radius:var(--radius-md); border:1px solid var(--clr-border);">
                <h4 style="margin-bottom:var(--sp-3)">Apply Coupon</h4>
                <div style="display:flex; gap:var(--sp-2)">
                  <input type="text" id="coupon-input" placeholder="SAVE10, FRESH20..." style="flex:1; padding:var(--sp-2); border:1px solid var(--clr-border); border-radius:var(--radius-sm); font-family:monospace; font-weight:700; text-transform:uppercase;">
                  <button type="button" class="btn btn-secondary" id="apply-coupon">Apply</button>
                </div>
                <p id="coupon-msg" style="font-size:var(--fs-xs); margin-top:var(--sp-1); height:1em;"></p>
                <div style="margin-top:var(--sp-2); font-size:var(--fs-xs); color:var(--clr-text-muted)">Try <strong>SAVE10</strong> for 10% off orders above ₹500</div>
              </div>

              <button type="submit" class="btn btn-primary btn-lg" style="width:100%; margin-top:var(--sp-6)">Continue to Payment →</button>
            </form>
            <div class="cart-summary" id="checkout-summary">
              ${this._getSummaryHTML(cart, 0)}
            </div>
          </div>
        </div>
      `;

      document.getElementById('apply-coupon').addEventListener('click', async () => {
        const code = document.getElementById('coupon-input').value.trim();
        const msg = document.getElementById('coupon-msg');
        if(!code) return;
        try {
          const res = await API.validateCoupon(code, cart.total);
          discount = res.discount;
          couponCode = code;
          msg.textContent = `✅ Applied! You saved ₹${discount.toFixed(2)}`;
          msg.style.color = 'var(--clr-primary)';
          document.getElementById('checkout-summary').innerHTML = this._getSummaryHTML(cart, discount);
        } catch(err) {
          msg.textContent = '❌ ' + err.message;
          msg.style.color = 'var(--clr-danger)';
          discount = 0;
          couponCode = '';
          document.getElementById('checkout-summary').innerHTML = this._getSummaryHTML(cart, 0);
        }
      });

      document.getElementById('checkout-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('customer-name').value.trim();
        const phone = document.getElementById('customer-phone').value.trim();
        const address = document.getElementById('customer-address').value.trim();
        let valid = true;
        [['customer-name',name],['customer-phone',phone],['customer-address',address]].forEach(([id,val])=>{
          const g = document.getElementById(id).closest('.form-group');
          if(!val){g.classList.add('error');valid=false;}else g.classList.remove('error');
        });
        if (!valid) return;
        this.checkoutData = { customerName: name, phone, address, cartTotal: cart.total, couponCode, discount };
        window.location.hash = '#/payment';
      });
    } catch(err) { container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">⚠️</div><h3>${err.message}</h3></div>`; }
  },

  _getSummaryHTML(cart, discount) {
    const subtotal = cart.total;
    const tax = (subtotal - discount) * 0.08;
    const finalTotal = subtotal - discount + tax;
    return `
      <h3 class="cart-summary__title">Order Summary</h3>
      ${cart.items.map(item=>`<div class="cart-summary__row"><span>${item.product.name} × ${item.quantity}</span><span>₹${item.subtotal.toFixed(2)}</span></div>`).join('')}
      <div class="cart-summary__row" style="margin-top:var(--sp-4)"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
      ${discount > 0 ? `<div class="cart-summary__row" style="color:var(--clr-primary); font-weight:700;"><span>Coupon Discount</span><span>-₹${discount.toFixed(2)}</span></div>` : ''}
      <div class="cart-summary__row"><span>Delivery</span><span style="color:var(--clr-primary)">FREE</span></div>
      <div class="cart-summary__row"><span>Tax (8%)</span><span>₹${tax.toFixed(2)}</span></div>
      <div class="cart-summary__total"><span>Total Payable</span><span>₹${finalTotal.toFixed(2)}</span></div>
    `;
  },

  // ── Payment Page ──────────────────────────────
  async renderPayment(container) {
    if (!this.checkoutData) { window.location.hash = '#/checkout'; return; }
    const total = (this.checkoutData.cartTotal * 1.08).toFixed(2);
    container.innerHTML = `
      <div class="payment-page">
        <h1 class="section-title">💳 Payment</h1>
        <p style="color:var(--clr-text-light);margin-bottom:var(--sp-8)">Total Amount: <strong style="font-size:var(--fs-2xl);color:var(--clr-primary-dark)">₹${total}</strong></p>
        <div class="payment-methods">
          <h3 style="margin-bottom:var(--sp-4)">Select Payment Method</h3>
          <div class="payment-option active" data-method="upi">
            <div class="payment-option__radio"></div>
            <div class="payment-option__icon">📱</div>
            <div class="payment-option__info"><div class="payment-option__name">UPI</div><div class="payment-option__desc">Pay with Google Pay, PhonePe, Paytm</div></div>
          </div>
          <div class="payment-option" data-method="card">
            <div class="payment-option__radio"></div>
            <div class="payment-option__icon">💳</div>
            <div class="payment-option__info"><div class="payment-option__name">Credit / Debit Card</div><div class="payment-option__desc">Visa, Mastercard, RuPay</div></div>
          </div>
          <div class="payment-option" data-method="netbanking">
            <div class="payment-option__radio"></div>
            <div class="payment-option__icon">🏦</div>
            <div class="payment-option__info"><div class="payment-option__name">Net Banking</div><div class="payment-option__desc">All major banks supported</div></div>
          </div>
          <div class="payment-option" data-method="cod">
            <div class="payment-option__radio"></div>
            <div class="payment-option__icon">💵</div>
            <div class="payment-option__info"><div class="payment-option__name">Cash on Delivery</div><div class="payment-option__desc">Pay when your order arrives</div></div>
          </div>
        </div>
        <div class="payment-details" id="payment-details">
          <div id="upi-form" class="payment-form">
            <div class="form-group"><label>UPI ID</label><input type="text" id="upi-id" placeholder="yourname@upi"></div>
          </div>
          <div id="card-form" class="payment-form" style="display:none">
            <div class="card-preview" id="card-preview"><div class="card-preview__chip"></div><div class="card-preview__number" id="card-display">•••• •••• •••• ••••</div><div class="card-preview__bottom"><span id="card-name-display">YOUR NAME</span><span id="card-expiry-display">MM/YY</span></div></div>
            <div class="form-group"><label>Card Number</label><input type="text" id="card-number" placeholder="1234 5678 9012 3456" maxlength="19"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4)"><div class="form-group"><label>Expiry</label><input type="text" id="card-expiry" placeholder="MM/YY" maxlength="5"></div><div class="form-group"><label>CVV</label><input type="password" id="card-cvv" placeholder="•••" maxlength="3"></div></div>
            <div class="form-group"><label>Card Holder Name</label><input type="text" id="card-name" placeholder="Name on card"></div>
          </div>
          <div id="netbanking-form" class="payment-form" style="display:none">
            <div class="bank-grid">
              ${['SBI','HDFC','ICICI','Axis','PNB','Kotak','BOB','Yes Bank'].map(b=>`<label class="bank-option"><input type="radio" name="bank" value="${b}"><span>${b}</span></label>`).join('')}
            </div>
          </div>
          <div id="cod-form" class="payment-form" style="display:none">
            <div class="cod-notice"><span>💵</span><p>Pay <strong>₹${total}</strong> in cash when your order is delivered. No advance payment needed.</p></div>
          </div>
        </div>
        <button class="btn btn-primary btn-lg" id="pay-btn" style="width:100%;margin-top:var(--sp-6)">Pay ₹${total}</button>
      </div>
    `;
    let selectedMethod = 'upi';
    container.querySelectorAll('.payment-option').forEach(opt => {
      opt.addEventListener('click', () => {
        container.querySelectorAll('.payment-option').forEach(o=>o.classList.remove('active'));
        opt.classList.add('active');
        selectedMethod = opt.dataset.method;
        document.querySelectorAll('.payment-form').forEach(f=>f.style.display='none');
        document.getElementById(selectedMethod+'-form').style.display='';
        document.getElementById('pay-btn').textContent = selectedMethod==='cod'?'Place Order (COD)':'Pay ₹'+total;
      });
    });
    // Card number live preview
    const cardNum = document.getElementById('card-number');
    const cardName = document.getElementById('card-name');
    const cardExpiry = document.getElementById('card-expiry');
    cardNum?.addEventListener('input', (e)=>{
      let v = e.target.value.replace(/\D/g,'').substring(0,16);
      e.target.value = v.replace(/(.{4})/g,'$1 ').trim();
      document.getElementById('card-display').textContent = e.target.value||'•••• •••• •••• ••••';
    });
    cardName?.addEventListener('input', (e)=>{
      document.getElementById('card-name-display').textContent = e.target.value.toUpperCase()||'YOUR NAME';
    });
    cardExpiry?.addEventListener('input',(e)=>{
      let v=e.target.value.replace(/\D/g,'').substring(0,4);
      if(v.length>=2)v=v.substring(0,2)+'/'+v.substring(2);
      e.target.value=v;
      document.getElementById('card-expiry-display').textContent=v||'MM/YY';
    });
    document.getElementById('pay-btn').addEventListener('click', () => this.processPayment(selectedMethod));
  },

  async processPayment(method) {
    const overlay = document.getElementById('payment-overlay');
    const title = document.getElementById('payment-overlay-title');
    const text = document.getElementById('payment-overlay-text');
    overlay.style.display = 'flex';
    const steps = method === 'cod'
      ? [['Placing your order...','Confirming items',1000],['Almost done...','',800]]
      : [['Connecting to payment gateway...','Verifying details',1200],['Processing payment...','Please wait',1500],['Verifying transaction...','Almost done',1000]];
    for (const [t,tx,ms] of steps) { title.textContent = t; text.textContent = tx; await new Promise(r=>setTimeout(r,ms)); }
    try {
      const { customerName, address, phone, couponCode } = this.checkoutData;
      let details = {};
      if(method==='upi') details={upiId:document.getElementById('upi-id')?.value||''};
      else if(method==='card') details={last4:(document.getElementById('card-number')?.value||'').slice(-4)};
      else if(method==='netbanking') details={bank:document.querySelector('input[name=bank]:checked')?.value||''};
      
      const order = await API.placeOrder(customerName, address, phone, method, details, couponCode);
      
      title.textContent = '✅ Payment Successful!';
      text.textContent = `Order #${order.id} placed successfully`;
      await new Promise(r=>setTimeout(r,800));
      overlay.style.display = 'none';
      this.checkoutData = null;
      this.updateCartBadge();
      window.location.hash = '#/confirmation/' + order.id;
    } catch(err) {
      overlay.style.display = 'none';
      this.showToast('Payment failed: ' + err.message);
    }
  },

  // ── Confirmation ──────────────────────────────
  async renderConfirmation(container, orderId) {
    container.innerHTML = '<div class="spinner"></div>';
    try {
      const orders = await API.getOrders();
      const order = orders.find(o => o.id === parseInt(orderId));
      if (!order) { container.innerHTML = `<div class="empty-state"><h3>Order not found</h3></div>`; return; }

      const statuses = [
        { id: 'ordered', label: 'Ordered', icon: '📝' },
        { id: 'packed', label: 'Packed', icon: '📦' },
        { id: 'out-for-delivery', label: 'Out for Delivery', icon: '🚚' },
        { id: 'delivered', label: 'Delivered', icon: '🏠' }
      ];

      const currentIdx = statuses.findIndex(s => s.id === order.status);
      const progress = (currentIdx / (statuses.length - 1)) * 100;
      const pm = {upi:'UPI',card:'Card',netbanking:'Net Banking',cod:'COD'};

      container.innerHTML = `
        <div class="confirmation-page" style="animation: fadeInUp 0.6s var(--ease); max-width:800px; margin:0 auto; padding:var(--sp-8) var(--sp-4);">
          <div style="text-align:center; margin-bottom:var(--sp-8);">
            <div class="confirmation__icon" style="background:var(--clr-primary); color:#fff; width:80px; height:80px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:2.5rem; margin:0 auto var(--sp-4); box-shadow:var(--shadow-glow);">✓</div>
            <h1 class="confirmation__title" style="font-size:var(--fs-3xl); margin-bottom:var(--sp-2);">Order Confirmed!</h1>
            <p style="color:var(--clr-text-light);">We've received your order #${order.id}.</p>
          </div>

          <!-- Tracking Stepper -->
          <div style="background:var(--clr-surface); padding:var(--sp-8) var(--sp-4); border-radius:var(--radius-lg); border:1px solid var(--clr-border); margin-bottom:var(--sp-8);">
            <h3 style="text-align:center; margin-bottom:var(--sp-8); font-size:var(--fs-lg);">Track Order</h3>
            <div class="tracking-stepper">
              <div class="tracking-st-line"></div>
              <div class="tracking-st-progress" style="width:${progress}%"></div>
              ${statuses.map((s, i) => {
                const isCompleted = i < currentIdx;
                const isActive = i === currentIdx;
                const history = order.statusHistory?.find(h => h.status === s.id);
                return `
                  <div class="tracking-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}">
                    <div class="tracking-step__icon">${isCompleted ? '✓' : s.icon}</div>
                    <div class="tracking-step__label">${s.label}</div>
                    ${history ? `<div class="tracking-step__time">${new Date(history.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:var(--sp-6);">
            <div style="background:var(--clr-bg-card); padding:var(--sp-6); border-radius:var(--radius-lg); border:1px solid var(--clr-border);">
              <h3 style="margin-bottom:var(--sp-4); font-size:var(--fs-lg); border-bottom:1px solid var(--clr-border); padding-bottom:var(--sp-2);">Delivery Address</h3>
              <p style="font-weight:700; color:var(--clr-text-dark); margin-bottom:4px;">${order.customerName}</p>
              <p style="color:var(--clr-text-light); font-size:0.95rem; line-height:1.6;">${order.address}</p>
              <p style="margin-top:var(--sp-3); font-size:0.95rem;">📞 ${order.phone}</p>
            </div>
            
            <div style="background:var(--clr-bg-card); padding:var(--sp-6); border-radius:var(--radius-lg); border:1px solid var(--clr-border);">
              <h3 style="margin-bottom:var(--sp-4); font-size:var(--fs-lg); border-bottom:1px solid var(--clr-border); padding-bottom:var(--sp-2);">Order Summary</h3>
              ${order.items.map(item => `
                <div style="display:flex; justify-content:space-between; margin-bottom:var(--sp-2); font-size:0.95rem;">
                  <span>${item.name} × ${item.quantity}</span>
                  <span>₹${item.subtotal.toFixed(2)}</span>
                </div>
              `).join('')}
              <div style="display:flex; justify-content:space-between; margin-top:var(--sp-4); padding-top:var(--sp-4); border-top:1px dashed var(--clr-border); font-weight:800; font-size:var(--fs-xl); color:var(--clr-primary-dark);">
                <span>Total Paid</span>
                <span>₹${(order.total * 1.08).toFixed(2)}</span>
              </div>
              <p style="font-size:0.75rem; color:var(--clr-text-muted); text-align:right; margin-top:4px;">via ${pm[order.paymentMethod]||order.paymentMethod}</p>
            </div>
          </div>

          <div style="display:flex; gap:var(--sp-4); justify-content:center; margin-top:var(--sp-10);">
            <a href="#/" class="btn btn-primary btn-lg">Back to Shopping</a>
            <a href="#/orders" class="btn btn-secondary btn-lg">View All Orders</a>
          </div>
        </div>
      `;
    } catch(err) { container.innerHTML = `<div class="empty-state"><h3>${err.message}</h3></div>`; }
  },

  async renderWishlist(container) {
    if (!this.isLoggedIn()) { window.location.hash = '#/login'; return; }
    container.innerHTML = '<div class="spinner"></div>';
    try {
      const products = await API.getWishlist();
      container.innerHTML = `
        <div class="wishlist-page" style="animation: fadeInUp 0.5s var(--ease)">
          <h1 class="section-title">❤️ My Wishlist</h1>
          ${products.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state__icon">🤍</div>
              <h3>Your wishlist is empty</h3>
              <p>Save items you like for later!</p>
              <a href="#/" class="btn btn-primary" style="margin-top:var(--sp-4)">Browse Products</a>
            </div>
          ` : `
            <div class="product-grid">
              ${products.map((p, i) => this.renderProductCard(p, i, true)).join('')}
            </div>
          `}
        </div>
      `;
      container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { 
          e.preventDefault(); 
          const id = parseInt(btn.dataset.id);
          const qty = parseInt(document.getElementById('qty-'+id)?.value) || 1;
          this.addToCart(id, null, null, qty, btn); 
          this.flyToCartAnimation(btn);
        });
      });
    } catch(err) { container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">⚠️</div><h3>${err.message}</h3></div>`; }
  },

  async toggleWishlist(id, btn) {
    if (!this.isLoggedIn()) { this.showToast('Please login first'); window.location.hash='#/login'; return; }
    try {
      const res = await API.toggleWishlist(id);
      btn.classList.toggle('active', res.added);
      btn.innerHTML = res.added ? '❤️' : '🤍';
      this.showToast(res.added ? 'Added to Wishlist' : 'Removed from Wishlist');
      // If we are on the wishlist page, we should re-render or remove the item
      if(window.location.hash === '#/wishlist') this.renderWishlist(document.getElementById('app'));
    } catch(err) { this.showToast('Failed to update wishlist'); }
  },

  async renderWishlist(container) {
    if (!this.isLoggedIn()) { window.location.hash = '#/login'; return; }
    container.innerHTML = '<div class="spinner"></div>';
    try {
      const wishlist = await API.getWishlist();
      if (wishlist.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">❤️</div><h3 class="empty-state__title">Your wishlist is empty</h3><a href="#/" class="btn btn-primary btn-lg">Browse Products</a></div>`;
        return;
      }
      container.innerHTML = `
        <div class="wishlist-page">
          <h1 class="section-title">❤️ My Wishlist</h1>
          <div class="product-grid" id="wishlist-grid">
            ${wishlist.map((p, i) => this.renderProductCard(p, i, true)).join('')}
          </div>
        </div>
      `;
      // Listeners for cards in wishlist
      const grid = document.getElementById('wishlist-grid');
      grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault(); e.stopPropagation();
          const id = parseInt(btn.dataset.id);
          const qty = parseInt(document.getElementById('qty-' + id).value) || 1;
          this.addToCart(id, null, null, qty, btn);
          this.flyToCartAnimation(btn);
        });
      });
      
      const cards = grid.querySelectorAll('.product-card');
      const obs = new IntersectionObserver(e => e.forEach(en => en.isIntersecting && en.target.classList.add('visible')), {threshold:0.1});
      cards.forEach(card => {
        obs.observe(card);
        card.addEventListener('mousemove', e => {
          const rect = card.getBoundingClientRect();
          const rx = ((e.clientY - rect.top - rect.height/2)/(rect.height/2))*-18;
          const ry = ((e.clientX - rect.left - rect.width/2)/(rect.width/2))*18;
          card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(-2deg) scale(1.04) translateY(-10px)`;
          const gx = ((e.clientX-rect.left)/rect.width)*100, gy = ((e.clientY-rect.top)/rect.height)*100;
          card.style.backgroundImage = `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.1) 0%, transparent 70%), var(--grad-card)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; card.style.backgroundImage = 'var(--grad-card)'; });
      });
    } catch(err) { container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">⚠️</div><h3>${err.message}</h3></div>`; }
  },

  // ── Orders ──────────────────────────────────────
  async renderOrders(container) {
    if (!this.isLoggedIn()) { window.location.hash = '#/login'; return; }
    container.innerHTML = '<div class="spinner"></div>';
    try {
      const orders = await API.getOrders();
      const pm = {upi:'UPI',card:'Card',netbanking:'Net Banking',cod:'COD'};
      if (orders.length === 0) { container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📦</div><h3 class="empty-state__title">No orders yet</h3><a href="#/" class="btn btn-primary btn-lg">Browse Products</a></div>`; return; }
      container.innerHTML = `
        <div class="orders-page"><h1 class="section-title">📦 Order History</h1>
          ${orders.map(order=>`
            <div class="order-card">
              <div class="order-card__header"><span class="order-card__id">Order #${order.id}</span><span class="order-card__status status-${order.status}">${order.status.charAt(0).toUpperCase()+order.status.slice(1)}</span></div>
              <div class="order-card__items">${order.items.map(i=>`${i.name} × ${i.quantity}`).join(' • ')}</div>
              <div class="order-card__footer">
                <span style="color:var(--clr-text-muted)">${new Date(order.createdAt).toLocaleDateString('en-IN',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})} · ${pm[order.paymentMethod]||order.paymentMethod}</span>
                <span class="order-card__total">₹${(order.total*1.08).toFixed(2)}</span>
              </div>
            </div>`).join('')}
        </div>
      `;
    } catch(err) { container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">⚠️</div><h3>${err.message}</h3></div>`; }
  },

  // ── User Profile Page ──────────────────────────
  async renderProfile(container) {
    if (!this.isLoggedIn()) { window.location.hash = '#/login'; return; }
    const user = this.getUser();
    container.innerHTML = '<div class="spinner"></div>';
    try {
      const orders = await API.getOrders();
      const totalSpent = orders.reduce((s,o) => s + o.total * 1.08, 0);
      container.innerHTML = `
        <div class="profile-page">
          <div class="profile-header">
            <div class="profile-avatar">${(user.name||'U').charAt(0).toUpperCase()}</div>
            <div>
              <h1 class="profile-name">${user.name}</h1>
              <p class="profile-username">@${user.username} · <span class="profile-role">${user.role === 'admin' ? '🔑 Admin' : '👤 Customer'}</span></p>
            </div>
          </div>

          <div class="profile-stats">
            <div class="profile-stat"><div class="profile-stat__value">${orders.length}</div><div class="profile-stat__label">Orders</div></div>
            <div class="profile-stat"><div class="profile-stat__value">₹${totalSpent.toFixed(0)}</div><div class="profile-stat__label">Total Spent</div></div>
            <div class="profile-stat"><div class="profile-stat__value">${orders.filter(o=>o.status==='delivered').length}</div><div class="profile-stat__label">Delivered</div></div>
            <div class="profile-stat"><div class="profile-stat__value">${orders.filter(o=>o.status==='confirmed'||o.status==='preparing').length}</div><div class="profile-stat__label">Active</div></div>
          </div>

          <div class="profile-sections">
            <div class="profile-section">
              <h3>📋 Account Information</h3>
              <div class="profile-info-grid">
                <div class="profile-info-item"><label>Full Name</label><p>${user.name}</p></div>
                <div class="profile-info-item"><label>Username</label><p>@${user.username}</p></div>
                <div class="profile-info-item"><label>Account Type</label><p>${user.role === 'admin' ? 'Administrator' : 'Customer'}</p></div>
              </div>
            </div>

            <div class="profile-section">
              <h3>🔗 Quick Actions</h3>
              <div class="profile-actions">
                <a href="#/" class="profile-action-card"><span>🛍️</span><strong>Shop Now</strong><small>Browse products</small></a>
                <a href="#/cart" class="profile-action-card"><span>🛒</span><strong>My Cart</strong><small>View items</small></a>
                <a href="#/orders" class="profile-action-card"><span>📦</span><strong>My Orders</strong><small>Track orders</small></a>
                ${user.role==='admin'?'<a href="#/admin" class="profile-action-card"><span>⚙️</span><strong>Admin Panel</strong><small>Manage store</small></a>':''}
              </div>
            </div>

            ${orders.length > 0 ? `
            <div class="profile-section">
              <h3>🕐 Recent Orders</h3>
              <div class="profile-orders">
                ${orders.slice(0,5).map(o => `
                  <div class="profile-order-row">
                    <div><strong>Order #${o.id}</strong><br><small style="color:var(--clr-text-muted)">${new Date(o.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</small></div>
                    <div style="flex:1; margin: 0 var(--sp-4);">${o.items.map(i=>i.name).join(', ')}</div>
                    <div style="text-align:right">
                      <span class="status-badge status-${o.status}" style="margin-bottom:var(--sp-1);display:inline-block">${o.status}</span><br>
                      <strong style="color:var(--clr-primary-dark)">₹${(o.total*1.08).toFixed(2)}</strong>
                    </div>
                  </div>
                `).join('')}
              </div>
              ${orders.length > 5 ? `<a href="#/orders" class="btn btn-secondary" style="margin-top:var(--sp-4)">View All Orders</a>` : ''}
            </div>
            ` : ''}
          </div>
        </div>
      `;
    } catch(err) { container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">⚠️</div><h3>${err.message}</h3></div>`; }
  },

  // ══════════ ADMIN PAGES ══════════

  // ── Admin Dashboard ────────────────────────────
  async renderAdminDashboard(container) {
    if (!this.isAdmin()) { window.location.hash = '#/login'; return; }
    container.innerHTML = '<div class="spinner"></div>';
    try {
      const stats = await API.getAdminStats();
      container.innerHTML = `
        <div class="admin-page">
          <div class="admin-header"><h1 class="section-title">⚙️ Admin Dashboard</h1><span class="admin-badge">Administrator</span></div>
          <div class="admin-stats">
            <div class="stat-card stat-card--products"><div class="stat-card__icon">📦</div><div class="stat-card__value">${stats.totalProducts}</div><div class="stat-card__label">Products</div></div>
            <div class="stat-card stat-card--orders"><div class="stat-card__icon">🧾</div><div class="stat-card__value">${stats.totalOrders}</div><div class="stat-card__label">Total Orders</div></div>
            <div class="stat-card stat-card--revenue"><div class="stat-card__icon">💰</div><div class="stat-card__value">₹${stats.totalRevenue.toFixed(0)}</div><div class="stat-card__label">Revenue</div></div>
            <div class="stat-card stat-card--users"><div class="stat-card__icon">👥</div><div class="stat-card__value">${stats.totalUsers}</div><div class="stat-card__label">Users</div></div>
          </div>
          <div class="admin-nav-cards">
            <a href="#/admin/products" class="admin-nav-card"><span>📦</span><h3>Manage Products</h3><p>Add, edit, or remove products</p></a>
            <a href="#/admin/orders" class="admin-nav-card"><span>🧾</span><h3>Manage Orders</h3><p>View and update order status</p></a>
          </div>
          ${stats.recentOrders.length > 0 ? `
            <h3 style="margin:var(--sp-8) 0 var(--sp-4)">Recent Orders</h3>
            <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead><tbody>
              ${stats.recentOrders.map(o=>`<tr><td>#${o.id}</td><td>${o.customerName}</td><td>${o.items.length}</td><td>₹${o.total.toFixed(2)}</td><td>${o.paymentMethod}</td><td><span class="status-badge status-${o.status}">${o.status}</span></td></tr>`).join('')}
            </tbody></table></div>
          ` : ''}
        </div>
      `;
    } catch(err) { container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">⚠️</div><h3>${err.message}</h3></div>`; }
  },

  // ── Admin Products ────────────────────────────
  async renderAdminProducts(container) {
    if (!this.isAdmin()) { window.location.hash = '#/login'; return; }
    container.innerHTML = '<div class="spinner"></div>';
    try {
      const products = await API.getProducts();
      container.innerHTML = `
        <div class="admin-page">
          <div class="admin-header"><h1 class="section-title">📦 Manage Products</h1><button class="btn btn-primary" id="add-product-btn">+ Add Product</button></div>
          <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Rating</th><th>Stock</th><th>Actions</th></tr></thead><tbody>
            ${products.map(p=>`<tr>
              <td><img src="${p.image}" alt="${p.name}" class="admin-table__img"></td>
              <td><strong>${p.name}</strong><br><small>${p.description.substring(0,40)}</small></td>
              <td>${p.category}</td><td>₹${p.price.toFixed(2)}</td>
              <td>⭐ ${p.rating||'-'}</td>
              <td><span class="status-badge ${p.inStock?'status-confirmed':'status-cancelled'}">${p.inStock?'In Stock':'Out'}</span></td>
              <td><button class="btn btn-sm btn-secondary edit-product-btn" data-id="${p.id}">✏️ Edit</button> <button class="btn btn-sm btn-danger delete-product-btn" data-id="${p.id}">🗑️</button></td>
            </tr>`).join('')}
          </tbody></table></div>
          <a href="#/admin" class="btn btn-secondary" style="margin-top:var(--sp-6)">← Back to Dashboard</a>
        </div>
      `;
      document.getElementById('add-product-btn').addEventListener('click', () => this.showProductModal());
      container.querySelectorAll('.edit-product-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const p = products.find(x=>x.id===parseInt(btn.dataset.id));
          if(p) this.showProductModal(p);
        });
      });
      container.querySelectorAll('.delete-product-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if(confirm('Delete this product?')) {
            await API.deleteProduct(parseInt(btn.dataset.id));
            this.showToast('Product deleted');
            this.renderAdminProducts(container);
          }
        });
      });
    } catch(err) { container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">⚠️</div><h3>${err.message}</h3></div>`; }
  },

  showProductModal(product = null) {
    const existing = document.getElementById('product-modal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'product-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>${product?'Edit':'Add'} Product</h3>
        <form id="product-form">
          <div class="form-group"><label>Name</label><input type="text" id="p-name" value="${product?.name||''}" required></div>
          <div class="form-group"><label>Category</label><input type="text" id="p-category" value="${product?.category||''}" placeholder="e.g. Fruits" required></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4)">
            <div class="form-group"><label>Price (₹)</label><input type="number" id="p-price" step="0.01" value="${product?.price||''}" required></div>
            <div class="form-group"><label>Unit</label><input type="text" id="p-unit" value="${product?.unit||'each'}" required></div>
          </div>
          <div class="form-group"><label>Image URL</label><input type="text" id="p-image" value="${product?.image||''}" placeholder="https://..."></div>
          <div class="form-group"><label>Description</label><textarea id="p-desc">${product?.description||''}</textarea></div>
          <div class="form-group" style="display:flex;align-items:center;gap:10px;"><input type="checkbox" id="p-instock" ${product?.inStock !== false ? 'checked' : ''} style="width:20px;height:20px;"> <label for="p-instock" style="margin:0">Item is In Stock</label></div>
          <div style="display:flex;gap:var(--sp-3);justify-content:flex-end">
            <button type="button" class="btn btn-secondary" id="modal-cancel">Cancel</button>
            <button type="submit" class="btn btn-primary">${product?'Save Changes':'Add Product'}</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('modal-cancel').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if(e.target===modal) modal.remove(); });
    document.getElementById('product-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        name: document.getElementById('p-name').value.trim(),
        category: document.getElementById('p-category').value.trim(),
        price: parseFloat(document.getElementById('p-price').value),
        unit: document.getElementById('p-unit').value.trim(),
        image: document.getElementById('p-image').value.trim(),
        description: document.getElementById('p-desc').value.trim(),
        inStock: document.getElementById('p-instock').checked
      };
      if(product) await API.updateProduct(product.id, data);
      else await API.addProduct(data);
      modal.remove();
      this.showToast(product?'Product updated':'Product added');
      this.renderAdminProducts(document.getElementById('app'));
    });
  },

  // ── Admin Orders ──────────────────────────────
  async renderAdminOrders(container) {
    if (!this.isAdmin()) { window.location.hash = '#/login'; return; }
    container.innerHTML = '<div class="spinner"></div>';
    try {
      const orders = await API.getAllOrders();
      const pm = {upi:'UPI',card:'Card',netbanking:'Net Banking',cod:'COD'};
      container.innerHTML = `
        <div class="admin-page">
          <div class="admin-header"><h1 class="section-title">🧾 All Orders</h1><span style="color:var(--clr-text-muted)">${orders.length} orders</span></div>
          ${orders.length === 0 ? '<div class="empty-state"><div class="empty-state__icon">📭</div><h3>No orders yet</h3></div>' : `
          <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Action</th></tr></thead><tbody>
            ${orders.map(o=>`<tr>
              <td>#${o.id}</td><td>${o.customerName}<br><small>${o.phone}</small></td>
              <td>${o.items.map(i=>i.name).join(', ')}</td>
              <td>₹${(o.total*1.08).toFixed(2)}</td>
              <td>${pm[o.paymentMethod]||o.paymentMethod}</td>
              <td><span class="status-badge status-${o.status}">${o.status}</span></td>
              <td><select class="status-select" data-id="${o.id}">
                ${['confirmed','preparing','delivered','cancelled'].map(s=>`<option value="${s}" ${o.status===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}
              </select></td>
            </tr>`).join('')}
          </tbody></table></div>`}
          <a href="#/admin" class="btn btn-secondary" style="margin-top:var(--sp-6)">← Back to Dashboard</a>
        </div>
      `;
      container.querySelectorAll('.status-select').forEach(sel => {
        sel.addEventListener('change', async () => {
          await API.updateOrderStatus(parseInt(sel.dataset.id), sel.value);
          this.showToast('Order status updated');
          this.renderAdminOrders(container);
        });
      });
    } catch(err) { container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">⚠️</div><h3>${err.message}</h3></div>`; }
  },

  // ── Helpers ────────────────────────────────────
  flyToCartAnimation(button) {
    const card = button.closest('.product-card') || document.querySelector('.product-detail__image');
    if (!card) return;
    const img = card.querySelector('img');
    if (!img) return;
    
    const cartIcon = document.getElementById('nav-cart');
    const startRect = img.getBoundingClientRect();
    const endRect = cartIcon.getBoundingClientRect();
    
    const flyingImg = img.cloneNode(true);
    flyingImg.className = 'fly-item';
    flyingImg.style.left = startRect.left + 'px';
    flyingImg.style.top = startRect.top + 'px';
    flyingImg.style.width = startRect.width + 'px';
    flyingImg.style.height = startRect.height + 'px';
    
    const dx = endRect.left - startRect.left + (endRect.width/2) - (startRect.width/2);
    const dy = endRect.top - startRect.top + (endRect.height/2) - (startRect.height/2);
    flyingImg.style.setProperty('--dx', dx + 'px');
    flyingImg.style.setProperty('--dy', dy + 'px');
    
    document.body.appendChild(flyingImg);
    setTimeout(() => flyingImg.remove(), 800);
  },

  async addToCart(productId, variationName = null, variationPrice = null, quantity = 1, btn = null) {
    if (!this.isLoggedIn()) { this.showToast('Please login first'); window.location.hash='#/login'; return; }
    
    // Smooth pop animation on button
    if (btn) {
      btn.classList.add('animate-pop');
      setTimeout(() => btn.classList.remove('animate-pop'), 400);
    }

    try { 
      await API.addToCart(productId, variationName, variationPrice, quantity); 
      this.showToast(`Added ${quantity}x ${variationName ? variationName : 'item'} to cart! 🛒`); 
      this.updateCartBadge(); 
    } catch(err) { this.showToast('Failed: '+err.message); }
  },

  async updateCartBadge() {
    if (!this.isLoggedIn()) return;
    try {
      const {count} = await API.getCartCount();
      const badge = document.getElementById('cart-badge');
      if(count>0){badge.textContent=count;badge.style.display='flex';badge.style.animation='none';badge.offsetHeight;badge.style.animation='badgePop 0.4s var(--ease)';}
      else badge.style.display='none';
    } catch(e){}
  },

  showToast(msg) {
    const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(this._tt); this._tt = setTimeout(()=>t.classList.remove('show'),2500);
  },
  async handleSearch(q) {
    const suggEl = document.getElementById('search-suggestions');
    const t = q.trim();
    
    if (t.length < 2) {
      suggEl.style.display = 'none';
      if (t.length === 0 && (window.location.hash === '#/' || window.location.hash === '')) {
        this.renderHome(document.getElementById('app'));
      }
      return;
    }

    try {
      const products = await API.getProducts(null, t);
      if (products.length > 0) {
        this.renderSearchSuggestions(products.slice(0, 6), t);
      } else {
        suggEl.style.display = 'none';
      }
    } catch (e) {
      suggEl.style.display = 'none';
    }
  },

  renderSearchSuggestions(products, query) {
    const suggEl = document.getElementById('search-suggestions');
    const highlight = (text) => {
      const regex = new RegExp(`(${query})`, 'gi');
      return text.replace(regex, '<span class="search-match">$1</span>');
    };

    suggEl.innerHTML = products.map(p => `
      <div class="search-suggestion-item" onclick="window.location.hash='#/product/${p.id}'; document.getElementById('search-suggestions').style.display='none'; document.getElementById('search-input').value=''">
        <img src="${p.image}" class="search-suggestion-img" alt="${p.name}">
        <div class="search-suggestion-info">
          <span class="search-suggestion-name">${highlight(p.name)}</span>
          <span class="search-suggestion-category">${p.category}</span>
        </div>
      </div>
    `).join('');
    
    suggEl.style.display = 'block';
  },

  debounce(fn,d){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),d);};},

  initChatbot() {
    if (document.querySelector('.chatbot-container')) return;
    const chatContainer = document.createElement('div');
    chatContainer.className = 'chatbot-container';
    chatContainer.innerHTML = `
      <button class="chatbot-btn" id="chatbot-toggle" title="FreshBot Support">🤖</button>
      <div class="chatbot-window" id="chatbot-window">
        <div class="chatbot-header">
          <div style="font-size:1.8rem">🤖</div>
          <div><h4>FreshBot</h4><p>Always active • Online</p></div>
        </div>
        <div class="chatbot-messages" id="chatbot-messages">
          <div class="chat-msg bot">Hi there! I'm FreshBot. How can I help you shop today? 🥦. Try asking "What should I buy for breakfast?"</div>
        </div>
        <div class="chatbot-input">
          <input type="text" id="chatbot-input" placeholder="Ask me anything...">
          <button class="chatbot-send" id="chatbot-send">✈️</button>
        </div>
      </div>
    `;
    document.body.appendChild(chatContainer);

    const toggle = document.getElementById('chatbot-toggle');
    const win = document.getElementById('chatbot-window');
    const input = document.getElementById('chatbot-input');
    const send = document.getElementById('chatbot-send');
    const msgs = document.getElementById('chatbot-messages');

    toggle.addEventListener('click', () => {
      const isOpen = win.style.display === 'flex';
      win.style.display = isOpen ? 'none' : 'flex';
      toggle.classList.toggle('active', !isOpen);
      if(!isOpen) input.focus();
    });

    const addMsg = (text, isBot = true) => {
      const msg = document.createElement('div');
      msg.className = `chat-msg ${isBot ? 'bot' : 'user'}`;
      msg.textContent = text;
      msgs.appendChild(msg);
      msgs.scrollTop = msgs.scrollHeight;
    };

    const handleChat = async () => {
      const q = input.value.trim();
      if(!q) return;
      addMsg(q, false);
      input.value = '';

      try {
        const products = await API.getProducts();
        const lq = q.toLowerCase();
        let reply = "I'm sorry, I'm still learning. Try asking about a product price or health tips! 🍎";

        const healthTips = {
          'apple': 'Apples are high in Vitamin C and fiber, making them perfect for heart health! 🍎',
          'orange': 'Oranges are packed with Vitamin C and antioxidants to boost your immunity! 🍊',
          'banana': 'Bananas are rich in Potassium and great for quick energy! 🍌',
          'milk': 'Fresh milk is an excellent source of Calcium and Vitamin D for strong bones! 🥛',
          'spinach': 'Spinach is a superfood rich in Iron, Folate, and Vitamin K! 🥬',
          'broccoli': 'Broccoli is nutrient-dense and high in fiber and Vitamin C! 🥦',
          'carrot': 'Carrots are loaded with Beta-carotene and Vitamin A for eye health! 🥕',
          'salmon': 'Salmon is rich in Omega-3 fatty acids, excellent for your heart and brain! 🐟',
          'egg': 'Eggs provide high-quality protein and essential B-vitamins! 🥚',
          'mango': 'Mangoes are high in Vitamin A and C, great for skin and digestion! 🥭',
          'chicken': 'Chicken is a lean source of protein to help build and repair muscles! 🍗',
          'almond': 'Almonds are heart-healthy with good fats and Vitamin E! 🥜',
          'curd': 'Curd/Yogurt contains probiotics that improve gut health! 🥣',
          'pantry': 'Our pantry staples are sourced from organic farms ensuring high nutritional value!'
        };

        const nutritionData = {
          'apple': 'Calories: 95, Fat: 0.3g, Carbs: 25g',
          'banana': 'Calories: 105, Fat: 0.4g, Protein: 1.3g',
          'orange': 'Calories: 62, Fat: 0.2g, Vitamin C: 70mg',
          'milk': 'Calories: 150 (per cup), Fat: 8g, Protein: 8g',
          'chicken': 'Calories: 165 (per 100g), Fat: 3.6g, Protein: 31g',
          'salmon': 'Calories: 208 (per 100g), Fat: 13g, Protein: 20g',
          'egg': 'Calories: 78, Fat: 5g, Protein: 6g',
          'spinach': 'Calories: 23 (per 100g), Fat: 0.4g, Protein: 2.9g',
          'broccoli': 'Calories: 34 (per 100g), Fat: 0.4g, Protein: 2.8g',
          'mango': 'Calories: 202, Fat: 1.3g, Fiber: 5g'
        };

        const found = products.find(p => lq.includes(p.name.toLowerCase()));
        
        // Health / Vitamin checks
        const healthKeywords = ['health', 'benefit', 'vitamin', 'good for', 'nutrition', 'healthy', 'why should i buy'];
        const isHealthQuery = healthKeywords.some(k => lq.includes(k));
        
        // Calorie / Fat / Macro checks
        const macroKeywords = ['calorie', 'fat', 'protein', 'carbs', 'macros', 'energy', 'diet'];
        const isMacroQuery = macroKeywords.some(k => lq.includes(k));

        if (found && (isHealthQuery || isMacroQuery)) {
          const key = Object.keys(healthTips).find(k => found.name.toLowerCase().includes(k));
          const healthText = healthTips[key] || `${found.name} is a healthy, fresh choice! ✨`;
          const nutritionText = nutritionData[key] || 'Detailed macro data for this specific product is coming soon!';
          reply = `${healthText}\n\n📊 Nutritional Info:\n${nutritionText}`;
        } else if (found && (lq.includes('price') || lq.includes('much') || lq.includes('cost'))) {
          reply = `The ${found.name} is ₹${found.price.toFixed(2)} / ${found.unit}. It's currently ${found.inStock ? 'in stock' : 'out of stock'}. 🛒`;
        } else if (found) {
          reply = `${found.name}: ${found.description} (₹${found.price.toFixed(2)}). It's very fresh! ✨`;
        } else if (isHealthQuery || isMacroQuery) {
          reply = "Most of our produce is low in calories and high in nutrients! For example, Spinach (23 cal/100g) is very low-fat, while Salmon (208 cal/100g) is a powerhouse of protein and healthy fats. Which item are you looking for? 🥗";
        } else if (lq.includes('breakfast')) {
          const item = products.find(p => p.name.includes('Bread') || p.name.includes('Milk'));
          reply = `For breakfast, I recommend our ${item ? item.name : 'Bananas'} and maybe some whole milk! 🥣`;
        } else if (lq.includes('deal') || lq.includes('offer') || lq.includes('coupon')) {
          reply = "Use 'SAVE10' for 10% off on orders above ₹500! 🎟️";
        } else if (lq.includes('hi') || lq.includes('hello')) {
          reply = "Hello! I'm FreshBot. Ask me about any product price, health benefits, or calories (e.g., 'How many calories in a Banana?')! 👋";
        } else if (lq.includes('order') || lq.includes('track')) {
          reply = "You can track your active orders under the 'Orders' section in the top menu! 📦";
        } else if (lq.includes('delivery')) {
          reply = "We deliver everything within 30-45 minutes to keep it fresh! 🚚💨";
        } else if (lq.includes('categories') || lq.includes('what do you have')) {
          const cats = [...new Set(products.map(p=>p.category))];
          reply = `We have: ${cats.join(', ')}. Which one are you looking for? 🥦`;
        }

        setTimeout(() => {
          addMsg(reply, true);
        }, 600);
      } catch (err) {
        setTimeout(() => addMsg("I'm having trouble connecting to the store right now. Please try again later! 🔌", true), 600);
      }
    };

    send.addEventListener('click', handleChat);
    input.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleChat(); });
  },

  async buyNow(id, varName, varPrice, qty) {
    if (!this.isLoggedIn()) { this.showToast('Please login first'); window.location.hash = '#/login'; return; }
    try {
      await API.addToCart(id, varName, varPrice, qty);
      window.location.hash = '#/checkout';
    } catch(err) { this.showToast('Failed to process Buy Now'); }
  },

  openRatingModal(id, name, currentRating) {
    const existing = document.getElementById('rating-modal');
    if (existing) existing.remove();
    
    const modal = document.createElement('div');
    modal.id = 'rating-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="text-align:center; max-width:400px; animation: modalPop 0.4s var(--ease);">
        <div style="font-size:3rem; margin-bottom:var(--sp-4);">⭐</div>
        <h3 style="margin-bottom:var(--sp-2)">Rate this Product</h3>
        <p style="color:var(--clr-text-light); margin-bottom:var(--sp-6);">${name}</p>
        
        <div class="star-rating-input" style="display:flex; justify-content:center; gap:var(--sp-2); margin-bottom:var(--sp-8); font-size:2.5rem;">
          ${[1,2,3,4,5].map(v => `<span class="star-item" data-val="${v}" style="cursor:pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform=''">☆</span>`).join('')}
        </div>
        
        <div style="display:flex; gap:var(--sp-3); justify-content:center;">
          <button class="btn btn-secondary" onclick="document.getElementById('rating-modal').remove()">Cancel</button>
          <button class="btn btn-primary" id="submit-rating" disabled>Give Rate →</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    let selectedRating = 0;
    const stars = modal.querySelectorAll('.star-item');
    stars.forEach(star => {
      star.addEventListener('click', () => {
        selectedRating = parseInt(star.dataset.val);
        stars.forEach((s, i) => s.innerHTML = (i < selectedRating) ? '⭐' : '☆');
        document.getElementById('submit-rating').disabled = false;
        
        // Burst effect for selected star
        star.style.animation = 'none';
        void star.offsetWidth;
        star.style.animation = 'badgePop 0.4s var(--ease)';
      });
    });

    document.getElementById('submit-rating').addEventListener('click', async () => {
      try {
        const res = await API.rateProduct(id, selectedRating);
        this.showToast(`Thank you! New rating: ⭐ ${res.rating}`);
        const el = document.getElementById('rating-val-' + id);
        if(el) el.textContent = res.rating;
        modal.remove();
      } catch (err) { this.showToast('Failed to submit rating'); }
    });

    modal.addEventListener('click', (e) => { if(e.target === modal) modal.remove(); });
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
