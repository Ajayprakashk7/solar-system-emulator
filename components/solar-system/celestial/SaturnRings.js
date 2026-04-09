// SaturnRings.js - Performance optimized
'use client';
import { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { TextureLoader, DoubleSide } from "three";

export default function SaturnRings({
  texturePath,
  innerRadius,
  outerRadius,
}) {
  const texture = useLoader(TextureLoader, texturePath);
  // Reduced from 128 to 64 segments - ring is flat, segments barely visible
  const ringArgs = useMemo(() => [innerRadius, outerRadius, 64], [innerRadius, outerRadius]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={ringArgs} />
      <meshStandardMaterial
        {...(texture ? { map: texture } : {})}
        side={DoubleSide}
        transparent
      />
    </mesh>
  );
}
