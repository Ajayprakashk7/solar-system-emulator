## 2025-03-02 - GPU Instancing Optimization
**Learning:** Updating thousands of `instanceMatrix` objects via `setMatrixAt` within `useFrame` generates significant CPU overhead and garbage collection pressure, causing micro-stutters.
**Action:** Move per-instance animation (like tumbling rotation) to the GPU using `onBeforeCompile` to inject custom vertex shaders reading from `InstancedBufferAttribute`. Always override both `<begin_vertex>` and `<beginnormal_vertex>` for correct lighting on `meshStandardMaterial`.

## 2025-03-02 - In-place Array Mutation in render loop
**Learning:** Passing `[currentX, 0, currentZ]` as an argument in `useFrame` continuously allocates new arrays per frame for each planet, increasing garbage collection load.
**Action:** In high-frequency React Three Fiber `useFrame` loops, avoid per-frame inline array or object allocations. Instead, pass individual coordinates and mutate existing arrays or `Vector3` instances in-place.
