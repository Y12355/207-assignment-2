from datetime import date, time, timedelta
from app import app, db
from models import Event, User, EventStatus

with app.app_context():
    db.drop_all()
    db.create_all()

    u = User(
        first_name='Demo',
        surname='User',
        email='demo@example.com',
        password='password123',
        contact_number='0400123456',
        street_address='123 Example St, Brisbane QLD 4000'
    )
    db.session.add(u)
    db.session.commit()

    base = date.today() + timedelta(days=5)

    def add_event(title, cat, artist, venue, d_offset, cap, avail, img, age='All-ages', status=None):
        e = Event(
            title=title,
            category=cat,
            artist_names=artist,
            venue=venue,
            date=base + timedelta(days=d_offset),
            start_time=time(19, 0),
            end_time=time(21, 0),
            capacity=cap,
            tickets_available=avail,
            status=(status or EventStatus.OPEN),
            image_url=f"/static/img/{img}",
            description="Enjoy the great music and have a wonderful night!",
            age_restriction=age,
            created_by=u.id
        )
        db.session.add(e)

    add_event("Classical Night", "Classical", "Mike",  "Room 1", 0, 200,  50, "classical.jpg")
    add_event("Indie Live",      "Indie",     "Jenny", "Room 2", 2, 150,  80, "indie.jpg")
    add_event("Jazz Trio",       "Jazz",      "Tom",   "Room 3", 4,  80,   0, "jazz.jpg", status=EventStatus.SOLDOUT)
    add_event("EDM Party",       "Electronic","Nova",  "Room 4", 6, 300, 300, "electronic.jpg")
    add_event("Pop Show",        "Pop",       "Amy",   "Room 5", 8, 180,  30, "pop.jpg")
    add_event("Rock Fest",       "Rock",      "Riffs", "Room 6",10, 220, 120, "rock.jpg")
    
    add_event("Cancelled Concert", "Rock", "No Show", "Venue X", 12, 100, 100, "rock.jpg", status=EventStatus.CANCELLED)

    db.session.commit()
    print("✅ Database seeded successfully.")