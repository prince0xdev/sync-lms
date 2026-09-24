import { Link } from 'react-router-dom';
import LangSwitcher from './LangSwitcher';
import { useI18n } from '../lib/useI18n';
import { useAuth } from '../lib/useAuth';

export default function Header() {
    const { locale, t } = useI18n();
    const { user } = useAuth();
    return (
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0' }}>
            <Link to={`/${locale}`} style={{ fontWeight: 700 }}>SyncLearn</Link>
            <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {user ? <><Link to={`/${locale}/dashboard`}>{t('dashboard_title')}</Link>{user.is_admin && <Link to={`/${locale}/admin`}>Admin</Link>}</> : <>
                    <Link to={`/${locale}/login`}>{t('login')}</Link>
                    <Link to={`/${locale}/register`}>{t('register')}</Link>
                </>}
                <LangSwitcher />
            </nav>
        </header>
    );
}
