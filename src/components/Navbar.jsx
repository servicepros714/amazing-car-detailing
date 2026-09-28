import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from './Icon'
import { BUSINESS } from '../config/business'

const LINKS = [
  { to: '/#services', label: 'Services' },
  { to: '/#results', label: 'Results' },
  { to: '/#process', label: 'How it works' },
  { to: '/#area', label: 'Service area' },
  { to: '/#faq', label: 'FAQ' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { pathname, hash } = useLocation()
  const minimal = ['/book', '/checkout', '/confirmation'].includes(pathname)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [pathname, hash])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <header className={`dock ${scrolled ? 'dock--scrolled' : ''} ${minimal ? 'dock--minimal' : ''}`}>
        <div className="dock__inner">
          <Link to="/" className="dock__brand" aria-label={`${BUSINESS.name} home`}>
            <img src="/images/logo-nav.png" alt="" width="52" height="52" />
            <span className="dock__name">
              <em>Amazing</em>
              <small>Car Detailing</small>
            </span>
          </Link>

          {!minimal && (
            <nav className="dock__links" aria-label="Main">
              {LINKS.map((l) => (
                <Link key={l.to} to={l.to}>{l.label}</Link>
              ))}
            </nav>
          )}

          <div className="dock__actions">
            <a href={BUSINESS.phoneHref} className="dock__phone">
              <Icon name="phone" size={16} />
              <span>{BUSINESS.phoneDisplay}</span>
            </a>
            {!minimal && (
              <Link to="/book" className="btn btn-gold btn-sm dock__book">Book Online</Link>
            )}
            {!minimal && (
              <button
                className="dock__toggle"
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
              >
                <Icon name={open ? 'x' : 'menu'} size={22} />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className={`drawer ${open ? 'drawer--open' : ''}`} aria-hidden={!open}>
        <div className="drawer__glow" />
        <nav className="drawer__nav" aria-label="Mobile">
          {LINKS.map((l, i) => (
            <Link key={l.to} to={l.to} style={{ transitionDelay: open ? `${80 + i * 50}ms` : '0ms' }}>
              <span className="drawer__num">0{i + 1}</span>
              {l.label}
              <Icon name="arrow" size={18} />
            </Link>
          ))}
        </nav>
        <div className="drawer__meta">
          <p><Icon name="pin" size={16} /> Mobile service · {BUSINESS.city}</p>
          <p><Icon name="clock" size={16} /> {BUSINESS.hours}</p>
        </div>
        <div className="drawer__bar">
          <a href={BUSINESS.phoneHref} className="btn btn-outline">
            <Icon name="phone" size={18} /> Call Now
          </a>
          <Link to="/book" className="btn btn-gold">
            <Icon name="calendar" size={18} /> Book Online
          </Link>
        </div>
      </div>
    </>
  )
}
