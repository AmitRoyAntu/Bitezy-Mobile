# 🍔 Bitezy — Campus Dining & Smart Ordering Platform

A full-stack campus food ordering and delivery mobile platform tailored for university campuses (CUET), built with **React Native (Expo)**, **Node.js / Express**, and **MongoDB**.

---

## 📁 Project Structure

```
Bitezy-Mobile/
├── backend/                  # Node.js + Express REST API Server
│   ├── config/               # Database connection (MongoDB / Mongoose)
│   ├── controllers/          # Business logic for auth, orders, menu, reviews, coupons
│   ├── middleware/           # JWT auth & role-based authorization (buyer, seller, admin)
│   ├── models/               # MongoDB models (User, Buyer, Seller, Provider, MenuItem, Order, Review, Coupon)
│   ├── routes/               # Express routes (/api/auth, /api/orders, /api/menu, /api/providers, /api/coupons, etc.)
│   ├── utils/                # Database seeding script & mailer utilities
│   ├── .env                  # Backend environment configuration
│   └── server.js             # Express application entry point (Port 8002)
├── frontend/                 # React Native (Expo SDK 51) Mobile Frontend
│   ├── src/
│   │   ├── api/              # API config & HTTP DataService client (JWT auth)
│   │   ├── components/       # Reusable components (FoodItemCard, ProviderCard, FloatingTabBar, etc.)
│   │   ├── context/          # Global AuthContext, CartContext, FavoritesContext, ToastContext
│   │   ├── navigation/       # React Navigation (Auth, Customer, Seller, Admin)
│   │   ├── screens/          # Customer, Seller, Admin, and Auth screens
│   │   └── theme/            # Design system, typography, colors
│   ├── App.js                # Root app entry point
│   ├── app.json              # Expo application manifest
│   └── package.json          # Frontend dependencies
├── data/                     # Seed JSON datasets for campus canteens & menus
│   ├── menu.json
│   ├── orders.json
│   ├── providers.json
│   ├── reviews.json
│   └── users.json
├── package.json              # Root workspace scripts
└── README.md                 # Complete documentation & run guide
```

---

## 🚀 How to Run the Project

### 1. Prerequisites

Before running the project, make sure you have:
- **Node.js** (v18 or higher) installed: `node -v`
- **MongoDB** running locally on port `27017` (e.g., via MongoDB Community Server or MongoDB Compass) or a MongoDB Atlas URI.
- **Expo Go** installed on your physical mobile device (available on [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) and [Apple App Store](https://apps.apple.com/app/expo-go/id982107779)), or an iOS Simulator / Android Emulator.

---

### 2. Backend Setup & Run

#### Step 1: Open a terminal and navigate to `backend/`
```bash
cd backend
```

#### Step 2: Install dependencies
```bash
npm install
```

#### Step 3: Configure Environment Variables
Ensure `backend/.env` exists (a template is provided in `backend/example.env`):
```env
PORT=8002
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/bitezy
JWT_SECRET=your_secret_key
```

#### Step 4: Seed Database with Initial Campus Data
Populate all campus canteens, student accounts, menu items, coupons, and reviews:
```bash
npm run seed
```
*(Or from the root directory: `npm run seed`)*

#### Step 5: Start the Backend Server
```bash
npm start
```
The backend will start and log:
```
Database connected successfully
Server is running in development mode on port 8002
```

---

### 3. Frontend (Mobile App) Setup & Run

#### Step 1: Open a second terminal and navigate to `frontend/`
```bash
cd frontend
```

#### Step 2: Install dependencies
```bash
npm install
```

#### Step 3: Start the Expo Development Server
```bash
npx expo start -c
```
*(Tip: Use `npx expo start --lan -c` if testing on a physical device connected to your local Wi-Fi)*

#### Step 4: Open the App
- **Physical Phone (iOS / Android)**:
  1. Ensure your phone and computer are on the **same Wi-Fi network**.
  2. Open the **Expo Go** app (on Android, scan the terminal QR code; on iOS, scan the QR code with the default Camera app).
- **Web Browser**:
  - Press `w` in the Expo terminal (or run `npx expo start --web`).
- **iOS Simulator**:
  - Press `i` in the Expo terminal (macOS with Xcode required).
- **Android Emulator**:
  - Press `a` in the Expo terminal (Android Studio emulator required).

---

### 4. Running Both from the Root Directory

You can also start either service directly from the project root:
```bash
# Start backend
npm run start:backend

# Start frontend
npm run start:frontend

# Re-seed database
npm run seed
```

---

## ⚙️ Network Configuration for Physical Devices

The app automatically detects the host machine's IP address when bundled via Metro. If you encounter network connection issues on a physical phone:

1. Find your machine's local IPv4 address:
   - **macOS**: `ipconfig getifaddr en0` (or Wi-Fi settings)
   - **Windows**: `ipconfig` (IPv4 Address under Wireless LAN adapter)
   - **Linux**: `hostname -I`
2. Update `DEFAULT_HOST` in [`frontend/src/api/config.js`](frontend/src/api/config.js):
   ```javascript
   export const DEFAULT_HOST = 'YOUR_LOCAL_IP_HERE'; // e.g. '192.168.0.101'
   export const DEFAULT_PORT = 8002;
   ```
3. Ensure your computer's firewall allows incoming traffic on port `8002`.

---

## 👥 Default Demo Accounts

All seed accounts are initialized with password: **`demo123`**

| Role | Email | Password | Details & Features |
|---|---|---|---|
| **Student (Buyer)** | `student@bitezy.com` | `demo123` | Student account. Browse canteens, cart, room delivery, order tracking, review canteens. |
| **Student (Buyer 2)** | `amit@cuet.ac.bd` | `demo123` | Student account (Amit Roy, CSE). |
| **Canteen Seller** | `seller@bitezy.com` | `demo123` | Canteen manager (Dr. Qudrat-E-Khuda Hall Canteen). Manage live orders, update status, toggle stock, manage menu. |
| **Canteen Seller 2** | `seller2@bitezy.com` | `demo123` | Canteen manager (Sufia Kamal Hall Canteen). |
| **System Admin** | `admin@bitezy.com` | `demo123` | Platform administration. Seller approval, user management, promo coupons, review moderation. |

---

## 🔌 API Endpoints Reference

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/auth/register` | POST | Public | User registration (Student buyer or Canteen seller) |
| `/api/auth/login` | POST | Public | User authentication and JWT generation |
| `/api/auth/me` | GET | Private | Get authenticated user profile details |
| `/api/auth/profile` | PUT | Private | Update user profile / canteen account details |
| `/api/providers` | GET | Public | List all active campus canteens and cafeterias |
| `/api/providers/:id` | GET | Public | Get single canteen details & operating hours |
| `/api/menu` | GET | Public | Get menu items (supports `?vendor=<id>&available=true`) |
| `/api/menu/seller` | GET | Seller | Get all menu items managed by the logged-in seller |
| `/api/orders` | POST | Buyer | Create a new food order (delivery or pickup) |
| `/api/orders/myorders` | GET | Buyer | Customer order history with live status updates |
| `/api/orders/seller` | GET | Seller | Live canteen order management board |
| `/api/orders/:id/status`| PUT | Seller/Admin | Update order status (`PREPARING`, `READY`, `DELIVERED`, etc.) |
| `/api/reviews/provider/:id` | GET | Public | Get verified reviews for a canteen |
| `/api/reviews` | POST | Buyer | Submit a rating and review for a canteen |
| `/api/coupons/active` | GET | Public | Retrieve active campus promotional coupons |
| `/api/coupons/validate` | POST | Private | Validate coupon code during checkout |

---

## 🛠️ Tech Stack

- **Frontend**: React Native, Expo SDK 51, React Navigation, Safe Area Context, Ionicons
- **Backend**: Node.js, Express.js, JSON Web Tokens (JWT), bcryptjs
- **Database**: MongoDB with Mongoose ODM
- **Architecture**: Modular REST API with role-based access control (Buyer, Seller, Admin)

---

## ❓ Troubleshooting

1. **Backend fails with `Database connection error`**:
   - Verify that your local MongoDB server is running: `mongosh` or `brew services start mongodb-community`.
   - Check `MONGODB_URI` in `backend/.env`.
2. **Network request failed on mobile device**:
   - Ensure your phone and computer are on the same Wi-Fi network.
   - Start Expo with LAN flag: `npx expo start --lan -c`.
   - Verify your computer's IP in [`frontend/src/api/config.js`](frontend/src/api/config.js).
3. **Need to reset demo data**:
   - Run `npm run seed` in the `backend/` directory to re-populate fresh initial data.
