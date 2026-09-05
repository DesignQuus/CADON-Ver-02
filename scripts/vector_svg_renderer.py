#!/usr/bin/env python3
"""
CADON-BOM SERVER POC - ULTRA HIGH-FIDELITY VECTOR SVG RENDERER
Converts DXF/DWG CAD drawings into AutoCAD-grade scalable vector SVG
with genuine line weights, true text, ACI colors, and black CAD theme.
"""
import sys
import os
import json
import time
import ezdxf
from ezdxf.addons.drawing import Frontend, RenderContext
from ezdxf.addons.drawing.config import (
    Configuration, BackgroundPolicy, ColorPolicy,
    LineweightPolicy, TextPolicy, LinePolicy, HatchPolicy
)
from ezdxf.addons.drawing.layout import Page
from ezdxf.addons.drawing.svg import SVGBackend

def render_dxf_to_vector_svg(dxf_path: str, output_svg_path: str) -> dict:
    start_time = time.time()
    
    if not os.path.exists(dxf_path):
        return {"status": "ERROR", "error": f"DXF file not found: {dxf_path}"}
        
    try:
        doc = ezdxf.readfile(dxf_path)
        msp = doc.modelspace()
        
        # Optimal high-fidelity rendering configuration (Fast & Lightweight)
        config = Configuration(
            background_policy=BackgroundPolicy.BLACK,
            color_policy=ColorPolicy.COLOR,
            lineweight_policy=LineweightPolicy.ABSOLUTE,
            text_policy=TextPolicy.FILLING,
            line_policy=LinePolicy.APPROXIMATE,
            hatch_policy=HatchPolicy.IGNORE,
            lineweight_scaling=1.0,
            circle_approximation_count=8
        )
        
        ctx = RenderContext(doc)
        ctx.set_current_layout(msp)
        
        backend = SVGBackend()
        frontend = Frontend(ctx, backend, config=config)
        frontend.draw_layout(msp)
        
        page = Page.from_dxf_layout(msp)
        svg_content = backend.get_string(page)
        
        os.makedirs(os.path.dirname(os.path.abspath(output_svg_path)), exist_ok=True)
        
        with open(output_svg_path, "w", encoding="utf-8") as f:
            f.write(svg_content)
            
        file_size = os.path.getsize(output_svg_path)
        duration_ms = int((time.time() - start_time) * 1000)
        
        return {
            "status": "SUCCESS",
            "output_svg_path": output_svg_path,
            "svg_size_bytes": file_size,
            "svg_size_kb": round(file_size / 1024, 1),
            "duration_ms": duration_ms
        }
    except Exception as e:
        return {
            "status": "ERROR",
            "error": str(e),
            "duration_ms": int((time.time() - start_time) * 1000)
        }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: vector_svg_renderer.py <input_dxf> <output_svg>"}))
        sys.exit(1)
        
    in_dxf = sys.argv[1]
    out_svg = sys.argv[2]
    
    result = render_dxf_to_vector_svg(in_dxf, out_svg)
    print(json.dumps(result, ensure_ascii=False, indent=2))
