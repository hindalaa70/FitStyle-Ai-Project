# FitStyle AI

FitStyle AI is a luxury, full-stack styling assistant and virtual fitting room platform. Shoppers can upload full-body photos, map skeletal joints, calibrate measurements to classify their body silhouette shape, fetch occasion-specific outfits from Firestore, trigger secure AI virtual try-on, consult personalized Llama-powered style advice, and export their fit summaries to beautifully structured PDF reports.

## 🧠 Architecture Overview

To ensure maximum security and protect private API keys (such as Groq and Replicate tokens), the system is divided into a frontend single-page application and a secure Express backend:

```
                      +-----------------------------+
                      |       React Frontend        |
                      | (Firebase Auth + Firestore) |
                      +--------------+--------------+
                                     |
                                     | (POST /api/tryon, POST /api/style-advice)
                                     v
                      +-----------------------------+
                      |    Express Node.js Server   |
                      |  (Secured API Endpoints)    |
                      +-------+--------------+------+
                              |              |
                (Groq Llama)  |              |  (Replicate IDM-VTON)
                              v              v
                        +-----------+  +-----------+
                        |  Groq API |  | Replicate |
                        +-----------+  +-----------+
```

*   **Frontend (React + Vite + Tailwind CSS)**: Directly handles Firebase Auth and Firestore CRUD syncing (inventory management and user logs), keeping user sessions and catalogs reactive.
*   **Backend (Node.js + Express)**: Holds the private `REPLICATE_API_TOKEN` and `GROQ_API_KEY` in environment variables. All requests for AI virtual try-on and LLM advice are routed through secure Express endpoints (`/api/tryon` and `/api/style-advice`) to prevent key exposure in the browser.

---

## 🔐 Environment Setup

Create a `.env` file in the **root** folder containing the following environment variables (a template is available in `.env.example`):

```env
# Frontend Client-side Firebase Credentials (automatically loaded by Vite)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=fitstyle-ai-b6276.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fitstyle-ai-b6276
VITE_FIREBASE_STORAGE_BUCKET=fitstyle-ai-b6276.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=823192310136
VITE_FIREBASE_APP_ID=1:823192310136:web:f31beb4e42cbe5f2b5b88d

# Backend Server-side Secrets (never compiled into client bundle)
GROQ_API_KEY=your_groq_api_key_here
REPLICATE_API_TOKEN=your_replicate_token_here
PORT=5000
```

---

## 📦 Installation & Setup

Ensure you have [Node.js](https://nodejs.org) (v18+) installed.

### 1. Install Frontend Dependencies
From the workspace root directory:
```bash
npm install
```

### 2. Install Backend Dependencies
From the `server` directory:
```bash
cd server
npm install
```

---

## 🔥 Run Commands

You will need to run the backend server and the frontend client concurrently.

### 1. Start the Express Backend Server
Navigate to the `server` folder and run the server in development mode:
```bash
cd server
npm run dev
```
The server will boot on `http://localhost:5000` and load keys from the parent directory.

### 2. Start the React Frontend App
Navigate to the root directory and run the Vite client:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser. Vite is configured to proxy all `/api/*` traffic automatically to port `5000`.

---

## 🗄️ Firestore Setup Guide

### 1. Enable Firestore Database
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project: **`fitstyle-ai-b6276`**.
3. Under Build, click **Firestore Database** and choose **Create Database**.
4. Set the location and select Start in test mode (or production mode).

### 2. Set Security Rules
Paste the following rules under the Firestore rules tab to secure data limits:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Products: read permitted to authenticated users; write restricted to owners
    match /products/{productId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'owner';
    }

    // Users: read/write permitted only to the matching uid owner
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 3. Collection seeding
On client boot, the system automatically checks if the `products` collection is empty. If it is empty, it will seed 12 high-fidelity clothes items matching different sizes and ocasiions so that you are immediately ready to test product matches.

---

## 🧪 Verification & Features Testing

### Shopper flow
1. **SignUp/Login**: Create a shopper account using any credentials (password min 6 characters).
2. **Scan Landmark points**: Upload a standing full-body photo. MediaPipe Task-Vision triggers automatically to overlay joint dots and skeletal lines on the canvas viewport.
3. **Calibrate**: Adjust the waist, shoulder, and hip sliders. Observe the body shape classification text updating dynamically.
4. **Occasion & Matches**: Select an occasion card (e.g. Wedding). The studio filters the catalogue by size and occasions, auto-selecting coordinated Top, Bottom, Footwear, and Accessories.
5. **AI Try-on**: Click "Try On" on any Top or Bottom card. The server triggers the secure Replicate IDM-VTON model and swaps the canvas viewport image with the processed visual output.
6. **Stylist advice**: Check the AI stylist container. The server-side Llama completion returns coordinated style reasoning.
7. **Report Download**: Click "Download Summary" to render and save a branded styling report PDF locally.

### Admin flow
1. **Register owner**: Create an account with the "Store Owner" role selected.
2. **Dashboard Management**: You will land in the catalogue panel. Use the "Add Garment" drawer to list new products, click the edit buttons to adjust prices, or delete products. Any catalogue modifications sync instantly in the database.
