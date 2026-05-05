# Bosko API — Inventario de Endpoints

**Auth:** JWT requerido por defecto en todos los endpoints, excepto los decorados con `@Public()`.
**CurrentUser:** Inyecta `{ sub: string, email: string, role: string }` desde el payload JWT.
**PaginationDto:** `{ page?: number (default 1), limit?: number (default 20, max 100) }`

---

## 1. Auth — `/auth`

| Method | URL | Auth | Body / Params | Descripción |
|---|---|---|---|---|
| `POST` | `/auth/login` | No | `{ email, password }` | Login, retorna access + refresh tokens |
| `POST` | `/auth/register` | No | `{ email, password, firstName, lastName, username, phone, acceptedTermsVersion, acceptedPrivacyVersion }` | Registro de usuario |
| `GET` | `/auth/check-username` | No | `?username=` | Verifica disponibilidad de username |
| `POST` | `/auth/refresh-token` | No | `{ refreshToken }` | Obtener nuevo access token |
| `POST` | `/auth/logout` | Sí | Body opcional `{ refreshToken }`, Header `Authorization: Bearer <token>` | Invalidar tokens |
| `POST` | `/auth/forgot-password` | No | `{ email }` | Enviar email de recuperación |
| `POST` | `/auth/reset-password` | No | `{ email, token, newPassword }` | Resetear contraseña con token |
| `POST` | `/auth/verify-email` | No | `{ email, code }` (6 dígitos) | Verificar email con OTP |

---

## 2. Users — `/users`

| Method | URL | Auth | Body / Params | Descripción |
|---|---|---|---|---|
| `GET` | `/users/me` | Sí | — | Perfil propio completo |
| `PATCH` | `/users/me` | Sí | `{ firstName?, lastName?, username?, phone?, bio?, lat?, lng? }` | Actualizar perfil |
| `POST` | `/users/me/avatar` | Sí | Multipart `avatar` | Subir avatar |
| `GET` | `/users/me/stats` | Sí | — | Estadísticas propias |
| `DELETE` | `/users/me` | Sí | — | Borrar cuenta |
| `PATCH` | `/users/me/password` | Sí | `{ currentPassword, newPassword }` | Cambiar contraseña |
| `GET` | `/users/:id/public` | Sí | — | Perfil público de otro usuario |

---

## 3. Services — `/services`

| Method | URL | Auth | Body / Params | Descripción |
|---|---|---|---|---|
| `POST` | `/services` | Sí + KYC | `{ title, description, price, categoryId, keywords?, lat?, lng? }` | Crear servicio |
| `PATCH` | `/services/:id` | Sí | `{ title?, description?, price?, keywords?, lat?, lng? }` | Actualizar servicio propio |
| `DELETE` | `/services/:id` | Sí | — | Eliminar servicio propio |
| `GET` | `/services` | No | `?page=&limit=&categoryId=&minPrice=&maxPrice=&keywords=` | Listar servicios |
| `GET` | `/services/featured` | No | — | Servicios destacados |
| `GET` | `/services/nearby` | No | `?lat=&lng=&radiusKm=` | Proveedores cercanos |
| `POST` | `/services/:id/images` | Sí | Multipart `images` (max 5) | Subir imágenes del servicio |

---

## 4. Orders — `/orders`

| Method | URL | Auth | Body / Params | Descripción |
|---|---|---|---|---|
| `POST` | `/orders` | Sí + KYC | `{ serviceId, message, scheduledDate?, address? }` | Crear orden |
| `GET` | `/orders` | Sí | `?page=&limit=` | Órdenes propias (cliente + proveedor) |
| `GET` | `/orders/client` | Sí | `?page=&limit=` | Órdenes como cliente |
| `GET` | `/orders/provider` | Sí | `?page=&limit=` | Órdenes como proveedor |
| `GET` | `/orders/:id` | Sí | — | Detalle de orden (debe ser participante) |
| `PATCH` | `/orders/:id/accept` | Sí | — | Proveedor acepta la orden |
| `PATCH` | `/orders/:id/reject` | Sí | `{ reason }` | Proveedor rechaza la orden |
| `PATCH` | `/orders/:id/start` | Sí | — | Proveedor inicia el trabajo |
| `PATCH` | `/orders/:id/complete` | Sí | — | Proveedor marca como completado |
| `PATCH` | `/orders/:id/cancel` | Sí | `{ reason }` | Cliente cancela la orden |
| `POST` | `/orders/:id/dispute` | Sí | `{ reason }` | Abrir disputa |

---

## 5. Chat — `/conversations`

| Method | URL | Auth | Body / Params | Descripción |
|---|---|---|---|---|
| `GET` | `/conversations` | Sí | — | Listar conversaciones del usuario |
| `GET` | `/conversations/:orderId` | Sí | — | Conversación de una orden |
| `GET` | `/conversations/:id/messages` | Sí | `?page=&limit=` | Mensajes de una conversación |
| `POST` | `/conversations/:id/messages` | Sí | `{ content, type? }` | Enviar mensaje de texto |
| `PATCH` | `/conversations/:id/read` | Sí | — | Marcar conversación como leída |
| `POST` | `/conversations/:id/media` | Sí | Multipart `file` | Enviar archivo/imagen |

---

## 6. Reviews — `/reviews`

| Method | URL | Auth | Body / Params | Descripción |
|---|---|---|---|---|
| `POST` | `/reviews` | Sí | `{ orderId, rating (1-5), comment }` | Crear reseña |
| `DELETE` | `/reviews/:id` | Sí | — | Borrar reseña propia |
| `POST` | `/reviews/:id/report` | Sí | — | Reportar reseña |
| `POST` | `/reviews/:id/reply` | Sí | `{ reply }` | Proveedor responde a reseña |
| `GET` | `/reviews/providers/:id/reviews` | No | `?page=&limit=` | Reseñas de un proveedor |
| `GET` | `/reviews/providers/:id/rating` | No | — | Rating agregado de un proveedor |

---

## 7. Payments — `/payments`

| Method | URL | Auth | Body / Params | Descripción |
|---|---|---|---|---|
| `POST` | `/payments/initiate` | Sí | `{ orderId }` | Iniciar pago |
| `POST` | `/payments/webhook` | No | Raw body + headers `x-payment-provider`, `x-payment-signature` | Webhook del proveedor de pago |
| `POST` | `/payments/release/:orderId` | Admin | — | Liberar pago al proveedor |
| `POST` | `/payments/refund/:orderId` | Admin | `{ reason? }` | Reembolsar pago |
| `GET` | `/payments/order/:orderId` | Sí | — | Estado del pago de una orden |
| `GET` | `/payments/history` | Sí | `?page=&limit=` | Historial de pagos del usuario |
| `GET` | `/payments/providers/me/earnings` | Sí | `?page=&limit=` | Ganancias del proveedor autenticado |

---

## 8. Notifications — `/notifications`

| Method | URL | Auth | Body / Params | Descripción |
|---|---|---|---|---|
| `POST` | `/notifications/token` | Sí | `{ token, platform }` | Registrar push token |
| `DELETE` | `/notifications/token` | Sí | — | Eliminar push token |
| `GET` | `/notifications` | Sí | `?page=&limit=` | Listar notificaciones |
| `PATCH` | `/notifications/:id/read` | Sí | — | Marcar notificación como leída |
| `GET` | `/notifications/unread-count` | Sí | — | Contador de no leídas |

---

## 9. KYC — `/kyc`

| Method | URL | Auth | Body / Params | Descripción |
|---|---|---|---|---|
| `POST` | `/kyc/submit` | Sí | `{ documentType }` + multipart `documentFront`, `documentBack`, `selfie` | Enviar verificación KYC |
| `GET` | `/kyc/status` | Sí | — | Estado actual de KYC |
| `POST` | `/kyc/retry` | Sí | — | Reintentar verificación |

---

## 10. Search — `/search`

| Method | URL | Auth | Body / Params | Descripción |
|---|---|---|---|---|
| `GET` | `/search` | No | `?q=&page=&limit=` | Búsqueda global (servicios, proveedores) |

---

## 11. Plans — `/plans` y `/subscriptions`

| Method | URL | Auth | Body / Params | Descripción |
|---|---|---|---|---|
| `GET` | `/plans` | No | — | Listar planes disponibles |
| `GET` | `/plans/my-plan` | Sí | — | Plan actual del usuario |
| `POST` | `/subscriptions` | Sí | `{ planId }` | Suscribirse a un plan |
| `DELETE` | `/subscriptions` | Sí | — | Cancelar suscripción |
| `GET` | `/subscriptions/history` | Sí | `?page=&limit=` | Historial de suscripciones |

---

## 12. Admin KYC — `/admin/kyc`

Todos requieren rol `ADMIN`.

| Method | URL | Body / Params | Descripción |
|---|---|---|---|
| `GET` | `/admin/kyc/pending` | `?page=&limit=` | KYC pendientes de revisión |
| `PATCH` | `/admin/kyc/:userId` | `{ action ('approve'\|'reject'), notes?, reason? }` | Aprobar o rechazar KYC |

---

## 13. WebSocket Chat — `/chat`

**Auth:** JWT validado en conexión (header `Authorization: Bearer <token>` o query `?token=`).

| Evento cliente → servidor | Payload | Evento servidor → cliente | Descripción |
|---|---|---|---|
| `join_conversation` | `{ conversationId }` | `joined_conversation` | Unirse a sala de conversación |
| `leave_conversation` | `{ conversationId }` | `left_conversation` | Salir de sala de conversación |
| `send_message` | `{ conversationId, content, type? }` | `message_received` + `new_message_notification` | Enviar mensaje en tiempo real |
| `typing_indicator` | `{ conversationId, isTyping }` | `typing_indicator` | Notificar estado de escritura |

---

## Resumen por nivel de auth

**Públicos (14):**
`POST /auth/login`, `/auth/register`, `/auth/refresh-token`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`, `GET /auth/check-username`, `GET /services` (incl. `/featured`, `/nearby`), `GET /search`, `GET /plans`, `GET /reviews/providers/:id/reviews`, `GET /reviews/providers/:id/rating`, `POST /payments/webhook`

**Requieren KYC verificado (2):**
`POST /services`, `POST /orders`

**Admin (4):**
`POST /payments/release/:orderId`, `POST /payments/refund/:orderId`, `GET /admin/kyc/pending`, `PATCH /admin/kyc/:userId`

**Resto (34):** Requieren JWT estándar.

**Total: 54 endpoints REST + 1 WebSocket namespace con 4 eventos.**

---

## Error Reference

Todas las respuestas de error siguen el formato:

```json
{
  "success": false,
  "statusCode": 400,
  "code": "ERROR_CODE",
  "message": "Human-readable description",
  "timestamp": "2026-05-04T...",
  "path": "/endpoint"
}
```

### Códigos de error globales

| Code | HTTP | Exception | Cuándo ocurre |
|---|---|---|---|
| `BAD_REQUEST` | 400 | `BadRequestException` | Input inválido, validación fallida |
| `UNAUTHORIZED` | 401 | `UnauthorizedException` | Token ausente, expirado o inválido |
| `FORBIDDEN` | 403 | `ForbiddenException` | Sin permisos para la acción |
| `NOT_FOUND` | 404 | `NotFoundException` | Recurso no encontrado |
| `CONFLICT` | 409 | `ConflictException` | Conflicto de datos (email/username duplicado) |
| `PAYMENT_GATEWAY_ERROR` | 502 | `DomainException` | Fallo en proveedor de pagos externo |
| `HTTP_ERROR` | varies | `HttpException` | Errores del framework NestJS |
| `INTERNAL_ERROR` | 500 | (catch-all) | Error inesperado del servidor |

### Errores por endpoint

#### Auth

| Endpoint | Errores posibles |
|---|---|
| `POST /auth/login` | `NOT_FOUND` — User not found / `FORBIDDEN` — Invalid credentials |
| `POST /auth/register` | `CONFLICT` — Email already in use / `CONFLICT` — Username already taken / `BAD_REQUEST` — Email inválido, username inválido, teléfono inválido |
| `GET /auth/check-username` | `BAD_REQUEST` — Username inválido |
| `POST /auth/refresh-token` | `UNAUTHORIZED` — Invalid refresh token / `UNAUTHORIZED` — Token has been revoked |
| `POST /auth/forgot-password` | `NOT_FOUND` — User not found |
| `POST /auth/reset-password` | `NOT_FOUND` — User not found / `BAD_REQUEST` — Invalid reset token / `BAD_REQUEST` — Password must be at least 8 characters |
| `POST /auth/verify-email` | `NOT_FOUND` — User not found / `BAD_REQUEST` — Email already verified / `BAD_REQUEST` — Invalid verification code |

#### Users

| Endpoint | Errores posibles |
|---|---|
| `GET /users/me` | `NOT_FOUND` — User not found |
| `PATCH /users/me` | `NOT_FOUND` — User not found / `CONFLICT` — Username already taken / `CONFLICT` — Username/phone/location validation errors / `CONFLICT` — Both lat and lng are required for location |
| `POST /users/me/avatar` | `NOT_FOUND` — User not found / `BAD_REQUEST` — No file uploaded |
| `GET /users/me/stats` | `NOT_FOUND` — User not found |
| `DELETE /users/me` | `NOT_FOUND` — User not found |
| `PATCH /users/me/password` | `NOT_FOUND` — User not found / `FORBIDDEN` — Current password is incorrect / `BAD_REQUEST` — New password must be at least 8 characters |
| `GET /users/:id/public` | `NOT_FOUND` — User not found |

#### Services

| Endpoint | Errores posibles |
|---|---|
| `POST /services` | `NOT_FOUND` — Provider not found / `FORBIDDEN` — KYC approval required / `FORBIDDEN` — Free plan limits reached / `BAD_REQUEST` — Price/currency validation |
| `PATCH /services/:id` | `NOT_FOUND` — Service not found / `FORBIDDEN` — You can only update your own services |
| `DELETE /services/:id` | `NOT_FOUND` — Service not found / `FORBIDDEN` — You can only delete your own services |
| `POST /services/:id/images` | `NOT_FOUND` — Service not found / `FORBIDDEN` — You can only manage your own services / `BAD_REQUEST` — No files uploaded |

#### Orders

| Endpoint | Errores posibles |
|---|---|
| `POST /orders` | `NOT_FOUND` — Service not found / `NOT_FOUND` — Provider not found / `NOT_FOUND` — Client not found / `BAD_REQUEST` — Service is not active / `BAD_REQUEST` — You cannot order your own service |
| `GET /orders/:id` | `NOT_FOUND` — Order not found / `FORBIDDEN` — You are not a participant in this order |
| `PATCH /orders/:id/accept` | `NOT_FOUND` — Order not found / `FORBIDDEN` — Only the provider can accept this order / `BAD_REQUEST` — Invalid status transition |
| `PATCH /orders/:id/reject` | `NOT_FOUND` — Order not found / `FORBIDDEN` — Only the provider can reject this order / `BAD_REQUEST` — Invalid status transition |
| `PATCH /orders/:id/start` | `NOT_FOUND` — Order not found / `FORBIDDEN` — Only the provider can start this order / `BAD_REQUEST` — Invalid status transition |
| `PATCH /orders/:id/complete` | `NOT_FOUND` — Order not found / `FORBIDDEN` — Only the provider can complete this order / `BAD_REQUEST` — Invalid status transition |
| `PATCH /orders/:id/cancel` | `NOT_FOUND` — Order not found / `FORBIDDEN` — You are not a participant in this order / `BAD_REQUEST` — Invalid status transition |
| `POST /orders/:id/dispute` | `NOT_FOUND` — Order not found / `FORBIDDEN` — You are not a participant in this order / `BAD_REQUEST` — Cannot dispute order in status X. Disputes can only be opened from IN_PROGRESS or COMPLETED. |

#### Chat

| Endpoint | Errores posibles |
|---|---|
| `GET /conversations/:orderId` | `NOT_FOUND` — Conversation not found / `FORBIDDEN` — You are not a participant in this conversation |
| `GET /conversations/:id/messages` | `NOT_FOUND` — Conversation not found / `FORBIDDEN` — You are not a participant in this conversation |
| `POST /conversations/:id/messages` | `NOT_FOUND` — Conversation not found / `FORBIDDEN` — You are not a participant in this conversation / `FORBIDDEN` — Message content cannot be empty |
| `POST /conversations/:id/media` | `NOT_FOUND` — Conversation not found / `FORBIDDEN` — You are not a participant in this conversation / `BAD_REQUEST` — No file uploaded |

#### Reviews

| Endpoint | Errores posibles |
|---|---|
| `POST /reviews` | `NOT_FOUND` — Order not found / `BAD_REQUEST` — Can only review completed orders / `FORBIDDEN` — You did not participate in this order / `BAD_REQUEST` — You have already reviewed this order / `BAD_REQUEST` — Rating must be 1-5 |
| `DELETE /reviews/:id` | `NOT_FOUND` — Review not found / `FORBIDDEN` — You can only delete your own reviews |
| `POST /reviews/:id/report` | `NOT_FOUND` — Review not found |
| `POST /reviews/:id/reply` | `NOT_FOUND` — Review not found / `FORBIDDEN` — Only the reviewed provider can reply to this review / `BAD_REQUEST` — Review already has a reply / `BAD_REQUEST` — Reply content cannot be empty |

#### Payments

| Endpoint | Errores posibles |
|---|---|
| `POST /payments/initiate` | `NOT_FOUND` — Order not found / `NOT_FOUND` — Client not found / `FORBIDDEN` — Only the client can initiate payment / `BAD_REQUEST` — Order payment not pending |
| `POST /payments/webhook` | `BAD_REQUEST` — Invalid webhook signature / `BAD_REQUEST` — Missing external payment ID in webhook payload / `BAD_REQUEST` — Payment not found for external ID |
| `POST /payments/release/:orderId` | `NOT_FOUND` — Order not found / `BAD_REQUEST` — Order must be completed to release payment / `BAD_REQUEST` — No paid payment found for this order / `BAD_REQUEST` — Cannot release payment for a disputed order / `BAD_REQUEST` — Failed to release payment via gateway |
| `POST /payments/refund/:orderId` | `NOT_FOUND` — Order not found / `BAD_REQUEST` — No paid payment found for this order / `BAD_REQUEST` — Payment status is X, not PAID / `BAD_REQUEST` — Failed to process refund via payment gateway |
| `GET /payments/order/:orderId` | `NOT_FOUND` — Order not found / `FORBIDDEN` — You are not a participant in this order / `NOT_FOUND` — No payment found for this order |

#### Notifications

| Endpoint | Errores posibles |
|---|---|
| `POST /notifications/token` | `NOT_FOUND` — User not found |
| `DELETE /notifications/token` | `NOT_FOUND` — User not found |

#### KYC

| Endpoint | Errores posibles |
|---|---|
| `POST /kyc/submit` | `NOT_FOUND` — User not found / `BAD_REQUEST` — Maximum KYC attempts reached (3). Contact support for help. / `BAD_REQUEST` — All three documents are required: documentFront, documentBack, selfie |
| `GET /kyc/status` | (sin errores específicos — retorna estado actual) |
| `POST /kyc/retry` | `NOT_FOUND` — No KYC verification found to retry / `BAD_REQUEST` — KYC verification is not rejected / `BAD_REQUEST` — Maximum KYC attempts reached (3) |

#### Plans

| Endpoint | Errores posibles |
|---|---|
| `POST /subscriptions` | `NOT_FOUND` — Plan not found / `BAD_REQUEST` — Cannot subscribe to the free plan |
| `DELETE /subscriptions` | `NOT_FOUND` — No active subscription found |
| `GET /plans/my-plan` | `NOT_FOUND` — User not found / `NOT_FOUND` — No plan available |

#### Admin KYC

| Endpoint | Errores posibles |
|---|---|
| `PATCH /admin/kyc/:userId` (approve) | `FORBIDDEN` — Only admins can approve KYC / `NOT_FOUND` — No KYC verification found for this user / `FORBIDDEN` — KYC verification is not in review |
| `PATCH /admin/kyc/:userId` (reject) | `FORBIDDEN` — Only admins can reject KYC / `NOT_FOUND` — No KYC verification found for this user / `FORBIDDEN` — KYC verification is not in review |

#### Guards (automáticos, pre-controller)

| Guard | Error |
|---|---|
| `JwtAuthGuard` | `UNAUTHORIZED` (401) — Token ausente, malformado o expirado |
| `KycVerifiedGuard` | `FORBIDDEN` — Authentication required / `FORBIDDEN` — KYC verification is required to perform this action |
