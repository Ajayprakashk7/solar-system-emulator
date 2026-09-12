## 2025-05-18 - Avoid O(N) array operations in high-frequency React Three Fiber loops
**Learning:** Using JS arrays with `shift()` and `reduce()` for sliding window averages inside high-frequency render loops (like `useFrame`) causes excessive garbage collection pressure and significant overhead (~400ms per 1M iterations).
**Action:** Always use a pre-allocated `Float64Array` circular buffer and maintain a running sum to achieve O(1) time complexity (~20ms per 1M iterations) and eliminate GC overhead.
