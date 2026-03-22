import { supabase } from '../lib/supabase';

// ─── Types ──────────────────────────────────────────────────────────────────

export type TimelineEntryType = 'journal' | 'food' | 'vault';

export interface TimelineEntry {
  id: string;
  type: TimelineEntryType;
  date: string;          // ISO timestamp
  // Journal fields
  text?: string;
  tone?: string | null;
  tone_emoji?: string | null;
  energy_level?: number | null;
  themes?: string[];
  // Food fields
  ai_description?: string;
  ai_macros?: { kcal: number; protein_g: number; carbs_g: number; fat_g: number } | null;
  meal_type?: string;
  // Vault fields
  content?: string;
  ai_summary?: string | null;
  ai_category?: string | null;
  tags?: string[];
}

export interface VaultEntry {
  id: string;
  created_at: string;
  content: string;
  source_type: string;
  input_type: string;
  tags: string[];
  ai_summary: string | null;
  ai_category: string | null;
  metadata: Record<string, unknown>;
}

// ─── Auth helper ────────────────────────────────────────────────────────────

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// ─── Timeline ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export async function getTimelineEntries(
  page: number = 0,
  pageSize: number = PAGE_SIZE
): Promise<{ entries: TimelineEntry[]; hasMore: boolean }> {
  const userId = await getUserId();
  if (!userId) return { entries: [], hasMore: false };

  // Fetch from all 3 tables in parallel
  const from = page * pageSize;
  // Fetch extra to determine hasMore after merge
  const limit = pageSize + 1;

  const [journalRes, foodRes, vaultRes] = await Promise.all([
    supabase
      .from('journal_entries')
      .select('id, date, text, tone, tone_emoji, energy_level, themes')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .range(0, from + limit - 1),
    supabase
      .from('food_entries')
      .select('id, logged_at, ai_description, ai_macros, meal_type')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .range(0, from + limit - 1),
    supabase
      .from('vault_entries')
      .select('id, created_at, content, ai_summary, ai_category, tags')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(0, from + limit - 1),
  ]);

  // Map to unified timeline entries
  const journal: TimelineEntry[] = (journalRes.data ?? []).map(e => ({
    id: e.id,
    type: 'journal' as const,
    date: e.date + 'T12:00:00',
    text: e.text,
    tone: e.tone,
    tone_emoji: e.tone_emoji,
    energy_level: e.energy_level,
    themes: e.themes ?? [],
  }));

  const food: TimelineEntry[] = (foodRes.data ?? []).map(e => ({
    id: e.id,
    type: 'food' as const,
    date: e.logged_at,
    ai_description: e.ai_description,
    ai_macros: e.ai_macros,
    meal_type: e.meal_type,
  }));

  const vault: TimelineEntry[] = (vaultRes.data ?? []).map(e => ({
    id: e.id,
    type: 'vault' as const,
    date: e.created_at,
    content: e.content,
    ai_summary: e.ai_summary,
    ai_category: e.ai_category,
    tags: e.tags ?? [],
  }));

  // Merge and sort by date descending
  const all = [...journal, ...food, ...vault]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Paginate from the merged result
  const paged = all.slice(from, from + pageSize);
  const hasMore = all.length > from + pageSize;

  return { entries: paged, hasMore };
}

// ─── Vault ──────────────────────────────────────────────────────────────────

export async function getVaultEntries(
  search?: string,
  tag?: string
): Promise<VaultEntry[]> {
  const userId = await getUserId();
  if (!userId) return [];

  let query = supabase
    .from('vault_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (tag) {
    query = query.contains('tags', [tag]);
  }

  const { data } = await query;
  let entries = (data ?? []) as VaultEntry[];

  // Client-side text search
  if (search) {
    const term = search.toLowerCase();
    entries = entries.filter(e =>
      e.content.toLowerCase().includes(term) ||
      (e.ai_summary?.toLowerCase().includes(term))
    );
  }

  return entries;
}

// ─── Health (Food + Workouts) ───────────────────────────────────────────────

export interface Macros {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface FoodEntry {
  id: string;
  logged_at: string;
  meal_type: string;
  ai_description: string | null;
  ai_macros: Macros | null;
  corrected_description: string | null;
  corrected_macros: Macros | null;
  user_corrected: boolean;
}

export interface WorkoutEntry {
  id: string;
  logged_at: string;
  raw_notes: string;
  ai_summary: string | null;
  ai_category: string | null;
  ai_muscle_groups: string[] | null;
  ai_intensity: string | null;
  ai_duration_min: number | null;
}

export interface DailyGoals {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export async function getTodayFood(date?: string): Promise<FoodEntry[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const targetDate = date ?? new Date().toISOString().split('T')[0];
  const startOfDay = targetDate + 'T00:00:00';
  const endOfDay = targetDate + 'T23:59:59';

  const { data } = await supabase
    .from('food_entries')
    .select('id, logged_at, meal_type, ai_description, ai_macros, corrected_description, corrected_macros, user_corrected')
    .eq('user_id', userId)
    .gte('logged_at', startOfDay)
    .lte('logged_at', endOfDay)
    .order('logged_at', { ascending: true });

  return (data ?? []) as FoodEntry[];
}

export async function getTodayWorkouts(date?: string): Promise<WorkoutEntry[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const targetDate = date ?? new Date().toISOString().split('T')[0];
  const startOfDay = targetDate + 'T00:00:00';
  const endOfDay = targetDate + 'T23:59:59';

  const { data } = await supabase
    .from('workout_entries')
    .select('id, logged_at, raw_notes, ai_summary, ai_category, ai_muscle_groups, ai_intensity, ai_duration_min')
    .eq('user_id', userId)
    .gte('logged_at', startOfDay)
    .lte('logged_at', endOfDay)
    .order('logged_at', { ascending: true });

  return (data ?? []) as WorkoutEntry[];
}

export async function getDailyGoals(): Promise<DailyGoals | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data } = await supabase
    .from('profiles')
    .select('daily_goals')
    .eq('id', userId)
    .single();

  return (data?.daily_goals as DailyGoals) ?? null;
}

export function sumMacros(entries: FoodEntry[]): Macros {
  return entries.reduce((acc, e) => {
    const m = e.user_corrected && e.corrected_macros ? e.corrected_macros : e.ai_macros;
    if (!m) return acc;
    return {
      kcal: acc.kcal + (m.kcal || 0),
      protein_g: acc.protein_g + (m.protein_g || 0),
      carbs_g: acc.carbs_g + (m.carbs_g || 0),
      fat_g: acc.fat_g + (m.fat_g || 0),
    };
  }, { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
}

export async function getAllVaultTags(): Promise<string[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const { data } = await supabase
    .from('vault_entries')
    .select('tags')
    .eq('user_id', userId);

  const tagSet = new Set<string>();
  for (const row of data ?? []) {
    for (const t of row.tags ?? []) {
      tagSet.add(t);
    }
  }
  return Array.from(tagSet).sort();
}
