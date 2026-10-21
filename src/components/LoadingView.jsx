import { useEffect, useRef, useState } from 'react'
import './LoadingView.css'

const STEPS = [
  'Verificando credenciales…',
  'Estableciendo canal cifrado local…',
  'Desencriptando entorno de trabajo…',
  'Cargando módulo de anonimización…',
  'Montando HabeasGuard…',
]

function LoadingView({ onDone, duration = 2600 }) {
  const [progress, setProgress] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const doneRef = useRef(false)

  useEffect(() => {
    const start = performance.now()
    let frame

    const tick = (now) => {
      const elapsed = now - start
      const ratio = Math.min(elapsed / duration, 1)
      // Easing suave para que no se sienta lineal/artificial.
      const eased = 1 - Math.pow(1 - ratio, 3)
      const value = Math.round(eased * 100)
      setProgress(value)
      setStepIndex(Math.min(STEPS.length - 1, Math.floor(ratio * STEPS.length)))

      if (ratio < 1) {
        frame = requestAnimationFrame(tick)
      } else if (!doneRef.current) {
        doneRef.current = true
        setTimeout(() => onDone?.(), 350)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [duration, onDone])

  return (
    <main className="loading-shell">
      <div className="loading-scanline" aria-hidden="true" />
      <div className="loading-card">
        <div className="loading-mark">
          <span>H</span>
          <div className="loading-mark-ring" />
        </div>

        <h1>HabeasGuard</h1>
        <p className="loading-step" key={stepIndex}>{STEPS[stepIndex]}</p>

        <div className="loading-bar-track">
          <div className="loading-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="loading-meta">
          <span>{progress}%</span>
          <span>Conexión local · sin salida a servidores externos</span>
        </div>
      </div>
    </main>
  )
}

export default LoadingView