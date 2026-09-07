## 2024-05-18 - GPU-accelerate AsteroidBelt instanced mesh animation
**Learning:** Updating instance matrices for thousands of objects on the CPU every frame using `setMatrixAt` causes severe garbage collection pressure and CPU bottlenecks. Offloading instance animation to the GPU via custom vertex shaders (`onBeforeCompile` with `InstancedBufferAttribute`) eliminates CPU overhead entirely.
**Action:** Always prefer GPU-side shader modifications over CPU-side `useFrame` loops for dynamic, repetitive animations on large instanced groups (like asteroid fields or particle systems).
