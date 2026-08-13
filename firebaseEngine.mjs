import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyCLVDsroFfMBFV18DPWTCqukmFv14BGcig",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "krylosmp.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "krylosmp",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "krylosmp.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "638977915888",
  appId: process.env.FIREBASE_APP_ID || "1:638977915888:web:7aea195ab685d815623b35",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-SRVY3Q5MMJ"
};

let app = null;
let db = null;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('[Firebase Engine] ✅ Initialized Firebase Firestore for project: krylosmp');
} catch (err) {
  console.warn('[Firebase Engine] Failed to initialize Firebase:', err.message);
}

/**
 * Save user verification record to Firebase Cloud Database
 */
export async function saveUserVerification(discordId, data) {
  if (!db) return false;
  try {
    const userRef = doc(db, 'verifiedUsers', discordId);
    await setDoc(userRef, {
      discordId,
      discordTag: data.discordTag || '',
      minecraftUsername: data.minecraftUsername || '',
      verificationCode: data.verificationCode || '',
      verified: data.verified || false,
      balance: data.balance || 0,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Also index by minecraftUsername if present
    if (data.minecraftUsername) {
      const ignRef = doc(db, 'minecraftUsers', data.minecraftUsername.toLowerCase());
      await setDoc(ignRef, {
        discordId,
        minecraftUsername: data.minecraftUsername,
        verificationCode: data.verificationCode || '',
        verified: data.verified || false,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    console.log(`[Firebase Engine] Saved verification record for <@${discordId}> (${data.minecraftUsername || 'Pending'})`);
    return true;
  } catch (err) {
    console.warn('[Firebase Engine] Error saving verification:', err.message);
    return false;
  }
}

/**
 * Get verification record by Discord ID or Minecraft IGN
 */
export async function getUserVerification(idOrIgn) {
  if (!db) return null;
  try {
    // Try Discord ID doc first
    const docRef = doc(db, 'verifiedUsers', idOrIgn);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }

    // Try IGN lookup doc
    const ignRef = doc(db, 'minecraftUsers', idOrIgn.toLowerCase());
    const ignSnap = await getDoc(ignRef);
    if (ignSnap.exists()) {
      const dId = ignSnap.data().discordId;
      if (dId) return await getUserVerification(dId);
    }
  } catch (err) {
    console.warn('[Firebase Engine] Error reading user verification:', err.message);
  }
  return null;
}

/**
 * Sync local verifiedUsers.json into Firebase
 */
export async function syncLocalJsonToFirebase() {
  if (!db) return;
  try {
    if (fs.existsSync('verifiedUsers.json')) {
      const localData = JSON.parse(fs.readFileSync('verifiedUsers.json', 'utf-8'));
      for (const [discordId, record] of Object.entries(localData)) {
        await saveUserVerification(discordId, record);
      }
      console.log(`[Firebase Engine] Synced ${Object.keys(localData).length} local user records to Firebase Firestore!`);
    }
  } catch (err) {
    console.warn('[Firebase Engine] Error syncing local JSON to Firebase:', err.message);
  }
}

/**
 * Fetch all verified users from Firebase
 */
export async function fetchAllVerifiedUsers() {
  if (!db) return {};
  const result = {};
  try {
    const querySnapshot = await getDocs(collection(db, 'verifiedUsers'));
    querySnapshot.forEach((doc) => {
      result[doc.id] = doc.data();
    });
  } catch (err) {
    console.warn('[Firebase Engine] Error fetching all verified users:', err.message);
  }
  return result;
}

export { db, firebaseConfig };
