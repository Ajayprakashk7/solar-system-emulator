## 2024-05-20 - Bounding Sphere Frustum Culling Bug
**Learning:** React Three Fiber components dynamically populated via refs (like `InstancedMesh` or `Points`) can end up with zero-radius bounding spheres if `.computeBoundingSphere()` is called on mount before matrices are fully initialized. This causes them to be incorrectly culled right away when `frustumCulled={true}`.
**Action:** Always manually construct and assign `boundingSphere = new Sphere(new Vector3(0, 0, 0), MAX_RADIUS)` for dynamically populated point clouds or instanced meshes instead of computing it at runtime.
