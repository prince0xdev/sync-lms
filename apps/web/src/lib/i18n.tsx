import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import en from '../locales/en.json';
import fr from '../locales/fr.json';

type Locale = 'en' | 'fr';

type I18nContextType = {
    locale: Locale;
    t: (k: string) => string;
    setLocale: (l: Locale) => void;
};

const bundles: Record<Locale, Record<string, string>> = {
    en,
    fr,
};

const defaultLocale: Locale = 'en';

const STORAGE_KEY = 'synclearn_locale';

const I18nContext = createContext<I18nContextType>({
    locale: defaultLocale,
    t: (k: string) => k,
    setLocale: () => { },
});

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === 'en' || stored === 'fr') return stored;
        } catch (e) { }
        const nav = typeof navigator !== 'undefined' ? (navigator.language ?? navigator.languages?.[0]) : 'en';
        return nav && nav.startsWith('fr') ? 'fr' : 'en';
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, locale);
        } catch (e) { }
    }, [locale]);

    const setLocale = useCallback((l: Locale) => {
        setLocaleState(l);
        try {
            localStorage.setItem(STORAGE_KEY, l);
        } catch (e) { }
    }, []);

    const t = (k: string) => bundles[locale][k] ?? k;

    return (
        <I18nContext.Provider value={{ locale, t, setLocale }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    return useContext(I18nContext);
}
