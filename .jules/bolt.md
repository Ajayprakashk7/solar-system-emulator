## 2026-10-13 - Eliminate array closures in hot loops
**Learning:** High-frequency render loops (like useFrame) called for multiple entities per frame create significant GC pressure when using higher-order array methods like .map.
**Action:** Replace array mapping inside per-frame calculations with direct scalar assignments to prevent garbage accumulation and maintain stable framerates.
