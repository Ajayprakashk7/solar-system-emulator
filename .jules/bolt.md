## 2026-11-11 - Avoid Per-Frame Object Allocation
**Learning:** High-frequency rendering loops (like `useFrame`) suffer micro-stutters and high GC pressure from creating objects every frame. Specifically, `elementsAt` created a new object on every frame for every planet.
**Action:** When a function called per-frame returns an object, introduce an `out` parameter to populate and return data in-place, allowing safe, caller-controlled object pooling using `useRef({})`.
