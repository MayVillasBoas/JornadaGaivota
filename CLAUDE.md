# may.labs

Personal site and thinking lab built with Astro 6 + Supabase + Claude API, deployed on Vercel.

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

Key rules:
- Never use emojis as visual markers — use SVG line art (stroke-only, 18px, 1.5px stroke) or typographic symbols (—, ·, →)
- Italic text must use `--ink-light` at minimum, never `--ink-muted` (legibility)
- Card hover: standardized at `translateY(-3px)` with medium shadow
- All colors must use CSS variables, never hardcoded hex values in components
