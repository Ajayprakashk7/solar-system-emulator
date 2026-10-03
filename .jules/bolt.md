## 2024-05-18 - GPU Animation and Frustum Culling
**Learning:** For dynamic InstancedMesh objects, offloading rotation to the GPU via ShaderMaterial significantly improves CPU time compared to per-frame setMatrixAt calls. Additionally, uninitialized dynamic meshes have a zero-radius bounding sphere, causing premature frustum culling.
**Action:** Use ShaderMaterial for high-entity instance animations, and manually compute and assign a fixed boundingSphere to meshRef.current.boundingSphere to enable proper frustumCulled={true}.
