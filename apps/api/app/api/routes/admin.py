from pathlib import Path
from re import fullmatch
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from minio.error import S3Error
from sqlalchemy import and_, case, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import get_admin_user
from app.core.config import settings
from app.core.database import get_db
from app.core.storage import client as storage_client, get_media_url
from app.models.audio_track import AudioTrack
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.module import Module
from app.models.module_progress import ModuleProgress
from app.models.user import User
from app.schemas.admin import (
    AdminCourseInput,
    AdminCourseResponse,
    AdminMediaResponse,
    AdminModuleInput,
    AdminModuleResponse,
    AdminOverview,
    AdminRoleUpdate,
    AdminStudentCourseProgress,
    AdminStudentModuleProgress,
    AdminStudentProgressResponse,
    AdminUserResponse,
)

router = APIRouter(prefix="/admin", tags=["administration"], dependencies=[Depends(get_admin_user)])
MAX_VIDEO_BYTES = 500 * 1024 * 1024
MAX_AUDIO_BYTES = 100 * 1024 * 1024


def _user_stats(db: Session, user_id: UUID) -> tuple[int, int, int]:
    completed_module = func.count(
        func.distinct(case((ModuleProgress.completed.is_(True), ModuleProgress.module_id)))
    )
    row = db.execute(
        select(
            func.count(func.distinct(Enrollment.id)),
            func.count(func.distinct(Module.id)),
            completed_module,
        )
        .select_from(User)
        .outerjoin(Enrollment, Enrollment.user_id == User.id)
        .outerjoin(Module, Module.course_id == Enrollment.course_id)
        .outerjoin(
            ModuleProgress,
            and_(ModuleProgress.user_id == User.id, ModuleProgress.module_id == Module.id),
        )
        .where(User.id == user_id)
        .group_by(User.id)
    ).one_or_none()
    return tuple(row) if row else (0, 0, 0)


def _user_response(user: User, stats: tuple[int, int, int]) -> AdminUserResponse:
    enrollment_count, module_count, completed_modules = stats
    return AdminUserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        is_admin=user.is_admin,
        created_at=user.created_at,
        enrollment_count=enrollment_count,
        module_count=module_count,
        completed_modules=completed_modules,
        progress_percent=round(completed_modules * 100 / module_count) if module_count else 0,
    )


def _module_response(module: Module) -> AdminModuleResponse:
    return AdminModuleResponse(
        id=module.id,
        title=module.title,
        description=module.description,
        position=module.position,
        duration_seconds=module.duration_seconds,
        has_video=module.video_key is not None,
        audio_languages=sorted(track.language for track in module.audio_tracks),
    )


def _course_response(course: Course, enrollment_count: int = 0) -> AdminCourseResponse:
    return AdminCourseResponse(
        id=course.id,
        title=course.title,
        slug=course.slug,
        description=course.description,
        instructor=course.instructor,
        language=course.language,
        level=course.level,
        created_at=course.created_at,
        module_count=len(course.modules),
        enrollment_count=enrollment_count,
    )


def _store_upload(upload: UploadFile, prefix: str, kind: str, max_size: int) -> tuple[str, str]:
    media_type = upload.content_type or "application/octet-stream"
    if not media_type.startswith(f"{kind}/"):
        raise HTTPException(status_code=415, detail=f"Le fichier doit être un média {kind}.")
    size = upload.size
    if size is None:
        upload.file.seek(0, 2)
        size = upload.file.tell()
        upload.file.seek(0)
    if size <= 0:
        raise HTTPException(status_code=400, detail="Le fichier est vide.")
    if size > max_size:
        raise HTTPException(status_code=413, detail="Le fichier dépasse la taille autorisée.")
    raw_suffix = Path(upload.filename or "").suffix.lower()
    suffix = raw_suffix if len(raw_suffix) <= 10 and fullmatch(r"\.[a-z0-9]+", raw_suffix) else ""
    object_key = f"{prefix}/{uuid4().hex}{suffix}"
    upload.file.seek(0)
    try:
        storage_client.put_object(
            settings.minio_bucket,
            object_key,
            upload.file,
            length=size,
            content_type=media_type,
        )
    except S3Error as error:
        raise HTTPException(status_code=502, detail="Impossible d’enregistrer le média.") from error
    return object_key, media_type


@router.get("/overview", response_model=AdminOverview)
def overview(db: Session = Depends(get_db)) -> AdminOverview:
    return AdminOverview(
        course_count=db.scalar(select(func.count()).select_from(Course)) or 0,
        user_count=db.scalar(select(func.count()).select_from(User)) or 0,
        enrollment_count=db.scalar(select(func.count()).select_from(Enrollment)) or 0,
        module_count=db.scalar(select(func.count()).select_from(Module)) or 0,
    )


@router.get("/courses", response_model=list[AdminCourseResponse])
def list_admin_courses(db: Session = Depends(get_db)) -> list[AdminCourseResponse]:
    rows = db.execute(
        select(Course, func.count(Enrollment.id))
        .outerjoin(Enrollment, Enrollment.course_id == Course.id)
        .options(selectinload(Course.modules))
        .group_by(Course.id)
        .order_by(Course.created_at.desc())
    ).all()
    return [_course_response(course, enrollment_count) for course, enrollment_count in rows]


@router.post("/courses", response_model=AdminCourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(payload: AdminCourseInput, db: Session = Depends(get_db)) -> AdminCourseResponse:
    course = Course(**payload.model_dump())
    db.add(course)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Ce slug de formation est déjà utilisé.") from None
    db.refresh(course)
    return _course_response(course)


@router.put("/courses/{course_id}", response_model=AdminCourseResponse)
def update_course(course_id: UUID, payload: AdminCourseInput, db: Session = Depends(get_db)) -> AdminCourseResponse:
    course = db.scalar(select(Course).where(Course.id == course_id).options(selectinload(Course.modules)))
    if course is None:
        raise HTTPException(status_code=404, detail="Formation introuvable.")
    for key, value in payload.model_dump().items():
        setattr(course, key, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Ce slug de formation est déjà utilisé.") from None
    db.refresh(course)
    enrollment_count = db.scalar(select(func.count(Enrollment.id)).where(Enrollment.course_id == course_id)) or 0
    return _course_response(course, enrollment_count)


@router.get("/courses/{course_id}/modules", response_model=list[AdminModuleResponse])
def list_course_modules(course_id: UUID, db: Session = Depends(get_db)) -> list[AdminModuleResponse]:
    if db.get(Course, course_id) is None:
        raise HTTPException(status_code=404, detail="Formation introuvable.")
    modules = db.scalars(
        select(Module)
        .where(Module.course_id == course_id)
        .options(selectinload(Module.audio_tracks))
        .order_by(Module.position)
    )
    return [_module_response(module) for module in modules]


@router.post("/courses/{course_id}/modules", response_model=AdminModuleResponse, status_code=status.HTTP_201_CREATED)
def create_module(course_id: UUID, payload: AdminModuleInput, db: Session = Depends(get_db)) -> AdminModuleResponse:
    if db.get(Course, course_id) is None:
        raise HTTPException(status_code=404, detail="Formation introuvable.")
    module = Module(course_id=course_id, **payload.model_dump())
    db.add(module)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Cette position est déjà utilisée dans la formation.") from None
    db.refresh(module)
    return _module_response(module)


@router.put("/courses/{course_id}/modules/{module_id}", response_model=AdminModuleResponse)
def update_module(course_id: UUID, module_id: UUID, payload: AdminModuleInput, db: Session = Depends(get_db)) -> AdminModuleResponse:
    module = db.scalar(
        select(Module)
        .where(Module.id == module_id, Module.course_id == course_id)
        .options(selectinload(Module.audio_tracks))
    )
    if module is None:
        raise HTTPException(status_code=404, detail="Module introuvable.")
    for key, value in payload.model_dump().items():
        setattr(module, key, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Cette position est déjà utilisée dans la formation.") from None
    db.refresh(module)
    return _module_response(module)


@router.post("/modules/{module_id}/video", response_model=AdminMediaResponse)
def upload_module_video(module_id: UUID, file: UploadFile = File(...), db: Session = Depends(get_db)) -> AdminMediaResponse:
    module = db.scalar(select(Module).where(Module.id == module_id))
    if module is None:
        raise HTTPException(status_code=404, detail="Module introuvable.")
    object_key, media_type = _store_upload(
        file,
        f"courses/{module.course_id}/modules/{module.id}/video",
        "video",
        MAX_VIDEO_BYTES,
    )
    module.video_key = object_key
    db.commit()
    return AdminMediaResponse(object_key=object_key, url=get_media_url(object_key), media_type=media_type)


@router.post("/modules/{module_id}/audio", response_model=AdminMediaResponse)
def upload_module_audio(
    module_id: UUID,
    language: str = Form(..., min_length=2, max_length=10),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> AdminMediaResponse:
    if not fullmatch(r"[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})?", language):
        raise HTTPException(status_code=422, detail="Code de langue invalide.")
    module = db.scalar(
        select(Module)
        .where(Module.id == module_id)
        .options(selectinload(Module.audio_tracks))
    )
    if module is None:
        raise HTTPException(status_code=404, detail="Module introuvable.")
    normalized_language = language.lower()
    object_key, media_type = _store_upload(
        file,
        f"courses/{module.course_id}/modules/{module.id}/audio/{normalized_language}",
        "audio",
        MAX_AUDIO_BYTES,
    )
    track = next((item for item in module.audio_tracks if item.language == normalized_language), None)
    if track is None:
        track = AudioTrack(module_id=module.id, language=normalized_language, object_key=object_key, mime_type=media_type)
        db.add(track)
    else:
        track.object_key = object_key
        track.mime_type = media_type
    db.commit()
    return AdminMediaResponse(
        object_key=object_key,
        url=get_media_url(object_key),
        media_type=media_type,
        language=normalized_language,
    )


@router.get("/users", response_model=list[AdminUserResponse])
def list_users(
    search: str | None = Query(default=None, max_length=100),
    db: Session = Depends(get_db),
) -> list[AdminUserResponse]:
    completed_module = func.count(
        func.distinct(case((ModuleProgress.completed.is_(True), ModuleProgress.module_id)))
    )
    statement = (
        select(
            User,
            func.count(func.distinct(Enrollment.id)),
            func.count(func.distinct(Module.id)),
            completed_module,
        )
        .outerjoin(Enrollment, Enrollment.user_id == User.id)
        .outerjoin(Module, Module.course_id == Enrollment.course_id)
        .outerjoin(
            ModuleProgress,
            and_(ModuleProgress.user_id == User.id, ModuleProgress.module_id == Module.id),
        )
        .group_by(User.id)
        .order_by(User.created_at.desc())
    )
    if search and search.strip():
        term = f"%{search.strip()}%"
        statement = statement.where(or_(User.email.ilike(term), User.first_name.ilike(term), User.last_name.ilike(term)))
    rows = db.execute(statement).all()
    return [
        AdminUserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            is_admin=user.is_admin,
            created_at=user.created_at,
            enrollment_count=enrollment_count,
            module_count=module_count,
            completed_modules=completed_modules,
            progress_percent=round(completed_modules * 100 / module_count) if module_count else 0,
        )
        for user, enrollment_count, module_count, completed_modules in rows
    ]


@router.get("/users/{user_id}/progress", response_model=AdminStudentProgressResponse)
def student_progress(user_id: UUID, db: Session = Depends(get_db)) -> AdminStudentProgressResponse:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
    enrollments = db.scalars(
        select(Enrollment)
        .where(Enrollment.user_id == user_id)
        .options(selectinload(Enrollment.course).selectinload(Course.modules))
        .order_by(Enrollment.created_at.desc())
    ).unique()
    enrollment_items = list(enrollments)
    module_ids = [module.id for item in enrollment_items for module in item.course.modules]
    progress_by_module = {
        progress.module_id: progress
        for progress in db.scalars(
            select(ModuleProgress).where(
                ModuleProgress.user_id == user_id,
                ModuleProgress.module_id.in_(module_ids),
            )
        )
    } if module_ids else {}
    courses = []
    for enrollment in enrollment_items:
        modules = sorted(enrollment.course.modules, key=lambda item: item.position)
        completed_modules = sum(1 for module in modules if progress_by_module.get(module.id) and progress_by_module[module.id].completed)
        courses.append(
            AdminStudentCourseProgress(
                id=enrollment.course.id,
                slug=enrollment.course.slug,
                title=enrollment.course.title,
                enrolled_at=enrollment.created_at,
                module_count=len(modules),
                completed_modules=completed_modules,
                progress_percent=round(completed_modules * 100 / len(modules)) if modules else 0,
                modules=[
                    AdminStudentModuleProgress(
                        id=module.id,
                        title=module.title,
                        position=module.position,
                        duration_seconds=module.duration_seconds,
                        progress_seconds=progress_by_module[module.id].progress_seconds if module.id in progress_by_module else 0,
                        completed=progress_by_module[module.id].completed if module.id in progress_by_module else False,
                    )
                    for module in modules
                ],
            )
        )
    return AdminStudentProgressResponse(user=_user_response(user, _user_stats(db, user_id)), courses=courses)


@router.put("/users/{user_id}/role", response_model=AdminUserResponse)
def update_user_role(
    user_id: UUID,
    payload: AdminRoleUpdate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> AdminUserResponse:
    if user_id == admin.id and not payload.is_admin:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas retirer votre propre accès administrateur.")
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
    user.is_admin = payload.is_admin
    db.commit()
    db.refresh(user)
    return _user_response(user, _user_stats(db, user_id))
