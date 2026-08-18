## 2026-08-18 - O(1) Running Sum for Frame Monitors
**Learning:** In continuous high-frequency tick monitors like FPSMonitor, using Array.reduce to compute sliding window averages is an unnecessary O(N) operation that wastes cycles. Maintaining an O(1) running sum (adding the incoming delta, subtracting the shifted out delta) is much more efficient.
**Action:** Always use running sums for sliding window calculations in render loops or continuous monitors.
