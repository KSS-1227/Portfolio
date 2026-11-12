"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useReducedMotion } from "./MotionProvider";

/**
 * Halftone-dot portrait (three.js).
 *
 *  - One instanced circle per halftone cell. Radius encodes tone (r ~ sqrt(lum)),
 *    colour keeps the warm rim hue. Hex-staggered grid, orthographic pixel space.
 *  - Disassembly is a PURE FUNCTION of scroll progress p: every dot has a
 *    deterministic drift vector + delay generated once from a seeded PRNG;
 *    the vertex shader evaluates position(p) with no time or history.
 *  - Hover: dots inside a radius around the pointer are pushed outward
 *    (stateless in the shader; the pointer position itself is eased).
 */

const PORTRAIT_SRC = "/images/karthik-hero.png";
const ASPECT = 1280 / 1753; // portrait width / height (incl. 12% headroom)
const SEED = 1337;
const TOP_MARGIN = 112; // px between stage top and portrait top (clears the fixed nav + annotation row)

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** scroll px -> progress p in [0,1]; the only input to the disassembly. */
export function scrollToProgress(scrollY: number, viewportH: number) {
  return Math.min(1, Math.max(0, scrollY / (viewportH * 0.9)));
}

export function SignalCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { reducedMotion } = useReducedMotion();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let animId = 0;
    let cleanup: (() => void) | null = null;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    import("three").then(async (THREE) => {
      if (!isMounted) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      } catch {
        setFailed(true);
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);

      // ── load + sample the portrait into a halftone cell grid ────────────────
      const img = await new Promise<HTMLImageElement | null>((res) => {
        const i = new window.Image();
        i.onload = () => res(i);
        i.onerror = () => res(null);
        i.src = PORTRAIT_SRC;
      });
      if (!isMounted) return;
      if (!img) {
        setFailed(true);
        return;
      }

      const mobile = window.innerWidth < 768;
      const cols = mobile ? 76 : 124;
      const rowStep = 0.866; // hex packing
      const rows = Math.round(cols / ASPECT / rowStep);
      const off = document.createElement("canvas");
      off.width = cols;
      off.height = rows;
      const octx = off.getContext("2d", { willReadFrequently: true })!;
      octx.drawImage(img, 0, 0, cols, rows);
      const px = octx.getImageData(0, 0, cols, rows).data;

      const pitch = 1 / cols; // normalised to portrait width
      const rand = mulberry32(SEED);

      const base: number[] = [];
      const rad: number[] = [];
      const colr: number[] = [];
      const drift: number[] = [];
      const delay: number[] = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // always draw rand() in the same order so vectors are index-stable
          const r1 = rand(), r2 = rand(), r3 = rand(), r4 = rand();
          const i = (r * cols + c) * 4;
          const a = px[i + 3] / 255;
          const R = px[i] / 255, G = px[i + 1] / 255, B = px[i + 2] / 255;
          const lum = 0.299 * R + 0.587 * G + 0.114 * B;
          if (a < 0.08 || lum < 0.025) continue;

          const x = (c + 0.5 + (r & 1 ? 0.5 : 0)) * pitch - 0.5;
          const y = 0.5 / ASPECT - (r + 0.5) * pitch * rowStep;
          base.push(x, y);
          rad.push(0.62 * Math.sqrt(Math.min(1, lum * 1.05)) * a * pitch);

          // keep the warm rim hue, otherwise cool white
          const mx = Math.max(R, G, B, 1e-3);
          const sat = Math.min(1, ((mx - Math.min(R, G, B)) / mx) * 2.5);
          colr.push(
            0.94 + (R / mx - 0.94) * sat,
            0.94 + (G / mx - 0.94) * sat,
            0.93 + (B / mx - 0.93) * sat
          );

          // deterministic scatter: outward + upward drift, sweeping left -> right
          const side = x < 0 ? -1 : 1;
          const flip = r4 < 0.12 ? -1 : 1;
          const mag = 0.55 + r1 * 1.1;
          drift.push(side * flip * mag, (r2 - 0.3) * 1.3);
          delay.push(r3 * 0.32 + (x + 0.5) * 0.18);
        }
      }
      const n = base.length / 2;

      const quad = new THREE.PlaneGeometry(1, 1);
      const geom = new THREE.InstancedBufferGeometry();
      geom.index = quad.index;
      geom.attributes.position = quad.attributes.position;
      geom.setAttribute("aBase", new THREE.InstancedBufferAttribute(new Float32Array(base), 2));
      geom.setAttribute("aR", new THREE.InstancedBufferAttribute(new Float32Array(rad), 1));
      geom.setAttribute("aColor", new THREE.InstancedBufferAttribute(new Float32Array(colr), 3));
      geom.setAttribute("aDrift", new THREE.InstancedBufferAttribute(new Float32Array(drift), 2));
      geom.setAttribute("aDelay", new THREE.InstancedBufferAttribute(new Float32Array(delay), 1));
      geom.instanceCount = n;

      const uniforms = {
        uScale: { value: 400 }, // portrait width in px
        uP: { value: 0 },
        uPtr: { value: new THREE.Vector2(-9999, -9999) }, // px, portrait-local
        uPtrS: { value: 0 },
        uRad: { value: 70 },
      };

      const material = new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        vertexShader: /* glsl */ `
          attribute vec2 aBase;
          attribute float aR;
          attribute vec3 aColor;
          attribute vec2 aDrift;
          attribute float aDelay;
          uniform float uScale, uP, uPtrS, uRad;
          uniform vec2 uPtr;
          varying vec2 vLocal;
          varying float vR, vA;
          varying vec3 vCol;

          void main() {
            vec2 pos = aBase * uScale;
            float r = aR * uScale;

            // pointer repulsion (stateless; fades out once disassembly starts)
            vec2 d = pos - uPtr;
            float f = 1.0 - smoothstep(0.0, uRad, length(d));
            float push = f * f * (3.0 - 2.0 * f) * uPtrS * (1.0 - smoothstep(0.0, 0.12, uP));
            pos += normalize(d + vec2(1e-4)) * push * uRad * 0.5;
            r *= 1.0 - 0.25 * push;

            // scroll disassembly: pure function of uP and per-dot seeded vectors
            float t = smoothstep(aDelay, aDelay + 0.5, uP);
            float e = t * t;
            pos += aDrift * uScale * (0.15 * t + 1.15 * e);
            r *= 1.0 - 0.55 * t;

            float rr = max(r, 0.5);
            float cov = min(1.0, (r * r) / 0.25);
            float hs = rr + 1.0;
            vLocal = position.xy * 2.0 * hs;
            vR = rr;
            vA = cov * (1.0 - 0.88 * smoothstep(0.45, 1.0, t));
            vCol = aColor;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos + position.xy * 2.0 * hs, 0.0, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec2 vLocal;
          varying float vR, vA;
          varying vec3 vCol;
          void main() {
            float d = length(vLocal);
            float a = 1.0 - smoothstep(vR - 0.6, vR + 0.6, d);
            a *= vA;
            if (a < 0.01) discard;
            gl_FragColor = vec4(vCol, a);
          }
        `,
      });

      const mesh = new THREE.Mesh(geom, material);
      mesh.frustumCulled = false;
      const scene = new THREE.Scene();
      scene.add(mesh);
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);

      // ── layout ───────────────────────────────────────────────────────────────
      let cw = 1200, ch = 800, pw = 400;
      const layout = (w: number, h: number) => {
        cw = w;
        ch = h;
        let ph = Math.min(Math.max(ch * 0.66, 400), 780);
        pw = ph * ASPECT;
        if (pw > cw * 0.92) {
          pw = cw * 0.92;
          ph = pw / ASPECT;
        }
        camera.left = -cw / 2;
        camera.right = cw / 2;
        camera.top = ch / 2;
        camera.bottom = -ch / 2;
        camera.updateProjectionMatrix();
        mesh.position.set(0, ch / 2 - TOP_MARGIN - ph / 2, 0);
        uniforms.uScale.value = pw;
        uniforms.uRad.value = pw * 0.16;
        renderer.setSize(cw, ch, false);
      };
      const ro = new ResizeObserver((es) => {
        const { width, height } = es[0].contentRect;
        if (width > 0 && height > 0) layout(width, height);
      });
      ro.observe(container);
      const rect0 = container.getBoundingClientRect();
      layout(rect0.width || window.innerWidth, rect0.height || 800);

      // ── input ────────────────────────────────────────────────────────────────
      let tx = -9999, ty = -9999, cx = -9999, cy = -9999, ts = 0, cs = 0;
      const onMove = (e: PointerEvent) => {
        if (reducedMotion) return;
        if (e.pointerType === "touch" && e.buttons === 0) return;
        const r = container.getBoundingClientRect();
        tx = e.clientX - r.left - cw / 2 - mesh.position.x;
        ty = ch / 2 - (e.clientY - r.top) - mesh.position.y;
        if (ts === 0 && cs < 0.01) {
          cx = tx;
          cy = ty;
        }
        ts = 1;
      };
      const onLeave = () => {
        ts = 0;
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);

      let visible = true;
      const io = new IntersectionObserver((es) => (visible = es[0].isIntersecting), { threshold: 0 });
      io.observe(container);

      const render = () => {
        animId = requestAnimationFrame(render);
        if (!visible) return;
        uniforms.uP.value = reducedMotion ? 0 : scrollToProgress(window.scrollY, window.innerHeight);
        cs += (ts - cs) * 0.12;
        cx += (tx - cx) * 0.22;
        cy += (ty - cy) * 0.22;
        uniforms.uPtrS.value = reducedMotion ? 0 : cs;
        uniforms.uPtr.value.set(cx, cy);
        renderer.render(scene, camera);
      };
      animId = requestAnimationFrame(render);

      cleanup = () => {
        cancelAnimationFrame(animId);
        window.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerleave", onLeave);
        ro.disconnect();
        io.disconnect();
        quad.dispose();
        geom.dispose();
        material.dispose();
        renderer.dispose();
      };
    });

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden select-none z-10 pointer-events-none"
    >
      <div className="absolute top-[32%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-zinc-700/[0.06] blur-[120px] pointer-events-none" />

      {failed && (
        <div className="absolute inset-x-0 top-28 flex justify-center">
          <div className="relative h-[min(66%,780px)] aspect-[1280/1753]">
            <Image
              src={PORTRAIT_SRC}
              alt="Karthik Sherigara"
              fill
              priority
              sizes="460px"
              className="object-contain object-top"
            />
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
