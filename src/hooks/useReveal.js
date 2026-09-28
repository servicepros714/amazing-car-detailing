import { useEffect } from 'react'

// Reveal-on-scroll: elements with [data-reveal] get .is-in when they enter the viewport.
// Hiding only kicks in after <html> gets .reveal-ready, and a scroll check backs up
// the observer, so content can never stay invisible.
export default function useReveal(deps = []) {
  useEffect(() => {
    const root = document.documentElement
    const els = [...document.querySelectorAll('[data-reveal]:not(.is-in)')]
    const showAll = () => els.forEach((el) => el.classList.add('is-in'))

    if (!('IntersectionObserver' in window)) {
      showAll()
      return
    }

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in')
          io.unobserve(e.target)
        }
      }),
      { threshold: 0, rootMargin: '0px 0px -8% 0px' },
    )

    // Anything already on screen (or above it) shows immediately.
    const vh = window.innerHeight
    els.forEach((el) => {
      if (el.getBoundingClientRect().top < vh) el.classList.add('is-in')
      else io.observe(el)
    })
    root.classList.add('reveal-ready')

    // Backup check on scroll in case the observer ever misses an element.
    const onScroll = () => {
      const h = window.innerHeight
      els.forEach((el) => {
        if (!el.classList.contains('is-in') && el.getBoundingClientRect().top < h) el.classList.add('is-in')
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => { io.disconnect(); window.removeEventListener('scroll', onScroll) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}