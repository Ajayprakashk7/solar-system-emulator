## 2023-10-24 - Proper Frustum Culling for InstancedMesh
**Learning:** When enabling frustum culling on an InstancedMesh in R3F, computing the bounding sphere on the geometry is incorrect and causes visual popping or wrong culling. InstancedMesh instances manage their own boundingSphere to encapsulate the spatial spread of all instances.
**Action:** Always compute the bounding sphere directly on the InstancedMesh instance (meshRef.current.computeBoundingSphere()) rather than modifying the geometry's bounding sphere or entirely disabling frustum culling (frustumCulled={false}).
