// js/auth.js
// Handles Firebase Authentication and local fallback user states

const AuthService = (() => {
  let isFirebaseAvailable = false;
  let currentUser = null;
  let authCallbacks = [];

  // Check if firebase is loaded and initialized properly
  function initFirebase() {
    try {
      const config = window.FitStyleConfig.getFirebaseConfig();
      const isDummyKey = config.apiKey && config.apiKey.includes("DummyKey");

      if (window.firebase && firebase.apps.length > 0 && !isDummyKey) {
        isFirebaseAvailable = true;
        
        // Listen to Firebase auth changes
        firebase.auth().onAuthStateChanged(async (firebaseUser) => {
          if (firebaseUser) {
            // Retrieve user role from Firestore
            let role = 'shopper';
            try {
              const doc = await firebase.firestore().collection('users').doc(firebaseUser.uid).get();
              if (doc.exists) {
                role = doc.data().role || 'shopper';
              }
            } catch (e) {
              console.warn("Failed to fetch user role from Firestore, defaulting to shopper role", e);
              // Fallback to local cache for role
              role = localStorage.getItem(`fitstyle_role_${firebaseUser.uid}`) || 'shopper';
            }
            
            currentUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: role,
              displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0]
            };
          } else {
            currentUser = null;
          }
          triggerCallbacks();
        });
      } else {
        console.warn("Firebase Authentication is not available. Using local simulation mode.");
        initSimulator();
      }
    } catch (e) {
      console.warn("Firebase Auth Init failed:", e, ". Running in local simulator mode.");
      initSimulator();
    }
  }

  function initSimulator() {
    isFirebaseAvailable = false;
    // Load simulated current user from localStorage
    const savedUser = localStorage.getItem("fitstyle_simulated_user");
    if (savedUser) {
      try {
        currentUser = JSON.parse(savedUser);
      } catch (e) {
        currentUser = null;
      }
    }
    // Async yield to simulate auth check delay
    setTimeout(() => triggerCallbacks(), 100);
  }

  function triggerCallbacks() {
    authCallbacks.forEach(cb => cb(currentUser));
  }

  // API Methods
  function onAuthStateChanged(callback) {
    authCallbacks.push(callback);
    // Initial call
    callback(currentUser);
    return () => {
      authCallbacks = authCallbacks.filter(cb => cb !== callback);
    };
  }

  async function register(email, password, role) {
    if (isFirebaseAvailable) {
      try {
        const credentials = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const user = credentials.user;
        
        // Write role to Firestore
        await firebase.firestore().collection('users').doc(user.uid).set({
          email: email,
          role: role,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Cache role locally in case Firestore reads fail
        localStorage.setItem(`fitstyle_role_${user.uid}`, role);

        currentUser = {
          uid: user.uid,
          email: user.email,
          role: role,
          displayName: email.split('@')[0]
        };
        return currentUser;
      } catch (error) {
        console.warn("Firebase registration failed, falling back to simulator:", error);
        return await registerSimulator(email, password, role);
      }
    } else {
      return await registerSimulator(email, password, role);
    }
  }

  async function registerSimulator(email, password, role) {
    const simulatedUsers = JSON.parse(localStorage.getItem("fitstyle_simulated_users") || "[]");
    if (simulatedUsers.some(u => u.email === email)) {
      throw new Error("Account already exists");
    }
    
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const newUser = {
      uid: "sim_uid_" + Math.random().toString(36).substr(2, 9),
      email: email,
      password: password,
      role: role,
      displayName: email.split('@')[0]
    };

    simulatedUsers.push(newUser);
    localStorage.setItem("fitstyle_simulated_users", JSON.stringify(simulatedUsers));
    
    currentUser = {
      uid: newUser.uid,
      email: newUser.email,
      role: newUser.role,
      displayName: newUser.displayName
    };
    
    localStorage.setItem("fitstyle_simulated_user", JSON.stringify(currentUser));
    triggerCallbacks();
    return currentUser;
  }

  async function login(email, password) {
    if (isFirebaseAvailable) {
      try {
        const credentials = await firebase.auth().signInWithEmailAndPassword(email, password);
        const user = credentials.user;
        
        // Role is handled in the onAuthStateChanged listener, but we query it here as well for speed
        let role = 'shopper';
        try {
          const doc = await firebase.firestore().collection('users').doc(user.uid).get();
          if (doc.exists) {
            role = doc.data().role || 'shopper';
          }
        } catch (e) {
          role = localStorage.getItem(`fitstyle_role_${user.uid}`) || 'shopper';
        }

        currentUser = {
          uid: user.uid,
          email: user.email,
          role: role,
          displayName: user.displayName || email.split('@')[0]
        };
        return currentUser;
      } catch (error) {
        console.warn("Firebase login failed, falling back to simulator:", error);
        return await loginSimulator(email, password);
      }
    } else {
      return await loginSimulator(email, password);
    }
  }

  async function loginSimulator(email, password) {
    const simulatedUsers = JSON.parse(localStorage.getItem("fitstyle_simulated_users") || "[]");
    
    // Default Admin and User accounts for easy testing out-of-the-box
    if (simulatedUsers.length === 0) {
      // Seed default testing accounts
      const defaultUsers = [
        { uid: "sim_owner_1", email: "owner@fitstyle.com", password: "password123", role: "owner", displayName: "Owner" },
        { uid: "sim_shopper_1", email: "shopper@fitstyle.com", password: "password123", role: "shopper", displayName: "Shopper" }
      ];
      localStorage.setItem("fitstyle_simulated_users", JSON.stringify(defaultUsers));
      simulatedUsers.push(...defaultUsers);
    }

    const match = simulatedUsers.find(u => u.email === email && u.password === password);
    if (!match) {
      throw new Error("Invalid email or password");
    }

    currentUser = {
      uid: match.uid,
      email: match.email,
      role: match.role,
      displayName: match.displayName
    };

    localStorage.setItem("fitstyle_simulated_user", JSON.stringify(currentUser));
    triggerCallbacks();
    return currentUser;
  }

  async function logout() {
    if (isFirebaseAvailable) {
      await firebase.auth().signOut();
    } else {
      localStorage.removeItem("fitstyle_simulated_user");
      currentUser = null;
      triggerCallbacks();
    }
  }

  function getCurrentUser() {
    return currentUser;
  }

  function isFirebase() {
    return isFirebaseAvailable;
  }

  return {
    initFirebase,
    onAuthStateChanged,
    register,
    login,
    logout,
    getCurrentUser,
    isFirebase
  };
})();

// Export globally
window.AuthService = AuthService;
