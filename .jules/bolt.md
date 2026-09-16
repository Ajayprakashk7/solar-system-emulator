## 2024-05-14 - OrbitControls dynamic target update tracking
**Learning:** When using Three.js OrbitControls (or @react-three/drei) to track dynamic moving elements (e.g., orbiting bodies), the target must be explicitly and continuously updated during the render loop (`useFrame`) before calling `controls.update()`. Statically initializing the target once will fail to track moving objects.
**Action:** Always continuously update `controls.target` and call `controls.update()` within the animation loop when tracking moving targets in Three.js/R3F scenes.
