#!/usr/bin/env python3
"""
CADON-BOM SERVER POC - PROMPT 12
Master Candidate Search & Standard BOM Matching Engine
"""
import sys
import json
import time

DEMO_STANDARD_MASTERS = [
    {"master_code": "GR-1200", "standard_name": "GUIDE RAIL ASSY 1200", "category": "GUIDE_RAIL", "specification": "1200L", "material": "AL6063", "unit": "EA"},
    {"master_code": "GR-1000", "standard_name": "GUIDE RAIL ASSY 1000", "category": "GUIDE_RAIL", "specification": "1000L", "material": "AL6063", "unit": "EA"},
    {"master_code": "MB-001", "standard_name": "MOTOR BASE BRACKET", "category": "BRACKET", "specification": "150x120x10T", "material": "SS400", "unit": "EA"},
    {"master_code": "FR-101-LH", "standard_name": "MAIN FRAME LH", "category": "FRAME", "specification": "800x600", "material": "SS400", "unit": "EA"},
    {"master_code": "FR-101-RH", "standard_name": "MAIN FRAME RH", "category": "FRAME", "specification": "800x600", "material": "SS400", "unit": "EA"},
    {"master_code": "SF-102", "standard_name": "DRIVE SHAFT D25", "category": "SHAFT", "specification": "DIA 25x300L", "material": "S45C", "unit": "EA"},
    {"master_code": "BK-003", "standard_name": "GUIDE BRACKET SIDE", "category": "BRACKET", "specification": "50x50x5T", "material": "SUS304", "unit": "EA"}
]

def score_candidate(item: dict, master: dict) -> dict:
    score = 0
    pos_evidence = []
    neg_evidence = []
    
    # 1. Exact or Partial Code Match
    norm_name = item.get("normalized_name", "").upper()
    search_name = item.get("search_name", "").upper()
    m_code = master["master_code"].upper()
    m_name = master["standard_name"].upper()
    
    if m_code in norm_name or m_code in search_name:
        score += 50
        pos_evidence.append(f"Master Code [{m_code}] matches item name")
        
    # 2. Name Similarity
    if m_name in norm_name or norm_name in m_name:
        score += 35
        pos_evidence.append("Standard Name exact/strong match")
    else:
        # Token overlap
        item_toks = set(search_name.split())
        master_toks = set(m_name.split())
        overlap = item_toks.intersection(master_toks)
        if overlap:
            score += len(overlap) * 10
            pos_evidence.append(f"Matching tokens: {', '.join(overlap)}")
            
    # 3. Material Check
    item_mat = (item.get("material_candidate") or "").upper()
    master_mat = (master.get("material") or "").upper()
    if item_mat and master_mat:
        if item_mat == master_mat or (item_mat in master_mat) or (master_mat in item_mat):
            score += 15
            pos_evidence.append(f"Material match: {master_mat}")
        else:
            score -= 10
            neg_evidence.append(f"Material discrepancy ({item_mat} vs {master_mat})")
            
    # 4. Direction Check
    item_dir = item.get("direction")
    if item_dir:
        if item_dir in m_code or item_dir in m_name:
            score += 10
            pos_evidence.append(f"Direction {item_dir} matches")
        else:
            score -= 15
            neg_evidence.append(f"Direction mismatch ({item_dir})")
            
    return {
        "master_code": master["master_code"],
        "standard_name": master["standard_name"],
        "specification": master["specification"],
        "material": master["material"],
        "unit": master["unit"],
        "total_score": max(0, min(100, score)),
        "positive_evidence": pos_evidence,
        "negative_evidence": neg_evidence
    }

def match_master_candidates(normalized_data: dict, master_list: list = None) -> dict:
    start_time = time.time()
    items = normalized_data.get("normalized_items", [])
    masters = master_list or DEMO_STANDARD_MASTERS
    
    matched_results = []
    
    for item in items:
        candidates = []
        for m in masters:
            res = score_candidate(item, m)
            if res["total_score"] > 20:
                candidates.append(res)
                
        candidates.sort(key=lambda c: c["total_score"], reverse=True)
        top3 = candidates[:3]
        
        # Determine status
        if not top3:
            status = "NO_MATCH"
        elif len(top3) >= 2 and (top3[0]["total_score"] - top3[1]["total_score"] < 5):
            status = "AMBIGUOUS"
        else:
            status = "MATCH_FOUND"
            
        matched_results.append({
            "item_id": item.get("id"),
            "raw_name": item.get("raw_name"),
            "normalized_name": item.get("normalized_name"),
            "spec_candidate": item.get("spec_candidate"),
            "material_candidate": item.get("material_candidate"),
            "quantity": item.get("quantity", 1.0),
            "unit": item.get("unit", "EA"),
            "status": status,
            "top_candidates": top3,
            "selected_master": top3[0] if top3 and status == "MATCH_FOUND" else None
        })
        
    return {
        "status": "SUCCESS",
        "total_items": len(matched_results),
        "results": matched_results,
        "duration_ms": int((time.time() - start_time) * 1000)
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: master_matcher.py <normalized_json> [masters_json]"}))
        sys.exit(1)
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        norm = json.load(f)
    masters = None
    if len(sys.argv) > 2 and os.path.exists(sys.argv[2]):
        with open(sys.argv[2], "r", encoding="utf-8") as f:
            masters = json.load(f)
    res = match_master_candidates(norm, masters)
    print(json.dumps(res, ensure_ascii=False, indent=2))
