import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// -------------------------------------------------------------
// Bitezy Mobile Backend API Configuration
// -------------------------------------------------------------
// When testing with physical phones on your local Wi-Fi,
// use your computer's local Wi-Fi IP address (e.g., 192.168.0.248).
// When testing in web / emulator, localhost or 10.0.2.2 is used.
// -------------------------------------------------------------

export const DEFAULT_HOST = '192.168.0.248'; // Your machine's Wi-Fi IP
export const DEFAULT_PORT = 8002;

export const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return `http://localhost:${DEFAULT_PORT}/api`;
  }
  // For physical phones and simulators on LAN
  return `http://${DEFAULT_HOST}:${DEFAULT_PORT}/api`;
};

let currentBaseUrl = getBaseUrl();

export const API_CONFIG = {
  get BASE_URL() {
    return currentBaseUrl;
  },
  set BASE_URL(url) {
    currentBaseUrl = url;
  },
  async loadCustomBaseUrl() {
    try {
      const saved = await AsyncStorage.getItem('bitezy_custom_api_url');
      if (saved) {
        currentBaseUrl = saved;
      }
    } catch (e) {
      console.warn('Could not load custom API URL:', e);
    }
    return currentBaseUrl;
  },
  async setCustomBaseUrl(newUrl) {
    currentBaseUrl = newUrl;
    try {
      await AsyncStorage.setItem('bitezy_custom_api_url', newUrl);
    } catch (e) {
      console.warn('Could not save custom API URL:', e);
    }
  },
};

export default API_CONFIG;
