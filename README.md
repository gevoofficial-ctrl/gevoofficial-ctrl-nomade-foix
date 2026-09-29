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
directly from this data on each request. English and Spanish fields fall back to French
until they are manually filled. No unapproved sample dishes or prices are seeded.
