import express from 'express';
import { getAdminAuth } from '../services/firebaseAdmin.js';

const router = express.Router();

const DEMO_ACCOUNTS = [
  { email: 'shopper@fitstyle.demo', role: 'shopper' },
  { email: 'owner@fitstyle.demo',   role: 'owner'   },
];

const DEMO_PASSWORD = 'demo123456';

/**
 * POST /api/create-demo
 * Body: { role: 'shopper' | 'owner' }
 *
 * Uses Firebase Admin SDK to delete + recreate the demo account
 * so that the frontend can always log in with a known password.
 * Returns: { email, password }
 */
router.post('/', async (req, res) => {
  const { role } = req.body;

  if (!role || !['shopper', 'owner'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be "shopper" or "owner".' });
  }

  const adminAuth = getAdminAuth();

  if (!adminAuth) {
    // Admin SDK not configured — tell the client to use the manual fallback
    return res.status(501).json({
      error: 'Firebase Admin SDK is not configured on this server.',
      hint: 'Please delete demo users from Firebase Console and re-click the demo button.',
      consoleUrl: `https://console.firebase.google.com/project/${process.env.VITE_FIREBASE_PROJECT_ID}/authentication/users`,
    });
  }

  const demoAccount = DEMO_ACCOUNTS.find(a => a.role === role);
  const { email } = demoAccount;

  try {
    // Delete existing user if present
    try {
      const existing = await adminAuth.getUserByEmail(email);
      await adminAuth.deleteUser(existing.uid);
      console.log(`[Demo Route] Deleted existing demo user: ${email}`);
    } catch (err) {
      if (err.code !== 'auth/user-not-found') {
        console.warn(`[Demo Route] Could not delete existing user ${email}:`, err.message);
      }
    }

    // Create fresh demo user
    const newUser = await adminAuth.createUser({
      email,
      password: DEMO_PASSWORD,
      emailVerified: true,
      displayName: role === 'owner' ? 'Demo Store Owner' : 'Demo Shopper',
    });

    console.log(`[Demo Route] Created fresh demo user: ${email} (uid: ${newUser.uid})`);

    return res.json({
      email,
      password: DEMO_PASSWORD,
      uid: newUser.uid,
      message: `Demo ${role} account ready.`,
    });
  } catch (err) {
    console.error('[Demo Route] Failed to create demo user:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
