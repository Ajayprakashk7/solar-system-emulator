## 2023-10-23 - Split SelectedPlanetContext and Manual Bounding Spheres
**Learning:** Returning frequently updated state and stable actions in a single React Context array forces unnecessary re-renders in heavy 3D consumers. Additionally, relying on computeBoundingSphere on mount for dynamically placed points/instanced meshes can yield 0-radius spheres and cause premature culling.
**Action:** Always split state and actions into separate Contexts/hooks. Manually calculate and assign maximum bounding spheres when using frustumCulled={true}.
