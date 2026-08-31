## 2024-05-14 - Asteroid Belt Shader Rotation
**Learning:** React Three Fiber `useFrame` matrix updates on large instanced meshes (500+ items) cause significant CPU/GC overhead even when batched or throttled.
**Action:** Shift individual element rotation and animation to custom vertex shaders using `onBeforeCompile` and `instancedBufferAttribute` to ensure high-performance dynamic GPU rendering.
