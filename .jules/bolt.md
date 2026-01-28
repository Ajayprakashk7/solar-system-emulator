## 2024-05-23 - React State in Animation Loop
**Learning:** Using React state (`useState`) to drive animation loops (like orbit progress) causes full component tree re-renders on every frame. In this app, `PlanetsUpdater` was updating `SolarSystem` state every frame, forcing all `Planet` components to re-render, killing performance.
**Action:** Decouple animation from React state. Use `useFrame` + `useRef` for transient values like position/rotation. Only use state for low-frequency UI updates. Use Refs in Contexts to share high-frequency data (like planet positions for camera) without triggering re-renders.

## 2026-01-28 - CPU vs GPU Animation
**Learning:** Animating `InstancedMesh` matrices in JS `useFrame` loop (O(N) matrix updates) is a major CPU bottleneck.
**Action:** Move per-instance animation to Vertex Shader using `onBeforeCompile` and `instancedBufferAttribute`. Reduces CPU load to O(1) (uniform update).
