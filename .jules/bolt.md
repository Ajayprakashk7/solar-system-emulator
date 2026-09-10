## 2024-05-18 - AsteroidBelt Memory Optimization
**Learning:** Instancing `Object3D` for matrix calculations inside high-frequency components creates overhead.
**Action:** Moved `const tempObject = new Object3D();` outside the component scope in `AsteroidBelt.js` to avoid `useMemo` overhead and multiple instantiations if the component remounts or is duplicated.

## 2024-05-18 - CosmicDust Memory Optimization
**Learning:** `new Float32Array` inside `useMemo` triggers garbage collection when the memo resets, but since `CosmicDust.js` calculates it once and doesn't re-render often, it is somewhat ok, though we can avoid the dynamic array allocations if needed.
**Action:** In `Moons.js`, `MoonOrbits` calculates `Float32Array` on memoize which is fine for now but could be further optimized by sharing a single pre-allocated array.

## 2024-05-18 - Planets.js Material Optimization
**Learning:** Creating materials inline or with excessive props causes Three.js to recompile shaders.
**Action:** `Planets.js` uses pre-defined `PLANET_MATERIALS` constant outside of render loop which is a good practice.
