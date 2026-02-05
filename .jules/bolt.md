## 2024-05-23 - React State in Animation Loop
**Learning:** Using React state (`useState`) to drive animation loops (like orbit progress) causes full component tree re-renders on every frame. In this app, `PlanetsUpdater` was updating `SolarSystem` state every frame, forcing all `Planet` components to re-render, killing performance.
**Action:** Decouple animation from React state. Use `useFrame` + `useRef` for transient values like position/rotation. Only use state for low-frequency UI updates. Use Refs in Contexts to share high-frequency data (like planet positions for camera) without triggering re-renders.

## 2024-05-24 - InstancedMesh CPU Bottleneck
**Learning:** `AsteroidBelt` was updating 500+ matrices every frame in JS (`useFrame`), causing massive CPU overhead.
**Action:** Moved rotation logic to vertex shader using `onBeforeCompile`. Use `useLayoutEffect` to set static matrices (position/scale) once, and pass rotation data via `instancedBufferAttribute` and `uniforms.uTime`.
