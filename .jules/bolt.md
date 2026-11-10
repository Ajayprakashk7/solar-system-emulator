## 2025-02-24 - Optimized orbital elements calculation to reduce Garbage Collection pressure
**Learning:** Returning a new object every frame for each celestial body inside `elementsAt` creates unnecessary GC pressure during hot-paths like `useFrame` in React Three Fiber.
**Action:** Used caller-provided `out` parameter pooling to populate and return data in-place safely for high-framerate rendering loops, reducing object allocations. Provide a default empty object fallback (e.g., `out = {}`) to maintain backward compatibility.
