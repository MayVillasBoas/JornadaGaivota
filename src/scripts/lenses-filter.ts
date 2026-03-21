// src/scripts/lenses-filter.ts
// Filter, search, and expand logic for the Lenses section

const categoryLabelMap: Record<string, string> = {
  decisions: 'Decisões',
  thinking: 'Pensamento',
  action: 'Ação',
  relationships: 'Relações',
  energy: 'Energia',
  perspective: 'Perspectiva',
};

function initLensesFilter() {
  const pills = document.querySelectorAll<HTMLButtonElement>('.lenses-section .pill');
  const searchInput = document.getElementById('lenses-search') as HTMLInputElement | null;
  const countEl = document.getElementById('lenses-count');
  const grid = document.getElementById('lenses-grid');
  if (!grid || !countEl || !searchInput) return;

  const cards = grid.querySelectorAll<HTMLElement>('.card');

  let activeCategory = 'all';
  let searchTerm = '';

  // ---- Pill click ----
  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const cat = pill.dataset.category ?? 'all';

      // Update active state
      pills.forEach((p) => {
        p.classList.remove('active');
        p.style.background = '';
        p.style.color = '';
        p.style.borderColor = '';
      });

      pill.classList.add('active');
      if (cat === 'all') {
        pill.style.background = 'var(--ink)';
        pill.style.color = '#fff';
        pill.style.borderColor = 'var(--ink)';
      } else {
        const color = pill.dataset.color ?? '';
        pill.style.background = color;
        pill.style.color = '#fff';
        pill.style.borderColor = color;
      }

      activeCategory = cat;
      applyFilters();
    });
  });

  // ---- Search input ----
  searchInput.addEventListener('input', () => {
    searchTerm = searchInput.value.trim().toLowerCase();
    applyFilters();
  });

  // ---- Card expand / collapse ----
  cards.forEach((card) => {
    card.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // If clicking the mentor link, let it navigate
      if (target.closest('a')) return;

      // If clicking close button, collapse
      if (target.closest('.close-btn')) {
        card.classList.remove('expanded');
        return;
      }

      // If already expanded, collapse
      if (card.classList.contains('expanded')) {
        card.classList.remove('expanded');
        return;
      }

      // Collapse any other expanded card
      cards.forEach((c) => c.classList.remove('expanded'));

      // Expand this card
      card.classList.add('expanded');
    });
  });

  // ---- Apply filters ----
  function applyFilters() {
    let visibleCount = 0;

    cards.forEach((card) => {
      const cats = card.dataset.categories ?? '';
      const name = card.dataset.name ?? '';
      const desc = card.dataset.description ?? '';

      const matchesCategory = activeCategory === 'all' || cats.split(',').includes(activeCategory);
      const matchesSearch = !searchTerm || name.includes(searchTerm) || desc.includes(searchTerm);

      if (matchesCategory && matchesSearch) {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
        card.classList.remove('expanded');
      }
    });

    updateCount(visibleCount);
  }

  // ---- Update result count text ----
  function updateCount(count: number) {
    const catLabel = activeCategory !== 'all' ? categoryLabelMap[activeCategory] : '';
    let text = '';

    if (!catLabel && !searchTerm) {
      text = `Showing ${count} lenses`;
    } else if (catLabel && !searchTerm) {
      text = `Showing ${count} lenses in ${catLabel}`;
    } else if (!catLabel && searchTerm) {
      text = `Showing ${count} lenses for '${searchTerm}'`;
    } else {
      text = `Showing ${count} lenses in ${catLabel} for '${searchTerm}'`;
    }

    countEl!.textContent = text;
  }
}

// Run on DOMContentLoaded and also on Astro page transitions
document.addEventListener('DOMContentLoaded', initLensesFilter);
document.addEventListener('astro:page-load', initLensesFilter);
