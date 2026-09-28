import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Icon from '../components/Icon'
import { STRIPE_PK, PREPAY, BUSINESS } from '../config/business'
import { loadDraft, saveDraft, clearDraft, priceFor, serviceLabel, createPaymentIntent, createBooking, hasApi } from '../lib/bookingDb'
import { formatLong } from '../lib/time'

const stripeReady = STRIPE_PK.startsWith('pk_') && !STRIPE_PK.includes('REPLACE')
const stripePromise = stripeReady ? loadStripe(STRIPE_PK) : null

const appearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#F4B91F',
    colorBackground: '#0B1B2E',
    colorText: '#EEF3F8',
    colorTextSecondary: '#9FB0C4',
    colorDanger: '#FF6B6B',
    fontFamily: '"DM Sans", system-ui, sans-serif',
    borderRadius: '12px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': { border: '1px solid rgba(108,198,255,.22)', boxShadow: 'none' },
    '.Input:focus': { border: '1px solid #1E9BFF', boxShadow: '0 0 0 3px rgba(30,155,255,.25)' },
    '.Tab': { border: '1px solid rgba(108,198,255,.18)' },
    '.Tab--selected': { borderColor: '#F4B91F' },
  },
}

export const LAST_KEY = 'amz_last_booking'

function rememberBooking(draft, id, coupon, status) {
  const { total } = priceFor({ ...draft, coupon })
  sessionStorage.setItem(LAST_KEY, JSON.stringify({
    id, service: serviceLabel(draft), date: draft.date, time: draft.time,
    total, payment_status: status, name: draft.name,
  }))
}

function PayForm({ draft, coupon, total, onBooked, setErr }) {
  const stripe = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)
  const [ready, setReady] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setPaying(true)
    setErr('')
    saveDraft({ ...draft, coupon })
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: { return_url: `${window.location.origin}/confirmation` },
    })
    if (error) {
      setErr(error.message || 'Payment could not be completed.')
      setPaying(false)
      return
    }
    if (paymentIntent && ['succeeded', 'processing', 'requires_capture'].includes(paymentIntent.status)) {
      try {
        const res = await createBooking(draft, { paymentStatus: 'Paid', paymentIntentId: paymentIntent.id, coupon })
        onBooked(res.id, 'Paid')
      } catch (err) {
        setErr(`Payment received, but we couldn't save the booking (${err.message}). Please call ${BUSINESS.phoneDisplay} — reference ${paymentIntent.id}.`)
        setPaying(false)
      }
    } else {
      setErr('Payment was not completed. Please try again.')
      setPaying(false)
    }
  }

  return (
    <form onSubmit={submit} className="pay">
      <PaymentElement onReady={() => setReady(true)} options={{ layout: { type: 'tabs', defaultCollapsed: false } }} />
      <button type="submit" className="btn btn-gold btn-lg btn-block" disabled={!stripe || !ready || paying}>
        <Icon name="lock" size={18} /> {paying ? 'Processing…' : `Pay $${total} now`}
      </button>
    </form>
  )
}

export default function Checkout() {
  const navigate = useNavigate()
  const draft = useMemo(() => loadDraft(), [])
  const [coupon, setCoupon] = useState(draft?.coupon || '')
  const [code, setCode] = useState('')
  const [codeMsg, setCodeMsg] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [piError, setPiError] = useState('')
  const [err, setErr] = useState('')
  const [laterBusy, setLaterBusy] = useState(false)

  const canPayOnline = stripeReady && hasApi()
  const price = draft ? priceFor({ ...draft, coupon }) : { total: 0, subtotal: 0, discount: 0 }

  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => {
    if (!draft || !canPayOnline) return
    let live = true
    setClientSecret('')
    setPiError('')
    createPaymentIntent(draft, coupon)
      .then((d) => live && setClientSecret(d.clientSecret))
      .catch((e) => live && setPiError(e.status === 409
        ? 'That time was just booked by someone else. Please go back and pick another time.'
        : 'Online payment is temporarily unavailable. You can still reserve and pay later.'))
    return () => { live = false }
  }, [draft, coupon, canPayOnline])

  if (!draft) {
    return (
      <div className="flow">
        <div className="container checkout-page flow__empty">
          <h1>No booking in progress</h1>
          <p>Start by choosing a package and time.</p>
          <Link to="/book" className="btn btn-gold">Book a detail</Link>
        </div>
      </div>
    )
  }

  const onBooked = (id, status) => {
    rememberBooking(draft, id, status === 'Paid' ? coupon : '', status)
    clearDraft()
    navigate('/confirmation')
  }

  const applyCode = (e) => {
    e.preventDefault()
    const c = code.trim().toUpperCase()
    if (!c) { setCodeMsg('Enter a coupon code.'); return }
    if (c === PREPAY.code) { setCoupon(c); setCodeMsg(`Code applied — $${PREPAY.off} off.`); setCode('') }
    else setCodeMsg('That code isn’t valid.')
  }

  const payLater = async () => {
    setLaterBusy(true)
    setErr('')
    try {
      const res = await createBooking(draft, { paymentStatus: 'Pay Later', coupon: '' })
      onBooked(res.id, 'Pay Later')
    } catch (e) {
      setErr(e.status === 409
        ? 'That time was just booked by someone else. Please go back and choose another time.'
        : `We couldn't save your booking (${e.message}). Please try again or call ${BUSINESS.phoneDisplay}.`)
      setLaterBusy(false)
    }
  }

  return (
    <div className="flow">
      <div className="flow__bg" aria-hidden="true" />
      <div className="container checkout-page">
        <Link to="/book" className="back-link"><Icon name="arrowLeft" size={16} /> Edit booking</Link>
        <span className="eyebrow">Secure checkout</span>
        <h1 className="checkout__title">Confirm &amp; pay</h1>

        {coupon !== PREPAY.code && (
          <div className="prepay-banner">
            <Icon name="tag" size={22} />
            <div>
              <strong>${PREPAY.off} OFF when you prepay online</strong>
              <span>Use code <b>{PREPAY.code}</b> below.</span>
            </div>
            <button type="button" className="btn btn-sm btn-gold" onClick={() => { setCoupon(PREPAY.code); setCodeMsg(`Code applied — $${PREPAY.off} off.`) }}>Apply</button>
          </div>
        )}

        <div className="summary">
          <div className="summary__row">
            <div>
              <strong>{serviceLabel(draft)}</strong>
              <span>{formatLong(draft.date)} · {draft.time}</span>
            </div>
            <span>${price.subtotal}</span>
          </div>
          {price.discount > 0 && (
            <div className="summary__row summary__row--disc">
              <span>Prepay discount ({coupon})</span>
              <span>−${price.discount}</span>
            </div>
          )}
          <div className="summary__total">
            <span>Total</span>
            <strong>${price.total}</strong>
          </div>
        </div>

        <form className="coupon" onSubmit={applyCode}>
          <label htmlFor="coupon" className="sr-only">Coupon code</label>
          <input id="coupon" placeholder="Coupon code" value={code} onChange={(e) => { setCode(e.target.value); setCodeMsg('') }} autoComplete="off" />
          <button type="submit" className="btn btn-outline btn-sm">Apply</button>
          {codeMsg && <p className={`coupon__msg ${coupon ? 'is-ok' : ''}`}>{codeMsg}</p>}
        </form>

        {err && <div className="flow__error" role="alert"><Icon name="x" size={16} /> {err}</div>}

        <div className="paybox">
          <div className="paybox__head"><Icon name="lock" size={16} /> Card, Apple Pay, Google Pay &amp; Link</div>
          {!canPayOnline && <p className="flow__hint">Online payment isn’t set up yet — reserve now and pay on the day of service.</p>}
          {canPayOnline && piError && <p className="flow__hint">{piError}</p>}
          {canPayOnline && !piError && !clientSecret && <div className="paybox__skel"><span /><span /><span /></div>}
          {canPayOnline && clientSecret && (
            <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret, appearance }}>
              <PayForm draft={draft} coupon={coupon} total={price.total} onBooked={onBooked} setErr={setErr} />
            </Elements>
          )}
        </div>

        <button type="button" className="pay-later" onClick={payLater} disabled={laterBusy}>
          {laterBusy ? 'Reserving…' : 'I’ll pay later'}
        </button>
      </div>
    </div>
  )
}
