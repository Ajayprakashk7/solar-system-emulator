/**
 * Performance optimizer for mobile-first rendering
 * Detects device capabilities and returns optimal settings
 */

/**
 * Detects device capabilities including mobile detection, hardware specs, and WebGL support
 * @returns {Object} Device capabilities object
 * @property {boolean} isMobile - Whether the device is mobile (based on user agent or viewport)
 * @property {boolean} isLowEnd - Whether the device has limited hardware (<=4 cores or <2x pixel ratio)
 * @property {number} devicePixelRatio - Device pixel ratio for display quality
 * @property {number} hardwareConcurrency - Number of logical CPU cores
 * @property {boolean} supportsWebGL2 - Whether WebGL2 is supported
 * @property {boolean} isIPhone - Whether the device is an iPhone
 */
export const getDeviceCapabilities = () => {
  if (typeof window === 'undefined') return { isMobile: false, isLowEnd: false };
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
  const isIPhone = /iPhone/i.test(navigator.userAgent);
  const devicePixelRatio = window.devicePixelRatio || 1;
  const hardwareConcurrency = navigator.hardwareConcurrency || 2;
  
  // Detect low-end devices
  // iPhones are generally high performance but WebGL implementation can be memory restricted
  const isLowEnd = hardwareConcurrency <= 4 || (isMobile && devicePixelRatio < 2);
  
  return {
    isMobile,
    isIPhone,
    isLowEnd,
    devicePixelRatio,
    hardwareConcurrency,
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

/**
 * Returns optimal rendering settings based on device capabilities
 * Automatically adjusts quality settings for mobile, low-end, and high-end devices
 * @returns {Object} Optimal settings object
 * @property {number} pixelRatio - Optimal pixel ratio (clamped to prevent performance issues)
 * @property {boolean} shadows - Whether to enable shadows
 * @property {boolean} antialias - Whether to enable antialiasing
 * @property {number} particleCount - Number of particles to render
 * @property {number} asteroidCount - Number of asteroids in asteroid belt
 * @property {string} textureQuality - Texture resolution ('1k', '2k', '4k', '8k')
 * @property {string} powerPreference - WebGL power preference ('low-power' or 'high-performance')
 * @property {number} maxLights - Maximum number of lights in scene
 * @property {boolean} enablePostProcessing - Whether to enable post-processing effects
 * @property {boolean} enableHighResBackground - Whether to load 8k background texture
 */
export const getOptimalSettings = () => {
  const capabilities = getDeviceCapabilities();
  
  // Safe defaults for mobile/low-end to prevent crashes
  if (capabilities.isMobile) {
    // iPhones specifically crash with high memory usage (large textures, too many draw calls)
    const isIPhone = capabilities.isIPhone;

    return {
      // Clamp pixel ratio aggressively on mobile to save fill-rate
      pixelRatio: Math.min(capabilities.devicePixelRatio, isIPhone ? 1.5 : 1.25),

      // Shadows are very expensive on mobile
      shadows: false,

      // Antialias helps visual quality a lot, but expensive. Disable on low-end.
      antialias: !capabilities.isLowEnd,

      // Significantly reduce particle counts
      particleCount: capabilities.isLowEnd || isIPhone ? 200 : 500,
      asteroidCount: capabilities.isLowEnd || isIPhone ? 150 : 300,

      // Use lower quality textures on mobile to save VRAM
      textureQuality: '2k', // Mobile max (never 8k)

      powerPreference: 'high-performance', // Request GPU even on mobile
      maxLights: 1, // Minimal lighting
      enablePostProcessing: false, // Post-processing is too heavy for most mobile
      enableHighResBackground: false // Disable 8k background on mobile
    };
  }
  
  // Desktop / High-end Tablet
  return {
    pixelRatio: Math.min(capabilities.devicePixelRatio, 2),
    shadows: true,
    antialias: true,
    particleCount: 2000,
    asteroidCount: 1000,
    textureQuality: '4k', // Desktop default
    powerPreference: 'high-performance',
    maxLights: 3,
    enablePostProcessing: !capabilities.isLowEnd,
    enableHighResBackground: true
  };
};

/**
 * Preloads multiple texture images to avoid loading delays during rendering
 * Uses Promise.allSettled to handle failures gracefully
 * @param {string[]} texturePaths - Array of texture file paths to preload
 * @returns {Promise<Array>} Promise that resolves with an array of settled promises
 * @example
 * const textures = ['/path/to/texture1.png', '/path/to/texture2.png'];
 * await preloadTextures(textures);
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
