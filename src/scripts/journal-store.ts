import { supabase } from '../lib/supabase';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface JournalEntry {
  id?: string;
  user_id?: string;
  date: string;         // YYYY-MM-DD
  text: string;
  energy_level: number | null;
  tone: string | null;
  tone_emoji: string | null;
  themes: string[];
  celebrations: string[];
  ai_reflection: string | null;
  ai_suggestions: TrackerSuggestion[] | null;
  source: 'text' | 'voice' | 'mixed';
  created_at?: string;
  updated_at?: string;
}

export interface TrackerSuggestion {
  label: string;
  emoji: string;
  category: 'corpo' | 'mente' | 'relacoes' | 'alma';
  reason: string;
}

export interface EnergyTracker {
  id?: string;
  user_id?: string;
  label: string;
  emoji: string | null;
  category: string | null;
  is_preset: boolean;
  archived: boolean;
  created_at?: string;
}

export interface TrackerCheckin {
  id?: string;
  tracker_id: string;
  user_id?: string;
  date: string;
  done: boolean;
}

export interface CalendarDay {
  date: string;
  energy_level: number | null;
  tone: string | null;
  tone_emoji: string | null;
}

// ─── Auth helper ────────────────────────────────────────────────────────────

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// ─── Journal Entries ────────────────────────────────────────────────────────

export async function saveEntry(entry: Omit<JournalEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<JournalEntry | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('journal_entries')
    .upsert(
      { ...entry, user_id: userId, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error saving journal entry:', error);
    return null;
  }
  return data;
}

export async function getEntry(date: string): Promise<JournalEntry | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single();

  return data;
}

export async function getEntries(startDate: string, endDate: string): Promise<JournalEntry[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const { data } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  return data ?? [];
}

export async function getCalendarData(year: number, month: number): Promise<CalendarDay[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  const userId = await getUserId();
  if (!userId) return [];

  const { data } = await supabase
    .from('journal_entries')
    .select('date, energy_level, tone, tone_emoji')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date');

  return (data ?? []) as CalendarDay[];
}

export async function getRecentTones(days: number = 7): Promise<string[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const endDate = new Date().toISOString().split('T')[0];
  const start = new Date();
  start.setDate(start.getDate() - days);
  const startDate = start.toISOString().split('T')[0];

  const { data } = await supabase
    .from('journal_entries')
    .select('tone')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  return (data ?? []).map(e => e.tone).filter(Boolean) as string[];
}

// ─── Energy Trackers ────────────────────────────────────────────────────────

export async function getTrackers(): Promise<EnergyTracker[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const { data } = await supabase
    .from('energy_trackers')
    .select('*')
    .eq('user_id', userId)
    .eq('archived', false)
    .order('created_at');

  return data ?? [];
}

export async function createTracker(tracker: Pick<EnergyTracker, 'label' | 'emoji' | 'category' | 'is_preset'>): Promise<EnergyTracker | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('energy_trackers')
    .insert({ ...tracker, user_id: userId })
    .select()
    .single();

  if (error) {
    console.error('Error creating tracker:', error);
    return null;
  }
  return data;
}

export async function archiveTracker(trackerId: string): Promise<boolean> {
  const { error } = await supabase
    .from('energy_trackers')
    .update({ archived: true })
    .eq('id', trackerId);

  return !error;
}

// ─── Tracker Check-ins ──────────────────────────────────────────────────────

export async function checkIn(trackerId: string, date: string, done: boolean): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  const { error } = await supabase
    .from('tracker_checkins')
    .upsert(
      { tracker_id: trackerId, user_id: userId, date, done },
      { onConflict: 'tracker_id,date' }
    );

  return !error;
}

export async function getCheckinsForDate(date: string): Promise<Record<string, boolean>> {
  const userId = await getUserId();
  if (!userId) return {};

  const { data } = await supabase
    .from('tracker_checkins')
    .select('tracker_id, done')
    .eq('user_id', userId)
    .eq('date', date);

  const result: Record<string, boolean> = {};
  for (const row of data ?? []) {
    result[row.tracker_id] = row.done;
  }
  return result;
}

export async function getStreaks(trackerId: string): Promise<{ current: number; best: number }> {
  const userId = await getUserId();
  if (!userId) return { current: 0, best: 0 };

  const { data } = await supabase
    .from('tracker_checkins')
    .select('date, done')
    .eq('user_id', userId)
    .eq('tracker_id', trackerId)
    .eq('done', true)
    .order('date', { ascending: false });

  if (!data || data.length === 0) return { current: 0, best: 0 };

  let current = 0;
  let best = 0;
  let streak = 0;
  let prevDate: Date | null = null;

  // Walk backwards through dates
  const today = new Date().toISOString().split('T')[0];

  for (const row of data) {
    const d = new Date(row.date + 'T12:00:00');

    if (prevDate === null) {
      // First entry — only count toward current streak if it's today or yesterday
      const diffFromToday = Math.floor((new Date(today + 'T12:00:00').getTime() - d.getTime()) / 86400000);
      if (diffFromToday <= 1) {
        streak = 1;
        current = 1;
      } else {
        streak = 1;
      }
    } else {
      const diff = Math.floor((prevDate.getTime() - d.getTime()) / 86400000);
      if (diff === 1) {
        streak++;
        if (current > 0) current = streak; // still building current
      } else {
        best = Math.max(best, streak);
        streak = 1;
        current = current > 0 ? current : 0; // current streak broken
      }
    }

    prevDate = d;
  }

  best = Math.max(best, streak);
  return { current, best };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function todayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Tone → Color mapping (Unfold palette) ─────────────────────────────────
// 16 tons fundamentados no Circumplex Model de Russell, Budismo, e mentores do Unfold
// Cores: decisions=#4a7aad  thinking=#8b6aad  action=#4aad6a
//        relationships=#c27a5a  energy=#2B4A3E  perspective=#ada45a

const toneColorMap: Record<string, string> = {
  // ── High energy + Positive ──
  fire:          '#c27a5a',   // terracotta — creative impulse, motivation (Huberman/dopamine, Ferriss)
  encantamento:  '#8b6aad',   // purple — surprised wonder (Shukman/ordinary awakening, mudita)
  joy:           '#ada45a',   // gold — laughter, lightness, celebration (mudita, Sivers/hell yes)

  // ── Low energy + Positive ──
  serenity:      '#4a7aad',   // blue — deep calm, effortless peace (upekkha, Tift/already whole)
  gratitude:     '#4aad6a',   // green — gentle recognition of what is (Fredrickson, Shukman)
  acolhimento:   '#2B4A3E',   // deep green — tenderness, care, connection (metta + karuna, Tift)

  // ── Low energy + Difficult ──
  heaviness:     '#2B4A3E',   // deep green — deep fatigue, the lived asking for rest (dukkha)
  melancholy:    '#4a7aad',   // blue — soft sadness, longing, beauty of what passed (anicca, Harris)
  fog:           '#8b6aad',   // purple — confusion, disconnection, GPS without signal (avidya, Tift/unlived life)

  // ── High energy + Difficult ──
  inquietacao:   '#c27a5a',   // terracotta — directionless energy, anxiety (5th hindrance, Huberman/cortisol)
  revolt:        '#c27a5a',   // terracotta — anger, indignation, fire that wants change (dvesha)
  aperto:        '#2B4A3E',   // deep green — fear, contraction, body in protection (bhaya, Tift)

  // ── Transition / Meta-states ──
  travessia:     '#ada45a',   // gold — between states, discomfort of growth (Tift/dev vs fruit, bardo)
  presence:      '#4a7aad',   // blue — here and now, mindful attention (sati, Harris, Shukman)
  determination: '#4aad6a',   // green — clarity of purpose, alignment (virya, Ferriss/80-20, Sivers)
  entrega:       '#8b6aad',   // purple — letting go of control, accepting what is (upekkha, Shukman)
};

// Fallback
const defaultToneColor = '#e8e8e2';

export function toneToColor(tone: string | null): string {
  if (!tone) return defaultToneColor;
  return toneColorMap[tone.toLowerCase()] ?? defaultToneColor;
}

export function energyToColor(energy: number | null): string {
  if (energy === null) return '#e8e8e2';
  // Map energy to opacity/saturation of the accent green
  // -1 → very muted, +1 → fully saturated accent
  const t = (energy + 1) / 2; // 0-1
  // Blend from muted grey (#d0cec8) to accent green (#2B4A3E)
  const r = Math.round(208 - t * (208 - 43));
  const g = Math.round(206 - t * (206 - 74));
  const b = Math.round(200 - t * (200 - 62));
  return `rgb(${r}, ${g}, ${b})`;
}

export function energyLabel(energy: number | null): string {
  if (energy === null) return '';
  if (energy >= 0.6) return 'vibrant';
  if (energy >= 0.2) return 'good';
  if (energy >= -0.2) return 'neutral';
  if (energy >= -0.6) return 'low';
  return 'drained';
}

export const allToneColors = toneColorMap;
