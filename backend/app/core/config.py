from typing import List
import os

class Settings:
    PROJECT_NAME: str = "DataInsight API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
    MAX_UPLOAD_SIZE_MB: int = 150
    ALLOWED_EXTENSIONS: set = {".csv", ".xlsx", ".xls"}
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ]

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

