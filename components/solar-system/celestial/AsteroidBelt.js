// AsteroidBelt.js - Realistic asteroid belt between Mars and Jupiter
'use client';
import { useMemo, useRef, useEffect, useState, useCallback, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils } from 'three';
import { nasaAPI } from '../services/nasaAPI';
import { nasaLogger } from '../../../lib/logger';

const AsteroidBelt = memo(function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
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
  
  // Extract real NEO sizes when available
  const neoSizes = useMemo(() => {
    if (!neoData || !neoData.near_earth_objects) return [];

    const sizes = [];
    Object.values(neoData.near_earth_objects).forEach(dateArray => {
      dateArray.forEach(neo => {
        if (neo.estimated_diameter?.kilometers?.estimated_diameter_max) {
          sizes.push(neo.estimated_diameter.kilometers.estimated_diameter_max);
        }
      });
    });
    return sizes;
  }, [neoData]);

  // Cache the procedural base properties to prevent asteroid "pop" when neoSizes loads.
  const proceduralProps = useMemo(() => {
    return Array.from({ length: asteroidCount }, (_, i) => {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      return {
        x: Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5,
        y: heightVariation,
        z: Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5,
        rotationX: Math.random() * Math.PI,
        rotationY: Math.random() * Math.PI,
        rotationZ: Math.random() * Math.PI,
        baseScale: MathUtils.lerp(0.002, 0.008, Math.random()),
        speedX: (Math.random() - 0.5) * 0.02,
        speedY: (Math.random() - 0.5) * 0.02,
        speedZ: (Math.random() - 0.5) * 0.02,
      };
    });
  }, [asteroidCount]);

  // Generate rotation speeds array for instanced geometry buffer
  const rotationSpeeds = useMemo(() => {
    const rotationSpeedsArray = new Float32Array(asteroidCount * 3);
    proceduralProps.forEach((props, i) => {
      rotationSpeedsArray[i * 3] = props.speedX;
      rotationSpeedsArray[i * 3 + 1] = props.speedY;
      rotationSpeedsArray[i * 3 + 2] = props.speedZ;
    });
    return rotationSpeedsArray;
  }, [asteroidCount, proceduralProps]);

  // Set the matrix whenever neoSizes array updates (scaling changes)
  useEffect(() => {
    if (meshRef.current) {
      proceduralProps.forEach((props, i) => {
        let scale;
        if (neoSizes.length > 0) {
          const realSize = neoSizes[i % neoSizes.length];
          scale = MathUtils.clamp(realSize * 0.005, 0.002, 0.012);
        } else {
          scale = props.baseScale;
        }

        tempObject.position.set(props.x, props.y, props.z);
        tempObject.rotation.set(props.rotationX, props.rotationY, props.rotationZ);
        tempObject.scale.setScalar(scale);
        tempObject.updateMatrix();

        meshRef.current.setMatrixAt(i, tempObject.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [asteroidCount, proceduralProps, neoSizes, tempObject]);

  const customMaterialRef = useRef();

  useFrame((state) => {
    if (customMaterialRef.current && customMaterialRef.current.userData.shader) {
      customMaterialRef.current.userData.shader.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const handleBeforeCompile = useCallback((shader) => {
    shader.uniforms.uTime = { value: 0 };

    shader.vertexShader = `
      uniform float uTime;
      attribute vec3 aRotationSpeed;
      ${shader.vertexShader}
    `;
    
    shader.vertexShader = shader.vertexShader.replace(
      `#include <begin_vertex>`,
      `
      #include <begin_vertex>
      
      // Generate rotation matrix based on speed and time
      vec3 rotation = aRotationSpeed * uTime * 60.0;
      
      float cx = cos(rotation.x);
      float sx = sin(rotation.x);
      float cy = cos(rotation.y);
      float sy = sin(rotation.y);
      float cz = cos(rotation.z);
      float sz = sin(rotation.z);

      mat3 rotX = mat3(
        1.0, 0.0, 0.0,
        0.0, cx, -sx,
        0.0, sx, cx
      );

      mat3 rotY = mat3(
        cy, 0.0, sy,
        0.0, 1.0, 0.0,
        -sy, 0.0, cy
      );

      mat3 rotZ = mat3(
        cz, -sz, 0.0,
        sz, cz, 0.0,
        0.0, 0.0, 1.0
      );

      transformed = rotZ * rotY * rotX * transformed;
      `
    );
    
    customMaterialRef.current.userData.shader = shader;
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, asteroidCount]}>
      <icosahedronGeometry args={[1, 0]}>
        <instancedBufferAttribute
          attach="attributes-aRotationSpeed"
          args={[rotationSpeeds, 3]}
        />
      </icosahedronGeometry>
      <meshStandardMaterial 
        ref={customMaterialRef}
        color="#8B4513"
        roughness={0.9}
        metalness={0.1}
        userData={{ shader: null }}
        onBeforeCompile={handleBeforeCompile}
      />
    </instancedMesh>
  );
});

export default AsteroidBelt;
