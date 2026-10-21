import { useEffect, useRef, useState } from 'react'
import './MoodPrompt.css'

const INTERVAL_MS = 60_000 // aparece cada 1 minuto
const ALERT_THRESHOLD = 3 // respuestas por debajo de 3 disparan el aviso
const ALERT_DURATION_MS = 4000
const STARS = Array.from({ length: 10 }, (_, index) => index + 1)

function Star({ filled }) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <path
        d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8L12 2.8z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Pop-up periódico "¿Cómo estás hoy?" con promedio acumulado. Solo front, sin persistencia.
function MoodPrompt() {
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(0)
  const [answers, setAnswers] = useState([])
  const [alerting, setAlerting] = useState(false)
  const openRef = useRef(false)
  const alertTimer = useRef(null)

  useEffect(() => { openRef.current = open }, [open])

  // Cada minuto abre la pregunta, salvo que ya esté visible.
  useEffect(() => {
    const id = setInterval(() => { if (!openRef.current) setOpen(true) }, INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  useEffect(() => () => clearTimeout(alertTimer.current), [])

  const answer = (value) => {
    setAnswers((current) => [...current, value])
    setOpen(false)
    setHover(0)
    if (value < ALERT_THRESHOLD) {
      setAlerting(true)
      clearTimeout(alertTimer.current)
      alertTimer.current = setTimeout(() => setAlerting(false), ALERT_DURATION_MS)
    }
  }

  const average = answers.length ? answers.reduce((sum, value) => sum + value, 0) / answers.length : null
  const shown = hover

  return (
    <>
      {average !== null && (
        <div className="mood-average" aria-live="polite">
          <span className="mood-average-label">Promedio de ánimo</span>
          <strong>{Number.isInteger(average) ? average : average.toFixed(1)}<small>/10</small></strong>
          <span className="mood-average-count">{answers.length} {answers.length === 1 ? 'respuesta' : 'respuestas'}</span>
        </div>
      )}

      {open && (
        <div className="mood-overlay">
          <div className="mood-modal" role="dialog" aria-modal="true" aria-labelledby="mood-title">
            <button type="button" className="mood-close" aria-label="Cerrar" onClick={() => { setOpen(false); setHover(0) }}>×</button>
            <h2 id="mood-title">¿Cómo estás hoy?</h2>
            <p>Selecciona del 1 al 10.</p>

            <div className="mood-stars" role="radiogroup" aria-label="Estado de ánimo del 1 al 10" onMouseLeave={() => setHover(0)}>
              {STARS.map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked="false"
                  aria-label={`${value} de 10`}
                  className={`mood-star${value <= shown ? ' is-on' : ''}`}
                  onMouseEnter={() => setHover(value)}
                  onFocus={() => setHover(value)}
                  onBlur={() => setHover(0)}
                  onClick={() => answer(value)}
                >
                  <Star filled={value <= shown} />
                  <span>{value}</span>
                </button>
              ))}
            </div>

            <div className="mood-scale">
              <span>1 · Muy mal</span>
              <span>10 · Excelente</span>
            </div>
          </div>
        </div>
      )}

      {alerting && (
        <div className="mood-overlay mood-overlay-alert">
          <div className="mood-modal mood-alert" role="alertdialog" aria-live="assertive">
            <div className="mood-spinner" aria-hidden="true" />
            <h2>Notificando al jefe</h2>
            <p>Tu respuesta fue menor a {ALERT_THRESHOLD}.</p>
          </div>
        </div>
      )}
    </>
  )
}

export default MoodPrompt