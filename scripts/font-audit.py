#!/usr/bin/env python3
"""
Font audit for PMC Apps.

  python3 scripts/font-audit.py <font> [<font> ...]        fonts: .ttf .otf .woff .woff2
  python3 scripts/font-audit.py fonts/CaracteresL2.ttf fonts/CaracteresL4.ttf --json report.json

Needs:  pip install fonttools brotli

It works out which characters the site really uses (every character in src/ plus all printable ASCII plus a list of
common typographic symbols), then reports for each font:
  MISSING     characters the font has no glyph for
  EMPTY       characters mapped to a blank or .notdef glyph
  IDENTICAL   different characters drawn with exactly the same outline (usually fine: A and Alpha, but worth a look)
  ODD WIDTH   glyphs much wider or narrower than their neighbours, which is where "looks different" problems hide
The MISSING and EMPTY lists are what needs an SVG stand-in drawn to match the font.
"""
import sys, os, json, glob, statistics, unicodedata
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen

EXTRA = "\u2018\u2019\u201c\u201d\u2013\u2014\u2026\u2022\u00b7\u00d7\u00f7\u2212\u00b1\u2264\u2265\u2260\u2192\u2190\u2191\u2193\u2713\u00a9\u00ae\u2122\u00b0\u00e9\u00e8\u00e0\u00e7\u00ea\u00f4\u00e2"
SRC_EXT = ('.ts', '.tsx', '.css', '.json', '.md', '.mjs')

def used_characters(src='src'):
    chars = set(chr(c) for c in range(0x20, 0x7f)) | set(EXTRA)
    for root, _, files in os.walk(src):
        for f in files:
            if f.endswith(SRC_EXT) and 'generated' not in f and f != 'appIcons.json':
                try: text = open(os.path.join(root, f), encoding='utf8').read()
                except Exception: continue
                chars |= {ch for ch in text if ord(ch) > 0x20 and unicodedata.category(ch)[0] not in 'C'}
    return chars

def outline(font, gname):
    gs = font.getGlyphSet(); pen = DecomposingRecordingPen(gs)
    try: gs[gname].draw(pen)
    except Exception: return None
    return tuple((op, tuple(tuple(round(v) for v in a) for a in args)) for op, args in pen.value)

def audit(path, needed):
    font = TTFont(path)
    cmap = font.getBestCmap(); hmtx = font['hmtx']; order = font.getGlyphOrder()
    notdef = outline(font, order[0])
    missing = sorted(c for c in needed if ord(c) not in cmap and not c.isspace())
    empty, shapes, widths = [], {}, {}
    for c in sorted(needed):
        g = cmap.get(ord(c))
        if g is None or c.isspace(): continue
        o = outline(font, g)
        if not o or o == notdef: empty.append(c)
        else: shapes.setdefault(o, []).append(c)
        widths[c] = hmtx[g][0]
    same = [v for v in shapes.values() if len(v) > 1]
    core = [widths[c] for c in widths if c.isalnum() and ord(c) < 0x250]
    med = statistics.median(core) if core else 0
    odd = sorted((c, w) for c, w in widths.items() if med and (w > med * 1.6 or w < med * 0.45) and c.isalnum() and ord(c) < 0x250)
    return dict(font=os.path.basename(path), glyphs=len(order), mapped=len(cmap), missing=missing, empty=empty, identical=same, odd=odd, median_width=med)

def show(r):
    name = lambda c: f"U+{ord(c):04X} {c}  {unicodedata.name(c, '?')}"
    print(f"\n=== {r['font']}  ({r['glyphs']} glyphs, {r['mapped']} characters mapped) ===")
    print(f"MISSING ({len(r['missing'])})" + (':' if r['missing'] else ': none'))
    for c in r['missing']: print('   ', name(c))
    print(f"EMPTY ({len(r['empty'])})" + (':' if r['empty'] else ': none'))
    for c in r['empty']: print('   ', name(c))
    print(f"IDENTICAL outlines ({len(r['identical'])} groups)" + (':' if r['identical'] else ': none'))
    for g in r['identical']: print('    ' + '  '.join(g))
    print(f"ODD WIDTH ({len(r['odd'])}; median {r['median_width']})" + (':' if r['odd'] else ': none'))
    for c, w in r['odd']: print(f'    {c}  width {w}')

if __name__ == '__main__':
    args = sys.argv[1:]
    out = None
    if '--json' in args: i = args.index('--json'); out = args[i + 1]; del args[i:i + 2]
    if not args: print(__doc__); sys.exit(1)
    needed = used_characters()
    print(f"The site uses {len(needed)} distinct characters.")
    reports = [audit(p, needed) for p in args]
    for r in reports: show(r)
    if out: json.dump(reports, open(out, 'w'), ensure_ascii=False, indent=1)
