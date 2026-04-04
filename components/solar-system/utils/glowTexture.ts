/**
 * Procedural glow texture generator for celestial bodies
 * Creates radial gradient textures for glow effects without external images
 */

import { CanvasTexture, LinearFilter } from 'three';

/**
 * Creates a procedural glow texture using HTML5 Canvas and radial gradients
 * Used for atmospheric glow effects on planets and the Sun
 * 
 * @param {number} size - Texture resolution (default: 256). Higher values = better quality but more memory
 * @returns {CanvasTexture} Three.js CanvasTexture ready for use in materials
 * 
 * @example
 * const glowTexture = createGlowTexture(512);
 * const glowMaterial = new SpriteMaterial({ 
 *   map: glowTexture,
 *   blending: AdditiveBlending,
 *   transparent: true
 * });
 */
export function createGlowTexture(size: number = 256): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to get 2D context from canvas');
  }

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2;
  
  // Create radial gradient from center to edge
  const gradient = context.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, radius
  );
  
  // Color stops for realistic glow effect (bright center fading to transparent edge)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');      // Bright white core
  gradient.addColorStop(0.2, 'rgba(255, 204, 102, 0.8)'); // Warm yellow-orange
  gradient.addColorStop(0.4, 'rgba(255, 153, 51, 0.6)');  // Orange
  gradient.addColorStop(0.7, 'rgba(255, 102, 0, 0.3)');   // Dark orange (fading)
  gradient.addColorStop(1, 'rgba(255, 102, 0, 0)');       // Transparent edge
  
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  
  // Create Three.js texture from canvas
  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter; // Smooth when scaled down
  texture.magFilter = LinearFilter; // Smooth when scaled up
  
  return texture;
}
