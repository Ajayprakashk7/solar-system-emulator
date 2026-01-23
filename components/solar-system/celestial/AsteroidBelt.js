// AsteroidBelt.js - Realistic asteroid belt between Mars and Jupiter
'use client';
import { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils, Vector3 } from 'three';
import { nasaAPI } from '../services/nasaAPI';
import { nasaLogger } from '../../../lib/logger';

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
  const materialRef = useRef();
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
  
  // Generate asteroid static positions and rotation attributes
  const { initialData, attributes } = useMemo(() => {
    const tempObject = new Object3D();
    const axis = new Vector3();

    const rotationAxes = new Float32Array(asteroidCount * 3);
    const rotationSpeeds = new Float32Array(asteroidCount);

    // We'll store initial transforms to set the instanceMatrix once
    const initialTransforms = [];

    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      const y = heightVariation;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
      const scale = MathUtils.lerp(0.002, 0.008, Math.random());

      // Random initial rotation (static part)
      const rotationX = Math.random() * Math.PI;
      const rotationY = Math.random() * Math.PI;
      const rotationZ = Math.random() * Math.PI;

      tempObject.position.set(x, y, z);
      tempObject.rotation.set(rotationX, rotationY, rotationZ);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();

      initialTransforms.push(tempObject.matrix.clone());

      // Attributes for GPU animation
      // Random axis
      axis.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      axis.toArray(rotationAxes, i * 3);

      // Random speed
      rotationSpeeds[i] = (Math.random() - 0.5) * 2.0; // Scaled up slightly for visibility
    }

    return {
      initialData: initialTransforms,
      attributes: {
        rotationAxes,
        rotationSpeeds
      }
    };
  }, [asteroidCount]);

  // Set instance matrices once
  useEffect(() => {
    if (meshRef.current) {
      initialData.forEach((matrix, i) => {
        meshRef.current.setMatrixAt(i, matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [initialData]);

  const onBeforeCompile = useMemo(() => (shader) => {
    shader.uniforms.uTime = { value: 0 };
    
    shader.vertexShader = `
      attribute vec3 aRotationAxis;
      attribute float aRotationSpeed;
      uniform float uTime;
      
      mat4 rotationMatrix(vec3 axis, float angle) {
          axis = normalize(axis);
          float s = sin(angle);
          float c = cos(angle);
          float oc = 1.0 - c;

          return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                      oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                      oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                      0.0,                                0.0,                                0.0,                                1.0);
      }
    ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      
      // Apply rotation based on time and random axis/speed
      mat4 rot = rotationMatrix(aRotationAxis, uTime * aRotationSpeed);
      vec4 rotatedPos = rot * vec4(transformed, 1.0);
      transformed = rotatedPos.xyz;
      `
    );
    
    // Save reference to shader for uTime updates
    materialRef.current = shader;
  }, []);

  useFrame((state) => {
    if (materialRef.current && materialRef.current.uniforms.uTime) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, asteroidCount]}>
      <icosahedronGeometry args={[1, 0]}>
        <instancedBufferAttribute
          attach="attributes-aRotationAxis"
          args={[attributes.rotationAxes, 3]}
        />
        <instancedBufferAttribute
          attach="attributes-aRotationSpeed"
          args={[attributes.rotationSpeeds, 1]}
        />
      </icosahedronGeometry>
      <meshStandardMaterial 
        color="#8B4513"
        roughness={0.9}
        metalness={0.1}
        onBeforeCompile={onBeforeCompile}
      />
    </instancedMesh>
  );
}
