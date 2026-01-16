## 2024-05-23 - Mobile WebGL Crashing (iPhone)
**Learning:** Loading 8k textures (like `stars_8k.webp`) on mobile devices, especially iPhones, can cause immediate crashes due to VRAM limits or WebGL context loss. Even if the device is "high performance" (like newer iPhones), the browser memory limits are strict.
**Action:** Always implement aggressive asset downgrading for mobile. Conditionally load high-res textures. Use a "mobile-first" setting strategy that defaults to lowest quality (no shadows, low geometry, no post-processing) and opts-in to higher quality features only on desktop.
