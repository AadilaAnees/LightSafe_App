import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { 
  initializeAuth, 
  getAuth, 
  getReactNativePersistence 
} from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBeVNiYpSwXuvarxq8dsBLAz797VHlNENg",
  authDomain: "lightsafe-44a64.firebaseapp.com",
  projectId: "lightsafe-44a64",
  storageBucket: "lightsafe-44a64.firebasestorage.app",
  messagingSenderId: "341171800986",
  appId: "1:341171800986:web:085183b6ead501867f8823",
  measurementId: "G-CT9P0F2ZV9"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);