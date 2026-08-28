## 2024-08-28 - Avoid O(N) operations in continuous monitors
**Learning:** High-frequency functions like `useFrame` or continuous tick monitors cause significant overhead if they use O(N) array operations like `Array.reduce` for sliding window averages, which can cause micro-stutters.
**Action:** Always maintain a running sum in O(1) time (using a circular buffer like `Float64Array`) by adding the new value and subtracting the dropped value, replacing standard JS arrays and `.reduce` computations inside loop-heavy paths.
