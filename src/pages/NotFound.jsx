import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flow">
      <div className="container confirm">
        <span className="eyebrow">404</span>
        <h1>This page took a wrong turn.</h1>
        <p>Let’s get you back on the road.</p>
        <Link to="/" className="btn btn-gold">Back to home</Link>
      </div>
    </div>
  )
}
