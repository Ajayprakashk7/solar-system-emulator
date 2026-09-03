## 2024-05-18 - ⚡ Bolt: Optimize InstancedMesh updates with onBeforeCompile
**Learning:** Updating individual instance matrices via `setMatrixAt` in `useFrame` for thousands of instances (like AsteroidBelt) causes significant CPU overhead and garbage collection pressure, breaking the 60 FPS 'No Drop' rule.
**Action:** Use purely GPU-accelerated animation by passing animation parameters (like rotation speeds) via `InstancedBufferAttribute` and injecting custom vertex shaders using `onBeforeCompile`, ensuring to rotate both `position` and `normal` for correct lighting.
