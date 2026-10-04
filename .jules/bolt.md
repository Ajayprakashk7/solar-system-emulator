## 2024-10-04 - GPU Shaders for Massive Particle Systems
**Learning:** For rendering massive amounts of items like asteroid belts and cosmic dust in Three.js/React Three Fiber, doing per-frame transformations or accumulation using JavaScript and React is very slow on CPU.
**Action:** Replace JavaScript loops inside `useFrame` with GPU-accelerated custom shaders using `shaderMaterial`. For `AsteroidBelt`, instanced data can be passed as `instancedBufferAttribute` and computed in the vertex shader. For `CosmicDust`, animate properties like rotation based on elapsed time directly within the vertex shader. Also properly setup `boundingSphere` to avoid improper culling when `frustumCulled={true}`.

## 2024-10-04 - R3F Camera Controls for Moving Targets
**Learning:** Setting the `OrbitControls` target initially when enabling tracking isn't enough to track dynamically moving elements like moons orbiting a planet. The position goes stale instantly.
**Action:** Always continuously update `controls.target.copy(planetPos)` within the render loop (e.g. `useFrame`) before calling `controls.update()` to smoothly track dynamically moving bodies over time.
