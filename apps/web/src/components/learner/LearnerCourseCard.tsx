import { Badge, ProgressBar } from '@umami/react-zen';
import { ArrowRight2, Book1, TickCircle } from 'iconsax-react';
import { Link } from 'react-router-dom';
import type { EnrolledCourse } from '../../features/courses/types';

type Props = { course: EnrolledCourse; locale: string };

export default function LearnerCourseCard({ course, locale }: Props) {
    const french = locale === 'fr';
    const nextModule = course.modules.find((module) => !module.completed);
    const completed = course.module_count > 0 && !nextModule;
    return <article className="staff-course-card learner-course-card">
        <div className="staff-course-top"><span className="staff-course-icon"><Book1 size={21} /></span><Badge className="staff-level">{french ? course.level === 'beginner' ? 'Débutant' : course.level === 'advanced' ? 'Avancé' : 'Intermédiaire' : course.level}</Badge></div>
        <h3>{course.title}</h3><p className="staff-course-description">{french ? `Par ${course.instructor}` : `By ${course.instructor}`}</p>
        <div className="learner-course-progress"><div className="learner-progress-heading"><span>{french ? 'Progression' : 'Progress'}</span><strong>{course.progress_percent}%</strong></div><ProgressBar value={course.progress_percent} max={100} aria-label={`${course.progress_percent}%`} className="staff-progress-component" /></div>
        <div className="staff-course-facts"><span><TickCircle size={16} />{course.completed_modules}/{course.module_count} {french ? 'modules terminés' : 'modules complete'}</span></div>
        <div className="staff-course-footer">{nextModule ? <Link className="staff-primary learner-continue" to={`/${locale}/courses/${course.slug}/modules/${nextModule.id}`}>{french ? 'Continuer' : 'Continue'}<ArrowRight2 size={16} /></Link> : completed ? <Badge className="staff-language">{french ? 'Formation terminée' : 'Course complete'}</Badge> : <Link className="staff-outline learner-continue" to={`/${locale}/courses/${course.slug}`}>{french ? 'Voir la formation' : 'View course'}<ArrowRight2 size={16} /></Link>}<Link className="learner-course-details" to={`/${locale}/courses/${course.slug}`}>{french ? 'Détails' : 'Details'}</Link></div>
    </article>;
}
