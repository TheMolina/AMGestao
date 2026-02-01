import pytest
from fastapi.testclient import TestClient
from sqlmodel import create_engine

from app import main
from app import database
from app.database import create_db_and_tables

@pytest.fixture
def client(tmp_path, monkeypatch):
    db_file = tmp_path / "test.db"
    # Create a temp sqlite file and replace the engine used by the app
    engine = create_engine(f"sqlite:///{db_file}", connect_args={"check_same_thread": False})
    monkeypatch.setattr(database, "engine", engine)
    # Create tables on the test engine
    create_db_and_tables()
    with TestClient(main.app) as client:
        yield client
