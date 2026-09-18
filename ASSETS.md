# Assets

**Art direction:** Pristine high-end contemporary museum architecture: warm-white plaster walls, pale polished limestone floor, high ceilings, black frames and typography, soft realistic spotlights, generous negative space, and a nearly imperceptible lavender accent.

## Generated references

- `/home/ubuntu/webdev-static-assets/gallery-reference.png` — visual target for room composition and lighting.
- `/manus-storage/artwork-quiet-interval_e49268fe.png` — generated placeholder artwork for the primary wall.
- `/manus-storage/artwork-soft-geometry_734087bd.png` — generated placeholder artwork for the left wall.
- `/manus-storage/artwork-afterimage_31c508f7.png` — generated placeholder artwork for the right wall.

The room shell, frames, labels, spotlights, and floor are procedural Three.js geometry to keep the prototype lightweight and extensible. Each poster now has a self-contained procedural fallback texture so the artwork remains visible in local previews when optional `/manus-storage/...` URLs are unavailable; a storage texture replaces the fallback automatically when it loads.

Lighting is layered as restrained hemisphere fill, a low directional wash, broad overhead ceiling pools, and brighter individual poster spotlights aimed at each artwork surface.
