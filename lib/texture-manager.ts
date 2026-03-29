/**
 * Centralized texture management system
 * Handles texture loading, caching, and quality selection based on device capabilities
 */

import { TextureLoader, Texture } from 'three';
import { getDeviceCapabilities } from '../components/solar-system/utils/performanceOptimizer';
import { DeviceCapabilities } from '../components/solar-system/types';
import { renderLogger } from './logger';

type TextureQuality = '1k' | '2k' | '4k' | '8k';

interface TextureLoadOptions {
  quality?: TextureQuality;
  priority?: 'high' | 'normal' | 'low';
}

class TextureManager {
  private static instance: TextureManager;
  private cache: Map<string, Texture>;
  private loader: TextureLoader;
  private deviceCapabilities: DeviceCapabilities;
  private loadingQueue: Map<string, Promise<Texture>>;

  private constructor() {
    this.cache = new Map();
    this.loader = new TextureLoader();
    this.deviceCapabilities = getDeviceCapabilities() as DeviceCapabilities;
    this.loadingQueue = new Map();
    
    renderLogger.debug('TextureManager initialized', {
      isMobile: this.deviceCapabilities.isMobile,
      isLowEnd: this.deviceCapabilities.isLowEnd,
    });
  }

  static getInstance(): TextureManager {
    if (!TextureManager.instance) {
      TextureManager.instance = new TextureManager();
    }
    return TextureManager.instance;
  }

  /**
   * Select appropriate texture quality based on device capabilities
   */
  private selectTextureQuality(basePath: string, requestedQuality?: TextureQuality): string {
    // Extract base path and quality from the texture path
    // e.g., "/images/bodies/earth_2k.webp" -> base: "/images/bodies/earth", quality: "2k"
    const match = basePath.match(/(.+?)_(\d+k)(\.\w+)$/i);
    
    if (!match) {
      // No quality suffix found, return as is
      return basePath;
    }
    
    const [, base, , ext] = match;
    
    // Determine optimal quality
    let quality: TextureQuality;
    
    if (requestedQuality) {
      quality = requestedQuality;
    } else if (this.deviceCapabilities.isLowEnd) {
      quality = '1k';
    } else if (this.deviceCapabilities.isMobile) {
      quality = '2k';
    } else {
      quality = '2k'; // Default for desktop
    }
    
    return `${base}_${quality}${ext}`;
  }

  /**
   * Load a texture with caching and quality selection
   */
  async loadTexture(path: string, options: TextureLoadOptions = {}): Promise<Texture> {
    const qualityPath = this.selectTextureQuality(path, options.quality);
    const cacheKey = qualityPath;
    
    // Return cached texture if available
    if (this.cache.has(cacheKey)) {
      renderLogger.debug(`Texture cache hit: ${cacheKey}`);
      return this.cache.get(cacheKey)!;
    }
    
    // Return in-flight loading promise if exists
    if (this.loadingQueue.has(cacheKey)) {
      renderLogger.debug(`Texture loading in progress: ${cacheKey}`);
      return this.loadingQueue.get(cacheKey)!;
    }
    
    // Start loading
    renderLogger.debug(`Loading texture: ${cacheKey}`);
    const loadPromise = new Promise<Texture>((resolve, reject) => {
      this.loader.load(
        qualityPath,
        (texture) => {
          this.cache.set(cacheKey, texture);
          this.loadingQueue.delete(cacheKey);
          renderLogger.debug(`Texture loaded: ${cacheKey}`);
          resolve(texture);
        },
        undefined,
        (error) => {
          this.loadingQueue.delete(cacheKey);
          renderLogger.error(`Failed to load texture: ${cacheKey}`, error);
          reject(error);
        }
      );
    });
    
    this.loadingQueue.set(cacheKey, loadPromise);
    return loadPromise;
  }

  /**
   * Preload multiple textures
   */
  async preloadTextures(paths: string[], options: TextureLoadOptions = {}): Promise<void> {
    const promises = paths.map(path =>
      this.loadTexture(path, options).catch(err => {
        renderLogger.warn(`Preload failed for ${path}:`, err);
        return null;
      })
    );
    
    await Promise.all(promises);
    renderLogger.debug(`Preloaded ${paths.length} textures`);
  }

  /**
   * Dispose a texture and remove from cache
   */
  disposeTexture(texturePath: string): void {
    const texture = this.cache.get(texturePath);
    if (texture) {
      texture.dispose();
      this.cache.delete(texturePath);
      renderLogger.debug(`Texture disposed: ${texturePath}`);
    }
  }

  /**
   * Dispose all textures
   */
  disposeAll(): void {
    let count = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.cache.forEach((texture, _path) => {
      texture.dispose();
      count++;
    });
    this.cache.clear();
    this.loadingQueue.clear();
    renderLogger.debug(`Disposed ${count} textures`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cached: this.cache.size,
      loading: this.loadingQueue.size,
      deviceCapabilities: this.deviceCapabilities,
    };
  }
}

// Export singleton instance
export const textureManager = TextureManager.getInstance();

// Export class for testing
export default TextureManager;
