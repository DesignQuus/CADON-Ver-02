#!/usr/bin/env python3
"""
CADON-BOM - High Performance WebGL Binary Exporter
Extracts all CAD entities (lines, polylines, circles, arcs, blocks) into a
compact Float32 binary buffer for ultra-fast 60 FPS GPU rendering in Three.js.
"""
import sys
import os
import math
import struct
import time
import json
import re
import ezdxf

import ezdxf.colors

def get_rgb(col):
    try:
        r, g, b = ezdxf.colors.aci2rgb(col)
        return (r/255.0, g/255.0, b/255.0)
    except Exception:
        return (0.85, 0.85, 0.85)

def transform_pt(p, ins, cos_r, sin_r, sx, sy):
    x, y = p[0] * sx, p[1] * sy
    return (ins[0] + x * cos_r - y * sin_r, ins[1] + x * sin_r + y * cos_r)

def export_dxf_to_webgl_binary(dxf_path: str, output_bin_path: str) -> dict:
    start_time = time.time()
    
    if not os.path.exists(dxf_path):
        return {"status": "ERROR", "error": f"DXF not found: {dxf_path}"}
        
    try:
        try:
            doc = ezdxf.readfile(dxf_path, encoding='utf-8')
        except Exception:
            doc = ezdxf.readfile(dxf_path)
            
        msp = doc.modelspace()
        
        # Pre-cache layer colors (BYLAYER resolution)
        layer_colors = {}
        for lay in doc.layers:
            l_col = getattr(lay.dxf, 'color', 7)
            l_rgb = get_rgb(l_col)
            layer_colors[lay.dxf.name] = (l_rgb, f"#{int(l_rgb[0]*255):02x}{int(l_rgb[1]*255):02x}{int(l_rgb[2]*255):02x}")
        
        # 1. Pre-process blocks into local line segments and texts
        # We must support nested blocks! We will resolve them recursively.
        block_cache = {}
        block_tris = {}
        block_texts = {}
        
        def resolve_block(bname):
            if bname in block_cache:
                return block_cache[bname], block_tris.get(bname, []), block_texts.get(bname, [])
                
            block = doc.blocks.get(bname)
            if not block:
                return [], [], []
                
            # Prevent infinite recursion for cyclic blocks (just in case)
            block_cache[bname] = []
            block_tris[bname] = []
            block_texts[bname] = []
            
            b_lines = []
            b_tris_list = []
            b_txts = []

            expanded_block = []
            for e in block:
                if e.dxftype() == 'DIMENSION':
                    try:
                        expanded_block.extend(list(e.virtual_entities()))
                    except Exception:
                        pass
                else:
                    expanded_block.append(e)

            for e in expanded_block:
                t = e.dxftype()
                col = getattr(e.dxf, 'color', 256)
                lay_name = getattr(e.dxf, 'layer', '0')
                if col == 256:
                    rgb, hex_col = layer_colors.get(lay_name, ((0.85, 0.85, 0.85), '#e2e8f0'))
                else:
                    rgb = get_rgb(col)
                    hex_col = f"#{int(rgb[0]*255):02x}{int(rgb[1]*255):02x}{int(rgb[2]*255):02x}"
                
                if t in ['LINE', 'LWPOLYLINE', 'POLYLINE', 'SPLINE', 'SOLID']:
                    if t == 'LINE':
                        b_lines.append(((e.dxf.start.x, e.dxf.start.y), (e.dxf.end.x, e.dxf.end.y), rgb, col, lay_name))
                    elif t in ['LWPOLYLINE', 'POLYLINE']:
                        pts = list(e.points()) if t == 'POLYLINE' else list(e.get_points())
                        for i in range(len(pts)-1):
                            b_lines.append(((pts[i][0], pts[i][1]), (pts[i+1][0], pts[i+1][1]), rgb, col, lay_name))
                        if getattr(e, 'is_closed', False) and len(pts) > 2:
                            b_lines.append(((pts[-1][0], pts[-1][1]), (pts[0][0], pts[0][1]), rgb, col, lay_name))
                    elif t == 'SPLINE':
                        try:
                            pts = list(e.flattening(distance=0.5))
                            for i in range(len(pts)-1):
                                b_lines.append(((pts[i][0], pts[i][1]), (pts[i+1][0], pts[i+1][1]), rgb, col, lay_name))
                            if e.closed and len(pts) > 2:
                                b_lines.append(((pts[-1][0], pts[-1][1]), (pts[0][0], pts[0][1]), rgb, col, lay_name))
                        except Exception:
                            pass
                    elif t == 'SOLID':
                        v0 = (e.dxf.vtx0.x, e.dxf.vtx0.y)
                        v1 = (e.dxf.vtx1.x, e.dxf.vtx1.y)
                        v2 = (e.dxf.vtx2.x, e.dxf.vtx2.y)
                        v3 = (e.dxf.vtx3.x, e.dxf.vtx3.y) if hasattr(e.dxf, 'vtx3') else v2
                        # Solid triangles
                        b_tris_list.append((v0, v1, v3, rgb, col, lay_name))
                        b_tris_list.append((v3, v2, v0, rgb, col, lay_name))
                elif t == 'CIRCLE':
                    cx, cy, r = e.dxf.center.x, e.dxf.center.y, e.dxf.radius
                    steps = 16 if r > 50 else 12
                    c_pts = [(cx + r * math.cos(i*2*math.pi/steps), cy + r * math.sin(i*2*math.pi/steps)) for i in range(steps)]
                    for i in range(steps):
                        b_lines.append((c_pts[i], c_pts[(i+1)%steps], rgb, col, lay_name))
                elif t == 'ARC':
                    cx, cy, r = e.dxf.center.x, e.dxf.center.y, e.dxf.radius
                    sa, ea = math.radians(e.dxf.start_angle), math.radians(e.dxf.end_angle)
                    if ea < sa:
                        ea += 2 * math.pi
                    steps = max(4, int(abs(ea - sa) / (math.pi / 8)))
                    a_pts = [(cx + r * math.cos(sa + (ea-sa)*i/steps), cy + r * math.sin(sa + (ea-sa)*i/steps)) for i in range(steps+1)]
                    for i in range(steps):
                        b_lines.append((a_pts[i], a_pts[i+1], rgb, col, lay_name))
                elif t in ['TEXT', 'MTEXT', 'ATTDEF']:
                    raw = e.dxf.text if t != 'MTEXT' else e.text
                    if raw and raw.strip():
                        h = getattr(e.dxf, 'char_height', getattr(e.dxf, 'height', 10.0))
                        rot = getattr(e.dxf, 'rotation', 0.0)
                        halign = getattr(e.dxf, 'halign', 0)
                        valign = getattr(e.dxf, 'valign', 0)
                        align_pt = getattr(e.dxf, 'align_point', None)
                        ins_pt = e.dxf.insert
                        target_pt = align_pt if ((halign > 0 or valign > 0) and align_pt is not None and (abs(align_pt.x) > 0.001 or abs(align_pt.y) > 0.001)) else ins_pt
                        
                        ha = 1 if halign in [1, 4] else (2 if halign == 2 else 0)
                        va = 1 if valign == 1 else (2 if valign == 2 else (3 if valign == 3 else 0))
                        if t == 'MTEXT':
                            attach = getattr(e.dxf, 'attachment_point', 1)
                            ha = 0 if attach in [1, 4, 7] else (1 if attach in [2, 5, 8] else 2)
                            va = 3 if attach in [1, 2, 3] else (2 if attach in [4, 5, 6] else 1)
                            
                        b_txts.append({
                            't': raw.strip(),
                            'x': target_pt.x,
                            'y': target_pt.y,
                            'h': h,
                            'r': rot,
                            'c': hex_col,
                            'raw_col': col,
                            'lay_name': lay_name,
                            'ha': ha,
                            'va': va
                        })
                elif t == 'INSERT':
                    # Nested block support
                    sub_bname = getattr(e.dxf, 'name', None)
                    if sub_bname:
                        sub_lines, sub_tris, sub_txts = resolve_block(sub_bname)
                        ins = (e.dxf.insert.x, e.dxf.insert.y)
                        rot = math.radians(getattr(e.dxf, 'rotation', 0.0))
                        cos_r, sin_r = math.cos(rot), math.sin(rot)
                        sx = getattr(e.dxf, 'xscale', 1.0)
                        sy = getattr(e.dxf, 'yscale', 1.0)
                        
                        for (p1, p2, blk_rgb, blk_col, blk_lay) in sub_lines:
                            tp1 = transform_pt(p1, ins, cos_r, sin_r, sx, sy)
                            tp2 = transform_pt(p2, ins, cos_r, sin_r, sx, sy)
                            
                            if blk_col == 0: # BYBLOCK
                                final_rgb = rgb
                                final_col = col
                            elif blk_lay == '0' and blk_col == 256: # BYLAYER on Layer 0 inherits parent's layer
                                final_rgb = rgb
                                final_col = col
                            else: # Keep its own resolved color/layer
                                final_rgb = blk_rgb
                                final_col = blk_col
                                
                            b_lines.append((tp1, tp2, final_rgb, final_col, blk_lay if blk_lay != '0' else lay_name))

                        for (p1, p2, p3, blk_rgb, blk_col, blk_lay) in sub_tris:
                            tp1 = transform_pt(p1, ins, cos_r, sin_r, sx, sy)
                            tp2 = transform_pt(p2, ins, cos_r, sin_r, sx, sy)
                            tp3 = transform_pt(p3, ins, cos_r, sin_r, sx, sy)
                            if blk_col == 0:
                                final_rgb = rgb
                                final_col = col
                            elif blk_lay == '0' and blk_col == 256:
                                final_rgb = rgb
                                final_col = col
                            else:
                                final_rgb = blk_rgb
                                final_col = blk_col
                            b_tris_list.append((tp1, tp2, tp3, final_rgb, final_col, blk_lay if blk_lay != '0' else lay_name))
                            
                        for bt in sub_txts:
                            tp = transform_pt((bt['x'], bt['y']), ins, cos_r, sin_r, sx, sy)
                            total_rot = bt['r'] + math.degrees(rot)
                            
                            b_col = bt.get('raw_col', 256)
                            b_lay = bt.get('lay_name', '0')
                            
                            if b_col == 0:
                                final_hex = hex_col
                                final_raw_col = col
                            elif b_lay == '0' and b_col == 256:
                                final_hex = hex_col
                                final_raw_col = col
                            else:
                                final_hex = bt['c']
                                final_raw_col = b_col
                                
                            b_txts.append({
                                't': bt['t'],
                                'x': tp[0],
                                'y': tp[1],
                                'h': bt['h'] * max(abs(sx), abs(sy)),
                                'r': total_rot,
                                'c': final_hex,
                                'raw_col': final_raw_col,
                                'lay_name': b_lay if b_lay != '0' else lay_name,
                                'ha': bt.get('ha', 0),
                                'va': bt.get('va', 0)
                            })
                            
            block_cache[bname] = b_lines
            block_tris[bname] = b_tris_list
            block_texts[bname] = b_txts
            return b_lines, b_tris_list, b_txts

        for block in doc.blocks:
            resolve_block(block.name)

        # 2. Extract geometry into flat Float32 arrays & collect all texts
        pos_data = [] # [x1, y1, z1, x2, y2, z2, ...]
        col_data = [] # [r1, g1, b1, r2, g2, b2, ...]
        tri_pos_data = [] # [x1,y1,z1, x2,y2,z2, x3,y3,z3, ...]
        tri_col_data = []
        all_texts = []
        
        min_x, min_y = float('inf'), float('inf')
        max_x, max_y = float('-inf'), float('-inf')

        def add_seg(p1, p2, rgb):
            nonlocal min_x, min_y, max_x, max_y
            pos_data.extend([p1[0], p1[1], 0.0, p2[0], p2[1], 0.0])
            col_data.extend([rgb[0], rgb[1], rgb[2], rgb[0], rgb[1], rgb[2]])
            min_x = min(min_x, p1[0], p2[0])
            min_y = min(min_y, p1[1], p2[1])
            max_x = max(max_x, p1[0], p2[0])
            max_y = max(max_y, p1[1], p2[1])

        def add_tri(p1, p2, p3, rgb):
            nonlocal min_x, min_y, max_x, max_y
            tri_pos_data.extend([p1[0], p1[1], 0.0, p2[0], p2[1], 0.0, p3[0], p3[1], 0.0])
            tri_col_data.extend([rgb[0], rgb[1], rgb[2], rgb[0], rgb[1], rgb[2], rgb[0], rgb[1], rgb[2]])
            min_x = min(min_x, p1[0], p2[0], p3[0])
            min_y = min(min_y, p1[1], p2[1], p3[1])
            max_x = max(max_x, p1[0], p2[0], p3[0])
            max_y = max(max_y, p1[1], p2[1], p3[1])

        def clean_txt(t):
            if not t: return ''
            try:
                t = t.encode('utf-8', 'surrogateescape').decode('utf-8', 'replace')
            except Exception:
                pass
            t = re.sub(r'\\\\P', ' ', t)
            t = re.sub(r'\\P', ' ', t)
            t = re.sub(r'\{[^}]*\}', '', t)
            t = re.sub(r'\\[AaHhCcWwQqTtFfPp][^;]*;', '', t)
            t = re.sub(r'%%c', 'Ø', t, flags=re.I)
            t = re.sub(r'%%d', '°', t, flags=re.I)
            t = re.sub(r'%%p', '±', t, flags=re.I)
            return t.strip()

        expanded_msp = []
        for e in msp:
            if e.dxftype() == 'DIMENSION':
                try:
                    expanded_msp.extend(list(e.virtual_entities()))
                except Exception:
                    pass
            else:
                expanded_msp.append(e)

        for e in expanded_msp:
            t = e.dxftype()
            col = getattr(e.dxf, 'color', 256)
            lay_name = getattr(e.dxf, 'layer', '0')
            if col == 256:
                rgb, hex_col = layer_colors.get(lay_name, ((0.85, 0.85, 0.85), '#e2e8f0'))
            else:
                rgb = get_rgb(col)
                hex_col = f"#{int(rgb[0]*255):02x}{int(rgb[1]*255):02x}{int(rgb[2]*255):02x}"
            
            if t in ['LINE', 'LWPOLYLINE', 'POLYLINE', 'SPLINE', 'SOLID', 'CIRCLE', 'ARC']:
                if t == 'LINE':
                    add_seg((e.dxf.start.x, e.dxf.start.y), (e.dxf.end.x, e.dxf.end.y), rgb)
                elif t in ['LWPOLYLINE', 'POLYLINE']:
                    pts = list(e.points()) if t == 'POLYLINE' else list(e.get_points())
                    for i in range(len(pts)-1):
                        add_seg((pts[i][0], pts[i][1]), (pts[i+1][0], pts[i+1][1]), rgb)
                    if getattr(e, 'is_closed', False) and len(pts) > 2:
                        add_seg((pts[-1][0], pts[-1][1]), (pts[0][0], pts[0][1]), rgb)
                elif t == 'SPLINE':
                    try:
                        pts = list(e.flattening(distance=0.5))
                        for i in range(len(pts)-1):
                            add_seg((pts[i][0], pts[i][1]), (pts[i+1][0], pts[i+1][1]), rgb)
                        if e.closed and len(pts) > 2:
                            add_seg((pts[-1][0], pts[-1][1]), (pts[0][0], pts[0][1]), rgb)
                    except Exception:
                        pass
                elif t == 'SOLID':
                    v0 = (e.dxf.vtx0.x, e.dxf.vtx0.y)
                    v1 = (e.dxf.vtx1.x, e.dxf.vtx1.y)
                    v2 = (e.dxf.vtx2.x, e.dxf.vtx2.y)
                    v3 = (e.dxf.vtx3.x, e.dxf.vtx3.y) if hasattr(e.dxf, 'vtx3') else v2
                    add_tri(v0, v1, v3, rgb)
                    add_tri(v3, v2, v0, rgb)
                elif t == 'CIRCLE':
                    cx, cy, r = e.dxf.center.x, e.dxf.center.y, e.dxf.radius
                    steps = 16 if r > 50 else 12
                    c_pts = [(cx + r * math.cos(i*2*math.pi/steps), cy + r * math.sin(i*2*math.pi/steps)) for i in range(steps)]
                    for i in range(steps):
                        add_seg(c_pts[i], c_pts[(i+1)%steps], rgb)
                elif t == 'ARC':
                    cx, cy, r = e.dxf.center.x, e.dxf.center.y, e.dxf.radius
                    sa, ea = math.radians(e.dxf.start_angle), math.radians(e.dxf.end_angle)
                    if ea < sa:
                        ea += 2 * math.pi
                    steps = max(4, int(abs(ea - sa) / (math.pi / 8)))
                    a_pts = [(cx + r * math.cos(sa + (ea-sa)*i/steps), cy + r * math.sin(sa + (ea-sa)*i/steps)) for i in range(steps+1)]
                    for i in range(steps):
                        add_seg(a_pts[i], a_pts[i+1], rgb)
            elif t in ['TEXT', 'MTEXT']:
                raw = e.dxf.text if t == 'TEXT' else e.text
                cln = clean_txt(raw)
                if cln:
                    h = getattr(e.dxf, 'char_height', getattr(e.dxf, 'height', 10.0))
                    rot = getattr(e.dxf, 'rotation', 0.0)
                    halign = getattr(e.dxf, 'halign', 0)
                    valign = getattr(e.dxf, 'valign', 0)
                    align_pt = getattr(e.dxf, 'align_point', None)
                    ins_pt = e.dxf.insert
                    target_pt = align_pt if ((halign > 0 or valign > 0) and align_pt is not None and (abs(align_pt.x) > 0.001 or abs(align_pt.y) > 0.001)) else ins_pt
                    
                    ha = 1 if halign in [1, 4] else (2 if halign == 2 else 0)
                    va = 1 if valign == 1 else (2 if valign == 2 else (3 if valign == 3 else 0))
                    if t == 'MTEXT':
                        attach = getattr(e.dxf, 'attachment_point', 1)
                        ha = 0 if attach in [1, 4, 7] else (1 if attach in [2, 5, 8] else 2)
                        va = 3 if attach in [1, 2, 3] else (2 if attach in [4, 5, 6] else 1)

                    all_texts.append({
                        't': cln,
                        'x': round(target_pt.x, 1),
                        'y': round(target_pt.y, 1),
                        'h': round(h, 1),
                        'r': round(rot % 360, 1),
                        'c': hex_col,
                        'ha': ha,
                        'va': va
                    })
            elif t == 'INSERT':
                bname = getattr(e.dxf, 'name', None)
                ins = (e.dxf.insert.x, e.dxf.insert.y)
                rot = math.radians(getattr(e.dxf, 'rotation', 0.0))
                cos_r, sin_r = math.cos(rot), math.sin(rot)
                sx = getattr(e.dxf, 'xscale', 1.0)
                sy = getattr(e.dxf, 'yscale', 1.0)
                
                if bname in block_cache:
                    for (p1, p2, blk_rgb, blk_col, blk_lay) in block_cache[bname]:
                        tp1 = transform_pt(p1, ins, cos_r, sin_r, sx, sy)
                        tp2 = transform_pt(p2, ins, cos_r, sin_r, sx, sy)
                        
                        if blk_col == 0:
                            final_rgb = rgb
                        elif blk_lay == '0' and blk_col == 256:
                            final_rgb = rgb
                        else:
                            final_rgb = blk_rgb
                            
                        add_seg(tp1, tp2, final_rgb)

                    if bname in block_tris:
                        for (p1, p2, p3, blk_rgb, blk_col, blk_lay) in block_tris[bname]:
                            tp1 = transform_pt(p1, ins, cos_r, sin_r, sx, sy)
                            tp2 = transform_pt(p2, ins, cos_r, sin_r, sx, sy)
                            tp3 = transform_pt(p3, ins, cos_r, sin_r, sx, sy)
                            if blk_col == 0:
                                final_rgb = rgb
                            elif blk_lay == '0' and blk_col == 256:
                                final_rgb = rgb
                            else:
                                final_rgb = blk_rgb
                            add_tri(tp1, tp2, tp3, final_rgb)
                
                if bname in block_texts:
                    for bt in block_texts[bname]:
                        tp = transform_pt((bt['x'], bt['y']), ins, cos_r, sin_r, sx, sy)
                        cln = clean_txt(bt['t'])
                        if cln:
                            total_rot = bt['r'] + math.degrees(rot)
                            b_col = bt.get('raw_col', 256)
                            b_lay = bt.get('lay_name', '0')
                            
                            if b_col == 0:
                                final_hex = hex_col
                            elif b_lay == '0' and b_col == 256:
                                final_hex = hex_col
                            else:
                                final_hex = bt['c']
                                
                            all_texts.append({
                                't': cln,
                                'x': round(tp[0], 1),
                                'y': round(tp[1], 1),
                                'h': round(bt['h'] * max(abs(sx), abs(sy)), 1),
                                'r': round(total_rot % 360, 1),
                                'c': final_hex,
                                'ha': bt.get('ha', 0),
                                'va': bt.get('va', 0)
                            })

        num_lines = len(pos_data) // 6
        num_tris = len(tri_pos_data) // 9
        if min_x == float('inf'):
            min_x, min_y, max_x, max_y = 0.0, 0.0, 1000.0, 700.0

        os.makedirs(os.path.dirname(os.path.abspath(output_bin_path)), exist_ok=True)
        
        # Binary format header:
        # 4 bytes: Magic 'CADW'
        # 4 bytes uint32: Version (2)
        # 4 bytes uint32: num_lines
        # 4 bytes uint32: num_tris
        # 4 bytes float32: min_x
        # 4 bytes float32: min_y
        # 4 bytes float32: max_x
        # 4 bytes float32: max_y
        # Following: pos_data (num_lines * 6 * 4 bytes float32)
        # Following: col_data (num_lines * 6 * 4 bytes float32)
        # Following: tri_pos_data (num_tris * 9 * 4 bytes float32)
        # Following: tri_col_data (num_tris * 9 * 4 bytes float32)
        with open(output_bin_path, 'wb') as f:
            f.write(b'CADW')
            f.write(struct.pack('<IIIffff', 2, num_lines, num_tris, min_x, min_y, max_x, max_y))
            f.write(struct.pack(f'<{len(pos_data)}f', *pos_data))
            f.write(struct.pack(f'<{len(col_data)}f', *col_data))
            f.write(struct.pack(f'<{len(tri_pos_data)}f', *tri_pos_data))
            f.write(struct.pack(f'<{len(tri_col_data)}f', *tri_col_data))

        # Save Text JSON alongside binary buffer
        output_txt_path = output_bin_path.replace('__cad_webgl.bin', '__cad_texts.json')
        if output_txt_path == output_bin_path:
            output_txt_path = os.path.splitext(output_bin_path)[0] + '__cad_texts.json'
            
        with open(output_txt_path, 'w', encoding='utf-8') as f:
            try:
                json.dump({'texts': all_texts}, f, ensure_ascii=False)
            except Exception:
                json.dump({'texts': all_texts}, f, ensure_ascii=True)

        file_size = os.path.getsize(output_bin_path)
        duration_ms = int((time.time() - start_time) * 1000)

        return {
            "status": "SUCCESS",
            "num_lines": num_lines,
            "bounds": {
                "min_x": round(min_x, 1),
                "min_y": round(min_y, 1),
                "max_x": round(max_x, 1),
                "max_y": round(max_y, 1),
                "width": round(max_x - min_x, 1),
                "height": round(max_y - min_y, 1)
            },
            "file_size_bytes": file_size,
            "file_size_mb": round(file_size / (1024 * 1024), 2),
            "duration_ms": duration_ms
        }
    except Exception as e:
        return {"status": "ERROR", "error": str(e), "duration_ms": int((time.time() - start_time) * 1000)}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: cad_webgl_exporter.py <input_dxf> <output_bin>"}))
        sys.exit(1)
        
    in_dxf = sys.argv[1]
    out_bin = sys.argv[2]
    res = export_dxf_to_webgl_binary(in_dxf, out_bin)
    print(json.dumps(res, ensure_ascii=False, indent=2))
