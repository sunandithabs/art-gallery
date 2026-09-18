# Prototype Plan

## Scope
Build exactly one rectangular contemporary gallery room. No multi-room navigation, floor plan, or future-room placeholders.

## Risk slices
1. **Spatial camera** — pointer drag orientation, wheel forward/back movement, touch pointers, smooth interpolation, and room-boundary clamping.
2. **Gallery scene** — high-ceiling room shell, entrance opening, pale polished floor, three framed artworks, individual spotlights, and soft ambient lighting.
3. **Exhibit interaction** — raycast artwork selection and museum-catalogue overlay with title, year, medium, and curator note.
4. **Responsive polish** — usable touch targets and overlay layout on a modern phone; reduced-motion fallback.

## Verification criteria
- Initial view begins at human eye height facing the primary artwork wall.
- Dragging rotates the camera; wheel changes position along the camera direction without clipping walls.
- Three artworks are visible in the room and are individually framed and lit.
- Clicking/tapping artwork opens a subtle catalogue-style overlay; close returns to exploration.
- No giant navigation/header, no decorative birthday elements, no gradients or neon.
- Typecheck and production build pass.
