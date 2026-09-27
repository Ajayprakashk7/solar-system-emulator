## 2024-05-20 - Frustum Culling for Custom Geometries
**Learning:** When generating manual buffer geometries in R3F, bounding spheres are zero, causing them to be incorrectly culled if frustumCulled is true. Developers often incorrectly fix this by disabling culling completely, causing performance bottlenecks.
**Action:** Always enable frustum culling. For InstancedMesh, call computeBoundingSphere directly on the mesh instance. For points, call computeBoundingSphere on the geometry.
