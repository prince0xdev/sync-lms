"""Add per-language video tracks to course modules."""
from alembic import op
import sqlalchemy as sa

revision = "0005_video_tracks"
down_revision = "0004_admin_role"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "video_tracks",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("module_id", sa.Uuid(), nullable=False),
        sa.Column("language", sa.String(length=10), nullable=False),
        sa.Column("object_key", sa.String(length=500), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False, server_default="video/mp4"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["module_id"], ["modules.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("module_id", "language", name="uq_video_tracks_module_language"),
    )
    op.create_index("ix_video_tracks_module_id", "video_tracks", ["module_id"])
    op.execute(sa.text("""
        INSERT INTO video_tracks (id, module_id, language, object_key, mime_type)
        SELECT gen_random_uuid(), modules.id, courses.language, modules.video_key, 'video/mp4'
        FROM modules
        JOIN courses ON courses.id = modules.course_id
        WHERE modules.video_key IS NOT NULL
    """))


def downgrade() -> None:
    op.drop_index("ix_video_tracks_module_id", table_name="video_tracks")
    op.drop_table("video_tracks")
