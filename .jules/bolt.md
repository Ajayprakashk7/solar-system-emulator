## 2024-05-24 - Bolt: AsteroidBelt InstancedMesh GPU Animation
**Learning:** Updating individual instanced meshes using `setMatrixAt` in `useFrame` consumes high CPU and triggers garbage collection overhead, especially as object count grows (e.g. 500 asteroids).
**Action:** Move asteroid tumble animation purely to the GPU by overriding `onBeforeCompile` on `meshStandardMaterial`, passing speeds via `instancedBufferAttribute` and time via uniform `uTime`. Ensure `objectNormal` is updated along with `transformed` to maintain correct lighting.
