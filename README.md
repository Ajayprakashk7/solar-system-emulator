# Solar System Emulator

Interactive 3D solar system visualization with real astronomical data.

## Tech Stack

- **Framework**: Next.js 15 with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **3D Graphics**: Three.js, @react-three/fiber, @react-three/drei
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- NASA API Key (optional but recommended)

### NASA API Setup (Optional)

This emulator integrates with NASA's APIs for enhanced realism:

1. **Get a free NASA API key:**
   - Visit [https://api.nasa.gov/](https://api.nasa.gov/)
   - Sign up for a free API key (1000 requests/hour)
   - Or use `DEMO_KEY` (limited to 30 requests/hour)

2. **Configure environment variables:**
   ```bash
   # Copy the example file
   cp .env.local.example .env.local
   
   # Edit .env.local and add your API key
   NEXT_PUBLIC_NASA_API_KEY=your_api_key_here
   ```

3. **NASA API Features:**
   - **APOD**: Dynamic space backgrounds (optional)
   - **NEO**: Real near-Earth object data for asteroid belt
   - **Mars Rover**: Photos when viewing Mars (easter egg)
   - All data is cached for 24 hours to minimize API calls

### Installation & Running

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Features

- **Full 3D solar system** with all 8 planets plus the Sun
- **Realistic moon systems** orbiting their parent planets:
  - Earth: Moon (tidally locked)
  - Mars: Phobos, Deimos
  - Jupiter: Io, Europa, Ganymede, Callisto (Galilean moons)
  - Saturn: Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Iapetus
  - Uranus: Miranda, Ariel, Umbriel, Titania, Oberon
  - Neptune: Triton (retrograde orbit), Proteus
  - Special effects: Io's volcanism, Europa's ice glow, Titan's atmosphere, Enceladus geysers
- **Real astronomical data** from NASA:
  - Accurate orbital periods and distances
  - Realistic planet rotations (including Venus retrograde)
  - Surface temperatures and atmospheric composition
  - Moon counts and planetary masses
  - Real moon orbital mechanics (including retrograde orbits like Triton)
- **Interactive controls:**
  - Click planets for detailed information
  - Drag to rotate view
  - Scroll to zoom in/out
  - Adjustable simulation speed (pause to ludicrous speed!)
- **Visual enhancements:**
  - Atmospheric glow for planets with atmospheres
  - Aurora effects on gas giants and Earth
  - Cloud layers for Venus and Earth
  - Dust storms on Mars
  - Polar ice caps
  - Saturn's iconic rings
  - Asteroid belt with 200-1000 asteroids
  - Cosmic dust particles
  - Moon orbital paths (subtle guides)
- **Mobile-first performance:**
  - Adaptive rendering (55-60 FPS on modern phones)
  - Touch gesture support (tap, swipe, pinch)
  - Optimized for low-end devices (35-45 FPS acceptable)
  - Battery-efficient rendering
  - Adaptive moon detail (16 segments mobile, 32 desktop)
- **NASA API integration:**
  - **Planet Images**: Real high-quality images from NASA Image and Video Library
  - **Educational Content**: Fun facts, active missions, and upcoming events
  - **Moon Information**: Detailed data and images for major moons
  - **Mars Rover Photos**: Latest images from active rovers
  - **Near-Earth Objects**: Real asteroid data for enhanced asteroid belt
  - **APOD**: Optional astronomy picture of the day backgrounds
  - **Smart Caching**: 24-hour cache for efficient API usage

## Controls

### Desktop
- **Click planet**: View detailed information
- **Left drag**: Rotate view
- **Scroll**: Zoom in/out
- **Speed control**: Click to cycle through speeds (Pause → Normal → Fast → Very Fast → Ludicrous)

### Mobile
- **Tap planet**: View details
- **Tap screen**: Exit detail view
- **Swipe left/right**: Navigate between planets (when planet selected)
- **Pinch**: Zoom in/out
- **Drag**: Rotate view
- **Speed button**: Tap to cycle speeds

### Keyboard (Desktop)
- **ESC**: Exit current view
- **Arrow keys**: Rotate view
- **+/-**: Zoom in/out

## Planet Data

Real astronomical data from NASA for all celestial bodies:

### Sun
- Type: G-type main-sequence star (Yellow dwarf)
- Surface temperature: 5,778 K
- Core temperature: 15 million °C
- Age: 4.6 billion years

### Terrestrial Planets
- **Mercury**: Fastest orbit (88 days), extreme temperature swings
- **Venus**: Retrograde rotation, thick CO₂ atmosphere, hottest planet
- **Earth**: Only known planet with life, moderate temperatures
- **Mars**: Thin atmosphere, polar ice caps, dust storms

### Gas Giants
- **Jupiter**: Largest planet, 95 moons, powerful magnetic field
- **Saturn**: Spectacular ring system, 146 moons
- **Uranus**: Tilted 98° on its side, retrograde rotation
- **Neptune**: Windiest planet, deep blue methane atmosphere

All planets include:
- Orbital period (Earth days)
- Distance from Sun (AU)
- Radius, mass, gravity
- Rotation period and axial tilt
- Number of moons
- Atmospheric composition
- Surface/atmospheric temperatures

## Deployment

This project is optimized for deployment on Vercel with mobile-first performance.

### Environment Variables (Production)

Set in Vercel dashboard:
```bash
NEXT_PUBLIC_NASA_API_KEY=your_production_api_key
```

### Performance Targets
- First Contentful Paint: <1.5s ✅
- Time to Interactive: <3s ✅
- Mobile FPS: 55-60 (modern), 35-45 (budget) ✅
- Desktop FPS: 60 ✅
- Lighthouse Score: >90 ✅

### Deploy to Vercel

```bash
vercel --prod
```

Or connect your GitHub repository to Vercel for automatic deployments.

## Technical Architecture

### Performance Optimizations
- **Adaptive rendering** based on device capabilities
- **Texture preloading** for smooth initial experience
- **Dynamic particle counts** (200-2000 based on device)
- **Pixel ratio capping** (1.5x mobile, 2x desktop)
- **Conditional shadows** (disabled on mobile)
- **Power preference** (low-power on mobile, high-performance on desktop)

### NASA API Integration
- **Smart caching** (24-hour duration)
- **Graceful degradation** (fallback to cached/procedural data)
- **Non-blocking** (async loading doesn't affect frame rate)
- **Rate-limit aware** (exponential backoff)

### Browser Compatibility
- Chrome/Edge: ✅ Full support
- Safari (iOS/macOS): ✅ Full support
- Firefox: ✅ Full support
- Samsung Internet: ✅ Full support

## Development

### Project Structure
```
solar-system-emulator/
├── app/                      # Next.js app directory
│   ├── page.tsx             # Main page with preloading
│   └── globals.css          # Global styles
├── components/solar-system/
│   ├── SolarSystem.js       # Main 3D scene with adaptive settings
│   ├── planetsData.js       # Astronomical data for all bodies
│   ├── celestial/           # 3D models (planets, asteroids, dust)
│   ├── contexts/            # State management (camera, speed, selection)
│   ├── ui/                  # Controls and info panels
│   ├── motion/              # Animation controllers
│   ├── services/            # NASA API integration
│   └── utils/               # Performance optimizer
└── public/images/           # Planet textures and backgrounds
```

### Tech Stack Details
- **Next.js 15** - React framework with app router
- **React 19** - Latest React features
- **Three.js 0.177** - 3D graphics engine
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for R3F
- **Framer Motion** - Smooth UI animations
- **Tailwind CSS** - Utility-first styling

### Performance Monitoring
```javascript
import { getOptimalSettings } from './components/solar-system/utils/performanceOptimizer';

const settings = getOptimalSettings();
console.log('Device capabilities:', settings);
// {
//   pixelRatio: 1.5,
//   shadows: false,
//   particleCount: 1000,
//   asteroidCount: 500,
//   ...
// }
```

## Related Projects

- [Main Portfolio](https://ajayprakash.dev) - Portfolio Website
- [A.T.O.M AI](https://atom.ajayprakash.dev) - AI Assistant


## License

MIT
