import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import BeforeAfter from '../components/BeforeAfter'
import useReveal from '../hooks/useReveal'
import { BUSINESS, PACKAGES, ADDON, REVIEWS, PREPAY } from '../config/business'

const TICKER = ['Mobile car detailing', 'Brea, CA', 'Interior deep cleans', 'Hand exterior washes', 'We come to you', 'Book online 7 days a week']

const STEPS = [
  { icon: 'sparkle', title: 'Pick a package', text: 'Basic or Premium interior detail, plus an optional hand exterior wash.' },
  { icon: 'calendar', title: 'Choose your time', text: 'Live calendar, 7 AM – 7 PM, every day of the week.' },
  { icon: 'car', title: 'We roll up', text: 'Our detailer arrives at your home or office in Brea and nearby cities.' },
  { icon: 'star', title: 'Drive off amazed', text: 'Walk out to a fresh, spotless cabin — no waiting room required.' },
]

const PLEDGE = [
  { icon: 'home', title: 'Fully mobile', text: 'Driveway, office lot or apartment parking — we bring the shine to you.' },
  { icon: 'tag', title: 'Upfront pricing', text: 'Flat package prices shown before you book. No surprise add-ons.' },
  { icon: 'shield', title: 'Secure checkout', text: `Pay online with card, Apple Pay or Google Pay and save $${PREPAY.off} — or pay later.` },
  { icon: 'drop', title: 'Pro-grade process', text: 'Triple-stage vacuuming, extraction, shampoo and UV protection.' },
]

const FAQ = [
  { q: 'Do you really come to me?', a: `Yes — ${BUSINESS.name} is fully mobile. We detail at your home, office or wherever your car is parked in ${BUSINESS.city} and surrounding cities.` },
  { q: 'What’s the difference between Basic and Premium?', a: 'Basic is a thorough interior reset: triple-stage vacuuming, a complete surface wipe-down and floor mat cleaning. Premium goes deeper with carpet extraction, full interior shampooing, interior glass, dust elimination and a UV-protectant coating.' },
  { q: 'Can I add an exterior wash?', a: `Absolutely. The Exterior Wash can be added to either package for +$${ADDON.price} — hand wash, rims, tire scrub and shine, door jambs and a spot-free hand dry.` },
  { q: 'How soon can I book?', a: 'Appointments run 7:00 AM to 7:00 PM, seven days a week. The earliest available slot is 4 hours from the current time so we can plan the route to you.' },
  { q: 'How does payment work?', a: `Pay securely online during checkout (use code ${PREPAY.code} for $${PREPAY.off} off), or choose “I’ll pay later” and settle up on the day of service.` },
  { q: 'Need to reschedule?', a: `No problem — call or text ${BUSINESS.phoneDisplay} and we’ll move your appointment to a time that works.` },
]

export default function Home() {
  useReveal([])
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <div className="home">
      {/* ── HERO ─────────────────────────────── */}
      <section id="hero" className="hero">
        <div className="hero__hex" aria-hidden="true" />
        <div className="hero__glow hero__glow--a" aria-hidden="true" />
        <div className="hero__glow hero__glow--b" aria-hidden="true" />
        <div className="container hero__grid">
          <div className="hero__copy">
            <span className="chip"><Icon name="pin" size={14} /> Mobile detailing · {BUSINESS.city}</span>
            <h1 className="hero__title">
              Detailing so good,<br />it’s <span className="script">Amazing.</span>
            </h1>
            <p className="hero__lead">
              Deep interior details and hand exterior washes, delivered to your driveway.
              Pick a package, choose a time, and we handle the rest.
            </p>
            <div className="hero__ctas">
              <Link to="/book" className="btn btn-gold btn-lg">
                Book Online <Icon name="arrow" size={18} />
              </Link>
              <a href={BUSINESS.phoneHref} className="btn btn-outline btn-lg">
                <Icon name="phone" size={18} /> {BUSINESS.phoneDisplay}
              </a>
            </div>
            <ul className="hero__facts">
              <li><strong>$150</strong><span>Details from</span></li>
              <li><strong>7 days</strong><span>7 AM – 7 PM</span></li>
              <li><strong>100%</strong><span>Mobile service</span></li>
            </ul>
          </div>

          <div className="hero__stack" aria-hidden="true">
            <figure className="stack__card stack__card--1"><img src="/images/wash-mitt.jpg" alt="" /></figure>
            <figure className="stack__card stack__card--2"><img src="/images/foam-headlight.jpg" alt="" /></figure>
            <figure className="stack__card stack__card--3"><img src="/images/pressure-rinse.jpg" alt="" /></figure>
            <img src="/images/logo-badge.webp" className="stack__badge" alt="" width="190" height="190" />
            <div className="stack__price">
              <span>Premium Detail</span>
              <strong>$200</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ───────────────────────────── */}
      <div className="ticker" aria-hidden="true">
        <div className="ticker__track">
          {[...TICKER, ...TICKER, ...TICKER].map((t, i) => (
            <span key={i}>{t}<Icon name="sparkle" size={16} /></span>
          ))}
        </div>
      </div>

      {/* ── SERVICES ─────────────────────────── */}
      <section id="services" className="section services">
        <div className="container">
          <div className="sec-head sec-head--split" data-reveal>
            <div>
              <span className="eyebrow">Packages &amp; pricing</span>
              <h2>Choose your level of <span className="script">clean.</span></h2>
            </div>
            <p>Flat prices, no guesswork. Every package is done by hand at your location — add an exterior wash to either one.</p>
          </div>

          <div className="pkg-grid">
            {PACKAGES.map((p, i) => (
              <article key={p.id} className={`pkg ${p.popular ? 'pkg--hero' : ''}`} data-reveal style={{ '--d': `${i * 120}ms` }}>
                {p.popular && <span className="pkg__flag">Full interior reset</span>}
                <header className="pkg__head">
                  <div>
                    <span className="pkg__idx">0{i + 1}</span>
                    <h3>{p.name}</h3>
                    <p>{p.tagline}</p>
                  </div>
                  <div className="pkg__price"><sup>$</sup>{p.price}</div>
                </header>
                <ul className="pkg__list">
                  {p.features.map((f) => (
                    <li key={f}><Icon name="check" size={16} stroke={2.6} />{f}</li>
                  ))}
                </ul>
                <p className="pkg__foot"><Icon name="plus" size={15} /> Add Exterior Wash for ${ADDON.price}</p>
              </article>
            ))}
          </div>

          <article className="addon" data-reveal>
            <div className="addon__medal">
              <span>Add-on</span>
              <strong>+${ADDON.price}</strong>
            </div>
            <div className="addon__body">
              <h3><Icon name="drop" size={22} /> {ADDON.name}</h3>
              <p>Pair it with Basic or Premium for a finish that shines inside and out.</p>
              <ul className="addon__chips">
                {ADDON.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
            <img src="/images/foam-truck.jpg" alt="Vehicle covered in snow foam during an exterior wash" className="addon__img" loading="lazy" />
          </article>

          <div className="services__cta" data-reveal>
            <Link to="/book" className="btn btn-gold btn-lg">Book now <Icon name="arrow" size={18} /></Link>
            <span>or call <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a></span>
          </div>
        </div>
      </section>

      {/* ── RESULTS ──────────────────────────── */}
      <section id="results" className="section results">
        <div className="container">
          <div className="results__grid">
            <div className="results__copy" data-reveal>
              <span className="eyebrow">Real results</span>
              <h2>Drag to see the <span className="script">difference.</span></h2>
              <p>
                Grime-caked floor mats, crumbs in the seams and dust on every panel — gone.
                This is what a proper interior detail looks like when it’s done by hand.
              </p>
              <ul className="results__points">
                <li><Icon name="wind" size={18} /> Debris pulled from seams, rails and vents</li>
                <li><Icon name="seat" size={18} /> Mats and carpets cleaned and restored</li>
                <li><Icon name="sparkle" size={18} /> Surfaces wiped and protected</li>
              </ul>
            </div>
            <div className="results__slider" data-reveal>
              <BeforeAfter before="/images/interior-before.jpg" after="/images/interior-after.jpg" alt="Car interior" />
            </div>
          </div>

          <div className="bento">
            <figure className="bento__item bento__item--tall" data-reveal>
              <img src="/images/foam-headlight.jpg" alt="Snow foam pre-wash on a front bumper and headlight" loading="lazy" />
              <figcaption>Snow-foam pre-wash</figcaption>
            </figure>
            <figure className="bento__item bento__item--wide" data-reveal>
              <img src="/images/foam-truck.jpg" alt="Pickup truck foamed for a hand wash in a driveway" loading="lazy" />
              <figcaption>Driveway foam bath</figcaption>
            </figure>
            <figure className="bento__item" data-reveal>
              <img src="/images/pressure-rinse.jpg" alt="Pressure rinse on a white sports car" loading="lazy" />
              <figcaption>Pressure rinse</figcaption>
            </figure>
            <figure className="bento__item" data-reveal>
              <img src="/images/wash-mitt.jpg" alt="Microfiber wash mitt on a hood" loading="lazy" />
              <figcaption>Microfiber hand wash</figcaption>
            </figure>
            <Link to="/book" className="bento__cta" data-reveal>
              <img src="/images/logo-badge.webp" alt="" width="96" height="96" loading="lazy" />
              <span>
                <strong>Your car could be next.</strong>
                <em>Book online in under two minutes <Icon name="arrow" size={16} /></em>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PROCESS ──────────────────────────── */}
      <section id="process" className="section process">
        <div className="container">
          <div className="sec-head sec-head--center" data-reveal>
            <span className="eyebrow">How it works</span>
            <h2>Four steps to a <span className="script">fresh</span> ride.</h2>
          </div>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className="step" data-reveal style={{ '--d': `${i * 110}ms` }}>
                <div className="step__hex"><Icon name={s.icon} size={26} /><span>{i + 1}</span></div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── STANDARD ─────────────────────────── */}
      <section className="section standard">
        <div className="container standard__grid">
          <div className="standard__intro" data-reveal>
            <span className="eyebrow">The Amazing standard</span>
            <h2>Why drivers in Brea book with us.</h2>
            <p>Simple pricing, a real booking calendar and a detailer who shows up ready to work.</p>
            {BUSINESS.googleReviewUrl && (
              <a href={BUSINESS.googleReviewUrl} target="_blank" rel="noreferrer" className="btn btn-outline">
                <Icon name="star" size={16} /> Read our Google reviews
              </a>
            )}
          </div>
          <div className="pledge">
            {PLEDGE.map((p, i) => (
              <div key={p.title} className="pledge__card" data-reveal style={{ '--d': `${i * 90}ms` }}>
                <span className="pledge__icon"><Icon name={p.icon} size={22} /></span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
        </div>

        {REVIEWS.length > 0 && (
          <div className="container reviews" data-reveal>
            <div className="reviews__track">
              {REVIEWS.map((r, i) => (
                <blockquote key={i} className="review">
                  <div className="review__stars">{Array.from({ length: 5 }).map((_, k) => <Icon key={k} name="star" size={15} fill="currentColor" />)}</div>
                  <p>{r.text}</p>
                  <footer>{r.name}{r.service ? ` · ${r.service}` : ''}</footer>
                </blockquote>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── AREA ─────────────────────────────── */}
      <section id="area" className="section area">
        <div className="container area__grid">
          <div className="area__map" data-reveal>
            <iframe
              title={`Map of ${BUSINESS.city}`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(BUSINESS.mapQuery)}&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="area__copy" data-reveal>
            <span className="eyebrow">Service area</span>
            <h2>Based in Brea. <span className="script">Rolling</span> to you.</h2>
            <p>We detail across North Orange County and the neighboring cities below. Not sure if you’re covered? Give us a call.</p>
            <ul className="area__cities">
              {BUSINESS.serviceArea.map((c) => <li key={c}><Icon name="pin" size={14} />{c}</li>)}
            </ul>
            <div className="area__hours">
              <div><Icon name="clock" size={18} /><span><strong>Hours</strong>{BUSINESS.hours} · 7 AM – 7 PM</span></div>
              <div><Icon name="phone" size={18} /><span><strong>Call or text</strong><a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a></span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────── */}
      <section id="faq" className="section faq">
        <div className="container faq__grid">
          <div className="faq__side" data-reveal>
            <span className="eyebrow">FAQ</span>
            <h2>Good questions.</h2>
            <p>Anything else? Call <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a> — we’re happy to help.</p>
          </div>
          <div className="faq__list">
            {FAQ.map((f, i) => {
              const open = openFaq === i
              return (
                <div key={f.q} className={`qa ${open ? 'qa--open' : ''}`} data-reveal>
                  <button className="qa__q" aria-expanded={open} onClick={() => setOpenFaq(open ? -1 : i)}>
                    <span>{f.q}</span>
                    <Icon name="plus" size={20} />
                  </button>
                  <div className="qa__a"><div><p>{f.a}</p></div></div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────── */}
      <section className="final">
        <div className="container">
        <div className="final__inner" data-reveal>
          <div className="final__bubbles" aria-hidden="true"><i /><i /><i /><i /><i /></div>
          <h2>Ready for an <span className="script">Amazing</span> detail?</h2>
          <p>Book in under two minutes. Pay online and save ${PREPAY.off}, or pay later.</p>
          <div className="final__ctas">
            <Link to="/book" className="btn btn-gold btn-lg"><Icon name="calendar" size={18} /> Book Online</Link>
            <a href={BUSINESS.phoneHref} className="btn btn-outline btn-lg"><Icon name="phone" size={18} /> Call Now</a>
          </div>
        </div>
        </div>
      </section>
    </div>
  )
}
