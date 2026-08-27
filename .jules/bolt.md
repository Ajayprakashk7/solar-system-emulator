## 2025-02-12 - Eliminate array allocation & O(N) operations in `FPSMonitor` running sum

**Learning:** `useFrame` operations such as the `FPSMonitor` (which ticks every frame) are highly sensitive to inline allocations and O(N) array operations (like `Array.reduce`) due to high frequency execution causing garbage collection pressure and CPU overhead.
**Action:** Replace `Array.push`/`Array.shift` and `Array.reduce` with a `Float64Array` ring buffer, maintaining a running sum and index to achieve O(1) time complexity for moving averages without garbage collection stalls.
