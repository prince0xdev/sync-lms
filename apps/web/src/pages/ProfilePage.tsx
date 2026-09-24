import { useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import type { DashboardResponse } from '../features/courses/types';
import { apiRequest } from '../lib/api';
import { useAuth } from '../lib/useAuth';
import { useI18n } from '../lib/useI18n';

export default function ProfilePage() {
    const { user, accessToken, isLoading, logout } = useAuth();
    const { locale, t } = useI18n();
    const coursesQuery = useQuery({
        queryKey: ['dashboard', user?.id, locale],
        queryFn: () => apiRequest<DashboardResponse>('/me/courses', { locale, accessToken }),
        enabled: Boolean(user),
    });

    if (isLoading) return <p>{t('loading')}</p>;
    if (!user) return <Navigate to={`/${locale}/login`} replace />;

    return (
        <main className="course-detail">
            <h1>{t('dashboard_title')}</h1>
            <p>{t('welcome')}, {user.first_name} {user.last_name}</p>
            <p>{user.email}</p>
            {coursesQuery.isPending && <p role="status">{t('loading_dashboard')}</p>}
            {coursesQuery.isError && <p role="alert">{coursesQuery.error.message}</p>}
            {coursesQuery.data?.items.length === 0 && <p>{t('dashboard_empty')}</p>}
            {coursesQuery.data?.items.map((course) => {
                const nextModule = course.modules.find((module) => !module.completed);
                return <section className="dashboard-course" key={course.id}>
                    <p className="course-meta">{t(`level_${course.level}`)} · {course.completed_modules}/{course.module_count} {t('completed_modules')}</p>
                    <h2><Link to={`/${locale}/courses/${course.slug}`}>{course.title}</Link></h2>
                    <p>{t('instructor')}: {course.instructor}</p>
                    <div className="progress-track" role="progressbar" aria-label={`${course.title}: ${course.progress_percent}%`} aria-valuenow={course.progress_percent} aria-valuemin={0} aria-valuemax={100}>
                        <span style={{ width: `${course.progress_percent}%` }} />
                    </div>
                    <p className="course-meta">{course.progress_percent}% {t('complete')}</p>
                    {nextModule && <Link className="course-link" to={`/${locale}/courses/${course.slug}/modules/${nextModule.id}`}>{t('continue_learning')}: {nextModule.title}</Link>}
                    {!nextModule && course.module_count > 0 && <p role="status">{t('course_completed')}</p>}
                </section>;
            })}
            <button type="button" onClick={() => void logout()}>{t('logout')}</button>
        </main>
    );
}
