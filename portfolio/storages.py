from pathlib import Path

from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.utils.deconstruct import deconstructible


@deconstructible
class ProjectStaticStorage(FileSystemStorage):
    def __init__(self, location: str | None = None, base_url: str | None = None):
        upload_dir = Path(getattr(settings, "PROJECT_COVER_UPLOAD_DIR", Path(settings.BASE_DIR) / "static" / "images" / "projects"))
        super().__init__(
            location=location or str(upload_dir),
            base_url=base_url or "/static/images/projects/",
        )


project_cover_storage = ProjectStaticStorage()
