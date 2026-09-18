# Scene Structure

`client/src/components/MuseumExperience.tsx` owns the React lifecycle wrapper and the scene controller.

The Three.js scene is organized by semantic groups:

- `RoomShell`: floor, ceiling, wall segments, entrance opening, baseboards, and ceiling rail.
- `Artwork`: a data-driven framed image plane with a raycast target and metadata.
- `LightingRig`: hemisphere fill, room ceiling wash, and one spotlight/fixture per artwork.
- `CameraController`: smoothed target position/orientation, pointer look, wheel travel, pinch travel, and interior clamping.
- `ExhibitOverlay`: React UI layer for title, year, medium, curator note, and close affordance.

The prototype intentionally keeps gameplay/rendering logic in a small controller class-like module within the component so future rooms can be split into data-driven scene modules without replacing the camera or exhibit interaction systems.
