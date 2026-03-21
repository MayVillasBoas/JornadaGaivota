import {
  saveEntry,
  getEntry,
  getTrackers,
  createTracker,
  checkIn,
  getCheckinsForDate,
  getCalendarData,
  getRecentTones,
  todayDate,
  toneToColor,
  energyToColor,
  energyLabel,
  allToneColors,
  type EnergyTracker,
  type TrackerSuggestion,
} from './journal-store';

// ─── State ──────────────────────────────────────────────────────────────────

let trackers: EnergyTracker[] = [];
let todayCheckins: Record<string, boolean> = {};
let currentSuggestion: TrackerSuggestion | null = null;
let calendarMonth: number;
let calendarYear: number;

// ─── Init ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  const now = new Date();
  calendarMonth = now.getMonth() + 1;
  calendarYear = now.getFullYear();

  setupTabs();
  await loadTrackers();
  await loadTodayEntry();
  setupCheckin();
  setupAddTracker();
  setupCalendar();
});

// ─── Tab Switching ──────────────────────────────────────────────────────────

function setupTabs(): void {
  const tabs = document.querySelectorAll<HTMLButtonElement>('.journal-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const viewId = `view-${tab.dataset.view}`;
      document.querySelectorAll('.journal-view').forEach(v => v.classList.remove('active'));
      document.getElementById(viewId)?.classList.add('active');

      if (tab.dataset.view === 'calendario') {
        renderCalendar();
      }
    });
  });
}

// ─── Trackers ───────────────────────────────────────────────────────────────

async function loadTrackers(): Promise<void> {
  trackers = await getTrackers();
  const today = todayDate();
  todayCheckins = await getCheckinsForDate(today);
  renderTrackers();
}

function renderTrackers(): void {
  const container = document.getElementById('tracker-chips');
  if (!container) return;

  if (trackers.length === 0) {
    container.innerHTML = '<span style="font-size:0.8rem;color:var(--ink-muted);font-style:italic">no trackers yet — click + to add</span>';
    return;
  }

  container.innerHTML = trackers.map(t => {
    const isChecked = todayCheckins[t.id!] === true;
    return `<div class="tracker-chip ${isChecked ? 'checked' : ''}" data-tracker-id="${t.id}">
      <span class="chip-check">${isChecked ? '✓' : ''}</span>
      <span class="chip-emoji">${t.emoji || '●'}</span>
      <span>${t.label}</span>
    </div>`;
  }).join('');

  // Click handlers
  container.querySelectorAll<HTMLElement>('.tracker-chip').forEach(chip => {
    chip.addEventListener('click', async () => {
      const trackerId = chip.dataset.trackerId!;
      const isNowChecked = !chip.classList.contains('checked');

      chip.classList.toggle('checked');
      const checkEl = chip.querySelector('.chip-check')!;
      checkEl.textContent = isNowChecked ? '✓' : '';

      todayCheckins[trackerId] = isNowChecked;
      await checkIn(trackerId, todayDate(), isNowChecked);
    });
  });
}

// ─── Add Tracker ────────────────────────────────────────────────────────────

function setupAddTracker(): void {
  const addBtn = document.getElementById('add-tracker-btn');
  const form = document.getElementById('add-tracker-form') as HTMLElement;
  const saveBtn = document.getElementById('btn-save-tracker');

  addBtn?.addEventListener('click', () => {
    form.style.display = form.style.display === 'none' ? 'flex' : 'none';
  });

  saveBtn?.addEventListener('click', async () => {
    const label = (document.getElementById('new-tracker-label') as HTMLInputElement).value.trim();
    const emoji = (document.getElementById('new-tracker-emoji') as HTMLInputElement).value.trim();
    const category = (document.getElementById('new-tracker-category') as HTMLSelectElement).value;

    if (!label) return;

    await createTracker({ label, emoji: emoji || null, category, is_preset: true });
    (document.getElementById('new-tracker-label') as HTMLInputElement).value = '';
    (document.getElementById('new-tracker-emoji') as HTMLInputElement).value = '';
    form.style.display = 'none';
    await loadTrackers();
  });
}

// ─── Load Today's Entry ─────────────────────────────────────────────────────

async function loadTodayEntry(): Promise<void> {
  const today = todayDate();
  const entry = await getEntry(today);

  if (entry && entry.text) {
    const existingEl = document.getElementById('existing-entry')!;
    const existingText = document.getElementById('existing-text')!;
    const existingMeta = document.getElementById('existing-meta')!;

    existingText.textContent = entry.text;

    let meta = '';
    if (entry.tone_emoji && entry.tone) {
      const toneColor = toneToColor(entry.tone);
      meta += `<span class="tone-badge" style="background:${toneColor}18;color:${toneColor};border:1px solid ${toneColor}40">${entry.tone_emoji} ${entry.tone}</span>`;
    }
    if (entry.energy_level !== null) {
      const eLabel = energyLabel(entry.energy_level);
      const eColor = energyToColor(entry.energy_level);
      meta += `<span class="energy-badge" style="color:${eColor};border-color:${eColor}">⚡ ${eLabel}</span>`;
    }
    if (entry.themes && entry.themes.length > 0) {
      meta += entry.themes.map(t => `<span class="theme-pill" style="padding:0.2rem 0.6rem;border-radius:12px;background:rgba(0,0,0,0.04);font-size:0.7rem;color:var(--ink-muted)">${t}</span>`).join('');
    }
    existingMeta.innerHTML = meta;
    existingEl.style.display = 'block';

    // Pre-fill textarea with existing text for appending
    const textarea = document.getElementById('journal-text') as HTMLTextAreaElement;
    textarea.placeholder = 'add to today\'s entry...';
  }
}

// ─── Check-in Save ──────────────────────────────────────────────────────────

function setupCheckin(): void {
  const btn = document.getElementById('btn-checkin') as HTMLButtonElement;
  const textarea = document.getElementById('journal-text') as HTMLTextAreaElement;
  const loading = document.getElementById('checkin-loading')!;
  const reflectionEl = document.getElementById('ai-reflection')!;

  btn.addEventListener('click', async () => {
    const text = textarea.value.trim();
    if (!text) return;

    btn.disabled = true;
    loading.style.display = 'block';
    reflectionEl.style.display = 'none';

    const today = todayDate();

    // Check if there's an existing entry to append to
    const existing = await getEntry(today);
    const fullText = existing?.text ? existing.text + '\n\n---\n\n' + text : text;

    // Get context for AI
    const recentTones = await getRecentTones(7);
    const trackerLabels = trackers.map(t => t.label);

    // Call AI endpoint
    let aiResult: any = null;
    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fullText,
          date: today,
          existingTrackers: trackerLabels,
          recentTones,
        }),
      });
      aiResult = await response.json();
    } catch {
      aiResult = { fallback: true };
    }

    // Save entry
    const source: 'text' | 'voice' | 'mixed' = textarea.classList.contains('voice-used') ? 'voice' : 'text';
    await saveEntry({
      date: today,
      text: fullText,
      energy_level: aiResult.energy_level ?? null,
      tone: aiResult.tone ?? null,
      tone_emoji: aiResult.tone_emoji ?? null,
      themes: aiResult.themes ?? [],
      celebrations: aiResult.celebrations ?? [],
      ai_reflection: aiResult.ai_reflection ?? null,
      ai_suggestions: aiResult.tracker_suggestions ?? null,
      source,
    });

    loading.style.display = 'none';
    textarea.value = '';

    // Show AI reflection
    if (!aiResult.fallback && aiResult.ai_reflection) {
      showReflection(aiResult);
    }

    // Refresh today's entry display
    await loadTodayEntry();

    btn.disabled = false;
  });
}

// ─── Display AI Reflection ──────────────────────────────────────────────────

function showReflection(result: any): void {
  const reflectionEl = document.getElementById('ai-reflection')!;
  reflectionEl.style.display = 'block';

  // Reflection text
  document.getElementById('reflection-text')!.textContent = result.ai_reflection;

  // Celebrations
  if (result.celebrations && result.celebrations.length > 0) {
    const celebEl = document.getElementById('celebrations')!;
    const listEl = document.getElementById('celebration-list')!;
    listEl.innerHTML = result.celebrations.map((c: string) => `<li>✨ ${escHtml(c)}</li>`).join('');
    celebEl.style.display = 'block';
  }

  // Energy + Tone summary
  if (result.energy_level !== null || result.tone) {
    const summaryEl = document.getElementById('energy-summary')!;

    let html = '';
    if (result.tone) {
      const toneColor = toneToColor(result.tone);
      html += `<span class="tone-badge" style="background:${toneColor}18;color:${toneColor};border:1px solid ${toneColor}40">${result.tone_emoji || ''} ${result.tone}</span>`;
    }
    if (result.energy_level !== null) {
      const eLabel = energyLabel(result.energy_level);
      const eColor = energyToColor(result.energy_level);
      html += `<span class="energy-badge" style="color:${eColor};border-color:${eColor}">⚡ ${eLabel}</span>`;
    }

    document.getElementById('energy-badge')!.innerHTML = '';
    document.getElementById('tone-badge')!.innerHTML = '';
    summaryEl.innerHTML = html;

    if (result.themes && result.themes.length > 0) {
      summaryEl.innerHTML += `<div class="themes-pills">${result.themes.map((t: string) => `<span class="theme-pill">${escHtml(t)}</span>`).join('')}</div>`;
    }

    summaryEl.style.display = 'flex';
  }

  // Tracker suggestion
  if (result.tracker_suggestions && result.tracker_suggestions.length > 0) {
    currentSuggestion = result.tracker_suggestions[0];
    const suggEl = document.getElementById('tracker-suggestion')!;
    document.getElementById('suggestion-text')!.textContent =
      `"${currentSuggestion!.label}" ${currentSuggestion!.emoji} — ${currentSuggestion!.reason}`;
    suggEl.style.display = 'block';

    document.getElementById('btn-accept-suggestion')?.addEventListener('click', async () => {
      if (!currentSuggestion) return;
      await createTracker({
        label: currentSuggestion.label,
        emoji: currentSuggestion.emoji,
        category: currentSuggestion.category,
        is_preset: false,
      });
      suggEl.style.display = 'none';
      await loadTrackers();
    });

    document.getElementById('btn-dismiss-suggestion')?.addEventListener('click', () => {
      suggEl.style.display = 'none';
      currentSuggestion = null;
    });
  }
}

// ─── Calendar ───────────────────────────────────────────────────────────────

function setupCalendar(): void {
  document.getElementById('cal-prev')?.addEventListener('click', () => {
    calendarMonth--;
    if (calendarMonth < 1) { calendarMonth = 12; calendarYear--; }
    renderCalendar();
  });

  document.getElementById('cal-next')?.addEventListener('click', () => {
    calendarMonth++;
    if (calendarMonth > 12) { calendarMonth = 1; calendarYear++; }
    renderCalendar();
  });

  document.getElementById('day-detail-close')?.addEventListener('click', () => {
    document.getElementById('day-detail')!.style.display = 'none';
  });
}

async function renderCalendar(): Promise<void> {
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];

  document.getElementById('cal-month-label')!.textContent =
    `${monthNames[calendarMonth - 1]} ${calendarYear}`;

  const grid = document.getElementById('calendar-grid')!;

  // Remove existing day cells (keep headers)
  grid.querySelectorAll('.cal-day').forEach(el => el.remove());

  // Get data
  const calData = await getCalendarData(calendarYear, calendarMonth);
  const dataMap = new Map(calData.map(d => [d.date, d]));

  // Calculate first day offset (Monday = 0)
  const firstDay = new Date(calendarYear, calendarMonth - 1, 1);
  let offset = firstDay.getDay() - 1; // Monday-based
  if (offset < 0) offset = 6;

  const daysInMonth = new Date(calendarYear, calendarMonth, 0).getDate();
  const today = todayDate();

  // Empty cells for offset
  for (let i = 0; i < offset; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    grid.appendChild(empty);
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const entry = dataMap.get(dateStr);

    const cell = document.createElement('div');
    cell.className = 'cal-day';
    if (dateStr === today) cell.classList.add('today');

    if (entry && entry.tone) {
      cell.classList.add('has-entry');
      cell.style.backgroundColor = toneToColor(entry.tone);
      cell.innerHTML = `<span class="day-num">${day}</span><span class="day-emoji">${entry.tone_emoji || ''}</span>`;
    } else if (entry && entry.energy_level !== null) {
      cell.classList.add('has-entry');
      cell.style.backgroundColor = energyToColor(entry.energy_level);
      cell.innerHTML = `<span class="day-num">${day}</span>`;
    } else {
      cell.innerHTML = `<span class="day-num">${day}</span>`;
    }

    cell.addEventListener('click', () => showDayDetail(dateStr));
    grid.appendChild(cell);
  }
}

async function showDayDetail(date: string): Promise<void> {
  const entry = await getEntry(date);
  const detailEl = document.getElementById('day-detail')!;

  if (!entry) {
    detailEl.style.display = 'none';
    return;
  }

  // Format date
  const d = new Date(date + 'T12:00:00');
  const formatted = d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  document.getElementById('day-detail-date')!.textContent = formatted;

  // Energy + tone
  let energyHtml = '';
  if (entry.tone_emoji && entry.tone) {
    const tc = toneToColor(entry.tone);
    energyHtml += `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:12px;background:${tc}18;color:${tc};font-size:0.8rem;border:1px solid ${tc}40">${entry.tone_emoji} ${entry.tone}</span>`;
  }
  if (entry.energy_level !== null) {
    const eLabel = energyLabel(entry.energy_level);
    const eColor = energyToColor(entry.energy_level);
    energyHtml += `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:12px;color:${eColor};font-size:0.8rem;border:1px solid ${eColor}">⚡ ${eLabel}</span>`;
  }
  document.getElementById('day-detail-energy')!.innerHTML = energyHtml;

  // Text
  const maxChars = 500;
  const text = entry.text.length > maxChars ? entry.text.slice(0, maxChars) + '...' : entry.text;
  document.getElementById('day-detail-text')!.textContent = text;

  // Trackers for that day
  const checkins = await getCheckinsForDate(date);
  const trackerHtml = trackers
    .map(t => {
      const done = checkins[t.id!] === true;
      return `<span class="tracker-chip ${done ? 'checked' : ''}" style="pointer-events:none;font-size:0.75rem">
        <span class="chip-emoji">${t.emoji || '●'}</span> ${t.label}
      </span>`;
    })
    .join('');
  document.getElementById('day-detail-trackers')!.innerHTML = trackerHtml;

  detailEl.style.display = 'block';
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function escHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
