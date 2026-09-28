/**
 * Amazing Car Detailing — Cloudflare Worker (D1 + Stripe)
 * Worker name:  amazing-detailing-worker
 * Source tag:   amazing        (scopes every D1 query)
 * ID prefix:    AMZ-
 *
 * Bindings (Cloudflare dashboard → Worker → Settings):
 *   D1 database binding  DB                (shared detailing-bookings DB for the chosen account)
 *   Secret               STRIPE_SECRET_KEY (sk_live_… / sk_test_…)
 *   Secret (optional)    ADMIN_KEY         (protects GET/PATCH admin routes)
 *   Variable (optional)  ALLOWED_ORIGIN    (e.g. https://amazingcardetailing.com — defaults to *)
 *
 * Routes:
 *   GET    /api/health
 *   GET    /api/availability?date=YYYY-MM-DD
 *   POST   /api/create-payment-intent
 *   POST   /api/bookings
 *   GET    /api/bookings            (admin)
 *   PATCH  /api/bookings/:id        (admin)
 */

const SOURCE = 'amazing'
const PREFIX = 'AMZ-'

const PACKAGES = {
  basic: { name: 'Basic Detail', cents: 15000 },
  premium: { name: 'Premium Detail', cents: 20000 },
}
const ADDON = { name: 'Exterior Wash', cents: 5000 }
const COUPONS = { PREPAY: 1500 }

// Fields the shared admin dashboard is allowed to update.
const PATCHABLE = ['status', 'payment_status', 'reschedule_date', 'reschedule_time', 'original_date', 'original_time', 'notes2']

// Hourly slots 7:00 AM – 7:00 PM (must match the frontend).
const SLOT_LABELS = Array.from({ length: 13 }, (_, i) => {
  const h = 7 + i
  return `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? 'AM' : 'PM'}`
})

// Collapsed to one line — multi-line literals break D1 .exec() ("incomplete input").
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    service TEXT,
    name TEXT,
    phone TEXT,
    email TEXT,
    vehicle TEXT,
    address TEXT,
    notes TEXT,
    source TEXT,
    created_at TEXT,
    status TEXT,
    reschedule_date TEXT,
    reschedule_time TEXT,
    notes2 TEXT,
    original_date TEXT,
    original_time TEXT,
    payment_status TEXT
  )
`.replace(/\s+/g, ' ').trim()

let schemaReady = false
async function ensureSchema(db) {
  if (schemaReady) return
  await db.exec(SCHEMA)
  schemaReady = true
}

function cors(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}
const json = (env, data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...cors(env) } })

const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)
const clean = (v, max = 300) => String(v ?? '').trim().slice(0, max)

function quote(body, withCoupon) {
  const pkg = PACKAGES[body.package]
  if (!pkg) return null
  const ext = !!body.exterior
  const code = withCoupon ? clean(body.coupon, 20).toUpperCase() : ''
  const discount = COUPONS[code] || 0
  const subtotal = pkg.cents + (ext ? ADDON.cents : 0)
  return {
    service: `${pkg.name}${ext ? ` + ${ADDON.name}` : ''}`,
    subtotal,
    discount,
    total: Math.max(0, subtotal - discount),
    coupon: discount ? code : '',
  }
}

// Earliest bookable time = now in California + 4 hours.
function earliestCA() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date()).map((p) => [p.type, p.value]),
  )
  const ymd = `${parts.year}-${parts.month}-${parts.day}`
  const total = (Number(parts.hour) % 24) * 60 + Number(parts.minute) + 240
  if (total < 1440) return { ymd, minutes: total }
  const d = new Date(`${ymd}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return { ymd: d.toISOString().slice(0, 10), minutes: total - 1440 }
}
const labelMinutes = (label) => {
  const m = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(label)
  if (!m) return -1
  let h = Number(m[1]) % 12
  if (m[3] === 'PM') h += 12
  return h * 60 + Number(m[2])
}
function slotAllowed(date, time) {
  if (!isDate(date) || !SLOT_LABELS.includes(time)) return false
  const e = earliestCA()
  if (date < e.ymd) return false
  if (date === e.ymd && labelMinutes(time) < e.minutes) return false
  return true
}

// Booked slots for a date, honouring admin reschedules and ignoring cancellations.
async function bookedTimes(db, date) {
  const { results } = await db
    .prepare(
      `SELECT date, time, reschedule_date, reschedule_time, status FROM bookings
       WHERE source = ? AND (date = ? OR reschedule_date = ?)`,
    )
    .bind(SOURCE, date, date)
    .all()
  const taken = new Set()
  for (const r of results || []) {
    if (/cancel/i.test(r.status || '')) continue
    const effDate = r.reschedule_date || r.date
    const effTime = r.reschedule_date ? (r.reschedule_time || r.time) : r.time
    if (effDate === date) taken.add(effTime)
  }
  return [...taken]
}

function newId() {
  const t = Date.now().toString(36).toUpperCase().slice(-5)
  const r = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `${PREFIX}${t}${r}`
}

async function stripe(env, path, params, method = 'POST') {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params ? new URLSearchParams(params).toString() : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || 'Stripe request failed')
  return data
}

function isAdmin(request, env) {
  if (!env.ADMIN_KEY) return true
  const h = request.headers.get('Authorization') || ''
  return h === `Bearer ${env.ADMIN_KEY}`
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const path = url.pathname.replace(/\/+$/, '') || '/'
    const method = request.method

    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(env) })

    try {
      if (path === '/api/health') return json(env, { ok: true, source: SOURCE })

      // ── Payment intent ─────────────────────────────────────
      // Schema init is intentionally NOT awaited before this route so a D1 hiccup can't block payments.
      if (path === '/api/create-payment-intent' && method === 'POST') {
        if (!env.STRIPE_SECRET_KEY) return json(env, { error: 'Payments are not configured' }, 503)
        const body = await request.json().catch(() => ({}))
        const q = quote(body, true)
        if (!q) return json(env, { error: 'Unknown package' }, 400)
        if (body.date && body.time) {
          if (!slotAllowed(body.date, body.time)) return json(env, { error: 'That time is no longer available' }, 409)
          try {
            await ensureSchema(env.DB)
            const taken = await bookedTimes(env.DB, body.date)
            if (taken.includes(body.time)) return json(env, { error: 'That time was just booked' }, 409)
          } catch (_) { /* never block payment on a D1 read */ }
        }
        const params = {
          amount: String(q.total),
          currency: 'usd',
          'automatic_payment_methods[enabled]': 'true',
          description: `${q.service} — Amazing Car Detailing`,
          'metadata[source]': SOURCE,
          'metadata[service]': q.service,
          'metadata[date]': clean(body.date, 10),
          'metadata[time]': clean(body.time, 10),
          'metadata[coupon]': q.coupon,
          'metadata[name]': clean(body.name, 80),
        }
        const email = clean(body.email, 120)
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) params.receipt_email = email
        const pi = await stripe(env, 'payment_intents', params)
        return json(env, { clientSecret: pi.client_secret, amount: q.total })
      }

      await ensureSchema(env.DB)

      // ── Availability ──────────────────────────────────────
      if (path === '/api/availability' && method === 'GET') {
        const date = url.searchParams.get('date')
        if (!isDate(date)) return json(env, { error: 'Invalid date' }, 400)
        return json(env, { date, booked: await bookedTimes(env.DB, date) })
      }

      // ── Create booking ────────────────────────────────────
      if (path === '/api/bookings' && method === 'POST') {
        const b = await request.json().catch(() => ({}))
        const paid = b.payment_status === 'Paid'
        const q = quote(b, paid)
        if (!q) return json(env, { error: 'Unknown package' }, 400)

        const rec = {
          date: clean(b.date, 10), time: clean(b.time, 10),
          name: clean(b.name, 100), phone: clean(b.phone, 30), email: clean(b.email, 120),
          vehicle: clean(b.vehicle, 120), address: clean(b.address, 250),
        }
        const missing = ['name', 'phone', 'email', 'vehicle', 'address'].find((k) => !rec[k])
        if (missing) return json(env, { error: `Missing ${missing}` }, 400)

        let piId = ''
        let paidCents = q.total
        if (paid) {
          piId = clean(b.payment_intent_id, 80)
          if (!piId.startsWith('pi_')) return json(env, { error: 'Missing payment reference' }, 400)
          const pi = await stripe(env, `payment_intents/${encodeURIComponent(piId)}`, null, 'GET')
          if (!['succeeded', 'processing', 'requires_capture'].includes(pi.status)) {
            return json(env, { error: 'Payment not completed' }, 402)
          }
          if (pi.metadata?.source && pi.metadata.source !== SOURCE) return json(env, { error: 'Payment reference mismatch' }, 400)
          paidCents = pi.amount
          // Idempotency: the same PaymentIntent must not create two bookings.
          const dupe = await env.DB.prepare('SELECT id FROM bookings WHERE source = ? AND notes LIKE ? LIMIT 1')
            .bind(SOURCE, `%${piId}%`).first()
          if (dupe) return json(env, { id: dupe.id, duplicate: true })
        } else {
          if (!slotAllowed(rec.date, rec.time)) return json(env, { error: 'That time is no longer available' }, 409)
          const taken = await bookedTimes(env.DB, rec.date)
          if (taken.includes(rec.time)) return json(env, { error: 'That time was just booked' }, 409)
        }

        const id = newId()
        const total = (paidCents / 100).toFixed(2)
        const notes = paid
          ? `Paid online $${total}${q.coupon ? ` (coupon ${q.coupon})` : ''} · Stripe ${piId}`
          : `Pay later · $${total} due at service`

        await env.DB.prepare(
          `INSERT INTO bookings (id, date, time, service, name, phone, email, vehicle, address, notes, source, created_at, status, payment_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          id, rec.date, rec.time, q.service, rec.name, rec.phone, rec.email, rec.vehicle, rec.address,
          notes, SOURCE, new Date().toISOString(), 'Confirmed', paid ? 'Paid' : 'Pay Later',
        ).run()

        return json(env, { id }, 201)
      }

      // ── Admin: list ───────────────────────────────────────
      if (path === '/api/bookings' && method === 'GET') {
        if (!isAdmin(request, env)) return json(env, { error: 'Unauthorized' }, 401)
        const { results } = await env.DB
          .prepare('SELECT * FROM bookings WHERE source = ? ORDER BY date DESC, created_at DESC LIMIT 500')
          .bind(SOURCE).all()
        return json(env, { bookings: results || [] })
      }

      // ── Admin: patch ──────────────────────────────────────
      const m = path.match(/^\/api\/bookings\/([A-Za-z0-9-]+)$/)
      if (m && method === 'PATCH') {
        if (!isAdmin(request, env)) return json(env, { error: 'Unauthorized' }, 401)
        const body = await request.json().catch(() => ({}))
        const keys = Object.keys(body).filter((k) => PATCHABLE.includes(k))
        if (!keys.length) return json(env, { error: 'Nothing to update' }, 400)
        const sets = keys.map((k) => `${k} = ?`).join(', ')
        const vals = keys.map((k) => (body[k] === null ? null : clean(body[k], 500)))
        const r = await env.DB.prepare(`UPDATE bookings SET ${sets} WHERE id = ? AND source = ?`)
          .bind(...vals, m[1], SOURCE).run()
        if (!r.meta || r.meta.changes === 0) return json(env, { error: 'Not found' }, 404)
        return json(env, { ok: true, id: m[1] })
      }

      return json(env, { error: 'Not found' }, 404)
    } catch (err) {
      return json(env, { error: err.message || 'Server error' }, 500)
    }
  },
}
