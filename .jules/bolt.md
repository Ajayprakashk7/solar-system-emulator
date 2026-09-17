## 2024-05-24 - Avoid Inline Arrays in useFrame
**Learning:** Allocating inline arrays inside React Three Fiber's \`useFrame\` (e.g., \`[x, y, z]\`) causes significant garbage collection pressure because it creates hundreds of objects per second across multiple instances. This leads to GC pauses and micro-stutters in the WebGL canvas.
**Action:** Always mutate existing array/Vector3 instances in-place or pass scalar arguments (x, y, z) individually to functions called within high-frequency render loops.
