## 2024-05-23 - React State in Animation Loop
**Learning:** Using React state (`useState`) to drive animation loops (like orbit progress) causes full component tree re-renders on every frame. In this app, `PlanetsUpdater` was updating `SolarSystem` state every frame, forcing all `Planet` components to re-render, killing performance.
**Action:** Decouple animation from React state. Use `useFrame` + `useRef` for transient values like position/rotation. Only use state for low-frequency UI updates. Use Refs in Contexts to share high-frequency data (like planet positions for camera) without triggering re-renders.

## 2026-01-21 - InstancedMesh CPU Bottleneck
**Learning:** Updating `InstancedMesh` matrices in `useFrame` via `setMatrixAt` is expensive for large instance counts (e.g., 500+ asteroids), causing CPU/bus bottlenecks.
**Action:** Move per-instance animation (like rotation) to the Vertex Shader using `material.onBeforeCompile` and `InstancedBufferAttributes`. Bake static transforms (position/scale) into the `instanceMatrix` once.
