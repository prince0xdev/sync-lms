import { useCallback, useEffect, useState, type ReactNode } from 'react';
import en from '../locales/en.json';
import fr from '../locales/fr.json';
import { I18nContext } from './i18n-context';
import { getInitialLocale } from './locale';

const bundles: Record<'en' | 'fr', Record<string, string>> = { en, fr };
const storageKey = 'synclearn_locale';

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState(getInitialLocale);
    const setLocale = useCallback((nextLocale: 'en' | 'fr') => {
        setLocaleState(nextLocale);
        try {
            window.localStorage.setItem(storageKey, nextLocale);
        } catch {
            return;
        }
    }, []);
    const t = useCallback((key: string) => bundles[locale][key] ?? key, [locale]);

    useEffect(() => {
        document.documentElement.lang = locale;
        try {
            window.localStorage.setItem(storageKey, locale);
        } catch {
            return;
        }
    }, [locale]);

    return <I18nContext.Provider value={{ locale, t, setLocale }}>{children}</I18nContext.Provider>;
}
