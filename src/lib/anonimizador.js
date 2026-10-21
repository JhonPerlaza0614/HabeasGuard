import { construirPromptNER } from './contexto'
import { detectarEstructurados } from './patrones'
import { contieneOriginal } from './normalizar'

const normalizar = (value) => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim()
const PROHIBIDO = /^(art[ií]culo|art\.|ley|decreto|sentencia|resoluci[oó]n|corte|tribunal|constituci[oó]n|superintendencia|ministerio)\b/iu

export const trocear = (texto, max = 1800) => {
  const partes = texto.split(/\n{2,}|(?<=[.!?])\s+/)
  const out = []
  let actual = ''
  for (const parte of partes) {
    if (actual && actual.length + parte.length + 1 > max) { out.push(actual); actual = parte }
    else actual = actual ? `${actual}\n${parte}` : parte
  }
  if (actual) out.push(actual)
  return out.flatMap((item) => item.length > max * 1.5 ? (item.match(new RegExp(`[\\s\\S]{1,${max}}`, 'g')) || [item]) : [item])
}

export function crearAnonimizador(mapaInicial = {}, detector = detectorHTTP) {
  const mapa = { ...mapaInicial }
  const keys = new Map(Object.entries(mapa).map(([token, value]) => [`${token.split('_')[0].slice(1)}|${normalizar(value)}`, token]))
  const counters = {}
  Object.keys(mapa).forEach((token) => { const type = token.slice(1).split('_')[0]; counters[type] = Math.max(counters[type] || 0, Number(token.match(/(\d+)\}/)?.[1] || 0)) })
  const registrar = (texto, categoria) => {
    const value = texto.trim()
    if (!value || PROHIBIDO.test(value) || /^\{.*\}$/.test(value)) return null
    const key = `${categoria}|${normalizar(value)}`
    if (keys.has(key)) return keys.get(key)
    const token = `{${categoria}_${(counters[categoria] || 0) + 1}}`
    counters[categoria] = (counters[categoria] || 0) + 1
    keys.set(key, token); mapa[token] = value
    return token
  }
  async function anonimizar(texto, opciones = {}) {
    const nivel = opciones.nivel || 'estandar'
    const entidades = [...detectarEstructurados(texto)]
    for (const fragmento of trocear(texto)) entidades.push(...await detector(fragmento, nivel))
    const unicas = new Map()
    entidades.forEach((entity) => {
      if (entity && typeof entity.texto === 'string' && typeof entity.categoria === 'string' && texto.includes(entity.texto)) {
        const token = registrar(entity.texto, entity.categoria)
        if (token) unicas.set(entity.texto, token)
      }
    })
    const reemplazos = [...unicas.entries()].sort((a, b) => b[0].length - a[0].length)
    const protegido = reemplazos.reduce((current, [value, token]) => current.split(value).join(token), texto)
    if (contieneOriginal(protegido, mapa)) throw new Error('BLOQUEADO: quedaron datos reales después de anonimizar.')
    return { texto: protegido, mapa, counters }
  }
  return { anonimizar, getMapa: () => ({ ...mapa }) }
}

export async function detectorHTTP(fragmento, nivel) {
  const response = await fetch('/api/ner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texto: fragmento, nivel, prompt: construirPromptNER(nivel) }) })
  if (!response.ok) throw new Error(`La IA local no respondió (${response.status}). No se envió nada.`)
  const data = await response.json()
  return Array.isArray(data.entidades) ? data.entidades : []
}
