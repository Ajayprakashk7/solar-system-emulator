## 2024-05-24 - Planet LOD and Context Loss Recovery
**Learning:** Rendering high segment geometry (e.g. 64x64) and high res textures (2K) on all planets regardless of distance or device capabilities hurts mobile performance significantly. WebGL context loss can happen on memory-constrained devices.
**Action:** Implemented Dynamic LOD based on distance using `<Detailed>` or standard meshes swapping geometries. Added `webglcontextlost` and `webglcontextrestored` listeners to the Canvas to recover when possible.
