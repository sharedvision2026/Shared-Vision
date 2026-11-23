/* Shared Vision: live data for the website (Google Apps Script).

   What it does
   The website asks this script for two things and nothing else:
     1. The upcoming van stops, from every tab in "Scheie in MOTION Schedule" whose name starts with
        "Confirmed Events" (so a new "Confirmed Events Spring 2027" tab is picked up by itself).
     2. The totals on the Impact page, from the "Events" tab of "Shared Vision Metrics".
   Both sheets stay private. The script runs as you and sends out only the public part:
     - for a stop: its date, time, place (the "Partner Site" column) and address;
     - for the numbers: totals only, never one event's counts.
   Contacts, staff names, doctors, notes and per-event counts never leave the sheets.

   How a stop is chosen
     - It has a date (M/D/YYYY) and an address, and the date is today or later (Philadelphia time).
     - A row is left out if any cell to the right of the named columns says "postponed", "cancelled"
       or "rescheduling" (the team's notes column).

   Setup (once): see apps-script/README.md. After any change to this file, deploy a new version
   (Deploy > Manage deployments > edit > Version: New version) so the web address stays the same. */

var SCHEDULE_ID = '1eH8O8wZ6oV3yP2v9IPV_FhF5zLmb8xcJtW6EfNgQKLs';
var METRICS_ID = '1fhN2o2OTLRI-aVXOutweUuVRz792ZJOyVJX-AwJ6Vvw';
var SCHEDULE_TAB_PREFIX = 'Confirmed Events';
var METRICS_TAB = 'Events';
var TIME_ZONE = 'America/New_York';
var CACHE_SECONDS = 60; // a sheet edit reaches the site within about a minute

function doGet() {
  var cache = CacheService.getScriptCache();
  var json = cache.get('site-data');
  if (!json) {
    json = JSON.stringify(buildSiteData_());
    cache.put('site-data', json, CACHE_SECONDS);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function buildSiteData_() {
  var today = Utilities.formatDate(new Date(), TIME_ZONE, 'yyyy-MM-dd');
  var schedule = SpreadsheetApp.openById(SCHEDULE_ID);
  var tabs = schedule.getSheets()
    .filter(function (s) { return s.getName().indexOf(SCHEDULE_TAB_PREFIX) === 0; })
    .map(function (s) { return s.getDataRange().getDisplayValues(); });
  var metrics = SpreadsheetApp.openById(METRICS_ID).getSheetByName(METRICS_TAB);
  return {
    ok: true,
    updated: new Date().toISOString(),
    stops: stopsFromRows(tabs, today),
    impact: metrics ? impactFromRows(metrics.getDataRange().getDisplayValues()) : null
  };
}

/* Run this from the editor (select "testOutput", press Run) to see exactly what the website will get. */
function testOutput() {
  Logger.log(JSON.stringify(buildSiteData_(), null, 2));
}

/* ---------- The parts below are plain JavaScript, so they can be tested outside Google. ---------- */

function clean(v) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }

function columnIndex(headers, startsWith) {
  var want = startsWith.toLowerCase();
  for (var i = 0; i < headers.length; i++) {
    if (clean(headers[i]).toLowerCase().indexOf(want) === 0) return i;
  }
  return -1;
}

/* "12/2/2026" -> "2026-12-02"; anything else -> "" */
function isoDate(text) {
  var m = clean(text).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return '';
  var mo = +m[1], d = +m[2];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return '';
  return m[3] + '-' + (mo < 10 ? '0' : '') + mo + '-' + (d < 10 ? '0' : '') + d;
}

var SKIP_NOTE = /postpone|cancel|reschedul/i;

function stopsFromRows(tabs, today) {
  var stops = [];
  tabs.forEach(function (rows) {
    if (!rows || !rows.length) return;
    var h = rows[0];
    var col = {
      date: columnIndex(h, 'Date'),
      time: columnIndex(h, 'Time'),
      site: columnIndex(h, 'Partner Site'),
      name: columnIndex(h, 'Location Name'),
      address: columnIndex(h, 'Location Address')
    };
    if (col.date < 0 || col.address < 0) return;
    var named = 0;
    h.forEach(function (cell, i) { if (clean(cell)) named = i + 1; });
    rows.slice(1).forEach(function (r) {
      var date = isoDate(r[col.date]);
      var address = clean(r[col.address]);
      if (!date || !address || date < today) return;
      var notes = r.slice(named).join(' ');
      if (SKIP_NOTE.test(notes)) return;
      stops.push({
        date: date,
        time: col.time > -1 ? clean(r[col.time]) : '',
        place: clean(col.site > -1 && r[col.site] ? r[col.site] : (col.name > -1 ? r[col.name] : '')),
        address: address
      });
    });
  });
  stops.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  return stops;
}

function num(v) {
  var m = clean(v).replace(/,/g, '').match(/^\d+(\.\d+)?$/);
  return m ? Math.round(+m[0]) : 0;
}

/* "2.5 (7), 1.75 (3)" -> 10 */
function sumInParens(v) {
  var total = 0, re = /\((\d+)\)/g, m;
  while ((m = re.exec(clean(v)))) total += +m[1];
  return total;
}

/* "2 x cataract, 1 x dry eye" -> 3 */
function sumTimes(v) {
  var total = 0, re = /(\d+)\s*x\b/gi, m;
  while ((m = re.exec(clean(v)))) total += +m[1];
  return total;
}

/* "1: glaucoma (1)\n2: comprehensive exam (3)" -> [["glaucoma", 1], ["comprehensive exam", 3]] */
function conditionCounts(v) {
  var out = [];
  String(v == null ? '' : v).split(/\n/).forEach(function (line) {
    var m = line.match(/^\s*(?:\d+\s*[:.)]\s*)?(.+?)\s*\((\d+)\)\s*$/);
    if (!m) return;
    var name = m[1].toLowerCase().replace(/\s+/g, ' ').replace(/[\s.,;:]+$/, '').trim();
    if (name) out.push([name, +m[2]]);
  });
  return out;
}

function impactFromRows(rows) {
  if (!rows || !rows.length) return null;
  var h = rows[0];
  var col = {
    date: columnIndex(h, 'Date'),
    seen: columnIndex(h, 'Patients Seen'),
    scheduled: columnIndex(h, 'Patients scheduled for follow-up'),
    conditions: columnIndex(h, 'Conditions for follow-up'),
    glasses: columnIndex(h, 'Reading Glasses'),
    pamphlets: columnIndex(h, 'Educational Materials')
  };
  if (col.seen < 0) return null;
  var t = { events: 0, screened: 0, followUp: 0, scheduled: 0, glasses: 0, pamphlets: 0 };
  var byName = {};
  rows.slice(1).forEach(function (r) {
    if (col.date > -1 && !isoDate(r[col.date])) return; // only rows that are a dated event
    t.events++;
    t.screened += num(r[col.seen]);
    if (col.scheduled > -1) t.scheduled += num(r[col.scheduled]);
    if (col.glasses > -1) t.glasses += sumInParens(r[col.glasses]);
    if (col.pamphlets > -1) t.pamphlets += sumTimes(r[col.pamphlets]);
    if (col.conditions > -1) conditionCounts(r[col.conditions]).forEach(function (c) {
      byName[c[0]] = (byName[c[0]] || 0) + c[1];
      t.followUp += c[1];
    });
  });
  t.conditions = Object.keys(byName)
    .map(function (k) { return { name: k, count: byName[k] }; })
    .sort(function (a, b) { return b.count - a.count || (a.name < b.name ? -1 : 1); });
  return t;
}

if (typeof module !== 'undefined') {
  module.exports = { stopsFromRows: stopsFromRows, impactFromRows: impactFromRows, isoDate: isoDate };
}
