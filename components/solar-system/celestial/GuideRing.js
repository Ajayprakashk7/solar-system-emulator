// GuideRing.js - Performance optimized orbital guide ring
'use client';
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useCameraContext } from "../contexts/CameraContext";

export default function GuideRing({ radius }) {
  const { cameraState } = useCameraContext();
  const materialRef = useRef();

  // Target opacity based on camera state
  const targetOpacity = (cameraState === 'FREE' || cameraState === 'MOVING_TO_HOME' || cameraState === 'INTRO_ANIMATION') ? 0.6 : 0;

  // Simple lerp-based fade instead of react-spring (avoids animation library overhead)
  useFrame(() => {
    if (!materialRef.current) return;
    const current = materialRef.current.opacity;
    const diff = targetOpacity - current;
    // Only update if there's a meaningful difference
    if (Math.abs(diff) > 0.001) {
      materialRef.current.opacity = current + diff * 0.05;
    }
  });

  // Memoize ring geometry args - 64 segments instead of 256 (4x reduction, visually identical for thin rings)
  const torusArgs = useMemo(() => [radius, 0.001, 4, 64], [radius]);

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={torusArgs} />
      <meshBasicMaterial 
        ref={materialRef}
        color="#4488ff" 
        transparent 
        opacity={0}
        depthWrite={false}
      />
    </mesh>
  );
}
