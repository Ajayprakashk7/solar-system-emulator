/**
 * Performance optimizer for adaptive rendering.
 * Detects device capabilities and chooses conservative scene defaults.
 */

export interface DeviceCapabilities {
  isMobile: boolean;
  isLowEnd: boolean;
  gpuTier: 'low' | 'mid' | 'high';
  prefersReducedMotion: boolean;
  saveData: boolean;
  supportsWebGL2: boolean;
  devicePixelRatio?: number;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  gpuRenderer?: string;
}

export const getDeviceCapabilities = (): DeviceCapabilities => {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isLowEnd: false,
      gpuTier: 'high',
      prefersReducedMotion: false,
      saveData: false,
      supportsWebGL2: false,
    };
  }

  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768;
  const devicePixelRatio = window.devicePixelRatio || 1;
  const hardwareConcurrency = navigator.hardwareConcurrency || 2;
  const deviceMemory = ('deviceMemory' in navigator ? (navigator as unknown as { deviceMemory: number }).deviceMemory : 4) || 4;
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const saveData = Boolean('connection' in navigator ? (navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData : false);

  let gpuRenderer = '';
  let gpuTier: 'low' | 'mid' | 'high' = 'high';
  let supportsWebGL2 = false;

  try {
    const canvas = document.createElement('canvas');
    const webgl2 = canvas.getContext('webgl2');
    const gl = webgl2 || canvas.getContext('webgl');
    supportsWebGL2 = Boolean(webgl2);

    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpuRenderer = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)).toLowerCase();
      }

      const midTierGPUs = [
        'intel iris',
        'intel arc',
        'apple gpu',
        'apple m1',
        'apple m2',
        'apple m3',
        'apple m4',
        'mali-g',
        'adreno 5',
        'adreno 6',
      ];
      const lowTierGPUs = [
        'swiftshader',
        'llvmpipe',
        'virtualbox',
        'mali-4',
        'adreno 3',
        'adreno 4',
        'intel hd graphics 4',
        'intel hd graphics 5',
      ];

      if (midTierGPUs.some((gpu) => gpuRenderer.includes(gpu))) {
        gpuTier = 'mid';
      } else if (lowTierGPUs.some((gpu) => gpuRenderer.includes(gpu))) {
        gpuTier = 'low';
      }

      gl.getExtension('WEBGL_lose_context')?.loseContext();
    } else {
      gpuTier = 'low';
    }
  } catch {
    gpuTier = 'low';
  }

  const isLowEnd =
    gpuTier === 'low' ||
    hardwareConcurrency <= 4 ||
    deviceMemory <= 2 ||
    saveData;

  return {
    isMobile,
    isLowEnd,
    devicePixelRatio,
    hardwareConcurrency,
    deviceMemory,
    gpuTier,
    gpuRenderer,
    supportsWebGL2,
    prefersReducedMotion,
    saveData,
  };
};

// The star background already supplies most of the visual density. Keeping the
// dynamic dust and asteroid layers restrained saves fill-rate and CPU time while
// preserving depth, especially on Retina displays and mobile GPUs.
export interface QualitySettings {
  pixelRatio: number;
  shadows: boolean;
  antialias: boolean;
  particleCount: number;
  asteroidCount: number;
  textureQuality: '1k' | '2k' | '4k' | '8k';
  powerPreference: 'default' | 'high-performance' | 'low-power';
  maxLights: number;
  enablePostProcessing: boolean;
  sphereSegments: number;
  shadowMapSize: number;
}

const QUALITY_TIERS: Record<'low' | 'mid' | 'high', QualitySettings> = {
  low: {
    pixelRatio: 1,
    shadows: false,
    antialias: false,
    particleCount: 120,
    asteroidCount: 80,
    textureQuality: '1k',
    powerPreference: 'low-power',
    maxLights: 1,
    enablePostProcessing: false,
    sphereSegments: 16,
    shadowMapSize: 512,
  },
  mid: {
    pixelRatio: 1.5,
    shadows: false,
    antialias: true,
    particleCount: 400,
    asteroidCount: 240,
    textureQuality: '2k',
    powerPreference: 'default',
    maxLights: 2,
    enablePostProcessing: false,
    sphereSegments: 24,
    shadowMapSize: 1024,
  },
  high: {
    pixelRatio: 2,
    shadows: true,
    antialias: true,
    particleCount: 900,
    asteroidCount: 550,
    textureQuality: '2k',
    powerPreference: 'high-performance',
    maxLights: 3,
    enablePostProcessing: false,
    sphereSegments: 32,
    shadowMapSize: 1536,
  },
};

export interface OptimalSettings extends QualitySettings {
  tier: 'low' | 'mid' | 'high';
  capabilities: DeviceCapabilities;
}

export const getOptimalSettings = (): OptimalSettings => {
  const capabilities = getDeviceCapabilities();

  let tier: 'low' | 'mid' | 'high' = 'high';
  if (capabilities.isLowEnd) {
    tier = 'low';
  } else if (capabilities.isMobile || capabilities.gpuTier === 'mid') {
    tier = 'mid';
  }

  const settings = { ...QUALITY_TIERS[tier] };
  settings.pixelRatio = Math.min(settings.pixelRatio, capabilities.devicePixelRatio || 1);

  // Reduced-motion is an interaction preference rather than proof of a slow GPU.
  // Keep image quality but let CSS and UI components suppress non-essential motion.
  if (capabilities.prefersReducedMotion) {
    settings.particleCount = Math.min(settings.particleCount, QUALITY_TIERS.low.particleCount);
    settings.asteroidCount = Math.min(settings.asteroidCount, QUALITY_TIERS.low.asteroidCount);
  }

  return { ...settings, tier, capabilities };
};

/**
 * Adaptive FPS monitor retained for callers that want runtime quality changes.
 * Uses a fixed-size circular buffer to avoid per-frame array churn.
 */
export class FPSMonitor {
  targetFPS: number;
  sampleSize: number;
  frameTimes: Float64Array;
  sampleCount: number;
  sampleIndex: number;
  runningTotal: number;
  lastTime: number;
  onDowngrade?: (fps: number) => void;
  onUpgrade?: (fps: number) => void;
  cooldown: number;
  constructor({ targetFPS = 55, sampleSize = 60, onDowngrade, onUpgrade }: { targetFPS?: number, sampleSize?: number, onDowngrade?: (fps: number) => void, onUpgrade?: (fps: number) => void } = {}) {
    this.targetFPS = targetFPS;
    this.sampleSize = sampleSize;
    this.frameTimes = new Float64Array(sampleSize);
    this.sampleCount = 0;
    this.sampleIndex = 0;
    this.runningTotal = 0;
    this.lastTime = 0;
    this.onDowngrade = onDowngrade;
    this.onUpgrade = onUpgrade;
    this.cooldown = 0;
  }

  tick(now: number) {
    if (this.lastTime > 0) {
      const delta = now - this.lastTime;
      if (delta > 0 && Number.isFinite(delta)) {
        if (this.sampleCount < this.sampleSize) {
          this.sampleCount += 1;
        } else {
          this.runningTotal -= this.frameTimes[this.sampleIndex];
        }

        this.frameTimes[this.sampleIndex] = delta;
        this.runningTotal += delta;
        this.sampleIndex = (this.sampleIndex + 1) % this.sampleSize;
      }
    }
    this.lastTime = now;

    if (this.cooldown > 0) {
      this.cooldown -= 1;
      return;
    }

    if (this.sampleCount >= this.sampleSize) {
      // Frame times are milliseconds, so convert samples/ms to frames/second.
      const avgFPS = this.runningTotal > 0
        ? (this.sampleCount * 1000) / this.runningTotal
        : 0;

      if (avgFPS < this.targetFPS * 0.7 && this.onDowngrade) {
        this.onDowngrade(avgFPS);
        this.cooldown = 180;
        this.resetSamples();
      } else if (avgFPS > this.targetFPS * 1.1 && this.onUpgrade) {
        this.onUpgrade(avgFPS);
        this.cooldown = 300;
        this.resetSamples();
      }
    }
  }

  resetSamples() {
    this.sampleCount = 0;
    this.sampleIndex = 0;
    this.runningTotal = 0;
  }

  getAverageFPS() {
    if (this.sampleCount < 10 || this.runningTotal <= 0) return 0;
    return (this.sampleCount * 1000) / this.runningTotal;
  }
}

export const preloadTextures = (texturePaths: string[]) => {
  const promises = texturePaths.map(
    (path) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(path);
        img.onerror = reject;
        img.src = path;
      })
  );

  return Promise.allSettled(promises);
};
