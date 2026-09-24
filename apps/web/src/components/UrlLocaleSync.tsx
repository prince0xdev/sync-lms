import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '../lib/i18n';

export default function UrlLocaleSync() {
    const { lng } = useParams();
    const { setLocale } = useI18n();
    const navigate = useNavigate();

    useEffect(() => {
        if (lng && (lng === 'en' || lng === 'fr')) {
            setLocale(lng);
            return;
        }

        const stored = localStorage.getItem('synclearn_locale');
        const nav = typeof navigator !== 'undefined' ? (navigator.language ?? navigator.languages?.[0]) : 'en';
        const auto = stored === 'en' || stored === 'fr' ? stored : (nav && nav.startsWith('fr') ? 'fr' : 'en');
        navigate(`/${auto}`, { replace: true });
    }, [lng, navigate, setLocale]);

    return null;
}
