// Scene configuration for Solar System Emulator
// Centralizes rendering, performance, UI, and accessibility settings.

export const PERFORMANCE_CONFIG = {
  desktop: {
    maxPixelRatio: 2,
    antialias: true,
    shadows: true,
    powerPreference: 'high-performance' as const,
  },
  mobile: {
    maxPixelRatio: 1.5,
    antialias: true,
    shadows: false,
    powerPreference: 'default' as const,
  },
} as const;

export const EFFECTS_CONFIG = {
  atmosphericGlow: true,
  orbitalGuides: true,
  asteroidBelt: true,
  cosmicDust: true,
} as const;

export const UI_CONFIG = {
  showPlanetMenu: true,
  showSpeedControl: true,
  showMobileInstructions: true,
} as const;

export const TEXTURE_CONFIG = {
  low: '1k',
  medium: '2k',
  high: '2k',
} as const;

export const BACKGROUND_CONFIG = {
  texture: '/images/background/stars_8k.webp',
} as const;

export const ANIMATION_CONFIG = {
  enabled: true,
} as const;

export const ACCESSIBILITY_CONFIG = {
  respectReducedMotion: true,
  keyboardNavigation: true,
} as const;

export const DEBUG_CONFIG = {
  enabled: process.env.NODE_ENV === 'development',
} as const;

export const SCENE_CONFIG = {
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

type NavigatorWithConnection = Navigator & {
  connection?: {
    effectiveType?: string;
    saveData?: boolean;
  };
};

/**
 * Helper to get optimal texture quality based on device
 */
export function getOptimalTextureQuality(): 'low' | 'medium' | 'high' {
  if (typeof window === 'undefined') {
    return 'medium';
  }

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const connection = (navigator as NavigatorWithConnection).connection;
  const hasGoodConnection = connection?.effectiveType === '4g' && !connection?.saveData;

  if (isMobile) {
    return hasGoodConnection ? 'medium' : 'low';
  }

  return connection?.saveData ? 'medium' : 'high';
}
