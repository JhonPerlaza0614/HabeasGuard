import { useEffect, useState } from 'react'
import './App.css'
import { crearAnonimizador } from './lib/anonimizador'
import { contieneOriginal, desanonimizar } from './lib/normalizar'

const DEMO = 'El señor Carlos Gómez, cédula 1122334455, celular 3001234567 y correo carlos@example.com, vive en Calle 12 # 34-56. La EPS negó sus antirretrovirales.'

function download(text, extension) {
  const blob = new Blob([text], { type: extension === 'doc' ? 'application/msword' : 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `habeasguard-respuesta.${extension}`
  anchor.click()
  URL.revokeObjectURL(url)
}

function App() {
  const [question, setQuestion] = useState('')
  const [attachments, setAttachments] = useState([])
  const [level, setLevel] = useState('estandar')
  const [messages, setMessages] = useState([])
  const [map, setMap] = useState(() => JSON.parse(sessionStorage.getItem('habeasguard-map') || '{}'))
  const [pending, setPending] = useState(null)
  const [state, setState] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')

  useEffect(() => {
    fetch('/api/estado').then((response) => response.json()).then(setState).catch(() => setState({ ollama: false }))
  }, [])
  useEffect(() => { sessionStorage.setItem('habeasguard-map', JSON.stringify(map)) }, [map])

  const addFiles = async (event) => {
    setError('')
    for (const file of [...event.target.files]) {
      const form = new FormData()
      form.append('archivo', file)
      const response = await fetch('/api/extraer', { method: 'POST', body: form })
      const data = await response.json()
      if (!response.ok) { setError(data.error || 'No se pudo leer el archivo.'); continue }
      if (data.texto.trim()) setAttachments((current) => [...current, { name: file.name, text: data.texto }])
    }
    event.target.value = ''
  }

  const prepare = async () => {
    if (!question.trim() && !attachments.length) {
      setError('Escribe una consulta o adjunta un documento.')
      return
    }
    setBusy(true)
    setError('')
    setWarning('')
    try {
      const anonymizer = crearAnonimizador(map)
      const query = await anonymizer.anonimizar(question, { nivel: level })
      const documents = []
      for (const file of attachments) documents.push({ ...file, ...(await anonymizer.anonimizar(file.text, { nivel: level })) })
      setPending({ questionReal: question, questionAnon: query.texto, documents, map: anonymizer.getMapa() })
    } catch (cause) {
      setError(cause.message || 'No se pudo anonimizar. No se envió nada.')
    } finally {
      setBusy(false)
    }
  }

  const send = async () => {
    if (!pending) return
    const text = pending.questionAnon + pending.documents.map((file, index) => `\n\n[Documento ${index + 1} anonimizado]\n${file.texto}`).join('')
    if (contieneOriginal(text, pending.map)) {
      setError('BLOQUEADO: quedó un dato real en el texto. No se envió nada.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const history = messages.map((message) => ({ rol: message.rol, texto: message.anon }))
      const response = await fetch('/api/consulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensajes: [...history, { rol: 'user', texto: text }] }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'La consulta fue bloqueada.')
      const answer = desanonimizar(data.respuesta, pending.map)
      if (answer.huerfanos.length) setWarning(`La respuesta conserva marcadores sin correspondencia local: ${answer.huerfanos.join(', ')}. Se muestran sin modificar.`)
      setMessages((current) => [...current, { rol: 'user', real: pending.questionReal, anon: text }, { rol: 'assistant', real: answer.texto, anon: data.respuesta }])
      setMap(pending.map)
      setPending(null)
      setQuestion('')
      setAttachments([])
    } catch (cause) {
      setError(cause.message || 'No se pudo consultar el proveedor.')
    } finally {
      setBusy(false)
    }
  }

  const clear = () => {
    setMessages([])
    setMap({})
    setPending(null)
    setWarning('')
    sessionStorage.removeItem('habeasguard-map')
  }
  const lastAnswer = [...messages].reverse().find((message) => message.rol === 'assistant')

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={clear}>
          <span className="brand-mark">H</span>
          <span><strong>HabeasGuard</strong><small>Escudo de hábeas data para operadores jurídicos</small></span>
        </button>
        <div className="status-row">
          <span className={state?.ollama ? 'ok' : 'bad'}>● Ollama {state?.ollama ? 'disponible' : 'no disponible'}</span>
          <span className={state?.claveConfigurada ? 'ok' : 'bad'}>● IA externa {state?.claveConfigurada ? 'configurada' : 'sin configurar'}</span>
          <button className="ghost" onClick={clear}>Borrar sesión</button>
        </div>
      </header>
      <section className="page">
        
        <div className="notice"><strong>Falla cerrada contra alucinaciones</strong><p>Ollama solo devuelve entidades; el navegador valida que existan literalmente y hace el reemplazo. Si Ollama falla o queda un dato real, la consulta se detiene.</p></div>
        {messages.map((message, index) => (
          <article className={`message ${message.rol}`} key={index}>
            <b>{message.rol === 'user' ? 'Consulta local' : 'Respuesta normalizada localmente'}</b>
            <p>{message.real}</p>
            <details><summary>{message.rol === 'user' ? 'Ver texto que salió (anonimizado)' : 'Ver respuesta original con marcadores'}</summary><pre>{message.anon}</pre></details>
          </article>
        ))}
        {lastAnswer && <div className="exports"><b>Exportar respuesta local:</b><button onClick={() => download(lastAnswer.real, 'md')}>MD</button><button onClick={() => download(`<h1>HabeasGuard</h1><p>${lastAnswer.real.replaceAll('\n', '<br>')}</p>`, 'doc')}>DOC</button></div>}
        {pending ? (
          <Review pending={pending} busy={busy} onBack={() => setPending(null)} onSend={send} />
        ) : (
          <Composer question={question} setQuestion={setQuestion} attachments={attachments} setAttachments={setAttachments} level={level} setLevel={setLevel} busy={busy} onPrepare={prepare} onFiles={addFiles} />
        )}
        {warning && <p className="warning-message" role="status">{warning}</p>}
        {error && <p className="error-message" role="alert">{error}</p>}
      </section>
    </main>
  )
}

function Review({ pending, busy, onBack, onSend }) {
  return (
    <section className="review panel">
      <h2>Revisión humana obligatoria antes de enviar</h2>
      <div className="review-grid">
        <div><h3>Texto real (no sale del equipo)</h3><pre className="real-text">{pending.questionReal}</pre></div>
        <div><h3>Texto que se enviará</h3><pre className="safe-text">{pending.questionAnon}</pre></div>
      </div>
      {pending.documents.map((file) => <details open key={file.name}><summary>{file.name} — anonimizado</summary><pre className="safe-text">{file.texto}</pre></details>)}
      <div className="map"><h3>Diccionario local</h3>{Object.entries(pending.map).map(([token, value]) => <span key={token}><b>{token}</b> = {value}</span>)}</div>
      <div className="actions"><button className="ghost" onClick={onBack}>Volver a editar</button><button className="primary-button" onClick={onSend} disabled={busy}>Confirmar y enviar a IA externa →</button></div>
    </section>
  )
}

function Composer({ question, setQuestion, attachments, setAttachments, level, setLevel, busy, onPrepare, onFiles }) {
  return (
    <section className="panel composer">
      <div className="panel-heading"><h2>Nueva consulta</h2><button className="text-button" onClick={() => setQuestion(DEMO)}>Cargar ejemplo seguro</button></div>
      <textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Escribe la consulta jurídica o pega el relato del caso..." aria-label="Consulta jurídica" />
      <div className="composer-footer">
        <label className="file-button">＋ Adjuntar PDF, DOCX, MD o TXT<input type="file" accept=".pdf,.docx,.md,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown,text/plain" multiple onChange={onFiles} /></label>
        <select value={level} onChange={(event) => setLevel(event.target.value)}><option value="estandar">Protección estándar</option><option value="estricto">Protección estricta</option></select>
        <button className="primary-button" onClick={onPrepare} disabled={busy}>{busy ? 'Anonimizando...' : 'Anonimizar y revisar →'}</button>
      </div>
      {attachments.length > 0 && <div className="attachments">{attachments.map((file) => <span key={file.name}>{file.name}<button onClick={() => setAttachments((current) => current.filter((item) => item.name !== file.name))}>×</button></span>)}</div>}
    </section>
  )
}

export default App
