import { Platform, NativeModules } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// -------------------------------------------------------------
// Bitezy Mobile Backend API Configuration
// -------------------------------------------------------------
// Auto-detects the development machine's IP address from React Native's
// bundle loader, and falls back to your current local Wi-Fi IP.
// -------------------------------------------------------------

export const DEFAULT_HOST = "192.168.0.101"; // Your current computer Wi-Fi IPv4 address
export const DEFAULT_PORT = 8002;

/**
 * Automatically extracts the Metro host IP from NativeModules.SourceCode.scriptURL
 */
const getAutoDetectedHost = () => {
  if (Platform.OS === "web") {
    return "localhost";
  }
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
      if (match && match[1]) {
        const host = match[1];
        // If loaded over LAN IP (e.g. 192.168.x.x or 10.x.x.x)
        if (host !== "localhost" && host !== "127.0.0.1") {
          return host;
        }
      }
    }
  } catch (e) {
    // fallback
  }
  return DEFAULT_HOST;
};

export const getBaseUrl = () => {
  if (Platform.OS === "web") {
    return `http://localhost:${DEFAULT_PORT}/api`;
  }
  const host = getAutoDetectedHost();
  return `http://${host}:${DEFAULT_PORT}/api`;
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
      const saved = await AsyncStorage.getItem("bitezy_custom_api_url");
      if (saved) {
        currentBaseUrl = saved;
        return currentBaseUrl;
      }
    } catch (e) {
      console.warn("Could not load custom API URL:", e);
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
