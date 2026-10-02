## 2024-05-15 - React Three Fiber Frustum Culling with Dynamic Instances
**Learning:** High-density particle systems (`points`) and `InstancedMesh` often disable frustum culling (`frustumCulled={false}`) because dynamic generation means uninitialized matrices yield a zero-radius bounding sphere on mount, causing incorrect culling.
**Action:** Instead of disabling culling entirely, calculate and assign a fixed `boundingSphere` encompassing the maximum expected bounds to `meshRef.current.boundingSphere` (or `meshRef.current.geometry.boundingSphere` for `points`). This allows off-screen particle systems to be properly culled without dynamic computation overhead.

## 2024-05-15 - Drei OrbitControls Lifecycle Management
**Learning:** `OrbitControls` imported from `@react-three/drei` manages its own disposal lifecycle natively. Calling `controls.dispose()` inside a component's `useEffect` cleanup interferes with this and can cause memory leaks and broken camera interactions.
**Action:** Never manually invoke `dispose()` on controls provided by `drei`.

## 2024-05-15 - OrbitControls Target Tracking for Moving Objects
**Learning:** When using `OrbitControls` to focus on dynamic, moving targets (like orbiting planets), setting `controls.target` only on initialization will cause tracking to fail as the object moves.
**Action:** Continuously update `controls.target.copy(planetPos)` every frame during the render loop (`useFrame` or equivalent state updates) before invoking `controls.update()`.
