from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.i18n import get_locale, translate
from app.core.security import decode_token
from app.models.user import User
from app.services.auth import get_active_session

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    locale = get_locale(request)
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=translate(locale, "unauthorized"), headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = decode_token(credentials.credentials, "access")
        user_id = UUID(str(payload["sub"]))
        session_id = UUID(str(payload["sid"]))
    except (jwt.InvalidTokenError, ValueError, KeyError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=translate(locale, "invalid_session"), headers={"WWW-Authenticate": "Bearer"}) from None
    if get_active_session(db, session_id, user_id) is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=translate(locale, "invalid_session"), headers={"WWW-Authenticate": "Bearer"})
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=translate(locale, "invalid_session"), headers={"WWW-Authenticate": "Bearer"})
    return user


def get_optional_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    if credentials is None:
        return None
    try:
        payload = decode_token(credentials.credentials, "access")
        user_id = UUID(str(payload["sub"]))
        session_id = UUID(str(payload["sid"]))
    except (jwt.InvalidTokenError, ValueError, KeyError):
        return None
    if get_active_session(db, session_id, user_id) is None:
        return None
    return db.get(User, user_id)


def get_admin_user(request: Request, user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        locale = get_locale(request)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=translate(locale, "administrator_required"))
    return user


