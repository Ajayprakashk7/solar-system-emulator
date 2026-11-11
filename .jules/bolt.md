## 2024-05-24 - Optimizing getOrbitalSnapshot to reduce garbage collection pressure

**Learning:** `getOrbitalSnapshot` returns a new object literal every time it is called. Since it can be called very frequently (e.g., inside a `useFrame` loop for animations), returning a new object on each invocation causes excessive object allocations, leading to high garbage collection (GC) pressure and potential micro-stutters during rendering.

**Action:** Modified `getOrbitalSnapshot` in `components/solar-system/lib/orbitalMechanics.js` to accept an optional `out` parameter that defaults to an empty object. By writing properties to this provided object and returning it, callers can pass a cached or pre-allocated object to update in place, thereby avoiding per-frame object creations and reducing GC overhead. Also updated `scripts/test-orbital-mechanics.mjs` to ensure the regression checks still pass with the new signature.
