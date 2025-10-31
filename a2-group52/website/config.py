import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "change-me")
    BASE_DIR = os.path.dirname(__file__)
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "sqlite:///" + os.path.join(BASE_DIR, "events.db")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    WTF_CSRF_ENABLED = True