import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";
import { api } from "./apiClient.js";
import { app, config } from "../lib/firebase.js";

function assertPushConfiguration() {
  if (!import.meta.env.VITE_FIREBASE_VAPID_KEY) {
    throw new Error(
      "Add VITE_FIREBASE_VAPID_KEY to the frontend environment to enable browser push.",
    );
  }
  if (typeof window === "undefined" || !("Notification" in window)) {
    throw new Error("This browser does not support push notifications.");
  }
  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser does not support service workers.");
  }
}

async function getMessagingInstance() {
  assertPushConfiguration();
  if (!(await isSupported())) {
    throw new Error("Firebase messaging is not supported in this browser.");
  }
  return getMessaging(app);
}

async function registerMessagingServiceWorker() {
  const search = new URLSearchParams(
    Object.entries(config).filter(([, value]) => Boolean(value)),
  );
  const registration = await navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?${search.toString()}`,
    { scope: "/" },
  );
  await navigator.serviceWorker.ready;
  return registration;
}

export async function requestPushPermissionAndToken() {
  const messaging = await getMessagingInstance();
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Browser notifications are blocked. Allow notifications in your browser settings first."
        : "Browser notification permission was not granted.",
    );
  }
  const serviceWorkerRegistration = await registerMessagingServiceWorker();
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration,
  });
  if (!token) throw new Error("Firebase did not return a push registration token.");
  return token;
}

export async function removePushRegistration() {
  const messaging = await getMessagingInstance();
  const serviceWorkerRegistration = await registerMessagingServiceWorker();
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration,
  });
  if (token) {
    await api.delete("/notifications/devices", { token });
  }
  await deleteToken(messaging);
}

export async function subscribeToForegroundPush(callback) {
  if (!(await isSupported())) return () => {};
  return onMessage(getMessaging(app), callback);
}
