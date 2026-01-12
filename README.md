# Métricas

Dashboard ejecutivo minimalista con Vite + React + TypeScript, Tailwind, Zustand, Firebase Auth (Google), Recharts y servicios para n8n y backend de IA.

## Configuración

Configura variables de entorno en `.env` (usa `.env.example` como referencia):

```
VITE_N8N_BASE_URL=http://localhost:5678/webhook
VITE_AI_BASE_URL=http://localhost:3001
VITE_FIREBASE_API_KEY=REEMPLAZAR
VITE_FIREBASE_AUTH_DOMAIN=REEMPLAZAR
VITE_FIREBASE_PROJECT_ID=REEMPLAZAR
VITE_FIREBASE_STORAGE_BUCKET=REEMPLAZAR
VITE_FIREBASE_MESSAGING_SENDER_ID=REEMPLAZAR
VITE_FIREBASE_APP_ID=REEMPLAZAR
VITE_FIREBASE_MEASUREMENT_ID=REEMPLAZAR
```

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Estructura

Ver carpeta `src` para componentes, páginas y servicios.

## Integración n8n + LinkedIn → Firebase Functions

Se agregó una Cloud Function HTTP para recibir datos enviados por n8n y almacenarlos en Firestore.

- Código de Functions: `functions/src/index.ts`
- Endpoint exportado: `ingestLinkedInMetrics` (HTTP)
- Colección Firestore: `linkedin_metrics`

### Validación del payload

La función valida el payload con Zod. Campos soportados:

- `source`: "linkedin" (por defecto)
- `stream`: "ads" | "organization"
- `timestamp`: número epoch ms o ISO string
- `accountId` (opcional) o `orgId` (opcional) — al menos uno requerido
- `metrics`: objeto o arreglo con métricas arbitrarias
- `version` (opcional)

Ejemplo de payload desde n8n:

```json
{
	"source": "linkedin",
	"stream": "ads",
	"timestamp": 1734500000000,
	"accountId": "123456789",
	"metrics": { "impressions": 1200, "clicks": 42, "spend": 58.3 },
	"version": "v1"
}
```

Para estadísticas de organización:

```json
{
	"source": "linkedin",
	"stream": "organization",
	"timestamp": "2025-12-18T10:30:00Z",
	"orgId": "urn:li:organization:987654",
	"metrics": [{ "followers": 2045 }, { "engagementRate": 0.034 }]
}
```

### Seguridad (firma opcional)

Si configuras en n8n una firma HMAC (cabecera `X-N8N-Signature`), define el secreto en Functions:

```bash
firebase functions:secrets:set N8N_WEBHOOK_SECRET
```

La función verificará la firma si el secreto está presente.

### Despliegue

1. Instala herramientas y dependencias:

```bash
npm i -g firebase-tools
cd functions && npm i && npm run build
```

2. Inicia sesión y selecciona tu proyecto:

```bash
firebase login
firebase use --add
```

3. Crea Firestore si no existe (modo Production recomendado) y despliega Functions:

```bash
firebase deploy --only functions
```

4. Obtén la URL de la función `ingestLinkedInMetrics` desde la salida del despliegue y configúrala en tu workflow de n8n (HTTP Request o Webhook → POST).

### Hosting (Frontend)

Para el frontend (Vite + React):

```bash
npm run build
firebase deploy --only hosting
```

Con Spark (gratuito) puedes desplegar Hosting. La URL queda disponible en la salida del comando (ejemplo: https://metricas-intelligent-zon-87944.web.app).

### Functions (Backend) y plan de facturación

Para desplegar Cloud Functions es necesario habilitar APIs gestionadas por Google Cloud (Cloud Build, Cloud Functions, Artifact Registry), lo cual requiere el plan Blaze (pago). Si ves un error como:

```
Your project must be on the Blaze plan to complete this command. Required API cloudbuild.googleapis.com can't be enabled until the upgrade is complete.
```

Actualiza el plan en la Consola de Firebase y vuelve a desplegar:

```bash
firebase deploy --only "functions"
```

Si usas la firma HMAC opcional, define el secreto antes del despliegue:

```bash
firebase functions:secrets:set N8N_WEBHOOK_SECRET
```

> Nota: actualmente la función tolera ausencia del secreto; si lo configuras, la verificación de firma se activará automáticamente.

### Notas sobre credenciales de LinkedIn

Las credenciales OAuth2 de LinkedIn (Client ID/Secret) permanecen en n8n para obtener y refrescar tokens. La Cloud Function no gestiona OAuth; solo recibe y almacena las métricas ya agregadas por n8n. Para firmar llamadas, usa `N8N_WEBHOOK_SECRET` (no el Client Secret de LinkedIn).

## GitHub Pages (alternativo)

Se agregó un workflow para desplegar automáticamente a GitHub Pages al hacer push a `main`.

- Archivo: .github/workflows/deploy-gh-pages.yml
- Construye con `BASE_PATH="/<repo>/"` y publica la carpeta `dist`.

Pasos:

1) En GitHub → Settings → Pages: selecciona "GitHub Actions" como fuente.
2) Haz push a `main` (o usa "Run workflow").
3) La URL quedará como: `https://<usuario>.github.io/<repo>/`.

Notas:

- El enrutado de React Router funciona con fallback SPA (archivo `public/404.html`).
- Si publicas como página de usuario/organización (sin `<repo>`), cambia `BASE_PATH` a `/` en el paso de build del workflow.

## Modo embebido (Google Sites)

Para insertar el dashboard en Google Sites, usa la URL con el parámetro `?embed=1` para ocultar los cromos (Header/Sidebar) y optimizar el espacio.

Ejemplos:

- GH Pages: `https://<usuario>.github.io/<repo>/?embed=1` (y rutas como `.../dashboard?embed=1` o `.../chat?embed=1`).
- Firebase Hosting: `https://<tu-sitio>.web.app/?embed=1`.

Instrucciones en Google Sites:

1) Insertar → Integrar → Pegar URL.
2) Pega la URL con `?embed=1`.
3) Ajusta dimensiones del iframe según necesidad.
