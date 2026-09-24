from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://synclearn:synclearn_dev_password@localhost:5433/synclearn"

    model_config = SettingsConfigDict(extra="ignore")


settings = Settings()
