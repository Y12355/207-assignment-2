// assets/js/app.js
(function () {
  // ---- LocalStorage keys ----
  const KEY_USER = 'me_user';
  const KEY_EVENTS = 'me_events';
  const KEY_BOOKINGS = 'me_bookings';
  const KEY_COMMENTS = 'me_comments';

  // ---- Categories (English) ----
  const CATEGORIES = ['All', 'Classical', 'Indie', 'Jazz', 'Electronic', 'Pop', 'Rock'];

  // ---- Helpers ----
  function toDate(dateStr, timeStr) {
    // dateStr: YYYY-MM-DD, timeStr: HH:MM
    return new Date(`${dateStr}T${timeStr || '00:00'}:00`);
  }

  function computeStatus(ev) {
    if (ev.status === 'Cancelled') return 'Cancelled';
    if ((ev.ticketsAvailable ?? 0) <= 0) return 'Sold Out';
    const now = new Date();
    const end = toDate(ev.date, ev.endTime || ev.startTime || '00:00');
    return end < now ? 'Inactive' : 'Open';
  }

  function badgeClass(status) {
    switch (status) {
      case 'Open': return 'text-bg-success';
      case 'Sold Out': return 'text-bg-danger';
      case 'Cancelled': return 'text-bg-secondary';
      case 'Inactive': return 'text-bg-warning';
      default: return 'text-bg-light';
    }
  }

  function fmtDateTime(ev) {
    return `${ev.date} ${ev.startTime}${ev.endTime ? ' – ' + ev.endTime : ''}`;
  }

  function storageGet(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function storageSet(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  function uid(prefix) { return `${prefix}_${Math.random().toString(36).slice(2, 9)}`; }

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------
  const ME = {
    initDemoUser() {
      const u = storageGet(KEY_USER, null) || { id: 'u_demo', name: 'Demo User' };
      storageSet(KEY_USER, u);
    },

    // Seed demo data if empty (images are local under assets/img/)
    seedIfEmpty() {
      const seeded = storageGet(KEY_EVENTS, null);
      if (seeded && Array.isArray(seeded) && seeded.length) return;

      const demoUser = storageGet(KEY_USER, { id: 'u_demo', name: 'Demo User' });
      const events = [
        {
          id: 'e1',
          title: 'Indie Night Live',
          category: 'Indie',
          artistNames: 'Mike',
          venue: 'Room 1',
          date: '2025-09-20',
          startTime: '19:30',
          endTime: '21:30',
          capacity: 120,
          ticketsAvailable: 45,
          status: 'Open',
          imageUrl: 'assets/img/indie.jpg',
          description: 'Enjoy music.',
          ageRestriction: 'All-ages',
          createdBy: demoUser.id
        },
        {
          id: 'e2',
          title: 'Jazz Trio Evening',
          category: 'Jazz',
          artistNames: 'Jenny',
          venue: 'Room 2',
          date: '2025-09-12',
          startTime: '20:00',
          endTime: '22:00',
          capacity: 80,
          ticketsAvailable: 0,
          status: 'Open',
          imageUrl: 'assets/img/jazz.jpg',
          description: 'Appreciate music.',
          ageRestriction: '18+',
          createdBy: demoUser.id
        },
        {
          id: 'e3',
          title: 'Electronic Campus Party',
          category: 'Electronic',
          artistNames: 'Tom',
          venue: 'Room 3',
          date: '2025-10-01',
          startTime: '18:00',
          endTime: '23:00',
          capacity: 300,
          ticketsAvailable: 300,
          status: 'Open',
          imageUrl: 'assets/img/electronic.jpg',
          description: 'Enjoy music.',
          ageRestriction: 'All-ages',
          createdBy: demoUser.id
        },
        {
          id: 'e4',
          title: 'Pop Night Live',
          category: 'Pop',
          artistNames: 'Lucy',
          venue: 'Room 4',
          date: '2025-08-20',
          startTime: '17:30',
          endTime: '19:00',
          capacity: 100,
          ticketsAvailable: 12,
          status: 'Open',
          imageUrl: 'assets/img/pop.jpg',
          description: 'Enjoy music.',
          ageRestriction: 'All-ages',
          createdBy: demoUser.id
        },
        {
          id: 'e5',
          title: 'Classical String Quartet',
          category: 'Classical',
          artistNames: 'Alex',
          venue: 'Room 5',
          date: '2025-09-28',
          startTime: '19:00',
          endTime: '21:00',
          capacity: 200,
          ticketsAvailable: 10,
          status: 'Open',
          imageUrl: 'assets/img/classical.jpg',
          description: 'Appreciate music.',
          ageRestriction: 'All-ages',
          createdBy: demoUser.id
        },
        {
          id: 'e6',
          title: 'Rock Garage Fest',
          category: 'Rock',
          artistNames: 'Nina',
          venue: 'Room 6',
          date: '2025-09-15',
          startTime: '19:00',
          endTime: '22:00',
          capacity: 150,
          ticketsAvailable: 75,
          status: 'Open',
          imageUrl: 'assets/img/rock.jpg',
          description: 'Enjoy music.',
          ageRestriction: '18+',
          createdBy: demoUser.id
        }
      ];

      storageSet(KEY_EVENTS, events);
      storageSet(KEY_BOOKINGS, []);
      storageSet(KEY_COMMENTS, []);
    },

    // ------------------------------------------------------------------
    // Home page
    // ------------------------------------------------------------------
    initHomePage() {
      const events = storageGet(KEY_EVENTS, []);
      const tabs = document.getElementById('categoryTabs');
      const grid = document.getElementById('eventsGrid');
      const input = document.getElementById('searchInput');

      function renderTabs() {
        // Keep "All", then unique categories from data
        const cats = Array.from(new Set(['All', ...events.map(e => e.category)])).filter(Boolean);
        tabs.innerHTML = '';
        cats.forEach((c, idx) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `btn btn-sm me-2 ${idx === 0 ? 'btn-primary' : 'btn-outline-primary'}`;
          btn.textContent = c;
          btn.setAttribute('aria-pressed', idx === 0 ? 'true' : 'false');
          btn.addEventListener('click', () => {
            Array.from(tabs.querySelectorAll('button')).forEach(b => {
              b.className = 'btn btn-sm me-2 btn-outline-primary';
              b.setAttribute('aria-pressed', 'false');
            });
            btn.className = 'btn btn-sm me-2 btn-primary';
            btn.setAttribute('aria-pressed', 'true');
            currentCat = c;
            renderGrid();
          });
          tabs.appendChild(btn);
        });
      }

      function cardHTML(ev) {
        const status = computeStatus(ev);
        const badge = `<span class="badge ${badgeClass(status)}">${status}</span>`;
        return `
        <div class="col-12 col-sm-6 col-lg-4">
          <div class="card h-100 shadow-sm border-0">
            <div class="ratio ratio-16x9">
              <img class="card-img-top object-cover" src="${ev.imageUrl || ''}" alt="${ev.title}" />
            </div>
            <div class="card-body d-flex flex-column">
              <div class="d-flex align-items-center gap-2 mb-2">
                ${badge}
                <span class="badge text-bg-light">${ev.category}</span>
              </div>
              <h3 class="h6 card-title">${ev.title}</h3>
              <p class="card-text small text-muted mb-1">${ev.artistNames}</p>
              <p class="card-text small mb-2">${fmtDateTime(ev)} · ${ev.venue}</p>
              <div class="mt-auto d-grid">
                <a class="btn btn-outline-primary" href="event.html?id=${ev.id}">View details</a>
              </div>
            </div>
          </div>
        </div>`;
      }

      let currentCat = 'All';
      function renderGrid() {
        const q = (input.value || '').toLowerCase();
        const list = events.filter(ev => {
          const catOK = currentCat === 'All' || ev.category === currentCat;
          const qOK = !q || `${ev.title} ${ev.artistNames} ${ev.venue}`.toLowerCase().includes(q);
          return catOK && qOK;
        });
        grid.innerHTML = list.map(cardHTML).join('');
        const alert = document.getElementById('homeAlert');
        if (list.length === 0) {
          alert.classList.remove('d-none');
          alert.textContent = 'No matching events. Try different keywords or a category.';
        } else {
          alert.classList.add('d-none');
        }
      }

      input.addEventListener('input', renderGrid);
      renderTabs();
      renderGrid();
    },

    // ------------------------------------------------------------------
    // Event detail page
    // ------------------------------------------------------------------
    initEventPage() {
      const params = new URLSearchParams(location.search);
      const id = params.get('id');
      const events = storageGet(KEY_EVENTS, []);
      const ev = events.find(e => e.id === id);
      const user = storageGet(KEY_USER, null);

      const loading = document.getElementById('loadingState');
      const main = document.getElementById('eventMain');

      if (!ev) {
        if (loading) { loading.textContent = 'Event not found.'; }
        return;
      }

      // Basic info
      const status = computeStatus(ev);
      document.getElementById('eventImage').src = ev.imageUrl || '';
      document.getElementById('eventTitle').textContent = ev.title;
      const sb = document.getElementById('statusBadge');
      sb.textContent = status; sb.className = `badge ${badgeClass(status)}`;
      const cb = document.getElementById('categoryBadge');
      cb.textContent = ev.category;
      const age = document.getElementById('ageBadge');
      if (ev.ageRestriction) { age.textContent = ev.ageRestriction; age.classList.remove('d-none'); }
      document.getElementById('artistNames').textContent = ev.artistNames;
      document.getElementById('eventTime').textContent = fmtDateTime(ev);
      document.getElementById('venue').textContent = ev.venue;
      document.getElementById('capacityInfo').textContent = `Capacity ${ev.capacity} · Available ${ev.ticketsAvailable}`;
      document.getElementById('eventDesc').textContent = ev.description || '';

      // Booking
      const qty = document.getElementById('ticketQty');
      const btn = document.getElementById('bookBtn');
      const msg = document.getElementById('bookMsg');

      function setMsg(type, text) {
        msg.className = `alert alert-${type} mt-3`;
        msg.textContent = text; msg.classList.remove('d-none');
      }

      function disableBooking(reason) {
        qty.disabled = true; btn.disabled = true; setMsg('secondary', reason);
      }

      if (status === 'Cancelled') disableBooking('This event has been cancelled. Booking is unavailable.');
      else if (status === 'Sold Out') disableBooking('Sold out.');
      else if (status === 'Inactive') disableBooking('This event has ended or is inactive.');

      btn.addEventListener('click', () => {
        const n = parseInt(qty.value || '1', 10);
        if (!Number.isFinite(n) || n <= 0) { setMsg('warning', 'Please enter a valid quantity'); return; }
        if (n > ev.ticketsAvailable) { setMsg('danger', 'Exceeds tickets available'); return; }

        // Create booking
        const bookings = storageGet(KEY_BOOKINGS, []);
        const order = {
          id: uid('ord'),
          userId: (user || {}).id,
          eventId: ev.id,
          tickets: n,
          bookedAt: new Date().toISOString()
        };
        bookings.push(order);
        storageSet(KEY_BOOKINGS, bookings);

        // Deduct availability & update UI
        ev.ticketsAvailable -= n;
        storageSet(KEY_EVENTS, events);
        document.getElementById('capacityInfo').textContent =
          `Capacity ${ev.capacity} · Available ${ev.ticketsAvailable}`;
        setMsg('success', `Booking successful! Order ID ${order.id}`);

        const newStatus = computeStatus(ev);
        sb.textContent = newStatus; sb.className = `badge ${badgeClass(newStatus)}`;
        if (newStatus === 'Sold Out') disableBooking('Sold out.');
      });

      // Owner actions (demo only)
      if (user && ev.createdBy === user.id) {
        const ownerBox = document.getElementById('ownerActions');
        ownerBox.classList.remove('d-none');
        document.getElementById('editLink').addEventListener('click', (e) => {
          e.preventDefault();
          alert('Demo: navigate to edit page here.');
        });
      }

      // Comments
      const list = document.getElementById('commentsList');
      const cs = storageGet(KEY_COMMENTS, []);
      function renderComments() {
        const items = cs
          .filter(c => c.eventId === ev.id)
          .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
        list.innerHTML = items.map(c => `
          <div class="border rounded-3 p-3">
            <div class="d-flex justify-content-between small text-muted mb-1">
              <span>${c.authorName || 'Anonymous'}</span>
              <time>${new Date(c.postedAt).toLocaleString()}</time>
            </div>
            <p class="mb-0">${c.content.replace(/</g, '&lt;')}</p>
          </div>`).join('');
      }
      renderComments();

      const nameI = document.getElementById('commentName');
      const textI = document.getElementById('commentText');
      const postBtn = document.getElementById('commentBtn');
      const cMsg = document.getElementById('commentMsg');
      function setCMsg(type, text) {
        cMsg.className = `alert alert-${type} mt-3`;
        cMsg.textContent = text; cMsg.classList.remove('d-none');
      }

      postBtn.addEventListener('click', () => {
        const nm = (nameI.value || '').trim();
        const tx = (textI.value || '').trim();
        if (!tx) { setCMsg('warning', 'Comment cannot be empty'); return; }
        cs.push({
          id: uid('c'),
          eventId: ev.id,
          userId: (storageGet(KEY_USER) || {}).id,
          authorName: nm || 'Anonymous',
          content: tx,
          postedAt: new Date().toISOString()
        });
        storageSet(KEY_COMMENTS, cs);
        nameI.value = ''; textI.value = '';
        setCMsg('success', 'Posted');
        renderComments();
      });

      if (loading) { loading.hidden = true; }
      if (main) { main.hidden = false; }
    },

    // ------------------------------------------------------------------
    // Create page
    // ------------------------------------------------------------------
    initCreatePage() {
      const sel = document.getElementById('category');
      sel.innerHTML = CATEGORIES
        .filter(c => c !== 'All')
        .map(c => `<option value="${c}">${c}</option>`).join('');

      const form = document.getElementById('createForm');
      const msg = document.getElementById('createMsg');
      function setMsg(type, text) {
        msg.className = `alert alert-${type} mt-3`;
        msg.textContent = text; msg.classList.remove('d-none');
      }

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const ev = {
          id: uid('e'),
          title: document.getElementById('title').value.trim(),
          category: document.getElementById('category').value,
          artistNames: document.getElementById('artist').value.trim(),
          venue: document.getElementById('venue').value.trim(),
          date: document.getElementById('date').value,
          startTime: document.getElementById('start').value,
          endTime: document.getElementById('end').value,
          capacity: parseInt(document.getElementById('capacity').value, 10) || 0,
          ticketsAvailable: parseInt(document.getElementById('available').value, 10) || 0,
          status: 'Open',
          imageUrl: document.getElementById('image').value.trim(),
          description: document.getElementById('desc').value.trim(),
          ageRestriction: document.getElementById('age').value.trim(),
          createdBy: (storageGet(KEY_USER) || {}).id
        };

        if (!ev.title || !ev.artistNames || !ev.venue || !ev.date ||
            !ev.startTime || !ev.endTime || ev.capacity < 1) {
          setMsg('warning', 'Please fill in all required fields (*)');
          return;
        }
        if (ev.ticketsAvailable > ev.capacity) {
          setMsg('danger', 'Tickets available cannot exceed capacity');
          return;
        }

        const events = storageGet(KEY_EVENTS, []);
        events.push(ev); storageSet(KEY_EVENTS, events);
        setMsg('success', 'Published! Redirecting to details…');
        setTimeout(() => { location.href = `event.html?id=${ev.id}`; }, 600);
      });
    },

    // ------------------------------------------------------------------
    // Booking history page
    // ------------------------------------------------------------------
    initHistoryPage() {
      const list = document.getElementById('historyList');
      const empty = document.getElementById('historyEmpty');
      const user = storageGet(KEY_USER, null);
      const bookings = (storageGet(KEY_BOOKINGS, []))
        .filter(b => b.userId === (user || {}).id)
        .sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt));
      const events = storageGet(KEY_EVENTS, []);

      if (bookings.length === 0) { empty.classList.remove('d-none'); return; }

      list.innerHTML = bookings.map(b => {
        const ev = events.find(e => e.id === b.eventId) ||
                   { title: '(Deleted event)', imageUrl: '', venue: '', date: '', startTime: '' };
        return `
          <div class="border rounded-3 p-3 d-flex gap-3 align-items-center">
            <img src="${ev.imageUrl || ''}" alt="${ev.title}" class="thumb-rect rounded-2" />
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between align-items-center">
                <h3 class="h6 mb-0">${ev.title}</h3>
                <span class="badge ${badgeClass(computeStatus(ev))}">${computeStatus(ev)}</span>
              </div>
              <div class="small text-muted">${fmtDateTime(ev)} · ${ev.venue}</div>
              <div class="small">Order ID <code>${b.id}</code> · Tickets ${b.tickets}</div>
              <div class="small text-secondary">Booked at: ${new Date(b.bookedAt).toLocaleString()}</div>
            </div>
          </div>`;
      }).join('');
    }
  };

  // Expose
  window.ME = ME;
})();