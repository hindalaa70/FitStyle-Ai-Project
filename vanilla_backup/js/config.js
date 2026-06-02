// js/config.js
// Handles configuration for Firebase and external APIs

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDXI4DaUWJfIw4HVerx4XbD9VhyYUwEpbQ",
  authDomain: "fitstyle-ai-b6276.firebaseapp.com",
  projectId: "fitstyle-ai-b6276",
  storageBucket: "fitstyle-ai-b6276.firebasestorage.app",
  messagingSenderId: "823192310136",
  appId: "1:823192310136:web:f31beb4e42cbe5f2b5b88d",
  measurementId: "G-43QJHYKMPZ"
};

// Retrieve configuration from localStorage, fallback to defaults
function getFirebaseConfig() {
  const stored = localStorage.getItem("fitstyle_firebase_config");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // If stored config has a dummy key, prefer the real default
      if (parsed.apiKey && parsed.apiKey.includes("Dummy")) {
        return DEFAULT_FIREBASE_CONFIG;
      }
      return parsed;
    } catch (e) {
      console.error("Failed to parse stored Firebase config", e);
    }
  }
  return DEFAULT_FIREBASE_CONFIG;
}

function saveFirebaseConfig(config) {
  localStorage.setItem("fitstyle_firebase_config", JSON.stringify(config));
}

// Key Store API for Gemini and FASHN AI API
const KeyStore = {
  getGeminiKey() {
    return localStorage.getItem("fitstyle_gemini_key") || "";
  },
  setGeminiKey(key) {
    localStorage.setItem("fitstyle_gemini_key", key);
  },
  getFashnKey() {
    return localStorage.getItem("fitstyle_fashn_key") || "";
  },
  setFashnKey(key) {
    localStorage.setItem("fitstyle_fashn_key", key);
  },
  isDemoMode() {
    return !this.getGeminiKey();
  }
};

window.FitStyleConfig = {
  getFirebaseConfig,
  saveFirebaseConfig,
  KeyStore,
  storeAddress: "123 Chic Avenue, Fashion District, NY 10001",
  storeName: "FitStyle AI Boutique",
  storeHours: "Mon-Sat: 10:00 AM - 8:00 PM, Sun: 11:00 AM - 6:00 PM",
  storeContact: "+1 (555) 348-7895"
};
