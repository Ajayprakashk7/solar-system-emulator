
## $(date +%Y-%m-%d) - [Optimized Asteroid Belt Instancing]
**Learning:** In high-frequency React Three Fiber loops (`useFrame`), avoid dynamic instance updates using `setMatrixAt` for instanced groups (like Asteroid belts) if possible. Using custom shaders and buffer attributes (like `aInitialRotation` and `aRotationSpeed`) mapped to the `uTime` uniform removes hundreds of JS calculations and per-object matrix updates every frame, delegating purely to the GPU.
**Action:** Always prefer GPU-accelerated vertex shader animations for large instances over CPU-bound loop calculations.
