from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    APP_ENV: Literal["development", "production"] = "development"
    APP_SECRET_KEY: str = "dev-secret"

    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    VISION_API_PROVIDER: Literal["mock", "google_vision", "serpapi", "rekognition"] = "mock"
    GOOGLE_VISION_API_KEY: str = ""
    SERPAPI_KEY: str = ""
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""

    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    ALLOWED_ORIGINS: str = "chrome-extension://*,http://localhost:3000"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
