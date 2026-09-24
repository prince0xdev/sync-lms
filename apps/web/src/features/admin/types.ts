export type AdminView = 'overview' | 'courses' | 'students';

export type AdminOverview = {
    course_count: number;
    user_count: number;
    enrollment_count: number;
    module_count: number;
};

export type AdminCourse = {
    id: string;
    title: string;
    slug: string;
    description: string;
    instructor: string;
    language: string;
    level: string;
    created_at: string;
    module_count: number;
    enrollment_count: number;
    video_languages: string[];
};

export type AdminModule = {
    id: string;
    title: string;
    description: string;
    position: number;
    duration_seconds: number;
    has_video: boolean;
    video_languages: string[];
    audio_languages: string[];
};

export type AdminUser = {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    is_admin: boolean;
    created_at: string;
    enrollment_count: number;
    module_count: number;
    completed_modules: number;
    progress_percent: number;
};

export type StudentProgress = {
    user: AdminUser;
    courses: Array<{
        id: string;
        slug: string;
        title: string;
        enrolled_at: string;
        module_count: number;
        completed_modules: number;
        progress_percent: number;
        modules: Array<{
            id: string;
            title: string;
            position: number;
            duration_seconds: number;
            progress_seconds: number;
            completed: boolean;
        }>;
    }>;
};

export type CourseDraft = Pick<AdminCourse, 'title' | 'slug' | 'description' | 'instructor' | 'language' | 'level'>;
export type ModuleDraft = Pick<AdminModule, 'title' | 'description' | 'position' | 'duration_seconds'> & { id?: string };
export type SaveCourseInput = { id?: string; payload: CourseDraft };
export type SaveModuleInput = { courseId: string; id?: string; payload: ModuleDraft };
export type UploadInput = { id: string; file: File; language: string };
