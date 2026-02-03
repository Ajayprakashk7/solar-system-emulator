## 2024-05-23 - React State in Animation Loop
**Learning:** Using React state (`useState`) to drive animation loops (like orbit progress) causes full component tree re-renders on every frame. In this app, `PlanetsUpdater` was updating `SolarSystem` state every frame, forcing all `Planet` components to re-render, killing performance.
**Action:** Decouple animation from React state. Use `useFrame` + `useRef` for transient values like position/rotation. Only use state for low-frequency UI updates. Use Refs in Contexts to share high-frequency data (like planet positions for camera) without triggering re-renders.

## 2024-05-24 - InstancedMesh CPU Bottleneck
**Learning:** Updating `InstancedMesh` matrices via `setMatrixAt` inside `useFrame` forces a CPU loop over all instances and a GPU bus upload every frame, limiting performance with high instance counts.
**Action:** Move per-instance animation to the vertex shader using `onBeforeCompile`. Initialize `instanceMatrix` with static properties (Position/Scale) once, pass dynamic properties (like rotation speed) as `instancedBufferAttribute`s, and animate using a global `uTime` uniform.
