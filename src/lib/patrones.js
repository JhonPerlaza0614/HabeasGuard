const patterns = [
  ['correo', /(?<![\w.+-])[\w.+-]+@[\w-]+(?:\.[\w-]+)+(?![\w.-])/giu],
  ['telefono', /(?<!\d)(?:\+?57[\s-]*)?3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)/g],
  ['documento', /(?<![\d.,$])(?:\d{1,3}(?:\.\d{3}){2,3}|\d{7,10})(?!\d)/g],
  ['radicado', /(?<!\d)\d{23}(?!\d)/g],
  ['financiero', /\b(?:cuenta|número de cuenta|tarjeta)\b[^!?\n]{0,100}?\b\d[\d\s.-]{7,}\d\b/giu],
  ['direccion', /\b(?:calle|carrera|cra\.?|cl\.?|avenida|diagonal|transversal|barrio|vereda|conjunto)\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9#.\s-]{2,50}/giu],
  ['fecha_nacimiento', /\b(?:nació|nacimiento|fecha de nacimiento)[^.!?\n]{0,30}\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/giu],
  ['vehiculo', /(?<![A-Z0-9])(?:[A-Z]{3}\s?\d{3}|[A-Z]{3}\s?\d{2}[A-Z])(?![A-Z0-9])/gu],
]

const health = /\b(?:VIH|SIDA|antirretrovirales?|cáncer|tumores?|leucemia|quimioterapia|depresión|ansiedad|tuberculosis|hepatitis|lupus|epilepsia|autismo|esquizofrenia|embarazo)\b/giu

export function detectarEstructurados(texto) {
  return patterns.flatMap(([categoria, regex]) =>
    [...texto.matchAll(regex)].map((m) => ({ texto: m[0].trim(), categoria }))
  ).concat([...texto.matchAll(health)].map((m) => ({ texto: m[0], categoria: 'salud' })))
}

export function detectarFugas(texto) {
  return detectarEstructurados(texto).filter(({ texto: value }) => !/^\{[a-z_]+_\d+\}$/i.test(value))
}
