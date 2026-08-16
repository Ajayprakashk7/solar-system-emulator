## 2024-06-25 - O(1) Sliding Window Average for FPS Monitor
**Learning:** Re-evaluating sliding window averages in high-frequency functions (like R3F `useFrame` updates) using `Array.reduce` leads to unnecessary `O(N)` performance overhead on every frame. When `N=60` and the update runs 60 times a second, this creates measurable JS thread execution waste that can impact frame timing budgets on low-end devices.
**Action:** Always prefer maintaining a running sum in `O(1)` time by adding the new value and subtracting the dropped value, avoiding iteration during tick phases completely.
