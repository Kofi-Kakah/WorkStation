import { z } from "zod";

/**
 * Firestore document IDs and Firebase UIDs never contain slashes, control
 * characters, or dot-segments. Rejecting those characters up front prevents
 * path traversal and ambiguous document lookups.
 */
export const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

export function isSafeId(value) {
  return typeof value === "string" && SAFE_ID_PATTERN.test(value);
}

export const idSchema = z
  .string()
  .trim()
  .regex(SAFE_ID_PATTERN, "Invalid identifier");

export default idSchema;
