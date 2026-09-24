"""Les modèle de départ."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("users",
        sa.Column("id", sa.Uuid(), nullable=False), sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False), sa.Column("first_name", sa.String(length=100), nullable=False),
        sa.Column("last_name", sa.String(length=100), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False), sa.PrimaryKeyConstraint("id"))
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_table("courses",
        sa.Column("id", sa.Uuid(), nullable=False), sa.Column("title", sa.String(length=200), nullable=False), sa.Column("slug", sa.String(length=220), nullable=False),
        sa.Column("description", sa.Text(), nullable=False), sa.Column("instructor", sa.String(length=200), nullable=False), sa.Column("language", sa.String(length=10), nullable=False),
        sa.Column("level", sa.String(length=30), nullable=False), sa.Column("thumbnail_key", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False), sa.PrimaryKeyConstraint("id"))
    op.create_index("ix_courses_slug", "courses", ["slug"], unique=True)
    op.create_table("modules",
        sa.Column("id", sa.Uuid(), nullable=False), sa.Column("course_id", sa.Uuid(), nullable=False), sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False), sa.Column("position", sa.Integer(), nullable=False), sa.Column("duration_seconds", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"), sa.PrimaryKeyConstraint("id"), sa.UniqueConstraint("course_id", "position", name="uq_modules_course_position"))
    op.create_index("ix_modules_course_id", "modules", ["course_id"])
    op.create_table("audio_tracks",
        sa.Column("id", sa.Uuid(), nullable=False), sa.Column("module_id", sa.Uuid(), nullable=False), sa.Column("language", sa.String(length=10), nullable=False),
        sa.Column("object_key", sa.String(length=500), nullable=False), sa.Column("mime_type", sa.String(length=100), nullable=False), sa.Column("duration_seconds", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["module_id"], ["modules.id"], ondelete="CASCADE"), sa.PrimaryKeyConstraint("id"), sa.UniqueConstraint("module_id", "language", name="uq_audio_tracks_module_language"))
    op.create_index("ix_audio_tracks_module_id", "audio_tracks", ["module_id"])
    op.create_table("enrollments",
        sa.Column("id", sa.Uuid(), nullable=False), sa.Column("user_id", sa.Uuid(), nullable=False), sa.Column("course_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"), sa.UniqueConstraint("user_id", "course_id", name="uq_enrollments_user_course"))
    op.create_index("ix_enrollments_course_id", "enrollments", ["course_id"])
    op.create_index("ix_enrollments_user_id", "enrollments", ["user_id"])
    op.create_table("module_progress",
        sa.Column("id", sa.Uuid(), nullable=False), sa.Column("user_id", sa.Uuid(), nullable=False), sa.Column("module_id", sa.Uuid(), nullable=False),
        sa.Column("completed", sa.Boolean(), nullable=False), sa.Column("progress_seconds", sa.Integer(), nullable=False), sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["module_id"], ["modules.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"), sa.UniqueConstraint("user_id", "module_id", name="uq_module_progress_user_module"))
    op.create_index("ix_module_progress_module_id", "module_progress", ["module_id"])
    op.create_index("ix_module_progress_user_id", "module_progress", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_module_progress_user_id", table_name="module_progress")
    op.drop_index("ix_module_progress_module_id", table_name="module_progress")
    op.drop_table("module_progress")
    op.drop_index("ix_enrollments_user_id", table_name="enrollments")
    op.drop_index("ix_enrollments_course_id", table_name="enrollments")
    op.drop_table("enrollments")
    op.drop_index("ix_audio_tracks_module_id", table_name="audio_tracks")
    op.drop_table("audio_tracks")
    op.drop_index("ix_modules_course_id", table_name="modules")
    op.drop_table("modules")
    op.drop_index("ix_courses_slug", table_name="courses")
    op.drop_table("courses")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
