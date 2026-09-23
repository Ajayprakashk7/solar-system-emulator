## 2024-05-20 - Frustum Culling in InstancedMesh
**Learning:** In Three.js, setting `frustumCulled={false}` on a heavily populated `InstancedMesh` like AsteroidBelt or points like CosmicDust disables frustum culling entirely, causing the GPU to render all instances even if they are off-screen. While calculating an accurate bounding sphere for instanced meshes that spread far and wide might be necessary for frustum culling to work, turning it off completely is a major performance bottleneck for a scene with thousands of objects.
**Action:** Always compute a bounding sphere for InstancedMesh geometries to enable frustum culling to work correctly, and remove `frustumCulled={false}`. Call `mesh.computeBoundingSphere()` after updating instances.

## 2024-05-20 - Three.js WebGLRenderer Disposal Memory Leak
**Learning:** In React Three Fiber, if you attach custom logic to the WebGLRenderer (`gl`) instance's `dispose` method without invoking the original method, the renderer is never properly destroyed. This causes a massive memory leak, especially when the component unmounts and remounts, which happens often in Next.js development.
**Action:** When overriding `gl.dispose`, always store a reference to the original method and call it. Example: `const origDispose = gl.dispose.bind(gl); gl.dispose = () => { /* custom logic */; origDispose(); };`
