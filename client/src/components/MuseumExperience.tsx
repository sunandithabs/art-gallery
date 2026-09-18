import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import AdmissionTicket from "./AdmissionTicket";
import { EXHIBITION, exhibitPhoto } from "@/lib/exhibition";

type Artwork = {
  id: string;
  index: string;
  title: string;
  year: string;
  medium: string;
  note: string;
  image: string;
  position: [number, number, number];
  rotationY: number;
  width: number;
  height: number;
  wall: "primary" | "left" | "right";
  videoSrc?: string;
  custom?: boolean;
  hideCaption?: boolean;
};

type SavedFrame = Artwork & { frameScale?: number };
const SAVED_FRAMES_KEY = "anagha-gallery-custom-frames";
function readSavedFrames(): SavedFrame[] {
  try {
    const raw = window.localStorage.getItem(SAVED_FRAMES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((frame): frame is SavedFrame => Boolean(frame && typeof frame === "object" && "id" in frame && "image" in frame && "position" in frame && (frame as SavedFrame).custom));
  } catch { return []; }
}
function writeSavedFrames(frames: SavedFrame[]) {
  try { window.localStorage.setItem(SAVED_FRAMES_KEY, JSON.stringify(frames)); return true; } catch { return false; }
}

const ARTWORKS: Artwork[] = [
  {
    id: "quiet-interval",
    index: "01 / 03",
    title: "Quiet Interval",
    year: "2024",
    medium: "Archival pigment print",
    note: "A study in the pause between architecture and light. The image holds its silence just long enough to become a place.",
    image: "/manus-storage/artwork-quiet-interval_e49268fe.png",
    position: [0, 3.45, -5.82],
    rotationY: 0,
    width: 5.55,
    height: 3.2,
    wall: "primary",
  },
  {
    id: "soft-geometry",
    index: "02 / 03",
    title: "Soft Geometry",
    year: "2023",
    medium: "Archival pigment print",
    note: "Fold, shadow, and the trace of a lavender edge. A small shift in light changes the entire emotional temperature.",
    image: "/manus-storage/artwork-soft-geometry_734087bd.png",
    position: [-7.72, 3.35, -0.15],
    rotationY: Math.PI / 2,
    width: 2.75,
    height: 3.75,
    wall: "left",
  },
  {
    id: "afterimage",
    index: "03 / 03",
    title: "Afterimage",
    year: "2024",
    medium: "Archival pigment print",
    note: "A dark aperture opens toward a nearly weightless horizon. What remains is not an object, but the feeling of leaving it.",
    image: "/manus-storage/artwork-afterimage_31c508f7.png",
    position: [7.72, 3.35, -0.15],
    rotationY: -Math.PI / 2,
    width: 2.75,
    height: 3.75,
    wall: "right",
  },
];

// Every wall in the museum draws from the exhibition plan for its own room, so
// a room only ever shows photographs that belong to its chapter of the story.
function roomSource(room: number, index: number): Artwork {
  const photo = exhibitPhoto(room, index);
  return { ...ARTWORKS[0], image: photo.src, title: photo.title, year: photo.year, medium: photo.medium, note: photo.note };
}

function roomTitle(room: number): string {
  return EXHIBITION[room]?.title ?? "Untitled room";
}

const ROOM = { width: 16, depth: 12, height: 7 };
const CORRIDOR = { width: 5.6, depth: 6.2 };
const EXTENDED_ROOM = { width: 15.5, depth: 11, gap: 4.6 };
const SIDE_ROOM = { width: 10.5, depth: 10.6 };
const ROOM_PALETTES = [
  { wall: 0xffffff, floor: 0xffffff, accent: 0xc2b4d8, light: 0xffe3bd, exposure: 1.06 },
  { wall: 0xffffff, floor: 0xffffff, accent: 0xbda8d2, light: 0xffe1b8, exposure: 1.02 },
  { wall: 0xffffff, floor: 0xffffff, accent: 0xc9b4dc, light: 0xffe6c4, exposure: 0.98 },
  { wall: 0xffffff, floor: 0xffffff, accent: 0xb9a5d0, light: 0xffe0b5, exposure: 1.0 },
  { wall: 0xffffff, floor: 0xffffff, accent: 0xd0b8df, light: 0xffe4c0, exposure: 1.01 },
  { wall: 0xffffff, floor: 0xffffff, accent: 0xc2b5d8, light: 0xffe2bc, exposure: 0.97 },
  { wall: 0xffffff, floor: 0xffffff, accent: 0xcbb4d9, light: 0xffe5c2, exposure: 0.96 },
];
const EXTENDED_LAYOUT = [
  { room: 2, x: 0, z: 17.7, palette: 1, openings: ["north", "south", "west"] },
  { room: 3, x: 0, z: 28.7, palette: 2, openings: ["north", "east", "south"] },
] as const;
const SATELLITE_LAYOUT = [
  { room: 4, x: -15.5, z: 17.7, palette: 3, openings: ["east"] },
  { room: 10, x: 15.5, z: 28.7, palette: 5, openings: ["west"] },
] as const;
const EYE_HEIGHT = 2.15;
const ARCH_HEIGHT = 5.8;
const ARCH_CLEARANCE = 2.6;
const ARCH_OPENINGS = [
  { axis: "x", value: -8, center: 0, span: 3.8 },
  { axis: "x", value: 8, center: 0, span: 3.8 },
  { axis: "x", value: -7.75, center: 17.7, span: 3.8 },
  { axis: "x", value: 7.75, center: 28.7, span: 3.8 },
  { axis: "z", value: 12.2, center: 0, span: 2.3 },
  { axis: "z", value: 23.2, center: 0, span: 2.3 },
  { axis: "z", value: 34.2, center: 0, span: 2.3 },
] as const;
const ROOM_GUIDE_TARGETS = [
  { id: "01", label: "ROOM 01", x: 0, z: 0 },
  { id: "02", label: "ROOM 02", x: 0, z: 17.7 },
  { id: "03", label: "ROOM 03", x: 0, z: 28.7 },
  { id: "04", label: "ROOM 04", x: -15.5, z: 17.7 },
  { id: "05", label: "ROOM 05", x: 13.25, z: 0 },
  { id: "06", label: "ROOM 06", x: 23.75, z: 0 },
  { id: "07", label: "ROOM 07", x: -13.25, z: 0 },
  { id: "08", label: "ROOM 08", x: -23.75, z: 0 },
  { id: "09", label: "ROOM 09", x: -34.25, z: 0 },
  { id: "10", label: "ROOM 10", x: 15.5, z: 28.7 },
  { id: "11", label: "ROOM 11", x: 0, z: 39.7 },
] as const;

// Exhibition wall plan: each numbered room is mirrored across the main gallery.
// The inner wall is the only intentionally empty wall because it contains the
// connecting arch. Outer, north, and south walls all carry artwork; wide walls
// receive two or three pieces depending on the room's usable span.
const NUMBERED_ROOM_WALL_PLAN = {
  5: { arch: "west", posters: { east: 3, north: 2, south: 2 } },
  6: { arch: "west", posters: { east: 3, north: 2, south: 2 } },
  7: { arch: "east", posters: { west: 3, north: 2, south: 2 } },
  8: { arch: "east", posters: { west: 3, north: 2, south: 2 } },
  9: { arch: "east", posters: { west: 2, north: 2, south: 2 } },
} as const;

function makeMaterial(color: number, roughness = 0.6, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function makeWallMaterial(color: number) {
  void color;
  return new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0 });
}

function makeLabelTexture(artwork: Artwork) {
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 180;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.CanvasTexture(canvas);
  context.fillStyle = "#f6f4ef";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#31302d";
  context.font = "600 28px DM Sans, sans-serif";
  context.fillText(artwork.title, 26, 48);
  context.fillStyle = "#77736d";
  context.font = "22px DM Sans, sans-serif";
  context.fillText(`${artwork.year}  ·  ${artwork.medium}`, 26, 86);
  context.fillStyle = "#b9a8d2";
  context.fillRect(26, 124, 36, 4);
  context.fillStyle = "#77736d";
  context.font = "18px DM Sans, sans-serif";
    context.fillText("ANAGHA’S ART GALLERY", 80, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeArtworkTexture(artwork: Artwork) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 384;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.CanvasTexture(canvas);

  const fill = (color: string, x: number, y: number, width: number, height: number) => {
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
  };
  const circle = (color: string, x: number, y: number, radius: number) => {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  };

  if (artwork.id.includes("soft-geometry") || artwork.id.includes("room-2")) {
    fill("#ded8d2", 0, 0, 960, 720);
    fill("#b9a8ca", 90, 92, 250, 520);
    fill("#8b7d9e", 340, 190, 390, 320);
    fill("#f2eee8", 530, 0, 430, 720);
    fill("#c7b9ca", 210, 500, 520, 90);
    circle("#70647e", 700, 160, 96);
    circle("#eee9e2", 700, 160, 48);
  } else if (artwork.id.includes("afterimage") || artwork.id.includes("room-3")) {
    fill("#272b32", 0, 0, 960, 720);
    fill("#414957", 110, 120, 730, 440);
    fill("#b8c3c9", 490, 0, 170, 720);
    fill("#d8d6cc", 540, 70, 60, 580);
    fill("#596271", 170, 520, 560, 40);
    circle("#d8d6cc", 290, 220, 78);
    circle("#414957", 290, 220, 44);
  } else {
    fill("#e8e1d8", 0, 0, 960, 720);
    fill("#c5b2bd", 0, 410, 960, 310);
    fill("#f4eee2", 120, 120, 540, 340);
    fill("#b5c4c3", 650, 80, 220, 500);
    fill("#7f96a0", 710, 170, 94, 330);
    circle("#384b52", 355, 280, 110);
    circle("#d5c5c1", 355, 280, 54);
    fill("#aa8798", 170, 540, 430, 25);
  }

  context.strokeStyle = "rgba(255,255,255,0.2)";
  context.lineWidth = 3;
  for (let index = 0; index < 8; index += 1) {
    context.beginPath();
    context.moveTo(0, 90 + index * 78);
    context.lineTo(960, 30 + index * 78);
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeStanchionTexture(kind: "metal" | "velvet") {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.CanvasTexture(canvas);
  context.fillStyle = kind === "metal" ? "#302f2c" : "#67243a";
  context.fillRect(0, 0, 128, 128);
  for (let index = 0; index < 128; index += 1) {
    const lightness = kind === "metal" ? 12 + Math.random() * 12 : 8 + Math.random() * 10;
    context.fillStyle = `rgba(255,255,255,${lightness / 255})`;
    context.fillRect(0, index, 128, 1);
  }
  context.strokeStyle = kind === "metal" ? "rgba(255,255,255,0.12)" : "rgba(24,7,14,0.18)";
  context.lineWidth = kind === "metal" ? 1 : 2;
  for (let index = kind === "metal" ? -128 : 0; index < 256; index += kind === "metal" ? 10 : 7) {
    context.beginPath();
    context.moveTo(index, 0);
    context.lineTo(index + (kind === "metal" ? 128 : 28), 128);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildArtwork(artwork: Artwork, scene: THREE.Scene, interactive: THREE.Object3D[], mini = false) {
  // Start with a blank exhibition: only user-added custom frames are rendered.
  if (!artwork.custom) return null;
  // Hard safety rule: the two main wing openings remain visually empty. This
  // protects the arch throat even if a future poster layout is edited poorly.
  const nearWestArch = artwork.position[0] > -ROOM.width / 2 - 2.6 && artwork.position[0] < -ROOM.width / 2 + 2.6 && Math.abs(artwork.position[2]) < ARCH_CLEARANCE + 1.2;
  const nearEastArch = artwork.position[0] > ROOM.width / 2 - 2.6 && artwork.position[0] < ROOM.width / 2 + 2.6 && Math.abs(artwork.position[2]) < ARCH_CLEARANCE + 1.2;
  const nearAnyOpening = ARCH_OPENINGS.some((opening) => opening.axis === "x"
    ? Math.abs(artwork.position[0] - opening.value) < 0.8 && Math.abs(artwork.position[2] - opening.center) < opening.span
    : Math.abs(artwork.position[2] - opening.value) < 0.8 && Math.abs(artwork.position[0] - opening.center) < opening.span);
  if (nearWestArch || nearEastArch || nearAnyOpening) return;
  const group = new THREE.Group();
  group.name = `Artwork · ${artwork.title}`;
  group.position.set(...artwork.position);
  group.rotation.y = artwork.rotationY;
  group.userData.artworkId = artwork.id;

  const frameSize = artwork.wall === "primary" ? 0.06 : 0.05;
  const frameDepth = 0.07;
  const frameMaterial = makeMaterial(0x242321, 0.42, 0.12);
  const fallbackTexture = makeArtworkTexture(artwork);
  let artworkTexture: THREE.Texture = fallbackTexture;
  if (artwork.videoSrc) {
    const video = document.createElement("video");
    video.src = artwork.videoSrc;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.play().catch(() => undefined);
    artworkTexture = new THREE.VideoTexture(video);
    artworkTexture.colorSpace = THREE.SRGBColorSpace;
  }
  const imageMaterial = new THREE.MeshStandardMaterial({ map: artworkTexture, roughness: 0.76, metalness: 0.01 });
  const image = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), imageMaterial);
  image.name = `Interactive artwork · ${artwork.title}`;
  image.position.z = 0.08;
  image.userData.artworkId = artwork.id;
  image.userData.artwork = artwork;
  image.castShadow = false;
  image.receiveShadow = true;
  group.add(image);
  interactive.push(image);

  const top = new THREE.Mesh(new THREE.BoxGeometry(1, frameSize, frameDepth), frameMaterial);
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(1, frameSize, frameDepth), frameMaterial);
  const left = new THREE.Mesh(new THREE.BoxGeometry(frameSize, 1, frameDepth), frameMaterial);
  const right = new THREE.Mesh(new THREE.BoxGeometry(frameSize, 1, frameDepth), frameMaterial);
  group.add(top, bottom, left, right);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(1.38, 0.34), new THREE.MeshBasicMaterial({ map: makeLabelTexture(artwork), transparent: true }));
  if (artwork.wall === "primary") label.scale.set(0.7, 0.7, 0.7);
  group.add(label);

  // The image aspect ratio is authoritative; artwork dimensions are the wall allowance.
  const fitArtworkToWall = (width: number, height: number) => {
    const aspect = width / Math.max(height, 1);
    const maxWidth = artwork.width;
    const maxHeight = artwork.height;
    const displayWidth = aspect >= maxWidth / maxHeight ? maxWidth : maxHeight * aspect;
    const displayHeight = displayWidth / aspect;
    image.geometry.dispose();
    image.geometry = new THREE.PlaneGeometry(displayWidth, displayHeight);
    top.geometry.dispose();
    top.geometry = new THREE.BoxGeometry(displayWidth + frameSize * 2, frameSize, frameDepth);
    bottom.geometry.dispose();
    bottom.geometry = new THREE.BoxGeometry(displayWidth + frameSize * 2, frameSize, frameDepth);
    left.geometry.dispose();
    left.geometry = new THREE.BoxGeometry(frameSize, displayHeight, frameDepth);
    right.geometry.dispose();
    right.geometry = new THREE.BoxGeometry(frameSize, displayHeight, frameDepth);
    top.position.set(0, displayHeight / 2 + frameSize / 2, 0);
    bottom.position.set(0, -displayHeight / 2 - frameSize / 2, 0);
    left.position.set(-displayWidth / 2 - frameSize / 2, 0, 0);
    right.position.set(displayWidth / 2 + frameSize / 2, 0, 0);
    label.position.set(artwork.wall === "primary" ? displayWidth / 2 + 0.86 : 0, -displayHeight / 2 - 0.38, 0.04);
  };
  fitArtworkToWall(artwork.width, artwork.height);
  if (!artwork.videoSrc && artwork.image) {
    new THREE.TextureLoader().load(artwork.image, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      imageMaterial.map = texture;
      imageMaterial.needsUpdate = true;
      if (texture.image?.width && texture.image?.height) fitArtworkToWall(texture.image.width, texture.image.height);
    }, undefined, () => undefined);
  }
  // Stanchions and the spotlight are children of the same rig group as the
  // frame itself (in the group's local space, +Z is "out from the wall" and
  // +X is "along the wall", matching how rotationY already orients normal /
  // tangent) so that moving, rotating, or resizing one frame always carries
  // its stanchions and lighting with it — nothing is left behind on the wall.
  if (!mini) {
    addArtworkStanchions(group, artwork);
    addArtworkSpotlight(group, artwork);
  }
  label.visible = !artwork.hideCaption;
  group.userData.labelMesh = label;
  group.userData.imageMesh = image;
  group.userData.artwork = artwork;
  scene.add(group);
  return group;
}

function addArtworkSpotlight(group: THREE.Group, artwork: Artwork) {
  const light = new THREE.SpotLight(0xfff1dc, 12, 10.5, 0.52, 0.92, 1.05);
  light.position.set(0, 6.2 - artwork.position[1], 1.85);
  light.target.position.set(0, 0, 0);
  // Poster lights illuminate the art but do not cast their own shadow maps; the
  // single directional wash owns shadows to keep the scene responsive.
  light.castShadow = false;
  group.add(light, light.target);
}

function addArtworkStanchions(group: THREE.Group, artwork: Artwork) {
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x22211f, roughness: 0.28, metalness: 0.42, map: makeStanchionTexture("metal") });
  const velvetMaterial = new THREE.MeshStandardMaterial({ color: 0x7a1f32, roughness: 0.66, metalness: 0.01, map: makeStanchionTexture("velvet") });
  const offset = Math.min(artwork.width * 0.32, 1.25);
  const z = 0.58;
  const postY = 0.36 - artwork.position[1];
  const baseY = 0.022 - artwork.position[1];
  const ropeY = 0.62 - artwork.position[1];
  [-offset, offset].forEach((x) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.085, 0.72, 14), postMaterial);
    post.position.set(x, postY, z);
    group.add(post);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.045, 20), postMaterial);
    base.position.set(x, baseY, z);
    group.add(base);
  });
  const ropeCurve = new THREE.LineCurve3(new THREE.Vector3(-offset, ropeY, z), new THREE.Vector3(offset, ropeY, z));
  const rope = new THREE.Mesh(new THREE.TubeGeometry(ropeCurve, 8, 0.045, 10, false), velvetMaterial);
  group.add(rope);
}

function addMuseumBench(scene: THREE.Scene, position: [number, number, number], rotationY = 0) {
  const wood = makeMaterial(0x4a3029, 0.32, 0.08);
  const brass = makeMaterial(0x9a7b56, 0.28, 0.5);
  const bench = new THREE.Group();
  bench.position.set(...position);
  bench.rotation.y = rotationY;
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.16, 0.58), wood);
  seat.position.y = 0.72;
  const lowerRail = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.08, 0.18), wood);
  lowerRail.position.set(0, 0.42, 0);
  [-0.92, 0.92].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.72, 0.32), brass);
    leg.position.set(x, 0.36, 0);
    bench.add(leg);
  });
  bench.add(seat, lowerRail);
  scene.add(bench);
}

function addStonePlinth(scene: THREE.Scene, position: [number, number, number], accent: number) {
  const stone = makeMaterial(0xd9d1c7, 0.82, 0.02);
  const accentMaterial = makeMaterial(accent, 0.42, 0.12);
  const plinth = new THREE.Group();
  plinth.position.set(...position);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.92, 0.84), stone);
  base.position.y = 0.46;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.3, 0.55, 20), accentMaterial);
  top.position.y = 1.2;
  top.rotation.z = 0.12;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 12), accentMaterial);
  cap.position.y = 1.52;
  plinth.add(base, top, cap);
  scene.add(plinth);
  return plinth;
}

function makeGiftMessageTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 360;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.CanvasTexture(canvas);
  context.fillStyle = "#fff8ef";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#4c293b";
  context.textAlign = "center";
  context.font = "600 58px DM Sans, sans-serif";
  context.fillText("happy birthday!", canvas.width / 2, 120);
  context.font = "400 34px DM Sans, sans-serif";
  context.fillText("-from jeff, bj, rj, chad, steve and kesha", canvas.width / 2, 205);
  context.fillStyle = "#b2769a";
  context.fillRect(280, 260, 340, 6);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addGalleryAccent(scene: THREE.Scene, interactive: THREE.Object3D[], x: number, z: number, accent: number) {
  const gift = new THREE.Group();
  gift.position.set(x, 0, z);
  gift.userData.complimentStatue = true;
  const boxMaterial = makeMaterial(0xb2769a, 0.52, 0.04);
  const lidMaterial = makeMaterial(0xd3a9be, 0.46, 0.03);
  const ribbonMaterial = makeMaterial(0xf7e7d5, 0.32, 0.08);
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.12, 1.35), boxMaterial);
  base.position.y = 0.56;
  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.18, 1.5), lidMaterial);
  lid.position.y = 1.2;
  const verticalRibbon = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.3, 1.48), ribbonMaterial);
  verticalRibbon.position.y = 0.62;
  const horizontalRibbon = new THREE.Mesh(new THREE.BoxGeometry(1.72, 1.3, 0.22), ribbonMaterial);
  horizontalRibbon.position.y = 0.62;
  const bowLeft = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 10), ribbonMaterial);
  bowLeft.scale.set(1.25, 0.55, 0.5);
  bowLeft.position.set(-0.24, 1.5, 0);
  const bowRight = bowLeft.clone();
  bowRight.position.x = 0.24;
  const message = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.54), new THREE.MeshBasicMaterial({ map: makeGiftMessageTexture(), transparent: true }));
  message.position.set(0, 0.66, 0.69);
  gift.add(base, lid, verticalRibbon, horizontalRibbon, bowLeft, bowRight, message);
  const halo = new THREE.PointLight(accent, 0.45, 3.4, 2);
  halo.position.set(0, 2.1, 0);
  gift.add(halo);
  scene.add(gift);
  interactive.push(gift);
  return gift;
}
function addWall(scene: THREE.Scene, geometry: THREE.BufferGeometry, position: [number, number, number], material: THREE.Material) {
  const wall = new THREE.Mesh(geometry, material);
  wall.position.set(...position);
  wall.receiveShadow = true;
  wall.userData.galleryWall = true;
  scene.add(wall);
  return wall;
}

function buildRoom(scene: THREE.Scene, interactive: THREE.Object3D[], secretDoorRef: { current: THREE.Object3D | null }, room12DoorRef: { current: THREE.Object3D | null }) {
  const wallMaterial = makeWallMaterial(0xfaf9f7);
  const floorMaterial = makeMaterial(0xffffff, 0.32, 0.04);
  const ceilingMaterial = makeMaterial(0xf6f3f7, 0.92);
  const trimMaterial = makeMaterial(0x8c867c, 0.48, 0.08);
  const charcoalMaterial = makeMaterial(0x2b2927, 0.4, 0.12);
  const lavenderMaterial = makeMaterial(0xc2b4d8, 0.52, 0.02);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width, ROOM.depth), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);

  const ceiling = new THREE.Mesh(PlaneGeometry(ROOM.width, ROOM.depth), ceilingMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = ROOM.height;
  ceiling.receiveShadow = true;
  scene.add(ceiling);

  addWall(scene, new THREE.BoxGeometry(ROOM.width, ROOM.height, 0.18), [0, ROOM.height / 2, -ROOM.depth / 2], wallMaterial);
  // These are intentionally plain open passages: no rectangular portal frame
  // combined with a curved trim, and no artwork on the opening wall.
  addArchOpeningWall(scene, -ROOM.width / 2, 0, ROOM.depth, ROOM.height, 3.6, wallMaterial);
  addArchOpeningWall(scene, ROOM.width / 2, 0, ROOM.depth, ROOM.height, 3.6, wallMaterial);

  const entryWidth = 3.8;
  const frontSegmentWidth = (ROOM.width - entryWidth) / 2;
  addWall(scene, new THREE.BoxGeometry(frontSegmentWidth, ROOM.height, 0.18), [-(entryWidth / 2 + frontSegmentWidth / 2), ROOM.height / 2, ROOM.depth / 2], wallMaterial);
  addWall(scene, new THREE.BoxGeometry(frontSegmentWidth, ROOM.height, 0.18), [entryWidth / 2 + frontSegmentWidth / 2, ROOM.height / 2, ROOM.depth / 2], wallMaterial);

  const baseboard = new THREE.BoxGeometry(ROOM.width, 0.11, 0.1);
  addWall(scene, baseboard, [0, 0.12, -ROOM.depth / 2 + 0.12], trimMaterial);
  const baseboardSide = new THREE.BoxGeometry(0.1, 0.11, ROOM.depth);
  addWall(scene, baseboardSide, [-ROOM.width / 2 + 0.12, 0.12, 0], trimMaterial);
  addWall(scene, baseboardSide, [ROOM.width / 2 - 0.12, 0.12, 0], trimMaterial);

  const entryTop = new THREE.BoxGeometry(entryWidth, ROOM.height - ARCH_HEIGHT, 0.2);
  addWall(scene, entryTop, [0, ARCH_HEIGHT + (ROOM.height - ARCH_HEIGHT) / 2, ROOM.depth / 2], trimMaterial);

  // A restrained threshold makes the opening read as architecture rather than a missing wall.
  const entryPost = new THREE.BoxGeometry(0.1, ROOM.height - 0.16, 0.24);
  addWall(scene, entryPost, [-entryWidth / 2, (ROOM.height - 0.16) / 2, ROOM.depth / 2], trimMaterial);
  addWall(scene, entryPost, [entryWidth / 2, (ROOM.height - 0.16) / 2, ROOM.depth / 2], trimMaterial);

  // The first room opens into a quiet, unfinished corridor toward the future galleries.
  const corridorStart = ROOM.depth / 2 + 0.1;
  const corridorDepth = CORRIDOR.depth;
  const corridorCenter = corridorStart + corridorDepth / 2;
  const corridorWidth = CORRIDOR.width;
  const corridorFloor = new THREE.Mesh(new THREE.PlaneGeometry(corridorWidth, corridorDepth), floorMaterial);
  corridorFloor.rotation.x = -Math.PI / 2;
  corridorFloor.position.set(0, 0, corridorCenter);
  corridorFloor.receiveShadow = true;
  scene.add(corridorFloor);
  const corridorCeiling = new THREE.Mesh(new THREE.PlaneGeometry(corridorWidth, corridorDepth), ceilingMaterial);
  corridorCeiling.rotation.x = Math.PI / 2;
  corridorCeiling.position.set(0, ROOM.height, corridorCenter);
  scene.add(corridorCeiling);
  const corridorWall = new THREE.BoxGeometry(0.18, ROOM.height, corridorDepth);
  addWall(scene, corridorWall, [-corridorWidth / 2, ROOM.height / 2, corridorCenter], wallMaterial);
  addWall(scene, corridorWall, [corridorWidth / 2, ROOM.height / 2, corridorCenter], wallMaterial);

  const threshold = new THREE.Mesh(new THREE.BoxGeometry(entryWidth, 0.035, 0.42), charcoalMaterial);
  threshold.position.set(0, 0.018, ROOM.depth / 2 + 0.08);
  scene.add(threshold);
  const thresholdAccent = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.42), lavenderMaterial);
  thresholdAccent.position.set(-entryWidth / 2 + 0.4, 0.044, ROOM.depth / 2 + 0.08);
  scene.add(thresholdAccent);

  // Sparse ceiling bays and a small wayfinding mark create scale without visual noise.
  const ceilingBayMaterial = makeMaterial(0xf8f5ef, 0.92);
  for (let index = -1; index <= 1; index += 1) {
    const bay = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.025, 0.05), ceilingBayMaterial);
    bay.position.set(index * 4.45, ROOM.height - 0.035, -0.15);
    scene.add(bay);
  }
  for (let index = 0; index < 3; index += 1) {
    const bay = new THREE.Mesh(new THREE.BoxGeometry(corridorWidth - 0.5, 0.025, 0.05), ceilingBayMaterial);
    bay.position.set(0, ROOM.height - 0.035, corridorStart + 1.4 + index * 1.8);
    scene.add(bay);
  }
  const wayfinding = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 0.31),
    new THREE.MeshBasicMaterial({ map: makeWayfindingTexture(), transparent: true }),
  );
  wayfinding.position.set(-ROOM.width / 2 + 0.1, 3.2, ROOM.depth / 2 - 0.18);
  wayfinding.rotation.y = Math.PI / 2;
  scene.add(wayfinding);
  const railMaterial = makeMaterial(0x292826, 0.3, 0.4);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(ROOM.width - 2.2, 0.04, 0.05), railMaterial);
  rail.position.set(0, ROOM.height - 0.26, -0.15);
  scene.add(rail);
  const railLeft = rail.clone();
  railLeft.scale.x = 0.25;
  railLeft.position.x = -ROOM.width / 2 + 1.12;
  scene.add(railLeft);
  const railRight = rail.clone();
  railRight.scale.x = 0.25;
  railRight.position.x = ROOM.width / 2 - 1.12;
  scene.add(railRight);

  // Room 01 keeps the side walls empty at the wing arches. The primary wall
  // carries one large work with a smaller companion on each side.
  buildArtwork({ ...roomSource(1, 0), id: "room-01-centre", index: "01 / 03" }, scene, interactive);
  buildArtwork({ ...roomSource(1, 1), id: "quiet-interval-companion-left", index: "02 / 03", position: [-4.75, 3.25, -5.82], rotationY: 0, width: 2.65, height: 2.75, wall: "primary" }, scene, interactive);
  buildArtwork({ ...roomSource(1, 2), id: "quiet-interval-companion-right", index: "03 / 03", position: [4.75, 3.25, -5.82], rotationY: 0, width: 2.65, height: 2.75, wall: "primary" }, scene, interactive);
  addMuseumBench(scene, [0, 0, -2.7]);
  addGalleryAccent(scene, interactive, -5.8, -4.55, 0xc2b4d8);
  buildSideRooms(scene, interactive);
  buildExtendedRooms(scene, interactive);
  const secretFloor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width, 11), floorMaterial);
  secretFloor.rotation.x = -Math.PI / 2;
  secretFloor.position.set(0, 0, 39.7);
  scene.add(secretFloor);
  const secretCeiling = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width, 11), ceilingMaterial);
  secretCeiling.rotation.x = Math.PI / 2;
  secretCeiling.position.set(0, ROOM.height, 39.7);
  scene.add(secretCeiling);
  addWall(scene, new THREE.BoxGeometry(0.18, ROOM.height, 11), [-ROOM.width / 2, ROOM.height / 2, 39.7], wallMaterial);
  addWall(scene, new THREE.BoxGeometry(0.18, ROOM.height, 11), [ROOM.width / 2, ROOM.height / 2, 39.7], wallMaterial);
  addSegmentedWall(scene, 45.2, ROOM.width, ROOM.height, 3.6, wallMaterial);
  const room12Door = new THREE.Mesh(new THREE.BoxGeometry(3.6, 5.7, 0.18), new THREE.MeshStandardMaterial({ color: 0xb2769a, roughness: 0.38, metalness: 0.08 }));
  room12Door.position.set(0, 2.85, 45.2);
  scene.add(room12Door);
  room12DoorRef.current = room12Door;
  const room12Lock = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.52, 0.08), new THREE.MeshStandardMaterial({ color: 0x9a7b56, roughness: 0.28, metalness: 0.5 }));
  room12Lock.position.set(0, 2.6, 45.08);
  scene.add(room12Lock);
  [-4.8, -2.88, -0.96, 0.96, 2.88, 4.8].forEach((offset, index) => {
    buildArtwork({ ...roomSource(11, index * 2), id: `room-11-west-${index + 1}`, index: `11.W${index + 1} / 12`, position: [-ROOM.width / 2 + 0.12, 3.35, 39.7 + offset], rotationY: Math.PI / 2, width: 1.5, height: 1.72, wall: "left" }, scene, interactive, true);
    buildArtwork({ ...roomSource(11, index * 2 + 1), id: `room-11-east-${index + 1}`, index: `11.E${index + 1} / 12`, position: [ROOM.width / 2 - 0.12, 3.35, 39.7 + offset], rotationY: -Math.PI / 2, width: 1.5, height: 1.72, wall: "right" }, scene, interactive, true);
  });
  const room12Label = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.42), new THREE.MeshBasicMaterial({ map: makeRoomLabelTexture(12, 0xb2769a), transparent: true }));
  room12Label.position.set(0, 3.4, 45.0);
  scene.add(room12Label);
  const finalFloor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width, 11), floorMaterial);
  finalFloor.rotation.x = -Math.PI / 2;
  finalFloor.position.set(0, 0, 50.7);
  scene.add(finalFloor);
  const finalCeiling = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width, 11), ceilingMaterial);
  finalCeiling.rotation.x = Math.PI / 2;
  finalCeiling.position.set(0, ROOM.height, 50.7);
  scene.add(finalCeiling);
  addWall(scene, new THREE.BoxGeometry(0.18, ROOM.height, 11), [-ROOM.width / 2, ROOM.height / 2, 50.7], wallMaterial);
  addWall(scene, new THREE.BoxGeometry(0.18, ROOM.height, 11), [ROOM.width / 2, ROOM.height / 2, 50.7], wallMaterial);
  addWall(scene, new THREE.BoxGeometry(ROOM.width, ROOM.height, 0.18), [0, ROOM.height / 2, 56.2], wallMaterial);
  [-4.35, 0, 4.35].forEach((offset, index) => {
    buildArtwork({ ...roomSource(12, index === 1 ? 4 : index), id: `room-12-south-${index + 1}`, index: `12.S${index + 1} / 07`, position: [offset, 3.35, 56.08], rotationY: Math.PI, width: 2.1, height: 2.35, wall: "primary" }, scene, interactive, true);
  });
  [-3.65, 3.65].forEach((offset, index) => {
    buildArtwork({ ...roomSource(12, 1 + index), id: `room-12-west-${index + 1}`, index: `12.W${index + 1} / 07`, position: [-ROOM.width / 2 + 0.12, 3.35, 50.7 + offset], rotationY: Math.PI / 2, width: 1.5, height: 1.72, wall: "left" }, scene, interactive, true);
    buildArtwork({ ...roomSource(12, 2 + index), id: `room-12-east-${index + 1}`, index: `12.E${index + 1} / 07`, position: [ROOM.width / 2 - 0.12, 3.35, 50.7 + offset], rotationY: -Math.PI / 2, width: 1.5, height: 1.72, wall: "right" }, scene, interactive, true);
  });
  addMuseumBench(scene, [0, 0, 52.95]);
  addGalleryAccent(scene, interactive, -5.5, 54.75, 0xb2769a);
}

function buildSideRooms(scene: THREE.Scene, interactive: THREE.Object3D[]) {
  const rooms = [
    { number: 5, side: 1 as const, centerX: 13.25, width: 10.5, palette: ROOM_PALETTES[4], source: ARTWORKS[0] },
    { number: 6, side: 1 as const, centerX: 23.75, width: 10.5, palette: ROOM_PALETTES[5], source: ARTWORKS[1] },
    { number: 7, side: -1 as const, centerX: -13.25, width: 10.5, palette: ROOM_PALETTES[3], source: ARTWORKS[2] },
    { number: 8, side: -1 as const, centerX: -23.75, width: 10.5, palette: ROOM_PALETTES[6], source: ARTWORKS[0] },
    { number: 9, side: -1 as const, centerX: -34.25, width: 10.5, palette: ROOM_PALETTES[2], source: ARTWORKS[1] },
  ];
  rooms.forEach((room) => {
    const wallMaterial = makeWallMaterial(room.palette.wall);
    const roomLeft = room.centerX - room.width / 2;
    const roomRight = room.centerX + room.width / 2;
    const innerBoundary = room.side === 1 ? roomLeft : roomRight;
    const outerBoundary = room.side === 1 ? roomRight : roomLeft;

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(room.width, SIDE_ROOM.depth), makeMaterial(room.palette.floor, 0.32, 0.04));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(room.centerX, 0, 0);
    floor.receiveShadow = true;
    scene.add(floor);
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(room.width, SIDE_ROOM.depth), makeMaterial(0xe5e1da, 0.92));
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(room.centerX, ROOM.height, 0);
    scene.add(ceiling);

    // Every numbered room is a complete volume. Only its inner doorway is open.
    addSideSegmentedWall(scene, innerBoundary, 0, SIDE_ROOM.depth, ROOM.height, 3.6, wallMaterial, room.side === 1);
    const hasNextRoom = room.number === 5 || room.number === 7 || room.number === 8;
    if (hasNextRoom) addSideSegmentedWall(scene, outerBoundary, 0, SIDE_ROOM.depth, ROOM.height, 3.6, wallMaterial, room.side === 1);
    else addWall(scene, new THREE.BoxGeometry(0.18, ROOM.height, SIDE_ROOM.depth), [outerBoundary, ROOM.height / 2, 0], wallMaterial);
    addWall(scene, new THREE.BoxGeometry(room.width, ROOM.height, 0.18), [room.centerX, ROOM.height / 2, -SIDE_ROOM.depth / 2], wallMaterial);
    addWall(scene, new THREE.BoxGeometry(room.width, ROOM.height, 0.18), [room.centerX, ROOM.height / 2, SIDE_ROOM.depth / 2], wallMaterial);

    const artX = outerBoundary - room.side * 0.12;
    const wallPlan = NUMBERED_ROOM_WALL_PLAN[room.number as keyof typeof NUMBERED_ROOM_WALL_PLAN] as { posters: Record<string, number> };
    const outerCount = wallPlan.posters[room.side === 1 ? "east" : "west"];
    // Shared walls between sequential rooms keep the center clear so the
    // connecting doorway and its approach never compete with a poster.
    const sharedWithNextRoom = room.number === 5 || room.number === 7 || room.number === 8;
    const outerPositions = outerCount === 2 || sharedWithNextRoom ? [-3.15, 3.15] : [-3.15, 0, 3.15];
    outerPositions.forEach((artZ, artIndex) => {
      buildArtwork({ ...roomSource(room.number, artIndex), id: `room-${room.number}-art-${artIndex + 1}`, index: `${room.number}.${artIndex + 1} / 09`, position: [artX, 3.18, artZ], rotationY: room.side === -1 ? Math.PI / 2 : -Math.PI / 2, width: 2.35, height: 2.7, wall: room.side === -1 ? "left" : "right" }, scene, interactive);
    });
    [-4.2, -2.1, 0, 2.1, 4.2].forEach((artXOffset, index) => {
      buildArtwork({ ...roomSource(room.number, index), id: `room-${room.number}-north-${index + 1}`, index: `${room.number}.N${index + 1} / 11`, position: [room.centerX + artXOffset, 3.35, -SIDE_ROOM.depth / 2 + 0.12], rotationY: Math.PI, width: 1.5, height: 1.72, wall: "primary" }, scene, interactive, true);
      buildArtwork({ ...roomSource(room.number, index + 2), id: `room-${room.number}-south-${index + 1}`, index: `${room.number}.S${index + 1} / 11`, position: [room.centerX + artXOffset, 3.35, SIDE_ROOM.depth / 2 - 0.12], rotationY: 0, width: 1.5, height: 1.72, wall: "primary" }, scene, interactive, true);
    });
    const roomLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.32), new THREE.MeshBasicMaterial({ map: makeRoomLabelTexture(room.number, room.palette.accent), transparent: true }));
    roomLabel.position.set(artX, 5.65, 0);
    roomLabel.rotation.y = room.side === -1 ? Math.PI / 2 : -Math.PI / 2;
    scene.add(roomLabel);
    addMuseumBench(scene, [room.centerX, 0, room.side === 1 ? -2.15 : 2.15], room.side === 1 ? 0 : Math.PI);
    addRoomCeilingBays(scene, room.centerX, 0, room.width, SIDE_ROOM.depth);
    addRoomLighting(scene, room.centerX, 0, room.width, SIDE_ROOM.depth);
  });
}

function addVelvetRopes(scene: THREE.Scene) {
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x22211f, roughness: 0.28, metalness: 0.42 });
  const velvetMaterial = new THREE.MeshStandardMaterial({ color: 0x4b2636, roughness: 0.74, metalness: 0.02 });
  const positions = [-1.72, 1.72];
  positions.forEach((x) => {
    [6.7, 9.4].forEach((z) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.1, 0.92, 16), postMaterial);
      post.position.set(x, 0.46, z);
      scene.add(post);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.25, 0.06, 24), postMaterial);
      base.position.set(x, 0.03, z);
      scene.add(base);
    });
    const ropeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, 0.78, 6.7),
      new THREE.Vector3(x, 0.58, 8.05),
      new THREE.Vector3(x, 0.78, 9.4),
    ]);
    const rope = new THREE.Mesh(new THREE.TubeGeometry(ropeCurve, 16, 0.035, 8, false), velvetMaterial);
    scene.add(rope);
  });
}

function addSegmentedWall(
  scene: THREE.Scene,
  z: number,
  width: number,
  height: number,
  opening: number,
  material: THREE.Material,
) {
  const segment = (width - opening) / 2;
  addWall(scene, new THREE.BoxGeometry(segment, height, 0.16), [-(opening / 2 + segment / 2), height / 2, z], material);
  addWall(scene, new THREE.BoxGeometry(segment, height, 0.16), [(opening / 2 + segment / 2), height / 2, z], material);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(opening, height - ARCH_HEIGHT, 0.2), material);
  lintel.position.set(0, ARCH_HEIGHT + (height - ARCH_HEIGHT) / 2, z);
  scene.add(lintel);
}

function buildExtendedRooms(scene: THREE.Scene, interactive: THREE.Object3D[]) {
  const charcoal = makeMaterial(0x2b2927, 0.4, 0.12);
  const roomW = EXTENDED_ROOM.width;
  const roomD = EXTENDED_ROOM.depth;
  const opening = 4.8;
  const hallW = CORRIDOR.width;
  const hallH = ROOM.height;

  [...EXTENDED_LAYOUT, ...SATELLITE_LAYOUT].forEach((layout) => {
    const palette = ROOM_PALETTES[layout.palette];
    const roomOpening = layout.room === 2 || layout.room === 3 ? 3.0 : opening;
    const wallMaterial = makeWallMaterial(palette.wall);
    const floorMaterial = makeMaterial(palette.floor, 0.34, 0.04);
    const ceilingMaterial = makeMaterial(0xe5e1da, 0.92);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomD), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(layout.x, 0, layout.z);
    floor.receiveShadow = true;
    scene.add(floor);
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomD), ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(layout.x, ROOM.height, layout.z);
    scene.add(ceiling);

    const left = layout.x - roomW / 2;
    const right = layout.x + roomW / 2;
    const top = layout.z - roomD / 2;
    const bottom = layout.z + roomD / 2;
    addWall(scene, new THREE.BoxGeometry(0.18, ROOM.height, roomD), [left, ROOM.height / 2, layout.z], wallMaterial);
    addWall(scene, new THREE.BoxGeometry(0.18, ROOM.height, roomD), [right, ROOM.height / 2, layout.z], wallMaterial);
    if (layout.openings.some((direction) => String(direction) === "north")) addSegmentedWall(scene, top, roomW, ROOM.height, roomOpening, wallMaterial);
    else addWall(scene, new THREE.BoxGeometry(roomW, ROOM.height, 0.18), [layout.x, ROOM.height / 2, top], wallMaterial);
    if (layout.openings.some((direction) => String(direction) === "south")) addSegmentedWall(scene, bottom, roomW, ROOM.height, roomOpening, wallMaterial);
    else addWall(scene, new THREE.BoxGeometry(roomW, ROOM.height, 0.18), [layout.x, ROOM.height / 2, bottom], wallMaterial);
    if (layout.openings.some((direction) => String(direction) === "east")) addSideSegmentedWall(scene, right, layout.z, roomD, ROOM.height, roomOpening, wallMaterial, true);
    if (layout.openings.some((direction) => String(direction) === "west")) addSideSegmentedWall(scene, left, layout.z, roomD, ROOM.height, roomOpening, wallMaterial, false);

    addRoomThreshold(scene, layout.x, layout.z, palette.accent, layout.openings, roomW, roomD, roomOpening, charcoal);
    addRoomCeilingBays(scene, layout.x, layout.z, roomW, roomD);
    addRoomArtworkSet(scene, interactive, layout.room, layout.x, layout.z, left, right, bottom, layout.openings);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.32), new THREE.MeshBasicMaterial({ map: makeRoomLabelTexture(layout.room, palette.accent), transparent: true }));
    label.position.set(left + 0.12, 3.2, layout.z - 0.1);
    label.rotation.y = Math.PI / 2;
    scene.add(label);
  });

  const roomThreeTenConnector = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3.0), makeMaterial(0xffffff, 0.34, 0.03));
  roomThreeTenConnector.rotation.x = -Math.PI / 2;
  roomThreeTenConnector.position.set(7.75, 0, 28.7);
  roomThreeTenConnector.receiveShadow = true;
  scene.add(roomThreeTenConnector);
  const roomThreeTenCeiling = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3.0), makeMaterial(0xe4e0d8, 0.92));
  roomThreeTenCeiling.rotation.x = Math.PI / 2;
  roomThreeTenCeiling.position.set(7.75, ROOM.height, 28.7);
  scene.add(roomThreeTenCeiling);

  // Orthogonal circulation spine: short halls with ceilings and side walls, not a single open tunnel.
  const connectors: Array<{ x: number; z: number; w: number; d: number; horizontal: boolean }> = [];
  connectors.forEach(({ x, z, w, d, horizontal }) => {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), makeMaterial(0xffffff, 0.34, 0.03));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(x, 0, z);
    floor.receiveShadow = true;
    scene.add(floor);
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(w, d), makeMaterial(0xe4e0d8, 0.92));
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(x, ROOM.height, z);
    scene.add(ceiling);
    if (horizontal) {
      addWall(scene, new THREE.BoxGeometry(0.16, hallH, d), [x - w / 2, hallH / 2, z], makeWallMaterial(0xf8f6f8));
      addWall(scene, new THREE.BoxGeometry(0.16, hallH, d), [x + w / 2, hallH / 2, z], makeWallMaterial(0xf8f6f8));
    } else {
      addWall(scene, new THREE.BoxGeometry(w, hallH, 0.16), [x, hallH / 2, z - d / 2], makeWallMaterial(0xf8f6f8));
      addWall(scene, new THREE.BoxGeometry(w, hallH, 0.16), [x, hallH / 2, z + d / 2], makeWallMaterial(0xf8f6f8));
    }
  });
}

function addRoomArtworkSet(scene: THREE.Scene, interactive: THREE.Object3D[], roomNumber: number, x: number, z: number, left: number, right: number, bottom: number, openings: readonly string[]) {
  const hasSouthOpening = openings.some((direction) => String(direction) === "south");
  const hasEastOpening = openings.some((direction) => String(direction) === "east");
  const hasWestOpening = openings.some((direction) => String(direction) === "west");
  const note = EXHIBITION[roomNumber]?.note ?? "A room set apart for looking closely.";
  const make = (source: Artwork, suffix: string, position: [number, number, number], rotationY: number, wall: Artwork["wall"], width: number, height: number, mini = false) => {
    buildArtwork({ ...source, id: `room-${roomNumber}-${suffix}`, index: `${suffix} / 11`, note, position, rotationY, wall, width, height }, scene, interactive, mini);
  };
  if (hasEastOpening || hasWestOpening) {
    const posterWallX = hasEastOpening ? left + 0.12 : right - 0.12;
    const posterRotation = hasEastOpening ? Math.PI / 2 : -Math.PI / 2;
    const posterWall = hasEastOpening ? "left" : "right";
    [-3.1, 0, 3.1].forEach((offset, index) => {
      make(roomSource(roomNumber, index), `outer-0${index + 1}`, [posterWallX, 3.25, z + offset], posterRotation, posterWall, 2.35, 2.8);
    });
    [-3.1, 0, 3.1].forEach((offset, index) => {
      make(roomSource(roomNumber, index), `north-0${index + 1}`, [x + offset, 3.35, z - EXTENDED_ROOM.depth / 2 + 0.12], Math.PI, "primary", 1.65, 1.9, true);
      make(roomSource(roomNumber, index + 3), `south-0${index + 1}`, [x + offset, 3.35, bottom - 0.12], 0, "primary", 1.65, 1.9, true);
    });
  } else if (hasSouthOpening) {
    make(roomSource(roomNumber, 0), "01", [left + 0.12, 3.25, z - 1.7], Math.PI / 2, "left", 2.35, 2.8);
    make(roomSource(roomNumber, 1), "02", [left + 0.12, 3.25, z + 1.7], Math.PI / 2, "left", 2.35, 2.8);
    make(roomSource(roomNumber, 2), "03", [right - 0.12, 3.25, z - 1.7], -Math.PI / 2, "right", 2.35, 2.8);
    make(roomSource(roomNumber, 3), "04", [right - 0.12, 3.25, z + 1.7], -Math.PI / 2, "right", 2.35, 2.8);
  } else if (roomNumber === 3) {
    make(roomSource(roomNumber, 0), "01", [x - 2.25, 3.25, bottom - 0.12], Math.PI, "primary", 2.7, 2.8);
    make(roomSource(roomNumber, 1), "02", [x + 2.25, 3.25, bottom - 0.12], Math.PI, "primary", 2.7, 2.8);
    make(roomSource(roomNumber, 2), "03", [left + 0.12, 3.25, z], Math.PI / 2, "left", 2.7, 3.1);
  } else {
    make(roomSource(roomNumber, 0), "01", [x - 2.15, 3.25, bottom - 0.12], Math.PI, "primary", 2.55, 2.55);
    make(roomSource(roomNumber, 1), "02", [x + 2.15, 3.25, bottom - 0.12], Math.PI, "primary", 2.55, 2.55);
    make(roomSource(roomNumber, 2), "03", [left + 0.12, 3.25, z], Math.PI / 2, "left", 2.5, 2.9);
    make(roomSource(roomNumber, 3), "04", [right - 0.12, 3.25, z], -Math.PI / 2, "right", 2.5, 2.9);
  }
}

function addSideSegmentedWall(scene: THREE.Scene, x: number, z: number, depth: number, height: number, opening: number, material: THREE.Material, east: boolean) {
  const archMaterial = material instanceof THREE.MeshStandardMaterial
    ? new THREE.MeshStandardMaterial({ color: material.color, roughness: 0.86, metalness: 0.01 })
    : material;
  const segment = (depth - opening) / 2;
  const first = z - opening / 2 - segment / 2;
  const second = z + opening / 2 + segment / 2;
  const geometry = new THREE.BoxGeometry(0.18, height, segment);
  addWall(scene, geometry, [x, height / 2, first], archMaterial);
  addWall(scene, geometry, [x, height / 2, second], archMaterial);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.22, height - ARCH_HEIGHT, opening), archMaterial);
  lintel.position.set(x, ARCH_HEIGHT + (height - ARCH_HEIGHT) / 2, z);
  scene.add(lintel);
  void east;
}

function addArchOpeningWall(scene: THREE.Scene, x: number, z: number, depth: number, height: number, opening: number, material: THREE.Material) {
  addSideSegmentedWall(scene, x, z, depth, height, opening, material, x > 0);
}

function addRoomThreshold(scene: THREE.Scene, x: number, z: number, accentColor: number, openings: readonly string[], roomW: number, roomD: number, opening: number, charcoal: THREE.Material) {
  const accent = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.56 });
  openings.forEach((direction) => {
    const horizontal = direction === "north" || direction === "south";
    const threshold = new THREE.Mesh(new THREE.BoxGeometry(horizontal ? opening : 0.38, 0.035, horizontal ? 0.38 : opening), charcoal);
    threshold.position.set(x + (direction === "east" ? roomW / 2 : direction === "west" ? -roomW / 2 : 0), 0.018, z + (direction === "south" ? roomD / 2 : direction === "north" ? -roomD / 2 : 0));
    scene.add(threshold);
    const accentMesh = new THREE.Mesh(new THREE.BoxGeometry(horizontal ? 0.05 : 0.38, 0.012, horizontal ? 0.38 : 0.05), accent);
    accentMesh.position.set(threshold.position.x, 0.044, threshold.position.z);
    scene.add(accentMesh);
  });
}

function addRoomCeilingBays(scene: THREE.Scene, x: number, z: number, roomW: number, roomD: number) {
  const material = new THREE.MeshStandardMaterial({ color: 0xf8f5ef, roughness: 0.92 });
  for (let index = -1; index <= 1; index += 1) {
    const bay = new THREE.Mesh(new THREE.BoxGeometry(3.25, 0.025, roomD - 1), material);
    bay.position.set(x + index * 3.7, ROOM.height - 0.035, z);
    scene.add(bay);
  }
  void roomW;
}

function makeRoomLabelTexture(roomNumber: number, accent: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 520;
  canvas.height = 140;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.CanvasTexture(canvas);
  context.fillStyle = "#f1eee8";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#2b2927";
  context.font = "600 24px DM Sans, sans-serif";
  context.fillText(`ROOM ${String(roomNumber).padStart(2, "0")}`, 20, 48);
  context.fillStyle = "#77736d";
  context.font = "18px DM Sans, sans-serif";
  context.fillText(roomTitle(roomNumber).toUpperCase(), 20, 82);
  context.fillStyle = `#${accent.toString(16).padStart(6, "0")}`;
  context.fillRect(20, 106, 32, 4);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeFloorPlanTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 470;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.CanvasTexture(canvas);
  context.fillStyle = "#f1eee8";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "#2b2927";
  context.lineWidth = 7;
  const rooms = [
    [40, 178, 190, 160], [265, 178, 190, 160], [455, 178, 190, 160],
  ];
  rooms.forEach(([x, y, width, height], index) => {
    context.strokeRect(x, y, width, height);
    context.fillStyle = index === 0 ? "#c2b4d8" : "#77736d";
    context.font = "600 22px DM Sans, sans-serif";
    context.fillText(String(index + 1).padStart(2, "0"), x + 16, y + 31);
  });
  context.strokeStyle = "#b9a8d2";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(230, 258); context.lineTo(265, 258);
  context.stroke();
  context.fillStyle = "#2b2927";
  context.font = "600 21px DM Sans, sans-serif";
  context.fillText("EXHIBITION 22 / THREE ROOM PLAN", 34, 42);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeWayfindingTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 560;
  canvas.height = 150;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.CanvasTexture(canvas);
  context.fillStyle = "#f1eee8";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#2b2927";
  context.font = "600 26px DM Sans, sans-serif";
  context.fillText("ROOM 01", 22, 50);
  context.fillStyle = "#77736d";
  context.font = "20px DM Sans, sans-serif";
  context.fillText("FIRST LIGHT", 22, 91);
  context.fillStyle = "#c2b4d8";
  context.fillRect(22, 116, 34, 4);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addRoomLighting(scene: THREE.Scene, x: number, z: number, width: number, depth: number) {
  const fixtureMaterial = new THREE.MeshStandardMaterial({ color: 0x252421, roughness: 0.28, metalness: 0.35 });
  const spots: Array<{ position: [number, number, number]; target: [number, number, number] }> = [
    { position: [x, 6.45, z], target: [x, 0, z] },
  ];
  spots.forEach(({ position, target }) => {
    const spot = new THREE.SpotLight(0xffead7, 9, 12, 0.62, 0.96, 1.05);
    spot.position.set(...position);
    spot.target.position.set(...target);
    spot.castShadow = false;
    scene.add(spot, spot.target);
    const fixture = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.12, 0.17, 12), fixtureMaterial);
    fixture.position.set(...position);
    fixture.rotation.x = Math.PI / 2;
    scene.add(fixture);
  });

  // Broad overhead pools make the room readable; the artwork spots remain the brightest layer.
  [0].forEach((offset) => {
    const overhead = new THREE.PointLight(0xffeddf, 5.5, 8.5, 1.8);
    overhead.position.set(x + offset, ROOM.height - 0.35, z);
    overhead.castShadow = false;
    scene.add(overhead);
    const ceilingGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.24, 0.055, 24), fixtureMaterial);
    ceilingGlow.position.set(x + offset, ROOM.height - 0.08, z);
    scene.add(ceilingGlow);
  });
}

function buildLighting(scene: THREE.Scene) {
  const fill = new THREE.HemisphereLight(0xfff8ee, 0x756453, 0.68);
  scene.add(fill);

  const wash = new THREE.DirectionalLight(0xffead8, 0.18);
  wash.position.set(0, 6.7, 2.5);
  wash.target.position.set(0, 2.5, -2);
  wash.castShadow = true;
  wash.shadow.mapSize.set(512, 512);
  wash.shadow.camera.near = 0.5;
  wash.shadow.camera.far = 22;
  wash.shadow.camera.left = -10;
  wash.shadow.camera.right = 10;
  wash.shadow.camera.top = 8;
  wash.shadow.camera.bottom = -2;
  scene.add(wash, wash.target);

  addRoomLighting(scene, 0, 0, ROOM.width, ROOM.depth);
  [...EXTENDED_LAYOUT, ...SATELLITE_LAYOUT].forEach((layout) => addRoomLighting(scene, layout.x, layout.z, EXTENDED_ROOM.width, EXTENDED_ROOM.depth));
  addRoomLighting(scene, 0, 39.7, ROOM.width, 11);
  addRoomLighting(scene, 0, 50.7, ROOM.width, 11);

  for (let index = 0; index < 3; index += 1) {
    const corridorLight = new THREE.SpotLight(0xffead7, 8, 8.5, 0.58, 0.95, 1.05);
    corridorLight.position.set(0, 6.35, ROOM.depth / 2 + 1.45 + index * 1.8);
    corridorLight.target.position.set(0, 0, corridorLight.position.z);
    scene.add(corridorLight, corridorLight.target);
  }

}

function clampInterior(position: THREE.Vector3, includeSecret = false, includeFinal = false) {
  const rects = [
    { minX: -ROOM.width / 2 + 0.78, maxX: ROOM.width / 2 - 0.78, minZ: -ROOM.depth / 2 + 0.78, maxZ: ROOM.depth / 2 + 0.25 },
    { minX: -39.5, maxX: -7.22, minZ: -SIDE_ROOM.depth / 2 + 0.78, maxZ: SIDE_ROOM.depth / 2 - 0.78 },
    { minX: ROOM.width / 2 - 0.78, maxX: 29.0, minZ: -SIDE_ROOM.depth / 2 + 0.78, maxZ: SIDE_ROOM.depth / 2 - 0.78 },
    { minX: -CORRIDOR.width / 2 + 0.62, maxX: CORRIDOR.width / 2 - 0.62, minZ: ROOM.depth / 2 - 0.5, maxZ: ROOM.depth / 2 + CORRIDOR.depth + 0.25 },
    { minX: 6.95, maxX: 8.85, minZ: 27.2, maxZ: 30.2 },
    ...[...EXTENDED_LAYOUT, ...SATELLITE_LAYOUT].map((layout) => ({ minX: layout.x - EXTENDED_ROOM.width / 2 + 0.78, maxX: layout.x + EXTENDED_ROOM.width / 2 - 0.78, minZ: layout.z - EXTENDED_ROOM.depth / 2 - 0.25, maxZ: layout.z + EXTENDED_ROOM.depth / 2 + 0.25 })),
    ...(includeSecret ? [{ minX: -ROOM.width / 2 + 0.78, maxX: ROOM.width / 2 - 0.78, minZ: 34.0, maxZ: 44.42 }] : []),
    ...(includeFinal ? [{ minX: -ROOM.width / 2 + 0.78, maxX: ROOM.width / 2 - 0.78, minZ: 45.0, maxZ: 55.42 }] : []),
  ];
  const containing = rects.find((rect) => position.x >= rect.minX && position.x <= rect.maxX && position.z >= rect.minZ && position.z <= rect.maxZ);
  const target = containing ?? rects.reduce((closest, rect) => {
    const dx = Math.max(rect.minX - position.x, 0, position.x - rect.maxX);
    const dz = Math.max(rect.minZ - position.z, 0, position.z - rect.maxZ);
    const distance = dx * dx + dz * dz;
    return distance < closest.distance ? { rect, distance } : closest;
  }, { rect: rects[0], distance: Number.POSITIVE_INFINITY }).rect;
  position.x = THREE.MathUtils.clamp(position.x, target.minX, target.maxX);
  position.z = THREE.MathUtils.clamp(position.z, target.minZ, target.maxZ);
  position.y = EYE_HEIGHT;
  return position;
}

function PlaneGeometry(width: number, height: number) {
  return new THREE.PlaneGeometry(width, height);
}

type PendingFrameMedia = { dataUrl: string; kind: "image" | "video"; name: string };
type PendingFramePlacement = PendingFrameMedia & { title: string; note: string; year: string };
type FrameDetailsForm = { title: string; note: string; year: string };

export default function MuseumExperience() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [hoveredArtwork, setHoveredArtwork] = useState<Artwork | null>(null);
  const [complimentVisible, setComplimentVisible] = useState(false);
  const [hasExplored, setHasExplored] = useState(false);
  const [isAdmissionOpen, setIsAdmissionOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentRoom, setCurrentRoom] = useState("ROOM 01");
  const [mapPlayer, setMapPlayer] = useState({ x: 0, z: 4.35, yaw: 0 });
  const [visitedRooms, setVisitedRooms] = useState<string[]>([]);
  const [guide, setGuide] = useState({ arrow: "↑", label: "ROOM 02" });
  const [secretUnlocked, setSecretUnlocked] = useState(false);
  const [showUnlockNotice, setShowUnlockNotice] = useState(false);
  // Add-frame flow: pick a photo/video -> fill in the caption card -> click a
  // wall to place it. pendingFrameMedia holds the file while the details form
  // is open; pendingFramePlacementRef is what "click a wall" actually reads.
  const [pendingFrameMedia, setPendingFrameMedia] = useState<PendingFrameMedia | null>(null);
  const [pendingFrameDetails, setPendingFrameDetails] = useState<FrameDetailsForm>({ title: "", note: "", year: String(new Date().getFullYear()) });
  const [isPlacingFrame, setIsPlacingFrame] = useState(false);
  const pendingFramePlacementRef = useRef<PendingFramePlacement | null>(null);
  // Move flow: select a frame, press "Move frame", click any wall to drop it there.
  const [movingFrameId, setMovingFrameId] = useState<string | null>(null);
  const movingFrameIdRef = useRef<string | null>(null);
  const [editDetails, setEditDetails] = useState<FrameDetailsForm>({ title: "", note: "", year: "" });
  const visitedRoomsRef = useRef(new Set<string>());
  const secretUnlockedRef = useRef(false);
  const customFrameGroupsRef = useRef(new Map<string, THREE.Group>());
  const secretDoorRef = useRef<THREE.Object3D | null>(null);
  const room12DoorRef = useRef<THREE.Object3D | null>(null);
  const mapTargetRef = useRef<{ x: number; z: number } | null>(null);

  useEffect(() => {
    if (!selectedArtwork) return;
    setEditDetails({ title: selectedArtwork.title, note: selectedArtwork.note, year: selectedArtwork.year });
  }, [selectedArtwork]);

  const armNewFrame = (file: File | undefined) => {
    if (!file || (!file.type.startsWith("image/") && !file.type.startsWith("video/"))) return;
    const kind: "image" | "video" = file.type.startsWith("video/") ? "video" : "image";
    const reader = new FileReader();
    reader.onload = () => {
      setPendingFrameMedia({ dataUrl: String(reader.result), kind, name: file.name });
      setPendingFrameDetails({ title: "", note: "", year: String(new Date().getFullYear()) });
    };
    reader.readAsDataURL(file);
  };

  const cancelPendingFrame = () => {
    setPendingFrameMedia(null);
    setIsPlacingFrame(false);
    pendingFramePlacementRef.current = null;
  };

  const confirmPendingFrameDetails = () => {
    if (!pendingFrameMedia) return;
    pendingFramePlacementRef.current = { ...pendingFrameMedia, ...pendingFrameDetails, title: pendingFrameDetails.title.trim() || "Untitled" };
    setIsPlacingFrame(true);
  };

  const exportSavedFrames = () => {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), frames: readSavedFrames() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "anagha-gallery-saved-frames.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const persistFrame = (id: string, patch: Partial<SavedFrame>) => {
    writeSavedFrames(readSavedFrames().map((frame) => (frame.id === id ? { ...frame, ...patch } : frame)));
  };

  const persistSelectedFrameTransform = (group: THREE.Group) => {
    if (!selectedArtwork?.custom) return;
    persistFrame(selectedArtwork.id, {
      position: [group.position.x, group.position.y, group.position.z],
      rotationY: group.rotation.y,
      frameScale: group.scale.x,
    });
  };

  const resizeCustomFrame = (factor: number) => {
    if (!selectedArtwork?.custom) return;
    const group = customFrameGroupsRef.current.get(selectedArtwork.id);
    if (!group) return;
    group.scale.multiplyScalar(factor);
    persistSelectedFrameTransform(group);
  };

  const startMoveFrame = () => {
    if (!selectedArtwork?.custom) return;
    movingFrameIdRef.current = selectedArtwork.id;
    setMovingFrameId(selectedArtwork.id);
  };

  const cancelMoveFrame = () => {
    movingFrameIdRef.current = null;
    setMovingFrameId(null);
  };

  const toggleHideCaption = () => {
    if (!selectedArtwork?.custom) return;
    const group = customFrameGroupsRef.current.get(selectedArtwork.id);
    const nextHidden = !selectedArtwork.hideCaption;
    const label = group?.userData.labelMesh as THREE.Mesh | undefined;
    if (label) label.visible = !nextHidden;
    if (group) {
      const nextArtwork = { ...(group.userData.artwork as Artwork), hideCaption: nextHidden };
      group.userData.artwork = nextArtwork;
      const image = group.userData.imageMesh as THREE.Object3D | undefined;
      if (image) image.userData.artwork = nextArtwork;
    }
    persistFrame(selectedArtwork.id, { hideCaption: nextHidden });
    setSelectedArtwork({ ...selectedArtwork, hideCaption: nextHidden });
  };

  const saveFrameDetails = () => {
    if (!selectedArtwork?.custom) return;
    const nextArtwork: Artwork = { ...selectedArtwork, title: editDetails.title.trim() || "Untitled", note: editDetails.note.trim(), year: editDetails.year.trim() };
    const group = customFrameGroupsRef.current.get(selectedArtwork.id);
    const label = group?.userData.labelMesh as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | undefined;
    if (label) {
      label.material.map?.dispose();
      const texture = makeLabelTexture(nextArtwork);
      label.material.map = texture;
      label.material.needsUpdate = true;
    }
    if (group) {
      group.userData.artwork = nextArtwork;
      const image = group.userData.imageMesh as THREE.Object3D | undefined;
      if (image) image.userData.artwork = nextArtwork;
    }
    persistFrame(selectedArtwork.id, { title: nextArtwork.title, note: nextArtwork.note, year: nextArtwork.year });
    setSelectedArtwork(nextArtwork);
  };

  const deleteSelectedFrame = () => {
    if (!selectedArtwork?.custom) return;
    const group = customFrameGroupsRef.current.get(selectedArtwork.id);
    group?.parent?.remove(group);
    customFrameGroupsRef.current.delete(selectedArtwork.id);
    writeSavedFrames(readSavedFrames().filter((frame) => frame.id !== selectedArtwork.id));
    setSelectedArtwork(null);
    setHoveredArtwork(null);
    if (movingFrameIdRef.current === selectedArtwork.id) cancelMoveFrame();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf6f3f5);
    scene.fog = new THREE.Fog(0xf6f3f5, 22, 70);

    const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 85);
    camera.position.set(0, EYE_HEIGHT, 4.35);
    camera.rotation.set(-0.035, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;

    const interactive: THREE.Object3D[] = [];
    buildRoom(scene, interactive, secretDoorRef, room12DoorRef);
    buildLighting(scene);
    customFrameGroupsRef.current.clear();
    readSavedFrames().forEach((savedFrame) => {
      const group = buildArtwork(savedFrame, scene, interactive);
      if (group) {
        if (savedFrame.frameScale) group.scale.setScalar(savedFrame.frameScale);
        customFrameGroupsRef.current.set(savedFrame.id, group);
      }
    });

    const targetPosition = new THREE.Vector3(0, EYE_HEIGHT, 4.35);
    const targetYaw = { value: 0 };
    const targetPitch = { value: -0.035 };
    let yaw = 0;
    let pitch = -0.035;
    let lastRoomLabel = "ROOM 01";
    let pointerDown = false;
    let dragMoved = false;
    let lastX = 0;
    let lastY = 0;
    const pointers = new Map<number, { x: number; y: number }>();
    const keys = new Set<string>();
    let pinchDistance = 0;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lastMapUpdate = 0;
    let lastNearbyScan = 0;
    let lastGuideKey = "";

    const facingDirection = () => new THREE.Vector3(-Math.sin(targetYaw.value), 0, -Math.cos(targetYaw.value));
    const strafeDirection = () => new THREE.Vector3(Math.cos(targetYaw.value), 0, -Math.sin(targetYaw.value));

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")) return;
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
        event.preventDefault();
        keys.add(event.code);
        setHasExplored(true);
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      keys.delete(event.code);
    };

    const onPointerDown = (event: PointerEvent) => {
      canvas.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      pointerDown = true;
      dragMoved = false;
      lastX = event.clientX;
      lastY = event.clientY;
      if (pointers.size === 2) {
        const [first, second] = Array.from(pointers.values());
        pinchDistance = Math.hypot(first.x - second.x, first.y - second.y);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!pointerDown) {
        const bounds = canvas.getBoundingClientRect();
        pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hoverHit = raycaster.intersectObjects(interactive, true).find((intersection) => intersection.object.userData.artworkId);
        setHoveredArtwork((hoverHit?.object.userData.artwork as Artwork | undefined) ?? null);
        return;
      }
      const previous = pointers.get(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size >= 2) {
        const [first, second] = Array.from(pointers.values());
        const nextDistance = Math.hypot(first.x - second.x, first.y - second.y);
        if (pinchDistance > 0) {
          const delta = nextDistance - pinchDistance;
          targetPosition.add(facingDirection().multiplyScalar(delta * 0.012));
          clampInterior(targetPosition, true, secretUnlockedRef.current);
        }
        pinchDistance = nextDistance;
        setHasExplored(true);
        return;
      }
      if (!previous) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      if (Math.abs(dx) + Math.abs(dy) > 2) dragMoved = true;
      targetYaw.value -= dx * 0.00245;
      lastX = event.clientX;
      lastY = event.clientY;
      setHasExplored(true);
    };

    const onPointerUp = (event: PointerEvent) => {
      const wasClick = pointerDown && !dragMoved && pointers.size === 1;
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinchDistance = 0;
      pointerDown = pointers.size > 0;
      if (wasClick) {
        const bounds = canvas.getBoundingClientRect();
        pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(scene.children, true).find((intersection) => intersection.object.userData.artworkId || intersection.object.userData.galleryWall);
        if (hit?.object.userData.galleryWall && movingFrameIdRef.current) {
          const movingId = movingFrameIdRef.current;
          const group = customFrameGroupsRef.current.get(movingId);
          if (group) {
            const normal = hit.face?.normal.clone().transformDirection(hit.object.matrixWorld).normalize() ?? new THREE.Vector3(0, 0, 1);
            const rotationY = Math.atan2(normal.x, normal.z);
            const position = hit.point.clone().addScaledVector(normal, 0.08);
            position.y = THREE.MathUtils.clamp(position.y, 1.05, ROOM.height - 1.05);
            group.position.copy(position);
            group.rotation.y = rotationY;
            const current = group.userData.artwork as Artwork;
            const updated: Artwork = { ...current, position: [position.x, position.y, position.z], rotationY };
            group.userData.artwork = updated;
            const image = group.userData.imageMesh as THREE.Object3D | undefined;
            if (image) image.userData.artwork = updated;
            persistFrame(movingId, { position: updated.position, rotationY });
            setSelectedArtwork(updated);
          }
          movingFrameIdRef.current = null;
          setMovingFrameId(null);
        } else if (hit?.object.userData.artworkId) {
          const artwork = hit.object.userData.artwork as Artwork | undefined;
          if (artwork) setSelectedArtwork(artwork);
        } else if (hit?.object.userData.galleryWall && pendingFramePlacementRef.current) {
          const pending = pendingFramePlacementRef.current;
          const normal = hit.face?.normal.clone().transformDirection(hit.object.matrixWorld).normalize() ?? new THREE.Vector3(0, 0, 1);
          const rotationY = Math.atan2(normal.x, normal.z);
          const position = hit.point.clone().addScaledVector(normal, 0.08);
          position.y = THREE.MathUtils.clamp(position.y, 1.05, ROOM.height - 1.05);
          const id = `custom-${Date.now()}`;
          const artwork: Artwork = {
            id,
            index: "CUSTOM",
            title: pending.title,
            year: pending.year,
            medium: pending.kind === "video" ? "Video" : "Photo",
            note: pending.note,
            image: pending.kind === "image" ? pending.dataUrl : "",
            videoSrc: pending.kind === "video" ? pending.dataUrl : undefined,
            position: [position.x, position.y, position.z],
            rotationY,
            width: 2.6,
            height: 2.6,
            wall: "primary",
            custom: true,
          };
          const group = buildArtwork(artwork, scene, interactive);
          if (group) customFrameGroupsRef.current.set(id, group);
          if (!writeSavedFrames([...readSavedFrames(), artwork])) {
            window.alert("That file is too large to save on this device. Try a smaller photo or a shorter clip.");
          }
          pendingFramePlacementRef.current = null;
          setPendingFrameMedia(null);
          setIsPlacingFrame(false);
          setSelectedArtwork(artwork);
        }
      }
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      targetPosition.add(facingDirection().multiplyScalar(-event.deltaY * 0.0023));
      clampInterior(targetPosition, true, secretUnlockedRef.current);
      setHasExplored(true);
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", onResize);

    let frame = 0;
    let lastRenderTime = 0;
    const animate = (time = 0) => {
      frame = window.requestAnimationFrame(animate);
      if (time - lastRenderTime < 33.33) return;
      lastRenderTime = time;
      if (mapTargetRef.current) {
        targetPosition.set(mapTargetRef.current.x, EYE_HEIGHT, mapTargetRef.current.z);
        clampInterior(targetPosition, true, secretUnlockedRef.current);
        mapTargetRef.current = null;
        setHasExplored(true);
      }
      const forward = keys.has("KeyW") || keys.has("ArrowUp") ? 1 : keys.has("KeyS") || keys.has("ArrowDown") ? -1 : 0;
      const strafe = keys.has("KeyD") || keys.has("ArrowRight") ? 1 : keys.has("KeyA") || keys.has("ArrowLeft") ? -1 : 0;
      if (forward || strafe) {
        const moveSpeed = reducedMotion ? 0.11 : 0.072;
        targetPosition.add(facingDirection().multiplyScalar(forward * moveSpeed));
        targetPosition.add(strafeDirection().multiplyScalar(strafe * moveSpeed));
        clampInterior(targetPosition, true, secretUnlockedRef.current);
      }
      const nearestRoom = ROOM_GUIDE_TARGETS
        .map((room) => ({ room, distance: Math.hypot(targetPosition.x - room.x, targetPosition.z - room.z) }))
        .reduce((closest, current) => current.distance < closest.distance ? current : closest, { room: ROOM_GUIDE_TARGETS[0], distance: Number.POSITIVE_INFINITY });
      if (nearestRoom.distance < 5.8 && !visitedRoomsRef.current.has(nearestRoom.room.id)) {
        visitedRoomsRef.current.add(nearestRoom.room.id);
        setVisitedRooms(Array.from(visitedRoomsRef.current));
        if (visitedRoomsRef.current.size === ROOM_GUIDE_TARGETS.length) {
          secretUnlockedRef.current = true;
          setSecretUnlocked(true);
          setShowUnlockNotice(true);
          if (secretDoorRef.current) {
            secretDoorRef.current.parent?.remove(secretDoorRef.current);
            secretDoorRef.current = null;
          }
          if (room12DoorRef.current) {
            room12DoorRef.current.parent?.remove(room12DoorRef.current);
            room12DoorRef.current = null;
          }
        }
      }
      const unexplored = ROOM_GUIDE_TARGETS.find((room) => !visitedRoomsRef.current.has(room.id));
      if (unexplored) {
        const dx = unexplored.x - targetPosition.x;
        const dz = unexplored.z - targetPosition.z;
        const forward = -Math.sin(targetYaw.value) * dx - Math.cos(targetYaw.value) * dz;
        const right = Math.cos(targetYaw.value) * dx - Math.sin(targetYaw.value) * dz;
        const angle = Math.atan2(right, forward);
        const arrow = Math.abs(angle) < 0.38 ? "↑" : Math.abs(angle) > 2.76 ? "↓" : angle > 0 ? "→" : "←";
        const nextGuide = { arrow, label: unexplored.label };
        const guideKey = `${nextGuide.arrow}:${nextGuide.label}`;
        if (guideKey !== lastGuideKey) {
          lastGuideKey = guideKey;
          setGuide(nextGuide);
        }
      } else {
        if (lastGuideKey !== "↑:SECRET ROOM 12 UNLOCKED") {
          lastGuideKey = "↑:SECRET ROOM 12 UNLOCKED";
          setGuide({ arrow: "↑", label: "SECRET ROOM 12 UNLOCKED" });
        }
      }
      const nextRoomLabel = targetPosition.z > 45 ? "ROOM 12" : nearestRoom.distance < 5.8 ? nearestRoom.room.label : targetPosition.x < -8.2 ? "WEST WING" : targetPosition.x > 8.2 ? "EAST WING" : targetPosition.z < 5.5 ? "ROOM 01" : targetPosition.z < 12.6 ? "CORRIDOR" : "ROOM 03";
      if (nextRoomLabel !== lastRoomLabel) {
        lastRoomLabel = nextRoomLabel;
        setCurrentRoom(nextRoomLabel);
      }
      const now = performance.now();
      if (now - lastNearbyScan > 110) {
        lastNearbyScan = now;
        let nearCompliment = false;
        for (const object of interactive) {
          if (object.userData.complimentStatue) {
            const statuePosition = new THREE.Vector3();
            object.getWorldPosition(statuePosition);
            if (Math.hypot(targetPosition.x - statuePosition.x, targetPosition.z - statuePosition.z) < 3.65) {
              nearCompliment = true;
              object.visible = false;
            }
          }
        }
        setComplimentVisible(nearCompliment);
      }
      if (now - lastMapUpdate > 90) {
        lastMapUpdate = now;
        setMapPlayer({ x: targetPosition.x, z: targetPosition.z, yaw: targetYaw.value });
      }
      const positionLerp = reducedMotion ? 0.18 : 0.075;
      const rotationLerp = reducedMotion ? 0.25 : 0.095;
      camera.position.lerp(targetPosition, positionLerp);
      yaw += (targetYaw.value - yaw) * rotationLerp;
      pitch += (targetPitch.value - pitch) * rotationLerp;
      camera.rotation.set(pitch, yaw, 0);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frame);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", onResize);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshBasicMaterial) {
              material.map?.dispose();
            }
            material.dispose();
          });
        }
      });
      renderer.dispose();
    };
  }, []);

  return (
    <main className="museum-shell" aria-label="Interactive three-room digital museum">
      <canvas ref={canvasRef} className="museum-canvas" aria-label="Three-dimensional gallery room. Drag to look around." />
      {!isAdmissionOpen && <AdmissionTicket onOpened={() => { setIsAdmissionOpen(true); setShowWelcome(true); }} />}
      <div className="museum-ui">
        <header className="museum-masthead">
          <span className="museum-mark" aria-hidden="true" />
          <div>
            <p className="museum-title">Anagha’s Art Gallery</p>
          <p className="museum-subtitle">A digital exhibition / {currentRoom.toLowerCase()}</p>
          </div>
        </header>

        <div className="museum-room-meta" aria-hidden="true">
          <strong>{currentRoom}</strong>
          <span>{currentRoom === "CORRIDOR" ? "Architectural passage" : "Exhibition space"}</span>
        </div>

        <div className={`room-guide ${secretUnlocked ? "is-unlocked" : ""}`} aria-live="polite">
          <span className="room-guide-arrow" aria-hidden="true">{guide.arrow}</span>
          <span className="room-guide-copy"><strong>{guide.label}</strong><small>{secretUnlocked ? "A hidden door is waiting" : `${visitedRooms.length} / 11 rooms explored`}</small></span>
        </div>

        {showUnlockNotice && (
          <aside className="unlock-notice" role="status" aria-live="assertive">
            <button className="unlock-notice-close" type="button" aria-label="Dismiss notification" onClick={() => setShowUnlockNotice(false)}>×</button>
            <span className="unlock-notice-kicker">CONGRATULATIONS, ANAGHA</span>
            <strong>A new room has opened for the exhibit.</strong>
            <span>Continue through Room 11 to discover Room 12.</span>
          </aside>
        )}

        {showWelcome && (
          <aside className="welcome-notice" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
            <button className="welcome-notice-close" type="button" aria-label="Close curator welcome" onClick={() => setShowWelcome(false)}>×</button>
            <span className="welcome-notice-kicker">A NOTE FROM THE CURATOR</span>
            <h1 id="welcome-title">Welcome to Anagha’s Art Gallery.</h1>
            <p>Take your time. Drag around to look closely, use <strong>WASD</strong> or the touch controls to move, and tap the mini map to find your way through the rooms.</p>
            <p>Every wall holds a small part of the story. When you’ve visited all eleven rooms, a final door will open for the exhibit.</p>
            <button className="welcome-notice-enter" type="button" onClick={() => setShowWelcome(false)}>Begin exploring</button>
          </aside>
        )}

        <aside className="mini-map" aria-label="Gallery map">
          <div className="mini-map-heading">
            <span>Gallery map</span>
            <strong>{currentRoom}</strong>
          </div>
          <div className="mini-map-frame" onClick={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            const mapX = (event.clientX - bounds.left) / bounds.width;
            const mapY = (event.clientY - bounds.top) / bounds.height;
            let x = 0;
            let z = 4.35;
            if (mapX > 0.28 && mapX < 0.74 && mapY < 0.30 && secretUnlocked) {
              z = 50.7;
            } else if (mapX > 0.28 && mapX < 0.74 && mapY < 0.48) {
              z = 39.7;
            } else if (mapX > 0.76 && mapY > 0.48 && mapY < 0.64) {
              x = 15.5;
              z = 28.7;
            } else if (mapX < 0.3) {
              x = mapY > 0.66 ? -13.25 : mapY > 0.34 ? -23.75 : -34.25;
              z = 0;
            } else if (mapX > 0.7) {
              x = mapY > 0.5 ? 13.25 : 23.75;
              z = 0;
            } else if (mapY < 0.28) {
              x = 0;
              z = 28.7;
            } else if (mapY < 0.55) {
              x = 0;
              z = 17.7;
            } else {
              x = 0;
              z = 0;
            }
            mapTargetRef.current = { x, z };
          }}>
            <svg className="mini-map-svg" viewBox="0 0 180 300" role="img" aria-label="Map of Anagha’s exhibition rooms">
              <g className="mini-map-final-suite">
                <rect className="mini-map-floor mini-map-room-eleven" x="48" y="95" width="84" height="42" rx="2" />
                {secretUnlocked && <rect className="mini-map-floor mini-map-room-twelve" x="48" y="46" width="84" height="42" rx="2" />}
                <rect className="mini-map-floor mini-map-room-ten" x="138" y="145" width="42" height="42" rx="2" />
                <path className="mini-map-route" d="M90 145 L90 137 M90 95 L90 88 M132 166 L138 166 M90 166 L132 166" />
                <text className="mini-map-label" x="55" y="121">11</text>
                {secretUnlocked && <text className="mini-map-label mini-map-secret-label" x="55" y="72">12</text>}
                <text className="mini-map-label" x="145" y="170">10</text>
              </g>
              <g transform="translate(0 145) scale(1 0.66)">
              <rect className="mini-map-floor mini-map-side-room" x="0" y="161" width="42" height="69" rx="2" />
              <rect className="mini-map-floor mini-map-side-room" x="0" y="88" width="42" height="69" rx="2" />
              <rect className="mini-map-floor mini-map-side-room" x="0" y="15" width="42" height="69" rx="2" />
              <rect className="mini-map-floor" x="48" y="161" width="84" height="69" rx="2" />
              <rect className="mini-map-floor mini-map-side-room" x="138" y="161" width="42" height="69" rx="2" />
              <rect className="mini-map-floor mini-map-side-room" x="138" y="88" width="42" height="69" rx="2" />
              <rect className="mini-map-corridor" x="70" y="126" width="40" height="38" rx="2" />
              <rect className="mini-map-floor mini-map-room-two" x="48" y="63" width="84" height="63" rx="2" />
              <rect className="mini-map-floor mini-map-room-three" x="48" y="0" width="84" height="63" rx="2" />
              <path className="mini-map-route" d="M90 221 L90 165 L90 126 L90 63 L90 9 M48 195 L42 195 M132 195 L138 195 M21 161 L21 84 M159 161 L159 88" />
              {[{ x: 90, y: 202 }, { x: 21, y: 195 }, { x: 21, y: 122 }, { x: 21, y: 48 }, { x: 159, y: 195 }, { x: 159, y: 122 }, { x: 55, y: 94 }, { x: 125, y: 94 }, { x: 55, y: 31 }, { x: 125, y: 31 }].map((point, index) => (
                <circle key={index} className="mini-map-art" cx={point.x} cy={point.y} r="3" />
              ))}
              <text className="mini-map-label" x="16" y="177">01</text>
              <text className="mini-map-label" x="16" y="79">02</text>
              <text className="mini-map-label" x="16" y="16">03</text>
              <text className="mini-map-label" x="53" y="121">04</text>
              <text className="mini-map-wing-label" x="8" y="211">07</text>
              <text className="mini-map-wing-label" x="8" y="138">08</text>
              <text className="mini-map-wing-label" x="8" y="65">09 ↑</text>
              <text className="mini-map-wing-label" x="145" y="211">05</text>
              <text className="mini-map-wing-label" x="145" y="138">06</text>
              </g>
            </svg>
            <span
              className="mini-map-player"
              style={{ left: `${4 + Math.max(0, Math.min(1, (mapPlayer.x + 40) / 71)) * 92}%`, top: `${mapPlayer.z >= 28.7 ? 55 - Math.max(0, Math.min(1, (mapPlayer.z - 28.7) / 22)) * 33 : 84 - Math.max(0, Math.min(1, mapPlayer.z / 28.7)) * 18}%`, transform: `translate(-50%, -50%) rotate(${mapPlayer.yaw}rad)` }}
              aria-hidden="true"
            >
              <span />
            </span>
          </div>
          <div className="mini-map-legend"><span className="mini-map-legend-dot" /> artworks <span className="mini-map-legend-player" /> you</div>
        </aside>

        <div className={`explore-hint ${hasExplored ? "is-hidden" : ""}`}>
          <span className="explore-hint-line" aria-hidden="true" />
          <span>Drag to explore</span>
        </div>

        <div className="museum-footer" aria-hidden="true">WASD / touch to move · drag to look</div>

        {!pendingFrameMedia && !isPlacingFrame && (
          <label className="frame-add-tool">
            <span>+ Add frame</span>
            <input type="file" accept="image/*,video/*" onChange={(event) => armNewFrame(event.target.files?.[0])} />
          </label>
        )}
        {movingFrameId && (
          <div className="frame-add-tool frame-add-tool-active" role="status">
            <span>Click any wall to move this frame</span>
            <button type="button" onClick={cancelMoveFrame}>Cancel</button>
          </div>
        )}
        {isPlacingFrame && (
          <div className="frame-add-tool frame-add-tool-active" role="status">
            <span>Click a wall to place your frame</span>
            <button type="button" onClick={cancelPendingFrame}>Cancel</button>
          </div>
        )}
        <button type="button" className="frame-export-tool" onClick={exportSavedFrames}>Export saved frames</button>

        {pendingFrameMedia && !isPlacingFrame && (
          <aside className="frame-details-modal" role="dialog" aria-modal="true" aria-labelledby="frame-details-title">
            <button className="artwork-close" type="button" aria-label="Cancel adding frame" onClick={cancelPendingFrame}>×</button>
            <h2 id="frame-details-title">Add a caption card</h2>
            {pendingFrameMedia.kind === "image"
              ? <img className="frame-details-preview" src={pendingFrameMedia.dataUrl} alt="Selected upload" />
              : <video className="frame-details-preview" src={pendingFrameMedia.dataUrl} autoPlay muted loop playsInline />}
            <label>Name<input value={pendingFrameDetails.title} onChange={(event) => setPendingFrameDetails((current) => ({ ...current, title: event.target.value }))} placeholder="Name this piece" maxLength={60} autoFocus /></label>
            <label>Caption<textarea value={pendingFrameDetails.note} onChange={(event) => setPendingFrameDetails((current) => ({ ...current, note: event.target.value }))} placeholder="A line about it…" maxLength={200} /></label>
            <label>Year<input value={pendingFrameDetails.year} onChange={(event) => setPendingFrameDetails((current) => ({ ...current, year: event.target.value }))} placeholder="2026" maxLength={9} /></label>
            <button type="button" className="frame-details-confirm" onClick={confirmPendingFrameDetails}>Place on wall</button>
          </aside>
        )}

        {complimentVisible && (
          <div className="compliment-note" role="status" aria-live="polite">happy birthday!<br /><span>-from jeff, bj, rj, chad, steve and kesha</span></div>
        )}

        {hoveredArtwork && !selectedArtwork && (
          <div className="poster-card poster-card-hover" aria-label={`${hoveredArtwork.title} artwork information`}>
            <div className="poster-card-copy">
              <strong>{hoveredArtwork.title}</strong>
              <span>{hoveredArtwork.note || "Your photo"}</span>
              <em>{hoveredArtwork.year}</em>
            </div>
          </div>
        )}
        {selectedArtwork && (
          <aside className="artwork-panel" aria-label={`${selectedArtwork.title} catalogue information`}>
            <button className="artwork-close" type="button" aria-label="Close artwork information" onClick={() => setSelectedArtwork(null)}>
              ×
            </button>
            <div className="artwork-index">{selectedArtwork.index} · Catalogue note</div>
            <h1 className="artwork-title">{selectedArtwork.title}</h1>
            <div className="artwork-meta">{selectedArtwork.year} &nbsp;·&nbsp; {selectedArtwork.medium}</div>
            {selectedArtwork.videoSrc
              ? <video className="artwork-video" src={selectedArtwork.videoSrc} autoPlay muted loop controls playsInline />
              : selectedArtwork.image && <img className="artwork-video artwork-uploaded-image" src={selectedArtwork.image} alt={selectedArtwork.title} />}
            {selectedArtwork.custom && <div className="frame-editor" aria-label="Frame controls">
              <strong>Frame controls</strong>
              <label>Name<input value={editDetails.title} onChange={(event) => setEditDetails((current) => ({ ...current, title: event.target.value }))} maxLength={60} /></label>
              <label>Caption<textarea value={editDetails.note} onChange={(event) => setEditDetails((current) => ({ ...current, note: event.target.value }))} maxLength={200} /></label>
              <label>Year<input value={editDetails.year} onChange={(event) => setEditDetails((current) => ({ ...current, year: event.target.value }))} maxLength={9} /></label>
              <button type="button" className="card-save" onClick={saveFrameDetails}>Save card</button>
              <div className="frame-editor-row">
                <button type="button" onClick={startMoveFrame} disabled={Boolean(movingFrameId)}>Move frame</button>
                <button type="button" onClick={toggleHideCaption}>{selectedArtwork.hideCaption ? "Show caption card" : "Hide caption card"}</button>
              </div>
              <div className="frame-editor-row"><button type="button" onClick={() => resizeCustomFrame(0.9)}>− Size</button><button type="button" onClick={() => resizeCustomFrame(1.1)}>＋ Size</button></div>
              <button type="button" className="frame-delete" onClick={deleteSelectedFrame}>Delete frame</button>
              <small>Saved on this device.</small>
            </div>}
          </aside>
        )}
      </div>
    </main>
  );
}
