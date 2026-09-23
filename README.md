# 🌌 Solar System Emulator

> Interactive 3D solar-system visualization combining WebGL rendering, astronomical data, and real-time exploration.

<p align="center">
  <a href="https://solar-system-emulator.ajayprakash.dev/">🚀 Live Demo</a> ·
  <a href="https://github.com/Ajayprakashk7/solar-system-emulator/issues">🐛 Report Bug</a> ·
  <a href="https://github.com/Ajayprakashk7/solar-system-emulator/issues">✨ Request Feature</a>
</p>

## What this project demonstrates

This project is more than a visual demo. It explores how to build an interactive 3D experience in the browser while keeping rendering, API access, and UI state manageable.

## Highlights

- **3D solar system** with the Sun and all eight planets.
- **Moon systems** including Earth's Moon and selected major moons.
- **NASA APIs** for astronomical and exploration data.
- Interactive camera controls, planet selection, zoom, and simulation speed.
- Responsive touch interactions for mobile devices.
- Rendering optimizations such as memoization, LOD, and frustum-aware techniques.
- Mars Rover exploration mode as an interactive extra.

## Architecture

```text
Next.js App
    ↓
Interactive UI
    ↓
React Three Fiber
    ↓
Three.js / WebGL
    ↓
Planet + Moon Configuration
    ↓
NASA API Routes
    ↓
Astronomical / Rover Data
```

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 15, React 19 |
| Language | TypeScript |
| 3D | Three.js, React Three Fiber, Drei |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Data | NASA Open APIs |
| Deployment | Vercel |
| Quality | GitHub Actions / CI |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- NASA API key (optional)

### Installation

```bash
git clone https://github.com/Ajayprakashk7/solar-system-emulator.git
cd solar-system-emulator

npm install
cp .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`.

### NASA API

A NASA API key is optional. You can use `DEMO_KEY` for development or supply your own key through the environment file.

## Controls

| Action | Desktop | Mobile |
|---|---|---|
| Select | Click | Tap |
| Rotate | Click + drag | Swipe |
| Zoom | Scroll | Pinch |
| Speed | Slider | Slider |

## Project Structure

```text
app/          Next.js application and NASA API routes
components/   3D and UI components
config/       Planet and moon configuration
lib/          Utility and data functions
public/       Static assets
scripts/      Build and utility scripts
```

## Engineering Notes

The main technical challenge is balancing visual fidelity with browser performance. The project therefore separates celestial configuration from rendering code and uses optimization techniques to reduce unnecessary work.

For deeper implementation notes, see the repository documentation.

## Roadmap

- [ ] Time travel / historical sky simulation
- [ ] More astronomical datasets
- [ ] Improved accessibility controls
- [ ] Additional exploration modes

## License

MIT
