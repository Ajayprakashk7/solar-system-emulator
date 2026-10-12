## 2024-10-12 - Explicit Bounding Spheres for Frustum Culling
**Learning:** In Three.js/R3F, computeBoundingSphere on dynamically positioned InstancedMesh or Points yields a zero-radius sphere on mount due to uninitialized matrices, causing incorrect culling.
**Action:** Always manually construct and assign a fixed Sphere encompassing the maximum expected bounds to mesh.boundingSphere or geometry.boundingSphere to correctly enable aggressive frustum culling.
