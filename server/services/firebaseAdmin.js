import admin from 'firebase-admin';

let adminApp = null;

/**
 * Initialize Firebase Admin SDK.
 * Supports two initialization modes:
 * 1. FIREBASE_SERVICE_ACCOUNT env var (JSON string of service account key)
 * 2. applicationDefault() - works when running on Google Cloud
 */
export const getAdminApp = () => {
  if (adminApp) return adminApp;

  try {
    // Try service account JSON from env var
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      });
      console.log('[FirebaseAdmin] Initialized with service account from env.');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Use file path from env
      adminApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      });
      console.log('[FirebaseAdmin] Initialized with applicationDefault credentials.');
    } else {
      console.warn('[FirebaseAdmin] No admin credentials found. Admin SDK not available.');
      return null;
    }

    return adminApp;
  } catch (err) {
    console.error('[FirebaseAdmin] Failed to initialize:', err.message);
    return null;
  }
};

export const getAdminAuth = () => {
  const app = getAdminApp();
  if (!app) return null;
  return admin.auth(app);
};

export const getAdminFirestore = () => {
  const app = getAdminApp();
  if (!app) return null;
  return admin.firestore(app);
};
