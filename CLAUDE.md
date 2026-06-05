# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server (always clear cache on first run or after .env changes)
npx expo start -c

# Target platform
npx expo start --android
npx expo start --ios

# Run all tests
npm test

# Run single test file
npx jest __tests__/login.test.tsx
```

## Key constraints

- **Dev build required**: `react-native-reanimated` ~4.1.1 and `moti` ^0.30.0 use TurboModules (`react-native-worklets`) not bundled in Expo Go. Use `npx expo run:ios` or EAS Build for full functionality.
- **Env vars**: requires `.env` at root with `EXPO_PUBLIC_API_URL=https://api.boskoapp.site/api/v1`. App crashes at module load if missing.
- **Platform**: iOS + Android. `KeyboardAvoidingView` uses `behavior="padding"` on both.

## Stack

| Package | Version |
|---|---|
| expo | ^54.0.4 |
| react-native | 0.81.4 |
| expo-router | ~6.0.7 |
| react-native-reanimated | ~4.1.1 |
| moti | ^0.30.0 |
| socket.io-client | ^4.8.3 |
| axios | ^1.12.2 |
| @tanstack/react-query | ^5.100 |
| zustand | ^5.0 |
| expo-av | ~16.0.8 |
| expo-image-picker | ~17.0.11 |

## Architecture

**Bosko** — React Native + Expo marketplace for service providers. Expo Router (file-based routing). State: **TanStack Query** (server state) + **Zustand** (client UI state) + **React Context** (auth/session only).

### Path alias

`@/` maps to the project root.

### Routing

```
app/index.tsx          → Gate: authenticated → /(tabs), else → OnBoarding
app/login/             → Login / Register flow
app/(tabs)/            → Authenticated tab navigator (Inicio, Servicios, Reels, Perfil, Mensajes)
app/chat/[id].tsx      → Individual chat screen (outside tabs, id = orderId)
app/search.tsx         → Search screen
```

Auth guards:
- `app/index.tsx` — primary gate
- `app/(tabs)/_layout.tsx` — secondary guard, redirects to `/login` if no token
- `app/login/_layout.tsx` — inverse guard, redirects to `/(tabs)` if authenticated

### State Management

**Three layers, strict separation:**

| Layer | Tool | What goes here |
|---|---|---|
| Server state | TanStack Query | Todo lo que viene de la API: perfiles, órdenes, servicios, reseñas, etc. |
| Client UI state | Zustand | Estado que no viene del servidor: filtros, tabs, typing indicators, socket status, favoritos local. |
| Session / routing | React Context | Solo `AuthProvider` (token, force logout, router guards). |

#### Provider tree (actual)

```
QueryClientProvider        ← TanStack Query
  └─ AuthProvider          ← único Context real (sesión + router)
       └─ ServicesProvider ← reducer local + fetchQuery cache
```

Los demás "providers" (`ProfileProvider`, `OrdersProvider`, etc.) son **shims**: exportan un `Provider` que es `({children}) => <>{children}</>` y un hook con la misma API que antes, pero internamente usan TanStack Query o Zustand. Esto permite migrar pantallas de a una sin romper nada.

#### Zustand store rules

**Cuándo crear un store Zustand:**

- ✅ Estado UI compartido entre pantallas no relacionadas (ej: `selectedCategoryId`, `activeFilters`)
- ✅ Estado que sobrevive navegación (ej: conversación activa, posición de scroll)
- ✅ Estado de infraestructura (ej: `socketReady`, `typingUsers`)
- ✅ Datos que necesitan persistencia local (ej: favoritos con AsyncStorage)

**Cuándo NO usar Zustand (usar TanStack Query):**

- ❌ Datos del servidor (fetch, cache, paginación) → va en un hook `useQuery`
- ❌ Mutaciones al backend → van en un hook `useMutation`
- ❌ Estado de carga/error de un fetch → ya viene en `useQuery().isLoading`

**Reglas para no descontrolarse:**

1. **Un store por dominio**, no uno por pantalla. Si tiene sentido conceptual, puede haber varios stores, pero el default es pocos y bien definidos.
2. **No mezclar estado servidor + UI en el mismo store.** Si algo se fetchea de la API, no va en Zustand. Usar `qc.fetchQuery` o un hook query y que TanStack maneje el cache.
3. **Usar selectores granulares.** Cada componente importa solo el slice que necesita — evita re-renders innecesarios:
   ```ts
   // ❌
   const { unreadTotal, conversations, socketReady } = useChatStore();
   // ✅
   const unreadTotal = useUnreadTotal();
   const conversations = useConversationsList();
   ```
4. **Exportar selectores named.** El store file debe exportar hooks con nombre claro (`useUnreadTotal`, `useIsFavorite`, `useSocketReady`) además de `useChatStore` para selectores ad-hoc:

   ```ts
   // src/stores/marketplace.store.ts
   export const useMarketplaceStore = create<MarketplaceUIState>((set) => ({ ... }));
   export const useSelectedCategory = () => useMarketplaceStore(s => s.selectedCategoryId);
   export const useActiveFilters = () => useMarketplaceStore(s => s.activeFilters);
   ```

5. **Persist solo lo necesario.** Con `zustand/middleware/persist`, usar `partialize` para no guardar derivados ni funciones:
   ```ts
   persist(store, {
     name: 'BOSKO_FAVORITES_v2',
     storage: createJSONStorage(() => AsyncStorage),
     partialize: (state) => ({ favorites: state.favorites }),
   })
   ```
6. **Stores nuevos → discutir.** Antes de crear un store nuevo, preguntar si el estado ya está cubierto por una query key de TanStack o si puede ir en un hook simple.

#### Estructura de archivos

```
src/
  stores/                    ← Zustand (UI state)
    chat.store.ts            ← conversaciones, unread, socket, typing
    favorites.store.ts       ← favoritos con persist AsyncStorage
    marketplace.store.ts     ← categoría seleccionada, filtros, search query
  hooks/queries/             ← TanStack Query (server state)
    useProfileQuery.ts
    useOrdersQuery.ts
    useMarketplaceQuery.ts
    usePaymentsQuery.ts
    useKYCQuery.ts
    useNotificationsQuery.ts
    useChatQuery.ts
    useReelsQuery.ts
    useSearchQuery.ts
  hooks/mutations/           ← TanStack Query mutations
    useReviewMutations.ts
  core/query/
    queryClient.ts           ← QueryClient config (staleTime, gcTime, retry)
    queryKeys.ts             ← QUERY_KEYS centralizadas
```

### Feature modules (`src/features/`)

| Feature | Purpose | State |
|---|---|---|
| `auth` | Login, register, onboarding, token management | Context (`AuthContext`, único real) |
| `profile` | Current user profile (fetch/update) | TanStack Query (`useProfileQuery`) |
| `servicesUser` | Marketplace: categories, services, provider profiles, reviews, posts | `ServicesProvider` (reducer + fetchQuery) |
| `users` | User lookup by ID, edit profile | TanStack Query (`usePublicUser`) |
| `orders` | Order creation, history, status tracking, quote requests | TanStack Query (`useOrdersQuery`) |
| `payments` | Payment processing | TanStack Query (`usePaymentsQuery`) |
| `chat` | Real-time messaging (socket.io + REST fallback) | Zustand (`chat.store`) + TanStack Query |
| `kyc` | KYC / background check flow | TanStack Query (`useKYCQuery`) |
| `reviews` | Reviews and ratings | TanStack Query hooks |
| `reels` | Video reels feed | TanStack Query (`useReelsQuery`) |
| `search` | Search services/providers | TanStack Query + Zustand (query state) |
| `notifications` | Push notifications (expo-notifications, dev build only) | TanStack Query + `usePushNotificationSetup` hook |
| `plans` | Subscription plan management | — |

### API layer

- **Axios instance**: `src/core/api/axiosinstance.tsx`
  - Injects JWT Bearer token on every request (reads from in-memory cache in `tokenStorage`)
  - Auto-refresh on 401 (calls `/auth/refresh-token`, retries original request)
  - Unwraps `{ success, timestamp, data: T }` server envelope automatically
  - Skips refresh on `/auth/login`, `/auth/register`, `/auth/refresh-token`
- **Base URL**: `src/core/config/env.ts` → `process.env.EXPO_PUBLIC_API_URL`
- **Token storage**: `src/core/auth/tokenStorage.ts` — singleton, SecureStore + in-memory cache. Exposes `setForceLogoutCallback()` so axios interceptor can force logout without circular dependency on AuthContext.

### Chat module (`src/features/chat/`)

Real-time chat tied to orders (no free DMs).

**Services:**
- `chat.service.ts` — REST: fetch conversations, messages, send text/media/audio, mark read
- `socket.service.ts` — socket.io singleton. Connect with JWT, join/leave rooms, emit/receive messages and typing indicators. Falls back to REST polling every 10s.

**State:**
- `src/stores/chat.store.ts` — Zustand store: conversations list, unread badge, socket ready, typing indicators
  - `useConversationsList()` / `useUnreadTotal()` / `useSocketReady()` / `useIsTyping(convId)`
  - `updateLastMessage(convId, content, senderId)` — optimistic preview update
  - `setConversations(fn)` — accepts updater function for preserving optimistic state on re-fetch
- `src/hooks/queries/useChatQuery.ts` — TanStack Query: fetch conversations, messages, send/mark read mutations

**ChatScreen features:**
- Text, image, video (up to 60s), audio (long-press mic) messages
- Typing indicator: animated 3-dot bubble
- Real-time via socket; poll fallback when disconnected
- Auto-scroll: `onContentSizeChange` + `onLayout` on FlatList; keyboard open also scrolls to end
- `keyboardDismissMode="interactive"`, `keyboardShouldPersistTaps="handled"`

**Socket join race condition fix**: `socketReady` initializes as `socketService.isConnected` (not always `false`), and join effect depends on `convId` state (not ref) so it re-runs correctly.

### Tab bar

`src/components/CustomTabBar.tsx` — custom animated pill tab bar.
- Reads `useUnreadTotal()` (from `chat.store`) to show red badge on chat tab when `total > 0`.
- Pill slides with spring animation to active tab.
- Icons from `@expo/vector-icons` Ionicons.

### Design system

- **Tokens**: `src/core/design-system/tokens.ts` → `TOKENS` (brand color `#850021`, radius, shadows)
- **Colors**: `src/core/design-system/Colors.ts` → extended palette including premium gold theme
- **Fonts**: Inter and Outfit via `expo-font` plugin
- **MotiView**: `src/core/components/MotiView.ios.tsx` / `.android.tsx` — thin re-export of `moti`. Requires dev build (TurboModule).

### SVG support

`react-native-svg-transformer` in `metro.config.js`. Import SVGs as React components. Type declaration in `declarations.d.ts`.

### Tests

Jest with `jest-expo` preset. Test files in `__tests__/`. `moti` and `expo-image` mocked in `jest.setup.ts`. `@/` alias works via `moduleNameMapper` in `package.json`.

## Recent Changes
- **5/6/2026 08:22 p. m.** — Auth (9 archivos)
- **5/6/2026 08:16 p. m.** — Auth (9 archivos)
- **5/6/2026 08:14 p. m.** — Auth (8 archivos)
- **5/6/2026 08:13 p. m.** — Auth (8 archivos)
- **5/6/2026 08:10 p. m.** — Auth (6 archivos)
- **5/6/2026 08:09 p. m.** — Auth (6 archivos)
- **5/6/2026 07:43 p. m.** — Documentación CLAUDE.md, App Config (app.json), Dashboard HTML, Dependencias (package.json) (8 archivos)
- **5/6/2026 07:42 p. m.** — Documentación CLAUDE.md, App Config (app.json), Dashboard HTML, Dependencias (package.json) (8 archivos)
- **5/6/2026 07:39 p. m.** — Documentación CLAUDE.md, App Config (app.json), Dashboard HTML, Dependencias (package.json) (8 archivos)
- **5/6/2026 07:38 p. m.** — Documentación CLAUDE.md, App Config (app.json), Dashboard HTML, Dependencias (package.json) (8 archivos)
- **5/6/2026 07:33 p. m.** — Documentación CLAUDE.md, App Config (app.json), Dashboard HTML, Dependencias (package.json) (8 archivos)
- **5/6/2026 07:33 p. m.** — Documentación CLAUDE.md, App Config (app.json), Dashboard HTML, Dependencias (package.json) (8 archivos)
- **5/6/2026 07:32 p. m.** — Documentación CLAUDE.md, App Config (app.json), Dashboard HTML, Dependencias (package.json) (8 archivos)
- **5/6/2026 07:31 p. m.** — Documentación CLAUDE.md, App Config (app.json), Dashboard HTML, Dependencias (package.json) (8 archivos)
- **5/6/2026 05:53 p. m.** — Auth, Servicios / Marketplace, App Config (app.json) (16 archivos)
- **5/6/2026 05:51 p. m.** — Auth, Servicios / Marketplace, App Config (app.json) (16 archivos)
- **5/6/2026 05:50 p. m.** — Auth, Servicios / Marketplace, App Config (app.json) (16 archivos)
- **5/6/2026 04:18 p. m.** — Auth, Servicios / Marketplace, App Config (app.json) (16 archivos)
- **5/6/2026 04:17 p. m.** — Auth, Servicios / Marketplace, App Config (app.json) (15 archivos)
- **5/6/2026 04:14 p. m.** — Auth, Servicios / Marketplace, App Config (app.json) (14 archivos)