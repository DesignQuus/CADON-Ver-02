#!/usr/bin/env python3
"""
CADON-BOM SERVER POC - PROMPT 05
True Drawing Sheet Frame Detection Engine
Filters out inner component boxes and identifies true top-level CAD drawing sheets
"""
import sys
import json
import time

def calculate_iou(box1, box2):
    x_left = max(box1["min_x"], box2["min_x"])
    y_bottom = max(box1["min_y"], box2["min_y"])
    x_right = min(box1["max_x"], box2["max_x"])
    y_top = min(box1["max_y"], box2["max_y"])
    
    if x_right < x_left or y_top < y_bottom:
        return 0.0
    
    intersection_area = (x_right - x_left) * (y_top - y_bottom)
    box1_area = (box1["max_x"] - box1["min_x"]) * (box1["max_y"] - box1["min_y"])
    box2_area = (box2["max_x"] - box2["min_x"]) * (box2["max_y"] - box2["min_y"])
    
    union_area = box1_area + box2_area - intersection_area
    if union_area <= 0:
        return 0.0
    return intersection_area / union_area

def detect_drawing_frames(cad_data: dict) -> dict:
    start_time = time.time()
    objects = cad_data.get("objects", [])
    gb = cad_data.get("global_bounds", {})
    
    raw_boxes = []
    
    # 1. Detect Closed Polylines & Rectangles
    for obj in objects:
        t = obj.get("entity_type")
        bbox = obj.get("bounding_box", {})
        w = bbox.get("max_x", 0) - bbox.get("min_x", 0)
        h = bbox.get("max_y", 0) - bbox.get("min_y", 0)
        
        # In manufacturing CAD, drawing sheets range from A4 (210x148) to A0/assembly layouts
        if w >= 180 and h >= 120:
            aspect = w / h if h > 0 else 0
            if 0.6 <= aspect <= 2.8:
                raw_boxes.append({
                    "source_handle": obj.get("handle"),
                    "frame_type": "CLOSED_POLYLINE" if t in ['LWPOLYLINE', 'POLYLINE'] else "RECTANGLE_BBOX",
                    "bbox": bbox,
                    "width": w,
                    "height": h,
                    "area": w * h,
                    "aspect_ratio": round(aspect, 3),
                    "confidence_score": 0.95
                })

    # Sort boxes by area descending
    raw_boxes.sort(key=lambda b: b["area"], reverse=True)
    
    # 2. Containment Filtering: Eliminate inner sub-boxes that are inside a larger drawing frame
    top_level_candidates = []
    for b in raw_boxes:
        is_child = False
        for parent in top_level_candidates:
            pb = parent["bbox"]
            # If b is contained inside parent with margin
            if (b["bbox"]["min_x"] >= pb["min_x"] - 100 and b["bbox"]["max_x"] <= pb["max_x"] + 100 and
                b["bbox"]["min_y"] >= pb["min_y"] - 100 and b["bbox"]["max_y"] <= pb["max_y"] + 100):
                is_child = True
                break
        if not is_child:
            top_level_candidates.append(b)

    # 3. Sort sheets spatially from Left to Right (standard CAD reading order)
    top_level_candidates.sort(key=lambda c: (c["bbox"]["min_x"], -c["bbox"]["max_y"]))

    # 4. Fallback if no sheet detected: Use global bounds
    if not top_level_candidates and gb and gb.get("width", 0) > 0:
        top_level_candidates.append({
            "source_handle": "GLOBAL_FRAME",
            "frame_type": "GLOBAL_BOUNDS",
            "bbox": {"min_x": gb["min_x"], "min_y": gb["min_y"], "max_x": gb["max_x"], "max_y": gb["max_y"]},
            "width": gb["width"],
            "height": gb["height"],
            "area": gb["width"] * gb["height"],
            "aspect_ratio": round(gb["width"]/gb["height"], 3) if gb["height"]>0 else 1.414,
            "confidence_score": 0.90
        })

    for i, cand in enumerate(top_level_candidates):
        cand["candidate_index"] = i + 1
        cand["status"] = "HIGH"

    return {
        "status": "SUCCESS",
        "total_detected": len(top_level_candidates),
        "candidates": top_level_candidates,
        "duration_ms": int((time.time() - start_time) * 1000)
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: frame_detector.py <cad_data_json>"}))
        sys.exit(1)
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        data = json.load(f)
    res = detect_drawing_frames(data)
    print(json.dumps(res, ensure_ascii=False, indent=2))
