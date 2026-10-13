// SolarSystem.js
'use client';

import { Component, Suspense, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import planetsData from './lib/planetsData';
import SceneBackground from './SceneBackground';
import Sun from './celestial/Sun';
import Planet from './celestial/Planets';
import AsteroidBelt from './celestial/AsteroidBelt';
import CosmicDust from './celestial/CosmicDust';
import { getOptimalSettings } from './utils/performanceOptimizer';
import CameraController from './motion/CameraController';
import PlanetMenu from './ui/PlanetMenu';
import SpeedControl from './ui/SpeedControl';
import ExitButton from './ui/ExitButton';
import PlanetDetail from './ui/PlanetDetail';
import ControlMenu from './ui/ControlMenu';
import KeyboardHandler from './ui/KeyboardHandler';
import MobileInstructions from './ui/MobileInstructions';
import DeepLinkHandler from './ui/DeepLinkHandler';
import SceneLighting from './SceneLighting';
import IntroText from './ui/IntroText';
import SolarSystemProviders from './SolarSystemProviders';
import { Scene3DErrorBoundary } from './Scene3DErrorBoundary';
import { renderLogger } from '../../lib/logger';

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
        <div className="flex h-full w-full items-center justify-center bg-black p-4">
          <div className="mx-auto max-w-md text-center" role="alert">
            <div aria-hidden="true" className="mb-4 text-6xl text-red-400">
              ⚠️
            </div>
            <h2 className="mb-3 text-xl font-semibold text-white">The 3D scene stopped</h2>
            <p className="mb-6 text-sm text-gray-300">
              Your browser hit a rendering error. Reloading the scene usually restores it.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-11 rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Reload scene
            </button>
            {this.state.error?.message && (
              <p className="mt-4 break-words text-xs text-gray-500">
                {this.state.error.message}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function CanvasLoader() {
  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center bg-black"
      role="status"
      aria-live="polite"
    >
      <div className="text-center">
        <div
          aria-hidden="true"
          className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-b-blue-400"
        />
        <p className="text-sm font-medium text-blue-300">Loading 3D scene…</p>
      </div>
    </div>
  );
}

const planets = planetsData.filter((planet) => !planet.isSun);
const sunRadius = planetsData.find((planet) => planet.isSun)?.radius || 1;

export default function SolarSystem() {
  const settings = useMemo(() => getOptimalSettings(), []);

  const glConfig = useMemo(
    () => ({
      antialias: settings.antialias,
      alpha: false,
      powerPreference: settings.powerPreference,
      preserveDrawingBuffer: false,
      stencil: false,
      depth: true,
      logarithmicDepthBuffer: false,
    }),
    [settings.antialias, settings.powerPreference]
  );

  const handleCreated = useCallback(({ gl }) => {
    gl.setClearColor('#000000', 1);
    gl.toneMapping = 0;
    gl.toneMappingExposure = 1;
  }, []);

  return (
    <SolarSystemErrorBoundary>
      <SolarSystemProviders>
        <main className="relative h-full w-full overflow-hidden bg-black">
          <Suspense fallback={<CanvasLoader />}>
            <Scene3DErrorBoundary>
              <Canvas
                camera={{ position: [-100, 0, 100], fov: 75 }}
                shadows={settings.shadows}
                dpr={settings.pixelRatio}
                gl={glConfig}
                performance={{ min: 0.5, max: 1, debounce: 200 }}
                flat
                onCreated={handleCreated}
              >
                <CameraController />
                <SceneBackground texturePath="/images/background/stars_8k.webp" />
                <SceneLighting maxLights={settings.maxLights} />
                <Sun position={[0, 0, 0]} radius={sunRadius} />
                <AsteroidBelt asteroidCount={settings.asteroidCount} />
                <CosmicDust particleCount={settings.particleCount} />
                {planets.map((planet) => (
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

          <DeepLinkHandler />
          <PlanetMenu planets={planetsData} />
          <SpeedControl />
          <ExitButton />
          <KeyboardHandler />
          <MobileInstructions />
          <PlanetDetail />
          <ControlMenu />
          <IntroText />
        </main>
      </SolarSystemProviders>
    </SolarSystemErrorBoundary>
  );
}
