/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Firebase configuration for AppleBlox
 *
 * HOW TO SET UP (5 minutes):
 *  1. Go to https://console.firebase.google.com and create a new project
 *  2. Click "Add app" → Web → register the app, copy the config below
 *  3. In Firebase Console → Authentication → Sign-in method:
 *       Enable "Email/Password"
 *       Enable "Google" (add your project's support email)
 *  4. In Authentication → Settings → Authorized domains, add "localhost"
 *  5. Paste your config values into the object below
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth'

const firebaseConfig = {
  apiKey:            'AIzaSyDNu3jg-PWD4vPqZwg_6zwAEFYhhgvOP2g',
  authDomain:        'launchframe-815aa.firebaseapp.com',
  projectId:         'launchframe-815aa',
  storageBucket:     'launchframe-815aa.firebasestorage.app',
  messagingSenderId: '108729507228',
  appId:             '1:108729507228:web:f376425f964ae96b2cbc59'
}

const app   = initializeApp(firebaseConfig)
export const auth   = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

export async function signInEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

export async function createAccount(email: string, password: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  return result.user
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}

export function onAuth(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, cb)
}

// ─── Donation state helpers (localStorage per user) ──────────────────────────

export function hasSeenDonationPrompt(uid: string): boolean {
  return localStorage.getItem(`appleblox_donation_seen_${uid}`) === '1'
}

export function markDonationPromptSeen(uid: string): void {
  localStorage.setItem(`appleblox_donation_seen_${uid}`, '1')
}

// ─── Config guard ─────────────────────────────────────────────────────────────

export function isFirebaseConfigured(): boolean {
  return firebaseConfig.apiKey !== 'YOUR_API_KEY'
}
