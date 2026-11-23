/* Shared Vision: the one small script for every page (site.js).
   It does three things, and the site works without it:
   1. Van stops: hides stops whose date has passed, marks today's stop, and folds the list on Home
      ("See all N stops" shows the rest once, moves focus to the first stop it showed, and goes away).
      With LIVE_URL set, it also redraws the van stops and the Impact numbers from the team's Google Sheets.
   2. Motion trigger: reveals data-fade, data-rise and data-unveil once, and starts data-draw (About and Impact only).
   3. Phone menu: closes on Escape, on a tap outside, and when focus leaves it.
   Load it at the end of <body>. Pages with hidden-until-seen motion also need the two-line "js" script in <head>. */
(function () {
  var root = document.documentElement;
  var toArray = function (list) { return Array.prototype.slice.call(list); };

  /* ---------- 1. Van stops ----------
     Each stop carries <time datetime="YYYY-MM-DD">. A stop is past once the reader's own calendar date is later
     than its date, so it stays listed through the whole of its day. data-stops-limit="3" shows the next three
     and adds a "See all stops" button for the rest. With JavaScript off, every stop shows. */
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var now = new Date();
  var today = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());

  var spanish = document.documentElement.lang === 'es';
  var setupStops = function (box, n) {
    var list = box.querySelector('.stops-list');
    if (!list) return;
    var oldMore = box.querySelector('.stops-more');
    if (oldMore) oldMore.remove();
    list.hidden = false;
    var upcoming = toArray(list.children).filter(function (li) {
      var t = li.querySelector('time[datetime]');
      var date = t ? t.getAttribute('datetime') : '';
      li.hidden = false;
      if (date && date < today) { li.hidden = true; return false; }
      var when = li.querySelector('.stop-when');
      if (date === today && when && !when.querySelector('.stop-today')) {
        var tag = document.createElement('span');
        tag.className = 'stop-today';
        tag.textContent = spanish ? 'Hoy' : 'Today';
        when.insertBefore(tag, when.firstChild);
      }
      return true;
    });

    var empty = box.querySelector('.stops-empty');
    if (empty) empty.hidden = upcoming.length > 0;
    if (!upcoming.length) list.hidden = true;

    var limit = parseInt(box.getAttribute('data-stops-limit'), 10);
    if (!limit || upcoming.length <= limit) return;
    var later = upcoming.slice(limit);
    later.forEach(function (li) { li.hidden = true; });
    if (!list.id) list.id = 'stops-list-' + n;
    /* One label, one job: the button shows the rest of the list, then steps aside. Keyboard and screen reader
       focus moves to the first stop it showed, so nobody has to go back up to find the new stops. */
    var more = document.createElement('button');
    more.type = 'button';
    more.className = 'btn-quiet stops-more';
    more.setAttribute('aria-controls', list.id);
    more.textContent = spanish ? 'Ver las ' + upcoming.length + ' paradas' : 'See all ' + upcoming.length + ' stops';
    more.addEventListener('click', function () {
      later.forEach(function (li) { li.classList.add('is-new'); li.hidden = false; });
      var first = later[0].querySelector('.stop-date') || later[0];
      first.setAttribute('tabindex', '-1');
      first.focus({ preventScroll: true });
      more.remove();
    });
    list.parentNode.insertBefore(more, list.nextSibling);
  };
  var stopBoxes = toArray(document.querySelectorAll('[data-stops]'));
  stopBoxes.forEach(setupStops);

  /* ---------- 1b. Live data from the team's Google Sheets ----------
     LIVE_URL is the web address of the Google Apps Script in apps-script/Code.gs (see apps-script/README.md).
     The script reads the schedule and the metrics sheet and sends only upcoming stops and totals. When it
     answers, the van stops and the Impact numbers are redrawn from it; until then, or if it never answers,
     the stops and numbers written in the HTML stay. The last answer is kept in this browser so a repeat visit
     shows it at once. Leave LIVE_URL empty to turn this off. */
  var LIVE_URL = 'https://script.google.com/macros/s/AKfycbzH2zplFdmSaIijZ-pC-fBbar8Mi_4bIsyC2mVhSsLeQloRsnwbz1J4A0Tl6OSSQoCE/exec';
  /* "followUp" counts the cases in the sheet's "Conditions for follow-up" column (how the Impact page has always
     counted); "scheduled" counts the "Patients scheduled for follow-up" column instead. */
  var FOLLOW_UP_FIELD = 'followUp';

  var DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  var MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  var dayText = function (iso) {
    var p = iso.split('-'), d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])), wd = d.getUTCDay(), m = +p[1] - 1, day = +p[2];
    return spanish ? DAYS_ES[wd] + ' ' + day + ' de ' + MONTHS_ES[m] : DAYS_EN[wd] + ', ' + MONTHS_EN[m] + ' ' + day;
  };

  /* "10am-4pm" -> "10 am to 4 pm" / "De 10 a. m. a 4 p. m."; "3-7pm" -> "3 to 7 pm" / "De 3 a 7 p. m."
     Anything it cannot read is shown just as the sheet has it. */
  var timeText = function (raw) {
    var parts = String(raw || '').toLowerCase().replace(/\s+/g, '').replace(/\./g, '').split(/-|–|—|to/);
    var read = function (s) {
      if (s === 'noon') return { t: '12', m: 'pm' };
      var m = s.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)?$/);
      return m && +m[1] >= 1 && +m[1] <= 12 ? { t: m[1] + (m[2] && m[2] !== '00' ? ':' + m[2] : ''), m: m[3] || '' } : null;
    };
    var mer = function (m) { return spanish ? (m === 'am' ? 'a. m.' : 'p. m.') : m; };
    var a = read(parts[0] || ''), b = parts[1] ? read(parts[1]) : null;
    if (!a || (parts[1] && !b) || parts.length > 2) return String(raw || '');
    if (!b) {
      if (!a.m) return String(raw || '');
      return spanish ? 'Desde la' + (a.t === '1' ? ' ' : 's ') + a.t + ' ' + mer(a.m) : 'Starts at ' + a.t + ' ' + a.m;
    }
    if (!b.m) return String(raw || '');
    if (!a.m) a.m = b.m;
    if (spanish) return 'De ' + a.t + (a.m === b.m ? '' : ' ' + mer(a.m)) + ' a ' + b.t + ' ' + mer(b.m);
    return a.t + (a.m === b.m ? '' : ' ' + a.m) + ' to ' + b.t + ' ' + b.m;
  };

  var el = function (tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };

  var stopItem = function (s) {
    var li = el('li', 'stop');
    var when = el('div', 'stop-when'), h = el('h3', 'stop-date display'), t = el('time', null, dayText(s.date));
    t.setAttribute('datetime', s.date);
    h.appendChild(t); when.appendChild(h);
    if (s.time) when.appendChild(el('p', 'stop-time', timeText(s.time)));
    var where = el('div', 'stop-where');
    if (s.place) where.appendChild(el('p', 'stop-place', s.place));
    where.appendChild(el('p', 'stop-address', s.address));
    var a = el('a', 'stop-map');
    a.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s.address);
    a.target = '_blank'; a.rel = 'noopener';
    var outer = el('span'), b = el('b', null, spanish ? 'Mapa' : 'Map');
    outer.appendChild(b);
    outer.appendChild(el('span', 'sr-only', (spanish ? ' de ' : ' for ') + (s.place || s.address)));
    outer.appendChild(document.createTextNode(spanish ? ', se abre en otra página' : ', opens a new page'));
    a.appendChild(outer);
    li.appendChild(when); li.appendChild(where); li.appendChild(a);
    return li;
  };

  var drawStops = function (stops) {
    stopBoxes.forEach(function (box, n) {
      var list = box.querySelector('.stops-list');
      if (!list) return;
      while (list.firstChild) list.removeChild(list.firstChild);
      stops.forEach(function (s) { list.appendChild(stopItem(s)); });
      setupStops(box, n);
    });
  };

  /* Impact page. Condition names and their plain meanings: the sheet's wording on the left. A condition not on
     this list still shows, under the sheet's own name, without a meaning line. */
  var CONDITIONS = {
    'comprehensive exam': ['Comprehensive exam', 'A full eye exam'],
    'cataract': ['Cataract', 'Clouding of the lens'],
    'glaucoma': ['Glaucoma', 'A disease of the optic nerve'],
    'high myopia': ['High myopia', 'Very nearsighted'],
    'keratoconus, severe astigmatism': ['Keratoconus or severe astigmatism', 'A cornea that bends light unevenly']
  };
  var conditionLabel = function (name) {
    return CONDITIONS[name] || CONDITIONS[name.replace(/s$/, '')] || [name.charAt(0).toUpperCase() + name.slice(1), ''];
  };
  var headline = function (n, of) {
    var r = of ? n / of : 0;
    if (r >= 0.9) return 'Almost everyone needed more care.';
    if (r >= 0.7) return 'Most needed more care.';
    if (r > 0.55) return 'More than half needed more care.';
    if (r >= 0.45) return 'About half needed more care.';
    if (r >= 0.38) return 'Nearly half needed more care.';
    if (r >= 0.3) return 'About 1 in 3 needed more care.';
    return 'Some needed more care.';
  };

  var drawImpact = function (d) {
    var block = document.querySelector('[data-live-impact]');
    if (!block || !d || !(d.screened > 0)) return;
    var n = Math.min(d[FOLLOW_UP_FIELD] || 0, d.screened), of = d.screened;
    var set = function (key, text) {
      toArray(block.querySelectorAll('[data-live="' + key + '"]')).forEach(function (e) { e.textContent = text; });
    };
    var meter = block.querySelector('.meter-block');
    if (meter) { meter.style.setProperty('--n', n); meter.style.setProperty('--of', of); }
    set('headline', headline(n, of));
    set('followup', String(n));
    set('screened', String(of));
    set('glasses', String(d.glasses || 0));
    set('pamphlets', String(d.pamphlets || 0));
    var ul = block.querySelector('.conditions ul');
    var rows = (d.conditions || []).filter(function (c) { return c && c.count > 0 && c.name; });
    if (!ul || !rows.length) return;
    ul.style.setProperty('--max', rows[0].count);
    while (ul.firstChild) ul.removeChild(ul.firstChild);
    rows.forEach(function (c, k) {
      var label = conditionLabel(c.name);
      var li = el('li');
      li.style.setProperty('--n', c.count); li.style.setProperty('--k', k);
      var name = el('span', 'c-name', label[0]);
      if (label[1]) name.appendChild(el('span', null, label[1]));
      var bar = el('span', 'c-bar'); bar.setAttribute('aria-hidden', 'true');
      var count = el('span', 'c-num display num', String(c.count));
      count.appendChild(el('span', 'sr-only', c.count === 1 ? ' person' : ' people'));
      li.appendChild(name); li.appendChild(bar); li.appendChild(count);
      ul.appendChild(li);
    });
  };

  var useLive = function (d) {
    if (!d || d.ok !== true) return;
    if (Array.isArray(d.stops)) {
      drawStops(d.stops.filter(function (s) { return s && /^\d{4}-\d{2}-\d{2}$/.test(s.date) && s.address; }));
    }
    if (d.impact) drawImpact(d.impact);
  };

  if (LIVE_URL && (stopBoxes.length || document.querySelector('[data-live-impact]'))) {
    var KEY = 'sv-live-data';
    try { useLive(JSON.parse(window.localStorage.getItem(KEY))); } catch (e) { /* no saved copy */ }
    if (window.fetch) {
      fetch(LIVE_URL, { credentials: 'omit' })
        .then(function (r) { return r.ok ? r.text() : null; })
        .then(function (text) {
          if (!text) return;
          var d = JSON.parse(text);
          useLive(d);
          try { if (d && d.ok === true) window.localStorage.setItem(KEY, text); } catch (e) { /* storage blocked */ }
        })
        .catch(function () { /* keep what the page already shows */ });
    }
  }

  /* ---------- 2. Motion trigger (About and Impact) ----------
     Reveal each element once, when it reaches the lower part of the window, so the motion plays where the reader
     is looking. Items that arrive in the same moment get a short stagger (75ms apart, in reading order). Anything
     the reader jumps past (a link, a fast fling) is revealed at once, so nothing is ever left hidden.
     data-draw starts once the element named by its value (or the block itself) is fully in view, or has
     scrolled into the top third of the window. */
  if (root.classList.contains('js')) {
    window.svReveal = true;
    var pending = toArray(document.querySelectorAll('[data-fade], [data-rise], [data-unveil]'));
    var draws = toArray(document.querySelectorAll('[data-draw]'));
    var ticking = false;
    var reveal = function (el, i) { el.style.setProperty('--i', i); el.classList.add('is-in'); };
    var loaded = false;
    var check = function () {
      ticking = false;
      /* on load, anything already inside the window shows; after that, items reveal as they pass 88% of it */
      var vh = window.innerHeight, line = loaded ? vh * 0.88 : vh, batch = 0;
      loaded = true;
      pending = pending.filter(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top >= line) return true;
        reveal(el, r.bottom < 0 ? 0 : Math.min(batch++, 3));
        return false;
      });
      draws = draws.filter(function (el) {
        var sel = el.getAttribute('data-draw');
        var m = ((sel && el.querySelector(sel)) || el).getBoundingClientRect();
        if (m.bottom <= vh * 0.96 || m.top < vh * 0.3) { el.classList.add('is-drawn'); return false; }
        return true;
      });
      if (!pending.length && !draws.length) { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); }
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(check); } };
    if (pending.length || draws.length) {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      /* a keyboard user who tabs into something that has not arrived yet sees it at once, and it stays shown */
      document.addEventListener('focusin', function (e) {
        var el = e.target.closest && e.target.closest('[data-fade], [data-rise]');
        if (el && pending.indexOf(el) > -1) { el.style.setProperty('--i', 0); el.classList.add('is-in'); pending.splice(pending.indexOf(el), 1); }
      });
      window.addEventListener('beforeprint', function () {
        pending.forEach(function (el) { el.classList.add('is-in'); }); pending = [];
        draws.forEach(function (el) { el.classList.add('is-drawn'); }); draws = [];
      });
      check();
    }
  }

  /* ---------- 3. Phone menu ----------
     Works as a plain <details> without this. */
  var menu = document.querySelector('.menu');
  if (menu) {
    var summary = menu.querySelector('summary');
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.open) { menu.open = false; summary.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (menu.open && !menu.contains(e.target)) menu.open = false;
    });
    menu.addEventListener('focusout', function (e) {
      if (menu.open && e.relatedTarget && !menu.contains(e.relatedTarget)) menu.open = false;
    });
    toArray(menu.querySelectorAll('.menu-panel a')).forEach(function (a) {
      a.addEventListener('click', function () { menu.open = false; });
    });
  }

  /* An in-page link to a section marked tabindex="-1" also moves keyboard focus there, so keyboard and screen
     reader users land where the eye does (the hero button to the van stops, the jump links on For patients). */
  toArray(document.querySelectorAll('a[href^="#"]')).forEach(function (a) {
    var target = document.getElementById(a.getAttribute('href').slice(1));
    if (!target || target.getAttribute('tabindex') !== '-1') return;
    a.addEventListener('click', function () {
      setTimeout(function () { target.focus({ preventScroll: true }); }, 0);
    });
  });
})();
