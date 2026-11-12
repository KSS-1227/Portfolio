"""Segmentation helper for prepare-portrait.py (matting-quality cut-out).

isnet-general-use (rembg, ~170 MB, under the 200 MB cap) gives a soft mask;
we turn it into a trimap tuned for a light wall and solve closed-form
alpha matting (PyMatting) so fine hair strands survive as soft alpha.
"""
import io
import numpy as np
import cv2
from PIL import Image


def segment(src_path):
    """Return (rgb_float32 HxWx3 [0-255] decontaminated, alpha_float32 HxW [0-1])."""
    from rembg import remove, new_session
    from pymatting import estimate_alpha_cf, estimate_foreground_ml

    raw = open(src_path, "rb").read()
    img = np.array(Image.open(io.BytesIO(raw)).convert("RGB"))
    sess = new_session("isnet-general-use")
    m = remove(raw, session=sess, only_mask=True)
    soft = np.array(Image.open(io.BytesIO(m)).convert("L"), dtype=np.float32) / 255.0

    # median-smoothed binary mask -> stable contour for the trimap
    binm = cv2.medianBlur((soft > 0.5).astype(np.uint8) * 255, 9)
    k = lambda n: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (n, n))
    fg = cv2.erode(binm, k(25)) > 0            # sure foreground
    bg = cv2.dilate(binm, k(25)) == 0          # sure background
    # light wall: pixels far from the contour that are bright are surely bg
    tri = np.full(binm.shape, 0.5, np.float64)
    tri[fg] = 1.0
    tri[bg] = 0.0
    alpha = estimate_alpha_cf(img.astype(np.float64) / 255.0, tri)
    alpha = np.clip(alpha, 0, 1).astype(np.float32)

    # smooth contour: median on binary view, then 1.5px gaussian on alpha
    a8 = (alpha * 255).astype(np.uint8)
    a8 = cv2.medianBlur(a8, 5)
    alpha = cv2.GaussianBlur(a8.astype(np.float32) / 255.0, (0, 0), 1.5)

    fgc = estimate_foreground_ml(img.astype(np.float64) / 255.0, alpha.astype(np.float64))
    return np.clip(fgc * 255.0, 0, 255).astype(np.float32), alpha
