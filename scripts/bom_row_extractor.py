#!/usr/bin/env python3
"""
CADON-BOM SERVER POC - PROMPT 09
BOM Row & Column Extraction / Structured Raw BOM Engine
"""
import sys
import json
import re
import time

def sanitize_unicode(obj):
    if isinstance(obj, str):
        return obj.encode('utf-8', 'surrogateescape').decode('utf-8', 'replace')
    elif isinstance(obj, dict):
        return {k: sanitize_unicode(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_unicode(v) for v in obj]
    return obj

def extract_bom_rows(cad_data: dict, bom_areas_data: dict) -> dict:
    start_time = time.time()
    objects = cad_data.get("objects", [])
    bom_areas = bom_areas_data.get("bom_areas", [])
    
    extracted_items = []
    
    for area in bom_areas:
        dwg_no = area.get("drawing_no", "")
        bbox = area.get("bbox", {})
        
        area_texts = []
        for obj in objects:
            if obj.get("raw_text"):
                ob = obj.get("bounding_box", {})
                ox = (ob.get("min_x", 0) + ob.get("max_x", 0)) / 2
                oy = (ob.get("min_y", 0) + ob.get("max_y", 0)) / 2
                if bbox.get("min_x", 0) <= ox <= bbox.get("max_x", 0) and bbox.get("min_y", 0) <= oy <= bbox.get("max_y", 0):
                    area_texts.append(obj)
                    
        # Group text items into rows based on Y coordinates
        y_groups = {}
        for obj in area_texts:
            ob = obj.get("bounding_box", {})
            y_mid = round((ob.get("min_y", 0) + ob.get("max_y", 0)) / 2 / 10.0) * 10
            y_groups.setdefault(y_mid, []).append(obj)
            
        rows_extracted = 0
        sorted_y = sorted(y_groups.keys(), reverse=True)
        
        for y in sorted_y:
            row_objs = sorted(y_groups[y], key=lambda o: o.get("bounding_box", {}).get("min_x", 0))
            texts = [o.get("raw_text", "").strip() for o in row_objs if o.get("raw_text", "").strip()]
            
            if len(texts) == 1 and '|' in texts[0]:
                texts = [p.strip() for p in texts[0].split('|')]

            # Skip header row
            if any(h in "".join(texts).upper() for h in ["ITEM", "PART NO", "DWG NO", "품명", "규격"]):
                continue
                
            # Must contain actual alphabet or Korean characters (not just numbers/coordinates)
            combined = " ".join(texts)
            if not re.search(r'[A-Za-z가-힣]', combined):
                continue
                
            if len(texts) >= 2:
                rows_extracted += 1
                item_no = texts[0] if texts[0].isdigit() else str(rows_extracted)
                part_no = texts[1] if len(texts) > 1 else f"P-{rows_extracted:03d}"
                name = texts[2] if len(texts) > 2 else texts[1]
                spec = texts[3] if len(texts) > 3 else "-"
                mat = texts[4] if len(texts) > 4 else "SS400"
                qty = texts[5] if len(texts) > 5 and re.match(r'^\d+(\.\d+)?$', texts[5]) else "1"
                
                extracted_items.append({
                    "id": f"RAW_{len(extracted_items)+1}",
                    "drawing_no": dwg_no,
                    "row_index": rows_extracted,
                    "item_no_raw": item_no,
                    "part_no_raw": part_no,
                    "name_raw": name,
                    "specification_raw": spec,
                    "material_raw": mat,
                    "quantity_raw": qty,
                    "quantity_numeric": float(qty) if re.match(r'^\d+(\.\d+)?$', qty) else 1.0,
                    "unit_raw": "EA",
                    "remark_raw": "",
                    "source_handles": [o.get("handle") for o in row_objs],
                    "status": "EXTRACTED"
                })
                
    return {
        "status": "SUCCESS",
        "total_rows": len(extracted_items),
        "raw_bom_items": extracted_items,
        "duration_ms": int((time.time() - start_time) * 1000)
    }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: bom_row_extractor.py <cad_json> <bom_area_json>"}))
        sys.exit(1)
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        cad = json.load(f)
    with open(sys.argv[2], "r", encoding="utf-8") as f:
        areas = json.load(f)
    res = extract_bom_rows(cad, areas)
    clean_res = sanitize_unicode(res)
    try:
        print(json.dumps(clean_res, ensure_ascii=False, indent=2))
    except Exception:
        print(json.dumps(clean_res, ensure_ascii=True, indent=2))
