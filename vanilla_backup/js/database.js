// js/database.js
// Handles Firebase Firestore catalog reads/writes and local storage fallbacks

const DatabaseService = (() => {
  let isFirestoreAvailable = false;
  let dbCallbacks = [];
  let cachedProducts = [];

  // Seed Data: 12 high-quality garments with realistic prices, sizes, body shape matches, and Unsplash URLs
  const SEED_CATALOGUE = [
    // --- TOPS ---
    {
      id: "top_blazer",
      name: "Classic Silk-Blend Blazer",
      category: "Top",
      occasions: ["Formal", "Interview"],
      sizes: ["S", "M", "L", "XL"],
      price: 129.50,
      imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&auto=format&fit=crop&q=60",
      shapes: ["Hourglass", "Rectangle", "Inverted Triangle", "Pear", "Apple"]
    },
    {
      id: "top_blouse",
      name: "Elegance Ruffle Chiffon Blouse",
      category: "Top",
      occasions: ["Formal", "Wedding", "Party"],
      sizes: ["XS", "S", "M", "L"],
      price: 59.99,
      imageUrl: "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=500&auto=format&fit=crop&q=60",
      shapes: ["Hourglass", "Pear", "Rectangle", "Apple"]
    },
    {
      id: "top_knitwear",
      name: "Luxury Merino Crewneck Sweater",
      category: "Top",
      occasions: ["Casual"],
      sizes: ["S", "M", "L", "XL", "XXL"],
      price: 79.00,
      imageUrl: "https://images.unsplash.com/photo-1574164904299-3a102b110380?w=500&auto=format&fit=crop&q=60",
      shapes: ["Rectangle", "Apple", "Hourglass", "Inverted Triangle"]
    },
    {
      id: "top_tshirt",
      name: "Premium Slub Cotton Tee",
      category: "Top",
      occasions: ["Casual"],
      sizes: ["XS", "S", "M", "L", "XL"],
      price: 28.00,
      imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60",
      shapes: ["Rectangle", "Pear", "Apple", "Hourglass", "Inverted Triangle"]
    },
    // --- BOTTOMS ---
    {
      id: "bottom_trouser",
      name: "High-Waist Tailored Trousers",
      category: "Bottom",
      occasions: ["Formal", "Interview", "Wedding"],
      sizes: ["S", "M", "L", "XL"],
      price: 89.00,
      imageUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&auto=format&fit=crop&q=60",
      shapes: ["Hourglass", "Pear", "Inverted Triangle", "Rectangle"]
    },
    {
      id: "bottom_skirt",
      name: "Pleated A-Line Midi Skirt",
      category: "Bottom",
      occasions: ["Casual", "Wedding", "Party"],
      sizes: ["XS", "S", "M", "L"],
      price: 65.00,
      imageUrl: "https://images.unsplash.com/photo-1583496661160-fb48862c4a4e?w=500&auto=format&fit=crop&q=60",
      shapes: ["Pear", "Hourglass", "Rectangle", "Apple", "Inverted Triangle"]
    },
    {
      id: "bottom_jean",
      name: "Relaxed Straight-Leg Denim",
      category: "Bottom",
      occasions: ["Casual"],
      sizes: ["XS", "S", "M", "L", "XL"],
      price: 75.00,
      imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&auto=format&fit=crop&q=60",
      shapes: ["Hourglass", "Rectangle", "Apple", "Pear"]
    },
    // --- FOOTWEAR ---
    {
      id: "foot_stiletto",
      name: "Classic Suede D'Orsay Pumps",
      category: "Footwear",
      occasions: ["Formal", "Wedding", "Party", "Interview"],
      sizes: ["36", "37", "38", "39", "40"],
      price: 110.00,
      imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&auto=format&fit=crop&q=60",
      shapes: ["Hourglass", "Pear", "Apple", "Rectangle", "Inverted Triangle"]
    },
    {
      id: "foot_sneaker",
      name: "Minimalist Leather White Sneakers",
      category: "Footwear",
      occasions: ["Casual"],
      sizes: ["36", "37", "38", "39", "40", "41", "42"],
      price: 95.00,
      imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop&q=60",
      shapes: ["Hourglass", "Pear", "Apple", "Rectangle", "Inverted Triangle"]
    },
    {
      id: "foot_loafers",
      name: "Italian Leather Penny Loafers",
      category: "Footwear",
      occasions: ["Formal", "Interview", "Casual"],
      sizes: ["37", "38", "39", "40", "41", "42"],
      price: 120.00,
      imageUrl: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=500&auto=format&fit=crop&q=60",
      shapes: ["Hourglass", "Pear", "Apple", "Rectangle", "Inverted Triangle"]
    },
    // --- ACCESSORIES ---
    {
      id: "acc_handbag",
      name: "Structured Leather Tote Bag",
      category: "Accessory",
      occasions: ["Formal", "Interview", "Casual"],
      sizes: ["OS"],
      price: 145.00,
      imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=60",
      shapes: ["Hourglass", "Pear", "Apple", "Rectangle", "Inverted Triangle"]
    },
    {
      id: "acc_clutch",
      name: "Metallic Envelope Chain Clutch",
      category: "Accessory",
      occasions: ["Party", "Wedding"],
      sizes: ["OS"],
      price: 55.00,
      imageUrl: "https://images.unsplash.com/photo-1566150905458-1bf1fc15a4a5?w=500&auto=format&fit=crop&q=60",
      shapes: ["Hourglass", "Pear", "Apple", "Rectangle", "Inverted Triangle"]
    }
  ];

  // Initialize DB Service
  function initFirestore() {
    try {
      const config = window.FitStyleConfig.getFirebaseConfig();
      const isDummyKey = config.apiKey && config.apiKey.includes("DummyKey");

      if (window.firebase && firebase.apps.length > 0 && !isDummyKey) {
        isFirestoreAvailable = true;
        setupFirestoreListener();
      } else {
        console.warn("Firebase Firestore is not available or dummy key is set. Running in local storage mode.");
        initLocalDb();
      }
    } catch (e) {
      console.warn("Firestore Init failed:", e, ". Running in local storage mode.");
      initLocalDb();
    }
  }

  function initLocalDb() {
    isFirestoreAvailable = false;
    const stored = localStorage.getItem("fitstyle_catalogue");
    if (!stored) {
      localStorage.setItem("fitstyle_catalogue", JSON.stringify(SEED_CATALOGUE));
      cachedProducts = [...SEED_CATALOGUE];
    } else {
      try {
        cachedProducts = JSON.parse(stored);
      } catch (e) {
        cachedProducts = [...SEED_CATALOGUE];
      }
    }
    // Yield initially
    setTimeout(() => triggerCallbacks(), 100);
  }

  function setupFirestoreListener() {
    firebase.firestore().collection("products")
      .onSnapshot(async (snapshot) => {
        if (snapshot.empty) {
          console.log("Firestore catalogue empty. Seeding defaults...");
          await seedFirestoreData();
          return;
        }

        const items = [];
        snapshot.forEach(doc => {
          items.push({ id: doc.id, ...doc.data() });
        });
        cachedProducts = items;
        triggerCallbacks();
      }, (error) => {
        console.error("Firestore onSnapshot error, falling back to local DB", error);
        initLocalDb();
      });
  }

  async function seedFirestoreData() {
    try {
      const batch = firebase.firestore().batch();
      const productsCollection = firebase.firestore().collection("products");
      
      SEED_CATALOGUE.forEach(item => {
        const docRef = productsCollection.doc(item.id);
        const { id, ...data } = item;
        batch.set(docRef, data);
      });
      
      await batch.commit();
      console.log("Firestore successfully seeded with 12 items.");
    } catch (e) {
      console.error("Error seeding Firestore", e);
      // Fail back to local
      initLocalDb();
    }
  }

  function triggerCallbacks() {
    dbCallbacks.forEach(cb => cb(cachedProducts));
  }

  // API Methods
  function subscribeCatalogue(callback) {
    dbCallbacks.push(callback);
    // Send cached immediately
    callback(cachedProducts);
    return () => {
      dbCallbacks = dbCallbacks.filter(cb => cb !== callback);
    };
  }

  async function addProduct(product) {
    const id = "prod_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const newProduct = { ...product, id };

    if (isFirestoreAvailable) {
      try {
        const { id: _, ...data } = newProduct;
        await firebase.firestore().collection("products").doc(id).set(data);
      } catch (e) {
        console.error("Failed to add product to Firestore", e);
        throw e;
      }
    } else {
      cachedProducts.push(newProduct);
      localStorage.setItem("fitstyle_catalogue", JSON.stringify(cachedProducts));
      triggerCallbacks();
    }
    return newProduct;
  }

  async function updateProduct(id, updatedFields) {
    if (isFirestoreAvailable) {
      try {
        await firebase.firestore().collection("products").doc(id).update(updatedFields);
      } catch (e) {
        console.error("Failed to update product in Firestore", e);
        throw e;
      }
    } else {
      const idx = cachedProducts.findIndex(p => p.id === id);
      if (idx !== -1) {
        cachedProducts[idx] = { ...cachedProducts[idx], ...updatedFields };
        localStorage.setItem("fitstyle_catalogue", JSON.stringify(cachedProducts));
        triggerCallbacks();
      } else {
        throw new Error("Product not found");
      }
    }
  }

  async function deleteProduct(id) {
    if (isFirestoreAvailable) {
      try {
        await firebase.firestore().collection("products").doc(id).delete();
      } catch (e) {
        console.error("Failed to delete product from Firestore", e);
        throw e;
      }
    } else {
      cachedProducts = cachedProducts.filter(p => p.id !== id);
      localStorage.setItem("fitstyle_catalogue", JSON.stringify(cachedProducts));
      triggerCallbacks();
    }
  }

  function getProducts() {
    return cachedProducts;
  }

  function isFirestore() {
    return isFirestoreAvailable;
  }

  return {
    initFirestore,
    subscribeCatalogue,
    addProduct,
    updateProduct,
    deleteProduct,
    getProducts,
    isFirestore
  };
})();

// Export globally
window.DatabaseService = DatabaseService;
