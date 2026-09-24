from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://synclearn:synclearn_dev_password@localhost:5433/synclearn"
    secret_key: str = "synclearn-development-secret-change-before-deployment"
    access_token_minutes: int = 15
    refresh_token_days: int = 7
    refresh_cookie_secure: bool = False
    minio_endpoint: str = "localhost:9000"
    minio_region: str = "us-east-1"
    minio_public_endpoint: str = "localhost:9000"
    minio_root_user: str = "synclearn_minio"
    minio_root_password: str = "synclearn_minio_dev_password"
    minio_bucket: str = "synclearn"
    minio_secure: bool = False
    minio_public_secure: bool = False
    admin_emails: str = ""

    model_config = SettingsConfigDict(extra="ignore")


settings = Settings()
