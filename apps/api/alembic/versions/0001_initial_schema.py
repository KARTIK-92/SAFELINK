"""Initial baseline schema

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-11-10 17:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Safe baseline creation; in app startup Base.metadata.create_all handles dynamic table creation
    pass


def downgrade() -> None:
    pass
