# Shared Vision Health Outreach website

All things for the Shared Vision Health Outreach website, debuting in 2026.

The website for Shared Vision: free eye screenings at the Scheie in MOTION van for people in Philadelphia, and help with glasses, insurance and rides afterward.

Five pages in English (Home, For patients, Bring the van, Impact, About) and Spanish versions of Home and For patients.

## How to make a change with Claude

1. Open this repository in Claude Code (claude.ai/code, or the Claude desktop app's Code tab) and connect it to this GitHub repository.
2. Say what you want in plain words, for example: "Add a van stop on Saturday, December 12, 10 am to 1 pm, at Chosen 300 Ministries, West Philadelphia." Claude reads `CLAUDE.md` first, which holds the site's rules: plain wording, English and Spanish changed together, the design system, no made-up facts.
3. Claude makes the change on a separate branch. Vercel then builds a **preview link** for that branch, so you can check the change without touching the live site.
4. Open the preview on your phone and on a laptop. If it looks right, merge the change into `main`. The live site updates about a minute later.

Nothing reaches the live site until it is merged into `main`.

## Who owns what

| Thing | Where it lives |
|---|---|
| The code | This GitHub repository |
| The live site | Your Vercel account (free Hobby plan; Vercel's fair-use rules say asking for donations is not commercial use) |
| Donations | Your Zeffy form |
| The partner map on About | A Google My Maps map, "Shared Vision partner sites" |
| Email | sharedvision2026@gmail.com |
| A web address of your own | Not bought yet. sharedvisionhealth.org was available when last checked. Once bought, add it in Vercel under the project's Domains. |

## Before launch

- **Donations:** finish the Zeffy account setup. Until then the form says it cannot take payments.
- **Van stops:** the list ends on December 2. Add the next stops (see "Van stops" in `CLAUDE.md`) or link to your own calendar.
- **Spanish:** someone who speaks Spanish should read `es/index.html` and `es/pacientes.html`. Points worth a look first: "chequeo" vs "examen de la vista", "lentes" vs "espejuelos", "la clínica móvil" vs "la van", and the seven eye checks.
- **Partners:** confirm Chosen 300 Ministries, The Common Place and Bethesda Project are happy with their logos on the site.
- **Clinical wording:** someone on the clinical side should read the seven checks on For patients and the condition names on Impact.
- **Search engines:** delete `vercel.json`. It tells search engines not to list the site while it is a preview.

## Files at a glance

`index.html` Home · `patients.html` For patients · `organizations.html` Bring the van · `impact.html` Impact · `about.html` About · `es/` Spanish pages · `styles.css` shared design · `css/` page layouts · `site.js` van stop list and menu · `img/` photos · `docs/` eye-health PDFs.
