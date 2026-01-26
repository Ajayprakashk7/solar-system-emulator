## 2024-05-23 - React State in Animation Loop
**Learning:** Using React state (`useState`) to drive animation loops (like orbit progress) causes full component tree re-renders on every frame. In this app, `PlanetsUpdater` was updating `SolarSystem` state every frame, forcing all `Planet` components to re-render, killing performance.
**Action:** Decouple animation from React state. Use `useFrame` + `useRef` for transient values like position/rotation. Only use state for low-frequency UI updates. Use Refs in Contexts to share high-frequency data (like planet positions for camera) without triggering re-renders.

## 2024-05-24 - Geometry Instantiation Overhead
**Learning:** Using helper components like `<Sphere>` from `@react-three/drei` inside mapped components creates a unique geometry buffer for every instance. In a solar system with planets, moons, and atmosphere layers, this led to dozens of duplicate sphere geometries.
**Action:** Use a shared singleton `Geometry` (e.g., `SphereGeometry(1, ...)`) and scale the `<mesh>` instance instead. Create a shared utility for these common geometries.
