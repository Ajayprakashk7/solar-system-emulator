// CameraController.js - responsive, frame-rate independent camera motion and tracking
'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { OrbitControls as DreiOrbitControls } from '@react-three/drei';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { usePlanetPositions } from '../contexts/PlanetPositionsContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useCameraSetup } from '../hooks/useCameraSetup';

const CAMERA = {
  // Exponential damping means these values are frame-rate independent. The
  // previous 1.1 value made planet selection feel sluggish on large jumps.
  MOVE_SPEED: 2.15,
  LOOK_SPEED: 4.8,
  POSITION_EPSILON: 0.1,
  HOME_POSITION: new Vector3(11, 1, 1),
  FREE_MIN_DISTANCE: 0.5,
  ORBIT_CONTROLS: {
    ROTATE_SPEED: 0.72,
    ZOOM_SPEED: 0.9,
    DAMPING_FACTOR: 0.065,
    MIN_POLAR_ANGLE: Math.PI / 6,
    MAX_POLAR_ANGLE: Math.PI / 1.5,
    AUTO_ROTATE_SPEED: 0.32,
  },
};

const DISTANCE_FACTORS = {
  SUN: {
    MIN: 1.5,
    MAX: 10,
    OFFSET: new Vector3(8, 4, 6),
    SCALE: 0.4,
  },
  JUPITER: {
    MIN: 1.2,
    MAX: 5,
    VERTICAL_OFFSET: 2,
    DISTANCE_FACTOR: 5,
  },
  DEFAULT_PLANET: {
    MIN: 1.2,
    MAX: 3,
    VERTICAL_OFFSET: 1.5,
    DISTANCE_FACTOR: 3,
  },
};

const _UP_VECTOR = new Vector3(0.3, 0.7, 0.2).normalize();

const smoothingFactor = (speed, delta) => 1 - Math.exp(-speed * Math.min(delta, 0.1));

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

const calculateCameraOffset = (
  planetPosition,
  selectedPlanet,
  target,
  scratch,
  responsiveMultiplier
) => {
  target.set(0, 0, 0).sub(planetPosition).normalize();

  let config;
  if (selectedPlanet.isMoon) {
    config = { VERTICAL_OFFSET: 0.3, DISTANCE_FACTOR: 8 };
  } else if (selectedPlanet.name === 'Jupiter') {
    config = DISTANCE_FACTORS.JUPITER;
  } else {
    config = DISTANCE_FACTORS.DEFAULT_PLANET;
  }

  scratch.copy(_UP_VECTOR).multiplyScalar(config.VERTICAL_OFFSET);

  return target
    .multiplyScalar(-1)
    .add(scratch)
    .normalize()
    .multiplyScalar(selectedPlanet.radius * config.DISTANCE_FACTOR * responsiveMultiplier);
};

export default function CameraController() {
  useCameraSetup();

  const orbitControlsRef = useRef(null);
  const invisibleTargetRef = useRef(new Vector3());
  const introAnimationCompleted = useRef(false);
  const planetPositionRef = useRef(new Vector3());
  const targetPositionRef = useRef(new Vector3());
  const offsetRef = useRef(new Vector3());
  const scratchRef = useRef(new Vector3());
  const zeroRef = useRef(new Vector3());

  const { camera, size } = useThree();
  const selectedPlanet = useSelectedPlanet();
  const { planetPositionsRef } = usePlanetPositions();
  const { cameraState, setCameraState } = useCameraContext();
  const homePosition = useRef(CAMERA.HOME_POSITION.clone()).current;

  // Give compact/portrait screens a little more breathing room so a selected
  // body remains fully visible above the responsive bottom sheet.
  const responsiveDistanceMultiplier = useMemo(() => {
    if (size.width < 640) return size.height > size.width ? 1.35 : 1.2;
    if (size.width < 900) return 1.12;
    return 1;
  }, [size.height, size.width]);

  useEffect(() => {
    const controls = orbitControlsRef.current;
    if (!controls) return;

    controls.target.copy(invisibleTargetRef.current);
    controls.update();
    // Drei owns the OrbitControls lifecycle. Manually disposing here can remove
    // listeners while React Three Fiber still expects the control instance.
  }, []);

  const updateCameraState = useCallback(
    (state, controls, delta) => {
      if (!controls) return;

      const moveFactor = smoothingFactor(CAMERA.MOVE_SPEED, delta);
      const lookFactor = smoothingFactor(CAMERA.LOOK_SPEED, delta);

      switch (state) {
        case 'FREE': {
          if (!controls.enabled) controls.enabled = true;
          controls.minDistance = CAMERA.FREE_MIN_DISTANCE;
          controls.maxDistance = Infinity;
          break;
        }

        case 'DETAIL_VIEW': {
          if (!selectedPlanet) return;

          const planetPosition = getPlanetPosition(
            selectedPlanet,
            planetPositionsRef,
            planetPositionRef.current
          );
          if (!planetPosition) return;

          if (!controls.enabled) {
            controls.enabled = true;

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

            controls.minDistance = Math.max(
              CAMERA.FREE_MIN_DISTANCE,
              selectedPlanet.radius * distanceConfig.MIN
            );
            controls.maxDistance = Math.max(
              controls.minDistance * 1.5,
              selectedPlanet.radius * distanceConfig.MAX * responsiveDistanceMultiplier
            );
          }

          controls.target.lerp(planetPosition, lookFactor);
          invisibleTargetRef.current.copy(controls.target);
          controls.update();
          break;
        }

        case 'INTRO_ANIMATION': {
          if (introAnimationCompleted.current) return;

          controls.enabled = false;
          camera.position.lerp(homePosition, moveFactor);
          camera.lookAt(invisibleTargetRef.current);

          if (camera.position.distanceTo(homePosition) < 0.01) {
            introAnimationCompleted.current = true;
            camera.position.copy(homePosition);
            setCameraState('FREE');
          }
          break;
        }

        case 'MOVING_TO_HOME': {
          controls.enabled = false;
          camera.position.lerp(homePosition, moveFactor);
          invisibleTargetRef.current.lerp(zeroRef.current, moveFactor);
          camera.lookAt(invisibleTargetRef.current);

          if (
            camera.position.distanceTo(homePosition) < CAMERA.POSITION_EPSILON &&
            invisibleTargetRef.current.distanceTo(zeroRef.current) < CAMERA.POSITION_EPSILON
          ) {
            camera.position.copy(homePosition);
            invisibleTargetRef.current.set(0, 0, 0);
            controls.target.copy(invisibleTargetRef.current);
            controls.minDistance = CAMERA.FREE_MIN_DISTANCE;
            controls.maxDistance = Infinity;
            controls.update();
            setCameraState('FREE');
          }
          break;
        }

        case 'ZOOMING_IN': {
          if (!selectedPlanet) return;

          const planetPosition = getPlanetPosition(
            selectedPlanet,
            planetPositionsRef,
            planetPositionRef.current
          );
          if (!planetPosition) return;

          controls.enabled = false;
          const targetPosition = targetPositionRef.current;

          if (selectedPlanet.isSun) {
            targetPosition
              .copy(DISTANCE_FACTORS.SUN.OFFSET)
              .multiplyScalar(
                selectedPlanet.radius * DISTANCE_FACTORS.SUN.SCALE * responsiveDistanceMultiplier
              )
              .add(planetPosition);
          } else {
            const offset = calculateCameraOffset(
              planetPosition,
              selectedPlanet,
              offsetRef.current,
              scratchRef.current,
              responsiveDistanceMultiplier
            );
            targetPosition.copy(planetPosition).add(offset);
          }

          camera.position.lerp(targetPosition, moveFactor);
          invisibleTargetRef.current.lerp(planetPosition, lookFactor);
          camera.lookAt(invisibleTargetRef.current);

          const threshold = Math.max(
            0.01,
            selectedPlanet.radius * CAMERA.POSITION_EPSILON
          );
          const reachedPosition = camera.position.distanceTo(targetPosition) < threshold;
          const reachedLookAt =
            invisibleTargetRef.current.distanceTo(planetPosition) < threshold;

          if (reachedPosition && reachedLookAt) {
            controls.target.copy(invisibleTargetRef.current);
            controls.update();
            setCameraState('DETAIL_VIEW');
          }
          break;
        }

        default:
          break;
      }
    },
    [
      camera,
      homePosition,
      planetPositionsRef,
      responsiveDistanceMultiplier,
      selectedPlanet,
      setCameraState,
    ]
  );

  useFrame((_, delta) => {
    const controls = orbitControlsRef.current;
    if (controls) updateCameraState(cameraState, controls, delta);
  });

  return (
    <DreiOrbitControls
      ref={orbitControlsRef}
      enableZoom
      enablePan={false}
      regress
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
