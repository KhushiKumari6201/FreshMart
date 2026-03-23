# 🛒 FreshMart — Grocery Selling Application

A modern, full-stack grocery app built with **Node.js + Express** backend and **vanilla HTML/CSS/JS** frontend.

## Features
- Browse 50+ grocery items across 8 categories
- Search products by name or description
- Filter by category (Fruits, Vegetables, Dairy, Bakery, etc.)
- Add items to cart with quantity controls
- Checkout with delivery details
- Order confirmation and order history
- Fully responsive design with premium animations

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Then open **http://localhost:3000** in your browser.

## Project Structure
```
Grocery/
├── server/                # Backend
│   ├── index.js           # Express server
│   ├── models/store.js    # In-memory data store
│   ├── data/products.json # 52 seed products
│   └── routes/            # API routes
│       ├── products.js
│       ├── cart.js
│       └── orders.js
├── public/                # Frontend
│   ├── index.html         # SPA shell
│   ├── css/styles.css     # Design system
│   └── js/
│       ├── api.js         # API client
│       └── app.js         # SPA router + pages
└── package.json
```

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (?category=&search=) |
| GET | `/api/products/:id` | Get single product |
| GET | `/api/products/categories` | List categories |
| GET | `/api/cart` | Get cart contents |
| POST | `/api/cart` | Add item to cart |
| PUT | `/api/cart/:id` | Update quantity |
| DELETE | `/api/cart/:id` | Remove from cart |
| POST | `/api/orders` | Place order |
| GET | `/api/orders` | Order history |
