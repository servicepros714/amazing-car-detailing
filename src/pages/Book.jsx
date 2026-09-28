import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icon'
import { PACKAGES, ADDON, BUSINESS } from '../config/business'
import { ALL_SLOTS, openSlotsFor, bookableRange, formatLong, monthLabel, pad, fromYmd } from '../lib/time'
import { getBookedTimes, priceFor, saveDraft, loadDraft } from '../lib/bookingDb'

const STEPS = ['Package', 'Add-on', 'Date & time', 'Your info']
const FIELDS = [
  { key: 'name', label: 'Full name', type: 'text', auto: 'name', placeholder: 'Jordan Smith', icon: 'user' },
  { key: 'phone', label: 'Phone number', type: 'tel', auto: 'tel', placeholder: '(657) 555-0123', icon: 'phone' },
  { key: 'email', label: 'Email', type: 'email', auto: 'email', placeholder: 'you@email.com', icon: 'mail' },
  { key: 'vehicle', label: 'Vehicle', type: 'text', auto: 'off', placeholder: 'Year Make Model — e.g. 2021 BMW 330i', icon: 'car' },
  { key: 'address', label: 'Service address', type: 'text', auto: 'street-address', placeholder: 'Street, city, ZIP', icon: 'pin' },
]

const fmtPhone = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 10)
  if (d.length < 4) return d
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

function validateInfo(info) {
  if (info.name.trim().length < 2) return ['name', 'Please enter your full name.']
  if (info.phone.replace(/\D/g, '').length !== 10) return ['phone', 'Please enter a 10-digit phone number.']
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(info.email.trim())) return ['email', 'Please enter a valid email address.']
  if (info.vehicle.trim().length < 3) return ['vehicle', 'Please enter your vehicle (Year Make Model).']
  if (info.address.trim().length < 5) return ['address', 'Please enter the service address.']
  return null
}

export default function Book() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const draft = useMemo(() => loadDraft(), [])
  const initialPkg = params.get('package') || draft?.packageId || ''

  const [step, setStep] = useState(0)
  const [packageId, setPackageId] = useState(PACKAGES.some((p) => p.id === initialPkg) ? initialPkg : '')
  const [exterior, setExterior] = useState(!!draft?.exterior)
  const [date, setDate] = useState(draft?.date || '')
  const [time, setTime] = useState(draft?.time || '')
  const [info, setInfo] = useState({
    name: draft?.name || '', phone: draft?.phone || '', email: draft?.email || '',
    vehicle: draft?.vehicle || '', address: draft?.address || '',
  })
  const [error, setError] = useState(null) // { field, msg }
  const [booked, setBooked] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const refs = useRef({})
  const topRef = useRef(null)

  const range = useMemo(() => bookableRange(), [])
  const [view, setView] = useState(() => {
    const d = fromYmd(date || range.first)
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() }
  })

  const { total } = priceFor({ packageId, exterior })

  // Scroll to the top of the flow on every step change.
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [step])

  useEffect(() => {
    if (!date) return
    let live = true
    setLoadingSlots(true)
    getBookedTimes(date)
      .then((b) => live && setBooked(b))
      .catch(() => live && setBooked([]))
      .finally(() => live && setLoadingSlots(false))
    return () => { live = false }
  }, [date])

  const open = useMemo(() => (date ? openSlotsFor(date).map((s) => s.label) : []), [date])
  const isAvailable = (label) => open.includes(label) && !booked.includes(label)

  useEffect(() => {
    if (time && !loadingSlots && date && !isAvailable(time)) setTime('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booked, open, loadingSlots])

  const fail = (field, msg) => {
    setError({ field, msg })
    const el = refs.current[field]
    if (el) {
      el.focus({ preventScroll: true })
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const next = () => {
    setError(null)
    if (step === 0 && !packageId) return fail('package', 'Please choose a package to continue.')
    if (step === 2) {
      if (!date) return fail('date', 'Please pick a date for your detail.')
      if (!time) return fail('time', 'Please pick an available time.')
    }
    if (step === 3) {
      const bad = validateInfo(info)
      if (bad) return fail(bad[0], bad[1])
      saveDraft({ packageId, exterior, date, time, ...info })
      navigate('/checkout')
      return
    }
    setStep((s) => s + 1)
  }

  const back = () => {
    setError(null)
    if (step === 0) navigate('/')
    else setStep((s) => s - 1)
  }

  // Calendar grid
  const days = useMemo(() => {
    const first = new Date(Date.UTC(view.y, view.m, 1))
    const count = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate()
    const lead = first.getUTCDay()
    const cells = Array.from({ length: lead }, () => null)
    for (let d = 1; d <= count; d++) {
      const ymd = `${view.y}-${pad(view.m + 1)}-${pad(d)}`
      const disabled = ymd < range.first || ymd > range.last || openSlotsFor(ymd).length === 0
      cells.push({ d, ymd, disabled })
    }
    return cells
  }, [view, range])

  const firstView = fromYmd(range.first)
  const lastView = fromYmd(range.last)
  const canPrev = view.y > firstView.getUTCFullYear() || view.m > firstView.getUTCMonth()
  const canNext = view.y < lastView.getUTCFullYear() || view.m < lastView.getUTCMonth()
  const shiftMonth = (n) => setView((v) => {
    const d = new Date(Date.UTC(v.y, v.m + n, 1))
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() }
  })

  const pkg = PACKAGES.find((p) => p.id === packageId)

  return (
    <div className="flow" ref={topRef}>
      <div className="flow__bg" aria-hidden="true" />
      <div className="container flow__wrap">
        <div className="flow__top">
          <span className="eyebrow">Book your detail</span>
          <h1>{['Pick your package', 'Add an exterior wash?', 'Choose a date & time', 'Where should we meet you?'][step]}</h1>
        </div>

        <ol className="progress" aria-label="Booking steps">
          {STEPS.map((s, i) => (
            <li key={s} className={i === step ? 'is-active' : i < step ? 'is-done' : ''}>
              <span className="progress__dot">{i < step ? <Icon name="check" size={14} stroke={3} /> : i + 1}</span>
              <span className="progress__label">{s}</span>
            </li>
          ))}
        </ol>

        {error && (
          <div className="flow__error" role="alert">
            <Icon name="x" size={16} /> {error.msg}
          </div>
        )}

        {/* STEP 1 — PACKAGE */}
        {step === 0 && (
          <div className="pick-grid" ref={(el) => { refs.current.package = el }} tabIndex={-1}>
            {PACKAGES.map((p) => {
              const on = packageId === p.id
              return (
                <button
                  key={p.id} type="button"
                  className={`pick ${on ? 'pick--on' : ''}`}
                  aria-pressed={on}
                  onClick={() => { setPackageId(p.id); setError(null) }}
                >
                  <span className={`tick ${on ? 'tick--on' : ''}`} aria-hidden="true"><Icon name="check" size={14} stroke={3} /></span>
                  <span className="pick__head">
                    <span className="pick__name">{p.name}</span>
                    <span className="pick__price">${p.price}</span>
                  </span>
                  <span className="pick__tag">{p.tagline}</span>
                  <ul className="pick__list">
                    {p.features.map((f) => <li key={f}><Icon name="check" size={14} stroke={2.6} />{f}</li>)}
                  </ul>
                </button>
              )
            })}
          </div>
        )}

        {/* STEP 2 — ADD-ON */}
        {step === 1 && (
          <div className="addon-step">
            <button
              type="button"
              className={`pick pick--addon ${exterior ? 'pick--on' : ''}`}
              aria-pressed={exterior}
              onClick={() => setExterior((v) => !v)}
            >
              <span className={`tick ${exterior ? 'tick--on' : ''}`} aria-hidden="true"><Icon name="check" size={14} stroke={3} /></span>
              <img src="/images/foam-truck.jpg" alt="" className="pick__img" />
              <span className="pick__head">
                <span className="pick__name"><Icon name="drop" size={18} /> {ADDON.name}</span>
                <span className="pick__price">+${ADDON.price}</span>
              </span>
              <ul className="pick__list pick__list--cols">
                {ADDON.features.map((f) => <li key={f}><Icon name="check" size={14} stroke={2.6} />{f}</li>)}
              </ul>
              <span className="pick__toggle">{exterior ? 'Added to your detail — tap to remove' : 'Tap to add to your detail'}</span>
            </button>
            <p className="flow__hint">Optional — skip it and continue if you only need the interior.</p>
          </div>
        )}

        {/* STEP 3 — DATE & TIME */}
        {step === 2 && (
          <div className="when">
            <div className="cal" ref={(el) => { refs.current.date = el }} tabIndex={-1}>
              <div className="cal__head">
                <button type="button" onClick={() => shiftMonth(-1)} disabled={!canPrev} aria-label="Previous month"><Icon name="left" /></button>
                <strong>{monthLabel(view.y, view.m)}</strong>
                <button type="button" onClick={() => shiftMonth(1)} disabled={!canNext} aria-label="Next month"><Icon name="right" /></button>
              </div>
              <div className="cal__dow">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}</div>
              <div className="cal__grid">
                {days.map((c, i) => c ? (
                  <button
                    key={c.ymd} type="button" disabled={c.disabled}
                    className={`cal__day ${date === c.ymd ? 'is-sel' : ''} ${c.ymd === range.first ? 'is-today' : ''}`}
                    onClick={() => { setDate(c.ymd); setError(null) }}
                    aria-label={formatLong(c.ymd)} aria-pressed={date === c.ymd}
                  >{c.d}</button>
                ) : <span key={`e${i}`} />)}
              </div>
            </div>

            <div className="slots" ref={(el) => { refs.current.time = el }} tabIndex={-1}>
              <div className="slots__head">
                <Icon name="clock" size={18} />
                <span>{date ? formatLong(date) : 'Select a date to see times'}</span>
              </div>
              {date && (
                loadingSlots ? (
                  <div className="slots__grid">{ALL_SLOTS.map((s) => <span key={s.label} className="slot slot--skel" />)}</div>
                ) : (
                  <div className="slots__grid">
                    {ALL_SLOTS.map((s) => {
                      const ok = isAvailable(s.label)
                      return (
                        <button
                          key={s.label} type="button" disabled={!ok}
                          className={`slot ${time === s.label ? 'is-sel' : ''}`}
                          onClick={() => { setTime(s.label); setError(null) }}
                        >{s.label}</button>
                      )
                    })}
                  </div>
                )
              )}
              {date && !loadingSlots && !ALL_SLOTS.some((s) => isAvailable(s.label)) && (
                <p className="flow__hint">No openings left on this day — please pick another date.</p>
              )}
            </div>
          </div>
        )}

        {/* STEP 4 — INFO */}
        {step === 3 && (
          <div className="info">
            <div className="info__recap">
              <div><span>Service</span><strong>{pkg?.name}{exterior ? ` + ${ADDON.name}` : ''}</strong></div>
              <div><span>When</span><strong>{date && formatLong(date)} · {time}</strong></div>
            </div>
            <div className="form-grid">
              {FIELDS.map((f) => (
                <label key={f.key} className={`field ${f.key === 'address' || f.key === 'vehicle' ? 'field--wide' : ''} ${error?.field === f.key ? 'field--err' : ''}`}>
                  <span className="field__label">{f.label}</span>
                  <span className="field__box">
                    <Icon name={f.icon} size={18} />
                    <input
                      ref={(el) => { refs.current[f.key] = el }}
                      type={f.type} autoComplete={f.auto} placeholder={f.placeholder}
                      inputMode={f.type === 'tel' ? 'tel' : undefined}
                      value={info[f.key]}
                      onChange={(e) => {
                        const v = f.key === 'phone' ? fmtPhone(e.target.value) : e.target.value
                        setInfo((s) => ({ ...s, [f.key]: v }))
                        if (error?.field === f.key) setError(null)
                      }}
                    />
                  </span>
                  {error?.field === f.key && <span className="field__msg">{error.msg}</span>}
                </label>
              ))}
            </div>
            <p className="flow__hint">
              Questions? Call <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a>.
            </p>
          </div>
        )}
      </div>

      {/* Sticky action bar — Back / Continue */}
      <div className="stickybar">
        <div className="stickybar__inner">
          <button type="button" className="btn btn-ghost" onClick={back}>
            <Icon name="arrowLeft" size={18} /> {step === 0 ? 'Home' : 'Back'}
          </button>
          <div className="stickybar__total">
            <span>Total</span>
            <strong>${total}</strong>
          </div>
          <button type="button" className="btn btn-gold" onClick={next}>
            {step === 3 ? 'Checkout' : 'Continue'} <Icon name="arrow" size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
