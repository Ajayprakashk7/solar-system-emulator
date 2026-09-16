## 2024-05-18 - Avoid Array Allocation in Render Loop
**Learning:** React Three Fiber's `useFrame` loop triggers 60 times a second. Creating inline arrays per frame, especially multiplied by the number of planets, causes high garbage collection pressure which can lead to micro-stutters.
**Action:** Always mutate existing array structures in place or pass individual values directly instead of allocating new structures during `useFrame`.
