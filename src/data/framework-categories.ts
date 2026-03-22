import { mentors, categoryLabels, categoryColors, type Category } from './mentors';

export interface FrameworkCategory {
  id: Category;
  label: string;
  color: string;
  count: number;
  examples: string[];
}

function buildFrameworkCategories(): FrameworkCategory[] {
  const categoryMap = new Map<Category, { count: number; names: string[] }>();

  for (const mentor of mentors) {
    for (const principle of mentor.principles) {
      const primary = principle.categories[0];
      if (!primary) continue;

      if (!categoryMap.has(primary)) {
        categoryMap.set(primary, { count: 0, names: [] });
      }
      const entry = categoryMap.get(primary)!;
      entry.count++;
      if (entry.names.length < 3) {
        entry.names.push(principle.name);
      }
    }
  }

  const order: Category[] = ['decisions', 'thinking', 'action', 'relationships', 'energy', 'perspective'];

  return order
    .filter(id => categoryMap.has(id))
    .map(id => ({
      id,
      label: categoryLabels[id],
      color: categoryColors[id],
      count: categoryMap.get(id)!.count,
      examples: categoryMap.get(id)!.names,
    }));
}

export const frameworkCategories = buildFrameworkCategories();
