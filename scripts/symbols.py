#!/usr/bin/env python3
"""
Draws the symbols Caractères does not have (or draws as something else) in the same stroke style, and
writes them out as two small fallback fonts (PMC Symbols L2 / L4) plus one SVG per glyph.

Caractères is a road-sign face: $ % & are the units "t", "km" and "m", and @ # * ? ~ [ ] { } | ^ _ ` < > " ©
are empty or arrows. These are drawn with a single-weight stroke that matches the real letters
(L2 stem 240, L4 stem 262 and a slant of about 11 degrees), re-using the font's own comma, period, plus,
S and C outlines where those fit.

    python3 scripts/symbols.py
"""
import math, os, sys
import numpy as np
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.fontBuilder import FontBuilder
from shapely.geometry import LineString, Polygon, MultiPolygon, box
from shapely.ops import unary_union
from shapely import affinity
from shapely.geometry.polygon import orient

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, 'public', 'fonts')
SVGDIR = os.path.join(FONTS, 'symbols')
C = 1626  # cap height of L2, the design space everything is drawn in


# ---------------------------------------------------------------- reading the real glyphs
class FlatPen(BasePen):
    def __init__(s, gs):
        super().__init__(gs); s.contours = []; s.cur = None
    def _moveTo(s, p): s.cur = [p]
    def _lineTo(s, p): s.cur.append(p)
    def _curveToOne(s, p1, p2, p3):
        p0 = s.cur[-1]
        for i in range(1, 13):
            t = i / 12; m = 1 - t
            s.cur.append((m**3*p0[0] + 3*m*m*t*p1[0] + 3*m*t*t*p2[0] + t**3*p3[0],
                          m**3*p0[1] + 3*m*m*t*p1[1] + 3*m*t*t*p2[1] + t**3*p3[1]))
    def _qCurveToOne(s, p1, p2):
        p0 = s.cur[-1]
        for i in range(1, 9):
            t = i / 8; m = 1 - t
            s.cur.append((m*m*p0[0] + 2*m*t*p1[0] + t*t*p2[0], m*m*p0[1] + 2*m*t*p1[1] + t*t*p2[1]))
    def _closePath(s):
        if s.cur and len(s.cur) > 2: s.contours.append(s.cur)
        s.cur = None
    _endPath = _closePath


def font_geom(font, ch):
    gs = font.getGlyphSet(); name = font.getBestCmap()[ord(ch)]
    pen = FlatPen(gs); gs[name].draw(pen)
    g = None
    for c in pen.contours:
        p = Polygon(c).buffer(0)
        g = p if g is None else g.symmetric_difference(p)
    return g


# ---------------------------------------------------------------- the two styles
class Style:
    def __init__(s, key, file, w, sy, slant, left, right):
        s.key, s.w, s.sy, s.k, s.left, s.right = key, w, sy, slant, left, right
        s.font = TTFont(os.path.join(FONTS, file))
        s.cache = {}
    def fwd(s, g):   # design space -> font space
        return affinity.affine_transform(g, [1, s.k * s.sy, 0, s.sy, 0, 0])
    def inv(s, g):   # font space -> design space
        return affinity.affine_transform(g, [1, -s.k, 0, 1 / s.sy, 0, 0])
    def glyph(s, ch):  # a real glyph, brought into the design space
        if ch not in s.cache: s.cache[ch] = s.inv(font_geom(s.font, ch))
        return s.cache[ch]


L2 = Style('L2', 'CaracteresL2.woff2', 240, 1.0, 0.0, 90, 80)
L4 = Style('L4', 'CaracteresL4.woff2', 262, 1428 / 1626, 0.192, 40, 32)


# ---------------------------------------------------------------- drawing helpers
def spline(pts, n=22):
    P = [np.array(p, float) for p in pts]
    P = [P[0]] + P + [P[-1]]
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i-1], P[i], P[i+1], P[i+2]
        for j in range(n):
            t = j / n
            out.append(0.5 * ((2*p1) + (-p0 + p2)*t + (2*p0 - 5*p1 + 4*p2 - p3)*t*t + (-p0 + 3*p1 - 3*p2 + p3)*t**3))
    out.append(P[-2])
    return [tuple(p) for p in out]

def arc(cx, cy, rx, ry, a0, a1, n=90):
    return [(cx + rx*math.cos(math.radians(a)), cy + ry*math.sin(math.radians(a))) for a in np.linspace(a0, a1, n)]

def stroke(pts, w, cap='flat', join='round'):
    return LineString(pts).buffer(w / 2, cap_style=cap, join_style=join, mitre_limit=8, quad_segs=24)

def ring(cx, cy, rx, ry, w):
    return stroke(arc(cx, cy, rx, ry, 0, 360, 120), w)

def mv(g, dx=0, dy=0): return affinity.translate(g, dx, dy)
def U(*gs): return unary_union([g for g in gs if g is not None])
def hband(S, y0=None):  # the hyphen's vertical band, so dashes sit where the font's own hyphen does
    b = S.glyph('-').bounds
    return b[1], b[3]


# ---------------------------------------------------------------- the glyphs (design space, cap height 1626)
def quotes(S, n, bar_h=560):
    bw = S.w * .92
    return U(*[box(i * (bw + 230), C - bar_h, i * (bw + 230) + bw, C) for i in range(n)])

def g_apostrophe(S): return quotes(S, 1, 520)
def g_dquote(S): return quotes(S, 2, 560)

def comma_up(S, flip=False, dx=0):
    g = S.glyph(',')
    x0, y0, x1, y1 = g.bounds
    if flip: g = affinity.rotate(g, 180, origin=((x0+x1)/2, (y0+y1)/2))
    x0, y0, x1, y1 = g.bounds
    return mv(g, dx - x0, C - y1)

def g_rsquo(S): return comma_up(S)
def g_lsquo(S): return comma_up(S, True)
def g_rdquo(S):
    a = comma_up(S); w = a.bounds[2]
    return U(a, mv(a, w + 150))
def g_ldquo(S):
    a = comma_up(S, True); w = a.bounds[2]
    return U(a, mv(a, w + 150))

def period_at(S, y, x=0):
    g = S.glyph('.'); b = g.bounds
    return mv(g, x - b[0], y - b[1])

def g_bullet(S): return period_at(S, 560)
def g_ellipsis(S):
    p = S.glyph('.'); w = p.bounds[2] - p.bounds[0]
    return U(*[period_at(S, 0, i * (w + 150)) for i in range(3)])

def g_endash(S):
    y0, y1 = hband(S); return box(0, y0, 820, y1)
def g_emdash(S):
    y0, y1 = hband(S); return box(0, y0, 1560, y1)
def g_minus(S):
    b = S.glyph('+').bounds; y0, y1 = hband(S)
    return box(0, y0, b[2] - b[0], y1)

def g_underscore(S): return box(0, -300, 1060, -300 + S.w * .95)
def g_pipe(S): return box(0, -380, S.w * .98, C + 40)

def g_lbracket(S):
    w = S.w; t = w * .95
    return U(box(0, -300, w, C), box(0, C - t, 560, C), box(0, -300, 560, -300 + t))
def g_rbracket(S):
    w = S.w; t = w * .95
    return U(box(560 - w, -300, 560, C), box(0, C - t, 560, C), box(0, -300, 560, -300 + t))

def brace(S, left):
    w = S.w * .9
    # skeleton of "{" — a top arm, down to the middle, a point, down again, a bottom arm
    pts = [(600, C - w/2), (450, C - 40 - w/2), (380, C - 260), (380, 1000), (330, 900), (190, 813),
           (330, 726), (380, 626), (380, 120), (450, -60), (600, -130 - w/2 + 60)]
    pts = [(x, y - 130 if y < 0 else y) if False else (x, y) for x, y in pts]
    pts = [(600, C - w/2), (460, C - w/2 - 20), (385, C - 300), (385, 1040), (330, 900), (190, 813),
           (330, 726), (385, 586), (385, -10), (460, -210), (600, -300 + w/2 + 20)]
    g = stroke(spline(pts, 20), w, 'flat')
    g = g.intersection(box(-50, -300, 900, C))
    if not left:
        g = affinity.scale(g, -1, 1, origin=(g.bounds[0] + (g.bounds[2] - g.bounds[0]) / 2, 0))
    return g
def g_lbrace(S): return brace(S, True)
def g_rbrace(S): return brace(S, False)

def g_tilde(S):
    h = S.w
    xs = np.linspace(0, 1, 60)
    pts = [(160 + x * 760, 800 + 150 * math.sin(x * 2 * math.pi)) for x in xs]
    return stroke(pts, h * .95, 'flat')

def g_caret(S):
    return stroke([(120, 1010), (540, C - S.w * .55), (960, 1010)], S.w * .95, 'flat', 'mitre').intersection(box(-50, 900, 1100, C))

def g_grave(S):
    return Polygon([(90, C), (90 + S.w, C), (90 + S.w + 330, C - 520), (90 + 330, C - 520)])

def g_asterisk(S):
    w = S.w * .78; cx, cy, r = 470, 1270, 330
    arms = [stroke([(cx + r*math.cos(math.radians(a)), cy + r*math.sin(math.radians(a))),
                    (cx - r*math.cos(math.radians(a)), cy - r*math.sin(math.radians(a)))], w, 'flat') for a in (90, 30, 150)]
    return U(*arms)

def g_hash(S):
    w = S.w * .82
    v = [stroke([(260 + 70 * i, 40), (450 + 70 * i, C - 40)], w, 'flat') for i in range(2)]
    v = [stroke([(180 + i * 400, 0), (360 + i * 400, C)], w, 'flat') for i in range(2)]
    h = [box(40, y - w/2, 1020, y + w/2) for y in (1060, 560)]
    return U(*v, *h).intersection(box(0, 0, 1200, C))

def g_dollar(S):
    s = S.glyph('S'); b = s.bounds
    s = affinity.scale(s, .88, .86, origin=((b[0]+b[2])/2, C/2))
    cx = (s.bounds[0] + s.bounds[2]) / 2; w = S.w * .8
    sb = s.bounds
    return U(s, box(cx - w/2, sb[3] - 60, cx + w/2, C + 80), box(cx - w/2, -80, cx + w/2, sb[1] + 60))

def g_percent(S):
    w = S.w * .64
    r1 = ring(305, 1330, 165, 212, w); r2 = ring(835, 296, 165, 212, w)
    slash = stroke([(1010, C + 20), (130, -20)], w * 1.02, 'flat').intersection(box(0, 0, 1200, C))
    return U(r1, r2, slash)

def g_ampersand(S):
    w = S.w * .93; h = w / 2
    # upper loop (a full ellipse), lower bowl (an open ellipse that turns into the right arm), and the long diagonal leg
    top = ring(440, C - 250 - h, 205, 250, w)
    bowl_pts = arc(430, 130 + 410 + h - 20, 318, 410, 118, 322, 120)
    arm = spline([bowl_pts[-1], (790, 420), (930, 590), (1040, 740)], 22)
    bowl = stroke(bowl_pts + arm[1:], w, 'flat')
    diag = stroke([(1060, -140), (300, 1110)], w, 'flat')
    g = U(top, bowl, diag)
    return g.intersection(box(-50, 0, 1300, C))

def g_at(S):
    w = S.w * .76
    cx, cy = 770, 813
    outer = arc(cx, cy, 590, 700, 24, 335, 140)
    inner = ring(cx - 15, cy, 190, 260, w)
    stem = spline([(cx + 175, 1090), (cx + 175, 640), (cx + 240, 500), (cx + 390, 450), (cx + 590*math.cos(math.radians(335)), cy + 700*math.sin(math.radians(335)))], 24)
    return U(stroke(outer, w, 'flat'), inner, stroke(stem, w, 'round'))

def g_question(S):
    w = S.w * .98
    pts = spline([(190, 1230), (260, 1470), (480, 1540), (700, 1470), (800, 1260), (730, 1020), (560, 860), (540, 640), (540, 480)], 24)
    d = period_at(S, 0)
    d = mv(d, 540 - (d.bounds[0] + d.bounds[2]) / 2)
    return U(stroke(pts, w, 'flat').intersection(box(-50, 380, 1200, C)), d)

def g_inv_excl(S):
    g = S.glyph('!'); b = g.bounds
    return affinity.rotate(g, 180, origin=((b[0]+b[2])/2, C/2))
def g_inv_question(S):
    g = g_question(S); b = g.bounds
    return affinity.rotate(g, 180, origin=((b[0]+b[2])/2, C/2))

def g_lt(S):
    return stroke([(900, 1340), (300, 813), (900, 286)], S.w * .95, 'flat', 'mitre').intersection(box(0, 286 - 140, 1100, 1340 + 140))
def g_gt(S):
    return stroke([(300, 1340), (900, 813), (300, 286)], S.w * .95, 'flat', 'mitre').intersection(box(0, 286 - 140, 1100, 1340 + 140))

def g_laquo(S):
    w = S.w * .8
    ch = lambda dx, d: stroke([(dx + d * 230, 1230), (dx, 813), (dx + d * 230, 396)], w, 'flat', 'mitre')
    return U(ch(270, 1), ch(620, 1))
def g_raquo(S):
    w = S.w * .8
    ch = lambda dx: stroke([(dx, 1230), (dx + 230, 813), (dx, 396)], w, 'flat', 'mitre')
    return U(ch(180), ch(530))

def g_times(S):
    p = S.glyph('+'); b = p.bounds
    return affinity.rotate(p, 45, origin=((b[0]+b[2])/2, (b[1]+b[3])/2))

def g_divide(S):
    p = S.glyph('+'); b = p.bounds; y0, y1 = hband(S)
    d = S.glyph('.'); db = d.bounds; dw = db[2] - db[0]; cx = (b[0] + b[2]) / 2
    dot = lambda y: mv(d, cx - dw/2 - db[0], y - db[1])
    return U(box(b[0], y0, b[2], y1), dot(y1 + 150), dot(y0 - 150 - (db[3] - db[1])))

def g_plusminus(S):
    p = mv(S.glyph('+'), 0, 150); b = p.bounds
    return U(p, box(b[0], 20, b[2], 20 + S.w * .95))

def g_degree(S):
    return ring(300, 1390, 120, 130, S.w * .72)

def g_middot(S): return period_at(S, 640)

def g_copyright(S):
    w = S.w * .56
    r = ring(700, 813, 560, 700, w)
    c = S.glyph('C'); b = c.bounds
    c = affinity.scale(c, .5, .5, origin=((b[0]+b[2])/2, (b[1]+b[3])/2))
    cb = c.bounds
    return U(r, mv(c, 700 - (cb[0]+cb[2])/2, 813 - (cb[1]+cb[3])/2))
def g_registered(S):
    w = S.w * .56
    r = ring(700, 813, 560, 700, w)
    c = S.glyph('R'); b = c.bounds
    c = affinity.scale(c, .5, .5, origin=((b[0]+b[2])/2, (b[1]+b[3])/2))
    cb = c.bounds
    return U(r, mv(c, 700 - (cb[0]+cb[2])/2, 813 - (cb[1]+cb[3])/2))

def g_arrow(S, d):
    w = S.w * .85
    if d in ('r', 'l'):
        s = 1 if d == 'r' else -1
        x0, x1 = (150, 1060) if d == 'r' else (1060, 150)
        head = [(x1 - s * 330, 1120), (x1, 813), (x1 - s * 330, 506)]
        return U(stroke([(x0, 813), (x1 - s * 40, 813)], w, 'flat'), stroke(head, w, 'flat', 'mitre'))
    s = 1 if d == 'u' else -1
    y0, y1 = (120, 1500) if d == 'u' else (1500, 120)
    head = [(370, y1 - s * 380), (610, y1), (850, y1 - s * 380)]
    return U(stroke([(610, y0), (610, y1 - s * 40)], w, 'flat'), stroke(head, w, 'flat', 'mitre'))

def g_check(S):
    return stroke([(120, 800), (410, 450), (1000, 1260)], S.w * .85, 'flat', 'mitre')

GLYPHS = {
    0x22: g_dquote, 0x23: g_hash, 0x24: g_dollar, 0x25: g_percent, 0x26: g_ampersand, 0x27: g_apostrophe,
    0x2A: g_asterisk, 0x3C: g_lt, 0x3E: g_gt, 0x3F: g_question, 0x40: g_at,
    0x5B: g_lbracket, 0x5D: g_rbracket, 0x5E: g_caret, 0x5F: g_underscore, 0x60: g_grave,
    0x7B: g_lbrace, 0x7C: g_pipe, 0x7D: g_rbrace, 0x7E: g_tilde,
    0xA1: g_inv_excl, 0xA9: g_copyright, 0xAB: g_laquo, 0xAE: g_registered, 0xB0: g_degree, 0xB1: g_plusminus,
    0xB7: g_middot, 0xBB: g_raquo, 0xBF: g_inv_question, 0xD7: g_times, 0xF7: g_divide,
    0x2013: g_endash, 0x2014: g_emdash, 0x2018: g_lsquo, 0x2019: g_rsquo, 0x201C: g_ldquo, 0x201D: g_rdquo,
    0x2022: g_bullet, 0x2026: g_ellipsis, 0x2190: lambda S: g_arrow(S, 'l'), 0x2191: lambda S: g_arrow(S, 'u'),
    0x2192: lambda S: g_arrow(S, 'r'), 0x2193: lambda S: g_arrow(S, 'd'), 0x2212: g_minus, 0x2713: g_check,
}


# ---------------------------------------------------------------- output
def polys(g):
    if g.is_empty: return []
    return list(g.geoms) if isinstance(g, MultiPolygon) else [g]

def build(S):
    names, cmap, glyphs, metrics, svgs = ['.notdef'], {}, {}, {}, {}
    pen = TTGlyphPen(None); glyphs['.notdef'] = pen.glyph(); metrics['.notdef'] = (600, 0)
    for cp, fn in sorted(GLYPHS.items()):
        g = S.fwd(fn(S)).simplify(1.2)
        if g.geom_type == 'GeometryCollection': g = unary_union([p for p in g.geoms if p.area > 0])
        x0, y0, x1, y1 = g.bounds
        shift = S.left - x0
        g = affinity.translate(g, shift, 0)
        adv = int(round(g.bounds[2] + S.right))
        name = 'uni%04X' % cp
        names.append(name); cmap[cp] = name
        pen = TTGlyphPen(None)
        for p in polys(g):
            p = orient(p, sign=-1.0)
            for ring_ in [p.exterior, *p.interiors]:
                pts = [(int(round(x)), int(round(y))) for x, y in list(ring_.coords)[:-1]]
                if len(pts) < 3: continue
                pen.moveTo(pts[0]); [pen.lineTo(q) for q in pts[1:]]; pen.closePath()
        glyphs[name] = pen.glyph(); metrics[name] = (adv, int(round(g.bounds[0])))
        # an SVG per glyph, y flipped, in font units
        d = ''
        for p in polys(g):
            p = orient(p, sign=-1.0)
            for ring_ in [p.exterior, *p.interiors]:
                c = list(ring_.coords)[:-1]
                d += 'M' + 'L'.join('%d %d' % (round(x), round(-y)) for x, y in c) + 'Z'
        svgs[cp] = (d, adv, g.bounds)
    fb = FontBuilder(2048, isTTF=True)
    fb.setupGlyphOrder(names); fb.setupCharacterMap(cmap); fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(metrics); fb.setupHorizontalHeader(ascent=1854, descent=-434)
    fb.setupNameTable({'familyName': f'PMC Symbols {S.key}', 'styleName': 'Regular'})
    fb.setupOS2(sTypoAscender=1854, sTypoDescender=-434, usWinAscent=1854, usWinDescent=434, sxHeight=996, sCapHeight=int(C * S.sy))
    fb.setupPost()
    fb.font.flavor = 'woff2'
    out = os.path.join(FONTS, f'PMCSymbols{S.key}.woff2')
    fb.save(out)
    return out, svgs

if __name__ == '__main__':
    os.makedirs(SVGDIR, exist_ok=True)
    for S in (L2, L4):
        out, svgs = build(S)
        print('wrote', out, len(svgs), 'glyphs')
        for cp, (d, adv, b) in svgs.items():
            top = -(C * S.sy) - 400; h = 2048 + 600
            open(os.path.join(SVGDIR, f'{S.key}-{cp:04X}.svg'), 'w').write(
                f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 {-1900} {adv} 2400" width="{adv/12:.0f}" height="200"><path fill="currentColor" d="{d}"/></svg>')
    cps = ','.join('U+%04X' % c for c in sorted(GLYPHS))
    open(os.path.join(FONTS, 'symbols.ranges.txt'), 'w').write(cps)
    print(cps)
