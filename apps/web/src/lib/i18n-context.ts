import { createContext } from 'react';
import type { Locale } from './locale';

export type I18nContextType = {
    locale: Locale;
    t: (key: string) => string;
    setLocale: (locale: Locale) => void;
};

export const I18nContext = createContext<I18nContextType>({ locale: 'en', t: (key) => key, setLocale: () => undefined });
