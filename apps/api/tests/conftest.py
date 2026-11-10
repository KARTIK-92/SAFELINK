import os
import sys
import pytest
from starlette.testclient import TestClient

# Ensure apps/api is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
settings.TESTING = True

from app.core.database import Base, sync_engine
from app.main import app


@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=sync_engine)
    Base.metadata.create_all(bind=sync_engine)
    yield
    Base.metadata.drop_all(bind=sync_engine)


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
