import admin from "firebase-admin";
import { generateKeyPairSync } from "node:crypto";
import env from "./env.js";

let firestoreInstance = null;
let authInstance = null;
let storageInstance = null;
let messagingInstance = null;

// Generate a throwaway RSA key so we can build a structurally-valid
// ServiceAccount credential in emulator mode without touching ADC.
// The key is never used for real signing — the emulator ignores it.
let emulatorCert = null;
function getEmulatorCert() {
  if (emulatorCert) return emulatorCert;
  const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 1024,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs1", format: "pem" },
  });
  emulatorCert = {
    projectId: env.firebase.projectId || "workshop-111f1",
    clientEmail: "emulator@workshop-111f1.iam.gserviceaccount.com",
    privateKey,
  };
  return emulatorCert;
}

/**
 * Initialize the Firebase Admin SDK.
 *
 * Supports three modes, in priority order:
 *  1. Emulator mode when FIREBASE_USE_EMULATOR=true (or NODE_ENV=test).
 *  2. Explicit service-account fields from environment variables.
 *  3. GOOGLE_APPLICATION_CREDENTIALS fallback (Application Default Credentials).
 *
 * Credentials are NEVER committed to the repository. They come from the
 * environment at runtime only.
 */
export function initializeFirebase() {
  if (admin.apps.length > 0) {
    return {
      firestore: firestoreInstance,
      auth: authInstance,
      storage: storageInstance,
      messaging: messagingInstance,
    };
  }

  const projectId = env.firebase.projectId || "workshop-111f1";
  const useEmulator =
    process.env.FIREBASE_USE_EMULATOR === "true" ||
    process.env.NODE_ENV === "test";

  if (useEmulator) {
    process.env.FIRESTORE_EMULATOR_HOST =
      process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
    process.env.FIREBASE_AUTH_EMULATOR_HOST =
      process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
    // A structurally-valid credential keeps the Admin SDK from falling back
    // to Application Default Credentials (which cannot detect a project ID
    // on a local dev box). The emulator ignores the actual key material.
    admin.initializeApp({
      credential: admin.credential.cert(getEmulatorCert()),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  } else if (
    env.firebase.projectId &&
    env.firebase.privateKey &&
    env.firebase.clientEmail
  ) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.firebase.projectId,
        clientEmail: env.firebase.clientEmail,
        privateKey: env.firebase.privateKey.replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  } else {
    // Fallback: Application Default Credentials (e.g. Cloud Run service account).
    admin.initializeApp({
      credential: admin.credential.applicationDefault({ projectId }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }

  firestoreInstance = admin.firestore();
  authInstance = admin.auth();
  storageInstance = admin.storage();
  messagingInstance = admin.messaging();

  // Use admin timestamps consistently.
  firestoreInstance.settings({ timestampsInSnapshots: true });

  return {
    firestore: firestoreInstance,
    auth: authInstance,
    storage: storageInstance,
    messaging: messagingInstance,
  };
}

export function getFirestore() {
  if (!firestoreInstance) initializeFirebase();
  return firestoreInstance;
}

export function getAuth() {
  if (!authInstance) initializeFirebase();
  return authInstance;
}

export function getStorage() {
  if (!storageInstance) initializeFirebase();
  return storageInstance;
}

export function getMessaging() {
  if (!messagingInstance) initializeFirebase();
  return messagingInstance;
}

export default {
  initializeFirebase,
  getFirestore,
  getAuth,
  getStorage,
  getMessaging,
};
