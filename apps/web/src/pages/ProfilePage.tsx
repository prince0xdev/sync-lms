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
import WorkspaceLayout from '../components/dashboard/WorkspaceLayout';

export default function ProfilePage() {
    const { user, accessToken, isLoading, logout } = useAuth();
    const { locale, t } = useI18n();
    const coursesQuery = useQuery({ queryKey: ['dashboard', user?.id, locale], queryFn: () => apiRequest<DashboardResponse>('/me/courses', { locale, accessToken }), enabled: Boolean(user) });

    if (isLoading) return <main className="staff-loading">{t('loading')}</main>;
    if (!user) return <Navigate to={`/${locale}/login`} replace />;
    const courses = coursesQuery.data?.items ?? [];

    return <WorkspaceLayout locale={locale} title={t('ui_learning_space_espace_apprenant')} firstName={user.first_name} lastName={user.last_name} statusLabel={t('ui_workspace_active_espace_actif')} footerLabel={t('ui_learning_space_espace_apprenant')} navigation={<nav className="staff-nav" aria-label={t('ui_learner_navigation_navigation_apprenant')}><Link className="is-active" to={`/${locale}/dashboard`}><Book1 size={17} color="#d410ab" />{t('workspace.my_learning')}</Link><Link to={`/${locale}`}>{t('workspace.catalogue')}</Link></nav>} footerAction={<Link to={`/${locale}`}>{t('workspace.back_to_catalogue')}<ArrowRight2 size={15} color="#d410ab" /></Link>}>

            <section className="staff-page-heading"><div><p className="staff-eyebrow">{t('ui_your_learning_space_votre_espace_apprenant')}</p><h1>{t('ui_welcome_back_bonjour')}<span>, {user.first_name}</span></h1><p>{t('ui_continue_your_courses_and_see_how_far_you_reprenez_vos_cours_et_suivez_le_chemin_par')}</p></div><Button variant="quiet" className="staff-exit learner-logout" onClick={() => void logout()}>{t('ui_sign_out_deconnexion')}</Button></section>
            <LearnerMetrics courses={courses} />
            <section className="learner-courses-section"><div className="staff-section-head"><div><h2>{t('ui_my_courses_mes_formations')} <Badge className="staff-count">{courses.length}</Badge></h2><p>{t('ui_your_learning_paths_and_progress_vos_parcours_et_votre_progression')}</p></div><Link className="learner-catalog-link" to={`/${locale}`}>{t('ui_explore_courses_decouvrir_des_cours')}<ArrowRight2 size={16} color="#d410ab" /></Link></div>
                {coursesQuery.isPending && <div className="staff-empty">{t('ui_loading_your_courses_chargement_de_vos_formations')}</div>}
                {coursesQuery.isError && <p className="staff-alert" role="alert">{coursesQuery.error.message}</p>}
                {!coursesQuery.isPending && courses.length === 0 && <div className="staff-empty"><span className="staff-empty-icon"><Book1 size={25} color="#d410ab" /></span><h3>{t('dashboard_empty')}</h3><p>{t('ui_choose_a_course_from_the_catalogue_to_get_choisissez_un_parcours_dans_le_catalogue_p')}</p><Link className="staff-primary learner-continue" to={`/${locale}`}>{t('ui_browse_courses_explorer_le_catalogue')}<ArrowRight2 size={16} color="#d410ab" /></Link></div>}
                {!coursesQuery.isPending && courses.length > 0 && <div className="staff-course-grid">{courses.map((course) => <LearnerCourseCard key={course.id} course={course} locale={locale} />)}</div>}
            </section>
    </WorkspaceLayout>;

}
