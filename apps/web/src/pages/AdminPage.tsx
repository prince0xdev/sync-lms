import { useState } from 'react';
import { Button } from '@umami/react-zen';
import { ArrowRight2, Book1 } from 'iconsax-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest, uploadMedia } from '../lib/api';
import { useAuth } from '../lib/useAuth';
import { useI18n } from '../lib/useI18n';
import type { AdminCourse, AdminOverview, AdminUser, AdminView, CourseDraft, ModuleDraft, StudentProgress } from '../features/admin/types';
import AdminCourseGrid from '../components/admin/AdminCourseGrid';
import AdminHeader from '../components/admin/AdminHeader';
import WorkspaceLayout from '../components/dashboard/WorkspaceLayout';
import AdminMetrics from '../components/admin/AdminMetrics';
import AdminStudentProgress from '../components/admin/AdminStudentProgress';
import AdminStudentWorkspace from '../components/admin/AdminStudentWorkspace';
import CourseEditorDialog from '../components/admin/CourseEditorDialog';

export default function AdminPage() {
    const { user, accessToken, isLoading } = useAuth();
    const { locale, t } = useI18n();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [view, setView] = useState<AdminView>('overview');
    const [studentSearch, setStudentSearch] = useState('');
    const [studentId, setStudentId] = useState('');
    const [courseId, setCourseId] = useState('');
    const [courseModal, setCourseModal] = useState(false);
    const [notice, setNotice] = useState('');

    const overviewQuery = useQuery({ queryKey: ['admin', 'overview'], queryFn: () => apiRequest<AdminOverview>('/admin/overview', { locale, accessToken }), enabled: Boolean(user?.is_admin) });
    const coursesQuery = useQuery({ queryKey: ['admin', 'courses'], queryFn: () => apiRequest<AdminCourse[]>('/admin/courses', { locale, accessToken }), enabled: Boolean(user?.is_admin) });
    const studentsQuery = useQuery({
        queryKey: ['admin', 'students', studentSearch],
        queryFn: () => apiRequest<AdminUser[]>(`/admin/users${studentSearch.trim() ? `?search=${encodeURIComponent(studentSearch.trim())}` : ''}`, { locale, accessToken }),
        enabled: Boolean(user?.is_admin),
    });
    const studentProgressQuery = useQuery({
        queryKey: ['admin', 'student-progress', studentId],
        queryFn: () => apiRequest<StudentProgress>(`/admin/users/${studentId}/progress`, { locale, accessToken }),
        enabled: Boolean(studentId),
    });
    const saveCourse = useMutation({
        mutationFn: ({ id, draft }: { id?: string; draft: CourseDraft }) => apiRequest<AdminCourse>(id ? `/admin/courses/${id}` : '/admin/courses', { method: id ? 'PUT' : 'POST', body: draft, locale, accessToken }),
        onSuccess: (savedCourse) => {
            setCourseId(savedCourse.id);
            setNotice(t('ui_course_saved_formation_enregistree'));
            void queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
            void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
        },
    });
    const saveModule = useMutation({
        mutationFn: ({ selectedCourseId, draft }: { selectedCourseId: string; draft: ModuleDraft }) => apiRequest(
            draft.id ? `/admin/courses/${selectedCourseId}/modules/${draft.id}` : `/admin/courses/${selectedCourseId}/modules`,
            { method: draft.id ? 'PUT' : 'POST', body: { title: draft.title, description: draft.description, position: draft.position, duration_seconds: draft.duration_seconds }, locale, accessToken },
        ),
        onSuccess: () => {
            setNotice(t('ui_module_saved_module_enregistre'));
            void queryClient.invalidateQueries({ queryKey: ['admin', 'modules', courseId] });
            void queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
            void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
        },
    });
    const uploadVideo = useMutation({
        mutationFn: ({ moduleId, file, language }: { moduleId: string; file: File; language: string }) => uploadMedia(`/admin/modules/${moduleId}/video`, file, { locale, accessToken, language }),
        onSuccess: () => {
            setNotice(t('ui_video_track_saved_to_minio_piste_video_enregistree_dans_minio'));
            void queryClient.invalidateQueries({ queryKey: ['admin', 'modules', courseId] });
            void queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
        },
    });

    if (isLoading) return <main className="staff-loading">{t('ui_loading_chargement')}</main>;
    if (!user?.is_admin) return <main className="staff-denied"><div className="staff-lock-mark"><Book1 size={24} color="#d410ab" /></div><h1>{t('ui_admin_access_only_espace_reserve')}</h1><p>{t('ui_this_page_is_available_to_administrators_o_cette_page_est_reservee_aux_administrateur')}</p><Link to={`/${locale}`}>{t('ui_back_to_catalogue_retour_au_catalogue')}</Link></main>;

    const courses = coursesQuery.data ?? [];
    const students = studentsQuery.data ?? [];
    const editingCourse = courses.find((course) => course.id === courseId);

    return <WorkspaceLayout locale={locale} title="ADMIN STUDIO" firstName={user.first_name} lastName={user.last_name} navigation={<AdminHeader view={view} onViewChange={(nextView) => { setView(nextView); setStudentId(''); }} />} statusLabel={t('ui_workspace_active_espace_actif')} footerLabel={t('ui_management_workspace_espace_de_gestion')} footerAction={<Button variant="quiet" className="staff-exit" onClick={() => navigate(`/${locale}`)}>{t('ui_back_to_learning_retour_a_la_plateforme')}<ArrowRight2 size={16} color="#d410ab" /></Button>}>
            {view !== 'students' && <>
                <section className="staff-page-heading"><div><p className="staff-eyebrow">{t('ui_management_workspace_espace_de_gestion')}</p><h1>{view === 'overview' ? t('ui_welcome_back_bonjour') : t('ui_your_courses_vos_formations')}<span>{view === 'overview' ? `, ${user.first_name}` : ''}</span></h1><p>{t('ui_manage_your_courses_and_follow_learner_pro_gerez_vos_cours_et_suivez_la_progression_d')}</p></div><Button variant="primary" className="staff-primary" onClick={() => { setCourseId(''); setNotice(''); setCourseModal(true); }}>{t('ui_create_a_course_creer_une_formation')}</Button></section>
                {view === 'overview' && <AdminMetrics overview={overviewQuery.data} />}
                <AdminCourseGrid courses={courses} isLoading={coursesQuery.isPending} error={coursesQuery.error?.message} onCreate={() => { setCourseId(''); setNotice(''); setCourseModal(true); }} onEdit={(course) => { setCourseId(course.id); setNotice(''); setCourseModal(true); }} />
            </>}
            {view === 'students' && <>
                <AdminStudentWorkspace users={students} locale={locale} search={studentSearch} onSearch={setStudentSearch} isLoading={studentsQuery.isPending} error={studentsQuery.error?.message} selectedId={studentId} onSelect={setStudentId} />
                {studentId && <AdminStudentProgress progress={studentProgressQuery.data} isLoading={studentProgressQuery.isPending} error={studentProgressQuery.error?.message} onClose={() => setStudentId('')} />}
            </>}
        {courseModal && <CourseEditorDialog
            key={courseId || 'new-course'}
            course={editingCourse}
            isSavingCourse={saveCourse.isPending}
            courseError={saveCourse.error?.message}
            isSavingModule={saveModule.isPending}
            moduleError={saveModule.error?.message}
            isUploadingVideo={uploadVideo.isPending}
            uploadError={uploadVideo.error?.message}
            notice={notice}
            onSaveCourse={(id, draft) => saveCourse.mutateAsync({ id, draft })}
            onSaveModule={(selectedCourseId, draft) => saveModule.mutate({ selectedCourseId, draft })}
            onUploadVideo={(moduleId, file, language) => uploadVideo.mutate({ moduleId, file, language })}
            onClose={() => { setCourseModal(false); setCourseId(''); setNotice(''); }}
        />}
    </WorkspaceLayout>;
}
