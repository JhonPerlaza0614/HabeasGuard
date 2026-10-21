import { useState } from 'react'
import LoginView from './components/LoginView'
import LoadingView from './components/LoadingView'
import NotificationBar from './components/NotificationBar'
import MoodPrompt from './components/MoodPrompt'
import App from './App.jsx'

// Orquesta el recorrido Login -> Animación de carga -> Implementación principal.
// No modifica App.jsx: solo decide cuál vista se monta en cada momento.
function AppFlow() {
  const [stage, setStage] = useState('login') // 'login' | 'loading' | 'app'

  if (stage === 'login') {
    return <LoginView onSuccess={() => setStage('loading')} />
  }

  if (stage === 'loading') {
    return <LoadingView onDone={() => setStage('app')} />
  }

  return (
    <>
      <NotificationBar />
      <App />
      <MoodPrompt />
    </>
  )
}

export default AppFlow