import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Scroll to top on route change, or to the #section when a hash link is used.
export default function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const id = hash.slice(1)
      const t = setTimeout(() => {
        const el = document.getElementById(id)
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 84
          window.scrollTo({ top: y, behavior: 'smooth' })
        }
      }, 60)
      return () => clearTimeout(t)
    }
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname, hash])
  return null
}
