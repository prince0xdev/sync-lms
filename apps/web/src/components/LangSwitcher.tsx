import { useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { Button } from '@umami/react-zen';

export default function LangSwitcher() {
    const { locale, setLocale } = useI18n();
    const navigate = useNavigate();

    function setAndPush(l: 'en' | 'fr') {
        setLocale(l);
        navigate(`/${l}`);
    }

    return (
        <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={() => setAndPush('en')} style={{ textDecoration: locale === 'en' ? 'underline' : 'none' }}>en</Button>
            <Button onClick={() => setAndPush('fr')} style={{ textDecoration: locale === 'fr' ? 'underline' : 'none' }}>fr</Button>
        </div>
    );
}
