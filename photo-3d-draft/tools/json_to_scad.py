#!/usr/bin/env python3
import argparse
import json
import re
import subprocess
from pathlib import Path


def parse_hole_mm(face_text: str):
    if not face_text:
        return None
    m = re.search(r'(?:홀|hole)\s*(\d+(?:\.\d+)?)', face_text.lower())
    if not m:
        return None
    return float(m.group(1))


def main():
    p = argparse.ArgumentParser(description='photo-3d-input.json -> OpenSCAD/STL')
    p.add_argument('--json', required=True, help='photo-3d-input.json path')
    p.add_argument('--outdir', default='out', help='output directory')
    p.add_argument('--name', default='model', help='output base filename')
    p.add_argument('--stl', action='store_true', help='also build STL via openscad if installed')
    args = p.parse_args()

    in_path = Path(args.json)
    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    data = json.loads(in_path.read_text(encoding='utf-8'))
    dims = data.get('dimensions_mm', {})
    W = float(dims.get('width', 0) or 0)
    H = float(dims.get('height', 0) or 0)
    D = float(dims.get('depth', 0) or 0)

    if min(W, H, D) <= 0:
        raise SystemExit('dimensions_mm (width/height/depth) must be > 0')

    faces = data.get('faces', {})
    front_hole = parse_hole_mm(faces.get('front', ''))

    scad = []
    scad.append('// Auto-generated from photo-3d-input.json')
    scad.append(f'W={W}; H={H}; D={D};')
    scad.append('module body() { cube([W,D,H], center=false); }')

    if front_hole and front_hole > 0:
        r = front_hole / 2.0
        scad.append('difference() {')
        scad.append('  body();')
        scad.append(f'  translate([W/2, -1, H/2]) rotate([-90,0,0]) cylinder(h=D+2, r={r}, $fn=64);')
        scad.append('}')
    else:
        scad.append('body();')

    scad_path = outdir / f'{args.name}.scad'
    scad_path.write_text('\n'.join(scad) + '\n', encoding='utf-8')
    print(f'[ok] SCAD: {scad_path}')

    if args.stl:
        stl_path = outdir / f'{args.name}.stl'
        cmd = ['openscad', '-o', str(stl_path), str(scad_path)]
        try:
            subprocess.run(cmd, check=True)
            print(f'[ok] STL:  {stl_path}')
        except FileNotFoundError:
            print('[warn] openscad not found. Install OpenSCAD or run without --stl')


if __name__ == '__main__':
    main()
