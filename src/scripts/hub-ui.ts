import {
  getTimelineEntries,
  getVaultEntries,
  getAllVaultTags,
  getTodayFood,
  getTodayWorkouts,
  getDailyGoals,
  sumMacros,
  type TimelineEntry,
  type VaultEntry,
  type FoodEntry,
  type WorkoutEntry,
  type Macros,
  type DailyGoals,
} from './hub-store';
import { toneToColor, energyLabel } from './journal-store';

// ─── State ──────────────────────────────────────────────────────────────────

let timelinePage = 0;
let timelineLoaded = false;
let vaultLoaded = false;
let healthLoaded = false;
let activeVaultTag: string | null = null;
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

// ─── Init ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  setupHubTabs();
});

function setupHubTabs(): void {
  // Listen for tab switches to lazy-load data
  document.querySelectorAll<HTMLButtonElement>('.journal-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const view = tab.dataset.view;
      if (view === 'saude' && !healthLoaded) {
        loadHealth();
      }
      if (view === 'timeline' && !timelineLoaded) {
        loadTimeline();
      }
      if (view === 'vault' && !vaultLoaded) {
        loadVault();
      }
    });
  });

  // Load more button
  document.getElementById('btn-load-more')?.addEventListener('click', loadMoreTimeline);

  // Vault search
  const searchInput = document.getElementById('vault-search') as HTMLInputElement | null;
  searchInput?.addEventListener('input', () => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => renderVaultEntries(), 300);
  });
}

// ─── Health ─────────────────────────────────────────────────────────────────

async function loadHealth(): Promise<void> {
  healthLoaded = true;

  const [foods, workouts, goals] = await Promise.all([
    getTodayFood(),
    getTodayWorkouts(),
    getDailyGoals(),
  ]);

  const emptyEl = document.getElementById('health-empty')!;

  if (foods.length === 0 && workouts.length === 0) {
    emptyEl.style.display = 'block';
    document.getElementById('health-macros-card')!.style.display = 'none';
    document.querySelectorAll('.health-section').forEach(s => (s as HTMLElement).style.display = 'none');
    return;
  }

  emptyEl.style.display = 'none';

  // Render macro bars
  if (foods.length > 0) {
    const totals = sumMacros(foods);
    renderMacroBars(totals, goals);
  } else {
    document.getElementById('health-macros-card')!.style.display = 'none';
  }

  // Render meals
  const mealsContainer = document.getElementById('health-meals')!;
  if (foods.length > 0) {
    mealsContainer.innerHTML = foods.map(renderMealCard).join('');
  } else {
    mealsContainer.innerHTML = '<p class="health-empty-section">no meals logged yet</p>';
  }

  // Render workouts
  const workoutsContainer = document.getElementById('health-workouts')!;
  if (workouts.length > 0) {
    workoutsContainer.innerHTML = workouts.map(renderWorkoutCard).join('');
  } else {
    workoutsContainer.innerHTML = '<p class="health-empty-section">no workouts logged yet</p>';
  }
}

function renderMacroBars(totals: Macros, goals: DailyGoals | null): void {
  const barsContainer = document.getElementById('macro-bars')!;

  const macros = [
    { label: 'kcal', current: totals.kcal, goal: goals?.kcal ?? null, unit: '', color: 'var(--accent)' },
    { label: 'protein', current: totals.protein_g, goal: goals?.protein_g ?? null, unit: 'g', color: '#4aad6a' },
    { label: 'carbs', current: totals.carbs_g, goal: goals?.carbs_g ?? null, unit: 'g', color: '#ada45a' },
    { label: 'fat', current: totals.fat_g, goal: goals?.fat_g ?? null, unit: 'g', color: '#c27a5a' },
  ];

  barsContainer.innerHTML = macros.map(m => {
    const pct = m.goal ? Math.min((m.current / m.goal) * 100, 100) : 0;
    const over = m.goal ? m.current > m.goal : false;
    const goalText = m.goal ? ` / ${Math.round(m.goal)}${m.unit}` : '';

    return `<div class="macro-bar-row">
      <div class="macro-bar-label">
        <span class="macro-bar-name">${m.label}</span>
        <span class="macro-bar-value ${over ? 'over' : ''}">${Math.round(m.current)}${m.unit}${goalText}</span>
      </div>
      <div class="macro-bar-track">
        <div class="macro-bar-fill ${over ? 'over' : ''}" style="width:${pct}%;background:${m.color}"></div>
      </div>
    </div>`;
  }).join('');
}

function renderMealCard(entry: FoodEntry): string {
  const time = new Date(entry.logged_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const desc = entry.user_corrected && entry.corrected_description
    ? entry.corrected_description
    : entry.ai_description ?? '';
  const macros = entry.user_corrected && entry.corrected_macros
    ? entry.corrected_macros
    : entry.ai_macros;

  let macroText = '';
  if (macros) {
    macroText = `${macros.kcal} kcal · ${macros.protein_g}g P · ${macros.carbs_g}g C · ${macros.fat_g}g F`;
  }

  return `<div class="health-meal-card">
    <div class="tl-header">
      <span class="tl-icon">🍽</span>
      <span class="tl-type">${entry.meal_type}</span>
      <span class="tl-date">${time}</span>
    </div>
    <p class="tl-body">${esc(desc)}</p>
    ${macroText ? `<div class="tl-badges"><span class="tl-badge tl-badge-macros">${macroText}</span></div>` : ''}
  </div>`;
}

function renderWorkoutCard(entry: WorkoutEntry): string {
  const time = new Date(entry.logged_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const desc = entry.ai_summary || entry.raw_notes;

  let badges = '';
  if (entry.ai_category) {
    badges += `<span class="tl-badge tl-badge-energy">${esc(entry.ai_category)}</span>`;
  }
  if (entry.ai_intensity) {
    badges += `<span class="tl-badge tl-badge-macros">${entry.ai_intensity}</span>`;
  }
  if (entry.ai_duration_min) {
    badges += `<span class="tl-badge">${entry.ai_duration_min} min</span>`;
  }
  if (entry.ai_muscle_groups && entry.ai_muscle_groups.length > 0) {
    badges += entry.ai_muscle_groups.map(g => `<span class="tl-theme">${esc(g)}</span>`).join('');
  }

  return `<div class="health-workout-card">
    <div class="tl-header">
      <span class="tl-icon">💪</span>
      <span class="tl-type">workout</span>
      <span class="tl-date">${time}</span>
    </div>
    <p class="tl-body">${esc(desc)}</p>
    ${badges ? `<div class="tl-badges">${badges}</div>` : ''}
  </div>`;
}

// ─── Timeline ───────────────────────────────────────────────────────────────

async function loadTimeline(): Promise<void> {
  timelineLoaded = true;
  timelinePage = 0;

  const loading = document.getElementById('timeline-loading')!;
  loading.style.display = 'block';

  const { entries, hasMore } = await getTimelineEntries(0);

  loading.style.display = 'none';

  const container = document.getElementById('timeline-entries')!;
  const emptyEl = document.getElementById('timeline-empty')!;
  const loadMoreBtn = document.getElementById('btn-load-more')!;

  if (entries.length === 0) {
    emptyEl.style.display = 'block';
    return;
  }

  container.innerHTML = entries.map(renderTimelineCard).join('');
  setupExpandButtons(container);
  loadMoreBtn.style.display = hasMore ? 'block' : 'none';
}

async function loadMoreTimeline(): Promise<void> {
  timelinePage++;
  const loadMoreBtn = document.getElementById('btn-load-more')!;
  loadMoreBtn.textContent = '...';

  const { entries, hasMore } = await getTimelineEntries(timelinePage);

  const container = document.getElementById('timeline-entries')!;
  const fragment = document.createElement('div');
  fragment.innerHTML = entries.map(renderTimelineCard).join('');
  setupExpandButtons(fragment);

  while (fragment.firstChild) {
    container.appendChild(fragment.firstChild);
  }

  loadMoreBtn.textContent = 'load more';
  loadMoreBtn.style.display = hasMore ? 'block' : 'none';
}

function renderTimelineCard(entry: TimelineEntry): string {
  const date = formatDate(entry.date);
  const icon = typeIcon(entry.type);
  const typeLabel = entry.type === 'food' && entry.meal_type
    ? entry.meal_type
    : entry.type;

  let body = '';
  let badges = '';

  if (entry.type === 'journal') {
    body = truncate(entry.text ?? '', 300);
    if (entry.tone) {
      const tc = toneToColor(entry.tone);
      badges += `<span class="tl-badge" style="background:${tc}18;color:${tc};border-color:${tc}40">${entry.tone_emoji || ''} ${entry.tone}</span>`;
    }
    if (entry.energy_level !== null && entry.energy_level !== undefined) {
      const label = energyLabel(entry.energy_level);
      badges += `<span class="tl-badge tl-badge-energy">${label}</span>`;
    }
    if (entry.themes && entry.themes.length > 0) {
      badges += entry.themes.map(t => `<span class="tl-theme">${esc(t)}</span>`).join('');
    }
  } else if (entry.type === 'food') {
    body = entry.ai_description ?? '';
    if (entry.ai_macros) {
      const m = entry.ai_macros;
      badges += `<span class="tl-badge tl-badge-macros">${m.kcal} kcal · ${m.protein_g}g P</span>`;
    }
  } else if (entry.type === 'vault') {
    const text = entry.ai_summary || entry.content || '';
    body = truncate(text, 200);
    if (entry.ai_category) {
      badges += `<span class="tl-badge tl-badge-category">${esc(entry.ai_category)}</span>`;
    }
    if (entry.tags && entry.tags.length > 0) {
      badges += entry.tags.map(t => `<span class="tl-theme">${esc(t)}</span>`).join('');
    }
  }

  const fullText = entry.type === 'journal' ? (entry.text ?? '') :
                   entry.type === 'vault' ? (entry.ai_summary || entry.content || '') : '';
  const needsExpand = fullText.length > (entry.type === 'journal' ? 300 : 200);

  return `<div class="tl-card" data-type="${entry.type}">
    <div class="tl-header">
      <span class="tl-icon">${icon}</span>
      <span class="tl-type">${typeLabel}</span>
      <span class="tl-date">${date}</span>
    </div>
    <p class="tl-body">${esc(body)}</p>
    ${needsExpand ? `<button class="tl-expand" data-full="${esc(fullText).replace(/"/g, '&quot;')}">show more</button>` : ''}
    ${badges ? `<div class="tl-badges">${badges}</div>` : ''}
  </div>`;
}

function setupExpandButtons(container: HTMLElement | DocumentFragment): void {
  container.querySelectorAll<HTMLButtonElement>('.tl-expand').forEach(btn => {
    btn.addEventListener('click', () => {
      const full = btn.dataset.full ?? '';
      const bodyEl = btn.previousElementSibling as HTMLElement;
      if (btn.textContent === 'show more') {
        bodyEl.textContent = full;
        btn.textContent = 'show less';
      } else {
        const limit = btn.closest('.tl-card')?.dataset.type === 'journal' ? 300 : 200;
        bodyEl.textContent = truncate(full, limit);
        btn.textContent = 'show more';
      }
    });
  });
}

// ─── Vault ──────────────────────────────────────────────────────────────────

async function loadVault(): Promise<void> {
  vaultLoaded = true;

  // Load tags
  const tags = await getAllVaultTags();
  const tagsContainer = document.getElementById('vault-tags')!;
  if (tags.length > 0) {
    tagsContainer.innerHTML = tags.map(t =>
      `<button class="vault-tag-chip" data-tag="${esc(t)}">${esc(t)}</button>`
    ).join('');

    tagsContainer.querySelectorAll<HTMLButtonElement>('.vault-tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const tag = chip.dataset.tag!;
        if (activeVaultTag === tag) {
          activeVaultTag = null;
          chip.classList.remove('active');
        } else {
          tagsContainer.querySelectorAll('.vault-tag-chip').forEach(c => c.classList.remove('active'));
          activeVaultTag = tag;
          chip.classList.add('active');
        }
        renderVaultEntries();
      });
    });
  }

  await renderVaultEntries();
}

async function renderVaultEntries(): Promise<void> {
  const searchInput = document.getElementById('vault-search') as HTMLInputElement | null;
  const search = searchInput?.value.trim() || undefined;

  const entries = await getVaultEntries(search, activeVaultTag ?? undefined);

  const container = document.getElementById('vault-entries')!;
  const emptyEl = document.getElementById('vault-empty')!;

  if (entries.length === 0) {
    container.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';
  container.innerHTML = entries.map(renderVaultCard).join('');
  setupVaultExpand(container);
}

function renderVaultCard(entry: VaultEntry): string {
  const date = formatDate(entry.created_at);
  const body = truncate(entry.content, 200);
  const needsExpand = entry.content.length > 200;

  let badges = '';
  if (entry.ai_category) {
    badges += `<span class="tl-badge tl-badge-category">${esc(entry.ai_category)}</span>`;
  }
  if (entry.tags.length > 0) {
    badges += entry.tags.map(t => `<span class="tl-theme">${esc(t)}</span>`).join('');
  }

  const sourceIcon = entry.input_type === 'voice' ? '🎤' :
                     entry.input_type === 'photo' ? '📷' : '';

  return `<div class="vault-card">
    <div class="tl-header">
      <span class="tl-date">${date}</span>
      ${sourceIcon ? `<span class="vault-source">${sourceIcon}</span>` : ''}
    </div>
    <p class="tl-body">${esc(body)}</p>
    ${needsExpand ? `<button class="tl-expand" data-full="${esc(entry.content).replace(/"/g, '&quot;')}">show more</button>` : ''}
    ${badges ? `<div class="tl-badges">${badges}</div>` : ''}
  </div>`;
}

function setupVaultExpand(container: HTMLElement): void {
  container.querySelectorAll<HTMLButtonElement>('.tl-expand').forEach(btn => {
    btn.addEventListener('click', () => {
      const full = btn.dataset.full ?? '';
      const bodyEl = btn.previousElementSibling as HTMLElement;
      if (btn.textContent === 'show more') {
        bodyEl.textContent = full;
        btn.textContent = 'show less';
      } else {
        bodyEl.textContent = truncate(full, 200);
        btn.textContent = 'show more';
      }
    });
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return `${diffDays} dias`;

  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '...';
}

function typeIcon(type: string): string {
  switch (type) {
    case 'journal': return '📓';
    case 'food': return '🍽';
    case 'vault': return '📦';
    default: return '●';
  }
}

function esc(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
