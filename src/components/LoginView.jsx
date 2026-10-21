import { useState } from 'react'
import './LoginView.css'

function ShieldMark() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <path d="M12 2.5l7.5 3v5.3c0 5-3.2 8.9-7.5 10.7-4.3-1.8-7.5-5.7-7.5-10.7V5.5l7.5-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 12.1l2.1 2.1L15.3 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LoginView({ onSuccess }) {
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)

  const handleSubmit = (event) => {
    event.preventDefault()
    // Solo front: no hay validación real, cualquier envío continúa el flujo.
    onSuccess?.()
  }

  return (
    <main className="login-shell">
      <div className="login-aside">
        <div className="login-aside-mark"><span>H</span></div>
        <h1>HabeasGuard</h1>
        <p>Escudo de hábeas data para operadores jurídicos.</p>
        <ul className="login-aside-points">
          <li>Anonimización de datos sensibles antes de salir del equipo</li>
          <li>Trazabilidad local de cada consulta</li>
          <li>Cero dependencia de almacenamiento externo</li>
        </ul>
      </div>

      <div className="login-panel-wrap">
        <form className="login-panel" onSubmit={handleSubmit}>
          <div className="login-head">
            <span className="login-badge"><ShieldMark /> Acceso cifrado local</span>
            <h2>Inicia sesión</h2>
            <p>Ingresa tus credenciales para continuar a la plataforma.</p>
          </div>

          <label className="login-field">
            <span>Usuario o correo</span>
            <input
              type="text"
              placeholder="nombre@dominio.com"
              autoComplete="username"
              value={user}
              onChange={(event) => setUser(event.target.value)}
            />
          </label>

          <label className="login-field">
            <span>Contraseña</span>
            <input
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <div className="login-row">
            <label className="login-checkbox">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
              <span>Recordar en este equipo</span>
            </label>
            <button type="button" className="login-link">¿Olvidaste tu contraseña?</button>
          </div>

          <button type="submit" className="login-submit">Ingresar</button>

          <p className="login-foot">Acceso restringido · Uso exclusivo del equipo autorizado</p>
        </form>
      </div>
    </main>
  )
}

export default LoginView