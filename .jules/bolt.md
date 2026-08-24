## 2024-08-24 - FPSMonitor Array Optimization
**Learning:** High-frequency functions like continuous tick monitors experience significant overhead when using O(N) array operations like `Array.reduce` for sliding window averages, especially during frequent R3F rendering loops.
**Action:** Always utilize a circular buffer (e.g. `Float64Array`) and a running sum (O(1) time complexity) for real-time monitoring functions instead of standard arrays and map/reduce operations to preserve strict rendering budgets.
