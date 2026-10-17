## 2024-05-24 - Explicit Bounding Spheres for Frustum Culling
**Learning:** Relying on `.computeBoundingSphere()` during mount for `InstancedMesh` or `Points` with dynamically generated positions leads to zero-radius or incorrect bounding spheres, causing premature culling when `frustumCulled={true}` is enabled.
**Action:** Always manually construct and assign a fixed `Sphere(new Vector3(0, 0, 0), RADIUS)` to the mesh or geometry based on the known maximum bounds of the dynamic elements.
