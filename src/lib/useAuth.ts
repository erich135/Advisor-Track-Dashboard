/// <reference types="vite/client" />
import { useState, useCallback } from 'react';

const STORAGE_KEY = 'at_auth';
const CORRECT = import.meta.env.VITE_ACCESS_PIN as string | undefined;

function isUnlocked(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === 'ok';
  } catch {
    return false;
  }
}

export function useAuth() {
  const [authed, setAuthed] = useState(isUnlocked);

  const attempt = useCallback((pin: string): boolean => {
    // Fall back to a default so local dev without .env.local still works.
    const expected = CORRECT?.trim() || 'AdvisorTrack2026';
    if (pin.trim() === expected) {
      sessionStorage.setItem(STORAGE_KEY, 'ok');
      setAuthed(true);
      return true;
    }
    return false;
  }, []);

  const signOut = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setAuthed(false);
  }, []);

  return { authed, attempt, signOut };
}
