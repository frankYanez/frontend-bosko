# Prompt para Claude Code

Pegá esto en Claude Code, parado en la raíz de `frontend-bosko`:

---

Tengo un rebrand de Bosko ("Señal Nocturna") preparado en la carpeta `design_handoff_bosko_rebrand/` (te la voy a copiar a la raíz del repo, o decime si ya está ahí). Leé primero `design_handoff_bosko_rebrand/README.md` completo — tiene la lista de breaking changes y la tabla de tokens antes/después.

Hacé esto en orden:

1. **Instalá las fuentes nuevas**: `npx expo install @expo-google-fonts/archivo @expo-google-fonts/jetbrains-mono`. Si `@expo-google-fonts/space-grotesk` ya no se usa en ningún otro lado del código después de este cambio, desinstalalo.

2. **Reemplazá los 4 archivos de tokens (`tokens.ts.txt`, `palette.ts.txt`, `typography.ts.txt`, `gradients.ts.txt` de `design_handoff_bosko_rebrand/tokens/` — quitando el sufijo `.txt` al copiarlos) sobre sus equivalentes en `src/core/design-system/`.

3. **Agregá `src/components/BrandMark.tsx`** desde `design_handoff_bosko_rebrand/components/BrandMark.tsx.txt`. Confirmá que `react-native-svg` esté importable (ya está en el `package.json`, según vi).

4. **Agregá `src/features/auth/screens/AnimatedSplashScreen.tsx`** desde `design_handoff_bosko_rebrand/screens/AnimatedSplashScreen.tsx.txt`, y usalo en `app/index.tsx`: reemplazá el bloque `if (!authLoaded) return <View style={styles.splash}>...</View>` por `<AnimatedSplashScreen onDone={() => {}} />` — dejá que el componente se desmonte solo cuando `authLoaded` pase a true (podés envolverlo en la misma condición que ya existe, simplemente cambiando qué se renderiza).

5. **Reemplazá `src/features/auth/screens/OnBoarding.tsx`** por la versión de `design_handoff_bosko_rebrand/screens/OnBoarding.tsx.txt`. Fijate que siga importando los 5 Lottie con los mismos nombres de archivo que ya tenías en `assets/lotties/` — si preferís mantener los nombres originales (`ltUPpJrUU2.json`, etc.) en vez de los nuevos (`welcome.json`, etc.), renombrá los archivos del bundle antes de copiarlos, o ajustá los `require(...)` en el archivo.

6. **Reemplazá `src/features/auth/screens/LogInView.tsx`** por `design_handoff_bosko_rebrand/screens/LogInView.tsx.txt` (quitando el `.txt`), y **`src/features/auth/screens/RegisterView.tsx`** por `screens/RegisterView.tsx.txt`. Ambas conservan exactamente la misma lógica, estado y validación que las versiones actuales — solo cambia el chrome visual (insignia, colores, tipografía, gradientes). Confirmá que `@/components/BrandMark` (agregado en el paso 3) sea el import correcto en ambas.

7. **Reemplazá los 5 archivos Lottie recoloreados** de `design_handoff_bosko_rebrand/assets/lotties/` sobre los originales en `assets/lotties/` (mismo nombre o el que hayas elegido en el paso 5).

7b. **Reemplazá `Button.tsx`, `Input.tsx`, `Card.tsx` y `Text.tsx`** por sus versiones en `design_handoff_bosko_rebrand/components/` (quitando el `.txt`) — rutas exactas en el README, sección "Screens". Estos son los que traen el glow rosa en press (Button) y el anillo de foco animado (Input) que faltaban.

7c. **Agregá `src/components/AnimatedBackground.tsx`** desde `components/AnimatedBackground.tsx.txt`, y **reemplazá `src/features/servicesUser/screens/DashboardScreen.tsx`** por `screens/DashboardScreen.tsx.txt` (quitando el `.txt` en ambos). Misma lógica y navegación que el archivo actual — solo cambia el chrome visual (ver README para el detalle completo).

7d. **Reemplazá las 12 pantallas restantes** que el Home enlaza — todas en `screens/`, mismo patrón `NombreOriginal.tsx.txt` → `NombreOriginal.tsx` quitando el `.txt`: `SearchPage`, `NotificationsScreen`, `ServicesScreen`, `CategoryServicesScreen`, `ProviderProfileScreen`, `ConversationsListScreen`, `ChatScreen`, `OrdersListScreen`, `OrderDetailScreen`, `ServiceFormScreen`. Las rutas de destino exactas están en la tabla del README. Todas conservan la misma lógica — el diff es mecánico (acento bordo→signal, sombras→glow, emoji→Ionicons donde aplicaba).

8. Después de todo esto, **buscá usos de `'#850021'`, `'#4A0F20'`, `'#C0002F'` hardcodeados como color de fondo de botón/CTA** en `src/**/*.tsx` (fuera de los archivos que ya tocamos) y reportame la lista — no los cambies todavía, solo decime dónde están, para que yo decida caso por caso si migran al nuevo `GRADIENTS.brand`.

9. Corré `npx tsc --noEmit` y arreglá cualquier error de tipos que surja de los cambios en `typography.ts` (el nuevo campo `textTransform` en `TypeStyle`, el nuevo rol `meta` en `TYPE_SCALE`).

No toques el tab bar (`CustomTabBar.tsx`) todavía — queda para una segunda pasada una vez que confirme que tokens + splash + onboarding + login + registro + componentes core se ven bien.

---
