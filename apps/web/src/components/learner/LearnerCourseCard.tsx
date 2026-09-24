import { useI18n } from '../../lib/useI18n';
import { Badge, ProgressBar } from '@umami/react-zen';
import { ArrowRight2, Book1, TickCircle } from 'iconsax-react';
import { Link } from 'react-router-dom';
import type { EnrolledCourse } from '../../features/courses/types';

type Props = { course: EnrolledCourse; locale: string };

export default function LearnerCourseCard({ course, locale }: Props) {
    const { t } = useI18n();
    const nextModule = course.modules.find((module) => !module.completed);
    const completed = course.module_count > 0 && !nextModule;
    return <article className="staff-course-card learner-course-card">
        <div className="staff-course-top"><span className="staff-course-icon"><Book1 size={21} color="#d410ab" /></span><Badge className="staff-level">{t(`level_${course.level}`)}</Badge></div>
        <h3>{course.title}</h3><p className="staff-course-description">{t('ui_by_instructor', { instructor: course.instructor })}</p>
        <div className="learner-course-progress"><div className="learner-progress-heading"><span>{t('ui_progress_progression')}</span><strong>{course.progress_percent}%</strong></div><ProgressBar value={course.progress_percent} max={100} aria-label={`${course.progress_percent}%`} className="staff-progress-component" /></div>
        <div className="staff-course-facts"><span><TickCircle size={16} color="#d410ab" />{course.completed_modules}/{course.module_count} {t('ui_modules_complete_modules_termines')}</span></div>
        <div className="staff-course-footer">{nextModule ? <Link className="staff-primary learner-continue" to={`/${locale}/courses/${course.slug}/modules/${nextModule.id}`}>{t('ui_continue_continuer')}<ArrowRight2 size={16} color="#d410ab" /></Link> : completed ? <Badge className="staff-language">{t('ui_course_complete_formation_terminee')}</Badge> : <Link className="staff-outline learner-continue" to={`/${locale}/courses/${course.slug}`}>{t('ui_view_course_voir_la_formation')}<ArrowRight2 size={16} color="#d410ab" /></Link>}<Link className="learner-course-details" to={`/${locale}/courses/${course.slug}`}>{t('ui_details_details')}</Link></div>
    </article>;
}
