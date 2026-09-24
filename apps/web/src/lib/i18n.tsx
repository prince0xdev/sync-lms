import { useEffect, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { getInitialLocale } from './locale';
import i18next from './i18n-instance';

export function I18nProvider({ children }: { children: ReactNode }) {
    useEffect(() => {
        const syncDocumentLocale = (locale: string) => {
            document.documentElement.lang = locale;
            window.localStorage.setItem('synclearn_locale', locale);
        };
        syncDocumentLocale(i18next.resolvedLanguage ?? getInitialLocale());
        i18next.on('languageChanged', syncDocumentLocale);
        return () => { i18next.off('languageChanged', syncDocumentLocale); };
    }, []);
    return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
}
