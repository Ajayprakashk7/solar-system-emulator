## YYYY-MM-DD - [Product Improvement]
**Action:** Migrated per-frame matrix update logic for InstancedMesh to a custom GPU vertex shader.
**Reasoning:** Updating 500+ matrices per frame in JS causes CPU overhead. Moving to a shader (using InstancedBufferAttribute and uniforms.uTime) eliminates this overhead and maintains stable high FPS for large groups of static-orbit objects like asteroid fields.
**Note:** When doing rotation in a vertex shader with meshStandardMaterial, you must also rotate `objectNormal` inside `#include <beginnormal_vertex>` or the lighting will break.
