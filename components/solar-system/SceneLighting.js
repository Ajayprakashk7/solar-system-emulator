'use client';

export default function SceneLighting() {
  return (
    <>
      {/* Space has no blue studio-style fill light. Keep only a very low neutral
          ambient floor so the unlit hemisphere remains readable on displays;
          direct illumination comes from the Sun's point light. */}
      <ambientLight intensity={0.035} color={0xffffff} />
      <hemisphereLight
        skyColor={0x111827}
        groundColor={0x000000}
        intensity={0.025}
      />
    </>
  );
}
