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
   * Centralized HTTP client sending Bearer JWT headers
   */
  async request(endpoint, method = 'GET', body = null) {
    const token = await this.getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (token && !token.startsWith('mock_token_')) {
      headers.Authorization = `Bearer ${token}`;
    }

    const config = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(body);
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_CONFIG.BASE_URL}${cleanEndpoint}`;

    try {
      const response = await fetch(url, config);
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
      const data = await this.request('/auth/me', 'GET');
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
    return await this.request('/auth/profile', 'PUT', updateData);
  }

  // -------------------------------------------------------------
  // MENU ITEMS
  // -------------------------------------------------------------

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

  async blockUser(userId, isBlocked) {
    return await this.request(`/users/${userId}/block`, 'PUT', { isBlocked });
  }

  async blockSeller(sellerId, isBlocked) {
    return await this.request(`/users/${sellerId}/block`, 'PUT', { isBlocked });
  }
}

export default new HttpDataService();
