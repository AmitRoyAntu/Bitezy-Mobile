import { getAiBaseUrl } from './config';

class AiService {
  constructor() {
    this.timeoutMs = 25000;
  }

  async request(endpoint, method = 'GET', body = null) {
    const baseUrl = getAiBaseUrl();
    const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    const config = {
      method,
      headers,
      signal: controller.signal,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `AI Service HTTP Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn(`[AiService] ${method} ${url} failed:`, error.message);
      throw error;
    }
  }

  /**
   * Chat with BitezyBot (supports meal suggestions & combo creator)
   */
  async chat(message, history = []) {
    return this.request('/chat', 'POST', { message, history });
  }

  /**
   * Fetch quick suggestion prompts
   */
  async getQuickSuggestions() {
    return this.request('/quick-suggestions', 'GET');
  }

  /**
   * Shortcut for adding menu item using AI (e.g. "Rice 50")
   */
  async quickMenuItem(prompt) {
    return this.request('/quick-menu', 'POST', { prompt });
  }

  /**
   * Get summarized reviews for buyer or seller
   */
  async getReviewSummary(providerId, audience = 'buyer') {
    return this.request(`/summarize-reviews?provider_id=${providerId}&audience=${audience}`, 'GET');
  }
}

const aiService = new AiService();
export default aiService;

