from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://synclearn:synclearn_dev_password@localhost:5433/synclearn"
    secret_key: str = "synclearn-development-secret-change-before-deployment"
    access_token_minutes: int = 15
    refresh_token_days: int = 7
    refresh_cookie_secure: bool = False

    model_config = SettingsConfigDict(extra="ignore")


settings = Settings()
