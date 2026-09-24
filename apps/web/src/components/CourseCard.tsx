import { Link } from 'react-router-dom';
import { useI18n } from '../lib/useI18n';
import type { CourseSummary } from '../features/courses/types';

export default function CourseCard({ course }: { course: CourseSummary }) {
    const { locale, t } = useI18n();
    return (
        <article className="course-card">
            <div className="course-card-art" aria-hidden="true" />
            <p className="course-meta">{t(`level_${course.level}`)} · {course.language.toUpperCase()}</p>
            <h2>{course.title}</h2>
            <p>{course.description}</p>
            <p className="course-meta">{t('instructor')}: {course.instructor} · {course.module_count} {t('modules_count')}</p>
            {course.audio_languages.length > 0 && <p className="course-meta">{t('audio_languages')}: {course.audio_languages.map((item) => item.toUpperCase()).join(' · ')}</p>}
            <Link className="course-link" to={`/${locale}/courses/${course.slug}`}>{t('view_course')}</Link>
        </article>
    );
}
