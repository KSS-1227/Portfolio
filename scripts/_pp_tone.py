"""Relighting helpers for prepare-portrait.py. All arrays are float32, output space.

NOTE: no step here blurs the face image. Gaussians are only applied to
*masks*, to the (shirt-only) body luminance, or as the unsharp-mask low-pass
that is explicitly added back.
"""
import numpy as np
import cv2


def gb(a, s):
    return cv2.GaussianBlur(a.astype(np.float32), (0, 0), s)


def sstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0 + 1e-9), 0, 1)
    return t * t * (3 - 2 * t)


def patch(xx, yy, cx, cy, s):
    w = np.exp(-(((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * s * s)))
    return w.astype(np.float32)


def wmean(v, w):
    return float((v * w).sum() / (w.sum() + 1e-9))


def softclip(v):
    return np.where(v < 0.7, v, 0.7 + 0.3 * np.tanh((v - 0.7) / 0.3)).astype(np.float32)


def decontaminate(lum, alpha, band=8):
    """Replace the outer `band` px colour with colour from just inside the subject."""
    inside = (alpha > 0.5).astype(np.uint8)
    dist = cv2.distanceTransform(inside, cv2.DIST_L2, 5)
    dist = gb(dist, 1.0)
    core = ((dist > band + 2) & (alpha > 0.95)).astype(np.float32)
    num = gb(lum * core, 6)
    den = gb(core, 6)
    fill = num / np.maximum(den, 1e-3)
    fill = np.where(den > 0.02, fill, lum)
    w = 1.0 - sstep(band - 2, band + 2, dist)        # 1 at contour -> 0 inside
    w = np.where(alpha > 0.0, w, 1.0).astype(np.float32)
    return lum * (1 - w) + fill * w, dist


def key_gain_curve(xs, anchors):
    ax = np.array([a[0] for a in anchors], np.float32)
    ay = np.array([a[1] for a in anchors], np.float32)
    g = np.interp(xs, ax, ay)
    k = int(40 * 6) | 1
    pad = np.pad(g, k, mode="edge")
    g = cv2.GaussianBlur(pad.reshape(1, -1), (0, 0), 40).ravel()[k:-k]
    return g.astype(np.float32)


def unsharp(lum, mask, radius=1.5, amount=0.7, local=0.25, local_sigma=12):
    """Unsharp mask + mild local contrast, applied only through `mask`."""
    low = gb(lum, radius)
    out = lum + amount * (lum - low) * mask
    out = out + local * (lum - gb(lum, local_sigma)) * mask
    return np.clip(out, 0, 1)
