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

### Button (reemplaza `src/core/design-system/components/Button.tsx`)
- **El "glow" que faltaba**: `primary` ya no tiene una sombra negra genérica — usa `TOKENS.shadow.glow` (rosa, `#FF2D6F`) y, como en mobile no existe `:hover`, el estado "encendido" vive en el **press**: `shadowRadius` 24→30 y `shadowOpacity` 0.4→0.55 al presionar, más un `scale(0.97)`. Es el equivalente táctil del hover-glow que viste en el sistema web.
- `secondary` pasa de `backgroundColor` sólido a vidrio (`rgba(255,255,255,0.06)` → `rgba(255,255,255,0.1)` al presionar) con borde `rgba(255,255,255,0.1)`.
- `outline`/`ghost` cambian de `tc.primary` a `#FF2D6F` (borde y relleno de press en `rgba(255,45,111,0.14)`).

### Input (reemplaza `src/core/components/Input.tsx`)
- **El foco que faltaba**: antes el foco solo cambiaba `borderColor`; ahora anima con `Animated.timing` un glow real (`shadowColor: '#FF2D6F'`, `shadowOpacity` 0→0.5, `shadowRadius` 0→10 en 180ms) — el equivalente RN del `box-shadow: 0 0 0 3px rgba(255,45,111,.15)` del sistema web.
- Fondo vidrio `rgba(255,255,255,0.06)`, texto `#EDEAF5`, placeholder `rgba(237,234,245,0.4)`.
- **Nuevo prop `leftIcon`** (Ionicons) — el login/registro rebrandeados ya lo usan (`mail-outline`, `lock-closed-outline`) para tener el ícono adentro del campo, como en el sistema web.

### Card (reemplaza `src/core/design-system/components/Card.tsx`)
- Pasa de superficie sólida `tc.card` a vidrio real: `rgba(255,255,255,0.045)` + `BlurView intensity={16}` detrás (antes no llevaba blur). `elevated` ahora es el glow rosa en vez de sombra negra — úsalo en cards que "flotan" (listados, modales), no en filas de lista simples.
- Nuevo prop `onPress` opcional (antes había que envolver el `Card` en un `Pressable` manualmente).

### Text (reemplaza `src/core/design-system/components/Text.tsx`)
- Sin cambios de comportamiento — solo consume el `TYPE_SCALE` nuevo (Archivo Expanded uppercase en h1/h2, rol `meta` nuevo en JetBrains Mono).

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

### DashboardScreen (reemplaza `src/features/servicesUser/screens/DashboardScreen.tsx`)
- **Lógica y estructura idénticas**: mismo fetch de categorías/servicios destacados, mismo auto-rotate del hero (3.6s), misma navegación (`router.push` a `/search`, `/(tabs)/orders`, `/(tabs)/chat`, `/service-form`, `/(tabs)/services/category/[id]`, `/(tabs)/services/provider/[id]`, `/(tabs)/profile/Notifications`), mismas animaciones de entrada por sección (`stagger` 90ms) y de press (`spring` a 0.9–0.97 según elemento).
- **`AnimatedBackground` nuevo** (`@/components/AnimatedBackground`, incluido en este bundle) montado detrás de todo el scroll — 3 blobs de glow radial (rosa/bordo/menta) a la deriva en loops independientes de 7-10s.
- **Sombras negras → glow rosa**: `notifBtn`, `searchBar`, `serviceCardShadow` pasan de `shadowColor:'#000'` a `shadowColor:'#FF2D6F'` con opacidad/radio mayores; superficies pasan a vidrio (`rgba(255,255,255,0.06)` + borde `rgba(255,255,255,0.1)`).
- **Categorías**: el fallback de ícono era el emoji `'🔧'` hardcodeado cuando la API no manda ícono — ahora detecta si `cat.icon` es un emoji y usa `Ionicons name="construct-outline"` en su lugar (nunca emoji como ícono de UI).
- **Quick actions**: los 3-4 chips pasan de fondos pastel sólidos (`#E8F4FD`, `#FFF0F3`, etc.) a un único tratamiento de vidrio (`rgba(255,255,255,0.06)` + borde) con el ícono tintado en signal/mint/azul — más consistente, menos "arcoíris".
- **Gradientes**: el stop bordo intermedio `'#c0002f'` de hero y CTA banner pasa a rosa señal `'#FF2D6F'` (3 stops: señal → bordo → profundo).
- **Rating**: pasa de `★ 4.8 (32)` en texto normal a `4.8 ★ / 32` en `JetBrainsMono_500Medium` color menta — coherente con el resto de la app (metadatos técnicos en mono).
- Título/nombre de usuario y títulos de sección pasan a `Archivo_700Bold`/`Archivo_800ExtraBold`; el saludo ("Buenas tardes") pasa a mono uppercase con tracking, como un timestamp.

### AnimatedBackground (nuevo componente, `@/components/AnimatedBackground`)
- 2-3 blobs de `View` con `borderRadius:999` + color translúcido, animados con `Animated.loop` (translateX/Y interpolado, 7-10s por ciclo, `useNativeDriver:true`). `variant="app"` agrega el tercer blob menta; `variant="minimal"` (auth/splash) deja solo 2. Montar como primer hijo de la vista raíz de la pantalla, con `pointerEvents="none"`.

### LogInView (reemplaza `src/features/auth/screens/LogInView.tsx`)
- **Lógica y estructura**: idénticas al archivo original — mismo estado, misma validación, mismo `handleLogin`, mismas animaciones de entrada (`fadeAnim`/`slideAnim`, 500ms + spring). Solo cambia el chrome visual.
- **Cambios**: logo PNG + texto suelto → `<BrandMark variant="mark" size={68}/>` seguido de `<BrandMark variant="wordmark" size={30} color="#fff" tagline/>`; wash de video más oscuro (`rgba(7,6,12,0.55)` — antes sin wash propio, dependía del video); card de vidrio ahora con fondo `rgba(255,255,255,0.05)` y borde `rgba(255,255,255,0.1)` (antes card sólido semi-transparente `tc.card` + borde blanco 85%); `BlurView tint` fijo en `"dark"` (antes condicional a `isDark`, porque la pantalla ya no tiene versión clara); inputs en `rgba(255,255,255,0.06)` con texto `#EDEAF5`; CTA con gradiente de 3 stops `#FF2D6F → #850021 → #3C0014` (antes `[primary, '#a0032a', primaryDark]`); títulos en `Archivo_700Bold` (antes sin `fontFamily` explícito, heredaba el default del sistema).
- **Nota**: `useIsDark()` queda importado pero sin usar en el render de `tint` — podés quitarlo si no lo necesitás para otra cosa en el archivo.

### RegisterView (reemplaza `src/features/auth/screens/RegisterView.tsx`)
- **Lógica y estructura**: idénticas — mismos 4 pasos (Nombre/Apellido/Email/Contraseña), misma validación progresiva, mismo manejo de `progress` animado, mismo flujo a `/auth/verify-email`.
- **Cambios**: mismo tratamiento de card/inputs/wash que LogInView; la barra de progreso pasa de un fill sólido `TOKENS.color.primary` a un `LinearGradient` `['#FF2D6F', '#850021']` dentro del `Animated.View` (el ancho lo sigue animando `progress`, el color ahora es degradado); el contador de paso (`1 / 4`) pasa a `JetBrainsMono_500Medium` con tracking — es el primer lugar de la app usando la mono para un dato "técnico" (índice de paso); logo reducido a `<BrandMark variant="mark" size={52}/>` sin wordmark (la card ya dice "Crear cuenta").

### Pantallas enlazadas desde el Home (todas incluidas)
Todas conservan exactamente la misma lógica, estado, fetch y navegación que el archivo original — el cambio es mecánico y consistente en las 9: acento bordo (`TOKENS.color.primary`) → signal (`TOKENS.color.signal`) en CTAs/badges/precios, sombras negras → glow rosa donde el original ya usaba sombra propia, y reemplazo de emoji-como-ícono por Ionicons donde aparecía (fallback `'🔧'`, `'🔍'`).

- **SearchPage** (`/search`) — mismo buscador debounced (320ms) y 3 tipos de resultado (categoría/proveedor/servicio).
- **NotificationsScreen** (`/(tabs)/profile/Notifications`) — mismo agrupamiento, swipe-delete y polling; `TYPE_ICON` pasa de pasteles claros (pensados para fondo blanco) a tintes translúcidos legibles en dark, uno por tipo de evento.
- **ServicesScreen** (`/(tabs)/services`) — mismas 10 gradientes curadas por índice de categoría y el flip-in 3D de las cards; el stop bordo intermedio pasa a signal, header/search (antes hardcodeados en modo claro) pasan a vidrio dark.
- **CategoryServicesScreen** (`/(tabs)/services/category/[id]`) — mismo hero + lista infinita + skeleton shimmer.
- **ProviderProfileScreen** (`/(tabs)/services/provider/[id]`) — misma carga de perfil/servicios/reseñas; hero pasa al gradiente signal→bordo→profundo, badges de verificación a tintes translúcidos.
- **ConversationsListScreen** (`/(tabs)/chat`) — misma lista, mismo formateo de "hace Xm/h/d".
- **ChatScreen** (`/chat/[id]`) — mismo WebSocket + polling fallback (5s), mismas burbujas de audio (waveform)/video/documento/imagen; el acento pasa a signal en todas.
- **OrdersListScreen** (`/(tabs)/orders`) — mismos tabs cliente/proveedor.
- **OrderDetailScreen** (`/orders/[id]`) — mismo timeline y mismas 6 acciones (aceptar/rechazar/iniciar/completar/cancelar/disputar).
- **ServiceFormScreen** (`/service-form`) — mismo alta/edición de servicio y carga de imágenes; la constante `BRAND` hardcodeada (`#850021` plano) pasa a signal.

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
screens/LogInView.tsx.txt       → reemplaza src/features/auth/screens/LogInView.tsx (quitar el .txt)
screens/RegisterView.tsx.txt    → reemplaza src/features/auth/screens/RegisterView.tsx (quitar el .txt)
components/Button.tsx.txt       → reemplaza src/core/design-system/components/Button.tsx (quitar el .txt)
components/Input.tsx.txt        → reemplaza src/core/components/Input.tsx (quitar el .txt)
components/Card.tsx.txt         → reemplaza src/core/design-system/components/Card.tsx (quitar el .txt)
components/Text.tsx.txt         → reemplaza src/core/design-system/components/Text.tsx (quitar el .txt)
components/AnimatedBackground.tsx.txt → nuevo: src/components/AnimatedBackground.tsx (quitar el .txt)
screens/DashboardScreen.tsx.txt → reemplaza src/features/servicesUser/screens/DashboardScreen.tsx (quitar el .txt)
screens/SearchPage.tsx.txt              → reemplaza src/features/search/SearchPage.tsx
screens/NotificationsScreen.tsx.txt     → reemplaza src/features/notifications/screens/NotificationsScreen.tsx
screens/ServicesScreen.tsx.txt          → reemplaza src/features/servicesUser/screens/ServicesScreen.tsx
screens/CategoryServicesScreen.tsx.txt  → reemplaza src/features/servicesUser/screens/CategoryServicesScreen.tsx
screens/ProviderProfileScreen.tsx.txt   → reemplaza src/features/servicesUser/screens/ProviderProfileScreen.tsx
screens/ConversationsListScreen.tsx.txt → reemplaza src/features/chat/screens/ConversationsListScreen.tsx
screens/ChatScreen.tsx.txt              → reemplaza src/features/chat/screens/ChatScreen.tsx
screens/OrdersListScreen.tsx.txt        → reemplaza src/features/orders/screens/OrdersListScreen.tsx
screens/OrderDetailScreen.tsx.txt       → reemplaza src/features/orders/screens/OrderDetailScreen.tsx
screens/ServiceFormScreen.tsx.txt       → reemplaza src/features/servicesUser/screens/ServiceFormScreen.tsx
(quitar el ".txt" final de los 12 archivos de screens/ al copiarlos)
assets/lotties/*.json            → reemplaza los 5 .json equivalentes en assets/lotties/
CLAUDE_CODE_PROMPT.md            → prompt listo para pegarle a Claude Code en tu repo
```

Nota: los archivos de código llevan sufijo `.txt` (`BrandMark.tsx.txt`, etc.) para que este proyecto de diseño no los intente compilar como si fueran parte del propio design system — son código React Native para TU repo, no para acá. Al copiarlos a tu proyecto, quitá el `.txt` final.

No incluye (fuera de alcance de este pedido, pedime si los querés):
- El tab bar (`CustomTabBar.tsx`) actualizado a la nueva paleta/gradiente.
- Pantallas de KYC rediseñadas.
- Ícono de app / splash image estáticos para `app.json`.
