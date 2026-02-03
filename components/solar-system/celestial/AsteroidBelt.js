// AsteroidBelt.js - Realistic asteroid belt between Mars and Jupiter
'use client';
import { useMemo, useRef, useEffect, useState, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils } from 'three';
import { nasaAPI } from '../services/nasaAPI';
import { nasaLogger } from '../../../lib/logger';

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const tempObject = useMemo(() => new Object3D(), []);
  const [neoData, setNeoData] = useState(null);
  
  // Asteroid belt parameters (between Mars ~1.5 AU and Jupiter ~5.2 AU)
  const innerRadius = 3.5;
  const outerRadius = 4.8;
  
  // Optionally fetch real Near-Earth Object data from NASA
  useEffect(() => {
    nasaAPI.getNearEarthObjects().then((data) => {
      if (data?.element_count > 0) {
        nasaLogger.debug(`Loaded ${data.element_count} near-Earth objects`);
        setNeoData(data);
        // Future enhancement: Use neoData to position asteroids based on real orbital data
        nasaLogger.debug('Integration ready for enhanced asteroid positioning');
      }
    }).catch((error) => {
      nasaLogger.warn('Failed to fetch NEO data, using procedural generation:', error);
    });
  }, []);
  
  // Log NEO data status for debugging
  useEffect(() => {
    if (neoData) {
      nasaLogger.debug('Data available:', neoData.element_count, 'objects');
    }
  }, [neoData]);
  
  // Generate asteroid data and attributes
  const { initialData, attributes } = useMemo(() => {
    const speeds = new Float32Array(asteroidCount * 3);
    const initials = new Float32Array(asteroidCount * 3);
    const data = [];

    for (let i = 0; i < asteroidCount; i++) {
        const angle = (i / asteroidCount) * Math.PI * 2;
        const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
        const heightVariation = (Math.random() - 0.5) * 0.3;

        const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
        const y = heightVariation;
        const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
        const scale = MathUtils.lerp(0.002, 0.008, Math.random());

        // Initial Rotation
        const rx = Math.random() * Math.PI;
        const ry = Math.random() * Math.PI;
        const rz = Math.random() * Math.PI;

        // Rotation Speed (radians per second)
        // Original was ~0.02 rad/frame * 60 fps = 1.2 rad/s
        const speedX = (Math.random() - 0.5) * 0.02 * 60.0;
        const speedY = (Math.random() - 0.5) * 0.02 * 60.0;
        const speedZ = (Math.random() - 0.5) * 0.02 * 60.0;

        initials[i*3] = rx;
        initials[i*3+1] = ry;
        initials[i*3+2] = rz;

        speeds[i*3] = speedX;
        speeds[i*3+1] = speedY;
        speeds[i*3+2] = speedZ;

        data.push({ x, y, z, scale });
    }

    return {
        initialData: data,
        attributes: {
            speeds,
            initials
        }
    };
  }, [asteroidCount]);

  // Initial placement
  useLayoutEffect(() => {
    if (!meshRef.current) return;
    
    initialData.forEach((d, i) => {
      tempObject.position.set(d.x, d.y, d.z);
      tempObject.scale.setScalar(d.scale);
      tempObject.rotation.set(0, 0, 0); // Rotation is handled in the shader
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [initialData, tempObject]);

  // Shader customization to handle rotation on GPU
  const onBeforeCompile = useMemo(() => (shader) => {
    shader.uniforms.uTime = { value: 0 };
    materialRef.current.userData.shader = shader;

    const rotationLogic = `
      uniform float uTime;
      attribute vec3 aRotationSpeed;
      attribute vec3 aInitialRotation;

      mat4 rotation3d(vec3 axis, float angle) {
        axis = normalize(axis);
        float s = sin(angle);
        float c = cos(angle);
        float oc = 1.0 - c;
        return mat4(
          oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
          oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
          oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
          0.0,                                0.0,                                0.0,                                1.0
        );
      }
    `;

    shader.vertexShader = rotationLogic + shader.vertexShader;

    // Inject into begin_vertex for position rotation
    shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        vec3 currentRotation = aInitialRotation + aRotationSpeed * uTime;

        // Apply rotations in X -> Y -> Z order (matches Euler XYZ)
        mat4 rx = rotation3d(vec3(1.0, 0.0, 0.0), currentRotation.x);
        mat4 ry = rotation3d(vec3(0.0, 1.0, 0.0), currentRotation.y);
        mat4 rz = rotation3d(vec3(0.0, 0.0, 1.0), currentRotation.z);

        mat4 rotationMat = rx * ry * rz;

        transformed = (rotationMat * vec4(transformed, 1.0)).xyz;
        `
    );

    // Inject into beginnormal_vertex for normal rotation
    shader.vertexShader = shader.vertexShader.replace(
        '#include <beginnormal_vertex>',
        `
        #include <beginnormal_vertex>

        vec3 currentRotationN = aInitialRotation + aRotationSpeed * uTime;
        mat4 rxN = rotation3d(vec3(1.0, 0.0, 0.0), currentRotationN.x);
        mat4 ryN = rotation3d(vec3(0.0, 1.0, 0.0), currentRotationN.y);
        mat4 rzN = rotation3d(vec3(0.0, 0.0, 1.0), currentRotationN.z);
        mat4 rotationMatN = rxN * ryN * rzN;

        objectNormal = (rotationMatN * vec4(objectNormal, 0.0)).xyz;
        `
    );

  }, []);

  useFrame((state) => {
    if (materialRef.current?.userData?.shader) {
        materialRef.current.userData.shader.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, asteroidCount]}>
      <icosahedronGeometry args={[1, 0]}>
        <instancedBufferAttribute attach="attributes-aRotationSpeed" args={[attributes.speeds, 3]} />
        <instancedBufferAttribute attach="attributes-aInitialRotation" args={[attributes.initials, 3]} />
      </icosahedronGeometry>
      <meshStandardMaterial 
        ref={materialRef}
        color="#8B4513"
        roughness={0.9}
        metalness={0.1}
        onBeforeCompile={onBeforeCompile}
      />
    </instancedMesh>
  );
}
