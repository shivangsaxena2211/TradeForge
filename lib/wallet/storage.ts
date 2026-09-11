import { KEYSTORE_STORAGE_PREFIX } from "./types";

function getStorageKey(userId: string): string {
  return `${KEYSTORE_STORAGE_PREFIX}${userId}`;
}

export function saveEncryptedKeystore(
  userId: string,
  encryptedJson: string,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getStorageKey(userId), encryptedJson);
}

export function loadEncryptedKeystore(userId: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(getStorageKey(userId));
}

export function removeEncryptedKeystore(userId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getStorageKey(userId));
}

export function hasEncryptedKeystore(userId: string): boolean {
  return loadEncryptedKeystore(userId) !== null;
}
