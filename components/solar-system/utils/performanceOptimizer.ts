/**
 * Performance optimizer for mobile-first rendering
 * Detects device capabilities and returns optimal settings
 */

import { DeviceCapabilities, OptimalSettings } from '../types';

/**
 * Detects device capabilities including mobile detection, hardware specs, and WebGL support
 * @returns {DeviceCapabilities} Device capabilities object
 */
export const getDeviceCapabilities = (): DeviceCapabilities => {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isLowEnd: false,
      devicePixelRatio: 1,
      hardwareConcurrency: 4,
      supportsWebGL2: false
    };
  }
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
  const devicePixelRatio = window.devicePixelRatio || 1;
  const hardwareConcurrency = navigator.hardwareConcurrency || 2;
  
  // Detect low-end devices
  const isLowEnd = hardwareConcurrency <= 4 || devicePixelRatio < 2;
  
  return {
    isMobile,
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
 * @returns {OptimalSettings} Optimal settings object
 */
export const getOptimalSettings = (): OptimalSettings => {
  const capabilities = getDeviceCapabilities();
  
  if (capabilities.isMobile) {
    return {
      pixelRatio: Math.min(capabilities.devicePixelRatio, 1.5),
      shadows: false,
      antialias: !capabilities.isLowEnd,
      particleCount: capabilities.isLowEnd ? 500 : 1000,
      asteroidCount: capabilities.isLowEnd ? 200 : 500,
      textureQuality: capabilities.isLowEnd ? '1k' : '2k',
      powerPreference: 'low-power',
      maxLights: 2,
      enablePostProcessing: false
    };
  }
  
  return {
    pixelRatio: Math.min(capabilities.devicePixelRatio, 2),
    shadows: true,
    antialias: true,
    particleCount: 2000,
    asteroidCount: 1000,
    textureQuality: '2k',
    powerPreference: 'high-performance',
    maxLights: 4,
    enablePostProcessing: !capabilities.isLowEnd
  };
};

/**
 * Preloads multiple texture images to avoid loading delays during rendering
 * Uses Promise.allSettled to handle failures gracefully
 * @param {string[]} texturePaths - Array of texture file paths to preload
 * @returns {Promise<PromiseSettledResult<string>[]>} Promise that resolves with an array of settled promises
 */
export const preloadTextures = (texturePaths: string[]): Promise<PromiseSettledResult<string>[]> => {
  const promises = texturePaths.map(path => {
    return new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(path);
      img.onerror = reject;
      img.src = path;
    });
  });
  
  return Promise.allSettled(promises);
};
