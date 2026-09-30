# James Mankee Fitness — Free Training Split Generator

A single-page lead magnet. Visitors answer 8 questions about goals, experience,
schedule, equipment and injuries, give a first name, and instantly get a
personalised weekly training split. No build step — just HTML/CSS/JS.

Lead capture happens upstream in ManyChat (comment/DM a keyword → ManyChat
asks for their email → ManyChat pushes it to Mailchimp on its own → ManyChat
sends this link). This site itself doesn't collect or send email anywhere —
it only asks for a first name, purely to personalize the result screen.

## Files
- `index.html` — page structure + all quiz steps
- `styles.css` — brand styling (navy `#1b1f2d`, amber `#d48c40`, matching your Week 1 PDF)
- `app.js` — quiz flow + split-generation logic

## 1. Set your coaching application link
In `app.js`, set `APPLY_URL` to wherever leads should go after seeing their
split (an application form, Calendly link, DM, etc). Defaults to `#`.

Also set `WHATSAPP_URL` for the "Talk to me" button in the coaching notes
(format: `https://wa.me/<countrycode><number>`, no spaces or leading 0).

## 2. Run it locally
No build tools needed — any static server works:

```bash
python3 -m http.server 8842
```

Then open `http://localhost:8842`.

## 3. Deploy
Upload the files anywhere that serves static files — Netlify, Vercel,
GitHub Pages, or straight into your existing website's file manager. No
server, database, or Node.js required.

## If you ever want website-side email capture too
Worth doing if the link ever gets shared somewhere other than ManyChat
(bio link, ads, forwarded screenshots) — ManyChat's capture only fires for
people who came through its own DM flow. Mailchimp's classic no-backend form
POST trick doesn't reliably work on newer accounts (their hosted forms now
require a token a static page can't fake — confirmed by testing against this
account). The real fix would be a small serverless function (e.g. a Cloudflare
Worker) holding a Mailchimp API key and calling their API properly. Not set up
currently — ask if you want it added later.

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
