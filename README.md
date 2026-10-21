# HabeasGuard

Escudo de hábeas data para operadores jurídicos. La aplicación anonimiza información
personal en el equipo del operador antes de consultar una IA externa.

## Flujo protegido

1. El navegador detecta datos estructurados y solicita a Ollama únicamente una lista
   de entidades; Ollama nunca reescribe el documento.
2. Cada entidad se valida contra el texto original y se reemplaza de forma determinista
   por tokens como `{nombre_1}` o `{documento_1}`.
3. El operador revisa el texto real y el texto anonimizado antes de confirmar.
4. El servidor local bloquea correos, teléfonos y documentos que hayan quedado sin
   anonimizar. Si Ollama falla, no hay envío externo.
5. La respuesta se normaliza localmente con el diccionario de la sesión.

El diccionario token → dato real vive en `sessionStorage`. Las claves de proveedores
solo se leen en el servidor local y nunca se incluyen en el bundle del navegador.

## Ejecutar

Requiere Node.js 20 o superior:

```bash
npm install
npm run build
npm start
```

Abre `http://localhost:5173`. Para desarrollo del cliente puede ejecutarse `npm run
dev:client` en otra terminal, pero las rutas protegidas requieren el servidor local.

## Ollama y proveedor externo

```bash
ollama pull llama3.2:3b
ollama run llama3.2:3b
```

`ollama run llama3.2:3b` puede permanecer abierto en una PowerShell. En otra
PowerShell inicia HabeasGuard con `npm start`.

Crea un `.env` o `.env.local` (no se debe subir al repositorio) con los valores del proveedor:

```env
OLLAMA_MODEL=llama3.2:3b
LLM_PROVIDER=gemini
GEMINI_MODEL=nombre-vigente-del-modelo
GEMINI_FALLBACK_MODEL=gemini-2.5-pro
GEMINI_TIMEOUT_MS=30000
GEMINI_API_KEY=...
```

La consulta intenta primero `GEMINI_MODEL` y usa `GEMINI_FALLBACK_MODEL` si el modelo
no está disponible, está limitado o Gemini responde con un error temporal. No se hace
una consulta previa al catálogo de modelos, para reducir la latencia de cada consulta.

También se admite un proveedor compatible con OpenAI mediante `LLM_PROVIDER=openai`,
`OPENAI_MODEL`, `OPENAI_API_KEY` y opcionalmente `OPENAI_BASE_URL`.

La extracción local acepta `.pdf`, `.docx`, `.md` y `.txt`. Los PDF escaneados requieren
OCR local y son rechazados si no contienen texto. Toda respuesta requiere revisión
humana y verificación de fuentes antes de presentarse.
