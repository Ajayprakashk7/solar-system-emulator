## YYYY-MM-DD - [FPSMonitor Garbage Collection Mitigation]
**Learning:** `FPSMonitor` used `Array.push` and `Array.shift` causing garbage collection spikes. It also only reset `length=0` which is ineffective.
**Action:** Implemented a pre-allocated circular buffer (`Float64Array`) and running sum to prevent garbage collection and `O(n)` array operations. Used `.fill(0)` when clearing the buffer to ensure stale data does not leak into the sum on loop wrap-around.
