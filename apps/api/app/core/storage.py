from datetime import timedelta

from minio import Minio

from app.core.config import settings


client = Minio(
    settings.minio_endpoint,
    access_key=settings.minio_root_user,
    secret_key=settings.minio_root_password,
    secure=settings.minio_secure,
)


def get_media_url(object_key: str) -> str:
    signer = Minio(
        settings.minio_public_endpoint,
        access_key=settings.minio_root_user,
        secret_key=settings.minio_root_password,
        secure=settings.minio_public_secure,
    )
    return signer.presigned_get_object(settings.minio_bucket, object_key, expires=timedelta(minutes=30))
