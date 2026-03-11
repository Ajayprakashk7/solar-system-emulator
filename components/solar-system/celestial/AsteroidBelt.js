// AsteroidBelt.js - Realistic asteroid belt between Mars and Jupiter
'use client';
import { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils } from 'three';
import { nasaAPI } from '../services/nasaAPI';
import { nasaLogger } from '../../../lib/logger';

export default function AsteroidBelt({ asteroidCount = 500 }) {
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
  
  // Flatten Near-Earth Objects from API data
  const flatNeoList = useMemo(() => {
    if (!neoData?.near_earth_objects) return [];
    return Object.values(neoData.near_earth_objects).flat();
  }, [neoData]);

  // Generate asteroid positions and properties
  const asteroids = useMemo(() => {
    return Array.from({ length: asteroidCount }, (_, i) => {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      let scale = MathUtils.lerp(0.002, 0.008, Math.random());

      // Override scale with real NEO data if available
      if (flatNeoList.length > 0) {
        const neoIndex = i % flatNeoList.length;
        const neo = flatNeoList[neoIndex];
        const diameterMax = neo?.estimated_diameter?.kilometers?.estimated_diameter_max;
        if (diameterMax) {
          // Map diameterMax to a visual scale.
          // An asteroid with diameterMax=1km roughly scales to 0.005 visually.
          scale = diameterMax * 0.005;
          // Clamp scale so extremely large or small NEOs don't break the scene
          scale = MathUtils.clamp(scale, 0.001, 0.02);
        }
      }

      return {
        x: Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5,
        y: heightVariation,
        z: Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5,
        scale,
        rotationX: Math.random() * Math.PI,
        rotationY: Math.random() * Math.PI,
        rotationZ: Math.random() * Math.PI,
        rotationSpeedX: (Math.random() - 0.5) * 0.02,
        rotationSpeedY: (Math.random() - 0.5) * 0.02,
        rotationSpeedZ: (Math.random() - 0.5) * 0.02,
      };
    });
  }, [asteroidCount, flatNeoList]);

  useFrame(() => {
    if (!meshRef.current) return;
    
    asteroids.forEach((asteroid, i) => {
      // Update rotation
      asteroid.rotationX += asteroid.rotationSpeedX;
      asteroid.rotationY += asteroid.rotationSpeedY;
      asteroid.rotationZ += asteroid.rotationSpeedZ;
      
      // Set transform
      tempObject.position.set(asteroid.x, asteroid.y, asteroid.z);
      tempObject.rotation.set(asteroid.rotationX, asteroid.rotationY, asteroid.rotationZ);
      tempObject.scale.setScalar(asteroid.scale);
      tempObject.updateMatrix();
      
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, asteroidCount]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial 
        color="#8B4513"
        roughness={0.9}
        metalness={0.1}
      />
    </instancedMesh>
  );
}
