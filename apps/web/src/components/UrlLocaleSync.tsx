import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '../lib/useI18n';
import { getPreferredLocale } from '../lib/locale';

export default function UrlLocaleSync() {
    const { lng } = useParams();
    const { setLocale } = useI18n();
    const navigate = useNavigate();

    useEffect(() => {
        if (lng === 'en' || lng === 'fr') {
            setLocale(lng);
            return;
        }
        navigate(`/${getPreferredLocale()}`, { replace: true });
    }, [lng, navigate, setLocale]);

    return null;
}
