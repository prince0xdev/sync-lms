from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.core.database import Base


class VideoTrack(Base):
    __tablename__ = "video_tracks"
    __table_args__ = (UniqueConstraint("module_id", "language", name="uq_video_tracks_module_language"),)

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    module_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("modules.id", ondelete="CASCADE"), index=True)
    language: Mapped[str] = mapped_column(String(10))
    object_key: Mapped[str] = mapped_column(String(500))
    mime_type: Mapped[str] = mapped_column(String(100), default="video/mp4")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    module: Mapped["Module"] = relationship(back_populates="video_tracks")
