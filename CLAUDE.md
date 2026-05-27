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
| expo-av | ~16.0.8 |
| expo-image-picker | ~17.0.11 |

## Architecture

**Bosko** — React Native + Expo marketplace for service providers. Expo Router (file-based routing), React Context for all state.

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

### Context provider tree

Root (`app/_layout.tsx`):
```
AuthProvider
  └─ ProfileProvider
       └─ UsersProvider
            └─ CategoriesProvider
                 └─ ProvidersProvider
                      └─ ServicesProvider
                           └─ SearchProvider
                                └─ PaymentsProvider
                                     └─ OrdersProvider
                                          └─ PostsProvider
                                               └─ ReviewsProvider
```

Tabs (`app/(tabs)/_layout.tsx`):
```
ConversationsProvider   ← shared conversations list + optimistic lastMessage updates
  └─ UnreadProvider     ← total unread count for tab badge
```

### Feature modules (`src/features/`)

| Feature | Purpose |
|---|---|
| `auth` | Login, register, onboarding, token management |
| `profile` | Current user profile (fetch/update via `ProfileContext`) |
| `servicesUser` | Marketplace: categories, services, provider profiles, reviews, posts |
| `users` | User lookup by ID, edit profile |
| `orders` | Order creation, history, status tracking, quote requests |
| `payments` | Payment processing |
| `chat` | Real-time messaging (socket.io + REST fallback) |
| `kyc` | KYC / background check flow |
| `reviews` | Reviews and ratings |
| `reels` | Video reels feed |
| `search` | Search services/providers |
| `notifications` | Push notifications (expo-notifications, dev build only) |
| `plans` | Subscription plan management |

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
- `ConversationsContext` — holds conversations list shared between `ConversationsListScreen` and `ChatScreen`. `updateLastMessage(convId, content, senderId)` updates preview instantly (optimistic, no re-fetch needed).
- `UnreadContext` — total unread count, read by `CustomTabBar` to show badge on chat tab.

**ChatScreen features:**
- Text, image, video (up to 60s), audio (long-press mic) messages
- Typing indicator: animated 3-dot bubble
- Real-time via socket; poll fallback when disconnected
- Auto-scroll: `onContentSizeChange` + `onLayout` on FlatList; keyboard open also scrolls to end
- `keyboardDismissMode="interactive"`, `keyboardShouldPersistTaps="handled"`

**Socket join race condition fix**: `socketReady` initializes as `socketService.isConnected` (not always `false`), and join effect depends on `convId` state (not ref) so it re-runs correctly.

### Tab bar

`src/components/CustomTabBar.tsx` — custom animated pill tab bar.
- Reads `useUnread()` to show red badge on chat tab when `total > 0`.
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
- **26/5/2026 10:03 p. m.** — Servicios / Marketplace, Chat / Mensajería (9 archivos)
- **26/5/2026 10:03 p. m.** — Reels (17 archivos)
- **26/5/2026 09:59 p. m.** — Reels (17 archivos)
- **26/5/2026 09:58 p. m.** — Reels (17 archivos)
- **26/5/2026 09:56 p. m.** — Servicios / Marketplace, Chat / Mensajería (9 archivos)
- **26/5/2026 09:53 p. m.** — Reels (17 archivos)
- **26/5/2026 09:52 p. m.** — Reels (17 archivos)
- **26/5/2026 09:51 p. m.** — Reels (16 archivos)
- **26/5/2026 09:38 p. m.** — Reels (16 archivos)
- **26/5/2026 09:38 p. m.** — Reels (16 archivos)
- **26/5/2026 09:31 p. m.** — Reels (16 archivos)
- **26/5/2026 09:29 p. m.** — Servicios / Marketplace, Chat / Mensajería (9 archivos)
- **26/5/2026 09:21 p. m.** — Documentación CLAUDE.md, App Config (app.json), Dashboard HTML (3 archivos)
- **26/5/2026 09:13 p. m.** — Documentación CLAUDE.md, App Config (app.json), Dashboard HTML (3 archivos)
- **26/5/2026 02:01 p. m.** — Servicios / Marketplace, Dependencias (package.json) (3 archivos)
- **26/5/2026 01:59 p. m.** — Servicios / Marketplace, Dependencias (package.json) (3 archivos)
- **26/5/2026 01:57 p. m.** — Servicios / Marketplace, Dependencias (package.json) (3 archivos)
- **26/5/2026 01:55 p. m.** — Servicios / Marketplace, Dependencias (package.json) (2 archivos)
- **26/5/2026 01:53 p. m.** — Servicios / Marketplace (1 archivos)
- **26/5/2026 01:52 p. m.** — Servicios / Marketplace (1 archivos)