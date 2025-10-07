from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from enum import Enum
from sqlalchemy import Enum as SAEnum

db = SQLAlchemy()


class EventStatus(Enum):
    OPEN = "Open"
    INACTIVE = "Inactive"
    SOLDOUT = "Sold Out"
    CANCELLED = "Cancelled"


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Event(db.Model):
    __tablename__ = "events"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(160), nullable=False)
    category = db.Column(db.String(40), nullable=False)
    artist_names = db.Column(db.String(160), nullable=False)
    venue = db.Column(db.String(160), nullable=False)

    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)

    capacity = db.Column(db.Integer, nullable=False)
    tickets_available = db.Column(db.Integer, nullable=False)
    image_url = db.Column(db.Text, default="")
    description = db.Column(db.Text, default="")
    age_restriction = db.Column(db.String(20), default="")

    status = db.Column(SAEnum(EventStatus), default=EventStatus.OPEN, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    comments = db.relationship("Comment", backref="event", lazy=True)


class Booking(db.Model):
    __tablename__ = "bookings"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    booked_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="bookings")
    event_rel = db.relationship("Event", backref="bookings")


class Comment(db.Model):
    __tablename__ = "comments"
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    author_name = db.Column(db.String(80), default="")
    content = db.Column(db.Text, nullable=False)
    posted_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="comments")