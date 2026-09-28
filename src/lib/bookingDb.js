// Booking data layer. Talks to the Cloudflare Worker (D1 + Stripe).
// If VITE_API_URL is not set (local preview), it falls back to localStorage so the flow still works.
import { API_URL, PACKAGES, ADDON, PREPAY } from '../config/business'

const DRAFT_KEY = 'amz_booking_draft'
const LOCAL_KEY = 'amz_local_bookings'

export const hasApi = () => Boolean(API_URL) && !API_URL.includes('REPLACE')

export function priceFor({ packageId, exterior, coupon }) {
  const pkg = PACKAGES.find((p) => p.id === packageId)
  let total = (pkg ? pkg.price : 0) + (exterior ? ADDON.price : 0)
  const discount = coupon === PREPAY.code ? PREPAY.off : 0
  return { subtotal: total, discount, total: Math.max(0, total - discount) }
}

export function serviceLabel({ packageId, exterior }) {
  const pkg = PACKAGES.find((p) => p.id === packageId)
  return `${pkg ? pkg.name : ''}${exterior ? ` + ${ADDON.name}` : ''}`
}

export const saveDraft = (d) => sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d))
export const loadDraft = () => {
  try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null') } catch { return null }
}
export const clearDraft = () => sessionStorage.removeItem(DRAFT_KEY)

async function req(path, opts = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return data
}

const localAll = () => {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') } catch { return [] }
}

export async function getBookedTimes(date) {
  if (!hasApi()) return localAll().filter((b) => b.date === date).map((b) => b.time)
  const data = await req(`/api/availability?date=${encodeURIComponent(date)}`)
  return data.booked || []
}

export async function createPaymentIntent(draft, coupon) {
  return req('/api/create-payment-intent', {
    method: 'POST',
    body: JSON.stringify({
      package: draft.packageId,
      exterior: !!draft.exterior,
      coupon: coupon || '',
      date: draft.date,
      time: draft.time,
      email: draft.email,
      name: draft.name,
    }),
  })
}

export async function createBooking(draft, { paymentStatus, paymentIntentId, coupon }) {
  const payload = {
    date: draft.date,
    time: draft.time,
    package: draft.packageId,
    exterior: !!draft.exterior,
    coupon: coupon || '',
    name: draft.name,
    phone: draft.phone,
    email: draft.email,
    vehicle: draft.vehicle,
    address: draft.address,
    payment_status: paymentStatus,
    payment_intent_id: paymentIntentId || '',
  }
  if (!hasApi()) {
    const id = `AMZ-${Date.now().toString(36).toUpperCase().slice(-6)}`
    localStorage.setItem(LOCAL_KEY, JSON.stringify([...localAll(), { ...payload, id, service: serviceLabel(draft) }]))
    return { id }
  }
  return req('/api/bookings', { method: 'POST', body: JSON.stringify(payload) })
}
