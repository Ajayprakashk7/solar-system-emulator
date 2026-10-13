# 🌌 Solar System Emulator

> Interactive 3D solar-system visualization built with Next.js, React Three Fiber, Three.js, NASA data, and JPL orbital mechanics.

<p align="center">
  <a href="https://solar-system.ajayprakash.dev/">🚀 Live Demo</a> ·
  <a href="https://github.com/Ajayprakashk7/solar-system-emulator/issues">🐛 Report Bug</a> ·
  <a href="https://github.com/Ajayprakashk7/solar-system-emulator/issues">✨ Request Feature</a>
</p>

## Highlights

- Interactive Sun, eight planets, and selected major moons.
- JPL-derived Keplerian planet positions, eccentric/inclined orbit paths, and a shared Julian-date simulation clock.
- Planet rotations and displayed major-moon orbital periods preserve real relative timing, including retrograde motion.
- Smooth camera navigation, planet selection, zoom, and simulation speed controls.
- Responsive mouse, touch, and keyboard interaction across desktop, tablet, and mobile.
- Shareable deep links for celestial bodies.
- NASA-backed server routes for imagery and astronomical data without exposing API keys to the browser.
- Adaptive rendering for lower-end devices, reduced-motion preferences, data-saver environments, and active camera motion.
- Rendering optimizations including memoization, lazy moon systems, streamed texture boundaries, instancing/culling, reduced per-frame allocations, and device-aware quality settings.
- Accessible controls, focus states, modal keyboard isolation, and screen-reader-friendly labels.

## Scientific Model

Planet positions use the approximate Keplerian elements and rates published by **JPL Solar System Dynamics**, including the additional long-period correction terms for Jupiter through Neptune. The approximation is intended for interactive astronomical visualization; applications that need mission-grade ephemerides should use JPL Horizons.

The simulation intentionally separates **physical relationships** from **display scale**:

- Orbital eccentricity, inclination, orientation, direction, and relative period are physically grounded.
- Planet axial rotation uses the reference sidereal rotation periods used by the facts panel.
- Selected major moons use real sidereal orbital periods; Triton's orbit is represented as retrograde.
- The asteroid belt follows a representative main-belt orbital period rather than an arbitrary frame-time animation.
- Planet radii, moon radii, and interplanetary distances remain visually compressed so all major bodies can be explored in one usable scene. A literally 1:1 size-and-distance model would make the planets effectively invisible at Solar System scale.

Reference values shown in the detail panel remain in real-world units.

## Architecture

```text
Next.js App Router
    ↓
Responsive UI + interaction state
    ↓
React Three Fiber
    ↓
Three.js / WebGL
    ↓
JPL-derived simulation model
    ↓
Server-side NASA data routes
```

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 15, React 19 |
| Language | TypeScript + JavaScript |
| 3D | Three.js, React Three Fiber, Drei |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Science/Data | JPL Solar System Dynamics, NASA Open APIs, NASA Image and Video Library |
| Quality | ESLint, TypeScript, GitHub Actions |

## Getting Started

### Requirements

- Node.js 22+
- npm
- A modern WebGL-capable browser
- NASA API key (optional)

### Installation

```bash
git clone https://github.com/Ajayprakashk7/solar-system-emulator.git
cd solar-system-emulator
npm ci
cp .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`.

A NASA API key is optional. Add one to `.env.local` as `NASA_API_KEY`; otherwise the app falls back to NASA's limited `DEMO_KEY`. Never expose the key through a `NEXT_PUBLIC_*` variable.

## Quality Checks

Before opening a pull request, run:

```bash
npm run lint
npm run typecheck
npm run build
```

CI performs the same validation on Node.js 22.

## Controls

| Action | Desktop | Mobile |
|---|---|---|
| Select body | Click | Tap |
| Rotate view | Click + drag | Swipe |
| Zoom | Scroll | Pinch |
| Simulation speed | Speed control | Speed control |
| Keyboard shortcuts | Supported | — |

Global shortcuts are suspended while modal interfaces are open so background navigation cannot fire accidentally.

## Project Structure

```text
app/          Next.js application and NASA API routes
components/   3D scene, physics, interaction, and UI components
config/       Configuration
lib/          Shared utilities, validation, logging, and API helpers
public/       Static assets
scripts/      Utility scripts
```

## Repository Workflow

`main` is the only long-lived branch. Use one short-lived branch per task, one pull request per task, require green CI, and delete the branch immediately after merge or abandonment. See [`docs/BRANCHING.md`](docs/BRANCHING.md).

## Engineering Notes

The project prioritizes a focused exploration experience rather than feature quantity. Changes should improve scientific clarity, interaction quality, performance, accessibility, or maintainability without turning the interface into a collection of unrelated panels and experiments.

## License

MIT