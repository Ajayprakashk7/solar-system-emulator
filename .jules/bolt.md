## 2024-05-23 - React State in Animation Loop
**Learning:** Using React state (`useState`) to drive animation loops (like orbit progress) causes full component tree re-renders on every frame. In this app, `PlanetsUpdater` was updating `SolarSystem` state every frame, forcing all `Planet` components to re-render, killing performance.
**Action:** Decouple animation from React state. Use `useFrame` + `useRef` for transient values like position/rotation. Only use state for low-frequency UI updates. Use Refs in Contexts to share high-frequency data (like planet positions for camera) without triggering re-renders.

## 2026-01-24 - Vertex Shader Animation & Normals
**Learning:** When moving rotation logic to Vertex Shader using `onBeforeCompile`, simply rotating `transformed` (position) is insufficient for `MeshStandardMaterial` because lighting calculations rely on `objectNormal`. You must also rotate `objectNormal` in the `<begin_normal>` chunk to ensure correct lighting.
**Action:** Always inject rotation logic into both `<begin_normal>` (for `objectNormal`) and `<begin_vertex>` (for `transformed`) when implementing vertex-based rotation in Three.js materials.
