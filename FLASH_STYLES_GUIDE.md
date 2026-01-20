# 🎨 Flash App - Guía Completa de Estilos

Este documento detalla todos los estilos, tokens de diseño y patrones visuales utilizados en la aplicación Flash. Úsalo como referencia para mantener consistencia visual en todas las apps de Flash.

---

## 📐 Sistema de Diseño General

### Principios Fundamentales

1. **Fondo Transparente/Oscuro**: Las páginas principales usan fondo transparente con texto blanco sobre un gradiente azul
2. **Cards Blancas**: Todo el contenido principal se muestra en cards blancas con sombras suaves
3. **Azul como Color Primario**: `#3880ff` es el color de marca principal para acciones y elementos destacados
4. **Gradientes Sutiles**: Gradientes azules para avatares y elementos decorativos
5. **Bordes Redondeados**: Consistencia en border-radius (`16px` cards, `28px` botones primarios, `12px` secundarios)
6. **Espaciado Consistente**: `20px` padding estándar, `24px` margins entre secciones
7. **Tipografía Clara**: Jerarquía bien definida con tamaños y pesos específicos
8. **Estados Visuales**: Feedback claro en hover, active y disabled
9. **Animaciones Suaves**: Transiciones de `0.2s - 0.3s` con easing natural
10. **Glassmorphism**: Efectos de vidrio esmerilado en elementos especiales

---

## 🎨 Paleta de Colores

### Colores Principales (Brand)

#### Azul Primario (Primary Blue)
```scss
$blue-primary: #3880ff;
```
- **Uso**: Botones primarios, avatares, iconos activos, gradientes, textos de acción
- **RGB**: `rgb(56, 128, 255)`
- **Aplicaciones**:
  - Texto en botones blancos
  - Gradiente de avatares
  - TopNav background
  - AppMenu header background
  - Enlaces y textos clickeables
  - Bordes de inputs en focus

#### Azul Secundario (Gradient Blue)
```scss
$blue-gradient-light: #5c9fff;
```
- **Uso**: Gradientes, variantes más claras
- **RGB**: `rgb(92, 159, 255)`
- **Aplicaciones**:
  - Gradiente de avatares: `linear-gradient(135deg, #3880ff 0%, #5c9fff 100%)`
  - Hero card top border: `linear-gradient(90deg, #3880ff 0%, #5c9fff 100%)`
  - Enrollment background: `radial-gradient(circle at top right, #5c9fff, #3880ff)`

#### Azul Oscuro (Dark Blue)
```scss
$blue-dark: #2d66cc;
```
- **Uso**: Estados hover/active más intensos, variantes oscuras
- **RGB**: `rgb(45, 102, 204)`

### Colores de Fondo

#### Fondo de Página
```scss
--background: transparent;
```
- **Uso**: Todas las páginas principales (`IonPage`)
- **Nota**: El contenido real tiene gradiente azul de fondo

#### Fondo de Cards
```scss
background: #ffffff;
```
- **Uso**: Todas las cards, contenedores de contenido principal
- **Variante con gradiente sutil**:
  ```scss
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  ```

#### Fondo de Inputs
```scss
--background: #f9fafb;
```
- **Uso**: Campos de input, selects, textareas
- **RGB**: `rgb(249, 250, 251)`
- **Focus**: Cambia a `#ffffff`

#### Fondo Gris Muy Claro
```scss
background: #f8fafc;
```
- **Uso**: Gradientes de cards, fondos secundarios
- **RGB**: `rgb(248, 250, 252)`

### Colores de Texto

#### Texto Principal (Oscuro)
```scss
color: #1f2937;
```
- **Uso**: Títulos, nombres, valores importantes en cards blancas
- **RGB**: `rgb(31, 41, 55)`
- **Font-weight**: `600-700` para títulos, `400-500` para texto normal

#### Texto Secundario
```scss
color: #6b7280;
```
- **Uso**: Labels, subtítulos, información secundaria
- **RGB**: `rgb(107, 114, 128)`
- **Font-weight**: `400-500`

#### Texto Terciario
```scss
color: #9ca3af;
```
- **Uso**: Placeholders, texto deshabilitado, información menos importante, timestamps
- **RGB**: `rgb(156, 163, 175)`
- **Font-weight**: `400`

#### Texto Blanco (Sobre Fondo Oscuro)
```scss
color: #ffffff;
```
- **Uso**: Títulos y texto sobre fondos oscuros/transparentes/gradientes azules
- **Variantes con opacidad**:
  ```scss
  rgba(255, 255, 255, 0.9)  // Texto principal sobre fondo oscuro
  rgba(255, 255, 255, 0.8)  // Texto secundario sobre fondo oscuro
  rgba(255, 255, 255, 0.75) // Texto terciario, botones secundarios
  rgba(255, 255, 255, 0.7)  // Texto menos importante
  ```

### Colores de Estado

#### Éxito (Success)
```scss
color: #22c55e;
background: rgba(34, 197, 94, 0.2); // Para fondos
```
- **Uso**: Estados de éxito, confirmaciones, validaciones positivas
- **RGB**: `rgb(34, 197, 94)`

#### Error/Peligro (Error/Danger)
```scss
color: #ef4444;
background: rgba(239, 68, 68, 0.2); // Para fondos
```
- **Uso**: Errores, botones destructivos (logout, borrar cuenta), validaciones negativas
- **RGB**: `rgb(239, 68, 68)`

#### Advertencia (Warning)
```scss
color: #f1c40f;
```
- **Uso**: Estados de advertencia (menos usado)
- **RGB**: `rgb(241, 196, 15)`

### Colores de Borde y Divisores

#### Borde Gris Claro
```scss
border-color: #e5e7eb;
```
- **Uso**: Bordes de inputs, divisores sutiles
- **RGB**: `rgb(229, 231, 235)`

#### Borde Gris Medio
```scss
border-color: #d1d5db;
```
- **Uso**: Bordes más visibles cuando se necesita más contraste
- **RGB**: `rgb(209, 213, 219)`

#### Divisor
```scss
background-color: #e0e0e0;
height: 1px;
```
- **Uso**: Separadores entre elementos en listas, settings rows
- **RGB**: `rgb(224, 224, 224)`

---

## 📝 Tipografía

### Familia de Fuente

**Por defecto**: `Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`

**Para AWS Amplify Liveness**:
```scss
font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif !important;
```

### Tamaños de Fuente

#### Títulos Principales (H1)
```scss
font-size: 28px;
font-weight: 600-700;
color: #ffffff; // Sobre fondo oscuro
color: #1f2937; // Sobre fondo blanco
```
- **Uso**: Título principal de página, greeting en home
- **Ejemplos**: "¡Hola, Juan!", "Verificación Flash"

#### Títulos de Sección (H2)
```scss
font-size: 24px;
font-weight: 600;
color: #ffffff; // Sobre fondo oscuro
color: #1f2937; // Sobre fondo blanco
```
- **Uso**: Títulos de sección, nombres en menús

#### Títulos de Card (H3)
```scss
font-size: 22px;
font-weight: 600;
color: #1f2937;
```
- **Uso**: Nombre del comercio destacado en hero card

#### Títulos de Subsección (H4)
```scss
font-size: 18px;
font-weight: 500-600;
color: #1f2937;
```
- **Uso**: Subtítulos dentro de cards

#### Títulos Pequeños (H5)
```scss
font-size: 16px;
font-weight: 600;
color: #1f2937;
```
- **Uso**: Títulos de sección dentro de cards

#### Texto Principal
```scss
font-size: 16px;
font-weight: 400-500;
color: #1f2937; // Sobre fondo blanco
color: #ffffff; // Sobre fondo oscuro
```
- **Uso**: Texto principal de párrafos, descripciones
- **Line-height**: `1.5-1.6`

#### Texto Secundario
```scss
font-size: 15px;
font-weight: 400-500;
color: #6b7280;
```
- **Uso**: Texto secundario, descripciones de actividades

#### Texto Pequeño
```scss
font-size: 14px;
font-weight: 400-500;
color: #6b7280;
```
- **Uso**: Labels, información adicional, emails en profile

#### Texto Muy Pequeño
```scss
font-size: 13px;
font-weight: 400;
color: #9ca3af;
```
- **Uso**: Timestamps, información terciaria

#### Labels
```scss
font-size: 14px;
font-weight: 400-500;
color: #1f2937; // En inputs
color: #6b7280; // En info rows
```

#### Labels Uppercase
```scss
font-size: 12px-14px;
font-weight: 500;
text-transform: uppercase;
letter-spacing: 0.5px;
color: #6b7280;
```
- **Uso**: Labels de hero cards ("COMERCIO DESTACADO")

#### Subtítulos
```scss
font-size: 12px;
font-weight: 400;
color: #9ca3af;
```

#### Números Grandes (Hero)
```scss
font-size: 52px;
font-weight: 700;
color: #1f2937;
line-height: 1;
```
- **Uso**: Números de puntos destacados en hero card

#### Números Medianos
```scss
font-size: 20px-24px;
font-weight: 700;
color: #3880ff; // Puntos
color: #1f2937; // Otros valores
```

### Pesos de Fuente

- **Bold (700)**: Títulos principales, números grandes
- **Semi-Bold (600)**: Títulos de sección, nombres importantes, botones
- **Medium (500)**: Labels, texto destacado, settings row labels
- **Regular (400)**: Texto normal, descripciones, body text

---

## 📏 Espaciado

### Padding

#### Padding de Página
```scss
padding: 20px;
```
- **Uso**: Padding estándar en todas las páginas principales

#### Padding de Cards
```scss
padding: 24px 20px; // Estándar (vertical horizontal)
padding: 28px 24px; // Hero cards
padding: 16px 20px; // Cards compactas (filtros)
padding: 18px 16px; // Quick action cards
```
- **Uso**: Contenido interno de cards

#### Padding de Inputs
```scss
--padding-start: 16px;
--padding-end: 16px;
--padding-top: 14px;
--padding-bottom: 14px;
```
- **Uso**: Campos de input estándar

#### Padding Alternativo de Inputs
```scss
--padding-top: 12px;
--padding-bottom: 12px;
```
- **Uso**: Inputs más compactos (login, register)

### Margin

#### Margin entre Secciones
```scss
margin-bottom: 24px;
```
- **Uso**: Espaciado entre cards, secciones principales

#### Margin entre Elementos
```scss
margin-bottom: 16px; // Estándar
margin-bottom: 12px; // Compacto
margin-bottom: 8px;  // Muy compacto
margin-bottom: 4px;  // Mínimo
```

#### Margin Top para Páginas
```scss
margin-top: 60px; // Con TopNav estándar
margin-top: 70px; // Con TopNav más alto
```
- **Uso**: `pageContent` para dejar espacio para TopNav

### Gap (Flexbox/Grid)

```scss
gap: 12px; // Estándar
gap: 16px; // Más espaciado
gap: 20px; // Muy espaciado
gap: 24px; // Máximo espaciado
gap: 8px;  // Compacto
gap: 4px;  // Muy compacto
```

---

## 🎯 Componentes Visuales

### Cards

#### Card Estándar
```scss
.card {
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  margin: 0;
}
```

#### Hero Card (Destacada)
```scss
.heroCard {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  margin: 0;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #3880ff 0%, #5c9fff 100%);
  }
}
```

#### Card Compacta (Quick Actions)
```scss
.quickActionCard {
  background-color: #ffffff;
  border-radius: 12px;
  margin: 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }
}
```

#### Card de Merchant (Lista)
```scss
.merchantCard {
  background-color: #ffffff;
  border-radius: 12px;
  margin: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.08);
  }
}
```

### Botones

#### Botón Primario (Flash Style)
```scss
.flashButton,
.submitButton {
  --background: #ffffff;
  --background-activated: rgba(56, 128, 255, 0.1);
  --background-hover: rgba(56, 128, 255, 0.05);
  --color: #3880ff;
  --border-radius: 28px;
  --border-width: 0;
  --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  font-size: 16px;
  font-weight: 600;
  height: 52px;
  transition: transform 0.2s ease;
  
  &:active {
    transform: scale(0.96);
    --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  
  &:disabled {
    opacity: 0.5;
  }
}
```

#### Botón Secundario (Outline)
```scss
.logoutButton {
  --border-color: #ef4444;
  --border-width: 1px;
  --border-style: solid;
  --border-radius: 12px;
  --color: #ef4444;
  --background: transparent;
  --background-activated: rgba(239, 68, 68, 0.1);
  --background-hover: rgba(239, 68, 68, 0.05);
  width: 100%;
  height: 32px;
  font-weight: 500;
  font-size: 16px;
}
```

#### Botón Circular (Icon Button)
```scss
.headerActionButton {
  --color: #ffffff;
  --background: rgba(255, 255, 255, 0.15);
  --background-hover: rgba(255, 255, 255, 0.25);
  --background-activated: rgba(255, 255, 255, 0.2);
  --border-radius: 50%;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
}
```

### Avatares

#### Avatar Grande (64px)
```scss
.profileAvatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3880ff 0%, #5c9fff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profileAvatarText {
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
}
```

#### Avatar Mediano (48px)
```scss
.merchantAvatar,
.activityAvatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3880ff 0%, #5c9fff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.merchantAvatarText,
.activityAvatarText {
  font-size: 14px-16px;
  font-weight: 600;
  color: #ffffff;
}
```

#### Avatar Pequeño (40px)
```scss
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3880ff 0%, #5c9fff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatarText {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}
```

### Inputs

#### Input Estándar
```scss
.formInput {
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 14px;
  --padding-bottom: 14px;
  --background: #f9fafb;
  --color: #1f2937;
  --placeholder-color: #9ca3af;
  --placeholder-opacity: 1;
  --border-radius: 12px;
  --border-width: 1px;
  --border-style: solid;
  --border-color: #e5e7eb;
  font-size: 16px;
  font-weight: 400;
  width: 100%;
  
  &.ion-focused {
    --border-color: #3880ff;
    --background: #ffffff;
  }
}
```

#### Input Login/Register
```scss
.customInput {
  --background: white;
  --color: #3880ff;
  --placeholder-color: #3880ff;
  --placeholder-opacity: 0.8;
  --border-radius: 8px;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  font-size: 16px;
}
```

### Toggles

#### Toggle Estándar
```scss
.settingToggle {
  flex-shrink: 0;
  // Ionic maneja el tamaño automáticamente (44px × 26px)
  // Border-radius: 13px (redondeado)
  // Disabled: Opacidad reducida automáticamente
}
```

### Selects

#### Select Estándar
```scss
.merchantSelect {
  width: 100%;
  --padding-start: 0;
  --padding-end: 0;
  font-size: 15px;
  font-weight: 500;
  color: #1f2937;
  
  &::part(container) {
    border-radius: 12px;
  }
}
```

### Empty States

#### Empty State Card
```scss
.emptyStateCard {
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  margin: 0;
}

.emptyStateCardContent {
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.emptyStateIcon {
  font-size: 48px;
  color: #9ca3af;
}

.emptyStateText {
  font-size: 16px;
  font-weight: 500;
  color: #6b7280;
  text-align: center;
}
```

### Settings/Info Rows

#### Setting Row
```scss
.settingRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  min-height: 48px;
}

.settingRowClickable {
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:active {
    background-color: rgba(56, 128, 255, 0.05);
    border-radius: 8px;
    margin: 0 -8px;
    padding: 12px 8px;
  }
}

.settingRowLeft {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.settingRowLabel {
  font-size: 15px;
  font-weight: 500;
  color: #1f2937;
}

.settingRowHelper {
  font-size: 13px;
  font-weight: 400;
  color: #6b7280;
}
```

#### Info Row
```scss
.infoRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  min-height: 48px;
}

.infoRowLeft {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.infoLabel {
  font-size: 14px;
  font-weight: 400;
  color: #6b7280;
}

.infoSubtext {
  font-size: 12px;
  font-weight: 400;
  color: #9ca3af;
}

.infoValue {
  font-size: 15px;
  font-weight: 500;
  color: #1f2937;
  text-align: right;
}
```

#### Dividers
```scss
.settingDivider,
.infoDivider,
.legalDivider {
  height: 1px;
  background-color: #e5e7eb;
  margin: 0;
}
```

---

## 🌈 Gradientes

### Gradiente de Avatar/Iconos
```scss
background: linear-gradient(135deg, #3880ff 0%, #5c9fff 100%);
```
- **Uso**: Avatares, iconos decorativos

### Gradiente Hero Card Top Border
```scss
background: linear-gradient(90deg, #3880ff 0%, #5c9fff 100%);
```
- **Uso**: Borde superior de hero cards

### Gradiente Card Background
```scss
background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
```
- **Uso**: Fondo de hero cards con sutil gradiente

### Gradiente Enrollment Background
```scss
background: radial-gradient(circle at top right, #5c9fff, #3880ff);
```
- **Uso**: Fondo de la página de Enrollment

---

## 🎭 Estados y Transiciones

### Estados de Interacción

#### Hover
```scss
&:hover {
  // Cambio sutil de opacidad o background
  --background-hover: rgba(56, 128, 255, 0.05);
}
```

#### Active
```scss
&:active {
  transform: scale(0.96);
  background-color: rgba(56, 128, 255, 0.05);
  --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
```

#### Disabled
```scss
&:disabled {
  opacity: 0.5;
}
```

#### Focus (Inputs)
```scss
&.ion-focused {
  --border-color: #3880ff;
  --background: #ffffff;
}
```

### Transiciones

#### Transición Estándar
```scss
transition: transform 0.2s ease;
transition: background-color 0.2s ease;
```

#### Transición de Animación
```scss
transition: { duration: 0.3, ease: "easeOut" }; // Framer Motion
```

#### Duración de Animación
- **Estándar**: `0.2s - 0.3s`
- **Easing**: `ease`, `easeOut`

---

## 📱 Layout

### Estructura de Página

#### Page Container
```scss
.pageContent {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 20px;
  position: relative;
  z-index: 1;
  margin-top: 60px; // o 70px según TopNav
}
```

#### Page Styles (IonPage)
```scss
.newHomePage,
.newAccountPage,
.newPointsPage {
  --background: transparent;
  --ion-text-color: #ffffff;
}
```

### Z-Index

```scss
z-index: 1;      // Contenido principal
z-index: 10;     // Menús, modales locales
z-index: 1000;   // Enrollment liveness container
z-index: 99999;  // AWS Amplify Liveness Detector
```

### Grid y Flexbox

#### Flexbox Estándar
```scss
display: flex;
flex-direction: column; // Principalmente vertical
align-items: center;    // o flex-start según necesidad
justify-content: space-between; // o flex-start
gap: 12px-24px;
```

#### Flexbox Horizontal
```scss
display: flex;
flex-direction: row;
align-items: center;
justify-content: space-between;
gap: 12px;
```

---

## 🎪 Componentes Específicos

### TopNav

```scss
ion-toolbar {
  --border-width: 0 !important;
  --border-color: transparent !important;
  --background: #3880ff;
  --padding-top: 1rem;
  --padding-end: 1rem;
}

ion-title {
  color: white;
  font-weight: bold;
}

ion-menu-button {
  --color: #ffffff;
}
```

### AppMenu

```scss
.menuHeader {
  height: 220px;
  background: #3880ff;
  padding: 40px 20px 30px 20px;
}

.profileAvatar {
  width: 68px;
  height: 68px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.profileAvatarText {
  font-size: 28px;
  font-weight: 600;
  color: #3880ff;
}

.profileName {
  font-size: 26px;
  font-weight: 600;
  color: #ffffff;
}
```

### Hero Card (NewHomePage)

```scss
.heroCard {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  padding: 28px 24px;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #3880ff 0%, #5c9fff 100%);
  }
}

.heroMerchantName {
  font-size: 22px;
  font-weight: 600;
  color: #1f2937;
}

.heroPointsNumber {
  font-size: 52px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}
```

### Activity Rows

```scss
.activityRow {
  display: flex;
  align-items: center;
  gap: 12px;
}

.activityRowMiddle {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.activityRowMerchant {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.activityRowDescription {
  font-size: 13px;
  font-weight: 400;
  color: #6b7280;
}

.activityRowTime {
  font-size: 13px;
  font-weight: 400;
  color: #9ca3af;
  white-space: nowrap;
  flex-shrink: 0;
}
```

### Loading Skeletons

```scss
// Altura mínima igual al contenido real
IonSkeletonText {
  height: 24px; // Altura aproximada del texto
  margin-bottom: 8px; // Spacing igual al contenido real
}
```

---

## 🔤 Convenciones de Nomenclatura

### Clases CSS (SCSS Modules)

#### Páginas
```scss
.newHomePage
.newAccountPage
.newPointsPage
.newActivityHistoryPage
.changePasswordPage
.enrollmentPage
.loginPage
```

#### Contenedores
```scss
.pageContent
.container
.contentContainer
.mainWrapper
```

#### Cards
```scss
.heroCard
.profileCard
.sectionCard
.activityCard
.quickActionCard
.merchantCard
.emptyStateCard
```

#### Rows
```scss
.settingRow
.infoRow
.activityRow
.legalRow
.merchantRow
```

#### Botones
```scss
.flashButton
.submitButton
.logoutButton
.deleteAccountButton
.headerActionButton
```

#### Estados
```scss
.emptyState
.errorState
.loadingState
```

#### Avatares
```scss
.profileAvatar
.merchantAvatar
.activityAvatar
```

#### Formularios
```scss
.formCard
.formCardContent
.formItem
.formInput
.formLabel
```

---

## 📦 Variables SCSS Recomendadas

```scss
// Flash Design Tokens
$blue-primary: #3880ff;
$blue-gradient: linear-gradient(135deg, #3880ff 0%, #5c9fff 100%);
$blue-light: #5c9fff;
$blue-dark: #2d66cc;
$white: #ffffff;
$gray-50: #f9fafb;
$gray-100: #f8fafc;
$gray-200: #e5e7eb;
$gray-300: #d1d5db;
$gray-400: #9ca3af;
$gray-500: #6b7280;
$gray-900: #1f2937;
$success: #22c55e;
$error: #ef4444;
$warning: #f1c40f;
$text-secondary: rgba(255, 255, 255, 0.85);
$shadow-sm: 0 2px 12px rgba(0, 0, 0, 0.1);
$shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12);
$shadow-lg: 0 6px 20px rgba(0, 0, 0, 0.15);
$radius-sm: 8px;
$radius-md: 12px;
$radius-lg: 16px;
$radius-xl: 28px;
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 12px;
$spacing-lg: 16px;
$spacing-xl: 20px;
$spacing-2xl: 24px;
```

---

## 🎨 Patrones de Diseño Específicos

### Background Pattern (Páginas Principales)

Las páginas principales NO tienen fondo sólido. Usan:
1. `--background: transparent` en `IonPage`
2. `--background: transparent !important` en `IonContent`
3. El contenido visual tiene un gradiente azul de fondo (implementado en FloatingLightningBolts o similar)
4. Texto blanco sobre el fondo transparente/gradiente

### Card Pattern

1. **Fondo**: Blanco sólido o gradiente sutil blanco-gris muy claro
2. **Sombra**: `0 4px 16px rgba(0, 0, 0, 0.12)` estándar, `0 6px 20px rgba(0, 0, 0, 0.15)` para hero
3. **Border-radius**: `16px` estándar, `12px` para cards compactas
4. **Padding**: `24px 20px` estándar

### Botón Pattern

1. **Primario**: Fondo blanco, texto azul, border-radius `28px`, altura `52px`
2. **Secundario**: Transparente, borde coloreado, border-radius `12px`
3. **Active**: `transform: scale(0.96)` + cambio de sombra
4. **Disabled**: `opacity: 0.5`

### Avatar Pattern

1. **Gradiente**: Siempre `linear-gradient(135deg, #3880ff 0%, #5c9fff 100%)`
2. **Forma**: Siempre circular (`border-radius: 50%`)
3. **Texto**: Siempre blanco, font-weight 600
4. **Tamaños**: 64px (grande), 48px (mediano), 40px (pequeño)

### Input Pattern

1. **Fondo**: `#f9fafb` normal, `#ffffff` en focus
2. **Borde**: `1px solid #e5e7eb` normal, `#3880ff` en focus
3. **Border-radius**: `12px` estándar, `8px` en login/register
4. **Padding**: `14px 16px` estándar

### Empty State Pattern

1. **Card**: Mismo estilo que cards normales
2. **Icono**: `48px`, color `#9ca3af`
3. **Texto**: `16px`, color `#6b7280`, centrado
4. **Padding**: `40px 20px` (más padding vertical)

### Settings/Info Row Pattern

1. **Layout**: Flex horizontal, `space-between`
2. **Padding**: `12px 0`
3. **Min-height**: `48px`
4. **Clickable**: Active state con `rgba(56, 128, 255, 0.05)` background
5. **Divider**: `1px solid #e5e7eb` entre elementos

---

## 🔍 Ejemplos de Implementación

### Ejemplo 1: Página Principal con Hero Card

```scss
.newHomePage {
  --background: transparent;
  --ion-text-color: #ffffff;
}

.pageContent {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 20px;
  margin-top: 60px;
}

.heroCard {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  margin-bottom: 24px;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #3880ff 0%, #5c9fff 100%);
  }
}

.heroCardContent {
  padding: 28px 24px;
}
```

### Ejemplo 2: Botón Primario Flash

```scss
.flashButton {
  --background: #ffffff;
  --color: #3880ff;
  --border-radius: 28px;
  --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  font-size: 16px;
  font-weight: 600;
  height: 52px;
  transition: transform 0.2s ease;
  
  &:active {
    transform: scale(0.96);
  }
}
```

### Ejemplo 3: Input con Focus

```scss
.formInput {
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 14px;
  --padding-bottom: 14px;
  --background: #f9fafb;
  --color: #1f2937;
  --border-radius: 12px;
  --border-width: 1px;
  --border-color: #e5e7eb;
  font-size: 16px;
  
  &.ion-focused {
    --border-color: #3880ff;
    --background: #ffffff;
  }
}
```

### Ejemplo 4: Avatar con Gradiente

```scss
.profileAvatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3880ff 0%, #5c9fff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.profileAvatarText {
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
}
```

---

## 📋 Checklist de Consistencia

Al implementar estilos en otras apps, verifica:

- [ ] Fondo de página es `transparent` con texto blanco
- [ ] Cards usan `#ffffff` con sombra `0 4px 16px rgba(0, 0, 0, 0.12)`
- [ ] Border-radius de cards es `16px` (o `12px` para compactas)
- [ ] Botones primarios tienen fondo blanco y texto azul `#3880ff`
- [ ] Border-radius de botones primarios es `28px`
- [ ] Altura de botones primarios es `52px`
- [ ] Avatares usan el gradiente azul estándar
- [ ] Inputs tienen fondo `#f9fafb` y borde `#e5e7eb`
- [ ] Focus de inputs cambia a `#ffffff` y borde `#3880ff`
- [ ] Espaciado de padding es `20px` en páginas, `24px 20px` en cards
- [ ] Títulos principales son `28px` con font-weight `600-700`
- [ ] Texto secundario es `#6b7280`
- [ ] Texto terciario es `#9ca3af`
- [ ] Estados active usan `transform: scale(0.96)`
- [ ] Transiciones son `0.2s - 0.3s` con `ease`

---

## 🎯 Notas Finales

- **Consistencia es clave**: Todos estos valores están pensados para crear una experiencia visual coherente
- **Prioriza legibilidad**: El contraste entre texto y fondo siempre debe ser suficiente
- **Mobile-first**: Estos estilos están optimizados para dispositivos móviles
- **Accesibilidad**: Los colores cumplen con ratios de contraste WCAG AA
- **Performance**: Las animaciones son ligeras y no bloquean el render

---

**Última actualización**: Basado en el código actual de la app Flash (enero 2025)
