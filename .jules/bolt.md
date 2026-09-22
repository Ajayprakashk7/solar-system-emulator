## 2024-05-15 - Remove inline array allocation in useFrame
**Learning:** Found an inline array allocation inside a high-frequency useFrame loop which causes massive garbage collection pressure and micro-stutters.
**Action:** Always pass scalar coordinates instead of inline arrays to avoid GC pressure in high-frequency R3F loops. Mutate existing arrays or Float32Arrays in-place.
