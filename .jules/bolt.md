## 2024-10-09 - Ensure bounding spheres for frustum culling
**Learning:** InstancedMesh and Points objects with frustumCulled={true} need an explicit bounding sphere defined in code if they are initialized without standard static geometry bounding, otherwise the engine cull incorrectly.
**Action:** Always assign a fixed bounding sphere to meshRef.current.boundingSphere or geometry.boundingSphere to enable accurate frustum culling.
