# Handoff: Rebrand Bosko — "Señal Nocturna"

## Overview
Nueva identidad visual de Bosko: insignia "bo" (b sólida + o en degradado bordo→rosa, entrelazadas), tipografía Archivo (expandida en titulares) + JetBrains Mono para datos, paleta dark-first con acento "señal" (#FF2D6F) y menta (#00E5A0), superficies de vidrio, y animación de marca en splash y onboarding. Este bundle trae los tokens, componentes y pantallas ya adaptados al **stack real de tu app** (React Native + Expo Router, `@/core/design-system`), listos para reemplazar los archivos equivalentes.

## Sobre estos archivos
Los `.tsx`/`.ts` de este bundle son **código React Native real**, escrito para encajar con la estructura exacta de `src/core/design-system/` que ya tenés (mismos nombres de export: `TOKENS`, `PALETTE`, `TYPE_SCALE`, `FONT_FAMILY`, `GRADIENTS`) — no son referencias HTML a traducir. Aun así, revisalos antes de pisar tus archivos: puede que tengas código que dependa de valores que cambiaron (ver "Breaking changes" abajo).

## Fidelity
**Alta fidelidad.** Colores exactos, tipografía exacta, animaciones con timing específico. El objetivo es reemplazar 1:1, no reinterpretar.

## Breaking changes — leer antes de integrar
1. **`FONT_FAMILY.heading` deja de ser Space Grotesk, pasa a ser Archivo.** Hay que instalar `@expo-google-fonts/archivo` y `@expo-google-fonts/jetbrains-mono`, cargarlas en `app/_layout.tsx` (reemplazando el `useFonts({ SpaceGrotesk_* })` actual) y quitar la dependencia de Space Grotesk si no se usa en otro lado.
2. **`TOKENS.color.primaryDark` cambia de `#4A0F20` a `#3C0014`** — un poco más oscuro. Cualquier call-site que lo use directo (no vía token) se ve levemente distinto.
3. **`PALETTE.dark.surface2` y `PALETTE.dark.card` dejan de ser sólidos** (`#1C1925` / `#18151F`) **y pasan a ser translúcidos** (`rgba(255,255,255,0.06)` / `rgba(255,255,255,0.045)`) — pensados para ir sobre `BlurView` (`expo-blur`, ya usado en el login actual). Cualquier pantalla que renderice `card`/`surface2` sin un fondo detrás (ej. fuera del `AppBackground`) se verá casi transparente. Instalar `expo-blur` donde no esté y envolver cards con `<BlurView intensity={20} tint="dark">`.
4. **Los componentes deben migrar sus estilos de "bordo sólido" a la rampa "señal"** (`GRADIENTS.brand` ahora es `[signal, primary]`, no `[primary, primaryDark]`). Buscar usos hardcodeados de `'#850021'` como `backgroundColor` de botón/CTA y reemplazar por `<LinearGradient colors={GRADIENTS.brand}>`.
5. **Radios `sm` y `xl` cambian** (10→12, 28→26) — diferencia visual mínima, no crítica.

## Screens

### AnimatedSplashScreen (nuevo componente)
- **Propósito**: transición animada que se ve apenas Expo oculta su splash nativo estático, antes de entrar a Onboarding/Login/Tabs.
- **Secuencia** (~2.2s total): glow de fondo pulsante (`Animated.loop`, 1.3s por ciclo) + 3 ondas (`ripple`) expandiéndose en cascada (delay 0/800/1600ms, 2.4s cada una, `scale 0.6→2.1` + `opacity 0.7→0`) → la insignia `BrandMark` entra con scale+fade (900ms, delay 120ms) → wordmark + tagline entran con fade+translateY (500ms, delay 650ms) → barra de progreso inferior llena de 0 a 100% en 2s (`scaleX`, transformOrigin left).
- **Integración**: `app/index.tsx` ya tiene un placeholder de splash (`<View style={styles.splash}><ActivityIndicator/></View>`) mientras `!authLoaded`. Reemplazar ese bloque por `<AnimatedSplashScreen onDone={...} />` — `onDone` es donde continúa la lógica existente de redirect (a onboarding, login o tabs según `isAuthenticated`).
- **Colores**: fondo `#07060C`, glow `rgba(255,45,111,0.28)`, ondas `rgba(255,45,111,0.4)` borde 1px, barra `#FF2D6F` sobre track `rgba(255,255,255,0.1)`.

### OnBoarding (reemplaza `src/features/auth/screens/OnBoarding.tsx`)
- **Copy**: sin cambios (mismas 5 slides, mismo texto exacto).
- **Cambios visuales**: fondo del header usa la insignia `BrandMark` (antes logo PNG + texto suelto); el bottom sheet pasa de blanco sólido a vidrio (`rgba(255,255,255,0.05)` + borde `rgba(255,255,255,0.1)` — envolver en `BlurView` para el efecto real); dots en `#FF2D6F` (antes `Colors.colorPrimary` bordo puro); título/subtítulo en `#EDEAF5`/`rgba(237,234,245,0.55)` (antes negro/gris sobre sheet blanco); botón CTA con gradiente de 3 stops `#FF2D6F → #850021 → #3C0014` (antes 2 stops bordo).
- **Animaciones**: sin cambios de timing (fade+spring del texto al cambiar slide, scale del botón al presionar, ancho/opacidad de los dots interpolados con scroll) — ya estaban bien, solo se retocó color.
- **Lotties**: usar los 5 archivos recoloreados en `assets/lotties/` de este bundle (mismos nombres de archivo que ya tenías: `ltUPpJrUU2.json`→`welcome.json`, `pantalla-empleo.json`→`services.json`, `chico-compu.json`→`categories.json`, `hombre-escribiendo.json`→`verified.json`, `register2.json`→`start.json`). Fueron recoloreados programáticamente: cada color saturado de la animación original se remapeó por luminosidad a la rampa `#3C0014 → #850021 → #FF2D6F → #FFB8CE`; los neutros (blancos/grises/negros de las ilustraciones) quedaron intactos. Si preferís mantener los nombres de archivo originales, renombralos de vuelta al copiarlos.

### BrandMark (nuevo componente, `@/components/BrandMark`)
- **Insignia**: una `b` (stem vertical + circunferencia, trazo 19px, `strokeLinecap="round"`, color `#EDEAF5` o el que pases) dibujada **encima** de una `o` (circunferencia igual, degradado `#850021 → #FF2D6F`, `x1=0,y1=1,x2=1,y2=0`) — la `o` va detrás, centrada 40px a la derecha del centro de la `b` con radio levemente menor, así solo asoma una media luna. Nunca invertir cuál va encima ni cuál lleva el degradado.
- **Variantes**: `mark` (solo insignia — ícono de app, avatar, burbuja de tab), `wordmark` (solo texto, opcionalmente con tagline), `lockup` (ambos, default).
- **Tamaño mínimo**: por debajo de ~24px usar `mono` (una sola tinta, sin degradado — para bordado/stamps/facturas).

## Design Tokens — resumen de valores nuevos
| Token | Antes | Ahora |
|---|---|---|
| `TOKENS.color.primaryDark` | `#4A0F20` | `#3C0014` |
| `TOKENS.color.signal` (nuevo) | — | `#FF2D6F` |
| `TOKENS.color.mint` (nuevo) | — | `#00E5A0` |
| `TOKENS.radius.sm` / `.xl` | 10 / 28 | 12 / 26 |
| `TOKENS.shadow.glow` (nuevo) | — | rosa, ver `tokens/tokens.ts` |
| `PALETTE.dark.bg` | `#0B0A0F` | `#0A0910` |
| `PALETTE.dark.surface2` / `.card` | sólidos | vidrio translúcido (ver arriba) |
| `PALETTE.dark.text` | `#F2F0F8` | `#EDEAF5` |
| `GRADIENTS.brand` | `[primary, primaryDark]` | `[signal, primary]` |
| `FONT_FAMILY.heading` | Space Grotesk | Archivo |
| `FONT_FAMILY.mono` (nuevo) | — | JetBrains Mono |
| `TYPE_SCALE.h1`/`.h2` | normal | `textTransform: 'uppercase'`, `fontStretch`-equivalente vía Archivo ExtraBold |
| `TYPE_SCALE.meta` (nuevo) | — | mono, uppercase, tracking 1.3 |

## Assets
- `assets/lotties/*.json` — 5 animaciones Lottie recoloreadas a la rampa de marca (ver arriba). Fuente original: `assets/lotties/{ltUPpJrUU2,pantalla-empleo,chico-compu,hombre-escribiendo,register2}.json` en tu repo.
- El logo/insignia se genera en código (`BrandMark.tsx`, vía `react-native-svg` — ya está en tu `package.json`), no hace falta ningún PNG/SVG adicional para la UI. **Si necesitás un ícono de app estático** (para `app.json` → `icon`/`splash.image`), exportá `<BrandMark variant="mark" size={512}/>` a PNG con cualquier herramienta de captura de RN-SVG, o pedime un PNG y te lo genero aparte.

## Archivos de este bundle
```
tokens/tokens.ts.txt            → reemplaza src/core/design-system/tokens.ts (quitar el .txt)
tokens/palette.ts.txt           → reemplaza src/core/design-system/palette.ts (quitar el .txt)
tokens/typography.ts.txt        → reemplaza src/core/design-system/typography.ts (quitar el .txt)
tokens/gradients.ts.txt         → reemplaza src/core/design-system/gradients.ts (quitar el .txt)
components/BrandMark.tsx.txt    → nuevo: src/components/BrandMark.tsx (quitar el .txt)
screens/AnimatedSplashScreen.tsx.txt → nuevo: src/features/auth/screens/AnimatedSplashScreen.tsx (quitar el .txt)
screens/OnBoarding.tsx.txt       → reemplaza src/features/auth/screens/OnBoarding.tsx (quitar el .txt)
assets/lotties/*.json            → reemplaza los 5 .json equivalentes en assets/lotties/
CLAUDE_CODE_PROMPT.md            → prompt listo para pegarle a Claude Code en tu repo
```

Nota: los archivos de código llevan sufijo `.txt` (`BrandMark.tsx.txt`, etc.) para que este proyecto de diseño no los intente compilar como si fueran parte del propio design system — son código React Native para TU repo, no para acá. Al copiarlos a tu proyecto, quitá el `.txt` final.

No incluye (fuera de alcance de este pedido, pedime si los querés):
- Los demás componentes del design system (`Button.tsx`, `Card.tsx`, `Text.tsx`, `Input.tsx`, tab bar) actualizados a la nueva paleta/gradiente — hoy siguen leyendo los tokens viejos por nombre pero varios usan colores hardcodeados que no cambiarán solos.
- Pantallas de Registro y KYC rediseñadas.
- Ícono de app / splash image estáticos para `app.json`.
