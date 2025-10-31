from flask_wtf import FlaskForm
from wtforms import (
    StringField, PasswordField, IntegerField, DateField, TimeField,
    TextAreaField, SelectField, SubmitField
)
from wtforms.validators import DataRequired, Email, Length, NumberRange, URL, Optional

CATEGORY_CHOICES = [
    ("Classical", "Classical"),
    ("Indie", "Indie"),
    ("Jazz", "Jazz"),
    ("Electronic", "Electronic"),
    ("Pop", "Pop"),
    ("Rock", "Rock"),
]

AGE_CHOICES = [("All-ages", "All-ages"), ("18+", "18+")]

class LoginForm(FlaskForm):
    email = StringField("Email", validators=[DataRequired(), Email()])
    password = PasswordField("Password", validators=[DataRequired(), Length(min=4)])
    submit = SubmitField("Sign In")

class RegisterForm(FlaskForm):
    first_name = StringField("First Name", validators=[DataRequired(), Length(min=2, max=80)])
    surname = StringField("Surname", validators=[DataRequired(), Length(min=2, max=80)])
    email = StringField("Email", validators=[DataRequired(), Email(message="Invalid email address.")])
    password = PasswordField("Password", validators=[DataRequired(), Length(min=4)])
    contact_number = StringField("Contact Number", validators=[DataRequired()])
    street_address = StringField("Street Address", validators=[DataRequired()])
    submit = SubmitField("Create Account")

class EventForm(FlaskForm):
    title = StringField("Title", validators=[DataRequired()])
    category = SelectField("Category", choices=CATEGORY_CHOICES, validators=[DataRequired()])
    artist = StringField("Artist(s)", validators=[DataRequired()])
    venue = StringField("Venue", validators=[DataRequired()])
    date = DateField("Date", validators=[DataRequired()], format="%Y-%m-%d")
    start = TimeField("Start Time", validators=[DataRequired()], format="%H:%M")
    end = TimeField("End Time", validators=[DataRequired()], format="%H:%M")
    capacity = IntegerField("Capacity", validators=[DataRequired(), NumberRange(min=1)])
    available = IntegerField("Tickets for Sale", validators=[DataRequired(), NumberRange(min=0)])
    age = SelectField("Age Restriction", choices=AGE_CHOICES, validators=[Optional()])
    image = StringField("Cover Image URL", validators=[Optional(), URL()])
    desc = TextAreaField("Description", validators=[Optional(), Length(max=2000)])
    submit = SubmitField("Create Event")

class BookingForm(FlaskForm):
    tickets = IntegerField("Tickets", validators=[DataRequired(), NumberRange(min=1)])
    submit = SubmitField("Book Now")

class CommentForm(FlaskForm):
    content = TextAreaField("Comment", validators=[DataRequired(), Length(min=1, max=1000)])
    submit = SubmitField("Post Comment")