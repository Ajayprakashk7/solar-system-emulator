## 2023-10-25 - Prevent Premature Culling on InstancedMesh and Points
**Learning:** In React Three Fiber, dynamically positioned `InstancedMesh` or `Points` with `frustumCulled={true}` can disappear prematurely if `.computeBoundingSphere()` is called on mount, as uninitialized matrices lead to a zero-radius bounding sphere.
**Action:** Instead of relying on `.computeBoundingSphere()`, manually construct and assign a fixed `Sphere` encompassing the maximum expected bounds (e.g., `mesh.boundingSphere = new Sphere(new Vector3(0, 0, 0), RADIUS)`).
