import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import en from "./translations/en.json";
import esMX from "./translations/es-MX.json";

export type Language = "en" | "es-MX";

type TranslationValue = string | { [key: string]: TranslationValue };
type Translations = typeof en;

const translations: Record<Language, Translations> = {
  "en": en,
  "es-MX": esMX,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = "fuel-calculator-language";

function getNestedValue(obj: TranslationValue, keys: string[]): string | undefined {
  let current: TranslationValue = obj;
  for (const key of keys) {
    if (typeof current === "object" && current !== null && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

function detectBrowserLanguage(): Language {
  // Default to Spanish
  return "es-MX";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("es-MX");
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize language from localStorage or browser detection
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored && (stored === "en" || stored === "es-MX")) {
      setLanguageState(stored);
    } else {
      setLanguageState(detectBrowserLanguage());
    }
    setIsHydrated(true);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const t = useCallback((key: string, params?: Record<string, string>): string => {
    const keys = key.split(".");
    const value = getNestedValue(translations[language], keys);

    if (value === undefined) {
      // Fallback to English
      const fallback = getNestedValue(translations["en"], keys);
      if (fallback === undefined) {
        console.warn(`Translation missing for key: ${key}`);
        return key;
      }
      return replaceParams(fallback, params);
    }

    return replaceParams(value, params);
  }, [language]);

  // Prevent hydration mismatch by rendering default until hydrated
  if (!isHydrated) {
    return (
      <LanguageContext.Provider value={{ language: "es-MX", setLanguage, t }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

function replaceParams(text: string, params?: Record<string, string>): string {
  if (!params) return text;
  return Object.entries(params).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, "g"), value),
    text
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return { language: context.language, setLanguage: context.setLanguage };
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return { t: context.t, language: context.language };
}
