## 2024-05-23 - React State in Animation Loop
**Learning:** Using React state (`useState`) to drive animation loops (like orbit progress) causes full component tree re-renders on every frame. In this app, `PlanetsUpdater` was updating `SolarSystem` state every frame, forcing all `Planet` components to re-render, killing performance.
**Action:** Decouple animation from React state. Use `useFrame` + `useRef` for transient values like position/rotation. Only use state for low-frequency UI updates. Use Refs in Contexts to share high-frequency data (like planet positions for camera) without triggering re-renders.

## 2024-05-24 - InstancedMesh CPU Animation Bottleneck
**Learning:** Animating `InstancedMesh` matrices via `setMatrixAt` in a `useFrame` loop requires re-uploading the entire matrix buffer to the GPU every frame, which is expensive for large counts (e.g., Asteroid Belt).
**Action:** Move per-instance animation to the vertex shader using `material.onBeforeCompile`. Inject attributes (like `aRotationSpeed`) and use `uTime` uniform to calculate transforms on the GPU. Apply a time multiplier (e.g., 60.0) to match original frame-based speeds.
