import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icon'
import { BUSINESS } from '../config/business'
import { loadDraft, clearDraft, createBooking, priceFor, serviceLabel } from '../lib/bookingDb'
import { formatLong } from '../lib/time'
import { LAST_KEY } from './Checkout'

export default function Confirmation() {
  const [params] = useSearchParams()
  const [booking, setBooking] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(LAST_KEY) || 'null') } catch { return null }
  })
  const [err, setErr] = useState('')
  const ran = useRef(false)

  // Some payment methods redirect back here — finish saving the booking in that case.
  useEffect(() => {
    const pi = params.get('payment_intent')
    const status = params.get('redirect_status')
    if (!pi || ran.current) return
    ran.current = true
    const draft = loadDraft()
    if (!draft) return
    if (status !== 'succeeded' && status !== 'processing') {
      setErr('Your payment was not completed. Please go back to checkout and try again.')
      return
    }
    createBooking(draft, { paymentStatus: 'Paid', paymentIntentId: pi, coupon: draft.coupon || '' })
      .then((res) => {
        const b = {
          id: res.id, service: serviceLabel(draft), date: draft.date, time: draft.time,
          total: priceFor(draft).total, payment_status: 'Paid', name: draft.name,
        }
        sessionStorage.setItem(LAST_KEY, JSON.stringify(b))
        clearDraft()
        setBooking(b)
      })
      .catch((e) => setErr(`Payment received, but we couldn't save the booking (${e.message}). Please call ${BUSINESS.phoneDisplay} with reference ${pi}.`))
  }, [params])

  if (err) {
    return (
      <div className="flow">
        <div className="container confirm">
          <h1>Almost there</h1>
          <p className="flow__error">{err}</p>
          <Link to="/checkout" className="btn btn-gold">Back to checkout</Link>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="flow">
        <div className="container confirm">
          <h1>Finishing up…</h1>
          <p>If this page doesn’t update, call us at <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a>.</p>
          <Link to="/" className="btn btn-outline">Back to home</Link>
        </div>
      </div>
    )
  }

  const first = (booking.name || '').split(' ')[0]

  return (
    <div className="flow">
      <div className="flow__bg" aria-hidden="true" />
      <div className="container confirm">
        <div className="confirm__seal"><Icon name="check" size={40} stroke={3} /></div>
        <span className="eyebrow">Booking confirmed</span>
        <h1>You’re all set{first ? `, ${first}` : ''}!</h1>
        <p className="confirm__lead">We’ll see you soon. A detailer will reach out before your appointment to confirm the details.</p>

        <div className="ticket">
          <div className="ticket__row"><span>Booking ID</span><strong className="ticket__id">{booking.id}</strong></div>
          <div className="ticket__row"><span>Service</span><strong>{booking.service}</strong></div>
          <div className="ticket__row"><span>Date</span><strong>{formatLong(booking.date)}</strong></div>
          <div className="ticket__row"><span>Time</span><strong>{booking.time}</strong></div>
          <div className="ticket__row"><span>Payment</span>
            <strong className={booking.payment_status === 'Paid' ? 'is-paid' : ''}>
              {booking.payment_status === 'Paid' ? `Paid · $${booking.total}` : `Pay later · $${booking.total} due`}
            </strong>
          </div>
        </div>

        <div className="confirm__ctas">
          <a href={BUSINESS.phoneHref} className="btn btn-outline"><Icon name="phone" size={18} /> {BUSINESS.phoneDisplay}</a>
          <Link to="/" className="btn btn-gold">Back to home</Link>
        </div>
      </div>
    </div>
  )
}
