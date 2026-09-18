# QA Notes

The three-room museum now has overlapping walkable bounds at each tall arch threshold. This removes the invisible collision seam that previously stopped the camera at the end of the Room 01 corridor. Room 02 and Room 03 remain bounded by solid room walls; only the intended arch openings overlap the corridor regions.

Typecheck, production build, preview restart, screenshot capture, and browser console QA pass.

## Poster proximity card

The nearest artwork is detected during the existing animation loop using the player target position. At less than 3.65 world units, a right-side card appears with the artwork's existing `/manus-storage/...` texture, title, year, medium, and a tap instruction. The closest-card state updates as the player moves between posters and clears when no poster is nearby.

The card is styled like a paper poster held just outside the frame: slight rotation, drop shadow, lavender edge accent, slide-in animation, and a restrained light sweep. On narrow screens it sits above the bottom instruction line. Clicking it opens the existing catalogue overlay, and the close action returns to exploration.

## Verification

- `pnpm check` passes.
- `pnpm build` passes.
- Existing Vite warning about the Three.js bundle remains expected.
