import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import Header from './components/Header';
import Home from './pages/Home';
import ProfilePage from './pages/ProfilePage';
import CoursePage from './pages/CoursePage';
import ModulePage from './pages/ModulePage';
import UrlLocaleSync from './components/UrlLocaleSync';
import { getPreferredLocale } from './lib/locale';
import AdminPage from './pages/AdminPage';
import { useLocation } from 'react-router-dom';

function LocaleLayout() {
    const location = useLocation();
    const isAdmin = /\/admin(?:\/|$)/.test(location.pathname);
    return (
        <>
            <UrlLocaleSync />
            {isAdmin ? <Outlet /> : <div style={{ maxWidth: 1024, margin: '0 auto', padding: 4 }}><Header /><Outlet /></div>}
        </>
    );
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to={`/${getPreferredLocale()}`} replace />} />
            <Route path="/:lng" element={<LocaleLayout />}>
                <Route index element={<Home />} />
                <Route path="login" element={<AuthForm mode="login" />} />
                <Route path="register" element={<AuthForm mode="register" />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="courses/:slug" element={<CoursePage />} />
                <Route path="courses/:slug/modules/:moduleId" element={<ModulePage />} />
                <Route path="admin/*" element={<AdminPage />} />
            </Route>
            <Route path="*" element={<Navigate to={`/${getPreferredLocale()}`} replace />} />
        </Routes>
    );
}
