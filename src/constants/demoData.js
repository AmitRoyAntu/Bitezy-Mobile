// Demo data — mirrors the web version's DataService responses

export const DEMO_USERS = [
  // Buyers
  {
    _id: 'u001',
    name: 'Abir Hasan',
    email: 'abir@cuet.ac.bd',
    phone: '01712345678',
    role: 'buyer',
    buyerType: 'Student',
    residence: 'Dr. Qudrat-E-Khuda Hall',
    department: 'CSE',
    cuetId: '2004001',
    isBlocked: false,
  },
  {
    _id: 'u002',
    name: 'Fatima Akter',
    email: 'fatima@cuet.ac.bd',
    phone: '01798765432',
    role: 'buyer',
    buyerType: 'Student',
    residence: 'Sufia Kamal Hall',
    department: 'EEE',
    cuetId: '2004045',
    isBlocked: false,
  },
  {
    _id: 'u003',
    name: 'Rafi Ahmed',
    email: 'rafi@cuet.ac.bd',
    phone: '01612345678',
    role: 'buyer',
    buyerType: 'Student',
    residence: 'Shaheed Mohammad Shah Hall',
    department: 'ME',
    cuetId: '2004078',
    isBlocked: false,
  },
  {
    _id: 'u004',
    name: 'Dr. Rahman',
    email: 'rahman@cuet.ac.bd',
    phone: '01912345678',
    role: 'buyer',
    buyerType: 'Teacher',
    residence: 'N/A',
    department: 'CSE',
    cuetId: 'T-0012',
    isBlocked: false,
  },
  {
    _id: 'u005',
    name: 'Nusrat Jahan',
    email: 'nusrat@cuet.ac.bd',
    phone: '01856781234',
    role: 'buyer',
    buyerType: 'Student',
    residence: 'Taposhi Rabeya Hall',
    department: 'ECE',
    cuetId: '2004102',
    isBlocked: true,
  },
  // Sellers
  {
    _id: 's001',
    name: 'Karim Mia',
    email: 'karim@bitezy.com',
    phone: '01555123456',
    role: 'seller',
    isBlocked: false,
  },
  {
    _id: 's002',
    name: 'Jamal Uddin',
    email: 'jamal@bitezy.com',
    phone: '01555654321',
    role: 'seller',
    isBlocked: false,
  },
];

export const DEMO_PROVIDERS = [
  {
    _id: 'p001',
    name: 'Khuda Canteen',
    seller: 's001',
    location: 'Dr. Qudrat-E-Khuda Hall',
    type: 'Canteen',
    description: 'Serving fresh homestyle meals since 2015',
    deliveryTime: '15-20 min',
    openTime: '07:00',
    closeTime: '23:00',
    image: null,
  },
  {
    _id: 'p002',
    name: 'Shah Cafeteria',
    seller: 's002',
    location: 'Shaheed Mohammad Shah Hall',
    type: 'Cafeteria',
    description: 'Best fast food on campus',
    deliveryTime: '20-30 min',
    openTime: '08:00',
    closeTime: '22:00',
    image: null,
  },
];

export const DEMO_ORDERS = [
  {
    _id: 'ord60a1b2',
    customer: { _id: 'u001', name: 'Abir Hasan' },
    provider: { _id: 'p001', name: 'Khuda Canteen' },
    items: [
      { name: 'Beef Tehari', qty: 2, price: 120 },
      { name: 'Borhani', qty: 2, price: 30 },
    ],
    total: 330,
    status: 'DELIVERED',
    orderType: 'Delivery',
    deliveryFee: 30,
    createdAt: '2026-08-19T10:30:00Z',
  },
  {
    _id: 'ord70b2c3',
    customer: { _id: 'u002', name: 'Fatima Akter' },
    provider: { _id: 'p002', name: 'Shah Cafeteria' },
    items: [
      { name: 'Chicken Burger', qty: 1, price: 150 },
      { name: 'French Fries', qty: 1, price: 80 },
    ],
    total: 260,
    status: 'PREPARING',
    orderType: 'Pickup',
    deliveryFee: 0,
    createdAt: '2026-08-19T12:15:00Z',
  },
  {
    _id: 'ord80c3d4',
    customer: { _id: 'u003', name: 'Rafi Ahmed' },
    provider: { _id: 'p001', name: 'Khuda Canteen' },
    items: [
      { name: 'Chicken Biryani', qty: 1, price: 160 },
      { name: 'Cha', qty: 1, price: 15 },
    ],
    total: 205,
    status: 'PENDING',
    orderType: 'Delivery',
    deliveryFee: 30,
    createdAt: '2026-08-19T13:45:00Z',
  },
  {
    _id: 'ord90d4e5',
    customer: { _id: 'u004', name: 'Dr. Rahman' },
    provider: { _id: 'p002', name: 'Shah Cafeteria' },
    items: [
      { name: 'Singara', qty: 5, price: 15 },
      { name: 'Cha', qty: 2, price: 15 },
    ],
    total: 135,
    status: 'READY',
    orderType: 'Pickup',
    deliveryFee: 0,
    createdAt: '2026-08-19T09:00:00Z',
  },
  {
    _id: 'orda0e5f6',
    customer: { _id: 'u001', name: 'Abir Hasan' },
    provider: { _id: 'p001', name: 'Khuda Canteen' },
    items: [
      { name: 'Khichuri', qty: 1, price: 80 },
      { name: 'Egg Curry', qty: 1, price: 40 },
    ],
    total: 150,
    status: 'CANCELLED',
    orderType: 'Delivery',
    deliveryFee: 30,
    createdAt: '2026-08-18T18:30:00Z',
  },
  {
    _id: 'ordb1f6g7',
    customer: { _id: 'u002', name: 'Fatima Akter' },
    provider: { _id: 'p001', name: 'Khuda Canteen' },
    items: [
      { name: 'Beef Tehari', qty: 1, price: 120 },
    ],
    total: 150,
    status: 'DELIVERED',
    orderType: 'Delivery',
    deliveryFee: 30,
    createdAt: '2026-08-18T12:00:00Z',
  },
  {
    _id: 'ordc2g7h8',
    customer: { _id: 'u005', name: 'Nusrat Jahan' },
    provider: { _id: 'p002', name: 'Shah Cafeteria' },
    items: [
      { name: 'Pasta', qty: 1, price: 180 },
      { name: 'Cold Coffee', qty: 1, price: 100 },
    ],
    total: 280,
    status: 'DELIVERED',
    orderType: 'Pickup',
    deliveryFee: 0,
    createdAt: '2026-08-17T14:20:00Z',
  },
  {
    _id: 'ordd3h8i9',
    customer: { _id: 'u003', name: 'Rafi Ahmed' },
    provider: { _id: 'p002', name: 'Shah Cafeteria' },
    items: [
      { name: 'Chicken Burger', qty: 2, price: 150 },
      { name: 'Mojo', qty: 2, price: 30 },
    ],
    total: 360,
    status: 'PENDING',
    orderType: 'Delivery',
    deliveryFee: 30,
    createdAt: '2026-08-19T14:50:00Z',
  },
];

// Helper functions matching web admin.js logic
export function getBuyers() {
  return DEMO_USERS.filter(u => u.role === 'buyer');
}

export function getSellers() {
  return DEMO_USERS.filter(u => u.role === 'seller');
}

export function getProviderForSeller(sellerId) {
  return DEMO_PROVIDERS.find(p => p.seller === sellerId) || null;
}

export function getOrdersForProvider(providerId) {
  return DEMO_ORDERS.filter(o => o.provider && o.provider._id === providerId);
}

export function getTotalRevenue() {
  return DEMO_ORDERS.reduce((sum, o) => sum + o.total, 0);
}

export function getRecentOrders(count = 5) {
  return [...DEMO_ORDERS].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, count);
}
