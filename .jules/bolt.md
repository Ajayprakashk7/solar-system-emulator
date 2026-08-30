## 2025-02-14 - GPU Acceleration for Instanced Meshes
**Learning:** Updating individual instance matrices via `setMatrixAt` inside `useFrame` causes severe CPU overhead and GC pressure for large dynamic instanced groups like asteroids.
**Action:** Always use `onBeforeCompile` on the material to inject custom vertex shaders for purely GPU-accelerated animation, passing data via instanced buffer attributes.
