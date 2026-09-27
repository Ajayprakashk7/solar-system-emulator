## 2025-02-27 - Performance Bottleneck Hunt
**Learning:** InstancedMesh and Points frustum culling was disabled because they need explicit bounding sphere computations in React Three Fiber. Controls were being manually disposed causing lifecycle issues. WebGL memory cleanup logic required proper overriding.
**Action:** Applied bounding spheres to AsteroidBelt and CosmicDust, removed manual controls.dispose(), and bound gl.dispose correctly.
