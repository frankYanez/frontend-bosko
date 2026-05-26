#!/usr/bin/env node
/**
 * Stop hook — fires when Claude Code finishes a turn.
 * Reads edited files from the session transcript (or git diff as fallback),
 * maps them to feature labels, and writes:
 *   1. An entry in bosko-dashboard.html  (changelog section)
 *   2. A line in CLAUDE.md              (## Recent Changes)
 */

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const ROOT         = path.resolve(__dirname, '..', '..');
const DASHBOARD    = path.join(ROOT, 'bosko-dashboard.html');
const CLAUDE_MD    = path.join(ROOT, 'CLAUDE.md');
const CHANGELOG_DB = path.join(__dirname, '..', 'changelog.json');

// ── Feature map ──────────────────────────────────────────────────────────────
const FEATURE_MAP = [
  { re: /features[\\/]auth/,          label: 'Auth' },
  { re: /features[\\/]chat/,          label: 'Chat / Mensajería' },
  { re: /features[\\/]notifications/, label: 'Notificaciones Push' },
  { re: /features[\\/]orders/,        label: 'Órdenes' },
  { re: /features[\\/]payments/,      label: 'Pagos' },
  { re: /features[\\/]profile/,       label: 'Perfil' },
  { re: /features[\\/]kyc/,           label: 'KYC / Antecedentes' },
  { re: /features[\\/]reels/,         label: 'Reels' },
  { re: /features[\\/]reviews/,       label: 'Reseñas' },
  { re: /features[\\/]search/,        label: 'Búsqueda' },
  { re: /features[\\/]servicesUser/,  label: 'Servicios / Marketplace' },
  { re: /features[\\/]favorites/,     label: 'Favoritos' },
  { re: /features[\\/]plans/,         label: 'Planes' },
  { re: /features[\\/]users/,         label: 'Usuarios' },
  { re: /core[\\/]api/,               label: 'API / Axios' },
  { re: /core[\\/]components/,        label: 'Componentes Core' },
  { re: /core[\\/]design-system/,     label: 'Design System / Tokens' },
  { re: /app[\\/]_layout/,            label: 'App Layout / Providers' },
  { re: /app[\\/]\(tabs\)/,           label: 'Navegación / Tabs' },
  { re: /contexts[\\/]/,              label: 'Contextos Globales' },
  { re: /bosko-dashboard/,            label: 'Dashboard HTML' },
  { re: /CLAUDE\.md/,                 label: 'Documentación CLAUDE.md' },
  { re: /app\.json/,                  label: 'App Config (app.json)' },
  { re: /package\.json/,             label: 'Dependencias (package.json)' },
];

function featureFor(filePath) {
  const p = filePath.replace(/\\/g, '/');
  for (const { re, label } of FEATURE_MAP) {
    if (re.test(p)) return label;
  }
  return null;
}

// ── Collect edited files from transcript ─────────────────────────────────────
function filesFromTranscript(transcriptPath) {
  const files = new Set();
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return files;
  const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      const content = entry?.message?.content;
      if (!Array.isArray(content)) continue;
      for (const block of content) {
        if (block.type === 'tool_use' && (block.name === 'Edit' || block.name === 'Write')) {
          const fp = block.input?.file_path;
          if (fp) files.add(fp);
        }
      }
    } catch {}
  }
  return files;
}

// ── Collect edited files from git diff ───────────────────────────────────────
function filesFromGit() {
  const files = new Set();
  try {
    const out = execSync('git diff HEAD --name-only', { cwd: ROOT, encoding: 'utf8', stdio: ['pipe','pipe','pipe'] }).trim();
    if (out) out.split('\n').filter(Boolean).forEach(f => files.add(path.join(ROOT, f)));
  } catch {}
  return files;
}

// ── HTML changelog section ────────────────────────────────────────────────────
function entryHtml(e) {
  const d = new Date(e.date);
  const dateStr = d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  return `        <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 16px;border-bottom:1px solid var(--border);">
          <span style="font-size:10px;font-weight:600;color:var(--text3);white-space:nowrap;margin-top:2px;min-width:72px;line-height:1.5;">${dateStr}<br>${timeStr}</span>
          <div style="flex:1;">
            <div style="font-weight:600;color:var(--text);font-size:12.5px;">${e.features}</div>
            <div style="color:var(--text2);font-size:11.5px;margin-top:2px;">${e.files} archivo${e.files !== 1 ? 's' : ''} modificado${e.files !== 1 ? 's' : ''}</div>
          </div>
          <span style="margin-left:auto;flex-shrink:0;margin-top:2px;background:rgba(34,197,94,0.12);color:#22c55e;border:1px solid rgba(34,197,94,0.25);display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;">✓ Done</span>
        </div>`;
}

function updateDashboard(entries) {
  if (!fs.existsSync(DASHBOARD)) return;
  let html = fs.readFileSync(DASHBOARD, 'utf8');
  const S = '        <!-- ENTRIES_START -->';
  const E = '        <!-- ENTRIES_END -->';
  if (!html.includes(S) || !html.includes(E)) return;
  const before = html.substring(0, html.indexOf(S) + S.length);
  const after  = html.substring(html.indexOf(E));
  const inner  = entries.length ? '\n' + entries.map(entryHtml).join('\n') + '\n      ' : '';
  fs.writeFileSync(DASHBOARD, before + inner + after, 'utf8');
}

// ── CLAUDE.md ─────────────────────────────────────────────────────────────────
function updateClaudeMd(entry) {
  if (!fs.existsSync(CLAUDE_MD)) return;
  let md = fs.readFileSync(CLAUDE_MD, 'utf8');
  const SECTION = '## Recent Changes';
  const d = new Date(entry.date);
  const stamp = `${d.toLocaleDateString('es-AR')} ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
  const line = `- **${stamp}** — ${entry.features} (${entry.files} archivos)`;

  if (md.includes(SECTION)) {
    md = md.replace(SECTION + '\n', SECTION + '\n' + line + '\n');
  } else {
    md = md.trimEnd() + '\n\n' + SECTION + '\n' + line + '\n';
  }

  // Keep only last 20 bullet lines in the section
  const lines = md.split('\n');
  const idx = lines.findIndex(l => l === SECTION);
  if (idx !== -1) {
    let end = idx + 1;
    while (end < lines.length && (lines[end].startsWith('- ') || lines[end] === '')) end++;
    const bullets = lines.slice(idx + 1, end).filter(l => l.startsWith('- ')).slice(0, 20);
    lines.splice(idx + 1, end - idx - 1, ...bullets);
    md = lines.join('\n');
  }
  fs.writeFileSync(CLAUDE_MD, md, 'utf8');
}

// ── Main ─────────────────────────────────────────────────────────────────────
let raw = '';
process.stdin.on('data', d => raw += d);
process.stdin.on('end', () => {
  let input = {};
  try { input = JSON.parse(raw || '{}'); } catch {}

  let edited = filesFromTranscript(input.transcript_path);
  if (!edited.size) edited = filesFromGit();
  if (!edited.size) process.exit(0);

  const features = new Set();
  for (const fp of edited) {
    const label = featureFor(fp);
    if (label) features.add(label);
  }
  if (!features.size) process.exit(0);

  const entry = {
    date:     new Date().toISOString(),
    features: [...features].join(', '),
    files:    edited.size,
  };

  // Load + update sidecar DB
  let db = [];
  try { db = JSON.parse(fs.readFileSync(CHANGELOG_DB, 'utf8')); } catch {}
  db.unshift(entry);
  db = db.slice(0, 30);
  fs.writeFileSync(CHANGELOG_DB, JSON.stringify(db, null, 2), 'utf8');

  // Update outputs
  updateDashboard(db);
  updateClaudeMd(entry);

  process.exit(0);
});
