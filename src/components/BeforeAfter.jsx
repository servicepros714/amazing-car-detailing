import { useRef, useState, useCallback } from 'react'

export default function BeforeAfter({ before, after, alt = 'Interior' }) {
  const [pos, setPos] = useState(50)
  const ref = useRef(null)
  const dragging = useRef(false)

  const move = useCallback((clientX) => {
    const r = ref.current.getBoundingClientRect()
    const p = ((clientX - r.left) / r.width) * 100
    setPos(Math.min(100, Math.max(0, p)))
  }, [])

  return (
    <div
      className="ba"
      ref={ref}
      style={{ touchAction: 'pan-y' }}
      onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); move(e.clientX) }}
      onPointerMove={(e) => dragging.current && move(e.clientX)}
      onPointerUp={() => { dragging.current = false }}
      onPointerCancel={() => { dragging.current = false }}
    >
      <img src={before} alt={`${alt} before detailing`} className="ba__img" draggable="false" />
      <img
        src={after}
        alt={`${alt} after detailing`}
        className="ba__img ba__after"
        style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
        draggable="false"
      />
      <span className="ba__tag ba__tag--before">Before</span>
      <span className="ba__tag ba__tag--after">After</span>
      <div className="ba__handle" style={{ left: `${pos}%` }}>
        <span className="ba__knob" aria-hidden="true">‹ ›</span>
      </div>
      <input
        type="range" min="0" max="100" value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="ba__range" aria-label="Drag to compare before and after"
      />
    </div>
  )
}
