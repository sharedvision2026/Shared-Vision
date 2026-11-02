# Shared Vision website: rules for Claude

Read this before changing anything. It describes how the site is built and the rules that keep it consistent.

## What the site is

A plain static site: HTML, CSS and a little JavaScript. No framework, no build step, no package install. Vercel serves the files as they are. A push to `main` publishes; a push to any other branch gets a preview link.

| File | Page |
|---|---|
| `index.html` | Home |
| `patients.html` | For patients (van stops, the seven eye checks, glasses, insurance and rides, eye guides) |
| `organizations.html` | Bring the van (for shelters and programs) |
| `impact.html` | Impact (the giving page, the numbers, Donate) |
| `about.html` | About (founders, mission, partners with a Google map, thank-you) |
| `es/index.html`, `es/pacientes.html` | Spanish versions of Home and For patients |
| `styles.css` | Shared design system: colors, type sizes, spacing, header, footer, shared components |
| `css/<page>.css` | Layout that only one page needs |
| `site.js` | Van stop list (hides past stops, marks today, "See all" button), phone menu, focus for in-page links. Every page works without it |
| `img/` | Photos and partner logos (WebP with a JPG fallback) |
| `docs/` | Free eye-health PDFs linked from For patients |
| `vercel.json` | Tells search engines not to list the site yet. **Delete it on launch day.** |

## Who reads it

1. **Patients first.** Many have little money, a cheap phone and bad experiences with confusing websites. They want to know where the van is, that it is free, and what help comes after. Convenience beats decoration.
2. Shelter and program staff who might host the van (`organizations.html`).
3. Donors (`impact.html` only).

## Writing rules

- Plain words a 6th to 8th grader reads easily. Short sentences. One sentence where one will do.
- A heading says what the section is. No slogans and no selling on patient or partner pages. Only `impact.html` persuades.
- Never repeat on one screen what a later section explains. Trust the reader to scroll.
- No AI-sounding or consultant words (leverage, empower, holistic, journey, seamless, robust, ecosystem, and the like). No em dashes or en dashes.
- "The van team" means the Scheie in MOTION staff. "We" means Shared Vision.
- Agreed wording, used the same way everywhere:
  - Glasses: "We hand out free reading glasses. For prescription glasses, we help you apply to a free or low-cost program."
  - Rides: "We help you get to your eye appointment with a SEPTA pass."
- Never make up a number, a quote, a date or a fact. Numbers come from the team's metrics sheet; van stops come from the team's schedule. If a fact is missing, ask the person you are working with.
- No Penn or Penn Medicine logo, and Penn's name is not used as branding (the team's request). Naming "Scheie in MOTION" in text, with a link to https://opticlab.med.upenn.edu/mobile-unit/, is fine.
- The founders' bios, the mission paragraph, the EYE lines and the thank-you on About are the team's own words. Change them only when the team asks.

## English and Spanish change together

Home and For patients exist in English and Spanish. **Any change to one of these pages is made to both**, in the same change. The Spanish is a draft until a native speaker on the team has read it.

Spanish rules: "usted"; warm and short, like the English. One word for one thing: "chequeo" for the screening (not "examen", which promises a full exam), "la clínica móvil" for the van, "lentes" for glasses, "pase de SEPTA". Days and months in lowercase ("lunes 2 de noviembre"); times like "De 5:30 a 7:30 p. m.". Links from Spanish pages to English-only pages say "(en inglés)". Avoid false friends: "solicitar", not "aplicar"; "afección", not "condición". Eye terms follow the National Eye Institute's Spanish pages (nei.nih.gov/espanol).

The "Español" link on each English page goes to `es/pacientes.html` from For patients and to `es/` from every other page; "English" on the Spanish pages goes back to the same page in English.

## Van stops

Each stop is one `<li>` in the stop list. **The list appears in four files:** `index.html`, `patients.html`, `es/index.html`, `es/pacientes.html`. Add, change or remove a stop in all four. Copy an existing stop and change:
- `<time datetime="YYYY-MM-DD">`: the script hides a stop once its date has passed, so this date must be right;
- the day and time text (English: "Monday, November 2" and "5:30 to 7:30 pm"; Spanish: "Lunes 2 de noviembre" and "De 5:30 a 7:30 p. m.");
- the place, the address, and the address inside the Google Maps link.
Home shows the first three upcoming stops and a "See all" button for the rest.

## Design rules

- Colors, type sizes and spacing come only from the tokens at the top of `styles.css`. Do not add new colors or sizes inline.
- Fonts: Archivo for headings, Atkinson Hyperlegible Next for text. Body text never goes below 19px (`--t-body`).
- Gold is only for things you press (and the proof on Impact). Coral is only the wordmark on dark backgrounds.
- Every button and link is at least 48px tall where it stands on its own line.
- Text contrast stays at WCAG AA or better; small text stays at 7:1 on these colors.
- Motion respects "reduce motion", and every page must still work with JavaScript off.
- One clear main action per section. Reuse an existing component before inventing a new one.

## Before you say a change is done

1. Open the Vercel preview link for the branch.
2. Look at every page you changed at phone width (390px) and laptop width (1440px). Nothing may scroll sideways; no text may be cut off; there should be no errors in the browser console.
3. If you changed Home or For patients, check the Spanish page too.
4. Tell the person what you changed, show them the preview link, and let them decide before anything is merged to `main`.

## Outside services

- Donate buttons go to the team's Zeffy form.
- The map on About is a Google My Maps map ("Shared Vision partner sites"). To move or add a pin, edit the map in Google My Maps; the page shows the change by itself.
- Email everywhere: sharedvision2026@gmail.com.
