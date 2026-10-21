import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppFlow from './AppFlow.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppFlow />
  </StrictMode>,
)