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

export default function CourseEditorDialog({ course, isSavingCourse, courseError, isSavingModule, moduleError, isUploadingVideo, uploadError, notice, onSaveCourse, onSaveModule, onUploadVideo, onClose }: Props) {
    const { accessToken } = useAuth();
    const { locale: requestLocale, t } = useI18n();
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
            <header className="staff-modal-head"><div><p className="staff-eyebrow">{courseId ? t('ui_course_settings_edition_de_formation') : t('ui_new_learning_path_nouveau_parcours')}</p><ModalTitle>{courseId ? t('ui_manage_course_gerer_la_formation') : t('ui_create_a_course_creer_une_formation')}</ModalTitle><ModalDescription>{t('ui_one_course_one_set_of_modules_and_one_loca_un_cours_un_ensemble_de_modules_et_une_vid')}</ModalDescription></div><Button variant="quiet" className="staff-icon-button" onClick={onClose} aria-label={t('ui_close_fermer')}><CloseCircle size={22} color="#d410ab" /></Button></header>
            <form className="staff-form" onSubmit={(event) => {
                event.preventDefault();
                const slug = courseId && draft.title === course?.title ? course.slug : slugify(draft.title);
                void onSaveCourse(courseId || undefined, { ...draft, slug }).then((saved) => setCourseId(saved.id));
            }}>
                <label>{t('ui_title_titre')}<Input required maxLength={200} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder={t('ui_e_g_design_fundamentals_ex_fondamentaux_du_design')} /></label>
                <label>{t('ui_instructor_formateur')}<Input required maxLength={200} value={draft.instructor} onChange={(event) => setDraft({ ...draft, instructor: event.target.value })} /></label>
                <label className="staff-form-wide">{t('ui_description_description')}<Textarea required rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder={t('ui_describe_the_course_and_its_learning_goals_presentez_le_cours_et_ses_objectifs')} /></label>
                <label>{t('ui_primary_language_langue_principale')}<Select value={draft.language} items={languageOptions} onChange={(value) => { if (typeof value === 'string') { setDraft({ ...draft, language: value }); if (!modulesQuery.data?.length) setVideoLanguage(value); } }} /></label>
                <label>{t('ui_level_niveau')}<Select value={draft.level} items={[{ value: 'beginner', label: t('ui_beginner_debutant') }, { value: 'intermediate', label: t('ui_intermediate_intermediaire') }, { value: 'advanced', label: t('ui_advanced_avance') }]} onChange={(value) => { if (typeof value === 'string') setDraft({ ...draft, level: value }); }} /></label>
                <p className="staff-form-hint staff-form-wide">{t('ui_course_url_generated_automatically_adresse_du_cours_generee_automatiquement')} <code>{slugify(draft.title) || 'course-name'}</code></p>
                <div className="staff-form-actions staff-form-wide"><span className="staff-form-error">{courseError}</span><Button variant="primary" className="staff-primary" type="submit" isDisabled={isSavingCourse || !slugify(draft.title)}>{isSavingCourse ? t('ui_saving_enregistrement') : courseId ? t('ui_save_details_enregistrer_les_details') : t('ui_create_course_creer_le_cours')}</Button></div>
            </form>
            {notice && <p className="staff-success" role="status">{notice}</p>}
            {courseId && <section className="staff-modal-modules">
                <div className="staff-section-head"><div><h3>{t('ui_modules_and_video_languages_modules_et_langues_video')}</h3><p>{t('ui_create_each_lesson_once_then_add_one_video_cree_chaque_lecon_une_fois_puis_ajoute_une')}</p></div><Button variant="outline" className="staff-outline" onClick={() => setEditingModule({ id: '', title: '', description: '', position: (modulesQuery.data?.length ?? 0) + 1, duration_seconds: 600, has_video: false, video_languages: [], audio_languages: [] })}><Add size={17} color="#d410ab" />{t('ui_add_module_ajouter_un_module')}</Button></div>
                <div className="staff-language-uploader"><label>{t('ui_language_for_the_next_video_langue_de_la_prochaine_video')}<Select value={videoLanguage} items={languageOptions} onChange={(value) => { if (typeof value === 'string') setVideoLanguage(value); }} /></label><p>{t('ui_uploading_replaces_that_languages_video_wi_la_video_envoyee_remplace_celle_de_la_meme')}</p></div>
                {modulesQuery.isPending && <p className="staff-empty staff-empty-compact">{t('ui_loading_modules_chargement_des_modules')}</p>}
                {modulesQuery.isError && <p className="staff-alert" role="alert">{modulesQuery.error.message}</p>}
                {modulesQuery.data?.map((module) => <article className="staff-module-card" key={module.id}>
                    <div className="staff-module-row"><span className="staff-module-number">{String(module.position).padStart(2, '0')}</span><span className="staff-module-title"><strong>{module.title}</strong><small>{Math.ceil(module.duration_seconds / 60)} {t('ui_min_min')} · {module.video_languages.length ? module.video_languages.map((language) => language.toUpperCase()).join(' · ') : t('ui_no_video_yet_aucune_video')}</small></span><Button variant="quiet" className="staff-icon-button" aria-label={t('ui_edit_module_modifier_le_module')} onClick={() => setEditingModule(module)}><Edit2 size={17} color="#d410ab" /></Button></div>
                    <div className="staff-media-controls"><FileTrigger acceptedFileTypes={['video/*']} onSelect={(files) => { const file = files?.item(0); if (file) onUploadVideo(module.id, file, videoLanguage); }}><Button variant="outline" className="staff-outline" isDisabled={isUploadingVideo}><VideoPlay size={16} color="#d410ab" />{isUploadingVideo ? t('ui_uploading_envoi') : `${t('ui_add_ajouter')} ${videoLanguage.toUpperCase()}`}</Button></FileTrigger><div className="staff-track-badges">{module.video_languages.map((language) => <Badge key={language} className="staff-language">{language.toUpperCase()} · {t('ui_video_video')}</Badge>)}</div></div>
                </article>)}
                {!modulesQuery.isPending && modulesQuery.data?.length === 0 && <p className="staff-empty staff-empty-compact">{t('ui_add_the_first_module_to_this_course_ajoute_le_premier_module_a_ce_cours')}</p>}
                {uploadError && <p className="staff-alert" role="alert">{uploadError}</p>}
            </section>}
        </section>
        {editingModule && <ModuleEditorModal key={editingModule.id || 'new'} module={editingModule.id ? editingModule : undefined} position={editingModule.position} isSaving={isSavingModule} error={moduleError} onClose={() => setEditingModule(undefined)} onSave={(moduleDraft) => { onSaveModule(courseId, moduleDraft); setEditingModule(undefined); }} />}
    </Modal>;
}
