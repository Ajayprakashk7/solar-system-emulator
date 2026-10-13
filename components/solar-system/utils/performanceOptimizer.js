/**
 * Performance optimizer for adaptive rendering.
 * Detects device capabilities and chooses conservative scene defaults.
 */

export const getDeviceCapabilities = () => {
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
  const deviceMemory = navigator.deviceMemory || 4;
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const saveData = Boolean(navigator.connection?.saveData);

  let gpuRenderer = '';
  let gpuTier = 'high';
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

      // Check specific modern integrated GPUs before broad legacy/software patterns.
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
    saveData ||
    prefersReducedMotion;

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

const QUALITY_TIERS = {
  low: {
    pixelRatio: 1,
    shadows: false,
    antialias: false,
    particleCount: 250,
    asteroidCount: 140,
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
    particleCount: 600,
    asteroidCount: 350,
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
    particleCount: 1500,
    asteroidCount: 800,
    textureQuality: '2k',
    powerPreference: 'high-performance',
    maxLights: 3,
    enablePostProcessing: true,
    sphereSegments: 32,
    shadowMapSize: 2048,
  },
};

export const getOptimalSettings = () => {
  const capabilities = getDeviceCapabilities();

  let tier = 'high';
  if (capabilities.isLowEnd) {
    tier = 'low';
  } else if (capabilities.isMobile || capabilities.gpuTier === 'mid') {
    tier = 'mid';
  }

  const settings = { ...QUALITY_TIERS[tier] };
  settings.pixelRatio = Math.min(settings.pixelRatio, capabilities.devicePixelRatio || 1);

  return { ...settings, tier, capabilities };
};

/**
 * Adaptive FPS monitor retained for callers that want runtime quality changes.
 * Uses a fixed-size circular buffer to avoid per-frame array churn.
 */
export class FPSMonitor {
  constructor({ targetFPS = 55, sampleSize = 60, onDowngrade, onUpgrade } = {}) {
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

  tick(now) {
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
      const avgFPS = this.runningTotal > 0 ? this.sampleCount / this.runningTotal : 0;

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
    return this.sampleCount / this.runningTotal;
  }
}

export const preloadTextures = (texturePaths) => {
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
