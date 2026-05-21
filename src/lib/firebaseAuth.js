import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  EXPECTED_LOGIN_SHA256,
  FIREBASE_STAFF_EMAIL,
  hashCredential,
} from './auth.js';
import { auth } from './firebase.js';

export function subscribeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Same User ID + password as before (SHA check), then Firebase Auth as admin@gmail.com
 * so existing Firestore isAdmin() rules allow SQM_* collections.
 * Set the Firebase user password to match what you type at login.
 */
export async function staffSignIn(userId, password) {
  const user = String(userId || '').trim().toLowerCase();
  if (user !== 'admin') {
    throw Object.assign(new Error('Invalid user ID or password.'), {
      code: 'auth/invalid-credential',
    });
  }
  const hex = await hashCredential(userId, password);
  if (hex !== EXPECTED_LOGIN_SHA256) {
    throw Object.assign(new Error('Invalid user ID or password.'), {
      code: 'auth/invalid-credential',
    });
  }
  const cred = await signInWithEmailAndPassword(
    auth,
    FIREBASE_STAFF_EMAIL,
    password
  );
  return cred.user;
}

export function firebaseSignOut() {
  return signOut(auth);
}
