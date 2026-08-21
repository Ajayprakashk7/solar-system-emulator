## 2025-05-18 - Optimized Trig Math & LOD
**Learning:** Found O(N) bottlenecks in key handlers and expensive Math.acos usage in particle systems. Detailed props allow significant vertex reduction.
**Action:** Use Float64Arrays/sqrt derivations for trig functions, use Detailed for R3F LOD elements, cache indices inside refs.