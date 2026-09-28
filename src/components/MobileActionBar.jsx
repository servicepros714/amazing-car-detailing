import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from './Icon'
import { BUSINESS } from '../config/business'

// Bottom action bar for phones: slides in after the hero on the home page.
export default function MobileActionBar() {
  const { pathname } = useLocation()
  const hidden = ['/book', '/checkout', '/confirmation'].includes(pathname)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (hidden) return
    const onScroll = () => {
      const hero = document.getElementById('hero')
      const limit = hero ? hero.offsetHeight * 0.7 : 120
      setShow(window.scrollY > limit)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [hidden, pathname])

  if (hidden) return null

  return (
    <div className={`action-bar ${show ? 'action-bar--show' : ''}`} role="region" aria-label="Quick actions">
      <a href={BUSINESS.phoneHref} className="btn btn-outline">
        <Icon name="phone" size={18} /> Call Now
      </a>
      <Link to="/book" className="btn btn-gold">
        <Icon name="calendar" size={18} /> Book Online
      </Link>
    </div>
  )
}
