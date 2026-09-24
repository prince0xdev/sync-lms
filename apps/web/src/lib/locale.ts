export type Locale = 'en' | 'fr';

const storageKey = 'synclearn_locale';

function supportedLocale(value: string | undefined): Locale | undefined {
    const language = value?.toLowerCase().split('-')[0];
    return language === 'fr' || language === 'en' ? language : undefined;
}

export function detectBrowserLocale(): Locale {
    if (typeof navigator === 'undefined') return 'en';
    const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const language of languages) {
        const locale = supportedLocale(language);
        if (locale) return locale;
    }
    return 'en';
}

export function getPreferredLocale(): Locale {
    if (typeof window !== 'undefined') {
        try {
            const saved = supportedLocale(window.localStorage.getItem(storageKey) ?? undefined);
            if (saved) return saved;
        } catch {
            return detectBrowserLocale();
        }
    }
    return detectBrowserLocale();
}

export function getInitialLocale(): Locale {
    if (typeof window !== 'undefined') {
        const pathLocale = supportedLocale(window.location.pathname.split('/')[1]);
        if (pathLocale) return pathLocale;
    }
    return getPreferredLocale();
}
