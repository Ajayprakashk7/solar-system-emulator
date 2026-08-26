## 2025-05-18 - Transition to GPU Instanced Animation
**Learning:** Individual matrix updates for `instancedMesh` inside `useFrame` cause significant CPU overhead and garbage collection, even when staggered (e.g., every 3rd frame).
**Action:** Used `onBeforeCompile` to inject vertex shaders (`aRotationSpeed` instanced buffer attribute and `uTime` uniform) for purely GPU-accelerated local tumbling of instances, dropping CPU overhead for dynamic instanced groups to near zero.
