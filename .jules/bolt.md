## 2024-10-24 - Avoid computeBoundingSphere on InstancedMesh mount
**Learning:** Calling `.computeBoundingSphere()` on `InstancedMesh` or `Points` immediately after updating instance matrices on mount can result in zero-radius bounding spheres due to uninitialized states, breaking frustum culling.
**Action:** Replace `computeBoundingSphere()` with an explicit `new Sphere()` assignment using the known boundaries to ensure correct culling behavior and achieve O(1) setup time.
