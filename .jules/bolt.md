## 2024-05-19 - Garbage Collection Optimization in Orbital Mechanics

**Learning:** Micro-stutters in high-framerate rendering loops (e.g., `useFrame` in R3F) are often caused by per-frame object allocations, leading to high garbage collection (GC) pressure. Modifying helper functions like `elementsAt` and `setVisualPlanetPosition` to return data in-place via an `out = {}` object parameter safely mitigates this overhead, especially when called hundreds of times per second (e.g., for planets and moons).

**Action:** Whenever introducing iterative calculations inside a render loop, utilize persistent scratchpads created via `useRef({})` and provide them to pure helper functions using an optional `out` parameter. Always ensure backwards compatibility for non-hot-path callers by defaulting `out` to `{}`.
