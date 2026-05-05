# CLAUDE.md — Bosko App

> Documento de contexto persistente para Claude Code.
> Leé esto completo antes de tocar cualquier archivo.

---

## ¿Qué es Bosko?

Marketplace de servicios independientes construido con **React Native + Expo Router**.
Conecta **clientes** (quien necesita un servicio) con **proveedores** (quien lo ofrece).
Similar a GetNinjas / Fiverr / TaskRabbit pero orientado a LATAM (ARS, USD, MXN).

Tagline: *"Donde podrás encontrar u ofrecer empleo fácilmente"*

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Framework | React Native + Expo SDK 54 |
| Routing | Expo Router (file-based, tabs + stack) |
| Estado global | React Context API (sin Redux/Zustand) |
| HTTP | Axios con instancia centralizada + interceptores JWT |
| Storage local | expo-secure-store (tokens) + AsyncStorage (preferencias) |
| Animaciones | moti + react-native-reanimated |
| Carruseles | react-native-reanimated-carousel |
| Gradientes | expo-linear-gradient |
| Iconos | @expo/vector-icons |
| i18n | Sistema t() centralizado en src/shared/i18n/strings.ts |
| Tests | Jest (unit) + Playwright (E2E) |

---

## Arquitectura del proyecto

Bosko usa **Feature-Based Architecture** (también llamada Screaming Architecture).
La idea central es: **todo lo que pertenece a una feature, vive junto**.

### Estructura de carpetas completa

```
src/
│
├── app/                              ← Expo Router — SOLO navegación, nada más
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx                 ← importa DashboardScreen de features/
│   │   ├── services.tsx              ← importa ServicesScreen de features/
│   │   ├── reels.tsx
│   │   ├── profile.tsx               ← importa ProfileScreen de features/
│   │   └── chat.tsx                  ← importa ConversationsListScreen de features/
│   ├── auth/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── forgot-password.tsx
│   │   └── verify-email.tsx
│   └── _layout.tsx                   ← root layout, monta todos los Providers
│
├── features/                         ← 🧠 el corazón de la app
│   │
│   ├── auth/
│   │   ├── screens/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   ├── ForgotPasswordScreen.tsx    ← falta crear
│   │   │   ├── VerifyEmailScreen.tsx       ← falta crear
│   │   │   └── ChangePasswordScreen.tsx    ← reemplazar placeholder
│   │   ├── components/
│   │   │   └── AuthInput.tsx
│   │   ├── services/
│   │   │   ├── auth.service.ts             ← llamadas reales a la API
│   │   │   └── auth.mock.ts               ← mocks para endpoints pendientes
│   │   ├── state/
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   └── types/
│   │       └── auth.types.ts
│   │
│   ├── kyc/                                ← falta crear completo
│   │   ├── screens/
│   │   │   ├── KYCIntroScreen.tsx
│   │   │   ├── KYCDocumentScreen.tsx
│   │   │   ├── KYCSelfieScreen.tsx
│   │   │   ├── KYCStatusScreen.tsx
│   │   │   └── KYCRejectedScreen.tsx
│   │   ├── components/
│   │   │   └── KYCStepIndicator.tsx
│   │   ├── services/
│   │   │   ├── kyc.service.ts
│   │   │   └── kyc.mock.ts
│   │   ├── state/
│   │   │   └── KYCContext.tsx
│   │   ├── hooks/
│   │   │   └── useKYC.ts
│   │   └── types/
│   │       └── kyc.types.ts
│   │
│   ├── orders/                             ← contexto existe, fetch comentado
│   │   ├── screens/
│   │   │   ├── QuoteRequestScreen.tsx      ← falta crear
│   │   │   ├── OrdersListScreen.tsx        ← falta crear
│   │   │   ├── OrderDetailScreen.tsx       ← falta crear
│   │   │   └── OrderStatusScreen.tsx       ← falta crear
│   │   ├── components/
│   │   │   ├── OrderCard.tsx               ← falta crear
│   │   │   ├── OrderStatusBadge.tsx        ← falta crear
│   │   │   └── OrderTimeline.tsx           ← falta crear
│   │   ├── services/
│   │   │   ├── orders.service.ts
│   │   │   └── orders.mock.ts
│   │   ├── state/
│   │   │   └── OrdersContext.tsx
│   │   ├── hooks/
│   │   │   └── useOrders.ts
│   │   └── types/
│   │       └── orders.types.ts
│   │
│   ├── chat/                               ← PLACEHOLDER hoy
│   │   ├── screens/
│   │   │   ├── ConversationsListScreen.tsx ← falta crear
│   │   │   └── ChatScreen.tsx              ← reemplazar placeholder
│   │   ├── components/
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   └── ChatInput.tsx
│   │   ├── services/
│   │   │   ├── chat.service.ts
│   │   │   └── socket.service.ts           ← WebSocket (socket.io-client)
│   │   ├── state/
│   │   │   └── ChatContext.tsx
│   │   ├── hooks/
│   │   │   └── useChat.ts
│   │   └── types/
│   │       └── chat.types.ts
│   │
│   ├── profile/                            ← parcialmente hecho
│   ├── servicesUser/                       ← bastante hecho
│   ├── search/                             ← bastante hecho
│   └── payments/                           ← PLACEHOLDER
│
├── shared/                         ← SOLO cosas usadas en 2+ features
│   ├── components/
│   │   ├── ButtonBosko.tsx
│   │   ├── SearchBar.tsx
│   │   ├── NavBar.tsx
│   │   ├── CustomTabBar.tsx
│   │   ├── EmptyState.tsx          ← crear si no existe
│   │   ├── ErrorState.tsx          ← crear si no existe
│   │   └── LoadingSpinner.tsx      ← crear si no existe
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   └── usePagination.ts
│   ├── services/
│   │   └── api.ts                  ← instancia Axios centralizada
│   ├── i18n/
│   │   └── strings.ts
│   └── tokens/
│       └── index.ts                ← TOKENS: colores, sombras, radios
│
└── constants/
    ├── routes.ts                   ← nombres de rutas tipados
    └── config.ts                   ← URLs base, feature flags, timeouts
```

### Las 5 reglas de arquitectura — NO romper nunca

**1. Una feature NO importa de otra feature**
`orders/` nunca importa algo de `chat/`. Si dos features necesitan algo en común, ese algo va a `shared/`.

**2. `shared/` solo tiene cosas usadas en 2+ features**
Si algo solo lo usa `orders/`, vive dentro de `orders/`. No "por si acaso" lo pongas en shared.

**3. `app/` solo tiene navegación — nunca lógica**
Las screens de Expo Router son contenedores vacíos que renderizan la screen real de `features/`:
```typescript
// app/(tabs)/index.tsx — así de simple, nada más
import { DashboardScreen } from '@/features/servicesUser/screens/DashboardScreen';
export default DashboardScreen;
```

**4. Cada feature tiene su propio Context y su propio hook**
Nunca un Context gigante para toda la app. Cada feature maneja su propio estado de forma aislada.

**5. Los tipos viven con su feature**
`Order` vive en `features/orders/types/orders.types.ts`, no en un `types/` global.

### Flujo de datos dentro de cada feature

La screen nunca llama a la API directamente. El flujo es siempre:

```
Screen
  │  usa el hook
  ▼
Hook (ej: useOrders)
  │  lee y escribe en
  ▼
Context (ej: OrdersContext)
  │  llama al
  ▼
Service (ej: orders.service.ts)
  │  usa la instancia centralizada
  ▼
api.ts (Axios) → Backend
```

---

## Design system

- Los colores, sombras y radios están en `src/shared/tokens/` como constante `TOKENS`.
- **Nunca usar colores hardcodeados** — siempre referenciar `TOKENS`.
- Componentes base disponibles: `ButtonBosko`, `SearchBar`, `SettingsButton`, `CustomTabBar`, `NavBar`.
- Para gradientes usar `expo-linear-gradient`.
- Para animaciones de entrada usar `moti` (FadeIn, SlideInDown, etc.).
- Para gestos y animaciones complejas usar `react-native-reanimated`.

---

## Estado actual del backend

El backend está **parcialmente implementado**. Algunos endpoints son reales y otros son mock.

### ✅ Endpoints reales (ya funcionan)
```
POST   /auth/login
POST   /auth/register
GET    /auth/check-username
POST   /auth/logout
GET    /users/me
GET    /users/:id
GET    /categories
GET    /services
GET    /services/:id
GET    /providers
GET    /providers/:id
GET    /providers/:id/services
GET    /categories/:id/services
DELETE /services/:id
GET    /reviews/:providerId
POST   /reviews
GET    /search?q=
```

### ❌ Endpoints pendientes (usar mock hasta que estén listos)
```
POST   /auth/forgot-password
POST   /auth/reset-password
POST   /auth/verify-email
POST   /auth/refresh-token       ← interceptor preparado, lógica incompleta
PATCH  /users/me                 ← existe pero datos hardcodeados en front
GET    /users/me/stats
POST   /users/me/avatar
DELETE /users/me
POST   /kyc/submit
GET    /kyc/status
POST   /orders
GET    /orders
GET    /orders/:id
PATCH  /orders/:id/accept
PATCH  /orders/:id/reject
PATCH  /orders/:id/start
PATCH  /orders/:id/complete
PATCH  /orders/:id/cancel
GET    /conversations
GET    /conversations/:orderId/messages
POST   /conversations/:orderId/messages
PATCH  /conversations/:id/read
POST   /notifications/token
GET    /notifications
GET    /notifications/unread-count
POST   /payments/initiate
POST   /payments/webhook
GET    /payments/order/:orderId
GET    /services/featured
GET    /providers/nearby
```

### Cómo manejar endpoints pendientes
Cuando un endpoint no existe todavía, crear el mock en `src/features/<feature>/services/<feature>.mock.ts` y exportar desde el mismo archivo de servicio con un flag:

```typescript
const USE_MOCK = true; // cambiar a false cuando el backend esté listo

export const fetchOrders = async () => {
  if (USE_MOCK) return ORDERS_MOCK;
  return await api.get('/orders');
};
```

---

## Bugs conocidos — corregir antes de continuar

| Archivo | Bug | Fix |
|---------|-----|-----|
| `ServiceFormScreen` | `CATEGORY_OPTIONS` hardcodeadas, `option.name` falla porque `option` es string | Consumir `GET /categories` y mapear correctamente |
| `EditProfileScreen` | `name = "Leo Gómez"` hardcodeado, guardar hace `console.log` | Conectar a `PATCH /users/me` |
| `ProfileStats` | `servicesCount=0, reviewsCount=0, rating=0` siempre | Conectar a `GET /users/me/stats` |
| `ProfileScreen` en `/users/screens/` | Todo comentado | Eliminar — usar solo el de `/features/profile/` |
| Botón "Cotizar servicio" | `<Pressable>` sin `onPress` | Navegar al flujo de creación de orden |
| `checkOnboarding` | Comentado — siempre muestra el onboarding | Restaurar lógica con flag en AsyncStorage |
| `fetchOrders` / `fetchOrderById` | Comentados en OrdersContext | Descomentar y conectar al backend |

---

## Roadmap de pantallas — orden de implementación

Atacar en este orden exacto. No avanzar al siguiente sprint sin terminar el anterior.

### 🔴 Sprint 1 — Auth completo
**Pantallas a crear/completar:**
- `ForgotPasswordScreen` — formulario de email, llamar `POST /auth/forgot-password`
- `ResetPasswordScreen` — formulario nueva contraseña con token de URL
- `VerifyEmailScreen` — input de 6 dígitos OTP, llamar `POST /auth/verify-email`
- `ChangePasswordScreen` — reemplazar placeholder, llamar `PATCH /users/me/password`

**Archivos a modificar:**
- Restaurar `checkOnboarding` en el flujo de inicio
- Agregar refresh token automático en el interceptor de Axios

---

### 🔴 Sprint 2 — Perfil real
**Pantallas a completar:**
- `EditProfileModal` — conectar a `PATCH /users/me` (sacar "Leo Gómez" hardcodeado)
- `ProfileScreen` — conectar stats a `GET /users/me/stats`
- Avatar upload — conectar ImagePicker a `POST /users/me/avatar`

**Pantallas a crear:**
- `DeleteAccountScreen` — confirmación + llamar `DELETE /users/me` (requerido App Store)

---

### 🔴 Sprint 3 — KYC
**Pantallas a crear** en `src/features/kyc/`:
- `KYCIntroScreen` — explicación del proceso, por qué se pide, beneficios del badge verificado
- `KYCDocumentScreen` — upload de DNI frente y dorso con ImagePicker, preview antes de enviar
- `KYCSelfieScreen` — captura de selfie con cámara (usar `expo-camera`)
- `KYCStatusScreen` — estado actual (pending / in_review / approved / rejected) con animación Lottie
- `KYCRejectedScreen` — motivo del rechazo + botón reintentar (máximo 3 intentos)

**Lógica:**
- El badge "Verificado" en el perfil del proveedor debe mostrase solo si `user.is_verified === true`
- Bloquear publicación de servicios si `kyc_status !== 'approved'` (mostrar CTA para completar KYC)
- Agregar `KYCContext` en `src/features/kyc/state/KYCContext.tsx`

**Tipos:**
```typescript
type KYCStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'expired';

interface KYCVerification {
  id: string;
  status: KYCStatus;
  documentType: 'DNI' | 'CEDULA' | 'PASAPORTE' | 'RUT';
  submittedAt: string;
  reviewedAt?: string;
  attemptCount: number; // máximo 3
  rejectionReason?: string;
}
```

---

### 🔴 Sprint 4 — Flujo de órdenes (más crítico)
**Pantallas a crear** en `src/features/orders/screens/`:

- `QuoteRequestScreen` — formulario que el cliente llena al tocar "Cotizar servicio":
  - Mensaje al proveedor (textarea)
  - Fecha deseada (DatePicker)
  - Dirección donde se realizará el trabajo
  - Precio estimado (opcional)
  - CTA: "Enviar solicitud" → `POST /orders`

- `OrdersListScreen` — tabs "Como cliente" / "Como proveedor", lista de órdenes con estado y último mensaje

- `OrderDetailScreen` — detalle completo de una orden:
  - Header con datos del servicio y la otra parte
  - Timeline visual del estado (pending → accepted → in_progress → completed)
  - Acciones según rol y estado actual (ver tabla abajo)
  - Botón para ir al chat de esa orden

- `OrderStatusScreen` — pantalla de seguimiento en tiempo real del estado

**Acciones por rol y estado:**
```
CLIENTE:
  pending      → puede cancelar
  accepted     → puede ir al chat, ver detalles
  in_progress  → puede reportar problema
  completed    → puede dejar reseña, confirmar finalización

PROVEEDOR:
  pending      → puede aceptar o rechazar (con motivo)
  accepted     → puede marcar como iniciado
  in_progress  → puede marcar como completado
  completed    → puede ver reseña recibida
```

**Estados visuales del timeline:**
```typescript
type OrderStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
```

**Tipos completos:**
```typescript
interface Order {
  id: string;
  clientId: string;
  providerId: string;
  serviceId: string;
  status: OrderStatus;
  title: string;
  clientMessage: string;
  agreedPrice?: number;
  scheduledDate?: string;
  address?: string;
  paymentStatus: 'pending' | 'paid' | 'released' | 'refunded';
  cancellationReason?: string;
  cancelledBy?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  // populated
  client?: User;
  provider?: User;
  service?: Service;
}
```

**Archivos a modificar:**
- `ProviderProfileScreen` — conectar el `<Pressable>` de "Cotizar servicio" para navegar a `QuoteRequestScreen` pasando `providerId` y `serviceId`
- `OrdersContext` — descomentar `fetchOrders` y `fetchOrderById`

---

### 🔴 Sprint 5 — Chat en tiempo real
**Pantallas a crear** en `src/features/chat/screens/`:

- `ConversationsListScreen` — lista de conversaciones activas con:
  - Avatar + nombre de la otra parte
  - Último mensaje truncado
  - Timestamp
  - Badge de mensajes no leídos
  - Estado de la orden asociada

- `ChatScreen` — chat individual vinculado a una orden:
  - Header con nombre + estado de la orden
  - Lista de mensajes (FlatList invertida)
  - Mensajes de sistema (cambios de estado) diferenciados visualmente
  - Input con botón de envío + botón de imagen
  - Indicador de escritura
  - Read receipts (✓✓)

**Arquitectura del chat:**
```typescript
// src/features/chat/services/socket.service.ts
// Usar socket.io-client si el backend es NestJS
// Usar Firebase Realtime DB como alternativa

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  mediaUrl?: string;
  messageType: 'text' | 'image' | 'system_event';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  orderId: string;
  clientId: string;
  providerId: string;
  lastMessageAt: string;
  unreadCount: number;
  lastMessage?: Message;
}
```

**WebSocket events a escuchar:**
```typescript
socket.on('message_received', (message: Message) => { ... });
socket.on('typing_indicator', ({ userId, isTyping }) => { ... });
socket.on('messages_read', ({ conversationId, readBy }) => { ... });
```

---

## Convenciones de código

**Nombrado:**
- Screens: `PascalCase` + sufijo `Screen` (ej: `OrderDetailScreen`)
- Componentes: `PascalCase` (ej: `OrderStatusBadge`)
- Hooks: `camelCase` + prefijo `use` (ej: `useOrders`)
- Servicios: `camelCase` + sufijo `Service` (ej: `ordersService`)
- Contextos: `PascalCase` + sufijo `Context` (ej: `OrdersContext`)

**Estructura de un Context:**
```typescript
// Siempre exportar: Provider, hook useX, y el Context si se necesita
export const OrdersProvider = ({ children }) => { ... };
export const useOrders = () => useContext(OrdersContext);
```

**Llamadas a la API:**
```typescript
// Siempre usar la instancia centralizada de Axios, nunca fetch directo
import { api } from '@/shared/services/api';

// Manejar errores siempre con try/catch y tipar la respuesta
const response = await api.post<Order>('/orders', payload);
```

**Estilos:**
```typescript
// Siempre StyleSheet.create() al final del archivo
// Nunca estilos inline salvo casos muy puntuales (dynamic values)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TOKENS.colors.background,
  },
});
```

---

## Patrones de UI existentes — reusar siempre

- **Loading state:** `ActivityIndicator` centrado con `TOKENS.colors.primary`
- **Error state:** componente `ErrorState` con mensaje y botón de retry
- **Empty state:** componente `EmptyState` con ilustración y texto
- **Confirmación destructiva:** `Alert.alert` con dos botones (Cancelar / Confirmar en rojo)
- **Pull to refresh:** `RefreshControl` en todos los `ScrollView` / `FlatList` de listas
- **Animación de entrada de pantalla:** `FadeIn` de moti con duration 300ms

---

## Notas importantes

1. **No crear endpoints en el frontend** — si un endpoint no existe, usar mock con el patrón `USE_MOCK` descripto arriba.
2. **No romper la navegación existente** — las 5 tabs están funcionando, cualquier pantalla nueva va en un stack dentro de la tab correspondiente.
3. **El sistema de internacionalización** — todos los strings visibles al usuario deben pasar por `t()` de `src/shared/i18n/strings.ts`.
4. **Imágenes** — siempre usar `expo-image` en lugar de `Image` de React Native para mejor performance y caché.
5. **Permisos** — pedir permisos de cámara y galería antes de usarlos con `expo-image-picker` y `expo-camera`. Manejar el caso de rechazo con un mensaje claro.
6. **KYC es bloqueante** — un proveedor no debería poder publicar servicios sin KYC aprobado. Validar en frontend y en backend.
7. **El chat siempre va ligado a una orden** — no existe chat libre entre usuarios. Esto simplifica la moderación.

---

## Comando para empezar cada sesión

Al iniciar una nueva sesión de Claude Code, ejecutar:

```bash
# Ver estructura actual del proyecto
find src -type f -name "*.tsx" | head -50

# Ver qué contextos existen
ls src/features/*/state/

# Ver el estado de las tabs
cat app/(tabs)/_layout.tsx
```

---

*Última actualización: Mayo 2025 — v1.1 (arquitectura expandida)*
