import { Badge, Button } from '@umami/react-zen';
import { ArrowRight2, Book1 } from 'iconsax-react';
import { useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import type { DashboardResponse } from '../features/courses/types';
import { apiRequest } from '../lib/api';
import { useAuth } from '../lib/useAuth';
import { useI18n } from '../lib/useI18n';
import LearnerCourseCard from '../components/learner/LearnerCourseCard';
import LearnerMetrics from '../components/learner/LearnerMetrics';

export default function ProfilePage() {
    const { user, accessToken, isLoading, logout } = useAuth();
    const { locale, t } = useI18n();
    const french = locale === 'fr';
    const coursesQuery = useQuery({ queryKey: ['dashboard', user?.id, locale], queryFn: () => apiRequest<DashboardResponse>('/me/courses', { locale, accessToken }), enabled: Boolean(user) });

    if (isLoading) return <main className="staff-loading">{t('loading')}</main>;
    if (!user) return <Navigate to={`/${locale}/login`} replace />;
    const courses = coursesQuery.data?.items ?? [];

    return <div className="staff-shell learner-shell">
        <header className="staff-header">
            <Link to={`/${locale}/dashboard`} className="staff-brand"><span className="staff-brand-mark">S</span><span>SyncLearn<small>LEARNING SPACE</small></span></Link>
            <nav className="staff-nav" aria-label={french ? 'Navigation apprenant' : 'Learner navigation'}><Link className="is-active" to={`/${locale}/dashboard`}><Book1 size={17} />{french ? 'Mes formations' : 'My learning'}</Link><Link to={`/${locale}`}>{french ? 'Catalogue' : 'Course catalogue'}</Link></nav>
            <div className="staff-header-right"><span className="staff-online"><i />{french ? 'Espace actif' : 'Learning space active'}</span><span className="staff-avatar">{`${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()}</span></div>
        </header>
        <main className="staff-content">
            <section className="staff-page-heading"><div><p className="staff-eyebrow">{french ? 'VOTRE ESPACE APPRENANT' : 'YOUR LEARNING SPACE'}</p><h1>{french ? 'Bonjour' : 'Welcome back'}<span>, {user.first_name}</span></h1><p>{french ? 'Reprenez vos cours et suivez le chemin parcouru.' : 'Continue your courses and see how far you have come.'}</p></div><Button variant="quiet" className="staff-exit learner-logout" onClick={() => void logout()}>{french ? 'Déconnexion' : 'Sign out'}</Button></section>
            <LearnerMetrics courses={courses} locale={locale} />
            <section className="learner-courses-section"><div className="staff-section-head"><div><h2>{french ? 'Mes formations' : 'My courses'} <Badge className="staff-count">{courses.length}</Badge></h2><p>{french ? 'Vos parcours et votre progression.' : 'Your learning paths and progress.'}</p></div><Link className="learner-catalog-link" to={`/${locale}`}>{french ? 'Découvrir des cours' : 'Explore courses'}<ArrowRight2 size={16} /></Link></div>
                {coursesQuery.isPending && <div className="staff-empty">{french ? 'Chargement de vos formations…' : 'Loading your courses…'}</div>}
                {coursesQuery.isError && <p className="staff-alert" role="alert">{coursesQuery.error.message}</p>}
                {!coursesQuery.isPending && courses.length === 0 && <div className="staff-empty"><span className="staff-empty-icon"><Book1 size={25} /></span><h3>{t('dashboard_empty')}</h3><p>{french ? 'Choisissez un parcours dans le catalogue pour commencer.' : 'Choose a course from the catalogue to get started.'}</p><Link className="staff-primary learner-continue" to={`/${locale}`}>{french ? 'Explorer le catalogue' : 'Browse courses'}<ArrowRight2 size={16} /></Link></div>}
                {!coursesQuery.isPending && courses.length > 0 && <div className="staff-course-grid">{courses.map((course) => <LearnerCourseCard key={course.id} course={course} locale={locale} />)}</div>}
            </section>
        </main>
        <footer className="staff-footer"><span>SyncLearn · {french ? 'Espace apprenant' : 'Learning space'}</span><Link to={`/${locale}`}>{french ? 'Retour au catalogue' : 'Back to catalogue'}<ArrowRight2 size={15} /></Link></footer>
    </div>;
}
