import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

// Client Firebase credentials from env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Seed Data definition
const SEED_PRODUCTS = [
  // ─── TOPS ───────────────────────────────────────────────
  {
    id: "top_blazer_formal",
    name: "Classic Tailored Blazer",
    category: "Top",
    occasion: "Formal",
    occasions: ["Formal", "Interview"],
    sizes: ["XS", "S", "M", "L", "XL"],
    price: 129.50,
    imageUrl: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=500&auto=format&fit=crop&q=60",
    shapes: ["Hourglass", "Rectangle", "Inverted Triangle", "Pear", "Apple"]
  },
  {
    id: "top_blouse_chiffon",
    name: "Ruffle Chiffon Blouse",
    category: "Top",
    occasion: "Party",
    occasions: ["Party", "Wedding", "Formal"],
    sizes: ["XS", "S", "M", "L"],
    price: 59.99,
    imageUrl: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=500&auto=format&fit=crop&q=60",
    shapes: ["Hourglass", "Pear", "Rectangle", "Apple"]
  },
  {
    id: "top_knit_casual",
    name: "Soft Ribbed Knit Sweater",
    category: "Top",
    occasion: "Casual",
    occasions: ["Casual"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    price: 49.00,
    imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&auto=format&fit=crop&q=60",
    shapes: ["Rectangle", "Apple", "Hourglass", "Inverted Triangle"]
  },
  {
    id: "top_shirt_interview",
    name: "Crisp White Button-Down Shirt",
    category: "Top",
    occasion: "Interview",
    occasions: ["Interview", "Formal"],
    sizes: ["XS", "S", "M", "L", "XL"],
    price: 45.00,
    imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop&q=60",
    shapes: ["Rectangle", "Inverted Triangle", "Hourglass", "Pear"]
  },
  {
    id: "top_camisole_wedding",
    name: "Satin Slip Camisole Top",
    category: "Top",
    occasion: "Wedding",
    occasions: ["Wedding", "Party"],
    sizes: ["XS", "S", "M", "L"],
    price: 38.00,
    imageUrl: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=500&auto=format&fit=crop&q=60",
    shapes: ["Hourglass", "Pear", "Rectangle"]
  },

  // ─── BOTTOMS ─────────────────────────────────────────────
  {
    id: "bottom_trouser_formal",
    name: "High-Waist Tailored Trousers",
    category: "Bottom",
    occasion: "Formal",
    occasions: ["Formal", "Interview"],
    sizes: ["XS", "S", "M", "L", "XL"],
    price: 89.00,
    imageUrl: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=500&auto=format&fit=crop&q=60",
    shapes: ["Hourglass", "Pear", "Inverted Triangle", "Rectangle"]
  },
  {
    id: "bottom_midi_skirt",
    name: "Pleated A-Line Midi Skirt",
    category: "Bottom",
    occasion: "Wedding",
    occasions: ["Wedding", "Party", "Casual"],
    sizes: ["XS", "S", "M", "L"],
    price: 65.00,
    imageUrl: "https://images.unsplash.com/photo-1577900232427-18219b9166a0?w=500&auto=format&fit=crop&q=60",
    shapes: ["Pear", "Hourglass", "Rectangle", "Apple", "Inverted Triangle"]
  },
  {
    id: "bottom_jeans_casual",
    name: "High-Rise Straight Leg Jeans",
    category: "Bottom",
    occasion: "Casual",
    occasions: ["Casual"],
    sizes: ["XS", "S", "M", "L", "XL"],
    price: 75.00,
    imageUrl: "https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=500&auto=format&fit=crop&q=60",
    shapes: ["Hourglass", "Rectangle", "Apple", "Pear"]
  },
  {
    id: "bottom_pencil_skirt",
    name: "Classic Pencil Skirt",
    category: "Bottom",
    occasion: "Interview",
    occasions: ["Interview", "Formal"],
    sizes: ["XS", "S", "M", "L"],
    price: 55.00,
    imageUrl: "https://images.unsplash.com/photo-1605763240000-7e93b172d754?w=500&auto=format&fit=crop&q=60",
    shapes: ["Hourglass", "Rectangle", "Inverted Triangle"]
  },
  {
    id: "bottom_floral_skirt",
    name: "Floral Wrap Maxi Skirt",
    category: "Bottom",
    occasion: "Party",
    occasions: ["Party", "Casual", "Wedding"],
    sizes: ["XS", "S", "M", "L", "XL"],
    price: 60.00,
    imageUrl: "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=500&auto=format&fit=crop&q=60",
    shapes: ["Pear", "Hourglass", "Apple", "Rectangle"]
  },

  // ─── FOOTWEAR ────────────────────────────────────────────
  {
    id: "foot_heels_formal",
    name: "Suede Block Heel Pumps",
    category: "Footwear",
    occasion: "Formal",
    occasions: ["Formal", "Interview", "Wedding", "Party"],
    sizes: ["36", "37", "38", "39", "40", "41"],
    price: 110.00,
    imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&auto=format&fit=crop&q=60",
    shapes: ["Hourglass", "Pear", "Apple", "Rectangle", "Inverted Triangle"]
  },
  {
    id: "foot_sneakers_casual",
    name: "White Canvas Sneakers",
    category: "Footwear",
    occasion: "Casual",
    occasions: ["Casual"],
    sizes: ["36", "37", "38", "39", "40", "41"],
    price: 69.00,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60",
    shapes: ["Hourglass", "Pear", "Apple", "Rectangle", "Inverted Triangle"]
  },
  {
    id: "foot_sandals_party",
    name: "Strappy Heeled Sandals",
    category: "Footwear",
    occasion: "Party",
    occasions: ["Party", "Wedding", "Casual"],
    sizes: ["36", "37", "38", "39", "40"],
    price: 85.00,
    imageUrl: "https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=500&auto=format&fit=crop&q=60",
    shapes: ["Hourglass", "Pear", "Apple", "Rectangle", "Inverted Triangle"]
  },
  {
    id: "foot_loafers_interview",
    name: "Leather Pointed Toe Flats",
    category: "Footwear",
    occasion: "Interview",
    occasions: ["Interview", "Formal", "Casual"],
    sizes: ["36", "37", "38", "39", "40", "41"],
    price: 95.00,
    imageUrl: "https://images.unsplash.com/photo-1581101767113-1677fc2beaa8?w=500&auto=format&fit=crop&q=60",
    shapes: ["Hourglass", "Pear", "Apple", "Rectangle", "Inverted Triangle"]
  },

  // ─── ACCESSORIES ─────────────────────────────────────────
  {
    id: "acc_tote_formal",
    name: "Structured Leather Tote Bag",
    category: "Accessory",
    occasion: "Formal",
    occasions: ["Formal", "Interview", "Casual"],
    sizes: ["OS"],
    price: 145.00,
    imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&auto=format&fit=crop&q=60",
    shapes: ["Hourglass", "Pear", "Apple", "Rectangle", "Inverted Triangle"]
  },
  {
    id: "acc_clutch_party",
    name: "Metallic Chain Clutch",
    category: "Accessory",
    occasion: "Party",
    occasions: ["Party", "Wedding"],
    sizes: ["OS"],
    price: 55.00,
    imageUrl: "https://images.unsplash.com/photo-1566150905458-1bf1fc15a4a5?w=500&auto=format&fit=crop&q=60",
    shapes: ["Hourglass", "Pear", "Apple", "Rectangle", "Inverted Triangle"]
  },
  {
    id: "acc_scarf_casual",
    name: "Silk Printed Neck Scarf",
    category: "Accessory",
    occasion: "Casual",
    occasions: ["Casual", "Party"],
    sizes: ["OS"],
    price: 30.00,
    imageUrl: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=500&auto=format&fit=crop&q=60",
    shapes: ["Hourglass", "Pear", "Apple", "Rectangle", "Inverted Triangle"]
  },
  {
    id: "acc_belt_interview",
    name: "Thin Leather Waist Belt",
    category: "Accessory",
    occasion: "Interview",
    occasions: ["Interview", "Formal", "Casual"],
    sizes: ["OS"],
    price: 35.00,
    imageUrl: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=500&auto=format&fit=crop&q=60",
    shapes: ["Hourglass", "Pear", "Apple", "Rectangle", "Inverted Triangle"]
  },
  {
    id: "acc_necklace_wedding",
    name: "Delicate Pearl Necklace",
    category: "Accessory",
    occasion: "Wedding",
    occasions: ["Wedding", "Formal", "Party"],
    sizes: ["OS"],
    price: 48.00,
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=60",
    shapes: ["Hourglass", "Pear", "Apple", "Rectangle", "Inverted Triangle"]
  }
];

// Helper to seed Firestore if empty
export const seedFirestoreIfEmpty = async () => {
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    const forceReseed = true;

    if (snapshot.empty) {
      console.log('[Firebase Service] Products collection is empty. Seeding seed items...');
    } else if (forceReseed) {
      console.log('[Firebase Service] Reseeding products with updated female-only catalogue...');
    }

    if (snapshot.empty || forceReseed) {
      for (const item of SEED_PRODUCTS) {
        const docRef = doc(db, 'products', item.id);
        const { id, ...data } = item;
        await setDoc(docRef, data);
      }
      console.log('[Firebase Service] Firestore reseed complete.');
    }
  } catch (error) {
    console.error('[Firebase Service] Failed to seed Firestore:', error);
  }
};
