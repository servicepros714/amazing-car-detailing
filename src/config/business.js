// Single source of truth for business details, services and booking rules.
export const BUSINESS = {
  name: 'Amazing Car Detailing',
  short: 'Amazing',
  phoneDisplay: '(657) 701-2638',
  phoneHref: 'tel:+16577012638',
  city: 'Brea, CA',
  hours: 'Mon–Sun by appointment',
  email: '',
  // Paste the Google Business Profile review link here to show the "Review us" button.
  googleReviewUrl: '',
  mapQuery: 'Brea, CA',
  serviceArea: ['Brea', 'Fullerton', 'Yorba Linda', 'La Habra', 'Placentia', 'Diamond Bar', 'Chino Hills', 'Anaheim Hills'],
}

// Add real customer reviews here (from Google) to switch on the reviews carousel.
// Shape: { name: 'First L.', text: '...', service: 'Premium Detail' }
export const REVIEWS = []

export const PACKAGES = [
  {
    id: 'basic',
    name: 'Basic Detail',
    price: 150,
    tagline: 'A fast, thorough interior reset.',
    features: [
      'Triple-Stage Vacuuming for Deep Debris Removal',
      'Complete Interior Surface Wipe-Down',
      'Floor Mat Cleaning & Restoration',
    ],
  },
  {
    id: 'premium',
    name: 'Premium Detail',
    price: 200,
    tagline: 'Deep-clean, shampoo and protect.',
    popular: true,
    features: [
      'Triple-Stage Vacuuming',
      'Cabin Application',
      'Dust Elimination',
      'Interior Window Cleaning',
      'Deep Carpet Cleaning',
      'Cloth & Carpet Extraction',
      'Full Interior Shampooing',
      'UV-Protectant Coating',
    ],
  },
]

export const ADDON = {
  id: 'exterior',
  name: 'Exterior Wash',
  price: 50,
  features: [
    'Hand-Washed Exterior',
    'Detailed Rim Cleaning',
    'Tire Scrub and Degrease',
    'Door Jamb & Panel Wipe-Down',
    'Premium Tire Shine Application',
    'Spot-Free Hand Drying',
  ],
}

export const PREPAY = { code: 'PREPAY', off: 15 }

// Booking window: 7:00 AM – 7:00 PM, hourly. Earliest slot = now (California) + 4 hours.
export const SLOT_START_HOUR = 7
export const SLOT_END_HOUR = 19
export const LEAD_HOURS = 4
export const DAYS_AHEAD = 60

export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
export const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
