// SolarSystem.js
'use client';

import { Component, Suspense, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr } from '@react-three/drei';
import planetsData from './lib/planetsData';
import SceneBackground from './SceneBackground';
import Sun from './celestial/Sun';
import Planet from './celestial/Planets';
import AsteroidBelt from './celestial/AsteroidBelt';
import CosmicDust from './celestial/CosmicDust';
import { getOptimalSettings } from './utils/performanceOptimizer';
import CameraController from './motion/CameraController';
import SimulationClock from './motion/SimulationClock';
import PlanetMenu from './ui/PlanetMenu';
import SpeedControl from './ui/SpeedControl';
import ExitButton from './ui/ExitButton';
import PlanetDetail from './ui/PlanetDetailBoundary';
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
        <div className="flex h-full w-full items-center justify-center bg-black px-6 py-10">
          <div className="mx-auto max-w-sm text-center" role="alert">
            <div
              aria-hidden="true"
              className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-white/15"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white/75" />
            </div>
            <p className="space-kicker">Rendering interrupted</p>
            <h2 className="mt-2 text-2xl font-light tracking-[-0.03em] text-white">
              The orbital scene stopped
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/45">
              The browser could not continue the 3D session. Reload the scene to start again.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="space-control mt-6 px-5"
            >
              Reload scene
            </button>
            {this.state.error?.message && (
              <p className="mt-5 break-words text-[10px] leading-relaxed text-white/25">
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
        <div className="relative mx-auto mb-4 h-11 w-11" aria-hidden="true">
          <div className="absolute inset-[7px] rounded-full border border-white/10" />
          <div className="orbit-loader absolute inset-0 rounded-full border border-transparent border-t-white/45">
            <span className="absolute -top-[2px] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/75" />
          </div>
          <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
          Loading orbital scene
        </p>
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
                dpr={[1, settings.pixelRatio]}
                gl={glConfig}
                performance={{ min: 0.65, max: 1, debounce: 300 }}
                flat
                onCreated={handleCreated}
              >
                <AdaptiveDpr />
                <SimulationClock />
                <CameraController />

                {/* Stream independent texture groups so one slow asset no longer
                    blocks the entire Solar System from becoming interactive. */}
                <Suspense fallback={null}>
                  <SceneBackground texturePath="/images/background/stars_8k.webp" />
                </Suspense>

                <SceneLighting maxLights={settings.maxLights} />

                <Suspense fallback={null}>
                  <Sun
                    position={[0, 0, 0]}
                    radius={sunRadius}
                    sphereSegments={Math.max(settings.sphereSegments, 24)}
                    shadows={settings.shadows}
                    shadowMapSize={settings.shadowMapSize}
                  />
                </Suspense>

                <AsteroidBelt asteroidCount={settings.asteroidCount} />
                <CosmicDust particleCount={settings.particleCount} />

                {planets.map((planet) => (
                  <Suspense key={planet.id} fallback={null}>
                    <Planet
                      id={planet.id}
                      name={planet.name}
                      texturePath={planet.texturePath}
                      position={planet.position}
                      radius={planet.radius}
                      tilt={planet.tilt}
                      moons={planet.moons}
                      rings={planet.rings}
                      sphereSegments={settings.sphereSegments}
                      shadows={settings.shadows}
                    />
                  </Suspense>
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
