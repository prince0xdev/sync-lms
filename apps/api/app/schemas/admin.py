from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AdminCourseInput(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    slug: str = Field(min_length=1, max_length=220, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str = Field(min_length=1)
    instructor: str = Field(min_length=1, max_length=200)
    language: str = Field(default="fr", min_length=2, max_length=10)
    level: str = Field(default="beginner", max_length=30)


class AdminCourseResponse(AdminCourseInput):
    id: UUID
    module_count: int
    created_at: datetime


class AdminUserResponse(BaseModel):
    id: UUID
    email: str
    first_name: str
    last_name: str
    is_admin: bool
    created_at: datetime
    enrollment_count: int


class AdminRoleUpdate(BaseModel):
    is_admin: bool


class AdminModuleInput(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    position: int = Field(ge=1)
    duration_seconds: int = Field(default=0, ge=0)


class AdminModuleResponse(AdminModuleInput):
    id: UUID



class AdminOverview(BaseModel):
    course_count: int
    user_count: int
    enrollment_count: int
    module_count: int
