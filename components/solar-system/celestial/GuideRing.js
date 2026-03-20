// GuideRing.js
'use client';
import React from 'react';
import { Torus } from "@react-three/drei";
import { useCameraContext } from "../contexts/CameraContext";
import { useSpring, animated } from "@react-spring/web";

const GuideRing = React.memo(function GuideRing({ radius }) {
  const { cameraState } = useCameraContext();

  const targetOpacity = (() => {
    switch (cameraState) {
      case "FREE":
      case "MOVING_TO_HOME":
        return 1;
      case "INTRO_ANIMATION":
        return 1;
      case "ZOOMING_IN":
        return 0;
      case "DETAIL_VIEW":
        return 0;
      default:
        return 0;
    }
  })();

  const { opacity } = useSpring({
    opacity: targetOpacity,
    from: { opacity: 0 },
    config: { duration: 1000 },
  });

  const AnimatedMaterial = animated("meshBasicMaterial");

  return (
    <mesh>
      <Torus
        args={[radius, 0.001, 8, 256]}
        position={[0, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <AnimatedMaterial 
          color="#4488ff" 
          transparent 
          opacity={opacity}
          emissive="#001144"
          emissiveIntensity={0.2}
        />
        {/* Fallback material for safety */}
        <meshBasicMaterial attach="material" color="#ffffff" opacity={0} transparent />
      </Torus>
    </mesh>
  );
});

export default GuideRing;
