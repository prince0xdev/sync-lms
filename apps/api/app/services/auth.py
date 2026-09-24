from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_token, hash_password, hash_token, verify_password
from app.models.user import User
from app.models.user_session import UserSession


def authenticate(db: Session, email: str, password: str) -> User | None:
    user = db.scalar(select(User).where(User.email == email.strip().lower()))
    if user is None or not verify_password(password, user.password_hash):
        return None
    return user


def create_user(db: Session, email: str, password: str, first_name: str, last_name: str) -> User:
    user = User(
        email=email.strip().lower(),
        password_hash=hash_password(password),
        first_name=first_name.strip(),
        last_name=last_name.strip(),
    )
    db.add(user)
    db.flush()
    return user


def issue_session(db: Session, user: User) -> tuple[str, str, UserSession]:
    session_id = uuid4()
    refresh_delta = timedelta(days=settings.refresh_token_days)
    refresh_token = create_token(user.id, session_id, "refresh", refresh_delta)
    session = UserSession(
        id=session_id,
        user_id=user.id,
        refresh_token_hash=hash_token(refresh_token),
        expires_at=datetime.now(UTC) + refresh_delta,
    )
    db.add(session)
    db.flush()
    access_token = create_token(user.id, session_id, "access", timedelta(minutes=settings.access_token_minutes))
    return access_token, refresh_token, session


def get_active_session(db: Session, session_id: UUID, user_id: UUID) -> UserSession | None:
    session = db.scalar(select(UserSession).where(UserSession.id == session_id, UserSession.user_id == user_id))
    if session is None or session.revoked_at is not None:
        return None
    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    if expires_at <= datetime.now(UTC):
        return None
    return session
