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

The booking form emails a request; it does not confirm a table automatically. The
confirmed sender and recipient are `nomaderestaubar@gmail.com`. Gmail SMTP defaults to
`smtp.gmail.com:465` with TLS. In the server's Node application environment, set:

- `NOMADE_SMTP_PASSWORD`: a Google app password for this Gmail account (not its normal password).

Google requires 2-Step Verification to create an app password:
https://support.google.com/accounts/answer/185833

Optional overrides are `NOMADE_SMTP_HOST`, `NOMADE_SMTP_PORT`, `NOMADE_SMTP_SECURE=true`
(implicit TLS on a nonstandard port), `NOMADE_SMTP_USER`, `NOMADE_SMTP_FROM`, and
`NOMADE_RESERVATIONS_TO`. The password remains on the server, never in Git. Until it is
configured, the form offers a phone fallback and refuses submissions.
