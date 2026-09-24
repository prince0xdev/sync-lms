import { useState } from 'react';
import { Badge, Button, TextField } from '@umami/react-zen';
import { Add, ArrowRight2, Book1, People, SearchNormal1, VideoPlay } from 'iconsax-react';
import type { AdminCourse } from '../../features/admin/types';
import { initials } from '../../features/admin/initials';

type Props = { courses: AdminCourse[]; locale: string; isLoading: boolean; error?: string; onEdit: (course: AdminCourse) => void; onCreate: () => void };

export default function AdminCourseGrid({ courses, locale, isLoading, error, onEdit, onCreate }: Props) {
    const [search, setSearch] = useState('');
    const french = locale === 'fr';
    const term = search.trim().toLocaleLowerCase();
    const visibleCourses = courses.filter((course) => !term || `${course.title} ${course.instructor} ${course.slug}`.toLocaleLowerCase().includes(term));
    return <>
        <section className="staff-section-head">
            <div><h2>{french ? 'Vos formations' : 'Your courses'} <Badge className="staff-count">{courses.length}</Badge></h2><p>{french ? 'Parcours prêts à être suivis par vos apprenants.' : 'Learning paths ready for your learners.'}</p></div>
            <label className="staff-search"><SearchNormal1 size={17} /><TextField aria-label={french ? 'Rechercher une formation' : 'Search courses'} value={search} onChange={setSearch} placeholder={french ? 'Rechercher une formation' : 'Search courses'} /></label>
        </section>
        {error && <p className="staff-alert" role="alert">{error}</p>}
        {isLoading && <div className="staff-empty">{french ? 'Chargement des formations…' : 'Loading courses…'}</div>}
        {!isLoading && visibleCourses.length === 0 && <div className="staff-empty"><div className="staff-empty-icon"><Book1 size={26} /></div><h3>{french ? 'Aucune formation pour le moment' : 'No courses yet'}</h3><p>{french ? 'Créez votre premier parcours pour commencer.' : 'Create your first learning path to get started.'}</p><Button variant="primary" className="staff-primary" onClick={onCreate}><Add size={18} />{french ? 'Créer une formation' : 'Create a course'}</Button></div>}
        <section className="staff-course-grid">
            {visibleCourses.map((course) => <article key={course.id} className="staff-course-card">
                <div className="staff-course-top"><span className="staff-course-icon"><Book1 size={21} /></span><Badge className="staff-level">{french ? course.level === 'beginner' ? 'Débutant' : course.level === 'advanced' ? 'Avancé' : 'Intermédiaire' : course.level}</Badge></div>
                <h3>{course.title}</h3><p className="staff-course-description">{course.description}</p>
                <div className="staff-course-teacher"><span className="staff-mini-avatar">{initials(course.instructor, '')}</span>{course.instructor}</div>
                <div className="staff-course-facts"><span><VideoPlay size={16} />{course.module_count} {french ? 'modules' : 'modules'}</span><span><People size={16} />{course.enrollment_count} {french ? 'élèves' : 'learners'}</span></div>
                <div className="staff-course-language-list">{(course.video_languages.length ? course.video_languages : [course.language]).map((language) => <Badge key={language} className="staff-language">{language.toUpperCase()} vidéo</Badge>)}</div>
                <div className="staff-course-footer"><Button variant="outline" className="staff-outline" onClick={() => onEdit(course)}>{french ? 'Gérer le cours' : 'Manage course'}<ArrowRight2 size={16} /></Button></div>
            </article>)}
        </section>
    </>;
}
