import { ProgressBar } from '@umami/react-zen';
import { CloseCircle, TickCircle } from 'iconsax-react';
import type { StudentProgress } from '../../features/admin/types';

type Props = { progress?: StudentProgress; isLoading: boolean; error?: string; locale: string; onClose: () => void };

export default function AdminStudentProgress({ progress, isLoading, error, locale, onClose }: Props) {
    const french = locale === 'fr';
    return <section className="staff-panel staff-student-detail">
        <div className="staff-section-head"><div><p className="staff-eyebrow">{french ? 'PROGRESSION INDIVIDUELLE' : 'INDIVIDUAL PROGRESS'}</p><h2>{progress ? `${progress.user.first_name} ${progress.user.last_name}` : french ? 'Détail apprenant' : 'Learner details'}</h2></div><button className="staff-icon-button" aria-label={french ? 'Fermer le détail' : 'Close details'} onClick={onClose}><CloseCircle size={20} /></button></div>
        {isLoading && <p className="staff-empty">{french ? 'Chargement de la progression…' : 'Loading progress…'}</p>}
        {error && <p className="staff-alert" role="alert">{error}</p>}
        {progress?.courses.length === 0 && <p className="staff-empty">{french ? 'Cet apprenant ne suit pas encore de formation.' : 'This learner is not enrolled in any courses yet.'}</p>}
        {progress?.courses.map((course) => <article className="staff-student-course" key={course.id}>
            <div className="staff-student-course-heading"><span><strong>{course.title}</strong><small>{course.completed_modules}/{course.module_count} {french ? 'modules terminés' : 'modules completed'}</small></span><strong>{course.progress_percent}%</strong></div>
            <ProgressBar className="staff-progress-component" value={course.progress_percent} max={100} aria-label={`${course.title}: ${course.progress_percent}%`} />
            <div className="staff-module-progress">{course.modules.map((module) => <span key={module.id} className={module.completed ? 'is-complete' : ''}>{module.completed ? <TickCircle size={15} /> : <span className="staff-module-dot" />} {module.title}</span>)}</div>
        </article>)}
    </section>;
}
