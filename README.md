# Amazing Car Detailing — Brea, CA

Vite + React booking site with a Cloudflare Worker (D1 bookings + Stripe PaymentIntents).

| Item | Value |
|---|---|
| Phone | (657) 701-2638 |
| D1 `source` tag | `amazing` |
| Booking ID prefix | `AMZ-` |
| Worker name | `amazing-detailing-worker` |
| Pages project | `amazing-car-detailing` |
| Coupon | `PREPAY` = $15 off (online prepay only) |
| Hours / slots | Mon–Sun by appointment · hourly 7:00 AM – 7:00 PM · earliest slot = now (California) + 4 h |

## Services
- **Basic Detail — $150**
- **Premium Detail — $200**
- **Exterior Wash — +$50** (add-on, step 2 of booking)

## Booking flow
Package → Add-on (tap to add Exterior Wash) → Date & time → Your info → Checkout (pay now or "I'll pay later") → Confirmation.
Back/Continue live in a sticky bottom action bar on every step. Mobile menu and the home page both carry a Call Now / Book Online action bar.

## 1. Cloudflare Worker (dashboard)
1. Workers & Pages → Create → Worker → name it `amazing-detailing-worker` → Deploy.
2. Edit code → paste `worker/worker.js` → Deploy.
3. Settings → Bindings → add **D1 database**, variable name `DB`, pick the shared detailing-bookings DB for the chosen account.
4. Settings → Variables and Secrets → add secret `STRIPE_SECRET_KEY`.
   Optional: secret `ADMIN_KEY` (locks admin GET/PATCH), variable `ALLOWED_ORIGIN` (your site URL).
5. Open `https://amazing-detailing-worker.<subdomain>.workers.dev/api/health` → should return `{"ok":true,"source":"amazing"}`.

The table is created automatically (`CREATE TABLE IF NOT EXISTS`). `worker/schema.sql` is there if you prefer to run it in the D1 console.

## 2. Frontend env
Edit `.env.local` (committed on purpose — both values are public):
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_API_URL=https://amazing-detailing-worker.<subdomain>.workers.dev
```
Without a real `VITE_API_URL` the site runs in preview mode and stores bookings in the browser's localStorage.

## 3. GitHub + Cloudflare Pages
```cmd
cd amazing-car-detailing
git init
git add .
git commit -m "Amazing Car Detailing site"
git branch -M main
git remote add origin https://github.com/servicepros714/amazing-car-detailing.git
git push -u origin main
```
Repo → Settings → Secrets and variables → Actions: add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
Create a Pages project named `amazing-car-detailing` (Direct Upload) once, then every push to `main` deploys via `.github/workflows/deploy.yml`.
SPA routing is handled by `public/_redirects`.

## Local dev
```cmd
npm install
npm run dev
```

## Content to fill in later
- `src/config/business.js` → `googleReviewUrl` (shows a "Read our Google reviews" button) and `REVIEWS` (real Google reviews switch on the reviews carousel).
