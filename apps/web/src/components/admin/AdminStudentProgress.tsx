import { useI18n } from '../../lib/useI18n';
import { ProgressBar } from '@umami/react-zen';
import { CloseCircle, TickCircle } from 'iconsax-react';
import type { StudentProgress } from '../../features/admin/types';

type Props = { progress?: StudentProgress; isLoading: boolean; error?: string; onClose: () => void };

export default function AdminStudentProgress({ progress, isLoading, error, onClose }: Props) {
    const { t } = useI18n();
    return <section className="staff-panel staff-student-detail">
        <div className="staff-section-head"><div><p className="staff-eyebrow">{t('ui_individual_progress_progression_individuelle')}</p><h2>{progress ? `${progress.user.first_name} ${progress.user.last_name}` : t('ui_learner_details_detail_apprenant')}</h2></div><button className="staff-icon-button" aria-label={t('ui_close_details_fermer_le_detail')} onClick={onClose}><CloseCircle size={20} color="#d410ab" /></button></div>
        {isLoading && <p className="staff-empty">{t('ui_loading_progress_chargement_de_la_progression')}</p>}
        {error && <p className="staff-alert" role="alert">{error}</p>}
        {progress?.courses.length === 0 && <p className="staff-empty">{t('ui_this_learner_is_not_enrolled_in_any_course_cet_apprenant_ne_suit_pas_encore_de_format')}</p>}
        {progress?.courses.map((course) => <article className="staff-student-course" key={course.id}>
            <div className="staff-student-course-heading"><span><strong>{course.title}</strong><small>{course.completed_modules}/{course.module_count} {t('ui_modules_completed_modules_termines')}</small></span><strong>{course.progress_percent}%</strong></div>
            <ProgressBar className="staff-progress-component" value={course.progress_percent} max={100} aria-label={`${course.title}: ${course.progress_percent}%`} />
            <div className="staff-module-progress">{course.modules.map((module) => <span key={module.id} className={module.completed ? 'is-complete' : ''}>{module.completed ? <TickCircle size={15} color="#d410ab" /> : <span className="staff-module-dot" />} {module.title}</span>)}</div>
        </article>)}
    </section>;
}
