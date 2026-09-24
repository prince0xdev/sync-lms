from datetime import UTC, datetime
from uuid import UUID

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.i18n import get_locale, translate
from app.core.security import decode_token, hash_token
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from app.services.auth import authenticate, create_user, get_active_session, issue_session

router = APIRouter(prefix="/auth", tags=["authentification"])
COOKIE_NAME = "synclearn_refresh"
COOKIE_PATH = "/api/v1/auth"


def set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=settings.refresh_token_days * 24 * 60 * 60,
        httponly=True,
        secure=settings.refresh_cookie_secure,
        samesite="lax",
        path=COOKIE_PATH,
    )


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(key=COOKIE_NAME, httponly=True, secure=settings.refresh_cookie_secure, samesite="lax", path=COOKIE_PATH)


def auth_response(locale: str, message_key: str, access_token: str, user: User) -> AuthResponse:
    return AuthResponse(message=translate(locale, message_key), access_token=access_token, user=UserResponse.model_validate(user))


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, request: Request, response: Response, db: Session = Depends(get_db)) -> AuthResponse:
    locale = get_locale(request)
    try:
        user = create_user(db, payload.email, payload.password, payload.first_name, payload.last_name)
        access_token, refresh_token, _ = issue_session(db, user)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=translate(locale, "email_registered")) from None
    set_refresh_cookie(response, refresh_token)
    return auth_response(locale, "registered", access_token, user)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)) -> AuthResponse:
    locale = get_locale(request)
    user = authenticate(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=translate(locale, "invalid_credentials"), headers={"WWW-Authenticate": "Bearer"})
    access_token, refresh_token, _ = issue_session(db, user)
    db.commit()
    set_refresh_cookie(response, refresh_token)
    return auth_response(locale, "logged_in", access_token, user)


@router.post("/refresh", response_model=AuthResponse)
def refresh(request: Request, response: Response, db: Session = Depends(get_db)) -> AuthResponse:
    locale = get_locale(request)
    token = request.cookies.get(COOKIE_NAME)
    if token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=translate(locale, "invalid_session"))
    try:
        payload = decode_token(token, "refresh")
        user_id = UUID(str(payload["sub"]))
        session_id = UUID(str(payload["sid"]))
    except (jwt.InvalidTokenError, ValueError, KeyError):
        clear_refresh_cookie(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=translate(locale, "invalid_session")) from None
    session = get_active_session(db, session_id, user_id)
    if session is None or session.refresh_token_hash != hash_token(token):
        clear_refresh_cookie(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=translate(locale, "invalid_session"))
    user = db.get(User, user_id)
    if user is None:
        clear_refresh_cookie(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=translate(locale, "invalid_session"))
    session.revoked_at = datetime.now(UTC)
    access_token, refresh_token, _ = issue_session(db, user)
    db.commit()
    set_refresh_cookie(response, refresh_token)
    return auth_response(locale, "session_refreshed", access_token, user)


@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)) -> dict[str, str]:
    locale = get_locale(request)
    token = request.cookies.get(COOKIE_NAME)
    if token is not None:
        try:
            payload = decode_token(token, "refresh")
            user_id = UUID(str(payload["sub"]))
            session_id = UUID(str(payload["sid"]))
            session = get_active_session(db, session_id, user_id)
            if session is not None and session.refresh_token_hash == hash_token(token):
                session.revoked_at = datetime.now(UTC)
                db.commit()
        except (jwt.InvalidTokenError, ValueError, KeyError):
            db.rollback()
    clear_refresh_cookie(response)
    return {"message": translate(locale, "logged_out")}


@router.get("/me", response_model=UserResponse)
def current_user(user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(user)
