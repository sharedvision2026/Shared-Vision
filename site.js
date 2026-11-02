/* Shared Vision: the one small script for every page (site.js).
   It does three things, and the site works without it:
   1. Van stops: hides stops whose date has passed, marks today's stop, and folds the list on Home
      ("See all N stops" shows the rest once, moves focus to the first stop it showed, and goes away).
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
  toArray(document.querySelectorAll('[data-stops]')).forEach(function (box, n) {
    var list = box.querySelector('.stops-list');
    if (!list) return;
    var upcoming = toArray(list.children).filter(function (li) {
      var t = li.querySelector('time[datetime]');
      var date = t ? t.getAttribute('datetime') : '';
      if (date && date < today) { li.hidden = true; return false; }
      var when = li.querySelector('.stop-when');
      if (date === today && when) {
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
  });

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
