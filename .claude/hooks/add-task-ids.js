#!/usr/bin/env node
/**
 * One-shot script: add data-task-id attributes to pending task items in bosko-dashboard.html
 */
const fs = require('fs');
const path = require('path');

const DASHBOARD = path.resolve(__dirname, '..', '..', 'bosko-dashboard.html');

// Map: [text substring (plain string), task ID]
// Uses simple includes() match — no regex
const TASK_IDS = [
  // Auth
  ['Login social (Google / Apple)', 'auth-social'],
  ['Biometric unlock (FaceID / Fingerprint)', 'auth-biometric'],
  ['console.error debug en Login', 'auth-debug-logs'],
  // Home
  ['Skeleton loader mientras carga featured services', 'home-skeleton'],
  ['Error state UI si API falla', 'home-error-state'],
  ['Pull-to-refresh en Home', 'home-pull-refresh'],
  ['rdenes recientes', 'home-recent-orders'],
  // Servicios
  ['Botón favorito en service card', 'services-favorites'],
  ['Filtros avanzados', 'services-filters'],
  // Chat
  ['Toast error en fallo de env', 'chat-send-error-toast'],
  ['removeClippedSubviews', 'chat-flatlist-perf'],
  // Órdenes
  ['Optimistic UI en acciones de orden', 'orders-optimistic'],
  ['UI de reembolso/cancelaci', 'orders-refund-ui'],
  ['Notificaci', 'orders-push-notify'],
  ['OrderStatusScreen polling manual', 'orders-status-socket'],
  // Perfil
  ['DeleteAccount sin paso de verificaci', 'profile-delete-verify'],
  ['Toast éxito al actualizar perfil', 'profile-update-toast'],
  ['Skeleton stats mientras carga getUserStats', 'profile-stats-skeleton'],
  // Reels
  ['MOCK_REELS hardcoded', 'reels-mock-data'],
  ['Like/comment/share', 'reels-interactions-mock'],
  ['Conectar GET /reels', 'reels-api-feed'],
  ['POST /reels (upload video', 'reels-upload'],
  ['Like / comment / share reales', 'reels-interactions'],
  ['Infinite scroll / paginaci', 'reels-infinite'],
  // Pagos
  ['No hay integraci', 'payments-gateway'],
  ['UI de reembolsos', 'payments-refund-ui'],
  ['Desglose ganancias', 'payments-breakdown'],
  ['Withdrawal / transferencia', 'payments-withdrawal'],
  // KYC
  ['Countdown timer', 'kyc-countdown'],
  ['Soporte tipos doc', 'kyc-doc-types'],
  // Notificaciones
  ['In-app notification banner', 'notif-banner'],
  ['Filtros por tipo', 'notif-filters'],
  // Design debt bugs
  ['Iconos mezclados', 'design-icons-mixed'],
  ['Context nesting 15 niveles', 'design-context-nesting'],
  ['9 TODOs en interfaces', 'design-types-todo'],
  ['PostsContext', 'design-context-global'],
  // Design debt todos
  ['Mover todos los tipos compartidos', 'design-types-shared'],
  ['Confirmar todos los TODO de interfaces', 'design-types-confirm'],
  ['CI: lint', 'design-ci'],
];

let html = fs.readFileSync(DASHBOARD, 'utf8');
const lines = html.split('\n');
let count = 0;

for (const [textMatch, taskId] of TASK_IDS) {
  let found = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('task-item') && !line.includes('data-task-id') && line.includes(textMatch)) {
      lines[i] = line.replace('<div class="task-item">', `<div class="task-item" data-task-id="${taskId}">`);
      found = true;
      count++;
      console.log(`✓ ${taskId} (line ${i + 1})`);
      break;
    }
  }
  if (!found) {
    console.log(`✗ NOT FOUND: ${taskId} — "${textMatch}"`);
  }
}

fs.writeFileSync(DASHBOARD, lines.join('\n'), 'utf8');
console.log(`\nDone. ${count} task IDs added.`);
