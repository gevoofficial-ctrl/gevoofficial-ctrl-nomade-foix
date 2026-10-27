# NOMADE production publication

GitHub Actions validates the source only. It has no hosting credentials or SSH
commands. Production publication is deliberately manual through the owner's
Chrome/cPanel session.

The actual serving checkout is `/home/bebi3837/dev.nomade-foix.fr`. Its name does
not make it a staging environment. Keep the existing Passenger configuration,
node_modules symlink, environment variables and all runtime data in place.

After reviewing and testing a full commit SHA on main:

1. Activate the existing cPanel Node 22 environment and fetch origin/main.
2. Extract `scripts/deploy-production.mjs` from the reviewed commit into a
   private directory outside the serving checkout. Run that exact script with
   the application root and full commit SHA.
3. The script rejects commits touching data/, .htaccess, .env*, node_modules,
   .next, tmp or nomade-src and rejects unexpected tracked source edits. Such
   changes need a separate reviewed migration; they must not be forced.
4. It creates a private source snapshot and a checksum-verified runtime backup,
   including menu, uploaded media, lunch state and server configuration.
5. Dependencies and the new build are prepared outside the serving directory.
   The staging build reads the current shared menu. A loopback smoke test checks
   the prepared pages and menu-only lunch API before activation.
6. The reviewed source, prepared dependencies and build are activated; previous
   immutable static chunks are retained for already-open browser tabs. Passenger
   is restarted using tmp/restart.txt. No runtime data is copied back from Git.
7. Public FR/EN/ES pages and the full lunch API are checked over validated HTTPS.
   The main page must reference the prepared build's scripts, so an old healthy
   Passenger response cannot masquerade as a successful publication.
8. A preparation failure leaves the serving version intact. An activation or
   health-check failure restores the old source, dependencies and build, then
   restarts and verifies the previous version. Current runtime data is preserved
   during rollback, including orders accepted while the build was running.

Retain the printed private rollback directory until live browser verification is
complete. Independently check mobile and desktop UI, calendars, language links,
prices and console errors. Existing backup cron remains a separate safeguard.
Never print environment values, SMTP credentials, reservation tokens or order
records into deployment logs.
