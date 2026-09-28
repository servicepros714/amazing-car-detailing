import { SLOT_START_HOUR, SLOT_END_HOUR, LEAD_HOURS, DAYS_AHEAD } from '../config/business'

const TZ = 'America/Los_Angeles'

export const pad = (n) => String(n).padStart(2, '0')
export const toYmd = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
export const fromYmd = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
export const addDaysYmd = (s, n) => {
  const d = fromYmd(s)
  d.setUTCDate(d.getUTCDate() + n)
  return toYmd(d)
}

// Current wall-clock time in California, independent of the visitor's timezone.
export function caNow() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date()).map((p) => [p.type, p.value]),
  )
  return { ymd: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) % 24, minute: Number(parts.minute) }
}

export function earliestBookable() {
  const now = caNow()
  const total = now.hour * 60 + now.minute + LEAD_HOURS * 60
  if (total >= 1440) return { ymd: addDaysYmd(now.ymd, 1), minutes: total - 1440 }
  return { ymd: now.ymd, minutes: total }
}

export const hourLabel = (h) => `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? 'AM' : 'PM'}`

export const ALL_SLOTS = Array.from({ length: SLOT_END_HOUR - SLOT_START_HOUR + 1 }, (_, i) => {
  const h = SLOT_START_HOUR + i
  return { hour: h, label: hourLabel(h) }
})

// Slots that are open by time rules alone (bookings are filtered separately).
export function openSlotsFor(ymd) {
  const e = earliestBookable()
  if (ymd < e.ymd) return []
  if (ymd === e.ymd) return ALL_SLOTS.filter((s) => s.hour * 60 >= e.minutes)
  return ALL_SLOTS
}

export function bookableRange() {
  const first = caNow().ymd
  return { first, last: addDaysYmd(first, DAYS_AHEAD) }
}

export const formatLong = (ymd) =>
  fromYmd(ymd).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

export const formatShort = (ymd) =>
  fromYmd(ymd).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })

export const monthLabel = (y, m) =>
  new Date(Date.UTC(y, m, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
