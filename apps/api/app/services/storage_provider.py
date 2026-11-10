import abc
import os
import uuid
from typing import Optional
from pathlib import Path

from app.core.config import settings


class BaseStorageProvider(abc.ABC):
    @abc.abstractmethod
    async def upload_file(self, file_bytes: bytes, file_name: str, content_type: str) -> str:
        """Upload file and return private storage object key."""
        pass

    @abc.abstractmethod
    async def get_presigned_url(self, object_key: str, expires_in_seconds: int = 300) -> str:
        """Generate short-lived signed URL for authorized viewing."""
        pass

    @abc.abstractmethod
    async def delete_file(self, object_key: str) -> bool:
        """Delete file from storage upon account deletion."""
        pass


class LocalStorageProvider(BaseStorageProvider):
    """Local filesystem storage for offline development and test execution."""
    def __init__(self, base_dir: str = settings.LOCAL_STORAGE_DIR):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    async def upload_file(self, file_bytes: bytes, file_name: str, content_type: str) -> str:
        ext = Path(file_name).suffix or ".jpg"
        object_key = f"{uuid.uuid4()}{ext}"
        target_path = self.base_dir / object_key
        with open(target_path, "wb") as f:
            f.write(file_bytes)
        return object_key

    async def get_presigned_url(self, object_key: str, expires_in_seconds: int = 300) -> str:
        # In local mode, returns API endpoint to stream file with token authorization
        return f"{settings.API_BASE_URL}/api/v1/storage/{object_key}?token=mock_signed_token"

    async def delete_file(self, object_key: str) -> bool:
        target_path = self.base_dir / object_key
        if target_path.exists():
            target_path.unlink()
            return True
        return False


def get_storage_provider() -> BaseStorageProvider:
    return LocalStorageProvider()
