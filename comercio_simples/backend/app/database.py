from sqlmodel import create_engine, SQLModel, Session
from sqlmodel import SQLModel

DATABASE_URL = "sqlite:///./database.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

from contextlib import contextmanager

@contextmanager
def get_session():
    with Session(engine) as session:
        yield session
