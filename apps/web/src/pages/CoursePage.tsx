import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiRequest, ApiError } from '../lib/api';
import { useAuth } from '../lib/useAuth';
import { useI18n } from '../lib/useI18n';
import type { CourseDetail } from '../features/courses/types';

export default function CoursePage() {
    const { slug = '' } = useParams();
    const { locale, t } = useI18n();
    const { user, accessToken } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const courseQuery = useQuery({
        queryKey: ['courses', 'detail', slug, locale, user?.id],
        queryFn: () => apiRequest<CourseDetail>(`/courses/${encodeURIComponent(slug)}`, { locale, accessToken }),
        enabled: Boolean(slug),
    });
    const enrollment = useMutation({
        mutationFn: () => apiRequest<{ message: string; enrolled: boolean }>(`/courses/${courseQuery.data?.id}/enroll`, { method: 'POST', locale, accessToken }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses', 'detail', slug] }),
    });

    if (courseQuery.isPending) return <p role="status">{t('loading_courses')}</p>;
    if (courseQuery.isError) return <p role="alert">{courseQuery.error instanceof ApiError ? courseQuery.error.message : t('network_error')}</p>;
    const course = courseQuery.data;


    return (
        <main className="course-detail">
            <Link to={`/${locale}`}>{t('back_to_catalog')}</Link>
            <p className="course-meta">{course.language.toUpperCase()} · {t(`level_${course.level}`)}</p>
            <h1>{course.title}</h1>
            <p>{course.description}</p>
            <p>{t('instructor')}: {course.instructor} · {course.module_count} {t('modules_count')}</p>
            {course.video_languages.length > 0 && <p>{t('ui_video_languages_videos_disponibles')}: {course.video_languages.map((item) => item.toUpperCase()).join(' · ')}</p>}{course.audio_languages.length > 0 && <p>{t('audio_languages')}: {course.audio_languages.map((item) => item.toUpperCase()).join(' · ')}</p>}
            <section>
                <h2>{t('course_content')}</h2>
                <ol className="module-list">
                    {course.modules.map((module) => <li key={module.id}>
                        <span><strong>{module.position}. {module.title}</strong><br /><span>{module.description}</span></span>
                        <span>{Math.ceil(module.duration_seconds / 60)} {t('minutes')}</span>
                    </li>)}
                </ol>
            </section>
            {!course.enrolled && <button type="button" onClick={() => { if (!user) navigate(`/${locale}/login`); else enrollment.mutate(); }} disabled={enrollment.isPending}>
                {user ? t('enroll_course') : t('login_to_enroll')}
            </button>}
            {enrollment.isError && <p role="alert">{enrollment.error.message}</p>}
            {enrollment.isSuccess && <p role="status">{enrollment.data.message}</p>}
            {course.enrolled && <section>
                <h2>{t('start_learning')}</h2>
                {course.modules.map((module) => <p key={module.id}>
                    <Link to={`/${locale}/courses/${course.slug}/modules/${module.id}`}>{module.position}. {module.title}</Link>
                    {module.video_languages.length > 0 && <span className="course-meta"> · {t('ui_videos_videos')}: {module.video_languages.map((item) => item.toUpperCase()).join(' / ')}</span>}{module.audio_languages.length > 0 && <span className="course-meta"> · {t('audio_languages')}: {module.audio_languages.map((item) => item.toUpperCase()).join(' / ')}</span>}
                </p>)}
            </section>}
        </main>
    );
}
