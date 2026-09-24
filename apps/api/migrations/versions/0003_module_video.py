"""Ajoute la référence de la vidéo des modules."""
from alembic import op
import sqlalchemy as sa

revision = "0003_module_video"
down_revision = "0002_user_sessions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("modules", sa.Column("video_key", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("modules", "video_key")
