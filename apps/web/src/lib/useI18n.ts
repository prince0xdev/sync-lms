import { useTranslation } from 'react-i18next';
import type { Locale } from './locale';

export function useI18n() {
    const { t, i18n } = useTranslation();
    const locale = (i18n.resolvedLanguage?.split('-')[0] ?? 'en') as Locale;
    return {
        locale,
        t: (key: string, options?: Record<string, unknown>) => String(t(key, options)),
        setLocale: (nextLocale: Locale) => { void i18n.changeLanguage(nextLocale); },
    };
}
