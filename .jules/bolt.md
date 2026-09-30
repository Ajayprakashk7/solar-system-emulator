## YYYY-MM-DD - Fix WebGL Memory leaks and Frustum Culling
**Learning:** Explicitly calling dispose on Drei OrbitControls causes memory leaks and destroys canvas cleanup. InstancedMesh and dynamically generated buffer geometries must have bounding spheres manually computed and frustum culling enabled to maintain 60 FPS on low end devices.
**Action:** Never explicitly dispose of Drei controls in cleanup blocks. Always set frustumCulled={true} and compute bounding spheres for custom point and instance meshes.
