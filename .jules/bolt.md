## 2025-02-28 - GPU-accelerate asteroid rotation
**Learning:** High-frequency JS loop overhead causing micro-stutters from thousands of `setMatrixAt` calls per frame.
**Action:** Offload animation calculations to GPU using InstancedBufferAttributes and custom vertex shaders inside `onBeforeCompile` for `meshStandardMaterial`.
