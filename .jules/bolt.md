## 2024-05-30 - O(1) Bounding Sphere for high-count InstancedMesh/Points
**Learning:** Relying on `computeBoundingSphere()` on mount for dynamically positioned `InstancedMesh` or `Points` with `frustumCulled={true}` causes O(N) operations when initializing many items. Uninitialized matrices yield a zero-radius sphere, causing incorrect culling.
**Action:** Manually construct and assign a fixed bounding sphere encompassing the maximum expected bounds in O(1) time.
