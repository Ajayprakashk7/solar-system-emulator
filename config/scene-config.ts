/**
 * Centralized configuration for 3D scene, camera, lighting, and performance
 */

/**
 * Camera configuration
 */
export const CAMERA_CONFIG = {
  // Camera movement smoothing
  lerpFactor: 0.015,
  fastLerpFactor: 0.04,
  
  // Position threshold for camera movements
  positionEpsilon: 0.1,
  
  // Default camera positions
  home: { x: 11, y: 1, z: 1 },
  intro: { x: 15, y: 8, z: 15 },
  
  // Field of view
  fov: 75,
  near: 0.1,
  far: 10000,
  
  // Zoom levels
  detailViewDistance: {
    planet: 3,
    moon: 2,
    sun: 10,
  },
} as const;

/**
 * Lighting configuration
 */
export const LIGHTING_CONFIG = {
  ambient: {
    intensity: 0.4,
    color: 0xffffff,
  },
  
  sun: {
    intensity: 8,
    distance: 1000,
    decay: 0.25,
    color: 0xffffff,
  },
  
  hemisphere: {
    skyColor: 0x87ceeb,
    groundColor: 0x000000,
    intensity: 0.3,
  },
} as const;

/**
 * Physics and orbital mechanics
 */
export const PHYSICS_CONFIG = {
  // Orbital speed multiplier
  orbitSpeedFactor: 50,
  
  // Enable Kepler's laws for realistic orbital speeds
  keplerFactorEnabled: true,
  
  // Gravity simulation (for future features)
  gravitationalConstant: 6.674e-11,
  
  // Planet rotation speeds (Earth days)
  rotationPeriods: {
    sun: 25.38,
    mercury: 58.6,
    venus: 243,
    earth: 1,
    mars: 1.03,
    jupiter: 0.41,
    saturn: 0.45,
    uranus: 0.72,
    neptune: 0.67,
    pluto: -6.39,
  },
} as const;

/**
 * Performance optimization settings
 */
export const PERFORMANCE_CONFIG = {
  mobile: {
    pixelRatio: 1.5,
    maxPixelRatio: 2,
    particleCount: 1000,
    asteroidCount: 500,
    shadowsEnabled: false,
    antialias: false,
    powerPreference: 'low-power' as const,
  },
  
  desktop: {
    pixelRatio: 2,
    maxPixelRatio: 3,
    particleCount: 2000,
    asteroidCount: 1000,
    shadowsEnabled: true,
    antialias: true,
    powerPreference: 'high-performance' as const,
  },
  
  // FPS thresholds for dynamic quality adjustment
  fps: {
    target: 60,
    low: 30,
    critical: 20,
  },
} as const;

/**
 * Visual effects configuration
 */
export const EFFECTS_CONFIG = {
  glow: {
    sunRadius: 1.2,
    sunIntensity: 2.5,
    planetIntensity: 0.8,
  },
  
  atmosphere: {
    earth: { color: 0x4488ff, opacity: 0.3 },
    mars: { color: 0xff8844, opacity: 0.2 },
    jupiter: { color: 0xffcc88, opacity: 0.25 },
    saturn: { color: 0xffeeaa, opacity: 0.2 },
    uranus: { color: 0x88ffff, opacity: 0.2 },
    neptune: { color: 0x4466ff, opacity: 0.25 },
  },
  
  trails: {
    enabled: true,
    length: 100,
    opacity: 0.5,
  },
} as const;

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  menu: {
    animationDuration: 0.3,
    blurAmount: 8,
  },
  
  controls: {
    speedPresets: [0, 1, 2, 5, 10],
    defaultSpeed: 1,
  },
  
  planetDetail: {
    showDelay: 0.2,
    hideDelay: 0.1,
  },
} as const;

/**
 * Texture quality levels
 */
export const TEXTURE_CONFIG = {
  quality: {
    low: {
      resolution: '1k',
      format: 'jpg',
    },
    medium: {
      resolution: '2k',
      format: 'webp',
    },
    high: {
      resolution: '4k',
      format: 'webp',
    },
  },
  
  // Texture paths
  basePath: '/images',
  
  // Cache settings
  maxCacheSize: 50, // Maximum textures in cache
  preloadDistance: 2, // Preload textures N planets away
} as const;

/**
 * Space background configuration
 */
export const BACKGROUND_CONFIG = {
  stars: {
    count: 10000,
    size: 1.5,
    spread: 1000,
    color: 0xffffff,
  },
  
  nebula: {
    enabled: true,
    opacity: 0.3,
    color: 0x4444ff,
  },
  
  cosmicDust: {
    enabled: true,
    count: 5000,
    spread: 500,
    opacity: 0.4,
  },
} as const;

/**
 * Animation timing
 */
export const ANIMATION_CONFIG = {
  intro: {
    duration: 3000, // ms
    easing: 'easeInOut',
  },
  
  planetTransition: {
    duration: 2000, // ms
    easing: 'easeInOut',
  },
  
  menuTransition: {
    duration: 300, // ms
    easing: 'easeOut',
  },
} as const;

/**
 * Accessibility configuration
 */
export const ACCESSIBILITY_CONFIG = {
  // Reduced motion support
  respectReducedMotion: true,
  
  // Keyboard navigation
  keyboardEnabled: true,
  
  // Focus indicators
  focusRingColor: '#3b82f6',
  focusRingWidth: 2,
  
  // Screen reader announcements
  announceTransitions: true,
} as const;

/**
 * Development/Debug configuration
 */
export const DEBUG_CONFIG = {
  showFPS: false,
  showOrbitPaths: false,
  showAxisHelpers: false,
  showGridHelper: false,
  logPerformance: false,
  wireframeMode: false,
} as const;

/**
 * Composite configuration object
 */
export const SCENE_CONFIG = {
  camera: CAMERA_CONFIG,
  lighting: LIGHTING_CONFIG,
  physics: PHYSICS_CONFIG,
  performance: PERFORMANCE_CONFIG,
  effects: EFFECTS_CONFIG,
  ui: UI_CONFIG,
  texture: TEXTURE_CONFIG,
  background: BACKGROUND_CONFIG,
  animation: ANIMATION_CONFIG,
  accessibility: ACCESSIBILITY_CONFIG,
  debug: DEBUG_CONFIG,
} as const;

/**
 * Helper to get device-specific performance settings
 */
export function getDevicePerformanceConfig() {
  if (typeof window === 'undefined') {
    return PERFORMANCE_CONFIG.desktop;
  }
  
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  return isMobile ? PERFORMANCE_CONFIG.mobile : PERFORMANCE_CONFIG.desktop;
}

/**
 * Helper to get optimal texture quality based on device
 */
export function getOptimalTextureQuality(): 'low' | 'medium' | 'high' {
  if (typeof window === 'undefined') {
    return 'medium';
  }
  
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const hasGoodConnection = (navigator as any).connection?.effectiveType === '4g';
  
  if (isMobile) {
    return hasGoodConnection ? 'medium' : 'low';
  }
  
  return 'high';
}
