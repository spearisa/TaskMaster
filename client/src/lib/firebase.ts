import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider, signOut, Auth } from "firebase/auth";

// Check if Firebase environment variables are set
const hasValidFirebaseConfig = 
  !!import.meta.env.VITE_FIREBASE_API_KEY && 
  !!import.meta.env.VITE_FIREBASE_PROJECT_ID && 
  !!import.meta.env.VITE_FIREBASE_APP_ID;

// Log configuration status (remove in production)
console.log("Firebase config status:", hasValidFirebaseConfig ? "Complete" : "Missing");

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

// Only initialize Firebase if we have valid configuration
if (hasValidFirebaseConfig) {
  try {
    // Firebase configuration from environment variables
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    
    // Initialize Firebase Authentication
    auth = getAuth(app);
    
    // Google Auth Provider
    googleProvider = new GoogleAuthProvider();
    
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
} else {
  console.warn("Firebase not initialized: Missing required environment variables");
}

// Function to sign in with Google - with error handling
export const signInWithGoogle = async () => {
  if (!auth || !googleProvider) {
    console.error("Firebase auth not initialized");
    throw new Error("Firebase authentication is not configured properly. Please try again later.");
  }
  
  try {
    return await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error("Google sign in error:", error);
    throw error;
  }
};

// Function to sign out - with error handling
export const signOutFirebase = async () => {
  if (!auth) {
    console.error("Firebase auth not initialized");
    return;
  }
  
  try {
    return await signOut(auth);
  } catch (error) {
    console.error("Firebase sign out error:", error);
    throw error;
  }
};

export { auth };