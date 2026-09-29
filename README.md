# NOMADE Foix — website

Modern multilingual restaurant website for Nomade in Foix.

## Stack
Next.js + TypeScript + Tailwind/PostCSS-compatible setup.

## Languages
French (default), English, Spanish.

## Direction
Dark editorial / cinematic restaurant identity: fire, local produce, travel, food, atmosphere.

## Run
npm install
npm run dev

## Menu administration (staging)

The password protected editor is at `/admin` on the staging host. Add these server-side
environment variables in the Passenger/Node application configuration before use:

- `NOMADE_ADMIN_PASSWORD`: a unique strong password for the restaurant owner.
- `NOMADE_ADMIN_SECRET`: a random string of at least 32 characters for session signing.
- `NOMADE_MENU_FILE` (optional): an absolute path to `menu.json` outside the checkout.

The default data path is `data/menu.json` in the application directory. It is ignored by Git;
uploaded photos and videos live in `data/media`. Keep this directory writable by the Node
process, and back it up independently. The staging deploy resets tracked Git files, but does
not delete this ignored directory. Never commit credentials or restaurant data to Git.

The public `/fr/carte`, `/en/carte`, `/es/carte` pages and homepage signatures render
directly from this data on each request. The menu is entered and displayed in French
on all three language versions of the site. Other interface copy remains localized.
No translation API key is needed. No unapproved sample dishes or prices are seeded.

## Reservation requests (staging)

The booking form sends an email request; it does not confirm a table automatically.
Configure the following variables in the server's Node application environment:

- `NOMADE_SMTP_HOST`, `NOMADE_SMTP_PORT` (465 for implicit TLS or 587 for STARTTLS)
- `NOMADE_SMTP_SECURE=true` if your SMTP server uses implicit TLS on a nonstandard port
- `NOMADE_SMTP_USER`, `NOMADE_SMTP_PASSWORD`
- `NOMADE_SMTP_FROM`: a sender address authorized by that mailbox
- `NOMADE_RESERVATIONS_TO` (optional): overrides the confirmed recipient
  `nomaderestaubar@gmail.com`

Credentials remain on the server; the repository contains none. Until these values are
configured, the form shows a phone fallback and the endpoint refuses submissions.
The recipient was confirmed by the restaurant. Configure the SMTP sender account before
enabling delivery; do not put its password in Git.
