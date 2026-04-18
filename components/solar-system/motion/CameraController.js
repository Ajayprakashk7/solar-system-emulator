// CameraController.js (Performance Optimized)
'use client';
import { useRef, useEffect, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { OrbitControls as DreiOrbitControls } from "@react-three/drei";
import { useSelectedPlanet } from "../contexts/SelectedPlanetContext";
import { usePlanetPositions } from "../contexts/PlanetPositionsContext";
import { useCameraContext } from "../contexts/CameraContext";
import { useCameraSetup } from "../hooks/useCameraSetup";

// Constants for camera configuration
const CAMERA = {
  LERP_FACTOR: 0.015,
  POSITION_EPSILON: 0.1,
  FAST_LERP_FACTOR: 0.04,
  HOME_POSITION: new Vector3(11, 1, 1),
  ORBIT_CONTROLS: {
    ROTATE_SPEED: 0.8,
    ZOOM_SPEED: 1.0,
    DAMPING_FACTOR: 0.05,
    MIN_POLAR_ANGLE: Math.PI / 6,
    MAX_POLAR_ANGLE: Math.PI / 1.5,
    AUTO_ROTATE_SPEED: 0.5
  }
};

const DISTANCE_FACTORS = {
  SUN: {
    MIN: 1.5,
    MAX: 10,
    OFFSET: new Vector3(8, 4, 6),
    SCALE: 0.4
  },
  JUPITER: {
    MIN: 1.2,
    MAX: 5,
    VERTICAL_OFFSET: 2.0,
    DISTANCE_FACTOR: 5
  },
  DEFAULT_PLANET: {
    MIN: 1.2,
    MAX: 3,
    VERTICAL_OFFSET: 1.5,
    DISTANCE_FACTOR: 3
  }
};

// Scratch vectors - allocated once, reused forever
const _UP_VEC = new Vector3(0.3, 0.7, 0.2).normalize();

const getPlanetPosition = (selectedPlanet, planetPositionsRef, target) => {
  if (!selectedPlanet) return null;
  
  if (selectedPlanet.isSun) {
    return target.set(0, 0, 0);
  }
  
  if (selectedPlanet.isMoon && selectedPlanet.position) {
    return target.set(
      selectedPlanet.position.x,
      selectedPlanet.position.y,
      selectedPlanet.position.z
    );
  }
  
  const currentPosition = planetPositionsRef.current?.[selectedPlanet.name];
  return currentPosition ? target.fromArray(currentPosition) : null;
};

const calculateCameraOffset = (planetPosition, selectedPlanet, target, scratch) => {
  target.set(0, 0, 0).sub(planetPosition).normalize();
  
  let config;
  if (selectedPlanet.isMoon) {
    config = { VERTICAL_OFFSET: 0.3, DISTANCE_FACTOR: 8 };
  } else if (selectedPlanet.name === 'Jupiter') {
    config = DISTANCE_FACTORS.JUPITER;
  } else {
    config = DISTANCE_FACTORS.DEFAULT_PLANET;
  }

  scratch.copy(_UP_VEC).multiplyScalar(config.VERTICAL_OFFSET);

  return target
    .multiplyScalar(-1)
    .add(scratch)
    .normalize()
    .multiplyScalar(selectedPlanet.radius * config.DISTANCE_FACTOR);
};

export default function CameraController() {
  useCameraSetup();

  const orbitControlsRef = useRef(null);
  const invisibleTargetRef = useRef(new Vector3());
  const introAnimationCompleted = useRef(false);

  // Reusable vectors - allocated once in refs
  const _planetPosRef = useRef(new Vector3());
  const _targetPosRef = useRef(new Vector3());
  const _offsetRef = useRef(new Vector3());
  const _scratchRef = useRef(new Vector3());
  const _zeroRef = useRef(new Vector3(0, 0, 0));

  const { camera } = useThree();
  const [selectedPlanet] = useSelectedPlanet();
  const { planetPositionsRef } = usePlanetPositions();
  const { cameraState, setCameraState } = useCameraContext();
  const homePosition = useRef(CAMERA.HOME_POSITION.clone()).current;

  useEffect(() => {
    const controls = orbitControlsRef.current;
    if (!controls) return;
    
    controls.target.copy(invisibleTargetRef.current);
    controls.update();
    
    return () => {
      controls.dispose();
    };
  }, [invisibleTargetRef]);

  // Handle camera state changes - memoized with stable refs
  const updateCameraState = useCallback((state, controls) => {
    if (!controls) return;

    switch (state) {
      case 'FREE':
        // No-op: OrbitControls handles everything in FREE state.
        // Only enable once when transitioning into FREE.
        if (!controls.enabled) {
          controls.enabled = true;
          controls.maxDistance = Infinity;
          controls.update();
        }
        break;

      case 'DETAIL_VIEW':
        if (!selectedPlanet) return;
        
        // Only set up once when entering DETAIL_VIEW
        if (!controls.enabled) {
          const planetPos = getPlanetPosition(selectedPlanet, planetPositionsRef, _planetPosRef.current);
          if (!planetPos) return;
          
          controls.enabled = true;
          controls.target.copy(planetPos);
          
          let distanceConfig;
          if (selectedPlanet.isSun) {
            distanceConfig = DISTANCE_FACTORS.SUN;
          } else if (selectedPlanet.isMoon) {
            distanceConfig = { MIN: 1.5, MAX: 15 };
          } else if (selectedPlanet.name === 'Jupiter') {
            distanceConfig = DISTANCE_FACTORS.JUPITER;
          } else {
            distanceConfig = DISTANCE_FACTORS.DEFAULT_PLANET;
          }
              
          controls.minDistance = selectedPlanet.radius * distanceConfig.MIN;
          controls.maxDistance = selectedPlanet.radius * distanceConfig.MAX;
          controls.update();
        }
        break;

      case 'INTRO_ANIMATION':
        if (!introAnimationCompleted.current) {
          controls.enabled = false;
          camera.position.lerp(homePosition, 0.015);
          camera.lookAt(invisibleTargetRef.current);
          
          if (camera.position.distanceTo(homePosition) < 0.01) {
            introAnimationCompleted.current = true;
            camera.position.copy(homePosition);
            setCameraState('FREE');
          }
        }
        break;

      case 'MOVING_TO_HOME':
        controls.enabled = false;
        camera.position.lerp(homePosition, CAMERA.LERP_FACTOR);
        invisibleTargetRef.current.lerp(_zeroRef.current, CAMERA.LERP_FACTOR);
        camera.lookAt(invisibleTargetRef.current);

        if (camera.position.distanceTo(homePosition) < CAMERA.POSITION_EPSILON &&
            invisibleTargetRef.current.distanceTo(_zeroRef.current) < CAMERA.POSITION_EPSILON) {
          camera.position.copy(homePosition);
          invisibleTargetRef.current.set(0, 0, 0);
          controls.target.copy(invisibleTargetRef.current);
          controls.maxDistance = Infinity;
          controls.update();
          setCameraState('FREE');
        }
        break;

      case 'ZOOMING_IN':
        if (!selectedPlanet) return;
        
        const position = getPlanetPosition(selectedPlanet, planetPositionsRef, _planetPosRef.current);
        if (!position) return;
        
        controls.enabled = false;
        
        // Calculate target camera position
        let targetPosition = _targetPosRef.current;
        if (selectedPlanet.isSun) {
          targetPosition.copy(DISTANCE_FACTORS.SUN.OFFSET)
            .multiplyScalar(selectedPlanet.radius * DISTANCE_FACTORS.SUN.SCALE)
            .add(position);
        } else {
          const offset = calculateCameraOffset(position, selectedPlanet, _offsetRef.current, _scratchRef.current);
          targetPosition.copy(position).add(offset);
        }
        
        // Smooth camera movement
        camera.position.lerp(targetPosition, CAMERA.LERP_FACTOR);
        invisibleTargetRef.current.lerp(position, CAMERA.FAST_LERP_FACTOR);
        camera.lookAt(invisibleTargetRef.current);
        
        // Check if we've reached the target
        const reachedPosition = camera.position.distanceTo(targetPosition) < 
          selectedPlanet.radius * CAMERA.POSITION_EPSILON;
        const reachedLookAt = invisibleTargetRef.current.distanceTo(position) < 
          selectedPlanet.radius * CAMERA.POSITION_EPSILON;
        
        if (reachedPosition && reachedLookAt) {
          controls.target.copy(invisibleTargetRef.current);
          controls.update();
          setCameraState('DETAIL_VIEW');
        }
        break;
    }
  }, [camera, homePosition, planetPositionsRef, selectedPlanet, setCameraState]);

  // Main animation loop
  useFrame(() => {
    const controls = orbitControlsRef.current;
    if (controls) {
      updateCameraState(cameraState, controls);
    }
  });

  return (
    <DreiOrbitControls
      ref={orbitControlsRef}
      enableZoom
      rotateSpeed={CAMERA.ORBIT_CONTROLS.ROTATE_SPEED}
      zoomSpeed={CAMERA.ORBIT_CONTROLS.ZOOM_SPEED}
      enableDamping
      dampingFactor={CAMERA.ORBIT_CONTROLS.DAMPING_FACTOR}
      minPolarAngle={CAMERA.ORBIT_CONTROLS.MIN_POLAR_ANGLE}
      maxPolarAngle={CAMERA.ORBIT_CONTROLS.MAX_POLAR_ANGLE}
      autoRotate={cameraState === 'DETAIL_VIEW'}
      autoRotateSpeed={CAMERA.ORBIT_CONTROLS.AUTO_ROTATE_SPEED}
    />
  );
}
