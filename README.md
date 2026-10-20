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

The default data path is `data/menu.json` in the application directory. Although `/data/` is ignored, the starter `menu.json` is already tracked: preserve the live menu before every deployment;
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

## Déjeuner à emporter (local integration)

The `/fr/dejeuner`, `/en/dejeuner` and `/es/dejeuner` pages use the same menu and
`/admin` editor. Use category `Plats` for mains or `Boissons` for drinks, enable
participation and enter the special price. The normal price is optional and is
not displayed on the ordinary menu. Existing uploads and the three bundled dish/
cocktail photos can be used. TEST cards are demonstration data to edit or delete
in the menu editor; their photos are illustrative and prices are fictitious.

Same-day submission opens 09:30–11:30 Europe/Paris on weekdays. Future weekday
preorders remain possible outside this window. Pickup is 11:40–14:00 every ten
minutes. One to three cart items use each item's normal price; from four items the
special price applies to every item, including drinks. Until a
normal price is set in the administration, the affected selection cannot be sent.
No online payment.

Email shares the reservation SMTP configuration through `lib/mail.ts`. The
technical numbering/idempotency file defaults to `dejeuner-orders.json` alongside
the menu. `NOMADE_LUNCH_STATE_FILE` can set a persistent absolute path. Keep this
file writable, preserve it across releases and back it up with the menu; deleting
it resets the sequence and loses duplicate protection. Never commit runtime data.
This file-based lock/atomic-rename implementation is for one Node host with a shared
persistent local data directory, not independent ephemeral instances.

The browser keeps the current draft, immutable submission and short receipt in
sessionStorage for reload/retry in the same tab. If SMTP delivery to the restaurant
has an uncertain outcome, the original number is retained and the user is asked
to call; mail is not automatically resent because SMTP cannot prove exactly-once
delivery. A customer-email failure leaves the accepted restaurant order intact.
There is no order dashboard or customer order-details page.
