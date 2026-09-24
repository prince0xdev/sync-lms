import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@umami/react-zen';
import {
    Add,
    ArrowRight2,
    AudioSquare,
    Book1,
    Chart2,
    CloseCircle,
    Edit2,
    People,
    SearchNormal1,
    TickCircle,
    VideoPlay,
} from 'iconsax-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest, uploadMedia } from '../lib/api';
import { useAuth } from '../lib/useAuth';
import { useI18n } from '../lib/useI18n';

type View = 'overview' | 'courses' | 'students';
type AdminOverview = { course_count: number; user_count: number; enrollment_count: number; module_count: number };
type AdminCourse = {
    id: string; title: string; slug: string; description: string; instructor: string;
    language: string; level: string; created_at: string; module_count: number; enrollment_count: number;
};
type AdminModule = {
    id: string; title: string; description: string; position: number; duration_seconds: number;
    has_video: boolean; audio_languages: string[];
};
type AdminUser = {
    id: string; email: string; first_name: string; last_name: string; is_admin: boolean;
    created_at: string; enrollment_count: number; module_count: number; completed_modules: number; progress_percent: number;
};
type StudentProgress = {
    user: AdminUser;
    courses: Array<{
        id: string; slug: string; title: string; enrolled_at: string; module_count: number;
        completed_modules: number; progress_percent: number;
        modules: Array<{ id: string; title: string; position: number; duration_seconds: number; progress_seconds: number; completed: boolean }>;
    }>;
};
type CourseDraft = Pick<AdminCourse, 'title' | 'slug' | 'description' | 'instructor' | 'language' | 'level'>;
type ModuleDraft = Pick<AdminModule, 'title' | 'description' | 'position' | 'duration_seconds'> & { id?: string };
type SaveCourseInput = { id?: string; payload: CourseDraft };
type SaveModuleInput = { courseId: string; id?: string; payload: ModuleDraft };

const emptyCourse: CourseDraft = { title: '', slug: '', description: '', instructor: '', language: 'fr', level: 'beginner' };
const emptyModule: ModuleDraft = { title: '', description: '', position: 1, duration_seconds: 600 };

function initials(firstName: string, lastName: string) {
    return `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase() || '?';
}

export default function AdminPage() {
    const { user, accessToken, isLoading } = useAuth();
    const { locale } = useI18n();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isFrench = locale === 'fr';
    const tr = (fr: string, en: string) => isFrench ? fr : en;
    const [view, setView] = useState<View>('overview');
    const [courseSearch, setCourseSearch] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [courseModal, setCourseModal] = useState(false);
    const [courseId, setCourseId] = useState('');
    const [courseDraft, setCourseDraft] = useState<CourseDraft>(emptyCourse);
    const [moduleDraft, setModuleDraft] = useState<ModuleDraft | null>(null);
    const [audioLanguage, setAudioLanguage] = useState('fr');
    const [studentId, setStudentId] = useState('');
    const [notice, setNotice] = useState('');

    const overviewQuery = useQuery({
        queryKey: ['admin', 'overview'],
        queryFn: () => apiRequest<AdminOverview>('/admin/overview', { locale, accessToken }),
        enabled: Boolean(user?.is_admin),
    });
    const coursesQuery = useQuery({
        queryKey: ['admin', 'courses'],
        queryFn: () => apiRequest<AdminCourse[]>('/admin/courses', { locale, accessToken }),
        enabled: Boolean(user?.is_admin),
    });
    const studentsQuery = useQuery({
        queryKey: ['admin', 'students', studentSearch],
        queryFn: () => apiRequest<AdminUser[]>(`/admin/users${studentSearch.trim() ? `?search=${encodeURIComponent(studentSearch.trim())}` : ''}`, { locale, accessToken }),
        enabled: Boolean(user?.is_admin),
    });
    const modulesQuery = useQuery({
        queryKey: ['admin', 'modules', courseId],
        queryFn: () => apiRequest<AdminModule[]>(`/admin/courses/${courseId}/modules`, { locale, accessToken }),
        enabled: Boolean(courseModal && courseId),
    });
    const studentProgressQuery = useQuery({
        queryKey: ['admin', 'student-progress', studentId],
        queryFn: () => apiRequest<StudentProgress>(`/admin/users/${studentId}/progress`, { locale, accessToken }),
        enabled: Boolean(studentId),
    });

    const courses = coursesQuery.data ?? [];
    const visibleCourses = useMemo(() => {
        const term = courseSearch.trim().toLocaleLowerCase();
        if (!term) return courses;
        return courses.filter((course) => `${course.title} ${course.instructor} ${course.slug}`.toLocaleLowerCase().includes(term));
    }, [courseSearch, courses]);

    const saveCourse = useMutation({
        mutationFn: ({ id, payload }: SaveCourseInput) => apiRequest<AdminCourse>(
            id ? `/admin/courses/${id}` : '/admin/courses',
            { method: id ? 'PUT' : 'POST', body: payload, locale, accessToken },
        ),
        onSuccess: (course) => {
            setCourseId(course.id);
            setCourseDraft({ title: course.title, slug: course.slug, description: course.description, instructor: course.instructor, language: course.language, level: course.level });
            setNotice(tr('Formation enregistrée.', 'Course saved.'));
            void queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
            void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
        },
    });
    const saveModule = useMutation({
        mutationFn: ({ courseId: selectedCourseId, id, payload }: SaveModuleInput) => {
            const modulePayload = {
                title: payload.title,
                description: payload.description,
                position: payload.position,
                duration_seconds: payload.duration_seconds,
            };
            return apiRequest<AdminModule>(
                id ? `/admin/courses/${selectedCourseId}/modules/${id}` : `/admin/courses/${selectedCourseId}/modules`,
                { method: id ? 'PUT' : 'POST', body: modulePayload, locale, accessToken },
            );
        },
        onSuccess: () => {
            setModuleDraft(null);
            setNotice(tr('Module enregistré.', 'Module saved.'));
            void queryClient.invalidateQueries({ queryKey: ['admin', 'modules', courseId] });
            void queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
            void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
        },
    });
    const uploadVideo = useMutation({
        mutationFn: ({ id, file }: { id: string; file: File }) => uploadMedia(`/admin/modules/${id}/video`, file, { locale, accessToken }),
        onSuccess: () => {
            setNotice(tr('Vidéo ajoutée au module.', 'Video added to module.'));
            void queryClient.invalidateQueries({ queryKey: ['admin', 'modules', courseId] });
        },
    });
    const uploadAudio = useMutation({
        mutationFn: ({ id, file }: { id: string; file: File }) => uploadMedia(`/admin/modules/${id}/audio`, file, { locale, accessToken, language: audioLanguage }),
        onSuccess: () => {
            setNotice(tr('Piste audio enregistrée.', 'Audio track saved.'));
            void queryClient.invalidateQueries({ queryKey: ['admin', 'modules', courseId] });
        },
    });

    function openCourse(course?: AdminCourse) {
        setCourseId(course?.id ?? '');
        setCourseDraft(course ? {
            title: course.title, slug: course.slug, description: course.description,
            instructor: course.instructor, language: course.language, level: course.level,
        } : emptyCourse);
        setModuleDraft(null);
        setNotice('');
        setCourseModal(true);
    }

    function submitCourse(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        saveCourse.mutate({ id: courseId || undefined, payload: courseDraft });
    }

    function submitModule(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!courseId || !moduleDraft) return;
        saveModule.mutate({ courseId, id: moduleDraft.id, payload: moduleDraft });
    }

    function closeCourseModal() {
        setCourseModal(false);
        setModuleDraft(null);
        setNotice('');
    }

    if (isLoading) return <main className="staff-loading">{tr('Chargement…', 'Loading…')}</main>;
    if (!user?.is_admin) return <main className="staff-denied">
        <div className="staff-lock-mark"><Book1 size={24} /></div>
        <h1>{tr('Espace réservé', 'Admin access only')}</h1>
        <p>{tr('Cette page est réservée aux administrateurs.', 'This page is available to administrators only.')}</p>
        <Link to={`/${locale}`}>{tr('Retour au catalogue', 'Back to catalogue')}</Link>
    </main>;

    const overview = overviewQuery.data;
    const errorMessage = overviewQuery.error?.message ?? coursesQuery.error?.message ?? studentsQuery.error?.message;
    const displayDate = new Intl.DateTimeFormat(isFrench ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    const progressLabel = (value: number) => `${Math.max(0, Math.min(100, value))}%`;

    return <div className="staff-shell">
        <header className="staff-header">
            <Link to={`/${locale}/admin`} className="staff-brand"><span className="staff-brand-mark">S</span><span>SyncLearn<small>ADMIN STUDIO</small></span></Link>
            <nav className="staff-nav" aria-label={tr('Navigation admin', 'Admin navigation')}>
                <button className={view === 'overview' ? 'is-active' : ''} onClick={() => { setView('overview'); setStudentId(''); }}>{tr('Vue d’ensemble', 'Overview')}</button>
                <button className={view === 'courses' ? 'is-active' : ''} onClick={() => { setView('courses'); setStudentId(''); }}><Book1 size={17} />{tr('Formations', 'Courses')}</button>
                <button className={view === 'students' ? 'is-active' : ''} onClick={() => { setView('students'); setStudentId(''); }}><People size={17} />{tr('Apprenants', 'Learners')}</button>
            </nav>
            <div className="staff-header-right"><span className="staff-online"><i />{tr('Espace actif', 'Workspace active')}</span><span className="staff-avatar">{initials(user.first_name, user.last_name)}</span></div>
        </header>

        <main className="staff-content">
            {view !== 'students' && <>
                <section className="staff-page-heading">
                    <div><p className="staff-eyebrow">{tr('ESPACE DE GESTION', 'MANAGEMENT WORKSPACE')}</p>
                        <h1>{view === 'overview' ? tr('Bonjour', 'Welcome back') : tr('Vos formations', 'Your courses')}<span>{view === 'overview' ? `, ${user.first_name}` : ''}</span></h1>
                        <p>{view === 'overview' ? tr('Gérez vos contenus et suivez la progression des apprenants.', 'Manage your content and follow learner progress.') : tr('Créez des parcours et organisez leur contenu.', 'Create learning paths and organize their content.')}</p>
                    </div>
                    <Button variant="primary" className="staff-primary" onClick={() => openCourse()}><Add size={18} />{tr('Créer une formation', 'Create a course')}</Button>
                </section>
                {view === 'overview' && <section className="staff-metrics" aria-label={tr('Statistiques', 'Statistics')}>
                    <Metric icon={<Book1 size={19} />} label={tr('Formations', 'Courses')} value={overview?.course_count ?? '—'} detail={tr('dans le catalogue', 'in the catalogue')} />
                    <Metric icon={<People size={19} />} label={tr('Apprenants', 'Learners')} value={overview?.user_count ?? '—'} detail={tr('comptes inscrits', 'registered accounts')} />
                    <Metric icon={<Chart2 size={19} />} label={tr('Inscriptions', 'Enrollments')} value={overview?.enrollment_count ?? '—'} detail={tr('parcours suivis', 'course enrollments')} />
                    <Metric icon={<VideoPlay size={19} />} label={tr('Modules', 'Modules')} value={overview?.module_count ?? '—'} detail={tr('leçons disponibles', 'lessons available')} />
                </section>}
                <section className="staff-section-head">
                    <div><h2>{tr('Vos formations', 'Your courses')} <span className="staff-count">{courses.length}</span></h2><p>{tr('Parcours prêts à être suivis par vos apprenants.', 'Learning paths ready for your learners.')}</p></div>
                    <label className="staff-search"><SearchNormal1 size={17} /><input value={courseSearch} onChange={(event) => setCourseSearch(event.target.value)} placeholder={tr('Rechercher une formation', 'Search courses')} /></label>
                </section>
                {errorMessage && <p className="staff-alert" role="alert">{errorMessage}</p>}
                {coursesQuery.isPending && <div className="staff-empty">{tr('Chargement des formations…', 'Loading courses…')}</div>}
                {!coursesQuery.isPending && visibleCourses.length === 0 && <div className="staff-empty"><div className="staff-empty-icon"><Book1 size={26} /></div><h3>{tr('Aucune formation pour le moment', 'No courses yet')}</h3><p>{tr('Créez votre premier parcours pour commencer.', 'Create your first learning path to get started.')}</p><Button variant="primary" className="staff-primary" onClick={() => openCourse()}><Add size={18} />{tr('Créer une formation', 'Create a course')}</Button></div>}
                <section className="staff-course-grid">
                    {visibleCourses.map((course) => <article key={course.id} className="staff-course-card">
                        <div className="staff-course-top"><span className="staff-course-icon"><Book1 size={21} /></span><span className="staff-level">{tr(course.level === 'beginner' ? 'Débutant' : course.level === 'advanced' ? 'Avancé' : 'Intermédiaire', course.level)}</span></div>
                        <h3>{course.title}</h3><p className="staff-course-description">{course.description}</p>
                        <div className="staff-course-teacher"><span className="staff-mini-avatar">{initials(course.instructor, '')}</span>{course.instructor}</div>
                        <div className="staff-course-facts"><span><VideoPlay size={16} />{course.module_count} {tr('modules', 'modules')}</span><span><People size={16} />{course.enrollment_count} {tr('élèves', 'learners')}</span></div>
                        <div className="staff-course-footer"><span className="staff-language">{course.language.toUpperCase()}</span><Button variant="outline" className="staff-outline" onClick={() => openCourse(course)}>{tr('Gérer le cours', 'Manage course')}<ArrowRight2 size={16} /></Button></div>
                    </article>)}
                </section>
            </>}

            {view === 'students' && <>
                <section className="staff-page-heading"><div><p className="staff-eyebrow">{tr('SUIVI PÉDAGOGIQUE', 'LEARNER SUCCESS')}</p><h1>{tr('Vos apprenants', 'Your learners')}</h1><p>{tr('Consultez les inscriptions et la progression de chaque élève.', 'Review enrollments and each learner’s course progress.')}</p></div><span className="staff-count-large"><People size={19} />{studentsQuery.data?.length ?? '—'} {tr('comptes', 'accounts')}</span></section>
                <section className="staff-panel">
                    <div className="staff-section-head"><div><h2>{tr('Tous les apprenants', 'All learners')}</h2><p>{tr('Sélectionnez une personne pour voir ses formations.', 'Select a learner to view their courses.')}</p></div><label className="staff-search"><SearchNormal1 size={17} /><input value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder={tr('Nom ou adresse e-mail', 'Name or email')} /></label></div>
                    {studentsQuery.isPending && <p className="staff-empty">{tr('Chargement des apprenants…', 'Loading learners…')}</p>}
                    {studentsQuery.isError && <p className="staff-alert" role="alert">{studentsQuery.error.message}</p>}
                    {!studentsQuery.isPending && studentsQuery.data?.length === 0 && <p className="staff-empty">{tr('Aucun apprenant trouvé.', 'No learners found.')}</p>}
                    {studentsQuery.data && studentsQuery.data.length > 0 && <div className="staff-table-wrap"><table className="staff-table"><thead><tr><th>{tr('Apprenant', 'Learner')}</th><th>{tr('Inscrit depuis', 'Joined')}</th><th>{tr('Formations', 'Courses')}</th><th>{tr('Progression', 'Progress')}</th><th>{tr('Rôle', 'Role')}</th><th /></tr></thead><tbody>{studentsQuery.data.map((student) => <tr key={student.id} className={student.id === studentId ? 'selected' : ''}>
                        <td><span className="staff-user-cell"><span className="staff-mini-avatar">{initials(student.first_name, student.last_name)}</span><span><strong>{student.first_name} {student.last_name}</strong><small>{student.email}</small></span></span></td>
                        <td>{displayDate.format(new Date(student.created_at))}</td><td>{student.enrollment_count}</td>
                        <td><span className="staff-progress-cell"><span className="staff-progress-track"><i style={{ width: progressLabel(student.progress_percent) }} /></span>{progressLabel(student.progress_percent)}</span></td>
                        <td><span className={student.is_admin ? 'staff-role is-admin' : 'staff-role'}>{student.is_admin ? tr('Admin', 'Admin') : tr('Apprenant', 'Learner')}</span></td>
                        <td><button className="staff-icon-button" aria-label={tr('Voir la progression', 'View progress')} onClick={() => setStudentId(student.id)}><ArrowRight2 size={19} /></button></td>
                    </tr>)}</tbody></table></div>}
                </section>
                {studentId && <section className="staff-panel staff-student-detail">
                    <div className="staff-section-head"><div><p className="staff-eyebrow">{tr('PROGRESSION INDIVIDUELLE', 'INDIVIDUAL PROGRESS')}</p><h2>{studentProgressQuery.data ? `${studentProgressQuery.data.user.first_name} ${studentProgressQuery.data.user.last_name}` : tr('Détail apprenant', 'Learner details')}</h2></div><button className="staff-icon-button" aria-label={tr('Fermer le détail', 'Close details')} onClick={() => setStudentId('')}><CloseCircle size={20} /></button></div>
                    {studentProgressQuery.isPending && <p className="staff-empty">{tr('Chargement de la progression…', 'Loading progress…')}</p>}
                    {studentProgressQuery.isError && <p className="staff-alert" role="alert">{studentProgressQuery.error.message}</p>}
                    {studentProgressQuery.data?.courses.length === 0 && <p className="staff-empty">{tr('Cet apprenant ne suit pas encore de formation.', 'This learner is not enrolled in any courses yet.')}</p>}
                    {studentProgressQuery.data?.courses.map((course) => <article className="staff-student-course" key={course.id}>
                        <div className="staff-student-course-heading"><span><strong>{course.title}</strong><small>{course.completed_modules}/{course.module_count} {tr('modules terminés', 'modules completed')}</small></span><strong>{progressLabel(course.progress_percent)}</strong></div>
                        <div className="staff-progress-track staff-progress-wide"><i style={{ width: progressLabel(course.progress_percent) }} /></div>
                        <div className="staff-module-progress">{course.modules.map((module) => <span key={module.id} className={module.completed ? 'is-complete' : ''}>{module.completed ? <TickCircle size={15} /> : <span className="staff-module-dot" />} {module.title}</span>)}</div>
                    </article>)}
                </section>}
            </>}
        </main>

        {courseModal && <div className="staff-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeCourseModal(); }}>
            <section className="staff-modal" role="dialog" aria-modal="true" aria-labelledby="course-modal-title">
                <header className="staff-modal-head"><div><p className="staff-eyebrow">{courseId ? tr('ÉDITION DE FORMATION', 'COURSE SETTINGS') : tr('NOUVEAU PARCOURS', 'NEW LEARNING PATH')}</p><h2 id="course-modal-title">{courseId ? tr('Gérer la formation', 'Manage course') : tr('Créer une formation', 'Create a course')}</h2></div><button className="staff-icon-button" onClick={closeCourseModal} aria-label={tr('Fermer', 'Close')}><CloseCircle size={22} /></button></header>
                <form className="staff-form" onSubmit={submitCourse}>
                    <label>{tr('Titre', 'Title')}<input required maxLength={200} value={courseDraft.title} onChange={(event) => setCourseDraft({ ...courseDraft, title: event.target.value })} placeholder={tr('Ex. Les fondamentaux du design', 'e.g. Design fundamentals')} /></label>
                    <label>{tr('Slug', 'Slug')}<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={courseDraft.slug} onChange={(event) => setCourseDraft({ ...courseDraft, slug: event.target.value })} placeholder="fondamentaux-du-design" /><small>{tr('Utilisé dans l’adresse de la formation.', 'Used in the course URL.')}</small></label>
                    <label className="staff-form-wide">{tr('Description', 'Description')}<textarea required rows={3} value={courseDraft.description} onChange={(event) => setCourseDraft({ ...courseDraft, description: event.target.value })} placeholder={tr('Présentez le contenu et les objectifs du parcours.', 'Describe the course content and learning goals.')} /></label>
                    <label>{tr('Formateur', 'Instructor')}<input required maxLength={200} value={courseDraft.instructor} onChange={(event) => setCourseDraft({ ...courseDraft, instructor: event.target.value })} /></label>
                    <label>{tr('Langue', 'Language')}<select value={courseDraft.language} onChange={(event) => setCourseDraft({ ...courseDraft, language: event.target.value })}><option value="fr">Français</option><option value="en">English</option></select></label>
                    <label>{tr('Niveau', 'Level')}<select value={courseDraft.level} onChange={(event) => setCourseDraft({ ...courseDraft, level: event.target.value })}><option value="beginner">{tr('Débutant', 'Beginner')}</option><option value="intermediate">{tr('Intermédiaire', 'Intermediate')}</option><option value="advanced">{tr('Avancé', 'Advanced')}</option></select></label>
                    <div className="staff-form-actions staff-form-wide"><span className="staff-form-error">{saveCourse.isError && saveCourse.error.message}</span><Button variant="primary" className="staff-primary" type="submit" isDisabled={saveCourse.isPending}><Add size={17} />{saveCourse.isPending ? tr('Enregistrement…', 'Saving…') : tr('Enregistrer la formation', 'Save course')}</Button></div>
                </form>
                {notice && <p className="staff-success" role="status">{notice}</p>}
                {courseId && <section className="staff-modal-modules">
                    <div className="staff-section-head"><div><h3>{tr('Modules et médias', 'Modules and media')}</h3><p>{tr('Ajoutez les leçons et leurs fichiers audio/vidéo.', 'Add lessons and their audio/video files.')}</p></div><Button variant="outline" className="staff-outline" onClick={() => setModuleDraft({ ...emptyModule, position: (modulesQuery.data?.length ?? 0) + 1 })}><Add size={17} />{tr('Ajouter un module', 'Add module')}</Button></div>
                    {modulesQuery.isError && <p className="staff-alert" role="alert">{modulesQuery.error.message}</p>}
                    {modulesQuery.data?.map((module) => <article className="staff-module-card" key={module.id}>
                        <div className="staff-module-row"><span className="staff-module-number">{String(module.position).padStart(2, '0')}</span><span className="staff-module-title"><strong>{module.title}</strong><small>{Math.ceil(module.duration_seconds / 60)} {tr('min', 'min')} · {module.has_video ? tr('vidéo ajoutée', 'video added') : tr('sans vidéo', 'no video')} · {module.audio_languages.length ? module.audio_languages.join(', ').toUpperCase() : tr('sans audio doublé', 'no dubbed audio')}</small></span><button className="staff-icon-button" aria-label={tr('Modifier le module', 'Edit module')} onClick={() => setModuleDraft({ id: module.id, title: module.title, description: module.description, position: module.position, duration_seconds: module.duration_seconds })}><Edit2 size={17} /></button></div>
                        <div className="staff-media-controls"><label className="staff-file-button"><VideoPlay size={16} />{uploadVideo.isPending ? tr('Envoi…', 'Uploading…') : tr('Ajouter vidéo', 'Add video')}<input type="file" accept="video/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadVideo.mutate({ id: module.id, file }); event.currentTarget.value = ''; }} /></label><label className="staff-file-button"><AudioSquare size={16} />{tr('Ajouter piste audio', 'Add audio track')}<input type="file" accept="audio/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadAudio.mutate({ id: module.id, file }); event.currentTarget.value = ''; }} /></label><select aria-label={tr('Langue de la piste audio', 'Audio track language')} value={audioLanguage} onChange={(event) => setAudioLanguage(event.target.value)}><option value="fr">FR</option><option value="en">EN</option><option value="es">ES</option></select></div>
                    </article>)}
                    {modulesQuery.data?.length === 0 && <p className="staff-empty staff-empty-compact">{tr('Ajoutez le premier module à cette formation.', 'Add the first module to this course.')}</p>}
                    {(uploadVideo.isError || uploadAudio.isError) && <p className="staff-alert" role="alert">{uploadVideo.error?.message ?? uploadAudio.error?.message}</p>}
                </section>}
            </section>
        </div>}

        {courseModal && moduleDraft && <div className="staff-modal-backdrop staff-module-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModuleDraft(null); }}>
            <section className="staff-modal staff-module-modal" role="dialog" aria-modal="true" aria-labelledby="module-modal-title">
                <header className="staff-modal-head"><div><p className="staff-eyebrow">{tr('CONTENU PÉDAGOGIQUE', 'COURSE CONTENT')}</p><h2 id="module-modal-title">{moduleDraft.id ? tr('Modifier le module', 'Edit module') : tr('Nouveau module', 'New module')}</h2></div><button className="staff-icon-button" onClick={() => setModuleDraft(null)} aria-label={tr('Fermer', 'Close')}><CloseCircle size={22} /></button></header>
                <form className="staff-form" onSubmit={submitModule}>
                    <label>{tr('Titre du module', 'Module title')}<input required maxLength={200} value={moduleDraft.title} onChange={(event) => setModuleDraft({ ...moduleDraft, title: event.target.value })} /></label>
                    <label>{tr('Ordre', 'Position')}<input type="number" required min={1} value={moduleDraft.position} onChange={(event) => setModuleDraft({ ...moduleDraft, position: Number(event.target.value) })} /></label>
                    <label className="staff-form-wide">{tr('Description', 'Description')}<textarea rows={3} value={moduleDraft.description} onChange={(event) => setModuleDraft({ ...moduleDraft, description: event.target.value })} /></label>
                    <label>{tr('Durée (secondes)', 'Duration (seconds)')}<input type="number" min={0} value={moduleDraft.duration_seconds} onChange={(event) => setModuleDraft({ ...moduleDraft, duration_seconds: Number(event.target.value) })} /></label>
                    <div className="staff-form-actions staff-form-wide"><span className="staff-form-error">{saveModule.isError && saveModule.error.message}</span><Button variant="primary" className="staff-primary" type="submit" isDisabled={saveModule.isPending}>{tr('Enregistrer le module', 'Save module')}</Button></div>
                </form>
            </section>
        </div>}
        <div className="staff-footer">{tr('SyncLearn · Espace de gestion', 'SyncLearn · Management workspace')}<Button variant="quiet" className="staff-exit" onClick={() => navigate(`/${locale}`)}>{tr('Retour à la plateforme', 'Back to learning')}<ArrowRight2 size={16} /></Button></div>
    </div>;
}

function Metric({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string | number; detail: string }) {
    return <article className="staff-metric"><span className="staff-metric-icon">{icon}</span><span className="staff-metric-label">{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}
