import { Book1, Clock, TickCircle } from 'iconsax-react';
import type { EnrolledCourse } from '../../features/courses/types';

type Props = { courses: EnrolledCourse[]; locale: string };
export default function LearnerMetrics({ courses, locale }: Props) {
    const french = locale === 'fr';
    const moduleCount = courses.reduce((total, course) => total + course.module_count, 0);
    const completedCount = courses.reduce((total, course) => total + course.completed_modules, 0);
    const averageProgress = courses.length ? Math.round(courses.reduce((total, course) => total + course.progress_percent, 0) / courses.length) : 0;
    return <section className="staff-metrics learner-metrics" aria-label={french ? 'Vos statistiques' : 'Your statistics'}>
        <article className="staff-metric"><span className="staff-metric-icon"><Book1 size={19} /></span><span className="staff-metric-label">{french ? 'Formations' : 'Courses'}</span><strong>{courses.length}</strong><small>{french ? 'parcours suivis' : 'courses enrolled'}</small></article>
        <article className="staff-metric"><span className="staff-metric-icon"><TickCircle size={19} /></span><span className="staff-metric-label">{french ? 'Modules terminés' : 'Modules complete'}</span><strong>{completedCount}</strong><small>{french ? 'sur' : 'of'} {moduleCount} modules</small></article>
        <article className="staff-metric"><span className="staff-metric-icon"><Clock size={19} /></span><span className="staff-metric-label">{french ? 'Progression moyenne' : 'Average progress'}</span><strong>{averageProgress}%</strong><small>{french ? 'sur tous vos cours' : 'across your courses'}</small></article>
    </section>;
}
