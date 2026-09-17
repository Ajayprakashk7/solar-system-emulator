## 2024-10-25 - Avoid inline array allocations in render loops
**Learning:** In Three.js and React Three Fiber `useFrame` high-frequency render loops, passing inline newly allocated arrays (e.g. `[x, y, z]`) to frequent context or prop updates causes significant garbage collection overhead and frame dropping, which breaks the 'No Drop' rule.
**Action:** Instead of inline array allocation, always pass scalar coordinates directly to functions, or manually mutate pre-allocated refs and objects in-place to avoid GC pressure.
