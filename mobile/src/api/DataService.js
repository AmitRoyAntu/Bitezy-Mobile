import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initialUsers,
  initialProviders,
  initialMenu,
  initialOrders,
  initialReviews,
} from '../data/initialData';

class LocalDataService {
  constructor() {
    this.users = [...initialUsers];
    this.providers = [...initialProviders];
    this.menu = [...initialMenu];
    this.orders = [...initialOrders];
    this.reviews = [...initialReviews];
    this.initialized = false;
  }

  async initStorage() {
    if (this.initialized) return;
    try {
      const storedUsers = await AsyncStorage.getItem('bitezy_mock_users');
      if (storedUsers) this.users = JSON.parse(storedUsers);
      else await AsyncStorage.setItem('bitezy_mock_users', JSON.stringify(this.users));

      const storedProviders = await AsyncStorage.getItem('bitezy_mock_providers');
      if (storedProviders) {
        const parsed = JSON.parse(storedProviders);
        this.providers = parsed.map((p) => {
          const init = initialProviders.find(
            (ip) => String(ip._id) === String(p._id) || String(ip.id) === String(p.id)
          );
          return init ? { ...p, lat: init.lat, lng: init.lng, mapQuery: init.mapQuery } : p;
        });
      } else {
        await AsyncStorage.setItem('bitezy_mock_providers', JSON.stringify(this.providers));
      }

      const storedMenu = await AsyncStorage.getItem('bitezy_mock_menu');
      if (storedMenu) this.menu = JSON.parse(storedMenu);
      else await AsyncStorage.setItem('bitezy_mock_menu', JSON.stringify(this.menu));

      const storedOrders = await AsyncStorage.getItem('bitezy_mock_orders');
      if (storedOrders) this.orders = JSON.parse(storedOrders);
      else await AsyncStorage.setItem('bitezy_mock_orders', JSON.stringify(this.orders));

      const storedReviews = await AsyncStorage.getItem('bitezy_mock_reviews');
      if (storedReviews) this.reviews = JSON.parse(storedReviews);
      else await AsyncStorage.setItem('bitezy_mock_reviews', JSON.stringify(this.reviews));

      this.initialized = true;
    } catch (e) {
      console.warn('AsyncStorage init warning:', e);
      this.initialized = true;
    }
  }

  async persist(key, data) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to persist ${key}:`, e);
    }
  }

  async getAuthToken() {
    return await AsyncStorage.getItem('bitezy_token');
  }

  async getCurrentUser() {
    await this.initStorage();
    const token = await this.getAuthToken();
    if (!token) return null;
    const userId = token.replace('mock_token_', '');
    const user = this.users.find((u) => String(u._id || u.id) === String(userId));
    return user || null;
  }

  async logout() {
    try {
      await AsyncStorage.removeItem('bitezy_token');
      await AsyncStorage.removeItem('bitezy_cart');
    } catch (e) {
      console.error('DataService logout error:', e);
    }
  }

  // Generic request method for compatibility
  async request(endpoint, method = 'GET', body = null) {
    await this.initStorage();

    if (endpoint === '/auth/login') {
      return this.login(body.email, body.password);
    }
    if (endpoint === '/auth/verify-otp') {
      return this.verifyOtp(body.email, body.otp);
    }
    if (endpoint === '/auth/forgot-password') {
      return this.forgotPassword(body.email);
    }
    if (endpoint === '/auth/reset-password') {
      return this.resetPassword(body.email, body.otp, body.newPassword);
    }
    if (endpoint === '/auth/register') {
      return this.register(body);
    }
    if (endpoint === '/auth/me') {
      return this.getMe();
    }
    if (endpoint === '/auth/profile') {
      return this.updateProfile(body);
    }
    if (endpoint === '/providers') {
      return this.getProviders();
    }
    if (endpoint === '/orders/myorders') {
      return this.getOrders();
    }
    if (endpoint === '/orders/seller') {
      return this.getSellerOrders();
    }
    if (endpoint === '/orders' && method === 'POST') {
      return this.createOrder(body);
    }
    if (endpoint === '/orders' && method === 'GET') {
      return this.getAllOrders();
    }
    if (endpoint === '/users') {
      return this.getUsers();
    }

    return null;
  }

  // Auth Operations
  async login(email, password) {
    await this.initStorage();
    const user = this.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (!user) {
      throw new Error('No user account found with this email.');
    }

    if (user.password && user.password !== password) {
      throw new Error('Incorrect password. Please try again.');
    }

    if (user.isBlocked) {
      throw new Error('This account has been suspended by administration.');
    }

    const { password: _, ...safeUser } = user;
    const token = `mock_token_${user._id || user.id}`;
    return {
      ...safeUser,
      _id: String(user._id || user.id),
      token,
      message: 'OTP sent to your registered email (Use 123456)',
    };
  }

  async verifyOtp(email, otp) {
    await this.initStorage();
    const user = this.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (!user) {
      throw new Error('User not found.');
    }

    // In frontend mock mode, any 6 digit OTP or 123456 verifies successfully
    const { password: _, ...safeUser } = user;
    const token = `mock_token_${user._id || user.id}`;
    return {
      ...safeUser,
      _id: String(user._id || user.id),
      token,
    };
  }

  async register(userData) {
    await this.initStorage();
    const existing = this.users.find(
      (u) => u.email.toLowerCase() === userData.email.toLowerCase().trim()
    );

    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const newId = String(Date.now());
    const newUser = {
      _id: newId,
      id: newId,
      ...userData,
      isBlocked: false,
    };

    this.users.push(newUser);
    await this.persist('bitezy_mock_users', this.users);

    // If registered as seller, also create mock provider entry
    if (userData.role === 'seller') {
      const newProvider = {
        _id: String(this.providers.length + 1),
        id: this.providers.length + 1,
        name: userData.vendorName || `${userData.name}'s Canteen`,
        type: 'Canteen',
        img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
        seller: newId,
        location: userData.residence || 'CUET Campus',
        rating: 5.0,
        deliveryTime: '15-20 min',
        isOpen: true,
        description: 'Fresh quality meals cooked with passion.',
      };
      this.providers.push(newProvider);
      await this.persist('bitezy_mock_providers', this.providers);
    }

    const token = `mock_token_${newId}`;
    return {
      _id: newId,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      token,
    };
  }

  async forgotPassword(email) {
    await this.initStorage();
    const user = this.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim()
    );
    if (!user) {
      throw new Error('No account found with this email.');
    }
    return { message: 'Reset code sent to your email (Use 123456)' };
  }

  async resetPassword(email, otp, newPassword) {
    await this.initStorage();
    const userIndex = this.users.findIndex(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim()
    );
    if (userIndex === -1) {
      throw new Error('User not found.');
    }
    this.users[userIndex].password = newPassword;
    await this.persist('bitezy_mock_users', this.users);

    const user = this.users[userIndex];
    const token = `mock_token_${user._id || user.id}`;
    return {
      _id: String(user._id || user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      token,
      message: 'Password updated successfully',
    };
  }

  async getMe() {
    return await this.getCurrentUser();
  }

  async updateProfile(profileData) {
    await this.initStorage();
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Not logged in');

    const index = this.users.findIndex((u) => String(u._id || u.id) === String(user._id || user.id));
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...profileData };
      await this.persist('bitezy_mock_users', this.users);
      return this.users[index];
    }
    return user;
  }

  // Providers & Menu
  async getProviders() {
    await this.initStorage();
    return [...this.providers];
  }

  async getMyProvider() {
    await this.initStorage();
    const user = await this.getCurrentUser();
    if (!user) return null;
    const provider = this.providers.find(
      (p) => String(p.seller) === String(user._id || user.id)
    );
    return provider || this.providers[0];
  }

  async updateProvider(providerId, updateData) {
    await this.initStorage();
    const index = this.providers.findIndex(
      (p) => String(p._id || p.id) === String(providerId)
    );
    if (index !== -1) {
      this.providers[index] = { ...this.providers[index], ...updateData };
      await this.persist('bitezy_mock_providers', this.providers);
      return this.providers[index];
    }
    throw new Error('Provider not found');
  }

  async getMenu(vendorId = null, availableOnly = false) {
    await this.initStorage();
    let list = [...this.menu];
    if (vendorId) {
      list = list.filter((m) => String(m.provider) === String(vendorId));
    }
    if (availableOnly) {
      list = list.filter((m) => m.available);
    }
    return list;
  }

  async getMenuByProvider(providerId, availableOnly = false) {
    return this.getMenu(providerId, availableOnly);
  }

  async createMenuItem(data) {
    await this.initStorage();
    const provider = await this.getMyProvider();
    const newId = String(Date.now());
    const newItem = {
      _id: newId,
      id: newId,
      provider: provider ? String(provider._id || provider.id) : "1",
      available: true,
      img: data.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80',
      ...data,
    };
    this.menu.unshift(newItem);
    await this.persist('bitezy_mock_menu', this.menu);
    return newItem;
  }

  async updateMenuItem(id, data) {
    await this.initStorage();
    const index = this.menu.findIndex((m) => String(m._id || m.id) === String(id));
    if (index !== -1) {
      this.menu[index] = { ...this.menu[index], ...data };
      await this.persist('bitezy_mock_menu', this.menu);
      return this.menu[index];
    }
    throw new Error('Item not found');
  }

  async deleteMenuItem(id) {
    await this.initStorage();
    this.menu = this.menu.filter((m) => String(m._id || m.id) !== String(id));
    await this.persist('bitezy_mock_menu', this.menu);
    return { success: true };
  }

  // Orders
  async getOrders() {
    await this.initStorage();
    const user = await this.getCurrentUser();
    const userId = user ? String(user._id || user.id) : "1";

    return this.orders
      .filter((o) => String(o.customer) === userId || String(o.customer?._id) === userId)
      .map((order) => {
        const providerObj = this.providers.find(
          (p) => String(p._id || p.id) === String(order.provider)
        );
        return {
          ...order,
          provider: providerObj || { name: order.providerName || 'Canteen' },
        };
      });
  }

  async createOrder(orderData) {
    await this.initStorage();
    const user = await this.getCurrentUser();
    const providerObj = this.providers.find(
      (p) => p.name.toLowerCase() === (orderData.providerName || '').toLowerCase()
    ) || this.providers[0];

    const newOrder = {
      _id: String(Math.floor(100000 + Math.random() * 900000)),
      id: Date.now(),
      provider: String(providerObj._id || providerObj.id),
      providerName: providerObj.name,
      items: orderData.items,
      subtotal: orderData.total - (orderData.type === 'delivery' ? 30 : 0),
      deliveryFee: orderData.type === 'delivery' ? 30 : 0,
      total: orderData.total,
      type: orderData.type,
      status: 'PENDING',
      customer: user ? String(user._id || user.id) : "1",
      deliveryAddress: orderData.deliveryAddress,
      createdAt: new Date().toISOString(),
    };

    this.orders.unshift(newOrder);
    await this.persist('bitezy_mock_orders', this.orders);
    return newOrder;
  }

  async getAllOrders() {
    await this.initStorage();
    return this.orders.map((order) => {
      const customer = this.users.find(
        (u) => String(u._id || u.id) === String(order.customer)
      );
      const provider = this.providers.find(
        (p) => String(p._id || p.id) === String(order.provider)
      );
      return {
        ...order,
        customer: customer || { name: 'Student Buyer' },
        provider: provider || { name: order.providerName || 'Vendor' },
      };
    });
  }

  async getSellerOrders() {
    await this.initStorage();
    const provider = await this.getMyProvider();
    const providerId = provider ? String(provider._id || provider.id) : "1";

    return this.orders
      .filter((o) => String(o.provider) === providerId)
      .map((order) => {
        const customer = this.users.find(
          (u) => String(u._id || u.id) === String(order.customer)
        );
        return {
          ...order,
          customer: customer || { name: 'Student Buyer', residence: order.deliveryAddress },
        };
      });
  }

  async updateOrderStatus(orderId, status) {
    await this.initStorage();
    const index = this.orders.findIndex((o) => String(o._id || o.id) === String(orderId));
    if (index !== -1) {
      this.orders[index].status = status;
      await this.persist('bitezy_mock_orders', this.orders);
      return this.orders[index];
    }
    throw new Error('Order not found');
  }

  // Reviews
  async getReviewsByProvider(providerId) {
    await this.initStorage();
    return this.reviews.filter(
      (r) => String(r.provider) === String(providerId)
    );
  }

  async createReview(reviewData) {
    await this.initStorage();
    const user = await this.getCurrentUser();
    const newReview = {
      _id: `r_${Date.now()}`,
      provider: String(reviewData.provider),
      user: {
        _id: user ? String(user._id || user.id) : "1",
        name: user ? user.name : "Anonymous Student",
      },
      rating: reviewData.rating,
      comment: reviewData.comment,
      createdAt: new Date().toISOString(),
    };

    this.reviews.unshift(newReview);
    await this.persist('bitezy_mock_reviews', this.reviews);
    return newReview;
  }

  async getReviews(providerId) {
    return this.getReviewsByProvider(providerId);
  }

  async getAllReviews() {
    await this.initStorage();
    return this.reviews.map((r) => {
      const provider = this.providers.find(
        (p) => String(p._id || p.id) === String(r.provider)
      );
      return {
        ...r,
        providerName: provider ? provider.name : 'Vendor',
        providerLocation: provider ? provider.location : '',
      };
    });
  }

  async deleteReview(reviewId) {
    await this.initStorage();
    this.reviews = this.reviews.filter(
      (r) => String(r._id || r.id) !== String(reviewId)
    );
    await this.persist('bitezy_mock_reviews', this.reviews);
    return { success: true };
  }

  // Admin
  async getUsers() {
    await this.initStorage();
    return [...this.users];
  }

  async blockUser(userId, isBlocked) {
    await this.initStorage();
    const index = this.users.findIndex((u) => String(u._id || u.id) === String(userId));
    if (index !== -1) {
      this.users[index].isBlocked = isBlocked;
      await this.persist('bitezy_mock_users', this.users);
      return this.users[index];
    }
    throw new Error('User not found');
  }

  async blockSeller(sellerId, isBlocked) {
    await this.initStorage();
    // 1. Update seller user account
    const userIndex = this.users.findIndex(
      (u) => String(u._id || u.id) === String(sellerId)
    );
    if (userIndex !== -1) {
      this.users[userIndex].isBlocked = isBlocked;
      await this.persist('bitezy_mock_users', this.users);
    }

    // 2. Update linked provider / canteen profile
    const providerIndex = this.providers.findIndex(
      (p) => String(p.seller) === String(sellerId) || String(p._id || p.id) === String(sellerId)
    );
    if (providerIndex !== -1) {
      this.providers[providerIndex].isBlocked = isBlocked;
      this.providers[providerIndex].isOpen = !isBlocked;
      await this.persist('bitezy_mock_providers', this.providers);
    }

    return { success: true, isBlocked };
  }
}

export default new LocalDataService();
