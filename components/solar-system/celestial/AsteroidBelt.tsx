// AsteroidBelt.tsx - Realistic asteroid belt between Mars and Jupiter
'use client';
import { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils, InstancedMesh } from 'three';
import { nasaAPI } from '../services/nasaAPI';
import { nasaLogger } from '../../../lib/logger';

interface AsteroidBeltProps {
  asteroidCount?: number;
}

interface NEOData {
  element_count: number;
  near_earth_objects: {
    [date: string]: Array<{
      estimated_diameter: {
        kilometers: {
          estimated_diameter_max: number;
        };
      };
    }>;
  };
}

export default function AsteroidBelt({ asteroidCount = 500 }: AsteroidBeltProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const tempObject = useMemo(() => new Object3D(), []);
  const [neoData, setNeoData] = useState<NEOData | null>(null);
  
  // Asteroid belt parameters (between Mars ~1.5 AU and Jupiter ~5.2 AU)
  const innerRadius = 3.5;
  const outerRadius = 4.8;
  
  // Optionally fetch real Near-Earth Object data from NASA
  useEffect(() => {
    nasaAPI.getNearEarthObjects().then((data: NEOData) => {
      if (data?.element_count > 0) {
        nasaLogger.debug(`Loaded ${data.element_count} near-Earth objects`);
        setNeoData(data);
        // Future enhancement: Use neoData to position asteroids based on real orbital data
        nasaLogger.debug('Integration ready for enhanced asteroid positioning');
      }
    }).catch((error: Error) => {
      nasaLogger.warn('Failed to fetch NEO data, using procedural generation:', error);
    });
  }, []);
  
  // Log NEO data status for debugging
  useEffect(() => {
    if (neoData) {
      nasaLogger.debug('Data available:', neoData.element_count, 'objects');
    }
  }, [neoData]);
  
  // Extract diameters from NEO data if available
  const neoDiameters = useMemo(() => {
    if (!neoData || !neoData.near_earth_objects) return [];

    const diameters: number[] = [];
    Object.values(neoData.near_earth_objects).forEach(dateArray => {
      dateArray.forEach(neo => {
        if (neo.estimated_diameter?.kilometers?.estimated_diameter_max) {
          diameters.push(neo.estimated_diameter.kilometers.estimated_diameter_max);
        }
      });
    });
    return diameters;
  }, [neoData]);

  // Generate asteroid positions and properties
  const asteroids = useMemo(() => {
    return Array.from({ length: asteroidCount }, (_, i) => {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      let scale = MathUtils.lerp(0.002, 0.008, Math.random());

      // Use NEO diameter to influence scale if data is available
      if (neoDiameters.length > 0) {
        // Map NEO diameter (typically 0.01 to 10 km) to our visual scale (0.001 to 0.015)
        const neoDiameter = neoDiameters[i % neoDiameters.length];
        // Ensure scale is reasonable for visualization
        const normalizedDiameter = Math.min(Math.max(neoDiameter, 0.1), 10) / 10;
        scale = MathUtils.lerp(0.002, 0.015, normalizedDiameter);
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
  }, [asteroidCount, neoDiameters]);

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
      
      if (meshRef.current) {
        meshRef.current.setMatrixAt(i, tempObject.matrix);
      }
    });
    
    if (meshRef.current && meshRef.current.instanceMatrix) {
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, asteroidCount]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial 
        color="#8B4513"
        roughness={0.9}
        metalness={0.1}
      />
    </instancedMesh>
  );
}
