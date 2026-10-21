import { useEffect, useRef, useState } from 'react'
import './NotificationBar.css'

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15L6 16.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 20.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Barra de tareas superior izquierda. Solo visual: no hay lógica de notificaciones.
function NotificationBar() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onPointer = (event) => { if (ref.current && !ref.current.contains(event.target)) setOpen(false) }
    const onKey = (event) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <div className="notif-taskbar" ref={ref}>
        <button
          type="button"
          className={`notif-trigger${open ? ' is-open' : ''}`}
          aria-expanded={open}
          aria-haspopup="true"
          aria-label="Notificaciones: 2 pendientes"
          onClick={() => setOpen((value) => !value)}
        >
          <BellIcon />
          <span className="notif-count">2</span>
          <svg className="notif-chevron" viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <div className="notif-dropdown" role="menu">
            <div className="notif-dropdown-head">
              <ClockIcon />
              <strong>Pendientes</strong>
            </div>
            <p className="notif-dropdown-body">
              <span className="notif-dot" aria-hidden="true" />
              2 notificaciones nuevas
            </p>
          </div>
        )}
      </div>
      <div className="notif-spacer" aria-hidden="true" />
    </>
  )
}

export default NotificationBar