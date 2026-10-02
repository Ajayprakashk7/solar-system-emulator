## 2024-05-24 - Enable Frustum Culling for Particles
**Learning:** InstancedMesh and Points with dynamically initialized positions require manually setting a bounding sphere to prevent zero-radius culling when frustumCulled is true.
**Action:** Manually construct and assign a fixed bounding sphere encompassing the maximum expected bounds to meshRef.current.boundingSphere or meshRef.current.geometry.boundingSphere.
