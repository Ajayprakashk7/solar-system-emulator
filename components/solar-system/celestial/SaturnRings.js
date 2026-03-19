// SaturnRings.js
'use client';
import React from 'react';
import { useLoader } from "@react-three/fiber";
import { TextureLoader, DoubleSide } from "three";
import { Ring } from "@react-three/drei";

const SaturnRings = React.memo(function SaturnRings({
  texturePath,
  innerRadius,
  outerRadius,
}) {
  // Always call hooks unconditionally. If the texture fails to load the loader
  // will still resolve with an empty texture object, so we can safely proceed.
  const texture = useLoader(TextureLoader, texturePath);

  return (
    <Ring
      args={[innerRadius, outerRadius, 128]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <meshStandardMaterial
        {...(texture ? { map: texture } : {})}
        side={DoubleSide}
        transparent={true}
      />
    </Ring>
  );
});

export default SaturnRings;
