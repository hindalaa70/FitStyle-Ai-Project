import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

// ─── HARDCODED ADMIN CREDENTIALS ─── (Change these to your actual credentials)
const ADMIN_EMAIL = 'admin@fitstyle.store';    // ← change to your email
const ADMIN_PASSWORD_HINT = null;               // not stored here — set in Firebase Console

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch role from Firestore
        let role = 'shopper';
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            role = userDoc.data().role || 'shopper';
          } else {
            // Auto-assign 'owner' role only to the hardcoded admin email
            const assignedRole = user.email === ADMIN_EMAIL ? 'owner' : 'shopper';
            await setDoc(userDocRef, {
              email: user.email,
              role: assignedRole,
              createdAt: new Date()
            });
            role = assignedRole;
          }
        } catch (error) {
          console.error('[AuthContext] Error getting user role from Firestore:', error);
          // Local storage fallback for offline/development test robustness
          role = localStorage.getItem(`fitstyle_role_${user.uid}`) || 'shopper';
        }
        
        setCurrentUser(user);
        setUserRole(role);
        // Cache role locally
        localStorage.setItem(`fitstyle_role_${user.uid}`, role);
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      const credentials = await signInWithEmailAndPassword(auth, email, password);
      return credentials.user;
    } catch (error) {
      console.error('[AuthContext] Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Registration handler (writes role to Firestore users collection)
  const register = async (email, password, role) => {
    setLoading(true);
    try {
      const credentials = await createUserWithEmailAndPassword(auth, email, password);
      const user = credentials.user;
      
      // Save user details to Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        email: email,
        role: role,
        createdAt: new Date()
      });
      
      // Cache role locally
      localStorage.setItem(`fitstyle_role_${user.uid}`, role);
      setUserRole(role);
      setCurrentUser(user);
      return user;
    } catch (error) {
      console.error('[AuthContext] Registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out handler
  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('[AuthContext] Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Password reset email handler
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('[AuthContext] Password reset email sent to:', email);
    } catch (error) {
      console.error('[AuthContext] Reset password failed:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userRole,
    loading,
    login,
    register,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
