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
import AdminMetrics from '../components/admin/AdminMetrics';
import AdminStudentProgress from '../components/admin/AdminStudentProgress';
import AdminStudentWorkspace from '../components/admin/AdminStudentWorkspace';
import CourseEditorDialog from '../components/admin/CourseEditorDialog';

export default function AdminPage() {
    const { user, accessToken, isLoading } = useAuth();
    const { locale } = useI18n();
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
            setNotice(locale === 'fr' ? 'Formation enregistrée.' : 'Course saved.');
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
            setNotice(locale === 'fr' ? 'Module enregistré.' : 'Module saved.');
            void queryClient.invalidateQueries({ queryKey: ['admin', 'modules', courseId] });
            void queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
            void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
        },
    });
    const uploadVideo = useMutation({
        mutationFn: ({ moduleId, file, language }: { moduleId: string; file: File; language: string }) => uploadMedia(`/admin/modules/${moduleId}/video`, file, { locale, accessToken, language }),
        onSuccess: () => {
            setNotice(locale === 'fr' ? 'Piste vidéo enregistrée dans MinIO.' : 'Video track saved to MinIO.');
            void queryClient.invalidateQueries({ queryKey: ['admin', 'modules', courseId] });
            void queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
        },
    });

    const french = locale === 'fr';
    if (isLoading) return <main className="staff-loading">{french ? 'Chargement…' : 'Loading…'}</main>;
    if (!user?.is_admin) return <main className="staff-denied"><div className="staff-lock-mark"><Book1 size={24} /></div><h1>{french ? 'Espace réservé' : 'Admin access only'}</h1><p>{french ? 'Cette page est réservée aux administrateurs.' : 'This page is available to administrators only.'}</p><Link to={`/${locale}`}>{french ? 'Retour au catalogue' : 'Back to catalogue'}</Link></main>;

    const courses = coursesQuery.data ?? [];
    const students = studentsQuery.data ?? [];
    const editingCourse = courses.find((course) => course.id === courseId);

    return <div className="staff-shell">
        <AdminHeader locale={locale} firstName={user.first_name} lastName={user.last_name} view={view} onViewChange={(nextView) => { setView(nextView); setStudentId(''); }} />
        <main className="staff-content">
            {view !== 'students' && <>
                <section className="staff-page-heading"><div><p className="staff-eyebrow">{french ? 'ESPACE DE GESTION' : 'MANAGEMENT WORKSPACE'}</p><h1>{view === 'overview' ? french ? 'Bonjour' : 'Welcome back' : french ? 'Vos formations' : 'Your courses'}<span>{view === 'overview' ? `, ${user.first_name}` : ''}</span></h1><p>{french ? 'Gérez vos cours et suivez la progression des apprenants.' : 'Manage your courses and follow learner progress.'}</p></div><Button variant="primary" className="staff-primary" onClick={() => { setCourseId(''); setNotice(''); setCourseModal(true); }}>{french ? 'Créer une formation' : 'Create a course'}</Button></section>
                {view === 'overview' && <AdminMetrics overview={overviewQuery.data} locale={locale} />}
                <AdminCourseGrid courses={courses} locale={locale} isLoading={coursesQuery.isPending} error={coursesQuery.error?.message} onCreate={() => { setCourseId(''); setNotice(''); setCourseModal(true); }} onEdit={(course) => { setCourseId(course.id); setNotice(''); setCourseModal(true); }} />
            </>}
            {view === 'students' && <>
                <AdminStudentWorkspace users={students} locale={locale} search={studentSearch} onSearch={setStudentSearch} isLoading={studentsQuery.isPending} error={studentsQuery.error?.message} selectedId={studentId} onSelect={setStudentId} />
                {studentId && <AdminStudentProgress progress={studentProgressQuery.data} isLoading={studentProgressQuery.isPending} error={studentProgressQuery.error?.message} locale={locale} onClose={() => setStudentId('')} />}
            </>}
        </main>
        {courseModal && <CourseEditorDialog
            key={courseId || 'new-course'}
            course={editingCourse}
            locale={locale}
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
        <div className="staff-footer">{french ? 'SyncLearn · Espace de gestion' : 'SyncLearn · Management workspace'}<Button variant="quiet" className="staff-exit" onClick={() => navigate(`/${locale}`)}>{french ? 'Retour à la plateforme' : 'Back to learning'}<ArrowRight2 size={16} /></Button></div>
    </div>;
}
