from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).parent.parent.parent


class Settings(BaseSettings):
    anthropic_api_key: str = Field(default="")
    claude_model: str = "claude-sonnet-4-6"
    notes_directory: Path = PROJECT_ROOT / "notes"

    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        env_file_encoding="utf-8",
    )

    @field_validator("anthropic_api_key")
    @classmethod
    def validate_api_key(cls, value: str) -> str:
        if not value:
            raise ValueError("ANTHROPIC_API_KEY is not set. Add it to your .env file.")
        return value


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
