// SceneBackground.js - Optimized space environment
'use client';
import { useEffect } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import { TextureLoader, EquirectangularReflectionMapping } from "three";

export default function SceneBackground({ texturePath }) {
  const { scene } = useThree();
  const texture = useLoader(TextureLoader, texturePath);
  
  useEffect(() => {
    texture.mapping = EquirectangularReflectionMapping;
    texture.flipY = false;
    
    const prevBackground = scene.background;
    scene.background = texture;
    // REMOVED: scene.environment = texture
    // Setting environment forces ALL materials to compute environment map reflections,
    // which is extremely expensive. Space objects don't need environment reflections.
    
    return () => {
      scene.background = prevBackground;
    };
  }, [texture, scene]);

  return null;
}