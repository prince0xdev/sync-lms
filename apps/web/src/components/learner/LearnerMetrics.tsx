import { useI18n } from '../../lib/useI18n';
import { Book1, Clock, TickCircle } from 'iconsax-react';
import type { EnrolledCourse } from '../../features/courses/types';

type Props = { courses: EnrolledCourse[] };
export default function LearnerMetrics({ courses }: Props) {
    const { t } = useI18n();
    const moduleCount = courses.reduce((total, course) => total + course.module_count, 0);
    const completedCount = courses.reduce((total, course) => total + course.completed_modules, 0);
    const averageProgress = courses.length ? Math.round(courses.reduce((total, course) => total + course.progress_percent, 0) / courses.length) : 0;
    return <section className="staff-metrics learner-metrics" aria-label={t('ui_your_statistics_vos_statistiques')}>
        <article className="staff-metric"><span className="staff-metric-icon"><Book1 size={19} color="#d410ab" /></span><span className="staff-metric-label">{t('ui_courses_formations')}</span><strong>{courses.length}</strong><small>{t('ui_courses_enrolled_parcours_suivis')}</small></article>
        <article className="staff-metric"><span className="staff-metric-icon"><TickCircle size={19} color="#d410ab" /></span><span className="staff-metric-label">{t('ui_modules_complete_modules_termines')}</span><strong>{completedCount}</strong><small>{t('ui_of_sur')} {moduleCount} modules</small></article>
        <article className="staff-metric"><span className="staff-metric-icon"><Clock size={19} color="#d410ab" /></span><span className="staff-metric-label">{t('ui_average_progress_progression_moyenne')}</span><strong>{averageProgress}%</strong><small>{t('ui_across_your_courses_sur_tous_vos_cours')}</small></article>
    </section>;
}
