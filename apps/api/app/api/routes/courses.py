from datetime import UTC, datetime
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
from app.models.video_track import VideoTrack
from app.schemas.courses import AudioTrackResponse, VideoTrackResponse, CourseDetail, CourseListResponse, CourseSummary, DashboardModule, DashboardResponse, EnrolledCourseResponse, EnrollmentResponse, ModuleContentResponse, ModuleProgressResponse, ModuleProgressUpdate, ModuleSummary

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
        video_languages=sorted({track.language for module in course.modules for track in module.video_tracks} | ({course.language} if any(module.video_key for module in course.modules) else set())),
    )


@router.get("/courses", response_model=CourseListResponse)
def list_courses(
    search: str | None = Query(default=None, max_length=100),
    language: str | None = Query(default=None, min_length=2, max_length=10),
    level: str | None = Query(default=None, max_length=30),
    db: Session = Depends(get_db),
) -> CourseListResponse:
    statement = select(Course).options(selectinload(Course.modules).selectinload(Module.audio_tracks), selectinload(Course.modules).selectinload(Module.video_tracks))
    if search and search.strip():
        term = f"%{search.strip()}%"
        statement = statement.where(or_(Course.title.ilike(term), Course.instructor.ilike(term)))
    if language:
        language_match = language.lower()
        statement = statement.where(
            or_(
                func.lower(Course.language) == language_match,
                Course.modules.any(Module.video_tracks.any(func.lower(VideoTrack.language) == language_match)),
            )
        )
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
        .options(selectinload(Course.modules).selectinload(Module.audio_tracks), selectinload(Course.modules).selectinload(Module.video_tracks))
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
            has_video=module.video_key is not None or bool(module.video_tracks),
            audio_languages=sorted({track.language for track in module.audio_tracks}),
            video_languages=sorted({track.language for track in module.video_tracks}) or ([course.language] if module.video_key else []),
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


@router.get("/me/courses", response_model=DashboardResponse)
def my_courses(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> DashboardResponse:
    enrollments = list(db.scalars(
        select(Enrollment)
        .where(Enrollment.user_id == user.id)
        .options(selectinload(Enrollment.course).selectinload(Course.modules))
        .order_by(Enrollment.created_at.desc())
    ).unique())
    module_ids = [module.id for enrollment in enrollments for module in enrollment.course.modules]
    progress_by_module = {
        item.module_id: item
        for item in db.scalars(select(ModuleProgress).where(
            ModuleProgress.user_id == user.id,
            ModuleProgress.module_id.in_(module_ids),
        ))
    } if module_ids else {}
    items = []
    for enrollment in enrollments:
        modules = [
            DashboardModule(
                id=module.id,
                title=module.title,
                position=module.position,
                duration_seconds=module.duration_seconds,
                progress_seconds=progress_by_module[module.id].progress_seconds if module.id in progress_by_module else 0,
                completed=progress_by_module[module.id].completed if module.id in progress_by_module else False,
            )
            for module in enrollment.course.modules
        ]
        count = len(modules)
        completed = sum(module.completed for module in modules)
        items.append(EnrolledCourseResponse(
            id=enrollment.course.id,
            slug=enrollment.course.slug,
            title=enrollment.course.title,
            instructor=enrollment.course.instructor,
            level=enrollment.course.level,
            enrolled_at=enrollment.created_at,
            module_count=count,
            completed_modules=completed,
            progress_percent=round(completed * 100 / count) if count else 0,
            modules=modules,
        ))
    return DashboardResponse(items=items)


@router.get("/modules/{module_id}", response_model=ModuleContentResponse)
def get_module_content(
    module_id: UUID,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ModuleContentResponse:
    locale = get_locale(request)
    module = db.scalar(select(Module).where(Module.id == module_id).options(selectinload(Module.course), selectinload(Module.audio_tracks), selectinload(Module.video_tracks)))
    if module is None:
        raise HTTPException(status_code=404, detail="Module introuvable." if locale == "fr" else "Module not found.")
    enrollment = db.scalar(select(Enrollment.id).where(Enrollment.user_id == user.id, Enrollment.course_id == module.course_id))
    if enrollment is None:
        raise HTTPException(status_code=403, detail="Inscrivez-vous à cette formation pour accéder au module." if locale == "fr" else "Enroll in this course to access the module.")
    video_url = get_media_url(module.video_key) if module.video_key else None
    progress = db.scalar(select(ModuleProgress).where(ModuleProgress.user_id == user.id, ModuleProgress.module_id == module.id))
    tracks = [
        AudioTrackResponse(language=track.language, mime_type=track.mime_type, url=get_media_url(track.object_key))
        for track in sorted(module.audio_tracks, key=lambda item: item.language)
    ]
    video_tracks = [
        VideoTrackResponse(language=track.language, mime_type=track.mime_type, url=get_media_url(track.object_key))
        for track in sorted(module.video_tracks, key=lambda item: item.language)
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
        video_tracks=video_tracks,
        progress_seconds=progress.progress_seconds if progress else 0,
        completed=progress.completed if progress else False,
    )


@router.put("/modules/{module_id}/progress", response_model=ModuleProgressResponse)
def save_module_progress(
    module_id: UUID,
    payload: ModuleProgressUpdate,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ModuleProgressResponse:
    locale = get_locale(request)
    module = db.get(Module, module_id)
    if module is None:
        raise HTTPException(status_code=404, detail="Module introuvable." if locale == "fr" else "Module not found.")
    enrolled = db.scalar(select(Enrollment.id).where(Enrollment.user_id == user.id, Enrollment.course_id == module.course_id))
    if enrolled is None:
        raise HTTPException(status_code=403, detail="Inscrivez-vous à cette formation pour accéder au module." if locale == "fr" else "Enroll in this course to access the module.")
    progress = db.scalar(select(ModuleProgress).where(ModuleProgress.user_id == user.id, ModuleProgress.module_id == module.id))
    if progress is None:
        progress = ModuleProgress(user_id=user.id, module_id=module.id, completed=False, progress_seconds=0)
        db.add(progress)
    progress.progress_seconds = max(progress.progress_seconds, min(payload.progress_seconds, module.duration_seconds) if module.duration_seconds > 0 else payload.progress_seconds)
    if payload.completed and not progress.completed:
        progress.completed = True
        progress.completed_at = datetime.now(UTC)
    db.commit()
    db.refresh(progress)
    return ModuleProgressResponse(
        module_id=progress.module_id,
        progress_seconds=progress.progress_seconds,
        completed=progress.completed,
        completed_at=progress.completed_at,
    )
