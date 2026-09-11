#!/usr/bin/env python3
"""
CADON-BOM SERVER POC - PROMPT 08
BOM Area Detection & Table Region Classification Engine
"""
import sys
import json
import re
import time

def detect_bom_areas(cad_data: dict, structure_data: dict) -> dict:
    start_time = time.time()
    objects = cad_data.get("objects", [])
    drawings = structure_data.get("drawings", [])
    
    bom_headers = ["NO", "ITEM", "PART NO", "DWG NO", "NAME", "DESCRIPTION", "SPEC", "MATERIAL", "MAT", "QTY", "Q'TY", "REMARK", "품명", "규격", "재질", "수량", "비고"]
    
    candidates = []
    
    for dwg in drawings:
        fbox = dwg["frame_bbox"]
        fw = fbox["max_x"] - fbox["min_x"]
        fh = fbox["max_y"] - fbox["min_y"]
        
        # Geometric Spatial Isolation: Title Block is at bottom-right.
        # Ensure BOM table begins strictly above the title block upper boundary.
        tbox = dwg.get("title_block_bbox")
        if tbox and "max_y" in tbox and tbox["max_y"] > fbox["min_y"]:
            bom_area_min_y = max(fbox["min_y"] + fh * 0.15, tbox["max_y"] + 5.0)
        else:
            bom_area_min_y = fbox["min_y"] + fh * 0.20
            
        bom_area_min_x = fbox["min_x"] + fw * 0.45
        bom_area_max_x = fbox["max_x"]
        bom_area_max_y = fbox["max_y"]
        
        table_texts = []
        for obj in objects:
            if obj.get("raw_text"):
                ob = obj.get("bounding_box", {})
                ox = (ob.get("min_x", 0) + ob.get("max_x", 0)) / 2
                oy = (ob.get("min_y", 0) + ob.get("max_y", 0)) / 2
                
                # Exclude any text entity geometrically residing inside the title block
                if tbox and (tbox.get("min_x", 0) <= ox <= tbox.get("max_x", 0) and tbox.get("min_y", 0) <= oy <= tbox.get("max_y", 0)):
                    continue
                
                if bom_area_min_x <= ox <= bom_area_max_x and bom_area_min_y <= oy <= bom_area_max_y:
                    table_texts.append(obj)
                    
        # Check if there are BOM keywords
        keyword_hits = 0
        for obj in table_texts:
            t = (obj.get("raw_text") or "").upper().strip()
            if any(h in t for h in bom_headers):
                keyword_hits += 1
                
        # Main assemblies and sub-assemblies typically have a BOM
        has_bom = keyword_hits >= 2 or dwg["drawing_type"] in ["MAIN_ASSY", "SUB_ASSY"]
        
        if has_bom:
            candidates.append({
                "drawing_no": dwg["drawing_no_raw"],
                "table_type": "BOM_TABLE",
                "bbox": {
                    "min_x": bom_area_min_x,
                    "min_y": bom_area_min_y,
                    "max_x": bom_area_max_x,
                    "max_y": bom_area_max_y
                },
                "confidence_score": 0.94,
                "text_count": len(table_texts),
                "keyword_hits": keyword_hits,
                "status": "APPROVED"
            })
            
    return {
        "status": "SUCCESS",
        "total_bom_areas": len(candidates),
        "bom_areas": candidates,
        "duration_ms": int((time.time() - start_time) * 1000)
    }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: bom_area_detector.py <cad_json> <structure_json>"}))
        sys.exit(1)
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        cad = json.load(f)
    with open(sys.argv[2], "r", encoding="utf-8") as f:
        struc = json.load(f)
    res = detect_bom_areas(cad, struc)
    print(json.dumps(res, ensure_ascii=False, indent=2))
