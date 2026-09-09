## 2024-09-09 - O(1) Circular Buffer for FPSMonitor
**Learning:** Found that the `FPSMonitor` used an array with `push`, `shift`, and `reduce` operations every frame, which caused unnecessary garbage collection pressure and O(N) complexity in the React Three Fiber render loop.
**Action:** Replaced the array with a pre-allocated `Float64Array` circular buffer and maintained a running sum to achieve O(1) time complexity and eliminate garbage collection pressure.
