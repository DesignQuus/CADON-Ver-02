#!/usr/bin/env python3
"""
CADON-BOM SERVER POC - PROMPT 17
Golden Dataset & Baseline Evaluation Engine
"""
import sys
import json
import time

def evaluate_golden_case(golden_ground_truth: dict, system_analysis: dict) -> dict:
    start_time = time.time()
    
    # 1. Drawing Count Evaluation
    actual_drawings = golden_ground_truth.get("actual_drawing_count", 1)
    detected_drawings = len(system_analysis.get("drawings", []))
    drawing_errors = []
    
    correct_drawings = min(actual_drawings, detected_drawings)
    fp_drawings = max(0, detected_drawings - actual_drawings)
    fn_drawings = max(0, actual_drawings - detected_drawings)
    
    if fp_drawings > 0:
        drawing_errors.append({"module": "DRAWING_FRAME", "type": "FALSE_POSITIVE", "count": fp_drawings, "severity": "MAJOR"})
    if fn_drawings > 0:
        drawing_errors.append({"module": "DRAWING_FRAME", "type": "FALSE_NEGATIVE", "count": fn_drawings, "severity": "CRITICAL"})
        
    # 2. BOM Items Evaluation
    actual_boms = golden_ground_truth.get("actual_bom_count", 1)
    detected_boms = len(system_analysis.get("bom_areas", []))
    
    actual_rows = golden_ground_truth.get("actual_item_count", 5)
    detected_rows = len(system_analysis.get("raw_bom_items", []))
    
    # 3. Master Top 1 & Top 3 Recall
    master_results = system_analysis.get("master_results", [])
    top1_correct = 0
    top3_correct = 0
    false_matches = 0
    
    for item in master_results:
        status = item.get("status")
        if status == "MATCH_FOUND":
            top1_correct += 1
            top3_correct += 1
        elif status == "AMBIGUOUS":
            top3_correct += 1
        elif status == "NO_MATCH":
            pass
            
    # 4. Summary Metrics
    metrics = {
        "drawing_precision": round(correct_drawings / detected_drawings, 3) if detected_drawings > 0 else 1.0,
        "drawing_recall": round(correct_drawings / actual_drawings, 3) if actual_drawings > 0 else 1.0,
        "actual_drawings": actual_drawings,
        "detected_drawings": detected_drawings,
        "actual_boms": actual_boms,
        "detected_boms": detected_boms,
        "actual_rows": actual_rows,
        "detected_rows": detected_rows,
        "master_top1_count": top1_correct,
        "master_top3_count": top3_correct,
        "false_matches": false_matches,
        "is_baseline_qualified": (fn_drawings == 0 and false_matches == 0)
    }
    
    status = "PASS" if metrics["is_baseline_qualified"] else "PARTIAL"
    
    return {
        "status": status,
        "metrics": metrics,
        "errors": drawing_errors,
        "duration_ms": int((time.time() - start_time) * 1000)
    }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: golden_evaluator.py <ground_truth_json> <system_analysis_json>"}))
        sys.exit(1)
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        gt = json.load(f)
    with open(sys.argv[2], "r", encoding="utf-8") as f:
        sys_res = json.load(f)
    res = evaluate_golden_case(gt, sys_res)
    print(json.dumps(res, ensure_ascii=False, indent=2))
