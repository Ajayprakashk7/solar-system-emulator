// SolarSystem.tsx
'use client';
import { Suspense, Component, useMemo, ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { AnimatePresence } from "framer-motion";
import planetsData from "./lib/planetsData";
// @ts-ignore - JS component
import SceneBackground from "./SceneBackground";
// @ts-ignore - JS component
import Sun from "./celestial/Sun";
import Planet from "./celestial/Planet";
// @ts-ignore - JS component
import AsteroidBelt from "./celestial/AsteroidBelt";
// @ts-ignore - JS component
import CosmicDust from "./celestial/CosmicDust";
// @ts-ignore - JS util
import { getOptimalSettings } from "./utils/performanceOptimizer";
// @ts-ignore - JS component
import CameraController from "./motion/CameraController";
// @ts-ignore - JS component
import PlanetMenu from "./ui/PlanetMenu";
// @ts-ignore - JS component
import SpeedControl from "./ui/SpeedControl";
// @ts-ignore - JS component
import ExitButton from "./ui/ExitButton";
// @ts-ignore - JS component
import PlanetDetail from "./ui/PlanetDetail";
// @ts-ignore - JS component
import ControlMenu from "./ui/ControlMenu";
// @ts-ignore - JS component
import KeyboardHandler from "./ui/KeyboardHandler";
// @ts-ignore - JS component
import MobileGestureHandler from "./ui/MobileGestureHandler";
// @ts-ignore - JS component
import MobileInstructions from "./ui/MobileInstructions";
// @ts-ignore - JS component
import SceneLighting from "./SceneLighting";
// @ts-ignore - JS component
import IntroText from "./ui/IntroText";
// @ts-ignore - JS component
import SolarSystemProviders from "./SolarSystemProviders";
import { Scene3DErrorBoundary } from "./Scene3DErrorBoundary";
import { renderLogger } from '../../lib/logger';
import { PlanetData } from "./types";

interface SolarSystemErrorBoundaryProps {
  children: ReactNode;
}

interface SolarSystemErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface SolarSystemSettings {
  shadows: boolean | "basic" | "percentage" | "soft" | "variance" | undefined;
  pixelRatio: number;
  antialias: boolean;
  powerPreference: "high-performance" | "low-power" | "default";
  maxLights: number;
  asteroidCount: number;
  particleCount: number;
}

// Custom Error Boundary for the solar system
class SolarSystemErrorBoundary extends Component<SolarSystemErrorBoundaryProps, SolarSystemErrorBoundaryState> {
  constructor(props: SolarSystemErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): SolarSystemErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
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
  const settings = useMemo<SolarSystemSettings>(() => getOptimalSettings() as unknown as SolarSystemSettings, []);

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
                onError={(error) => { // R3F onError provides generic Error
                   // @ts-ignore - R3F type definition might conflict with generic Error
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
                  // @ts-ignore - wobble might be missing in PlanetProps or PlanetData interface if optional
                  wobble={planet.wobble}
                  rings={planet.rings}
                  // Removed displayStats to satisfy strict typing
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
