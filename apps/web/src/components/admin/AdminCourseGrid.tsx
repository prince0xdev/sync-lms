import { useI18n } from '../../lib/useI18n';
import { useState } from 'react';
import { Badge, Button, TextField } from '@umami/react-zen';
import { Add, ArrowRight2, Book1, People, SearchNormal1, VideoPlay } from 'iconsax-react';
import type { AdminCourse } from '../../features/admin/types';
import { initials } from '../../features/admin/initials';

type Props = { courses: AdminCourse[]; isLoading: boolean; error?: string; onEdit: (course: AdminCourse) => void; onCreate: () => void };

export default function AdminCourseGrid({ courses, isLoading, error, onEdit, onCreate }: Props) {
    const { t } = useI18n();
    const [search, setSearch] = useState('');
    const term = search.trim().toLocaleLowerCase();
    const visibleCourses = courses.filter((course) => !term || `${course.title} ${course.instructor} ${course.slug}`.toLocaleLowerCase().includes(term));
    return <>
        <section className="staff-section-head">
            <div><h2>{t('ui_your_courses_vos_formations')} <Badge className="staff-count">{courses.length}</Badge></h2><p>{t('ui_learning_paths_ready_for_your_learners_parcours_prets_a_etre_suivis_par_vos_appre')}</p></div>
            <label className="staff-search"><SearchNormal1 size={17} color="#d410ab" /><TextField aria-label={t('ui_search_courses_rechercher_une_formation')} value={search} onChange={setSearch} placeholder={t('ui_search_courses_rechercher_une_formation')} /></label>
        </section>
        {error && <p className="staff-alert" role="alert">{error}</p>}
        {isLoading && <div className="staff-empty">{t('ui_loading_courses_chargement_des_formations')}</div>}
        {!isLoading && visibleCourses.length === 0 && <div className="staff-empty"><div className="staff-empty-icon"><Book1 size={26} color="#d410ab" /></div><h3>{t('ui_no_courses_yet_aucune_formation_pour_le_moment')}</h3><p>{t('ui_create_your_first_learning_path_to_get_sta_creez_votre_premier_parcours_pour_commence')}</p><Button variant="primary" className="staff-primary" onClick={onCreate}><Add size={18} color="#d410ab" />{t('ui_create_a_course_creer_une_formation')}</Button></div>}
        <section className="staff-course-grid">
            {visibleCourses.map((course) => <article key={course.id} className="staff-course-card">
                <div className="staff-course-top"><span className="staff-course-icon"><Book1 size={21} color="#d410ab" /></span><Badge className="staff-level">{t(`level_${course.level}`)}</Badge></div>
                <h3>{course.title}</h3><p className="staff-course-description">{course.description}</p>
                <div className="staff-course-teacher"><span className="staff-mini-avatar">{initials(course.instructor, '')}</span>{course.instructor}</div>
                <div className="staff-course-facts"><span><VideoPlay size={16} color="#d410ab" />{course.module_count} {t('ui_modules_modules')}</span><span><People size={16} color="#d410ab" />{course.enrollment_count} {t('ui_learners_eleves')}</span></div>
                <div className="staff-course-language-list">{(course.video_languages.length ? course.video_languages : [course.language]).map((language) => <Badge key={language} className="staff-language">{language.toUpperCase()} vidéo</Badge>)}</div>
                <div className="staff-course-footer"><Button variant="outline" className="staff-outline" onClick={() => onEdit(course)}>{t('ui_manage_course_gerer_le_cours')}<ArrowRight2 size={16} color="#d410ab" /></Button></div>
            </article>)}
        </section>
    </>;
}
