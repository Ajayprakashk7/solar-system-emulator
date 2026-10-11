## 2025-02-27 - GPU Accelerated Asteroid Rotation
**Learning:** Large instanced arrays updated on the CPU per frame via `useFrame` cause severe bottlenecking on low-end hardware, even if the per-instance calculation is relatively small.
**Action:** Always move per-instance rotation/translation logic to the GPU via vertex shaders (e.g. `onBeforeCompile`) passing static attributes and a `uTime` uniform.
