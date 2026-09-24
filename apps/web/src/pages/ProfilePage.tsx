import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import { useI18n } from '../lib/useI18n';

export default function ProfilePage() {
    const { user, isLoading, logout } = useAuth();
    const { locale, t } = useI18n();

    if (isLoading) return <p>{t('loading')}</p>;
    if (!user) return <Navigate to={`/${locale}/login`} replace />;

    return (
        <main style={{ maxWidth: 720, margin: '56px auto', padding: 24 }}>
            <h1>{t('profile_title')}</h1>
            <p>{t('welcome')}, {user.first_name} {user.last_name}</p>
            <p>{user.email}</p>
            <button type="button" onClick={() => void logout()}>{t('logout')}</button>
        </main>
    );
}
