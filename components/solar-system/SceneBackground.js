// SceneBackground.js - optimized space environment
'use client';

import { useEffect, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { EquirectangularReflectionMapping, TextureLoader } from 'three';

export default function SceneBackground({ texturePath }) {
  const loadedTexture = useLoader(TextureLoader, texturePath);

  // Configure a clone instead of mutating the cached texture returned by
  // useLoader. The clone is owned by this component and can be disposed safely.
  const backgroundTexture = useMemo(() => {
    const texture = loadedTexture.clone();
    texture.mapping = EquirectangularReflectionMapping;
    texture.flipY = false;
    texture.needsUpdate = true;
    return texture;
  }, [loadedTexture]);

  useEffect(() => () => backgroundTexture.dispose(), [backgroundTexture]);

  // R3F's declarative attach avoids mutating the scene object returned by a
  // hook and restores the previous value automatically on unmount.
  return <primitive object={backgroundTexture} attach="background" />;
}
