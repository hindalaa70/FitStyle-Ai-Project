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
  {
    id: "top_blazer",
    name: "Classic Silk-Blend Blazer",
    category: "Top",
    occasion: "Formal",
    occasions: ["Formal", "Interview"], // internal backward compatibility
    sizes: ["S", "M", "L", "XL"],
    price: 129.50,
    imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&auto=format&fit=crop&q=60",
    shapes: ["Hourglass", "Rectangle", "Inverted Triangle", "Pear", "Apple"]
  },
  {
    id: "top_blouse",
    name: "Elegance Ruffle Chiffon Blouse",
    category: "Top",
    occasion: "Party",
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
    occasion: "Casual",
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
    occasion: "Casual",
    occasions: ["Casual"],
    sizes: ["XS", "S", "M", "L", "XL"],
    price: 28.00,
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60",
    shapes: ["Rectangle", "Pear", "Apple", "Hourglass", "Inverted Triangle"]
  },
  {
    id: "bottom_trouser",
    name: "High-Waist Tailored Trousers",
    category: "Bottom",
    occasion: "Interview",
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
    occasion: "Wedding",
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
    occasion: "Casual",
    occasions: ["Casual"],
    sizes: ["XS", "S", "M", "L", "XL"],
    price: 75.00,
    imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&auto=format&fit=crop&q=60",
    shapes: ["Hourglass", "Rectangle", "Apple", "Pear"]
  },
  {
    id: "foot_stiletto",
    name: "Classic Suede D'Orsay Pumps",
    category: "Footwear",
    occasion: "Formal",
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
    occasion: "Casual",
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
    occasion: "Interview",
    occasions: ["Formal", "Interview", "Casual"],
    sizes: ["37", "38", "39", "40", "41", "42"],
    price: 120.00,
    imageUrl: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=500&auto=format&fit=crop&q=60",
    shapes: ["Hourglass", "Pear", "Apple", "Rectangle", "Inverted Triangle"]
  },
  {
    id: "acc_handbag",
    name: "Structured Leather Tote Bag",
    category: "Accessory",
    occasion: "Formal",
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
    occasion: "Wedding",
    occasions: ["Party", "Wedding"],
    sizes: ["OS"],
    price: 55.00,
    imageUrl: "https://images.unsplash.com/photo-1566150905458-1bf1fc15a4a5?w=500&auto=format&fit=crop&q=60",
    shapes: ["Hourglass", "Pear", "Apple", "Rectangle", "Inverted Triangle"]
  }
];

// Helper to seed Firestore if empty
export const seedFirestoreIfEmpty = async () => {
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    if (snapshot.empty) {
      console.log('[Firebase Service] Products collection is empty. Seeding seed items...');
      for (const item of SEED_PRODUCTS) {
        const docRef = doc(db, 'products', item.id);
        const { id, ...data } = item;
        // Make sure sizes is stored as array
        await setDoc(docRef, data);
      }
      console.log('[Firebase Service] Firestore seeding successful.');
    }
  } catch (error) {
    console.error('[Firebase Service] Failed to seed Firestore:', error);
  }
};
