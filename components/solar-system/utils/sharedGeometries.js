import * as THREE from 'three';

// Shared sphere geometries to reduce GPU memory usage and draw call overhead.
// By reusing these geometries, we avoid creating unique geometry buffers for each
// planet instance, significantly reducing memory footprint and scene graph complexity.

// High resolution for main planet bodies (Radius 1 unit - scale meshes to size)
export const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);

// Low resolution for secondary effects (polar caps, dust) or LOD
export const lowPolySphereGeometry = new THREE.SphereGeometry(1, 32, 32);

// Very low resolution for distant objects or small moons
export const veryLowPolySphereGeometry = new THREE.SphereGeometry(1, 16, 16);
