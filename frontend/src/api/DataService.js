import AsyncStorage from '@react-native-async-storage/async-storage';
import API_CONFIG from './config';

class HttpDataService {
  constructor() {
    this.token = null;
    this.init();
  }

  async init() {
    await API_CONFIG.loadCustomBaseUrl();
    try {
      this.token = await AsyncStorage.getItem('bitezy_token');
    } catch (e) {
      console.warn('Could not read stored token:', e);
    }
  }

  async getAuthToken() {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('bitezy_token');
    }
    return this.token;
  }

  async setAuthToken(token) {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem('bitezy_token', token);
    } else {
      await AsyncStorage.removeItem('bitezy_token');
    }
  }

  /**
   * Centralized HTTP client sending Bearer JWT headers with fast timeout
   */
  async request(endpoint, method = 'GET', body = null, timeoutMs = 6000) {
    const token = await this.getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (token && !token.startsWith('mock_token_')) {
      headers.Authorization = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const config = {
      method,
      headers,
      signal: controller.signal,
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(body);
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_CONFIG.BASE_URL}${cleanEndpoint}`;

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      const text = await response.text();
      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        data = { message: text };
      }

      if (!response.ok) {
        const errorMsg = data.message || `Server error (${response.status})`;
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        const timeoutMsg = `Cannot connect to server at ${API_CONFIG.BASE_URL}. Please ensure backend is running and your phone is on the same Wi-Fi.`;
        console.warn(timeoutMsg);
        throw new Error(timeoutMsg);
      }
      console.warn(`API request [${method} ${url}] error:`, err.message);
      throw err;
    }
  }

  // -------------------------------------------------------------
  // AUTHENTICATION
  // -------------------------------------------------------------

  async login(email, password) {
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const cleanPassword = password ? password.trim() : '';

    const data = await this.request('/auth/login', 'POST', {
      email: cleanEmail,
      password: cleanPassword,
    });

    if (data.token) {
      await this.setAuthToken(data.token);
    }
    return data;
  }

  async verifyOtp(email, otp) {
    return { success: true };
  }

  async register(userData) {
    const data = await this.request('/auth/register', 'POST', userData);
    if (data.token) {
      await this.setAuthToken(data.token);
    }
    return data;
  }

  async getMe() {
    try {
      const token = await this.getAuthToken();
      if (!token || token.startsWith('mock_token_')) return null;
      const data = await this.request('/auth/me', 'GET', null, 4000);
      return data;
    } catch (err) {
      return null;
    }
  }

  async getCurrentUser() {
    return await this.getMe();
  }

  async updateProfile(profileData) {
    return await this.request('/auth/profile', 'PUT', profileData);
  }

  async forgotPassword(email) {
    return await this.request('/auth/forgot-password', 'POST', { email });
  }

  async resetPassword(email, otp, newPassword) {
    const data = await this.request('/auth/reset-password', 'POST', {
      email,
      otp,
      newPassword,
    });
    if (data.token) {
      await this.setAuthToken(data.token);
    }
    return data;
  }

  async logout() {
    await this.setAuthToken(null);
    try {
      await AsyncStorage.removeItem('bitezy_cart');
    } catch (e) {
      // ignore
    }
  }

  // -------------------------------------------------------------
  // PROVIDERS & CANTEENS
  // -------------------------------------------------------------

  async getProviders() {
    try {
      const providers = await this.request('/providers', 'GET');
      return Array.isArray(providers) ? providers : [];
    } catch (err) {
      return [];
    }
  }

  async getProviderById(id) {
    return await this.request(`/providers/${id}`, 'GET');
  }

  async getMyProvider() {
    try {
      return await this.request('/providers/myprovider', 'GET');
    } catch (err) {
      return null;
    }
  }

  async updateProvider(providerId, updateData) {
    if (providerId) {
      return await this.request(`/providers/${providerId}`, 'PUT', updateData);
    }
    return await this.request('/auth/profile', 'PUT', updateData);
  }

  // -------------------------------------------------------------
  // MENU ITEMS
  // -------------------------------------------------------------

    async getSellerMenu() {
    try {
      const items = await this.request('/menu/seller', 'GET');
      return Array.isArray(items) ? items : null;
    } catch (err) {
      return null;
    }
  }

  async getMenu(vendorId = null, availableOnly = false) {
    try {
      let endpoint = '/menu';
      const params = [];
      if (vendorId) params.push(`vendor=${encodeURIComponent(vendorId)}`);
      if (availableOnly) params.push('available=true');
      if (params.length > 0) {
        endpoint += `?${params.join('&')}`;
      }

      const items = await this.request(endpoint, 'GET');
      return Array.isArray(items) ? items : [];
    } catch (err) {
      return [];
    }
  }

  async getMenuByProvider(providerId, availableOnly = false) {
    return this.getMenu(providerId, availableOnly);
  }

  async createMenuItem(data) {
    return await this.request('/menu', 'POST', data);
  }

  async updateMenuItem(id, data) {
    return await this.request(`/menu/${id}`, 'PUT', data);
  }

  async deleteMenuItem(id) {
    return await this.request(`/menu/${id}`, 'DELETE');
  }

  // -------------------------------------------------------------
  // ORDERS
  // -------------------------------------------------------------

  async getOrders() {
    try {
      const orders = await this.request('/orders/myorders', 'GET');
      return Array.isArray(orders) ? orders : [];
    } catch (err) {
      return [];
    }
  }

  async getSellerOrders() {
    try {
      const orders = await this.request('/orders/seller', 'GET');
      return Array.isArray(orders) ? orders : [];
    } catch (err) {
      return [];
    }
  }

  async getAllOrders() {
    try {
      const orders = await this.request('/orders', 'GET');
      return Array.isArray(orders) ? orders : [];
    } catch (err) {
      return [];
    }
  }

  async createOrder(orderData) {
    const payload = {
      provider: orderData.provider || orderData.providerId,
      providerName: orderData.providerName,
      items: orderData.items,
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee,
      total: orderData.total,
      type: orderData.orderType || orderData.type,
      deliveryAddress: orderData.deliveryAddress,
      notes: orderData.notes,
    };
    return await this.request('/orders', 'POST', payload);
  }

  async updateOrderStatus(orderId, status) {
    return await this.request(`/orders/${orderId}/status`, 'PUT', { status });
  }

  // -------------------------------------------------------------
  // REVIEWS
  // -------------------------------------------------------------

  async getReviewsByProvider(providerId) {
    try {
      if (!providerId) return [];
      const reviews = await this.request(`/reviews/provider/${providerId}`, 'GET');
      return Array.isArray(reviews) ? reviews : [];
    } catch (err) {
      return [];
    }
  }

  async getReviews(providerId) {
    return this.getReviewsByProvider(providerId);
  }

  async getAllReviews() {
    try {
      const reviews = await this.request('/reviews', 'GET');
      return Array.isArray(reviews) ? reviews : [];
    } catch (err) {
      return [];
    }
  }

  async createReview(reviewData) {
    return await this.request('/reviews', 'POST', {
      provider: reviewData.provider || reviewData.providerId,
      rating: reviewData.rating,
      comment: reviewData.comment,
    });
  }

  async deleteReview(reviewId) {
    return await this.request(`/reviews/${reviewId}`, 'DELETE');
  }

  // -------------------------------------------------------------
  // ADMIN USERS & SELLERS MANAGEMENT
  // -------------------------------------------------------------

  async getUsers() {
    try {
      const users = await this.request('/users', 'GET');
      return Array.isArray(users) ? users : [];
    } catch (err) {
      return [];
    }
  }

  
  async getAdminOrders() {
    try {
      const [orders, users, providers] = await Promise.all([
        this.getAllOrders(),
        this.getUsers(),
        this.getProviders(),
      ]);

      return (orders || []).map((o) => {
        let customerObj = o.customer;
        if (!customerObj || typeof customerObj !== "object" || !customerObj.name) {
          const custId = String(customerObj?._id || customerObj || "");
          const matchUser = (users || []).find((u) => String(u._id || u.id) === custId);
          if (matchUser) {
            customerObj = {
              _id: matchUser._id || matchUser.id,
              name: matchUser.name,
              email: matchUser.email,
              phone: matchUser.phone,
              residence: matchUser.residence || matchUser.deliveryAddress,
              department: matchUser.department,
              cuetId: matchUser.cuetId,
              buyerType: matchUser.buyerType,
            };
          }
        }

        let providerObj = o.provider;
        if (!providerObj || typeof providerObj !== "object" || !providerObj.name) {
          const provId = String(providerObj?._id || providerObj || "");
          const matchProv = (providers || []).find((p) => String(p._id || p.id) === provId);
          if (matchProv) {
            providerObj = {
              _id: matchProv._id || matchProv.id,
              name: matchProv.name,
              location: matchProv.location,
              type: matchProv.type,
              img: matchProv.img,
            };
          }
        }

        return {
          ...o,
          customer: customerObj || { name: o.customerName || "Campus Customer" },
          provider: providerObj || { name: o.providerName || "Campus Canteen" },
        };
      });
    } catch (err) {
      console.warn("Failed to load admin orders:", err);
      return this.getAllOrders();
    }
  }

  async getAdminReviews() {
    try {
      const [reviews, users, providers] = await Promise.all([
        this.getAllReviews(),
        this.getUsers(),
        this.getProviders(),
      ]);

      return (reviews || []).map((r) => {
        let buyerObj = r.buyer || r.user;
        if (!buyerObj || typeof buyerObj !== "object" || !buyerObj.name) {
          const buyerId = String(buyerObj?._id || buyerObj || "");
          const matchUser = (users || []).find((u) => String(u._id || u.id) === buyerId);
          if (matchUser) {
            buyerObj = {
              _id: matchUser._id || matchUser.id,
              name: matchUser.name,
              email: matchUser.email,
              phone: matchUser.phone,
              department: matchUser.department,
            };
          }
        }

        let providerObj = r.provider;
        if (!providerObj || typeof providerObj !== "object" || !providerObj.name) {
          const provId = String(providerObj?._id || providerObj || "");
          const matchProv = (providers || []).find((p) => String(p._id || p.id) === provId);
          if (matchProv) {
            providerObj = {
              _id: matchProv._id || matchProv.id,
              name: matchProv.name,
              location: matchProv.location,
            };
          }
        }

        return {
          ...r,
          buyer: buyerObj || { name: r.userName || "Campus Customer" },
          provider: providerObj || { name: r.providerName || "Campus Seller" },
        };
      });
    } catch (e) {
      console.warn("Failed to load admin reviews:", e);
      return this.getAllReviews();
    }
  }

  async getAdminUsers() {
    try {
      const [users, orders] = await Promise.all([
        this.getUsers(),
        this.getAllOrders(),
      ]);

      return (users || []).map((u) => {
        const userIdStr = String(u._id || u.id);
        const userOrders = (orders || []).filter(
          (o) => String(o.customer?._id || o.customer) === userIdStr
        );
        const totalSpent = userOrders.reduce((s, o) => s + (o.total || 0), 0);

        return {
          ...u,
          ordersCount: u.ordersCount !== undefined ? u.ordersCount : userOrders.length,
          totalSpent: u.totalSpent !== undefined ? u.totalSpent : totalSpent,
        };
      });
    } catch (e) {
      console.warn("Failed to load admin users:", e);
      return [];
    }
  }

  async blockUser(userId, isBlocked) {
    return await this.request(`/users/${userId}/block`, 'PUT', { isBlocked });
  }

    async getAdminSellers() {
    try {
      const [providers, orders, users] = await Promise.all([
        this.getProviders(),
        this.getAllOrders(),
        this.getUsers(),
      ]);

      const sellers = (users || []).filter((u) => u.role === "seller");

      return (providers || []).map((p) => {
        const provId = String(p._id || p.id);
        const pOrders = (orders || []).filter(
          (o) => String(o.provider?._id || o.provider) === provId
        );
        const totalRev = pOrders.reduce((sum, o) => sum + (o.total || 0), 0);

        const sellerIdStr = String(
          typeof p.seller === "object" && p.seller !== null
            ? (p.seller._id || p.seller.id)
            : p.seller
        );
        const liveUser = sellers.find(
          (s) =>
            String(s._id || s.id) === sellerIdStr ||
            (s.email && p.seller?.email && s.email.toLowerCase() === p.seller.email.toLowerCase())
        );

        const isBlocked = !!(liveUser?.isBlocked || p.isBlocked || p.seller?.isBlocked);
        const sellerObj = liveUser || (typeof p.seller === "object" ? p.seller : null) || {};

        return {
          _id: p._id || p.id,
          id: p._id || p.id,
          name: p.name,
          type: p.type || "Canteen",
          location: p.location || "CUET Campus",
          deliveryTime: p.deliveryTime || null,
          openTime: p.openTime || null,
          closeTime: p.closeTime || null,
          isOpen: p.isOpen !== false && !isBlocked,
          isBlocked: isBlocked,
          img: p.img,
          seller: {
            _id: sellerObj._id || sellerObj.id || sellerIdStr,
            name: sellerObj.name || "Unassigned",
            email: sellerObj.email || "N/A",
            phone: sellerObj.phone || (typeof p.seller === "object" ? p.seller?.phone : null) || "N/A",
            isBlocked: isBlocked,
          },
          stats: {
            totalOrders: pOrders.length,
            totalRevenue: totalRev,
            rating: p.rating || 0,
          },
        };
      });
    } catch (e) {
      console.warn("Failed to load admin sellers:", e);
      return [];
    }
  }

  async blockSeller(params, fallbackIsBlocked) {
    let sellerUserId = null;
    let isBlocked = false;

    if (typeof params === "object" && params !== null) {
      sellerUserId = params.sellerUserId || params.providerId;
      isBlocked = !!params.isBlocked;
    } else {
      sellerUserId = params;
      isBlocked = !!fallbackIsBlocked;
    }

    if (sellerUserId) {
      return await this.request(`/users/${sellerUserId}/block`, "PUT", { isBlocked });
    }
  }

  // -------------------------------------------------------------
  // COUPONS
  // -------------------------------------------------------------

  async validateCoupon(code, subtotal, orderType) {
    return await this.request("/coupons/validate", "POST", {
      code,
      subtotal,
      orderType,
    });
  }

  async getActiveCoupons() {
    try {
      const coupons = await this.request("/coupons/active", "GET");
      return Array.isArray(coupons) ? coupons : [];
    } catch (err) {
      return [];
    }
  }

  async getCoupons() {
    try {
      const coupons = await this.request("/coupons", "GET");
      return Array.isArray(coupons) ? coupons : [];
    } catch (err) {
      return [];
    }
  }

  async createCoupon(couponData) {
    return await this.request("/coupons", "POST", couponData);
  }

  async toggleCoupon(couponId) {
    return await this.request(`/coupons/${couponId}/toggle`, "PATCH");
  }

  async deleteCoupon(couponId) {
    return await this.request(`/coupons/${couponId}`, "DELETE");
  }
}

export default new HttpDataService();
