<div align="center">

# 🌌 Solar System Emulator

**Interactive 3D Solar System visualization with real NASA astronomical data**

[![CI](https://github.com/Ajayprakashk7/solar-system-emulator/actions/workflows/ci.yml/badge.svg)](https://github.com/Ajayprakashk7/solar-system-emulator/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?logo=three.js)](https://threejs.org/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://solar-system-emulator.ajayprakash.dev/)

[🚀 Live Demo](https://solar-system-emulator.ajayprakash.dev/) · [🐛 Report Bug](https://github.com/Ajayprakashk7/solar-system-emulator/issues/new?template=bug_report.md) · [✨ Request Feature](https://github.com/Ajayprakashk7/solar-system-emulator/issues/new?template=feature_request.md)

**Built by [Ajay Prakash](https://www.ajayprakash.dev)**

</div>

---

## ✨ Features

- 🪐 **Full 3D Solar System** — All 8 planets + the Sun with accurate scale and orbits
- 🌙 **Realistic Moon Systems** — Earth's Moon, Jupiter's Galilean moons, Saturn's 7 major moons, and more
- 🛸 **NASA Data Integration** — Real orbital periods, rotations, temperatures from NASA APIs (APOD, NEO, Mars Rover)
- 🎮 **Interactive Controls** — Click planets for details, drag to rotate, scroll to zoom, speed control
- 📱 **Mobile Optimized** — 55–60 FPS on desktop and mobile with touch/gesture support
- 💫 **Visual Effects** — Saturn rings, asteroid belt, auroras, cosmic dust storms
- 🔭 **Mars Rover Easter Egg** — Hidden Mars Rover exploration mode
- ⚡ **Performance Optimized** — Level of Detail (LOD), frustum culling, memoized components

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 15 + React 19 |
| Language | TypeScript |
| 3D Engine | Three.js, @react-three/fiber, @react-three/drei |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Data | NASA Open APIs |
| Deployment | Vercel |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- NASA API Key (optional but recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/Ajayprakashk7/solar-system-emulator.git
cd solar-system-emulator

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Add your NASA API key to .env.local

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### NASA API Setup (Optional)

1. Get a free API key at [https://api.nasa.gov/](https://api.nasa.gov/) (1000 req/hour)
2. Or use `DEMO_KEY` (30 req/hour, no signup required)
3. Add to `.env.local`:

```env
NEXT_PUBLIC_NASA_API_KEY=your_api_key_here
```

## 🎮 Controls

| Action | Desktop | Mobile |
|---|---|---|
| Select planet | Click | Tap |
| Rotate view | Click + drag | Swipe |
| Zoom | Scroll wheel | Pinch |
| Speed control | UI slider | UI slider |

## 📁 Project Structure

```
solar-system-emulator/
├── app/                    # Next.js App Router
│   ├── api/nasa/          # NASA API proxy routes
│   └── globals.css        # Global styles
├── components/            # React components
├── config/                # Planet/moon configuration data
├── lib/                   # Utility functions
├── public/                # Static assets
└── scripts/               # Build & utility scripts
```

## 🌐 Deployment

This project is optimized for [Vercel](https://vercel.com/):

```bash
npm install -g vercel
vercel --prod
```

Set the `NEXT_PUBLIC_NASA_API_KEY` environment variable in your Vercel dashboard.

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

---

<div align="center">

Made with ❤️ by **[Ajay Prakash](https://www.ajayprakash.dev)**

[📧 Email](mailto:ajayprakashk7@gmail.com) · [👨‍💼 LinkedIn](https://linkedin.com/in/ajayprakashk7) · [🐱 GitHub](https://github.com/Ajayprakashk7)

</div>
