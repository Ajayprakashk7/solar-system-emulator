## 2024-10-24 - InstancedMesh Culling
**Learning:** Three.js InstancedMesh requires bounding spheres to be computed on the instance itself (via computeBoundingSphere()), not on the geometry, to enable proper frustum culling.
**Action:** Always call meshRef.current.computeBoundingSphere() after initializing instance matrices to allow frustumCulled={true} and prevent rendering when out of view.
