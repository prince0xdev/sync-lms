import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@umami/react-zen';
import { useI18n } from '../lib/useI18n';
import type { Locale } from '../lib/locale';

export default function LangSwitcher() {
    const { locale, setLocale, t } = useI18n();
    const navigate = useNavigate();
    const location = useLocation();

    function selectLocale(nextLocale: Locale) {
        setLocale(nextLocale);
        const segments = location.pathname.split('/');
        if (segments.length > 1 && (segments[1] === 'fr' || segments[1] === 'en')) segments[1] = nextLocale;
        else segments.splice(1, 0, nextLocale);
        navigate(`${segments.join('/')}${location.search}${location.hash}`);
    }

    return (
        <div style={{ display: 'flex', gap: 8 }} aria-label={t('language')}>
            <Button type="button" onClick={() => selectLocale('fr')} aria-pressed={locale === 'fr'}>FR</Button>
            <Button type="button" onClick={() => selectLocale('en')} aria-pressed={locale === 'en'}>EN</Button>
        </div>
    );
}
