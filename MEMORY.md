# Memory

The prototype uses procedural Three.js room geometry plus three generated image textures uploaded to WebDev storage. The initial view starts at eye height facing the primary wall. The room is intentionally one space only; no future-room navigation is implemented.

The camera uses smoothed yaw/pitch orientation, wheel travel, touch/pinch travel, and clamping against the room interior. Artwork selection is raycast-based and React owns only the catalogue overlay state. Desktop and 390px mobile screenshots were checked. The primary artwork was clicked successfully and displayed its catalogue note. `pnpm check` and `pnpm build` pass; the production bundle is larger than the default Vite warning threshold because Three.js is bundled, but the prototype remains a single lightweight scene with no GLB assets.

The latest interaction update adds a nearest-poster detector in the animation loop. Within 3.65 world units, the closest poster appears as a right-side, slightly rotated card with the same uploaded poster texture, title, metadata, and a tap target for the full curator note. The card slides in and gently floats; mobile moves it above the footer and reduced-motion preferences disable the longer animation durations through the existing global rule.

The archive was supplied as a local project, so changes are prepared in the extracted working copy and packaged as a clean zip for re-import or attachment to the connected WebDev project.

## Current QA

- `pnpm check` — passes.
- `pnpm build` — passes; Vite retains the existing Three.js chunk-size warning.
- Proximity behavior is driven by camera target position, so keyboard, wheel, and touch travel all trigger the same card state.
- Clicking the card opens the existing catalogue panel; closing it returns to the proximity card while the player remains near the artwork.
