## 2024-05-18 - Optimized Frustum Culling
**Learning:** `frustumCulled={false}` forces Three.js to render InstancedMeshes and Points even when off-camera, causing severe performance drops for dense objects like asteroid belts or cosmic dust.
**Action:** When setting `frustumCulled={true}` for dynamically positioned `InstancedMesh` or `Points` objects, initialize a fixed `boundingSphere` encompassing the maximum expected bounds (e.g. `meshRef.current.boundingSphere = new Sphere(new Vector3(0, 0, 0), radius)`) inside `useEffect`.
