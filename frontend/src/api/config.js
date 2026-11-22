import { Platform, NativeModules } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// -------------------------------------------------------------
// Bitezy Mobile Backend API Configuration
// -------------------------------------------------------------

export const DEFAULT_HOST = "10.19.90.65"; // Mac's current Wi-Fi IP
export const DEFAULT_PORT = 8002;
export const AI_PORT = 8001;

// Live Cloud Backend (Render)
export const PRODUCTION_BACKEND_URL = "https://bitezy-backend-2zcg.onrender.com/api";
export const PRODUCTION_AI_URL = "https://bitezy-ai-service.onrender.com/api/ai"; // Set your Render AI service URL here
export const USE_CLOUD_BACKEND = true; // Set to false to switch back to local network IP

/**
 * Automatically extracts the Metro host IP from NativeModules.SourceCode.scriptURL
 * Falls back to DEFAULT_HOST when running via tunnel or when scriptURL is not an IP.
 */
const getAutoDetectedHost = () => {
  if (Platform.OS === "web") {
    return "localhost";
  }
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      // Match plain IPv4 addresses across http, https, exp, or custom schemes
      const match = scriptURL.match(/(?:https?|exp|exps):\/\/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/i);
      if (match && match[1]) {
        return match[1];
      }
    }
  } catch (e) {
    // fallback
  }
  return DEFAULT_HOST;
};

export const getBaseUrl = () => {
  if (USE_CLOUD_BACKEND) {
    return PRODUCTION_BACKEND_URL;
  }
  if (Platform.OS === "web") {
    return `http://localhost:${DEFAULT_PORT}/api`;
  }
  const host = getAutoDetectedHost();
  return `http://${host}:${DEFAULT_PORT}/api`;
};

export const getAiBaseUrl = () => {
  if (USE_CLOUD_BACKEND) {
    return PRODUCTION_AI_URL;
  }
  if (Platform.OS === "web") {
    return `http://localhost:${AI_PORT}/api/ai`;
  }
  const host = getAutoDetectedHost();
  return `http://${host}:${AI_PORT}/api/ai`;
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
      // Always clear stale cached URLs — use fresh auto-detected URL on every launch
      await AsyncStorage.removeItem("bitezy_custom_api_url");
    } catch (e) {
      // ignore
    }
    currentBaseUrl = getBaseUrl();
    return currentBaseUrl;
  },
  async setCustomBaseUrl(newUrl) {
    currentBaseUrl = newUrl;
    try {
      await AsyncStorage.setItem("bitezy_custom_api_url", newUrl);
    } catch (e) {
      console.warn("Could not save custom API URL:", e);
    }
  },
};

export default API_CONFIG;
