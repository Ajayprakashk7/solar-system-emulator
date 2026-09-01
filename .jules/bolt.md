## 2025-02-15 - Array Operations inside game loop
**Learning:** Avoid `Array.push`/`Array.shift`/`Array.reduce` inside game loops (`useFrame`/`tick`) as they create N items scaling and lead to garbage collection pressure.
**Action:** Use pre-allocated `Float64Array` with ring buffer logic and maintain running sum to achieve O(1) tracking.
