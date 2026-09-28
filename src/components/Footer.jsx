import { Link } from 'react-router-dom'
import Icon from './Icon'
import { BUSINESS } from '../config/business'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="foot">
      <div className="foot__arc" aria-hidden="true" />
      <div className="container foot__inner">
        <img src="/images/logo-badge.webp" alt={BUSINESS.name} className="foot__badge" width="150" height="150" loading="lazy" />
        <p className="foot__script">Showroom shine, right in your driveway.</p>

        <div className="foot__row">
          <div className="foot__col">
            <h4>Reach us</h4>
            <a href={BUSINESS.phoneHref}><Icon name="phone" size={16} /> {BUSINESS.phoneDisplay}</a>
            <span><Icon name="pin" size={16} /> {BUSINESS.city} · Mobile</span>
            <span><Icon name="clock" size={16} /> {BUSINESS.hours}</span>
          </div>
          <div className="foot__col">
            <h4>Explore</h4>
            <Link to="/#services">Packages &amp; pricing</Link>
            <Link to="/#results">Before &amp; after</Link>
            <Link to="/#process">How it works</Link>
            <Link to="/#faq">FAQ</Link>
          </div>
          <div className="foot__col">
            <h4>Packages</h4>
            <Link to="/book?package=basic">Basic Detail — $150</Link>
            <Link to="/book?package=premium">Premium Detail — $200</Link>
            <Link to="/book">Exterior Wash — +$50</Link>
            <Link to="/book" className="foot__cta">Book online <Icon name="arrow" size={15} /></Link>
          </div>
        </div>

        <div className="foot__bottom">
          <span>© {year} {BUSINESS.name}. All rights reserved.</span>
          <span>Serving {BUSINESS.serviceArea.slice(0, 4).join(' · ')} &amp; nearby</span>
        </div>
      </div>
    </footer>
  )
}
