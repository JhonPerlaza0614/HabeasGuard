const MARKER = /(?:\\?\{\{\s*[a-z][a-z0-9]*(?:_[a-z0-9]+)*[_ ]\d+\s*\}\}|\\?\{\s*[a-z][a-z0-9]*(?:_[a-z0-9]+)*[_ ]\d+\s*\}|\\?\[\s*[a-z][a-z0-9]*(?:_[a-z0-9]+)*[_ ]\d+\s*\]|\\?\(\s*[a-z][a-z0-9]*(?:_[a-z0-9]+)*[_ ]\d+\s*\)|\b[a-z][a-z0-9]*(?:_[a-z0-9]+)*[_ ]\d+\b)/gi
const TOKEN = /([a-z][a-z0-9]*(?:_[a-z0-9]+)*)[_ ](\d+)/i
const REFERENCIA_JURIDICA = /^(ley|de|decreto|art(?:iculo)?|sentencia|resolucion|constitucion|codigo|acuerdo|circular|auto)$/iu

export function desanonimizar(texto, mapa) {
  const huerfanos = new Set()
  const diccionario = new Map(Object.entries(mapa).map(([token, value]) => [token.toLowerCase(), value]))
  const limpio = texto.replace(/\\_/g, '_').replace(/\\([{}[\]()])/g, '$1')
  const resultado = limpio.replace(MARKER, (match) => {
    const tokenMatch = match.match(TOKEN)
    if (!tokenMatch) return match
    const [, categoria, numero] = tokenMatch
    const token = `{${categoria.toLowerCase()}_${numero}}`
    if (diccionario.has(token)) return diccionario.get(token)
    if (!REFERENCIA_JURIDICA.test(categoria)) huerfanos.add(token)
    return match
  })
  return { texto: resultado, huerfanos: [...huerfanos] }
}

export function contieneOriginal(texto, mapa) {
  return Object.values(mapa).some((value) => value.length >= 2 && texto.toLocaleLowerCase().includes(value.toLocaleLowerCase()))
}
