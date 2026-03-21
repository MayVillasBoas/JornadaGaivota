# Copilot Framework Picker

## Problem

Users go through the Copilot decision-making flow without knowing which frameworks were chosen for them or why. This creates a passive experience — the user feels like a subject, not a participant. Feedback from user testing (Vicky): "I didn't know what was going to happen or when it would end."

## Solution

After the AI classifies the user's situation, show the suggested frameworks as selectable cards with personalized reasoning. Give the user control to accept, remove, or add frameworks before starting. Add a progress bar so they always know where they are.

## Design

### Flow Change

**Before:** classify → show text reflection → auto-start first exercise
**After:** classify → show text reflection → **show framework picker** → user confirms → start first exercise

### Framework Picker UI

Renders inline in the Copilot timeline (not a modal, not a new page). Components:

1. **Contextual intro** — the existing classification reflection ("I hear you. It sounds like...")
2. **Suggested framework cards** — 3-4 cards, each showing:
   - Checkbox (pre-checked)
   - Framework name (from `MODULES[slug].title`)
   - Framework tagline (from `MODULES[slug].description`)
   - Personalized reason (from new `frameworkReasons` in classification response)
3. **"explore more frameworks" link** — progressive disclosure toggle that expands to show all remaining available frameworks (unchecked by default)
4. **"start journey →" button** — confirms selection, requires minimum 2 frameworks

Decision Memo is always appended automatically as the final step — it does not appear in the picker.

### Progress Bar

Appears after confirming selection. Sticky element below the nav header showing:
- Dots for each selected framework (filled = done, ring = current, empty = pending)
- Current step label: "Step 1 of 3: Body Scan"
- Updates as user progresses through modules
- Final state: "✓ All complete" before memo generation

### Classification API Change

Expand the `classify` action response to include `frameworkReasons`:

```json
{
  "types": ["fear-based", "identity-split"],
  "confidence": 0.85,
  "reasoning": "...",
  "suggestedRoute": ["body-scan", "parts-mapping", "regret-minimization"],
  "frameworkReasons": {
    "body-scan": "Because you mentioned physical tension when imagining the change.",
    "parts-mapping": "Because there seem to be two parts of you pulling in opposite directions.",
    "regret-minimization": "To help you see past the short-term fear."
  }
}
```

The classification prompt is updated to generate these reasons based on the user's specific words.

### Route Building

Currently `buildRoute()` in `routing.ts` builds the route from classification types. After this change:

1. Classification still suggests a route via `suggestedRoute`
2. The picker pre-selects those frameworks
3. User can modify the selection
4. The confirmed selection + `decision-memo` becomes the final route
5. `journey.route` is set from the user's confirmed selection, not from `buildRoute()` alone

### "Explore More" Expansion

When toggled, shows all modules from `MODULES` that are NOT in the suggested route, as unchecked cards. Each shows:
- Framework name
- Framework tagline
- No personalized reason (since AI didn't suggest it)

User can check any to add them to their journey.

## Files to Modify

| File | Change |
|---|---|
| `src/scripts/copilot/engine.ts` | New `showFrameworkPicker()` method, progress bar rendering, modify `classify()` flow |
| `src/pages/api/copilot.ts` | Update `CLASSIFICATION_PROMPT` to return `frameworkReasons` and `suggestedRoute` |
| `src/styles/copilot.css` | Styles for framework cards, checkboxes, progress bar, explore-more toggle |
| `src/scripts/copilot/modules.ts` | Export `MODULE_ORDER` or helper to list all available modules for the picker |

## Interaction Details

- **Card click** toggles the checkbox on/off
- **Minimum 2 frameworks** required to enable "start journey"
- **Maximum**: no hard limit, but the AI suggests 3-4
- **Decision Memo** is always the final step (auto-appended, not shown in picker)
- **"explore more"** is a text toggle (`▸ explore more` / `▾ hide`) with slide animation
- **Progress bar** uses the same layer colors as existing dot indicators (feel=warm, see=purple, think=blue, act=green)

## Edge Cases

- If API fails to return `frameworkReasons`, fall back to showing cards without reasons
- If user deselects all frameworks, disable the start button with hint text
- If user adds frameworks from "explore more" that weren't in the AI suggestion, they appear without a personalized reason — just the default tagline

## Verification

1. Start a new Copilot journey
2. After describing a situation, see framework cards appear (not auto-starting)
3. Cards show name, tagline, and personalized "why"
4. Can uncheck/check cards
5. "explore more" expands to show remaining frameworks
6. "start journey" begins with selected frameworks only
7. Progress bar visible throughout, updates correctly
8. Decision Memo auto-appended as final step
9. Journey completes normally with memo generation
