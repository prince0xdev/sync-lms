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
};

export type AudioTrack = {
    language: string;
    mime_type: string;
    url: string;
};
