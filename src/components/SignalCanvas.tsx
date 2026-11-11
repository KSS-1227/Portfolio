"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type * as THREE from "three";
import { useReducedMotion } from "./MotionProvider";

// Deterministic pseudo-random generator for 100% repeatable scatter
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function SignalCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { reducedMotion } = useReducedMotion();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let animId: number;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    let isVisible = true;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let cleanupThree: (() => void) | null = null;

    // Lazy-load Three.js so initial first paint is not blocked
    import("three").then(async (THREE) => {
      if (!isMounted) return;

      // 1. Setup Three.js Scene, Camera, WebGLRenderer
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 2000);
      camera.position.set(0, 0, 780);

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        });
      } catch (err) {
        console.warn("WebGL not supported:", err);
        return;
      }

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);

      // 2. High-Resolution Texture Loading (with sRGBColorSpace, anisotropy, mipmaps)
      const textureLoader = new THREE.TextureLoader();

      const loadTextureWithFallback = (
        url: string,
        fallbackGenerator?: () => THREE.Texture
      ): Promise<THREE.Texture> => {
        return new Promise((resolve) => {
          textureLoader.load(
            url,
            (tex) => {
              tex.colorSpace = THREE.SRGBColorSpace;
              tex.generateMipmaps = true;
              tex.minFilter = THREE.LinearMipmapLinearFilter;
              tex.magFilter = THREE.LinearFilter;
              tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
              resolve(tex);
            },
            undefined,
            () => {
              console.warn(`Asset ${url} failed to load, using generated fallback`);
              if (fallbackGenerator) {
                resolve(fallbackGenerator());
              } else {
                resolve(new THREE.Texture());
              }
            }
          );
        });
      };

      // Procedural soft radial depth fallback if depth file is missing
      const createRadialDepthFallback = (): THREE.Texture => {
        const offCanvas = document.createElement("canvas");
        offCanvas.width = 256;
        offCanvas.height = 320;
        const ctx = offCanvas.getContext("2d");
        if (ctx) {
          const grad = ctx.createRadialGradient(128, 110, 10, 128, 130, 125);
          grad.addColorStop(0, "#ffffff");
          grad.addColorStop(0.65, "#777777");
          grad.addColorStop(1, "#000000");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 256, 320);
        }
        const tex = new THREE.CanvasTexture(offCanvas);
        tex.needsUpdate = true;
        return tex;
      };

      const [colorTexture, depthTexture] = await Promise.all([
        loadTextureWithFallback("/images/karthik.png"),
        loadTextureWithFallback(
          "/images/karthik-depth.png",
          createRadialDepthFallback
        ),
      ]);

      if (!isMounted) return;

      // 3. LAYER 1: BASE CONTINUOUS SUBDIVIDED PLANE (256x320 segments)
      // Smooth surface, NO tiles, NO seams, NO visible grid at rest
      const planeGeom = new THREE.PlaneGeometry(1, 1, 256, 320);

      // Shared uniforms between Layer 1 and Layer 2
      const sharedUniforms = {
        uColorMap: { value: colorTexture },
        uDepthMap: { value: depthTexture },
        uPortraitSize: { value: new THREE.Vector2(240, 300) },
        uTileSize: { value: new THREE.Vector2(240 / 24, 300 / 30) },
        uMaxDepth: { value: 240 * 0.08 }, // Subtle displacement: 0.08 of portrait width
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2(-9999, -9999) },
        uPointerStrength: { value: 0.0 },
        uRepulsionRadius: { value: 240 * 0.16 },
        uTilt: { value: new THREE.Vector2(0, 0) }, // [tiltX, tiltY] up to ~5 deg
      };

      // Layer 1 Unlit Custom ShaderMaterial
      const layer1Material = new THREE.ShaderMaterial({
        uniforms: sharedUniforms,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
        vertexShader: `
          precision highp float;

          uniform sampler2D uDepthMap;
          uniform vec2 uPortraitSize;
          uniform float uMaxDepth;
          uniform vec2 uTilt;

          varying vec2 vUv;
          varying vec3 vWorldPos;

          mat3 rotateXY(vec2 angles) {
            float cx = cos(angles.x);
            float sx = sin(angles.x);
            float cy = cos(angles.y);
            float sy = sin(angles.y);
            return mat3(
              cy, 0.0, -sy,
              sx * sy, cx, sx * cy,
              cx * sy, -sx, cx * cy
            );
          }

          void main() {
            vUv = uv;

            // Sample pre-blurred anatomical depth map
            float depth = texture2D(uDepthMap, uv).r;

            // Smooth subtle displacement (0.08 of width)
            float dispZ = (depth - 0.45) * uMaxDepth;

            // Scale to portrait dimensions
            vec3 localPos = vec3(position.x * uPortraitSize.x, position.y * uPortraitSize.y, dispZ);

            // Parallax tilt (up to ~5 deg)
            mat3 tiltMat = rotateXY(uTilt);
            vec3 tilted = tiltMat * localPos;

            vWorldPos = tilted;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(tilted, 1.0);
          }
        `,
        fragmentShader: `
          precision highp float;

          uniform sampler2D uColorMap;
          uniform float uProgress;
          uniform vec2 uPointer;
          uniform float uPointerStrength;
          uniform float uRepulsionRadius;

          varying vec2 vUv;
          varying vec3 vWorldPos;

          void main() {
            vec4 col = texture2D(uColorMap, vUv);
            if (col.a < 0.015) discard;

            // Strong exposure lift so face reads clearly against #030303
            // gamma 0.80 (brightens) + 1.18x multiplier
            vec3 lifted = pow(col.rgb, vec3(0.80)) * 1.18;

            // Global scroll crossfade (Layer 1 fades out completely over p = 0.00 to 0.08)
            float globalFade = 1.0 - smoothstep(0.0, 0.08, uProgress);

            // Local hover crossfade: within repulsion radius, smoothly crossfade to Layer 2
            float dCursor = length(vWorldPos.xy - uPointer);
            float pFade = 1.0 - smoothstep(0.0, 0.45, uProgress);
            float hoverMask = (1.0 - smoothstep(0.0, uRepulsionRadius, dCursor)) * uPointerStrength * pFade;

            // Layer 1 is 100% visible at rest, punches a soft radial hole ONLY under the cursor
            float layer1Alpha = col.a * globalFade * (1.0 - hoverMask);
            if (layer1Alpha < 0.01) discard;

            gl_FragColor = vec4(lifted, layer1Alpha);
          }
        `,
      });

      const layer1Mesh = new THREE.Mesh(planeGeom, layer1Material);
      layer1Mesh.frustumCulled = false;
      scene.add(layer1Mesh);

      // 4. LAYER 2: TILES (Instanced flat quads with 0.5px overlap, only during scroll & hover)
      const isMobile = window.innerWidth < 768;
      const cols = isMobile ? 12 : 24;
      const rows = isMobile ? 16 : 30;

      // Extract pixel alpha and depth data on offscreen canvas for active tile filtering
      const offscreenC = document.createElement("canvas");
      offscreenC.width = cols;
      offscreenC.height = rows;
      const offCtx = offscreenC.getContext("2d");

      let colorData: Uint8ClampedArray | null = null;
      let depthData: Uint8ClampedArray | null = null;

      if (offCtx && colorTexture.image) {
        offCtx.drawImage(colorTexture.image as CanvasImageSource, 0, 0, cols, rows);
        colorData = offCtx.getImageData(0, 0, cols, rows).data;
      }
      if (offCtx && depthTexture.image) {
        offCtx.clearRect(0, 0, cols, rows);
        offCtx.drawImage(depthTexture.image as CanvasImageSource, 0, 0, cols, rows);
        depthData = offCtx.getImageData(0, 0, cols, rows).data;
      }

      interface TileData {
        col: number;
        row: number;
        u: number;
        v: number;
        depth: number;
        alpha: number;
        dirX: number;
        dirY: number;
        dirZ: number;
        seed: number;
      }

      const activeTiles: TileData[] = [];
      const rand = mulberry32(1337);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = (r * cols + c) * 4;
          const a = colorData ? colorData[idx + 3] / 255 : 1.0;
          if (a < 0.04) continue; // Skip pure void background tiles

          const rawD = depthData ? depthData[idx] / 255 : 0.5;
          const u = (c + 0.5) / cols;
          const v = (r + 0.5) / rows;

          const side = u < 0.5 ? -1 : 1;
          const distCenter = Math.abs(u - 0.5) * 2.0;

          // Deterministic seeded scatter offsets
          const dirX = side * (0.8 + distCenter * 1.6 + rand() * 0.7);
          const dirY = (rand() - 0.48) * 0.9;
          const dirZ = (rand() - 0.3) * 0.8;
          const seed = rand();

          activeTiles.push({
            col: c,
            row: r,
            u,
            v,
            depth: rawD,
            alpha: a,
            dirX,
            dirY,
            dirZ,
            seed,
          });
        }
      }

      const numInstances = activeTiles.length;

      const baseQuad = new THREE.PlaneGeometry(1, 1);
      const instancedGeometry = new THREE.InstancedBufferGeometry();
      instancedGeometry.index = baseQuad.index;
      instancedGeometry.attributes.position = baseQuad.attributes.position;
      instancedGeometry.attributes.uv = baseQuad.attributes.uv;

      const aTileCenter = new Float32Array(numInstances * 2);
      const aTileUv = new Float32Array(numInstances * 4);
      const aDepth = new Float32Array(numInstances);
      const aScatterDir = new Float32Array(numInstances * 3);
      const aSeed = new Float32Array(numInstances);
      const aAlpha = new Float32Array(numInstances);

      for (let i = 0; i < numInstances; i++) {
        const t = activeTiles[i];
        aTileCenter[i * 2] = t.u - 0.5;
        aTileCenter[i * 2 + 1] = -(t.v - 0.5);

        const uMin = t.col / cols;
        const vMin = 1.0 - (t.row + 1) / rows;
        const uSize = 1.0 / cols;
        const vSize = 1.0 / rows;
        aTileUv[i * 4] = uMin;
        aTileUv[i * 4 + 1] = vMin;
        aTileUv[i * 4 + 2] = uSize;
        aTileUv[i * 4 + 3] = vSize;

        aDepth[i] = t.depth;
        aScatterDir[i * 3] = t.dirX;
        aScatterDir[i * 3 + 1] = t.dirY;
        aScatterDir[i * 3 + 2] = t.dirZ;
        aSeed[i] = t.seed;
        aAlpha[i] = t.alpha;
      }

      instancedGeometry.setAttribute(
        "aTileCenter",
        new THREE.InstancedBufferAttribute(aTileCenter, 2)
      );
      instancedGeometry.setAttribute(
        "aTileUv",
        new THREE.InstancedBufferAttribute(aTileUv, 4)
      );
      instancedGeometry.setAttribute(
        "aDepth",
        new THREE.InstancedBufferAttribute(aDepth, 1)
      );
      instancedGeometry.setAttribute(
        "aScatterDir",
        new THREE.InstancedBufferAttribute(aScatterDir, 3)
      );
      instancedGeometry.setAttribute(
        "aSeed",
        new THREE.InstancedBufferAttribute(aSeed, 1)
      );
      instancedGeometry.setAttribute(
        "aAlpha",
        new THREE.InstancedBufferAttribute(aAlpha, 1)
      );

      // Layer 2 ShaderMaterial (Instanced flat quads, seamless 1.0 scale + 0.5px overlap at rest)
      const layer2Material = new THREE.ShaderMaterial({
        uniforms: sharedUniforms,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
        vertexShader: `
          precision highp float;

          attribute vec2 aTileCenter;
          attribute vec4 aTileUv;
          attribute float aDepth;
          attribute vec3 aScatterDir;
          attribute float aSeed;
          attribute float aAlpha;

          uniform vec2 uPortraitSize;
          uniform vec2 uTileSize;
          uniform float uMaxDepth;
          uniform float uProgress;
          uniform float uTime;
          uniform vec2 uPointer;
          uniform float uPointerStrength;
          uniform float uRepulsionRadius;
          uniform vec2 uTilt;

          varying vec2 vUv;
          varying float vAlpha;
          varying vec3 vWorldPos;
          varying float vScatter;

          mat3 rotateXY(vec2 angles) {
            float cx = cos(angles.x);
            float sx = sin(angles.x);
            float cy = cos(angles.y);
            float sy = sin(angles.y);
            return mat3(
              cy, 0.0, -sy,
              sx * sy, cx, sx * cy,
              cx * sy, -sx, cx * cy
            );
          }

          void main() {
            // Flat quads: exactly 1.0 scale with 0.5px subtle overlap at rest
            vec3 localPos = vec3(position.x * (uTileSize.x + 0.5), position.y * (uTileSize.y + 0.5), 0.0);

            vUv = vec2(aTileUv.x + uv.x * aTileUv.z, aTileUv.y + uv.y * aTileUv.w);
            vAlpha = aAlpha;

            // Z matches Layer 1 displaced surface exactly
            float baseZ = (aDepth - 0.45) * uMaxDepth;
            vec3 tilePos = vec3(aTileCenter * uPortraitSize, baseZ);

            // Depth Parallax
            vec2 depthParallaxShift = uTilt.yx * vec2(1.0, -1.0) * ((aDepth - 0.5) * 16.0);
            tilePos.xy += depthParallaxShift;

            // Local Cursor Repulsion
            float pFade = 1.0 - smoothstep(0.0, 0.45, uProgress);
            float distToCursor = length(tilePos.xy - uPointer);

            if (distToCursor < uRepulsionRadius && uPointerStrength > 0.001) {
              float factor = 1.0 - smoothstep(0.0, uRepulsionRadius, distToCursor);
              float push = factor * factor * (3.0 - 2.0 * factor) * uPointerStrength * pFade;
              vec2 pushDir = normalize(tilePos.xy - uPointer + vec2(0.0001));

              // Push gently away in x/y and slightly back in z
              tilePos.xy += pushDir * (push * uRepulsionRadius * 0.45);
              tilePos.z -= push * 16.0;

              localPos.xy += pushDir * (push * 2.0);
            }

            // Scroll Disassembly & Deterministic Drift (Pure function of uProgress)
            float p = pow(clamp(uProgress, 0.0, 1.8), 1.3);
            vScatter = p;

            float scatterScale = uPortraitSize.x * 2.6;
            tilePos.x += aScatterDir.x * (p * scatterScale) + sin(uTime * 1.3 + aSeed * 25.0) * (p * 18.0);
            tilePos.y += aScatterDir.y * (p * scatterScale * 0.42) + cos(uTime * 1.6 + aSeed * 18.0) * (p * 15.0);
            tilePos.z += aScatterDir.z * (p * scatterScale * 0.55);

            float tumble = aScatterDir.x * p * 1.1;
            localPos.xy = mat2(cos(tumble), -sin(tumble), sin(tumble), cos(tumble)) * localPos.xy;

            // Whole portrait 3D parallax tilt
            vec3 combined = tilePos + localPos;
            mat3 tiltMat = rotateXY(uTilt);
            vec3 tilted = tiltMat * combined;

            vWorldPos = tilted;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(tilted, 1.0);
          }
        `,
        fragmentShader: `
          precision highp float;

          uniform sampler2D uColorMap;
          uniform float uProgress;
          uniform vec2 uPointer;
          uniform float uPointerStrength;
          uniform float uRepulsionRadius;

          varying vec2 vUv;
          varying float vAlpha;
          varying vec3 vWorldPos;
          varying float vScatter;

          void main() {
            vec4 col = texture2D(uColorMap, vUv);
            if (col.a * vAlpha < 0.02) discard;

            vec3 lifted = pow(col.rgb, vec3(0.80)) * 1.18;

            // Crossfade: Layer 2 is 0.0 at rest (p = 0, no hover)
            // Fades in over p = 0.00 to 0.08 in sync with Layer 1 fading out
            float globalFadeIn = smoothstep(0.0, 0.08, uProgress);

            // Hover: within repulsion radius, Layer 2 locally crossfades in
            float dCursor = length(vWorldPos.xy - uPointer);
            float pFade = 1.0 - smoothstep(0.0, 0.45, uProgress);
            float hoverMask = (1.0 - smoothstep(0.0, uRepulsionRadius, dCursor)) * uPointerStrength * pFade;

            float layer2Weight = clamp(globalFadeIn + hoverMask, 0.0, 1.0);
            if (layer2Weight < 0.01) discard;

            // Cursor specular highlight
            float lightRadius = uRepulsionRadius * 1.6;
            float light = 1.0 - smoothstep(0.0, lightRadius, dCursor);
            float specular = pow(light, 2.0) * 0.28 * uPointerStrength * (1.0 - smoothstep(0.0, 0.5, vScatter));

            // Cool ash-white dissolution as tiles disperse (no warm orange)
            vec3 ashCol = vec3(0.82, 0.86, 0.90);
            vec3 finalRgb = mix(lifted + vec3(specular), ashCol, clamp(vScatter * 0.60, 0.0, 0.85));

            float scatterAlpha = 1.0 - smoothstep(1.05, 1.85, vScatter);

            float grain = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.03;

            gl_FragColor = vec4(clamp(finalRgb + grain, 0.0, 1.0), col.a * vAlpha * layer2Weight * scatterAlpha);
          }
        `,
      });

      const layer2Mesh = new THREE.Mesh(instancedGeometry, layer2Material);
      layer2Mesh.frustumCulled = false;
      scene.add(layer2Mesh);

      // 5. Interactive Physics & Screen Geometry
      let canvasW = 1200;
      let canvasH = 800;
      let portraitW = 380;
      let portraitH = 475;
      let worldPortraitW = 240;
      let worldPortraitH = 300;
      let screenToWorldFactor = 1.0;

      // Spring-smoothed pointer state
      let targetNormX = 0;
      let targetNormY = 0;
      let currentNormX = 0;
      let currentNormY = 0;

      let targetStrength = 0;
      let currentStrength = 0;

      let currentTiltX = 0;
      let currentTiltY = 0;

      let targetPtrWorldX = -9999;
      let targetPtrWorldY = -9999;
      let currentPtrWorldX = -9999;
      let currentPtrWorldY = -9999;

      let targetProgress = 0;
      let currentProgress = 0;

      const handleScroll = () => {
        if (reducedMotion) {
          targetProgress = 0;
          return;
        }
        const scrollY = window.scrollY || window.pageYOffset;
        targetProgress = Math.min(2.0, Math.max(0, scrollY / 700));
      };

      const handlePointerMove = (e: PointerEvent) => {
        if (reducedMotion) return;
        if (e.pointerType === "touch" && e.buttons === 0) return;

        const rect = container.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;

        const ptrScreenX = clientX - rect.width * 0.5;
        const ptrScreenY = rect.height * 0.5 - clientY;

        const ptrWorldX = ptrScreenX * screenToWorldFactor;
        const ptrWorldY = ptrScreenY * screenToWorldFactor;

        targetPtrWorldX = ptrWorldX - layer1Mesh.position.x;
        targetPtrWorldY = ptrWorldY - layer1Mesh.position.y;
        targetStrength = 1.0;

        targetNormX = Math.max(-1.4, Math.min(1.4, targetPtrWorldX / (worldPortraitW * 0.65)));
        targetNormY = Math.max(-1.4, Math.min(1.4, targetPtrWorldY / (worldPortraitH * 0.65)));
      };

      const handlePointerLeave = () => {
        targetStrength = 0.0;
        targetNormX = 0;
        targetNormY = 0;
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      window.addEventListener("pointerleave", handlePointerLeave, { passive: true });

      // Resize calculation with ResizeObserver
      const updateDimensions = (width: number, height: number) => {
        canvasW = width || window.innerWidth;
        canvasH = height || 850;

        const visibleHeight = 2.0 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
        screenToWorldFactor = visibleHeight / canvasH;

        // Increased face size: 32%-35% of width, minimum 340px, max 460px
        portraitW = Math.min(Math.max(canvasW * 0.32, 340), 460);
        portraitH = portraitW * 1.25;

        worldPortraitW = portraitW * screenToWorldFactor;
        worldPortraitH = portraitH * screenToWorldFactor;

        // Clear space below the header: shift portrait up so face sits in the upper half
        // canvasH * 0.5 - offset pushes the portrait center above viewport center
        // A larger offset = portrait higher in the frame
        const portraitScreenY = canvasH * 0.5 - Math.max(190, canvasH * 0.40);
        const worldCenterY = portraitScreenY * screenToWorldFactor;

        layer1Mesh.position.set(0, worldCenterY, 0);
        layer2Mesh.position.set(0, worldCenterY, 0);

        sharedUniforms.uPortraitSize.value.set(worldPortraitW, worldPortraitH);
        sharedUniforms.uTileSize.value.set(worldPortraitW / cols, worldPortraitH / rows);
        sharedUniforms.uMaxDepth.value = worldPortraitW * 0.08;
        sharedUniforms.uRepulsionRadius.value = worldPortraitW * 0.16;

        camera.aspect = canvasW / canvasH;
        camera.updateProjectionMatrix();

        renderer.setSize(canvasW, canvasH, false);
      };

      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            updateDimensions(width, height);
          }
        }
      });
      resizeObserver.observe(container);

      const initialRect = container.getBoundingClientRect();
      updateDimensions(initialRect.width, initialRect.height);

      intersectionObserver = new IntersectionObserver(
        (entries) => {
          isVisible = entries[0].isIntersecting;
        },
        { threshold: 0.05 }
      );
      intersectionObserver.observe(container);

      setIsReady(true);

      // 6. High-Performance Render Loop
      const render = (now: number) => {
        animId = requestAnimationFrame(render);
        if (!isVisible) return;

        currentProgress += (targetProgress - currentProgress) * 0.055;
        sharedUniforms.uProgress.value = currentProgress;
        sharedUniforms.uTime.value = now * 0.001;

        if (!reducedMotion) {
          currentNormX += (targetNormX - currentNormX) * 0.075;
          currentNormY += (targetNormY - currentNormY) * 0.075;

          currentStrength += (targetStrength - currentStrength) * 0.08;
          sharedUniforms.uPointerStrength.value = currentStrength;

          if (currentStrength > 0.001) {
            currentPtrWorldX += (targetPtrWorldX - currentPtrWorldX) * 0.12;
            currentPtrWorldY += (targetPtrWorldY - currentPtrWorldY) * 0.12;
            sharedUniforms.uPointer.value.set(currentPtrWorldX, currentPtrWorldY);
          }

          // Gentle parallax tilt: up to ~5 degrees (0.087 rad)
          const maxTilt = 0.087;
          const targetTiltX = -currentNormY * maxTilt;
          const targetTiltY = currentNormX * maxTilt;

          currentTiltX += (targetTiltX - currentTiltX) * 0.08;
          currentTiltY += (targetTiltY - currentTiltY) * 0.08;

          sharedUniforms.uTilt.value.set(currentTiltX, currentTiltY);
        } else {
          sharedUniforms.uPointerStrength.value = 0;
          sharedUniforms.uTilt.value.set(0, 0);
        }

        renderer.render(scene, camera);
      };

      animId = requestAnimationFrame(render);

      cleanupThree = () => {
        cancelAnimationFrame(animId);
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerleave", handlePointerLeave);
        if (resizeObserver) resizeObserver.disconnect();
        if (intersectionObserver) intersectionObserver.disconnect();
        planeGeom.dispose();
        instancedGeometry.dispose();
        layer1Material.dispose();
        layer2Material.dispose();
        colorTexture.dispose();
        depthTexture.dispose();
        renderer.dispose();
      };
    });

    return () => {
      isMounted = false;
      if (cleanupThree) cleanupThree();
    };
  }, [reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden select-none z-10 pointer-events-auto"
    >
      {/* Soft ambient glow behind portrait — cool neutral, matches #030303 */}
      <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-zinc-700/[0.06] blur-[120px] pointer-events-none" />

      {/* Film Grain & Subtle Vignette Overlay for Authentic Editorial Atmosphere */}
      <div className="absolute inset-0 bg-radial-vignette opacity-35 pointer-events-none" />

      {/* Static Portrait Image (Shown during lazy-load, fades out seamlessly once Three.js is active) */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 pointer-events-none ${
          isReady ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="relative w-[340px] sm:w-[380px] md:w-[440px] aspect-[4/5] -translate-y-10">
          <Image
            src="/images/karthik.png"
            alt="Karthik Sherigara"
            fill
            priority
            sizes="(max-width: 768px) 340px, 460px"
            className="object-contain object-top"
          />
        </div>
      </div>

      {/* Hardware-Accelerated 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-auto"
      />
    </div>
  );
}
