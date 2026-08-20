# James Mankee Fitness — Free Training Split Generator

A single-page lead magnet. Visitors answer 8 questions about goals, experience,
schedule, equipment and injuries, hand over their name + email, and instantly
get a personalised weekly training split. No build step — just HTML/CSS/JS.

## Files
- `index.html` — page structure + all quiz steps
- `styles.css` — brand styling (navy `#1b1f2d`, amber `#d48c40`, matching your Week 1 PDF)
- `app.js` — quiz flow, split-generation logic, Mailchimp submission

## 1. Connect Mailchimp (no API key needed)
This uses Mailchimp's classic embedded-form endpoint — a plain form POST, so
there's no secret key exposed in the page source.

1. In Mailchimp: **Audience → Signup forms → Embedded forms**
2. Copy the `<form action="...">` URL — looks like
   `https://xxxx.usXX.list-manage.com/subscribe/post?u=XXXXXXXX&id=XXXXXXXX`
3. Paste it into `app.js` as `MAILCHIMP_ACTION_URL`
4. In Mailchimp, add these merge fields to your audience if you want the quiz
   answers to come through as data (Audience → Settings → Audience fields):
   `GOAL`, `EXPERIEN`, `DAYSWK`, `EQUIP`, `INJURIES`, `AGE`, `GENDER`
   (`EMAIL` and `FNAME` already exist by default). Any field you don't add is
   simply ignored by Mailchimp — the form won't break.

Until you set `MAILCHIMP_ACTION_URL`, the app still works end-to-end (quiz →
result), it just logs a console warning and skips the subscribe step — safe
to demo before you've wired it up.

## 2. Set your coaching application link
In `app.js`, set `APPLY_URL` to wherever leads should go after seeing their
split (an application form, Calendly link, DM, etc). Defaults to `#`.

## 3. Run it locally
No build tools needed — any static server works:

```bash
python3 -m http.server 8842
```

Then open `http://localhost:8842`.

## 4. Deploy
Upload the 3 files anywhere that serves static files — Netlify, Vercel,
GitHub Pages, or straight into your existing website's file manager. No
server, database, or Node.js required.

## How the split logic works
`app.js` maps days/week to a split template (Full Body / Upper-Lower / PPL),
then fills each day with exercises drawn from equipment-specific pools,
using sets/reps schemes tuned to the stated goal. Flagged injuries both swap
out risky named exercises (e.g. deadlifts excluded for lower back) and, where
a whole movement pattern is the issue (e.g. overhead pressing for shoulders),
redirect to a safer pattern entirely — not just filter within a thin pool.
This is a starting-point template for lead-gen purposes, not a substitute for
individualized coaching — the CTA on the result screen is the upsell into that.

## Customizing
- **Quiz questions / options**: edit the `.q-step` blocks in `index.html`
- **Colors / fonts**: CSS custom properties at the top of `styles.css`
- **Exercise pools / split templates**: `POOL` and `getSplitPlan()` in `app.js`
- **Coaching notes copy**: `buildNotes()` in `app.js`
