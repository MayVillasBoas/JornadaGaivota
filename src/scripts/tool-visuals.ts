// src/scripts/tool-visuals.ts
// Initializes the unified fractal-progress visualization inside .fractal-viz
// Injects canvas + words overlay + step dots into the existing container

import { FractalCanvas } from './fractal-canvas';
import type { FractalConfig } from './fractal-canvas';

// ─── Fractal config per tool ────────────────────────────────────────────────

const TOOL_FRACTAL_MAP: Record<string, FractalConfig> = {
  'sim-inteiro': {
    type: 'branch',
    categoryColor: '#4a7aad',
    accentColors: ['#8b6aad', '#4aad6a'],
    totalSteps: 5,
  },
  'medo-na-mesa': {
    type: 'branch',
    categoryColor: '#c27a5a',
    accentColors: ['#4a7aad', '#ada45a'],
    totalSteps: 7,
  },
  'bussola-interna': {
    type: 'spiral',
    categoryColor: '#8b6aad',
    accentColors: ['#4a7aad', '#2B4A3E'],
    totalSteps: 6,
  },
  'auditoria-de-energia': {
    type: 'mixed',
    categoryColor: '#2B4A3E',
    accentColors: ['#4aad6a', '#ada45a'],
    totalSteps: 6,
  },
  'o-que-quero-dizer': {
    type: 'branch',
    categoryColor: '#c27a5a',
    accentColors: ['#8b6aad', '#4a7aad'],
    totalSteps: 6,
  },
  'prototipos-de-futuro': {
    type: 'mixed',
    categoryColor: '#4aad6a',
    accentColors: ['#2B4A3E', '#ada45a'],
    totalSteps: 6,
  },
  'tres-futuros': {
    type: 'spiral',
    categoryColor: '#ada45a',
    accentColors: ['#8b6aad', '#4a7aad'],
    totalSteps: 6,
  },
};

// ─── Initialization ─────────────────────────────────────────────────────────

export function initToolVisuals(slug: string) {
  const fractalConfig = TOOL_FRACTAL_MAP[slug];
  if (!fractalConfig) return;

  // Find the .fractal-viz container (was .tool-visual)
  const vizContainer = document.querySelector('.fractal-viz') as HTMLElement;
  if (!vizContainer) return;

  // Clear any existing content
  vizContainer.innerHTML = '';

  // Create canvas element (fills the viz container)
  const canvasEl = document.createElement('canvas');
  canvasEl.className = 'fractal-viz-canvas';
  vizContainer.appendChild(canvasEl);

  // Create words overlay (positioned HTML elements over canvas)
  const wordsOverlay = document.createElement('div');
  wordsOverlay.className = 'fractal-viz-words';
  vizContainer.appendChild(wordsOverlay);

  // Create step dots
  const dotsEl = document.createElement('div');
  dotsEl.className = 'fractal-viz-dots';
  vizContainer.appendChild(dotsEl);

  // Initialize fractal
  const fractal = new FractalCanvas(canvasEl, fractalConfig);
  fractal.setDotsContainer(dotsEl);
  fractal.start();
  fractal.setStep(0);

  // Wire theme word placement at fractal nodes
  fractal.setOnNodesUpdated((step, nodes) => {
    // Words will be placed by tool-visual-update events
  });

  // Listen for visual updates from guided-tool.ts
  document.addEventListener('tool-visual-update', ((e: CustomEvent) => {
    const { themes, wordClass, step } = e.detail;
    placeThemeWords(wordsOverlay, vizContainer, themes, wordClass, step, fractal);
  }) as EventListener);

  return { fractal };
}

// ─── Theme Word Placement ───────────────────────────────────────────────────

function placeThemeWords(
  overlay: HTMLElement,
  container: HTMLElement,
  themes: string[],
  wordClass: string,
  step: number,
  fractal: FractalCanvas,
) {
  // Dim existing words
  overlay.querySelectorAll('.visual-word').forEach(w => {
    (w as HTMLElement).style.opacity = '0.4';
  });

  // Get node positions from the fractal
  const nodes = fractal.getNodePositions(step);
  const containerRect = container.getBoundingClientRect();
  const canvasEl = container.querySelector('canvas');
  if (!canvasEl) return;
  const canvasRect = canvasEl.getBoundingClientRect();

  // Place each theme at a node position, or distribute evenly if no nodes yet
  themes.forEach((theme, i) => {
    const word = document.createElement('span');
    word.className = `visual-word ${wordClass}`;
    word.textContent = theme;
    word.setAttribute('data-step', String(step));

    if (nodes[i]) {
      // Position at fractal node
      const x = nodes[i].x;
      const y = nodes[i].y;
      // Convert canvas coordinates to container-relative pixels
      const relX = (x / canvasRect.width) * 100;
      const relY = (y / canvasRect.height) * 100;
      word.style.left = `${Math.min(85, Math.max(5, relX))}%`;
      word.style.top = `${Math.min(80, Math.max(5, relY))}%`;
    } else {
      // Fallback: distribute along bottom area
      const spread = themes.length > 1 ? i / (themes.length - 1) : 0.5;
      word.style.left = `${15 + spread * 70}%`;
      word.style.top = `${60 + (i % 2) * 15}%`;
    }

    // Highlight first theme
    if (i === 0 && themes.length > 1) {
      word.classList.add('highlight');
    }

    overlay.appendChild(word);

    // Stagger animation
    setTimeout(() => word.classList.add('visible'), i * 150);
  });
}
