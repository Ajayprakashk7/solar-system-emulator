// GuideRing.js
'use client';
import { useMemo } from 'react';
import { useCameraContext } from "../contexts/CameraContext";
import { useSpring, animated } from "@react-spring/web";

export default function GuideRing({ radius }) {
  const { cameraState } = useCameraContext();

  const targetOpacity = (() => {
    switch (cameraState) {
      case "FREE":
      case "MOVING_TO_HOME":
        return 0.5; // Changed from 1 to 0.5 for a subtler look
      case "INTRO_ANIMATION":
        return 0.5;
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

  // Calculate points for the orbit line geometry
  const points = useMemo(() => {
    const pointsArray = [];
    const segments = 128; // Reduced from 256 since line doesn't need as many to look round
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pointsArray.push(
        Math.cos(theta) * radius,
        0,
        Math.sin(theta) * radius
      );
    }
    return new Float32Array(pointsArray);
  }, [radius]);

  const AnimatedLineBasicMaterial = animated("lineBasicMaterial");

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={129} // segments + 1
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <AnimatedLineBasicMaterial
        color="#4488ff"
        transparent
        opacity={opacity}
      />
    </line>
  );
}
