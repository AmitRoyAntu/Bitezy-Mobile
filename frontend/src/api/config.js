import { Platform, NativeModules } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// -------------------------------------------------------------
// Bitezy Mobile Backend API Configuration
// -------------------------------------------------------------

export const DEFAULT_HOST = "[IP_ADDRESS]"; // Mac's current Wi-Fi IP
export const DEFAULT_PORT = 8002;

/**
 * Automatically extracts the Metro host IP from NativeModules.SourceCode.scriptURL
 * Falls back to DEFAULT_HOST when running via tunnel.
 */
const getAutoDetectedHost = () => {
  if (Platform.OS === "web") {
    return "localhost";
  }
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      // Match plain IPv4 addresses only (not tunnel domains like exp.direct)
      const match = scriptURL.match(/^https?:\/\/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
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
