import os
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, flash, session, abort
from werkzeug.exceptions import NotFound

from website.config import Config
from website.models import db, User, Event, Booking, Comment, EventStatus
from website.forms import LoginForm, RegisterForm, EventForm, BookingForm, CommentForm

app = Flask(__name__, instance_relative_config=True)
app.config.from_object(Config)

os.makedirs(app.instance_path, exist_ok=True)
db.init_app(app)

@app.context_processor
def inject_user():
    user_id = session.get('user_id')
    if user_id:
        user = User.query.get(user_id)
        return dict(user=user)
    return dict(user=None)

def login_required():
    if 'user_id' not in session:
        flash("Please log in to access this page.", "warning")
        return False
    return True

def is_owner(event):
    user_id = session.get('user_id')
    return user_id and event.created_by == user_id

@app.route("/")
def index():
    q = request.args.get("q", "").strip().lower()
    cat = request.args.get("cat", "All")
    query = Event.query
    if cat != "All":
        query = query.filter(Event.category == cat)
    if q:
        like = f"%{q}%"
        query = query.filter(
            (Event.title.ilike(like)) |
            (Event.artist_names.ilike(like)) |
            (Event.venue.ilike(like))
        )
    now = datetime.now().date()
    events = query.filter(Event.date >= now).order_by(Event.date.asc()).all()
    categories = ["All", "Classical", "Indie", "Jazz", "Electronic", "Pop", "Rock"]
    return render_template("index.html", events=events, q=q, cat=cat, categories=categories)

@app.route("/event/<int:event_id>", methods=["GET", "POST"])
def event_detail(event_id):
    ev = Event.query.get_or_404(event_id)
    book_form = BookingForm()
    comment_form = CommentForm()
    if request.method == "POST":
        if not login_required():
            return redirect(url_for("login"))
        user_id = session['user_id']
        if "book" in request.form:
            if ev.status != EventStatus.OPEN:
                flash("This event cannot be booked at the moment.", "warning")
            elif ev.tickets_available <= 0:
                flash("This event is sold out.", "warning")
            elif book_form.validate_on_submit():
                n = book_form.tickets.data
                if n > ev.tickets_available:
                    flash(f"Only {ev.tickets_available} tickets left.", "danger")
                else:
                    bk = Booking(user_id=user_id, event_id=ev.id, quantity=n)
                    ev.tickets_available -= n
                    if ev.tickets_available == 0:
                        ev.status = EventStatus.SOLDOUT
                    db.session.add(bk)
                    db.session.commit()
                    flash("Booking successful!", "success")
                    return redirect(url_for("history"))
        elif "comment" in request.form:
            if comment_form.validate_on_submit():
                user = User.query.get(user_id)
                author_full_name = f"{user.first_name} {user.surname}"
                
                c = Comment(
                    event_id=ev.id,
                    user_id=user_id,
                    author_name=author_full_name,
                    content=comment_form.content.data.strip()
                )
                db.session.add(c)
                db.session.commit()
                flash("Comment posted.", "success")
                return redirect(url_for("event_detail", event_id=ev.id))
    comments = Comment.query.filter_by(event_id=ev.id).order_by(Comment.posted_at.desc()).all()
    return render_template("event_detail.html", ev=ev, book_form=book_form, comment_form=comment_form, comments=comments, is_owner=is_owner(ev))

@app.route("/create", methods=["GET", "POST"])
def create_event():
    if not login_required():
        return redirect(url_for("login"))
    form = EventForm()
    if form.validate_on_submit():
        ev = Event(
            title=form.title.data.strip(), category=form.category.data, artist_names=form.artist.data.strip(),
            venue=form.venue.data.strip(), date=form.date.data, start_time=form.start.data, end_time=form.end.data,
            capacity=form.capacity.data, tickets_available=form.available.data, image_url=form.image.data.strip(),
            description=form.desc.data.strip(), age_restriction=form.age.data, created_by=session['user_id'], status=EventStatus.OPEN
        )
        db.session.add(ev)
        db.session.commit()
        flash("Event created successfully!", "success")
        return redirect(url_for("event_detail", event_id=ev.id))
    return render_template("create_event.html", form=form)

@app.route("/event/<int:event_id>/edit", methods=["GET", "POST"])
def edit_event(event_id):
    if not login_required():
        return redirect(url_for("login"))
    event = Event.query.get_or_404(event_id)
    if not is_owner(event):
        flash("You are not authorized to edit this event.", "danger")
        return redirect(url_for('event_detail', event_id=event.id))
    form = EventForm(obj=event)
    if form.validate_on_submit():
        form.populate_obj(event)
        db.session.commit()
        flash("Event updated successfully!", "success")
        return redirect(url_for('event_detail', event_id=event.id))
    return render_template("edit_event.html", form=form, event_id=event.id)

@app.route("/my_events")
def my_events():
    if not login_required():
        return redirect(url_for("login"))
    user_id = session['user_id']
    events = Event.query.filter_by(created_by=user_id).order_by(Event.date.desc()).all()
    return render_template("my_events.html", events=events)

@app.route("/event/<int:event_id>/cancel", methods=["POST"])
def cancel_event(event_id):
    if not login_required(): return abort(401)
    event = Event.query.get_or_404(event_id)
    if not is_owner(event): return abort(403)
    event.status = EventStatus.CANCELLED
    db.session.commit()
    flash(f"Event '{event.title}' has been cancelled.", "success")
    return redirect(url_for("my_events"))

@app.route("/event/<int:event_id>/reactivate", methods=["POST"])
def reactivate_event(event_id):
    if not login_required(): return abort(401)
    event = Event.query.get_or_404(event_id)
    if not is_owner(event): return abort(403)
    event.status = EventStatus.OPEN
    db.session.commit()
    flash(f"Event '{event.title}' has been reactivated.", "success")
    return redirect(url_for("my_events"))

@app.route("/history")
def history():
    if not login_required(): return redirect(url_for("login"))
    user_id = session['user_id']
    bookings = Booking.query.filter_by(user_id=user_id).order_by(Booking.booked_at.desc()).all()
    return render_template("history.html", bookings=bookings)

@app.route("/login", methods=["GET", "POST"])
def login():
    if 'user_id' in session: return redirect(url_for("index"))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data.strip().lower()).first()
        if user and user.password == form.password.data:
            session['user_id'] = user.id
            flash("Logged in successfully.", "success")
            return redirect(url_for("index"))
        else:
            flash("Invalid email or password.", "danger")
    return render_template("login.html", form=form)

@app.route("/register", methods=["GET", "POST"])
def register():
    if 'user_id' in session: return redirect(url_for("index"))
    form = RegisterForm()
    if form.validate_on_submit():
        email = form.email.data.strip().lower()
        if User.query.filter_by(email=email).first():
            flash("This email is already registered.", "danger")
        else:
            new_user = User(
                first_name=form.first_name.data.strip(),
                surname=form.surname.data.strip(),
                email=email,
                password=form.password.data,
                contact_number=form.contact_number.data.strip(),
                street_address=form.street_address.data.strip()
            )
            db.session.add(new_user)
            db.session.commit()
            flash("Account created successfully! Please log in.", "success")
            return redirect(url_for("login"))
    return render_template("register.html", form=form)

@app.route("/logout")
def logout():
    session.pop('user_id', None)
    flash("You have been successfully logged out.", "success")
    return redirect(url_for("index"))

@app.errorhandler(404)
def not_found(e: NotFound):
    return render_template("404.html"), 404

@app.errorhandler(500)
def internal_server_error(e):
    db.session.rollback()
    return render_template("500.html"), 500

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)