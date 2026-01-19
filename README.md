# flash-buyer-app

Buyer app (Ionic + React + Capacitor) con **dos flujos**:

- **Demo viejo (payment)**: flujo existente (no requiere POS).
- **POS Debug (paso intermedio)**: integración con el backend nuevo vía **Gateway `/pos/**`** (pos-api), habilitado por feature flag.

## Stack

- **Ionic React** (`@ionic/react`, `@ionic/react-router`)
- **React 18 + TypeScript**
- **Vite**
- **Axios** (demo viejo: `VITE_API_URL`)
- **POS (nuevo)**: `fetch` + `EventSource` (SSE)
- **Tests**: Vitest + Testing Library, Cypress e2e (config)

## Feature flag (NO rompe el flujo viejo)

El panel y rutas POS solo se habilitan si:

- `VITE_USE_POS_BUYER=1`

Con el flag apagado, la app sigue funcionando igual que antes (demo payment).

## Variables de entorno

### Demo viejo (payment)

- `VITE_API_URL`: base URL del backend viejo usado por `src/services/http.ts`

### POS Debug (nuevo)

- `VITE_GATEWAY_URL`: base URL del Gateway (expone `/pos/**` y passthrough a pos-api)
- `VITE_TERMINAL_TOKEN`: token de terminal para Authorization Bearer (requerido por endpoints mutativos y `GET /pos/rewards`)
- `VITE_USE_POS_BUYER`: `1` para habilitar `/pos-debug` y el botón “POS Debug” en Home

## Cómo correr

Instalar deps y levantar la app:

```bash
npm install
npm run dev
```

Tests unitarios:

```bash
npm run test.unit
```

## Cómo probar manual el flujo completo con Vendor (paso 1: Debug)

1) **Levantar Gateway** (expone `/pos/**`)
2) **Levantar pos-api**
3) **Levantar Vendor** y crear una sesión:
   - `POST /pos/sessions` (mode en el payload)
   - La sesión queda en `WAITING_FACE`
4) **Buyer (esta app)**:
   - Setear env vars: `VITE_USE_POS_BUYER=1`, `VITE_GATEWAY_URL`, `VITE_TERMINAL_TOKEN`
   - Entrar a **Home → POS Debug** (ruta `/pos-debug`)
   - Click **Start Listening** (abre SSE terminal ticket + EventSource)
  - Cuando el snapshot de sesión muestre `status: WAITING_FACE`, se abre automáticamente el overlay de cámara y se dispara `/face-scan` al obtener la imagen.
    - La UI espera `FACE_VERIFIED` por SSE para marcar éxito (no asume HTTP 200).
   - Si `mode === REDEEM`:
     - Click **Load rewards** (GET `/pos/rewards`)
     - Elegir reward y click **Select reward** (POST `/pos/sessions/:id/reward`)
5) Verificar en **Vendor SSE** que la sesión avanza de estado (y que en REDEEM aparece el `voucher_code` al confirmar del lado Vendor).

## Reconnect / SSE (hardening)

- **Sin polling**: Buyer no hace intervalos. Todo es event-driven.
- **Ticket reusable**: se reusa mientras sea válido; solo se re-adquiere si el server devuelve **401** o si expira.
- **Backoff con jitter**: ante cortes/errores, reconecta con delay creciente (evita “reconnect storm”).
- **Source of truth**: la sesión activa se deriva únicamente de eventos SSE:
  - `current_session` (session | null)
  - `session_created`
  - `session_updated`
  - `session_closed`
  - `terminal_state` es solo metadata (NO modifica la sesión activa).

## Contrato backend (referencia)

Ver `openapi.yaml` para endpoints y errores estandarizados `{ error: { code, message, request_id } }`.

