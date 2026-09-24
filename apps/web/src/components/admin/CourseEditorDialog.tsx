import { useEffect, useState } from 'react';
import { Badge, Button, FileTrigger, Input, Modal, ModalDescription, ModalTitle, Select, Textarea } from '@umami/react-zen';
import { Add, CloseCircle, Edit2, VideoPlay } from 'iconsax-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../lib/useAuth';
import { useI18n } from '../../lib/useI18n';
import { slugify } from '../../features/admin/slugify';
import type { AdminCourse, AdminModule, CourseDraft, ModuleDraft } from '../../features/admin/types';
import ModuleEditorModal from './ModuleEditorModal';

type Props = {
    course?: AdminCourse;
    locale: string;
    isSavingCourse: boolean;
    courseError?: string;
    isSavingModule: boolean;
    moduleError?: string;
    isUploadingVideo: boolean;
    uploadError?: string;
    notice?: string;
    onSaveCourse: (id: string | undefined, draft: CourseDraft) => Promise<AdminCourse>;
    onSaveModule: (courseId: string, draft: ModuleDraft) => void;
    onUploadVideo: (moduleId: string, file: File, language: string) => void;
    onClose: () => void;
};

const languageOptions = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'pt', label: 'Português' },
    { value: 'de', label: 'Deutsch' },
];

export default function CourseEditorDialog({ course, locale, isSavingCourse, courseError, isSavingModule, moduleError, isUploadingVideo, uploadError, notice, onSaveCourse, onSaveModule, onUploadVideo, onClose }: Props) {
    const { accessToken } = useAuth();
    const { locale: requestLocale } = useI18n();
    const french = locale === 'fr';
    const [courseId, setCourseId] = useState(course?.id ?? '');
    const [draft, setDraft] = useState<CourseDraft>({
        title: course?.title ?? '',
        slug: course?.slug ?? '',
        description: course?.description ?? '',
        instructor: course?.instructor ?? '',
        language: course?.language ?? 'fr',
        level: course?.level ?? 'beginner',
    });
    const [videoLanguage, setVideoLanguage] = useState(course?.language ?? 'fr');
    const [editingModule, setEditingModule] = useState<AdminModule | undefined>();
    const modulesQuery = useQuery({
        queryKey: ['admin', 'modules', courseId],
        queryFn: () => apiRequest<AdminModule[]>(`/admin/courses/${courseId}/modules`, { locale: requestLocale, accessToken }),
        enabled: Boolean(courseId),
    });

    useEffect(() => {
        setCourseId(course?.id ?? '');
        setDraft({
            title: course?.title ?? '',
            slug: course?.slug ?? '',
            description: course?.description ?? '',
            instructor: course?.instructor ?? '',
            language: course?.language ?? 'fr',
            level: course?.level ?? 'beginner',
        });
        setVideoLanguage(course?.language ?? 'fr');
    }, [course]);

    return <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }} className="staff-modal-zen" placement="center">
        <section className="staff-modal">
            <header className="staff-modal-head"><div><p className="staff-eyebrow">{courseId ? french ? 'ÉDITION DE FORMATION' : 'COURSE SETTINGS' : french ? 'NOUVEAU PARCOURS' : 'NEW LEARNING PATH'}</p><ModalTitle>{courseId ? french ? 'Gérer la formation' : 'Manage course' : french ? 'Créer une formation' : 'Create a course'}</ModalTitle><ModalDescription>{french ? 'Un cours, un ensemble de modules, et une vidéo par langue pour chaque module.' : 'One course, one set of modules, and one localized video per module.'}</ModalDescription></div><Button variant="quiet" className="staff-icon-button" onClick={onClose} aria-label={french ? 'Fermer' : 'Close'}><CloseCircle size={22} /></Button></header>
            <form className="staff-form" onSubmit={(event) => {
                event.preventDefault();
                const slug = courseId && draft.title === course?.title ? course.slug : slugify(draft.title);
                void onSaveCourse(courseId || undefined, { ...draft, slug }).then((saved) => setCourseId(saved.id));
            }}>
                <label>{french ? 'Titre' : 'Title'}<Input required maxLength={200} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder={french ? 'Ex. Fondamentaux du design' : 'e.g. Design fundamentals'} /></label>
                <label>{french ? 'Formateur' : 'Instructor'}<Input required maxLength={200} value={draft.instructor} onChange={(event) => setDraft({ ...draft, instructor: event.target.value })} /></label>
                <label className="staff-form-wide">{french ? 'Description' : 'Description'}<Textarea required rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder={french ? 'Présentez le cours et ses objectifs.' : 'Describe the course and its learning goals.'} /></label>
                <label>{french ? 'Langue principale' : 'Primary language'}<Select value={draft.language} items={languageOptions} onChange={(value) => { if (typeof value === 'string') { setDraft({ ...draft, language: value }); if (!modulesQuery.data?.length) setVideoLanguage(value); } }} /></label>
                <label>{french ? 'Niveau' : 'Level'}<Select value={draft.level} items={[{ value: 'beginner', label: french ? 'Débutant' : 'Beginner' }, { value: 'intermediate', label: french ? 'Intermédiaire' : 'Intermediate' }, { value: 'advanced', label: french ? 'Avancé' : 'Advanced' }]} onChange={(value) => { if (typeof value === 'string') setDraft({ ...draft, level: value }); }} /></label>
                <p className="staff-form-hint staff-form-wide">{french ? 'Adresse du cours générée automatiquement :' : 'Course URL generated automatically:'} <code>{slugify(draft.title) || 'course-name'}</code></p>
                <div className="staff-form-actions staff-form-wide"><span className="staff-form-error">{courseError}</span><Button variant="primary" className="staff-primary" type="submit" isDisabled={isSavingCourse || !slugify(draft.title)}>{isSavingCourse ? french ? 'Enregistrement…' : 'Saving…' : courseId ? french ? 'Enregistrer les détails' : 'Save details' : french ? 'Créer le cours' : 'Create course'}</Button></div>
            </form>
            {notice && <p className="staff-success" role="status">{notice}</p>}
            {courseId && <section className="staff-modal-modules">
                <div className="staff-section-head"><div><h3>{french ? 'Modules et langues vidéo' : 'Modules and video languages'}</h3><p>{french ? 'Crée chaque leçon une fois, puis ajoute une vidéo pour chaque langue.' : 'Create each lesson once, then add one video for each language.'}</p></div><Button variant="outline" className="staff-outline" onClick={() => setEditingModule({ id: '', title: '', description: '', position: (modulesQuery.data?.length ?? 0) + 1, duration_seconds: 600, has_video: false, video_languages: [], audio_languages: [] })}><Add size={17} />{french ? 'Ajouter un module' : 'Add module'}</Button></div>
                <div className="staff-language-uploader"><label>{french ? 'Langue de la prochaine vidéo' : 'Language for the next video'}<Select value={videoLanguage} items={languageOptions} onChange={(value) => { if (typeof value === 'string') setVideoLanguage(value); }} /></label><p>{french ? 'La vidéo envoyée remplace celle de la même langue, sans créer un autre cours.' : 'Uploading replaces that language’s video, without creating another course.'}</p></div>
                {modulesQuery.isPending && <p className="staff-empty staff-empty-compact">{french ? 'Chargement des modules…' : 'Loading modules…'}</p>}
                {modulesQuery.isError && <p className="staff-alert" role="alert">{modulesQuery.error.message}</p>}
                {modulesQuery.data?.map((module) => <article className="staff-module-card" key={module.id}>
                    <div className="staff-module-row"><span className="staff-module-number">{String(module.position).padStart(2, '0')}</span><span className="staff-module-title"><strong>{module.title}</strong><small>{Math.ceil(module.duration_seconds / 60)} {french ? 'min' : 'min'} · {module.video_languages.length ? module.video_languages.map((language) => language.toUpperCase()).join(' · ') : french ? 'Aucune vidéo' : 'No video yet'}</small></span><Button variant="quiet" className="staff-icon-button" aria-label={french ? 'Modifier le module' : 'Edit module'} onClick={() => setEditingModule(module)}><Edit2 size={17} /></Button></div>
                    <div className="staff-media-controls"><FileTrigger acceptedFileTypes={['video/*']} onSelect={(files) => { const file = files?.item(0); if (file) onUploadVideo(module.id, file, videoLanguage); }}><Button variant="outline" className="staff-outline" isDisabled={isUploadingVideo}><VideoPlay size={16} />{isUploadingVideo ? french ? 'Envoi…' : 'Uploading…' : `${french ? 'Ajouter' : 'Add'} ${videoLanguage.toUpperCase()}`}</Button></FileTrigger><div className="staff-track-badges">{module.video_languages.map((language) => <Badge key={language} className="staff-language">{language.toUpperCase()} · {french ? 'vidéo' : 'video'}</Badge>)}</div></div>
                </article>)}
                {!modulesQuery.isPending && modulesQuery.data?.length === 0 && <p className="staff-empty staff-empty-compact">{french ? 'Ajoute le premier module à ce cours.' : 'Add the first module to this course.'}</p>}
                {uploadError && <p className="staff-alert" role="alert">{uploadError}</p>}
            </section>}
        </section>
        {editingModule && <ModuleEditorModal key={editingModule.id || 'new'} module={editingModule.id ? editingModule : undefined} position={editingModule.position} locale={locale} isSaving={isSavingModule} error={moduleError} onClose={() => setEditingModule(undefined)} onSave={(moduleDraft) => { onSaveModule(courseId, moduleDraft); setEditingModule(undefined); }} />}
    </Modal>;
}
