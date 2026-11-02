import { v4 as uuidv4 } from "uuid";
import admin from "firebase-admin";

/**
 * Small shared utilities used across modules.
 */
export const pick = (obj, keys) => {
  const out = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out;
};

export const omit = (obj, keys) => {
  const out = { ...obj };
  for (const k of keys) delete out[k];
  return out;
};

export const slugify = (str) =>
  String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const generateId = () => uuidv4();

export const serverTimestamp = () =>
  admin.firestore.FieldValue.serverTimestamp();

export default { pick, omit, slugify, generateId, serverTimestamp };
