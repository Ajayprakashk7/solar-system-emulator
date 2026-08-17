## $(date +%Y-%m-%d) - O(1) Running Sum for Hot Loop Sliding Window Averages
**Learning:** O(N) array reduction (`Array.reduce`) inside high-frequency `tick` or `useFrame` hot paths (running 60x/sec) can cause unnecessary CPU overhead per frame for calculating sliding window averages like FPS monitors.
**Action:** Replace `Array.reduce` for sliding window averages with an O(1) running sum integer. Add the incoming delta to the sum, and subtract the dropped (shifted) delta when the window size is exceeded. This entirely eliminates the loop and makes calculation instantaneous.
