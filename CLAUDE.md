# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server
npx expo start

# Target platform
npx expo start --android
npx expo start --ios

# Run all tests
npm test

# Run single test file
npx jest __tests__/login.test.tsx
```

## Architecture

**Bosko** is a React Native + Expo marketplace app for service providers. Uses Expo Router (file-based routing) and React Context for all state management.

### Path alias

`@/` maps to the project root. Use `@/features/...`, `@/core/...`, `@/contexts/...` etc.

### Routing

```
app/index.tsx          → OnBoarding (entry, no auth required)
app/login/             → Login / Register flow
app/(tabs)/            → Authenticated tab navigator (Inicio, Servicios, Reels, Perfil, Mensajes)
app/chat/[id].tsx      → Chat screen (outside tabs)
app/search.tsx         → Search screen
```

Auth guard lives in `app/(tabs)/_layout.tsx` — redirects to `/login` if no token in `AuthContext`.

### Context provider tree (root layout)

Providers nest in this order in `app/_layout.tsx`:

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
                                          └─ PostsProvider (serviceId="global")
                                               └─ ReviewsProvider (serviceId="global")
```

### Feature modules (`src/features/`)

Each feature owns screens, services (API calls), state (context), components, and types:

| Feature | Purpose |
|---|---|
| `auth` | Login, register, onboarding, token management |
| `profile` | Current user profile (fetch/update via `ProfileContext`) |
| `servicesUser` | Marketplace: categories, services, provider profiles, reviews, posts |
| `users` | User lookup by ID |
| `orders` | Order creation and history |
| `payments` | Payment processing |
| `chat` | Messaging between users |
| `search` | Search services/providers |

### API layer

- **Active client**: `src/core/api/axiosinstance.tsx` — axios instance with JWT bearer token injected on every request and automatic token refresh on 401.
- **Base URL**: `src/core/config/env.ts` → `http://204.168.149.235:4000`
- **Token storage**: `expo-secure-store` keys: `token`, `refreshToken`, `userEmail`, `user`
- `src/core/api/client.ts` is commented out / unused — ignore it.

Token refresh skips `/auth/login` and `/auth/register` endpoints to avoid refresh loops.

### ServicesContext state model

`ServicesContext` (`src/features/servicesUser/state/ServicesContext.tsx`) manages the marketplace via a `useReducer`-based state (`MarketplaceState`) with normalized records keyed by ID:

- `servicesByCategory[categoryId]` — list of `ServiceSummary` per category
- `servicesById[id]` — flat service lookup
- `providers[id]` — provider profiles
- `reviewsByService[id]` — reviews per service
- `eligibility[serviceId][userId]` — review permission cache

Plan gating: `FREE` plan allows max 1 service. `PLUS`/`PREMIUM` plans allow more. Plan is derived from `authState.user` fields at login.

### Design system

- **Primary tokens**: `src/core/design-system/tokens.ts` → `TOKENS` (brand color `#850021`, radius scale, shadows)
- **Extended palette**: `src/core/design-system/Colors.ts` → `Colors` (includes premium gold theme)
- **Fonts**: Inter and Outfit loaded via `expo-font` plugin. Lottie animations in `assets/lotties/`.

### SVG support

SVGs are transformed via `react-native-svg-transformer` (configured in `metro.config.js`). Import SVGs as React components — the type declaration is in `declarations.d.ts`.

### Tests

Jest with `jest-expo` preset. Test files in `__tests__/`. `moti` and `expo-image` are mocked in `jest.setup.ts`. The `@/` alias works in tests via `moduleNameMapper` in `package.json`.
