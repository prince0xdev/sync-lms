from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


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
    progress_seconds: int = 0
    completed: bool = False


class ModuleProgressUpdate(BaseModel):
    progress_seconds: int = Field(default=0, ge=0)
    completed: bool = False


class ModuleProgressResponse(BaseModel):
    module_id: UUID
    progress_seconds: int
    completed: bool
    completed_at: datetime | None


class DashboardModule(BaseModel):
    id: UUID
    title: str
    position: int
    duration_seconds: int
    progress_seconds: int
    completed: bool


class EnrolledCourseResponse(BaseModel):
    id: UUID
    slug: str
    title: str
    instructor: str
    level: str
    enrolled_at: datetime
    module_count: int
    completed_modules: int
    progress_percent: int
    modules: list[DashboardModule]


class DashboardResponse(BaseModel):
    items: list[EnrolledCourseResponse]
