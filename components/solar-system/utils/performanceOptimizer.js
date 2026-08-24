/**
 * Performance optimizer for adaptive rendering
 * Detects device capabilities, monitors FPS, and adjusts quality dynamically
 */

/**
 * Detects device capabilities including GPU, mobile detection, and WebGL support
 * @returns {Object} Device capabilities object
 */
export const getDeviceCapabilities = () => {
  if (typeof window === 'undefined') return { isMobile: false, isLowEnd: false, gpuTier: 'high' };
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
  const devicePixelRatio = window.devicePixelRatio || 1;
  const hardwareConcurrency = navigator.hardwareConcurrency || 2;
  const deviceMemory = navigator.deviceMemory || 4; // GB, defaults to 4 if unavailable
  
  // GPU detection via WebGL renderer info
  let gpuRenderer = '';
  let gpuTier = 'high';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
      }
      // Detect low-tier GPUs
      const lowTierGPUs = ['intel', 'mesa', 'swiftshader', 'llvmpipe', 'virtualbox', 'mali-4', 'adreno 3', 'adreno 4'];
      const midTierGPUs = ['mali-g', 'adreno 5', 'adreno 6', 'intel iris', 'apple gpu'];
      
      if (lowTierGPUs.some(g => gpuRenderer.includes(g))) {
        gpuTier = 'low';
      } else if (midTierGPUs.some(g => gpuRenderer.includes(g))) {
        gpuTier = 'mid';
      }
      // Clean up the detection canvas
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  } catch {
    // WebGL not available
  }
  
  // Composite low-end detection
  const isLowEnd = gpuTier === 'low' || hardwareConcurrency <= 4 || deviceMemory <= 2;
  
  return {
    isMobile,
    isLowEnd,
    devicePixelRatio,
    hardwareConcurrency,
    deviceMemory,
    gpuTier,
    gpuRenderer,
    supportsWebGL2: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!canvas.getContext('webgl2');
      } catch {
        return false;
      }
    })()
  };
};

// Quality tier definitions
const QUALITY_TIERS = {
  low: {
    pixelRatio: 1,
    shadows: false,
    antialias: false,
    particleCount: 300,
    asteroidCount: 150,
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

/**
 * Returns optimal rendering settings based on device capabilities
 * @returns {Object} Optimal settings object with quality tier
 */
export const getOptimalSettings = () => {
  const capabilities = getDeviceCapabilities();
  
  let tier;
  if (capabilities.isLowEnd) {
    tier = 'low';
  } else if (capabilities.isMobile || capabilities.gpuTier === 'mid') {
    tier = 'mid';
  } else {
    tier = 'high';
  }
  
  const settings = { ...QUALITY_TIERS[tier] };
  
  // Clamp pixel ratio to device's actual ratio
  settings.pixelRatio = Math.min(settings.pixelRatio, capabilities.devicePixelRatio);
  
  return {
    ...settings,
    tier,
    capabilities,
  };
};

/**
 * Adaptive FPS monitor that can trigger quality downgrades at runtime
 * Uses a rolling window to avoid reacting to single frame spikes.
 */
export class FPSMonitor {
  constructor({ targetFPS = 55, sampleSize = 60, onDowngrade, onUpgrade } = {}) {
    this.targetFPS = targetFPS;
    this.sampleSize = sampleSize;
    this.frameTimes = new Float64Array(sampleSize);
    this.index = 0;
    this.count = 0;
    this.sum = 0;
    this.lastTime = 0;
    this.onDowngrade = onDowngrade;
    this.onUpgrade = onUpgrade;
    this.currentTier = null;
    this.cooldown = 0; // Frames to wait before another tier change
  }

  /**
   * Call once per frame with the current timestamp (e.g. from useFrame's clock)
   * @param {number} now - Current time in seconds
   */
  tick(now) {
    if (this.lastTime > 0) {
      const delta = now - this.lastTime;
      const oldest = this.count < this.sampleSize ? 0 : this.frameTimes[this.index];
      this.sum = this.sum - oldest + delta;
      this.frameTimes[this.index] = delta;
      this.index = (this.index + 1) % this.sampleSize;
      if (this.count < this.sampleSize) this.count++;
    }
    this.lastTime = now;
    
    if (this.cooldown > 0) {
      this.cooldown--;
      return;
    }

    // Only evaluate after collecting enough samples
    if (this.count >= this.sampleSize) {
      const avgDelta = this.sum / this.count;
      const avgFPS = 1 / avgDelta;
      
      if (avgFPS < this.targetFPS * 0.7 && this.onDowngrade) {
        // Sustained low FPS — request downgrade
        this.onDowngrade(avgFPS);
        this.cooldown = 180; // Wait ~3 seconds at 60fps before re-evaluating
        this.count = 0;
        this.index = 0;
        this.sum = 0;
        this.frameTimes.fill(0);
      } else if (avgFPS > this.targetFPS * 1.1 && this.onUpgrade) {
        // Sustained high FPS — could upgrade
        this.onUpgrade(avgFPS);
        this.cooldown = 300; // Wait ~5 seconds before re-evaluating
        this.count = 0;
        this.index = 0;
        this.sum = 0;
        this.frameTimes.fill(0);
      }
    }
  }

  /** @returns {number} Current average FPS or 0 if not enough samples */
  getAverageFPS() {
    if (this.count < 10) return 0;
    const avgDelta = this.sum / this.count;
    return 1 / avgDelta;
  }
}

/**
 * Preloads multiple texture images to avoid loading delays during rendering
 * @param {string[]} texturePaths - Array of texture file paths to preload
 * @returns {Promise<Array>} Promise that resolves with an array of settled promises
 */
export const preloadTextures = (texturePaths) => {
  const promises = texturePaths.map(path => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(path);
      img.onerror = reject;
      img.src = path;
    });
  });
  
  return Promise.allSettled(promises);
};
