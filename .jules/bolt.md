## 2024-05-18 - GPU-Accelerated InstancedMesh
**Learning:** Using `setMatrixAt` in `useFrame` for thousands of instances causes severe CPU overhead and GC pressure.
**Action:** Inject custom vertex shaders via `onBeforeCompile` to compute per-instance animations entirely on the GPU.
