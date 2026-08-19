## 2025-02-23 - Bolt: O(1) Sliding Window Optimization
**Learning:** In high-frequency functions like React Three Fiber's `useFrame` or continuous tick monitors, avoid O(N) array operations like `Array.reduce` for sliding window averages, which can cause significant frame drops.
**Action:** Always maintain a running sum in O(1) time by adding the new value and subtracting the dropped value, and use typed arrays (e.g., `Float64Array`) as circular buffers to eliminate Garbage Collection (GC) pauses.
