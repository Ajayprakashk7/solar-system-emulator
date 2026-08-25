## 2025-02-24 - Array.reduce removal in tight loops
**Learning:** O(N) array reduction inside continuous loops like requestAnimationFrame/useFrame can be a performance bottleneck.
**Action:** Replaced Array.reduce with a Float64Array circular buffer tracking a running sum in O(1) time.