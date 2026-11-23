# Live updates from the Google Sheets

The website reads two Google Sheets each time someone opens a page:

| Sheet | Tab | What the site shows |
|---|---|---|
| Scheie in MOTION Schedule | every tab whose name starts with **Confirmed Events** | Upcoming van stops on Home and For patients (English and Spanish) |
| Shared Vision Metrics | **Events** | The numbers on Impact |

The sheets stay private. A small Google Apps Script (`Code.gs` in this folder) runs under your Google account, reads the sheets, and hands the website only the public part: each upcoming stop's date, time, place and address, and the totals. Contacts, staff, doctors, notes and per-event counts are never sent.

An edit to a sheet shows on the site within about a minute. If the script ever fails to answer, the site shows the stops and numbers written in its HTML instead.

## Set it up (once, about 5 minutes)

Use a Google account that can open both sheets.

1. Go to [script.google.com](https://script.google.com) and click **New project**. Name it "Shared Vision website data".
2. Delete what is in the editor, paste in all of `Code.gs` from this folder, and click **Save**.
3. Check it: choose **testOutput** in the function menu at the top and click **Run**. Google asks you to allow access to your spreadsheets; allow it. The log at the bottom shows exactly what the website will get.
4. Click **Deploy > New deployment**. Click the gear next to "Select type" and choose **Web app**. Set:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).
6. Put that address in `site.js`, on the line `var LIVE_URL = '';` (or give it to Claude and ask it to do so).

"Anyone" means anyone with the address can get the same public list and totals the website shows, nothing more.

## How to fill in the sheets so the site reads them right

**Schedule (Confirmed Events tabs)**
- **Date** as month/day/year, for example `12/13/2026`. Check the year: a stop dated in the past never shows.
- **Time** like `10am-4pm`, `3-7pm` or `5:30pm-7:30pm`. The site turns it into "10 am to 4 pm" and "De 10 a. m. a 4 p. m.". Anything else is shown just as typed.
- **Partner Site** is the place name patients see (if it is empty, Location Name is used). **Location Address** is shown and used for the map link. A row with no address does not show.
- To hide a stop that is off, write "Postponed" or "Cancelled" in the notes column at the end of the row (any cell to the right of the named columns).
- Only Confirmed tabs are read. Potential and Future events never show.
- Starting a new term: add a tab named "Confirmed Events Spring 2027" (any name starting with "Confirmed Events"). It is picked up by itself.

**Metrics (Events tab)**
- One row per event, with a date in "Date of Event". Rows without a date are skipped.
- **Patients Seen**: a number.
- **Conditions for follow-up**: one per line, like `1: glaucoma (2)`. The number in parentheses is counted.
- **Reading Glasses provided**: like `2.5 (7), 1.75 (3)`. The numbers in parentheses are added up.
- **Educational Materials**: like `2 x cataract, 1 x glaucoma`. The numbers before "x" are added up.
- Keep the column headings as they are; the script finds the columns by their names.

A condition the website does not know yet shows under the sheet's own name with no plain-words line. To add the plain-words line, add it to `CONDITIONS` in `site.js` (ask someone on the clinical side to check the wording).

## Changing the script later

Edit it in the Apps Script editor, then **Deploy > Manage deployments**, click the pencil, choose **Version: New version**, and **Deploy**. The web address stays the same.
