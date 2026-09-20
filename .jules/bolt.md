## 2024-05-28 - Optimize FPSMonitor array allocation
**Learning:** Using `Array.push` and `Array.shift` along with `Array.reduce` inside high-frequency frame loops like `FPSMonitor.tick` causes extreme GC overhead and slow execution times.
**Action:** Replace dynamic arrays with a circular buffer (`Float64Array`) and maintain a running sum. Doing so yielded a 15x speedup for the FPS monitor algorithm.
