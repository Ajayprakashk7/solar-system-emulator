## 2024-03-24 - Bolt: GPU-accelerate instanced rendering

**Learning:** When dealing with thousands of instances in a React Three Fiber `useFrame` loop, updating the instance matrices on the CPU (`setMatrixAt`) and pushing to the GPU causes significant O(N) overhead and garbage collection pressure, leading to micro-stutters.

**Action:** For animations that can be purely procedural (like tumbling asteroids), use `onBeforeCompile` on the material to inject custom vertex shaders. Pass initial states and rotation speeds via `InstancedBufferAttribute`s, and calculate the local rotation and normal transformations entirely on the GPU based on a `uTime` uniform. This removes all O(N) array operations and GC pressure from the CPU render loop. Remember to also rotate the `normal` in `#include <beginnormal_vertex>` to keep lighting accurate.
