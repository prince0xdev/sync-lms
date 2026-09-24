from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import get_current_user, get_optional_user
from app.core.database import get_db
from app.core.i18n import get_locale
from app.core.storage import get_media_url
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.module import Module
from app.models.module_progress import ModuleProgress
from app.models.user import User
from app.schemas.courses import AudioTrackResponse, CourseDetail, CourseListResponse, CourseSummary, EnrollmentResponse, ModuleContentResponse, ModuleSummary

router = APIRouter(tags=["formations"])


def course_summary(course: Course) -> CourseSummary:
    languages = sorted({track.language for module in course.modules for track in module.audio_tracks})
    return CourseSummary(
        id=course.id,
        slug=course.slug,
        title=course.title,
        description=course.description,
        instructor=course.instructor,
        language=course.language,
        level=course.level,
        module_count=len(course.modules),
        audio_languages=languages,
    )


@router.get("/courses", response_model=CourseListResponse)
def list_courses(
    search: str | None = Query(default=None, max_length=100),
    language: str | None = Query(default=None, min_length=2, max_length=10),
    level: str | None = Query(default=None, max_length=30),
    db: Session = Depends(get_db),
) -> CourseListResponse:
    statement = select(Course).options(selectinload(Course.modules).selectinload(Module.audio_tracks))
    if search and search.strip():
        term = f"%{search.strip()}%"
        statement = statement.where(or_(Course.title.ilike(term), Course.instructor.ilike(term)))
    if language:
        statement = statement.where(func.lower(Course.language) == language.lower())
    if level:
        statement = statement.where(func.lower(Course.level) == level.lower())
    statement = statement.order_by(Course.title)
    courses = list(db.scalars(statement).unique())
    return CourseListResponse(items=[course_summary(course) for course in courses], total=len(courses))


@router.get("/courses/{slug}", response_model=CourseDetail)
def get_course(slug: str, request: Request, user: User | None = Depends(get_optional_user), db: Session = Depends(get_db)) -> CourseDetail:
    course = db.scalar(
        select(Course)
        .where(Course.slug == slug)
        .options(selectinload(Course.modules).selectinload(Module.audio_tracks))
    )
    if course is None:
        locale = get_locale(request)
        raise HTTPException(status_code=404, detail="Formation introuvable." if locale == "fr" else "Course not found.")
    summary = course_summary(course)
    modules = [
        ModuleSummary(
            id=module.id,
            title=module.title,
            description=module.description,
            position=module.position,
            duration_seconds=module.duration_seconds,
            has_video=module.video_key is not None,
            audio_languages=sorted({track.language for track in module.audio_tracks}),
        )
        for module in course.modules
    ]
    enrolled = user is not None and db.scalar(select(Enrollment.id).where(Enrollment.user_id == user.id, Enrollment.course_id == course.id)) is not None
    return CourseDetail(**summary.model_dump(), modules=modules, enrolled=enrolled)


@router.post("/courses/{course_id}/enroll", response_model=EnrollmentResponse)
def enroll_course(
    course_id: UUID,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EnrollmentResponse:
    locale = get_locale(request)
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Formation introuvable." if locale == "fr" else "Course not found.")
    existing = db.scalar(select(Enrollment).where(Enrollment.user_id == user.id, Enrollment.course_id == course_id))
    if existing is not None:
        return EnrollmentResponse(message="Vous suivez déjà cette formation." if locale == "fr" else "You are already enrolled.", enrolled=True)
    db.add(Enrollment(user_id=user.id, course_id=course_id))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
    return EnrollmentResponse(message="Inscription enregistrée." if locale == "fr" else "Enrollment saved.", enrolled=True)


@router.get("/modules/{module_id}", response_model=ModuleContentResponse)
def get_module_content(
    module_id: UUID,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ModuleContentResponse:
    locale = get_locale(request)
    module = db.scalar(select(Module).where(Module.id == module_id).options(selectinload(Module.course), selectinload(Module.audio_tracks)))
    if module is None:
        raise HTTPException(status_code=404, detail="Module introuvable." if locale == "fr" else "Module not found.")
    enrollment = db.scalar(select(Enrollment.id).where(Enrollment.user_id == user.id, Enrollment.course_id == module.course_id))
    if enrollment is None:
        raise HTTPException(status_code=403, detail="Inscrivez-vous à cette formation pour accéder au module." if locale == "fr" else "Enroll in this course to access the module.")
    video_url = get_media_url(module.video_key) if module.video_key else None
    tracks = [
        AudioTrackResponse(language=track.language, mime_type=track.mime_type, url=get_media_url(track.object_key))
        for track in sorted(module.audio_tracks, key=lambda item: item.language)
    ]
    return ModuleContentResponse(
        id=module.id,
        course_slug=module.course.slug,
        title=module.title,
        description=module.description,
        position=module.position,
        duration_seconds=module.duration_seconds,
        video_url=video_url,
        audio_tracks=tracks,
    )
