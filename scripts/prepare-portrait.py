"""
Stage 1: halftone-ready portrait (Rev 5).  Stage 2 is NOT started here.
Input : public/images/source/karthik-original.jpg
Output: public/images/karthik-hero.png (+ preview, halo-check, masks-debug)

Rev 5 (vs Rev 4)
 1. Segmentation: isnet-general-use (170 MB) soft mask -> trimap -> closed-form
    alpha matting (PyMatting). Median-smoothed contour + 1.5px gaussian alpha.
    Outer 8px colour replaced from just inside; edge alpha x local luminance.
 2. Hair: CLAHE strand texture through smooth hair mask, calibrated to mean
    ~17% and real stddev; soft top-left highlight (<=45%) that follows strands.
 3. Face: no blur anywhere. Unsharp (r1.5, 70%) + mild local contrast through
    the smooth face mask. Lit/centre/shadow cheek targets auto-calibrated.
 4. Rim: built from smoothed alpha signed-distance field; continuous, 2-3px,
    #ff9a3c @55%, 2px glow, right-hand side, strongest hair/ear, fades down.
 5. Body: smoothed (pattern-free) dim silhouette, lit ~12%, shadow ~6.5%;
    alpha fades only over the bottom 20%.
 6. Uniform scaling only; width/height ratio asserted and printed.
"""
import pathlib
import numpy as np
import cv2
from PIL import Image, ImageDraw

from _pp_seg import segment
from _pp_tone import (gb, sstep, patch, wmean, softclip, decontaminate,
                      key_gain_curve, unsharp)

ROOT = pathlib.Path(__file__).resolve().parents[1]
IMG = ROOT / "public" / "images"
SRC = IMG / "source" / "karthik-original.jpg"
OUT = IMG / "karthik-hero.png"
PREV = IMG / "karthik-hero-preview.png"
HALO = IMG / "karthik-hero-halo-check.png"
DBG = IMG / "karthik-hero-masks-debug.png"

W, H = 1280, 1600
# crop box in the 770x1024 source (head + shoulders); 640x800 == 0.8 == W/H
CX0, CY0, CW, CH = 80, 0, 640, 800

# ── 1. segmentation + uniform crop/resize ────────────────────────────────────
print("> segmenting (isnet + closed-form matting) ...")
rgb, alpha = segment(SRC)
assert CY0 + CH <= rgb.shape[0] and CX0 + CW <= rgb.shape[1]
crop_ratio = CW / CH
out_ratio = W / H
print(f"  crop ratio {crop_ratio:.5f}  output ratio {out_ratio:.5f}")
assert abs(crop_ratio - out_ratio) < 1e-9, "non-uniform scaling!"
sx, sy = W / CW, H / CH
assert abs(sx - sy) < 1e-9
print(f"  scale x={sx:.4f} y={sy:.4f} (uniform)")

rgb_c = rgb[CY0:CY0 + CH, CX0:CX0 + CW]
a_c = alpha[CY0:CY0 + CH, CX0:CX0 + CW]
rgb_o = cv2.resize(rgb_c, (W, H), interpolation=cv2.INTER_CUBIC)
alpha_o = np.clip(cv2.resize(a_c, (W, H), interpolation=cv2.INTER_CUBIC), 0, 1)
alpha_o = gb(alpha_o, 1.0)
alpha_o = sstep(0.30, 0.90, alpha_o)   # tighten soft matte skirt (light halo)

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
lm = lambda x, y: ((x - CX0) * sx, (y - CY0) * sy)   # source -> output coords

lum_raw = (0.299 * rgb_o[..., 0] + 0.587 * rgb_o[..., 1] + 0.114 * rgb_o[..., 2]) / 255.0
lum_dc, dist_in = decontaminate(lum_raw.astype(np.float32), alpha_o, band=8)

# ── 2. masks (all smooth) ─────────────────────────────────────────────────────
fcx, fcy = lm(400, 320)
dface = np.sqrt(((xx - fcx) / 250) ** 2 + ((yy - fcy) / 330) ** 2)
face_mask = gb(sstep(1.1, 0.8, dface) * alpha_o, 14)

lum_s = gb(lum_dc, 3)
hair_raw = alpha_o * sstep(0.36, 0.20, lum_s) * sstep(520, 380, yy)
hair_mask = np.clip(gb(hair_raw, 6), 0, 1)

# ── 3. face tone (key-light curve calibrated to targets) ─────────────────────
print("> face tone ...")
P_LIT = patch(xx, yy, *lm(315, 300), 18)
P_CTR = patch(xx, yy, *lm(400, 310), 18)
P_SHD = patch(xx, yy, *lm(490, 310), 18)
TG = {"lit": 0.86, "ctr": 0.64, "shd": 0.26}
ax_ = [lm(315, 300)[0], lm(400, 310)[0], lm(490, 310)[0]]
gains = [1.6, 1.1, 0.5]
lum_t = np.power(np.clip(lum_dc, 1e-5, 1), 0.5)
xs = np.arange(W, dtype=np.float32)
for _ in range(10):
    G = key_gain_curve(xs, list(zip(ax_, gains)))[None, :]
    lk = softclip(lum_t * G)
    m = [wmean(lk, P_LIT), wmean(lk, P_CTR), wmean(lk, P_SHD)]
    for i, k in enumerate(("lit", "ctr", "shd")):
        gains[i] *= float(np.clip(TG[k] / max(m[i], 1e-3), 0.7, 1.4))
G = key_gain_curve(xs, list(zip(ax_, gains)))[None, :]
lum_face = softclip(lum_t * G)
lum_face = unsharp(lum_face, face_mask, radius=1.5, amount=0.70, local=0.25)

# ── 4. hair ───────────────────────────────────────────────────────────────────
print("> hair ...")
u8 = np.clip(np.power(np.clip(lum_dc, 0, 1), 0.45) * 255, 0, 255).astype(np.uint8)
clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
c = gb(clahe.apply(gb(u8.astype(np.float32), 1.0).astype(np.uint8)).astype(np.float32) / 255.0, 0.9)
hm = hair_mask * (hair_mask > 0.5)
mean_c = wmean(c, hm)
hx, hy = lm(330, 80)
hl_pos = np.exp(-(((xx - hx) ** 2 + (yy - hy) ** 2) / (2 * 300.0 ** 2)))
hl_edge = 0.35 + 0.65 * np.exp(-dist_in / 90.0)
tex = np.clip(0.5 + (c - gb(c, 10)) * 6.0, 0.2, 1.6)
hl_add = 0.30 * hl_pos * hl_edge * tex * hair_mask
mu, s = 0.15, 0.5
for _ in range(14):
    hair_val = np.clip(mu + (c - mean_c) * s + hl_add, 0, 0.45)
    hmean, hstd = wmean(hair_val, hm), float(np.sqrt(wmean((hair_val - wmean(hair_val, hm)) ** 2, hm)))
    mu += 0.17 - hmean
    s *= float(np.clip(0.065 / max(hstd, 1e-3), 0.8, 1.25))
hair_val = np.clip(mu + (c - mean_c) * s + hl_add, 0, 0.45)

# ── 5. body: smooth, pattern-free dim silhouette ─────────────────────────────
print("> body ...")
xf = xx / W
# single smooth vertical gradient x smooth lit->shadow ramp; no local blobs
body = (0.065 + 0.065 * sstep(0.75, 0.25, xf)) * (1.08 - 0.35 * sstep(1000, 1600, yy))
w_body = sstep(800, 1120, yy)
neck_dim = 1.0 - 0.6 * sstep(840, 1000, yy)

head = lum_face * neck_dim
head = head * (1 - hair_mask) + hair_val * hair_mask
lum_final = np.clip(head * (1 - w_body) + body * w_body, 0, 1).astype(np.float32)

# ── 6. alpha: edge-darkening, fades, rim ─────────────────────────────────────
edge_w = 1.0 - sstep(0.0, 8.0, dist_in)
lum_loc = gb(lum_final, 2.0)
alpha_e = alpha_o * ((1 - edge_w) + edge_w * np.clip(lum_loc * 6.0, 0, 1))

edge_fade = (sstep(0.0, 0.20, 1.0 - yy / H) * sstep(0.0, 0.16, xx / W)
             * sstep(0.0, 0.16, 1.0 - xx / W))   # wide ramp: no visible vertical band at crop edges
alpha_f = alpha_e * edge_fade
lum_final = lum_final * (0.35 + 0.65 * sstep(0.0, 10.0, dist_in))

print("> rim light (soft gradient) ...")
inside = (gb(alpha_o, 3.0) > 0.5).astype(np.uint8)
d_in = cv2.distanceTransform(inside, cv2.DIST_L2, 5)
d_out = cv2.distanceTransform(1 - inside, cv2.DIST_L2, 5)
sdf = gb(d_in - d_out, 3.0)
prof = (1.0 - sstep(0.0, 12.0, sdf)) * sstep(-3.0, 1.0, sdf)   # peak at contour, ~12px falloff
sg = gb(sdf, 6)
gx = gb(cv2.Sobel(sg, cv2.CV_32F, 1, 0, ksize=3), 3)
gy = gb(cv2.Sobel(sg, cv2.CV_32F, 0, 1, ksize=3), 3)
nx_out = -gx / np.maximum(np.sqrt(gx * gx + gy * gy), 1e-6)
w_dir = sstep(0.05, 0.65, nx_out)
w_v = 1.0 - 0.8 * sstep(800, 1300, yy)
lum_gate = np.clip(gb(lum_final, 3.0) / 0.25, 0, 1)            # never brightens black
rim = np.clip(prof * w_dir * w_v * edge_fade * lum_gate, 0, 1)
RIM_OP = 0.50
ro = rim * RIM_OP
col = np.array([255, 154, 60], np.float32)
g255 = lum_final * 255.0
out_rgb = np.stack([g255 * (1 - ro) + col[i] * ro for i in range(3)], -1)
alpha_out = alpha_f

# ── 7. statistics ─────────────────────────────────────────────────────────────
print("> statistics ...")
P_LS = patch(xx, yy, 0.28 * W, 0.76 * H, 40) * alpha_f
P_SS = patch(xx, yy, 0.72 * W, 0.76 * H, 40) * alpha_f
hv = lum_final[hm > 0]
stats = {
    "lit cheek": (wmean(lum_final, P_LIT), "82-90%"),
    "face centre": (wmean(lum_final, P_CTR), "60-68%"),
    "shadow cheek": (wmean(lum_final, P_SHD), "22-30%"),
    "hair mean": (float(hv.mean()), "14-20%"),
    "lit shoulder": (wmean(lum_final, P_LS), "10-14%"),
    "shadow shoulder": (wmean(lum_final, P_SS), "5-8%"),
}
for k, (v, t) in stats.items():
    print(f"  {k:16s} {v:6.1%}  (target {t})")
print(f"  hair stddev      {hv.std():.3f}  (must be > 0.03)  peak hair {hv.max():.1%}")
print(f"  hair mask pixels {(hm > 0).sum()}")

# ── 8. export ─────────────────────────────────────────────────────────────────
rgba = np.dstack([out_rgb, alpha_out * 255]).clip(0, 255).astype(np.uint8)
top = int(np.where((alpha_out > 0.1).any(1))[0][0])
PAD = int(np.ceil((0.12 * H - top) / 0.88))          # clear space above hair = 12% of new height
rgba = np.vstack([np.zeros((PAD, W, 4), np.uint8), rgba])
result = Image.fromarray(rgba, "RGBA")
H2 = H + PAD
assert result.size == (W, H2)
print(f"  hair top y={top}; transparent headroom added: {PAD}px")
print(f"  new canvas {W}x{H2}  ratio {W / H2:.5f}  (subject crop ratio {crop_ratio:.5f}, subject scale uniform {sx:.1f}x)")
print(f"  space above hair = {(top + PAD) / H2:.1%} of image height")
result.save(OUT)

orig = Image.open(SRC).convert("RGB").crop((CX0, CY0, CX0 + CW, CY0 + CH)).resize((W, H), Image.LANCZOS)
comp = Image.new("RGB", (W, H2), (20, 20, 20))
comp.paste(result, (0, 0), result)
prev = Image.new("RGB", (W * 2 + 20, H2), (10, 10, 10))
prev.paste(orig, (0, PAD))
prev.paste(comp, (W + 20, 0))
prev.save(PREV)

# 200% zoom on #030303 + contrast-crushed (10-50%) view of head/hair edge
box = (260, 20 + PAD, 1120, 1000 + PAD)
cr = result.crop(box)
z = cr.resize((cr.width * 2, cr.height * 2), Image.LANCZOS)
bg = Image.new("RGB", z.size, (3, 3, 3))
bg.paste(z, (0, 0), z)
g = np.asarray(bg.convert("L"), np.float32) / 255.0
crushed = (np.clip((g - 0.10) / 0.40, 0, 1) * 255).astype(np.uint8)
tile = Image.new("RGB", (z.width * 2 + 10, z.height), (3, 3, 3))
tile.paste(bg, (0, 0))
tile.paste(Image.fromarray(crushed).convert("RGB"), (z.width + 10, 0))
tile.save(HALO)

def thumb(m, label, w=320, h=400):
    t = Image.fromarray((np.clip(m, 0, 1) * 255).astype(np.uint8)).resize((w, h)).convert("RGB")
    ImageDraw.Draw(t).text((4, 4), label, fill=(255, 80, 80))
    return t
ms = [(face_mask, "face"), (hair_mask, "hair"), (alpha_o, "alpha"), (rim, "rim"),
      (w_body, "w_body"), (edge_fade, "edge_fade"), (lum_final, "lum_final"), (sdf > 0, "inside")]
dbg = Image.new("RGB", (330 * 4, 410 * 2), (20, 20, 20))
for i, (m, l) in enumerate(ms):
    dbg.paste(thumb(m.astype(np.float32), l), ((i % 4) * 330, (i // 4) * 410))
dbg.save(DBG)
print("done - Stage 2 not started; awaiting approval.")
