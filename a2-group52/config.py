import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "a-very-secret-key-that-you-should-change")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "sqlite:///" + os.path.join(os.getcwd(), "instance", "events.db")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    WTF_CSRF_ENABLED = True