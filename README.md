# 🍔 Bitezy — Campus Dining & Smart Ordering Platform (Mobile App)

A modern campus food ordering and delivery system built with **React Native (Expo)**, **Node.js / Express**, and **MongoDB**.

---

## 📁 Project Structure

```
Bitezy-Mobile/
├── backend/                  # Node.js + Express REST API Server
│   ├── config/               # Database connection (MongoDB / Mongoose)
│   ├── controllers/          # Business logic for auth, orders, menu, reviews, users
│   ├── middleware/           # JWT auth and role authorization middleware
│   ├── models/               # MongoDB models (User, Buyer, Seller, Provider, MenuItem, Order, Review)
│   ├── routes/               # API routes (/api/auth, /api/orders, /api/menu, /api/providers, etc.)
│   ├── utils/                # Database seeding script & mailer utilities
│   ├── .env                  # Backend environment configuration (PORT 8002, MONGODB_URI)
│   └── server.js             # Express application entry point
├── frontend/                 # React Native (Expo SDK 51) Mobile Frontend
│   ├── src/
│   │   ├── api/              # API config & HTTP DataService client (JWT)
│   │   ├── components/       # Reusable UI components (OrderCard, StatCard, FloatingTabBar, etc.)
│   │   ├── context/          # Global AuthContext & CartContext
│   │   ├── navigation/       # React Navigation (Auth, Customer, Seller, Admin)
│   │   ├── screens/          # Buyer, Seller, and Admin screens
│   │   └── theme/            # Design system, typography & colors
│   ├── App.js                # Root app entry point
│   ├── app.json              # Expo application manifest
│   └── package.json          # Frontend dependencies
├── data/                     # Seed JSON datasets for campus canteens & menus
│   ├── menu.json
│   ├── orders.json
│   ├── providers.json
│   ├── reviews.json
│   └── users.json
├── package.json              # Root project workspace scripts
└── README.md                 # Complete documentation & quick start guide
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (Local instance on `mongodb://localhost:27017` or MongoDB Atlas URI)
- **Expo Go** app on your physical iOS/Android phone or emulator

---

### 2. Start the Backend Server

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already installed)
npm install

# (Optional) Seed the database with sample campus canteens, menus, and accounts:
node utils/seedData.js

# Start the backend server
npm start
```
*The backend runs on `http://localhost:8002` (and your machine's LAN IP `http://192.168.0.248:8002`).*

---

### 3. Start the Mobile App Frontend

```bash
# In a new terminal, navigate to the frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Start the Expo development server in LAN mode
npx expo start --lan -c
```

Scan the QR code with **Expo Go** (Android) or the **Camera app** (iOS).

---

## ⚙️ Network Configuration for Physical Devices

If testing on physical phones over Wi-Fi, ensure the API host in `frontend/src/api/config.js` matches your computer's local IP:

```javascript
// frontend/src/api/config.js
export const DEFAULT_HOST = '192.168.0.248'; // Your computer's Wi-Fi IPv4 address
export const DEFAULT_PORT = 8002;
```

---

## 👥 Default Demo Accounts

| Role | Email | Password | Features |
|---|---|---|---|
| **Student (Buyer)** | `student@bitezy.com` | `password123` | Browse campus canteens, cart, room delivery, order tracking, reviews |
| **Canteen (Seller)** | `seller@bitezy.com` | `password123` | Live order dashboard, change status (Preparing/Ready), menu management |
| **Admin** | `admin@bitezy.com` | `password123` | Revenue analytics, user management, seller blocking, review moderation |

---

## 🛠️ Tech Stack

- **Mobile Frontend**: React Native, Expo SDK 51, React Navigation, Ionicons
- **Backend API**: Node.js, Express.js, JSON Web Tokens (JWT), bcryptjs
- **Database**: MongoDB with Mongoose ODM
