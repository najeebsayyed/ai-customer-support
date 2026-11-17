from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load .env into the environment, so Pydantic AI also finds OPENAI_API_KEY.
load_dotenv()


class Settings(BaseSettings):
    database_url: str = ""
    openai_api_key: str = ""
    google_client_id: str = ""
    google_client_secret: str = ""
    google_refresh_token: str = ""
    classifier_model: str = "openai:gpt-6-luna"
    agent_model: str = "openai:gpt-6.1-sol"
    poll_interval_seconds: int = 60
    dashboard_username: str = "admin"
    dashboard_password: str = ""
    cors_origins: str = "*"

    def get_cors_origins(self) -> list[str]:
        if not self.cors_origins or self.cors_origins.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
