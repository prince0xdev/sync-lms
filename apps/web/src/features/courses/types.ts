export type CourseListResponse = {
    items: CourseSummary[];
    total: number;
};

export type CourseSummary = {
    id: string;
    slug: string;
    title: string;
    description: string;
    instructor: string;
    language: string;
    level: string;
    module_count: number;
    audio_languages: string[];
};

export type CourseDetail = CourseSummary & {
    enrolled: boolean;
    modules: ModuleSummary[];
};

export type ModuleSummary = {
    id: string;
    title: string;
    description: string;
    position: number;
    duration_seconds: number;
    has_video: boolean;
    audio_languages: string[];
};

export type ModuleContent = {
    id: string;
    course_slug: string;
    title: string;
    description: string;
    position: number;
    duration_seconds: number;
    video_url: string | null;
    audio_tracks: AudioTrack[];
    progress_seconds: number;
    completed: boolean;
};

export type DashboardModule = {
    id: string;
    title: string;
    position: number;
    duration_seconds: number;
    progress_seconds: number;
    completed: boolean;
};

export type EnrolledCourse = {
    id: string;
    slug: string;
    title: string;
    instructor: string;
    level: string;
    enrolled_at: string;
    module_count: number;
    completed_modules: number;
    progress_percent: number;
    modules: DashboardModule[];
};

export type DashboardResponse = { items: EnrolledCourse[] };

export type ModuleProgressResponse = {
    module_id: string;
    progress_seconds: number;
    completed: boolean;
    completed_at: string | null;
};

export type AudioTrack = {
    language: string;
    mime_type: string;
    url: string;
};
