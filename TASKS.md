# TASKS.md — Bosko App
# Actualizar este archivo al completar cada ítem.

## Leyenda
- [ ] Pendiente
- [x] Completo
- [~] En progreso

---

## Sprint 1 — Auth
- [x] OnBoarding — restaurar checkOnboarding (AsyncStorage)
- [x] LogInView — redesign glassmorphism
- [x] RegisterView — redesign glassmorphism
- [x] ForgotPasswordScreen — nueva pantalla (POST /auth/forgot-password)
- [x] ChangePasswordScreen — reemplazar placeholder (PATCH /users/me/password)
- [x] ResetPasswordScreen — pantalla con token de URL (POST /auth/reset-password)
- [x] VerifyEmailScreen — OTP 6 dígitos (POST /auth/verify-email)
- [x] Ruta app/login/forgot-password.tsx
- [x] Ruta app/auth/verify-email.tsx
- [x] Ruta app/auth/reset-password.tsx

## Sprint 2 — Perfil
- [x] ProfileScreen — stats conectados a /users/me/stats
- [x] EditProfileModal — conectar a PATCH /users/me
- [x] Avatar upload — ImagePicker + POST /users/me/avatar
- [x] Ruta profile/_layout.tsx — agregar ChangePassword, KYC, DeleteAccount
- [x] DeleteAccountScreen — DELETE /users/me (requerido App Store)
- [x] Ruta app/(tabs)/profile/delete-account.tsx

## Sprint 3 — KYC
- [x] kyc.types.ts — tipos TypeScript
- [x] kyc.service.ts — llamadas a /kyc/*
- [x] KYCContext.tsx — estado global KYC
- [x] KYCIntroScreen — explicación + CTA iniciar
- [x] KYCDocumentScreen — upload DNI frente/dorso
- [x] KYCSelfieScreen — captura selfie con cámara
- [x] KYCStatusScreen — estado actual con animación
- [x] KYCRejectedScreen — motivo + reintentar
- [x] Rutas app/(tabs)/profile/kyc/*

## Sprint 4 — Órdenes
- [x] orders.types.ts — tipos completos Order/OrderStatus
- [x] orders.service.ts — todos los endpoints de /orders
- [x] OrdersContext.tsx — estado con accept/reject/start/complete/cancel
- [x] QuoteRequestScreen — formulario POST /orders
- [x] OrdersListScreen — tabs cliente/proveedor
- [x] OrderDetailScreen — detalle + acciones por rol y estado
- [x] OrderStatusScreen — seguimiento en tiempo real con polling
- [x] Fix ProviderProfileScreen — conectar botón "Cotizar servicio"
- [x] Rutas app/(tabs)/orders/* (+ status)

## Sprint 5 — Chat
- [x] chat.service.ts — reescribir con endpoints reales /conversations
- [x] ConversationsListScreen — lista con unread badges
- [x] ChatScreen — chat real con HTTP polling
- [x] Reemplazar app/chat/[id].tsx antiguo con nueva ChatScreen
- [ ] WebSocket — socket.io-client para real-time (servicio creado, falta npm install)
- [x] app/(tabs)/chat.tsx — ruta de la tab de mensajes

## Sprint 6 — Pagos
- [x] payments.ts — servicio conectado a /payments/*
- [x] PaymentContext — estado con orden, historial, ganancias
- [x] PaymentsScreen — tabs Historial / Ganancias
- [x] Ruta app/(tabs)/profile/Payments.tsx

## Sprint 7 — Notificaciones
- [x] notifications.service.ts — GET/PATCH /notifications, push token
- [x] NotificationsContext — carga, marca leídas, registro push token
- [x] NotificationsScreen — lista de notificaciones
- [x] Fix import en app/(tabs)/profile/Notifications.tsx
- [x] Ruta app/(tabs)/profile/Notifications.tsx

## Bugs conocidos (del bosko.md)
- [x] ServiceFormScreen — CATEGORY_OPTIONS hardcodeadas
- [x] EditProfileScreen — "Leo Gómez" hardcodeado
- [x] ProfileStats — zeros hardcodeados
- [x] ProfileScreen duplicado en /users/screens/ — eliminar (usar el de /features/profile/)
- [x] Botón "Cotizar servicio" — conectado a QuoteRequestScreen
- [x] checkOnboarding — restaurado con AsyncStorage
- [x] fetchOrders / fetchOrderById — descomentados y conectados

## Deuda técnica
- [~] Instalar socket.io-client (npm install falló por espacio en disco)
- [ ] Integrar socket.service.ts en ChatScreen para real-time
- [ ] Agregar typing indicator en ChatScreen usando socket.service
