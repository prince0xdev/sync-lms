import os

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import engine
from app.core.i18n import get_locale, translate
from app.api.routes.auth import router as auth_router
from app.api.routes.courses import router as courses_router
from app.api.routes.admin import router as admin_router

app = FastAPI(
    title="SyncLearn API",
    version="0.1.0",
)

origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept-Language"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(courses_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, error: RequestValidationError) -> JSONResponse:
    locale = get_locale(request)
    fields = [{"field": ".".join(str(part) for part in item["loc"] if part != "body"), "message": translate(locale, "invalid_field")} for item in error.errors()]
    return JSONResponse(status_code=422, content={"detail": translate(locale, "validation_error"), "errors": fields})


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "synclearn-api"}


@app.get("/ready")
async def readiness_check(request: Request) -> dict[str, str]:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError as error:
        locale = get_locale(request)
        message = translate(locale, "database_unavailable")
        raise HTTPException(status_code=503, detail=message) from error
    return {"status": "ready", "database": "ok"}
