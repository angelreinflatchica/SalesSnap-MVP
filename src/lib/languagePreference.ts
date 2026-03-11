export type AppLanguage = "en" | "tl";

export const APP_LANGUAGE_STORAGE_KEY = "salessnap-language";

export function isAppLanguage(value: string | null): value is AppLanguage {
  return value === "en" || value === "tl";
}

export function readSavedAppLanguage() {
  if (typeof window === "undefined") {
    return null;
  }

  const savedLanguage = window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY);
  return isAppLanguage(savedLanguage) ? savedLanguage : null;
}

export function writeSavedAppLanguage(language: AppLanguage) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, language);
}