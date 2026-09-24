from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import get_admin_user
from app.core.database import get_db
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.module import Module
from app.models.user import User
from app.schemas.admin import AdminCourseInput, AdminCourseResponse, AdminModuleInput, AdminModuleResponse, AdminOverview, AdminRoleUpdate, AdminUserResponse

router = APIRouter(prefix="/admin", tags=["administration"], dependencies=[Depends(get_admin_user)])


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
    courses = db.scalars(select(Course).options(selectinload(Course.modules)).order_by(Course.created_at.desc()))
    return [AdminCourseResponse(**{**{key: getattr(course, key) for key in ("id", "title", "slug", "description", "instructor", "language", "level", "created_at")}, "module_count": len(course.modules)}) for course in courses]


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
    return AdminCourseResponse(**payload.model_dump(), id=course.id, module_count=0, created_at=course.created_at)


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
    return AdminCourseResponse(**payload.model_dump(), id=course.id, module_count=len(course.modules), created_at=course.created_at)


@router.get("/courses/{course_id}/modules", response_model=list[AdminModuleResponse])
def list_course_modules(course_id: UUID, db: Session = Depends(get_db)) -> list[AdminModuleResponse]:
    if db.get(Course, course_id) is None:
        raise HTTPException(status_code=404, detail="Formation introuvable.")
    modules = db.scalars(select(Module).where(Module.course_id == course_id).order_by(Module.position))
    return [AdminModuleResponse(id=module.id, title=module.title, description=module.description, position=module.position, duration_seconds=module.duration_seconds) for module in modules]


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
    return AdminModuleResponse(id=module.id, **payload.model_dump())


@router.put("/courses/{course_id}/modules/{module_id}", response_model=AdminModuleResponse)
def update_module(course_id: UUID, module_id: UUID, payload: AdminModuleInput, db: Session = Depends(get_db)) -> AdminModuleResponse:
    module = db.scalar(select(Module).where(Module.id == module_id, Module.course_id == course_id))
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
    return AdminModuleResponse(id=module.id, **payload.model_dump())


@router.get("/users", response_model=list[AdminUserResponse])
def list_users(
    search: str | None = Query(default=None, max_length=100),
    db: Session = Depends(get_db),
) -> list[AdminUserResponse]:
    statement = select(User).options(selectinload(User.enrollments)).order_by(User.created_at.desc())
    if search and search.strip():
        term = f"%{search.strip()}%"
        statement = statement.where(or_(User.email.ilike(term), User.first_name.ilike(term), User.last_name.ilike(term)))
    users = db.scalars(statement)
    return [AdminUserResponse(
        id=user.id, email=user.email, first_name=user.first_name, last_name=user.last_name,
        is_admin=user.is_admin, created_at=user.created_at, enrollment_count=len(user.enrollments),
    ) for user in users]


@router.put("/users/{user_id}/role", response_model=AdminUserResponse)
def update_user_role(
    user_id: UUID,
    payload: AdminRoleUpdate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> AdminUserResponse:
    if user_id == admin.id and not payload.is_admin:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas retirer votre propre accès administrateur.")
    user = db.scalar(select(User).where(User.id == user_id).options(selectinload(User.enrollments)))
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
    user.is_admin = payload.is_admin
    db.commit()
    db.refresh(user)
    return AdminUserResponse(
        id=user.id, email=user.email, first_name=user.first_name, last_name=user.last_name,
        is_admin=user.is_admin, created_at=user.created_at, enrollment_count=len(user.enrollments),
    )
