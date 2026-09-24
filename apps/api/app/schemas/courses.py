from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CourseSummary(BaseModel):
    id: UUID
    slug: str
    title: str
    description: str
    instructor: str
    language: str
    level: str
    module_count: int
    audio_languages: list[str]


class CourseListResponse(BaseModel):
    items: list[CourseSummary]
    total: int


class ModuleSummary(BaseModel):
    id: UUID
    title: str
    description: str
    position: int
    duration_seconds: int
    has_video: bool
    audio_languages: list[str]

    model_config = ConfigDict(from_attributes=True)


class CourseDetail(CourseSummary):
    modules: list[ModuleSummary]
    enrolled: bool


class EnrollmentResponse(BaseModel):
    message: str
    enrolled: bool


class AudioTrackResponse(BaseModel):
    language: str
    mime_type: str
    url: str


class ModuleContentResponse(BaseModel):
    id: UUID
    course_slug: str
    title: str
    description: str
    position: int
    duration_seconds: int
    video_url: str | None
    audio_tracks: list[AudioTrackResponse]
