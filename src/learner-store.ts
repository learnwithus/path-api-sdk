import type { LearnerStore, LearnerStoreField, LearnerStoreUpdate, LearnerStoreValue } from "./types.js";

/**
 * Key the learner store response by field key.
 *
 * The API returns an array sorted by the order the course configured. Keying it makes reads
 * symmetric with writes — `learnerStore.notes.value` to read, `{ notes: "…" }` to write —
 * and object key order preserves the configured order for all but all-digit keys.
 */
export function toLearnerStore(fields: LearnerStoreField[]): LearnerStore {
  const learnerStore: LearnerStore = {};
  for (const field of fields) learnerStore[field.key] = field;
  return learnerStore;
}

/**
 * Key the update response by field key, so what you get back has the same shape as what you sent.
 */
export function toLearnerStoreUpdate(entries: Array<{ key: string; value: LearnerStoreValue }>): LearnerStoreUpdate {
  const values: LearnerStoreUpdate = {};
  for (const entry of entries) values[entry.key] = entry.value;
  return values;
}
