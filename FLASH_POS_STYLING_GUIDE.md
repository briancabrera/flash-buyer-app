## Flash POS UI — Styling Guide (Buyer/Vendor)

Esta guía resume los **lineamientos de UI** usados en el flujo POS (tablet Buyer) para poder **replicarlos en la app Vendor** y mantener consistencia visual.

### Objetivo
- **Look & feel consistente** entre Buyer y Vendor (misma marca, mismos ritmos).
- **UI premium, legible y rápida** sobre fondo azul/gradiente.
- **Estados claros**: esperando → escaneando → verificado → seleccionando → esperando cajero → gracias.

---

## Tokens (Design tokens)

### Colores (Brand + UI)
- **Brand Primary**: `#3880ff`
- **Brand Primary Dark (active/hover fuerte)**: `#2d66cc`
- **Brand Gradient Accent**: `#5c9fff`

- **Text on dark**:
  - Principal: `rgba(255,255,255,0.95)` / `#ffffff`
  - Secundario: `rgba(255,255,255,0.85)`
  - Terciario: `rgba(255,255,255,0.82)`

- **Surface (cards/tile)**:
  - Blanco: `#ffffff`
  - Texto oscuro: `#1f2937`
  - Texto secundario: `#6b7280`
  - Border sutil: `rgba(229, 231, 235, 0.9)`

- **Overlays**:
  - Cámara (fondo oscuro): `rgba(0,0,0,0.35)`

- **Estados**:
  - Éxito: `#22c55e` (con sombras/alpha sutil)
  - Error: `#ef4444`

### Tipografía (jerarquía usada en POS)
> Recomendación: usar `Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`.  
> Nota: en este repo hoy `global.scss` usa `Roboto`; ideal alinear Buyer/Vendor con el mismo stack.

- **H0 (catálogo)**: `40px / 900 / #fff`
- **H1 (waiting/success)**: `30px / 800 / #fff`
- **Body prominent**: `18px / 500 / rgba(255,255,255,0.82–0.85)`
- **Body (cards)**: `16px / 400–500 / #6b7280`
- **Pills**: `13px / 800`

### Spacing (ritmo)
- **Padding base**: `20px` (container)
- **Gaps**:
  - Container: `20px`
  - Success stage: `14px`
  - Waiting stage: `10px`
  - Reward grid: `18px`
- **Botón primario**:
  - Alto: `56px`
  - Padding horizontal: `26px`

### Radius
- **Cards / tiles / icon blocks**: `16px`
- **Cámara (contenedor)**: `20px`
- **Botón primario**: `28px`
- **Pills**: `999px`

### Sombras (estilo “premium”)
- **Botón**: `0 4px 12px rgba(0,0,0,0.12)`
- **Reward tile**: `0 10px 26px rgba(0,0,0,0.14)`
- **Énfasis brand (selected/verifying)**:
  - `0 10px 24px rgba(56, 128, 255, 0.35)`
  - `0 14px 32px rgba(56, 128, 255, 0.18)`

---

## Layout patterns

### Page & background
- `IonPage` y `IonContent` deben usar **fondo transparente** (`--background: transparent`) para que se vea el fondo/gradiente global.
- Texto por defecto en POS: **blanco** (con opacidades según jerarquía).

### Container
Patrón:
- `padding: 20px`
- `max-width: 980px; margin: 0 auto`
- `min-height: 100%`
- `gap: 20px`

### Centering
El “stage” principal debe estar centrado horizontalmente; verticalmente suele tener “respiro” inferior (`padding-bottom: 10vh`) para que en tablet se vea balanceado.

---

## Component patterns (reutilizables)

### 1) Waiting / Success stages
Uso: estados como “Esperando…”, “Identidad verificada”, “Recompensa seleccionada”, etc.

- **Contenedor**: `successStage` / `waitingStage` + `center`
- **Loader consistente**: agregar el loader como **footer** debajo del contenido del paso.
  - Clase: `waitFooter`
  - Recomendación: `margin-top: 10px–20px` según densidad del step

### 2) Botón primario “Flash”
Botón principal con “feel” táctil:
- Fondo blanco + texto azul (`#3880ff`)
- `border-radius: 28px`
- `height: 56px`
- `:active` scale a ~`0.96`
- Estados:
  - **Scanning**: pulso suave (shadow + micro scale)
  - **Verifying**: fondo azul + texto blanco + shadow azul

### 3) Cámara (Face capture)
Patrones:
- Contenedor con `aspect-ratio: 3/4`, `border-radius: 20px`, `overflow: hidden`
- Fondo overlay: `rgba(0,0,0,0.35)`
- Controles: pegados abajo con `position: absolute; bottom: 16px`

### 4) Rewards grid & tiles
Grid responsive:
- Base: 2 columnas
- < 560px: 1 columna
- ≥ 980px: 3 columnas

Tile:
- Fondo blanco, radius 16, shadow premium, transición 0.2s
- Selected: border + shadow azul
- Disabled: baja saturación + opacidad

Icon:
- Bloque 56×56, radius 16
- Gradiente: `linear-gradient(135deg, #3880ff 0%, #5c9fff 100%)`

---

## Motion / Animaciones

### Presets recomendados (Framer Motion)
Usar transiciones cortas, sin rebotes exagerados:

```ts
const motionProps = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.25, ease: "easeOut" },
} as const

const contentStagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
  exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
} as const

const item = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.16, ease: "easeIn" } },
} as const
```

### Reglas de motion
- **Evitar layout shift**: reservar espacios (ej: banner slot) y mantener alturas estables.
- **Feedback táctil**: micro-scale (`0.96–0.99`) y sombras en botones/tiles.
- **Estados “waiting”**: loader “dots” (Ionic) + texto corto.

---

## UX rules (importante para Vendor)
- **SSE es source of truth**: la UI refleja el estado de la sesión; HTTP inicia acciones.
- **Una acción a la vez**: bloquear CTA mientras “sending/awaiting”.
- **Mensajes cortos** y consistentes:
  - “Esperando al vendedor…”
  - “Mirá a la cámara”
  - “Identidad verificada”
  - “Recompensa seleccionada”
  - “Esperá al cajero…”

---

## Checklist para portar a Vendor
- Copiar tokens de color y opacidades.
- Copiar patrones de `flashButton` y estados.
- Reutilizar `motionProps/contentStagger/item`.
- Mantener `--background: transparent` en `IonPage/IonContent`.
- Usar el mismo “waiting footer loader” (`IonSpinner name="dots"`) para todos los pasos de espera.

