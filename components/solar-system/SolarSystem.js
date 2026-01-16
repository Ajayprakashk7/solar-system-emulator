// SolarSystem.js
'use client';
import { Suspense, Component, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { AnimatePresence } from "framer-motion";
import planetsData from "./lib/planetsData";
import SceneBackground from "./SceneBackground";
import Sun from "./celestial/Sun";
import Planet from "./celestial/Planets";
import AsteroidBelt from "./celestial/AsteroidBelt";
import CosmicDust from "./celestial/CosmicDust";
import { getOptimalSettings } from "./utils/performanceOptimizer";
import CameraController from "./motion/CameraController";
import PlanetMenu from "./ui/PlanetMenu";
import SpeedControl from "./ui/SpeedControl";
import ExitButton from "./ui/ExitButton";
import PlanetDetail from "./ui/PlanetDetail";
import ControlMenu from "./ui/ControlMenu";
import KeyboardHandler from "./ui/KeyboardHandler";
import MobileGestureHandler from "./ui/MobileGestureHandler";
import MobileInstructions from "./ui/MobileInstructions";
import SceneLighting from "./SceneLighting";
import IntroText from "./ui/IntroText";
import SolarSystemProviders from "./SolarSystemProviders";
import { Scene3DErrorBoundary } from "./Scene3DErrorBoundary";
import { renderLogger } from '../../lib/logger';

// Custom Error Boundary for the solar system
class SolarSystemErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    renderLogger.error('Solar System Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full bg-black flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h2 className="text-white text-xl mb-4">Solar System Error</h2>
            <p className="text-gray-400 mb-6">
              The 3D solar system encountered an error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Reload
            </button>
            <div className="mt-4 text-xs text-gray-500">
              Error: {this.state.error?.message}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Loading component for Canvas content
function CanvasLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-blue-400">Loading 3D Scene...</p>
        <p className="text-gray-400 text-sm mt-2">This may take a moment...</p>
      </div>
    </div>
  );
}

export default function SolarSystem() {
  // Get optimal settings based on device capabilities (mobile-first)
  const settings = useMemo(() => getOptimalSettings(), []);

  return (
    <SolarSystemErrorBoundary>
      <SolarSystemProviders>
        <div className="w-full h-full bg-black relative">
          <Suspense fallback={<CanvasLoader />}>
            <Scene3DErrorBoundary>
              <Canvas 
                camera={{ position: [-100, 0, 100], fov: 75 }}
                shadows={settings.shadows}
                dpr={settings.pixelRatio}
                gl={{ 
                  antialias: settings.antialias,
                  alpha: false,
                  powerPreference: settings.powerPreference,
                  preserveDrawingBuffer: false,
                  stencil: false,
                }}
                onCreated={({ gl }) => {
                  gl.setClearColor('#000000', 1);
                }}
                onError={(error) => {
                  renderLogger.error('Canvas error:', error);
                }}
              >
              <CameraController />
              <SceneBackground texturePath="/images/background/stars_8k.webp" />
              <SceneLighting maxLights={settings.maxLights} />
              <Sun position={[0, 0, 0]} radius={planetsData.find(p => p.isSun)?.radius || 1} />
              <AsteroidBelt asteroidCount={settings.asteroidCount} />
              <CosmicDust particleCount={settings.particleCount} />
              {planetsData.filter(planet => !planet.isSun).map((planet) => (
                <Planet
                  key={planet.id}
                  id={planet.id}
                  name={planet.name}
                  texturePath={planet.texturePath}
                  position={planet.position}
                  radius={planet.radius}
                  rotationSpeed={planet.rotationSpeed}
                  tilt={planet.tilt}
                  orbitSpeed={planet.orbitSpeed}
                  moons={planet.moons}
                  wobble={planet.wobble}
                  rings={planet.rings}
                  displayStats={planet.displayStats}
                />
              ))}
            </Canvas>
          </Scene3DErrorBoundary>
          </Suspense>
          <PlanetMenu planets={planetsData} />
          <SpeedControl />
          <ExitButton />
          <KeyboardHandler />
          <MobileGestureHandler />
          <MobileInstructions />
          <AnimatePresence>
            <PlanetDetail />
          </AnimatePresence>
          <ControlMenu />
          <IntroText />
        </div>
      </SolarSystemProviders>
    </SolarSystemErrorBoundary>
  );
}
