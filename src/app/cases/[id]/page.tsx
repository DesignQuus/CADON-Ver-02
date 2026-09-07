'use client';

import React, { useEffect, useState, use, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText, Upload, Play, CheckCircle2, AlertTriangle, ChevronRight, ChevronLeft,
  Layers, Database, FileSpreadsheet, RefreshCw, Lock, Sparkles, Building2,
  Folder, Calendar, Check, X, ShieldAlert, ArrowDown, Eye, Download, Info, Trash2,
  Search, Plus, Pencil, ChevronDown, CheckSquare, Square, Coins, ExternalLink, MapPin,
  Table, LayoutGrid, Filter, RotateCcw
} from 'lucide-react';
import CadViewer from '@/components/CadViewer';
import QuotationDocumentPreview from '@/components/QuotationDocumentPreview';

// --- Team Activity Mock Data & Component ---
const TEAM_MEMBERS = [
  { id: 'admin', name: '최고관리자', role: '시스템 운영', avatar: '👑', color: 'bg-amber-100 text-amber-700 border-amber-300', lastLogin: '방금 전', processed: 124, projects: 12 },
  { id: 'est1', name: '최견적', role: '견적 담당', avatar: '👨‍💼', color: 'bg-blue-100 text-blue-700 border-blue-300', lastLogin: '10분 전', processed: 45, projects: 5 },
  { id: 'est2', name: '이견적', role: '견적 담당', avatar: '👩‍💼', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', lastLogin: '1시간 전', processed: 38, projects: 4 },
  { id: 'est3', name: '김견적', role: '견적 담당', avatar: '👨‍💻', color: 'bg-purple-100 text-purple-700 border-purple-300', lastLogin: '3시간 전', processed: 52, projects: 7 },
  { id: 'est4', name: '송견적', role: '견적 담당', avatar: '👩‍💻', color: 'bg-pink-100 text-pink-700 border-pink-300', lastLogin: '어제', processed: 29, projects: 2 },
  { id: 'est5', name: '박견적', role: '견적 담당', avatar: '🧑‍💻', color: 'bg-indigo-100 text-indigo-700 border-indigo-300', lastLogin: '2일 전', processed: 15, projects: 1 },
];

function TeamActivityAccordion() {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredMember, setHoveredMember] = useState<any>(null);

  return (
    <div className="mt-4 border border-slate-200 rounded-xl bg-white shadow-sm transition-all">
      {/* Header / Avatar Stack */}
      <div 
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            팀 사용 내역
          </h4>
          <span className="text-[10px] text-slate-400 mt-0.5 block">최근 접속 및 작업 현황</span>
        </div>
        
        <div className="flex items-center">
          <div className="flex -space-x-2 mr-2">
            {TEAM_MEMBERS.map((m, idx) => (
              <div 
                key={m.id} 
                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm text-[11px] relative cursor-help transition-transform hover:-translate-y-1 hover:z-10 ${m.color}`}
                style={{ zIndex: TEAM_MEMBERS.length - idx }}
                onMouseEnter={() => setHoveredMember(m)}
                onMouseLeave={() => setHoveredMember(null)}
              >
                {m.avatar}
                
                {/* Popover */}
                {hoveredMember?.id === m.id && !isOpen && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-slate-900 text-white rounded-lg text-xs shadow-xl z-50 pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-slate-900">
                    <div className="font-bold border-b border-slate-700 pb-1 mb-1">{m.name} <span className="text-[10px] text-slate-400 font-normal">{m.role}</span></div>
                    <div className="space-y-0.5 text-[10px]">
                      <div className="flex justify-between text-slate-300"><span>최근 접속:</span> <span className="text-white">{m.lastLogin}</span></div>
                      <div className="flex justify-between text-slate-300"><span>분석 완료:</span> <span className="text-white">{m.processed}건</span></div>
                      <div className="flex justify-between text-slate-300"><span>진행 프로젝트:</span> <span className="text-white">{m.projects}건</span></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Accordion Body */}
      {isOpen && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-2 space-y-1.5 rounded-b-xl overflow-hidden">
          {TEAM_MEMBERS.map(m => (
            <div key={m.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-all">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border text-xs shadow-sm ${m.color}`}>
                  {m.avatar}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">{m.name} <span className="text-[10px] text-slate-500 font-normal">{m.role}</span></div>
                  <div className="text-[10px] text-slate-400">접속: {m.lastLogin}</div>
                </div>
              </div>
              <div className="text-right text-[10px] space-y-0.5">
                <div className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
                  <span className="font-semibold text-slate-800">{m.processed}</span>건 분석
                </div>
                <div className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
                  <span className="font-semibold text-slate-800">{m.projects}</span>건 진행중
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
// ----------------------------------------

export default function CaseWorkbenchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyReason, setPrivacyReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cad' | 'structure' | 'approval' | 'quote' | 'excel'>('cad');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedNormItem, setSelectedNormItem] = useState<any>(null);
  const [manualPriceModal, setManualPriceModal] = useState<any>(null);
  const [manualPriceInput, setManualPriceInput] = useState('');
  const [manualPriceReason, setManualPriceReason] = useState('');
  const [manualPriceHistory, setManualPriceHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [applyScope, setApplyScope] = useState<'SINGLE' | 'ALL_SAME'>('SINGLE');
  const [autoIncludeInQuote, setAutoIncludeInQuote] = useState(true);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [analyzingFileId, setAnalyzingFileId] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<any>(null);
  const [externalFocusIdx, setExternalFocusIdx] = useState<number | null>(null);

  // 💎 Inline Direct Price Edit States
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState<string>('');
  const [savingPriceId, setSavingPriceId] = useState<string | null>(null);
  const isSavingInlineRef = useRef(false);
  const isCancelledRef = useRef(false);

  // 💎 Quote Checkbox Header Pull-down Menu State
  const [quoteDropdownOpen, setQuoteDropdownOpen] = useState(false);
  const quoteDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (quoteDropdownRef.current && !quoteDropdownRef.current.contains(event.target as Node)) {
        setQuoteDropdownOpen(false);
      }
    }
    if (quoteDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [quoteDropdownOpen]);

  // 💎 Approval Workbench Tab Filter & View States
  const [approvalFilterTab, setApprovalFilterTab] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [approvalSearchText, setApprovalSearchText] = useState('');
  const [approvalViewMode, setApprovalViewMode] = useState<'TABLE' | 'CARD'>('TABLE');
  const [selectedApprovalIds, setSelectedApprovalIds] = useState<string[]>([]);

  const handleNavigateToCadDrawing = (target: any) => {
    if (!target) return;
    const allDrawings = data?.drawings || [];
    const targetId = target.matched_drawing_id || target.drawing_id || target.id;
    const targetDwgNo = target.drawing_no || target.drawing_no_raw || target.part_no;

    let idx = -1;
    if (targetId) {
      idx = allDrawings.findIndex((item: any) => item.id === targetId);
    }
    if (idx < 0 && targetDwgNo) {
      idx = allDrawings.findIndex(
        (item: any) =>
          item.drawing_no_raw === targetDwgNo ||
          item.drawing_no_normalized === targetDwgNo ||
          item.id === targetDwgNo
      );
    }
    if (idx < 0 && target.source_drawings_json) {
      try {
        const sourceList = typeof target.source_drawings_json === 'string'
          ? JSON.parse(target.source_drawings_json)
          : target.source_drawings_json;
        if (Array.isArray(sourceList) && sourceList.length > 0) {
          idx = allDrawings.findIndex((item: any) => sourceList.includes(item.drawing_no_raw));
        }
      } catch {}
    }
    if (idx < 0 && (target.drawing_name || target.normalized_name || target.name_raw || target.item_name)) {
      const targetName = target.drawing_name || target.normalized_name || target.name_raw || target.item_name;
      idx = allDrawings.findIndex(
        (item: any) =>
          item.drawing_name_raw === targetName ||
          item.drawing_name_normalized === targetName
      );
    }

    if (idx >= 0) {
      setExternalFocusIdx(idx);
    }
    setActiveTab('cad');
  };

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/quotation-cases/${id}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.normalizedItems?.length > 0 && !selectedNormItem) {
          setSelectedNormItem(json.normalizedItems[0]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetch('/api/auth/me').then(res => res.json()).then(d => setUser(d.user)).catch(() => {});
  }, [id]);

  const [isDragging, setIsDragging] = useState(false);

  // Unified File Upload & Automatic Pipeline Trigger (PROMPT 03, 18, 18-R1, 18-R2)
  const handleProcessFile = async (file: File) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setAnalyzing(true);
    try {
      // 1. Upload File
      const uploadRes = await fetch(`/api/quotation-cases/${id}/upload`, {
        method: 'POST',
        body: formData
      });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadJson.error || '파일 업로드에 실패했습니다.');
      }

      // 2. Automatically Trigger CAD & BOM Analysis Pipeline
      const analyzeRes = await fetch(`/api/quotation-cases/${id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: uploadJson.file.id })
      });
      const analyzeJson = await analyzeRes.json();
      if (!analyzeRes.ok) {
        throw new Error(analyzeJson.error || 'CAD 도면 자동 분석 중 오류가 발생했습니다.');
      }

      await fetchData();
    } catch (err: any) {
      alert(err.message || '처리 실패');
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    await handleProcessFile(e.target.files[0]);
  };

  // 2. Start Analysis Manual Trigger (PROMPT 18-R1 / 18-R2)
  const handleStartAnalysis = async (targetFileId?: any) => {
    const rawFiles = (data?.files || []).filter((f: any) => f.file_role !== 'VECTOR_SVG' && f.file_type !== 'SVG' && !f.original_file_name.endsWith('.svg'));
    const fileIdToUse = typeof targetFileId === 'string'
      ? targetFileId
      : (selectedFileId || data?.latestParseRun?.source_file_id || (rawFiles && rawFiles[0]?.id));
    setAnalyzing(true);
    setAnalyzingFileId(fileIdToUse);
    try {
      const res = await fetch(`/api/quotation-cases/${id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: fileIdToUse })
      });
      if (res.ok) {
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || '분석 실패');
      }
    } finally {
      setAnalyzing(false);
      setAnalyzingFileId(null);
    }
  };

  // Delete Drawing File (Optimized Instant Deletion)
  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`정말 도면 파일 '${fileName}' 및 연관 변환 데이터를 삭제하시겠습니까?`)) {
      return;
    }

    // 1. Instant Optimistic UI Clear (< 0.01s)
    setData((prev: any) => {
      if (!prev) return prev;
      const remainingFiles = (prev.files || []).filter((f: any) => f.id !== fileId && f.derived_from_file_id !== fileId);
      if (remainingFiles.length === 0) {
        return {
          ...prev,
          files: [],
          drawings: [],
          cadObjects: [],
          bomAreas: [],
          rawBomItems: [],
          flattenedBomItems: [],
          normalizedItems: [],
          finalBomItems: [],
          case: { ...prev.case, status: 'REGISTERED', quote_readiness: 'PENDING_BOM' }
        };
      }
      return { ...prev, files: remainingFiles };
    });

    if (selectedFileId === fileId) {
      setSelectedFileId(null);
    }

    // 2. Perform background delete request
    setActionLoading(true);
    try {
      const res = await fetch(`/api/quotation-cases/${id}/files/${fileId}`, {
        method: 'DELETE'
      });
      const resJson = await res.json();
      if (!res.ok) {
        alert(resJson.error || '파일 삭제 실패');
      }
      await fetchData();
    } catch (err: any) {
      alert('삭제 중 오류: ' + err.message);
      await fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Approve Item (PROMPT 13)
  const handleApproveItem = async (
    normalizedItemId: string,
    decisionType: string,
    master: any = null,
    reason: string = ''
  ) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/quotation-cases/${id}/approve-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          normalizedItemId,
          decisionType,
          selectedMasterId: master?.master_id || master?.id || null,
          selectedMasterCode: master?.master_code || null,
          finalName: master?.standard_name || selectedNormItem.normalized_name,
          finalSpec: master?.specification || selectedNormItem.spec_candidate,
          finalMaterial: master?.material || selectedNormItem.material_candidate,
          finalQuantity: selectedNormItem.quantity,
          finalUnit: selectedNormItem.unit,
          decisionReason: reason || `${decisionType} 사용자 승인`
        })
      });
      if (res.ok) {
        await fetchData();
      }
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Bulk Approve (PROMPT 13) - Supports approving all normalized items
  const handleBulkApprove = async (approveAll: boolean = true) => {
    const confirmMsg = approveAll
      ? `추천 마스터 및 도면 가공품을 포함하여 전체 ${normalizedItems.length}개 품목을 일괄 승인하고, 견적서에 바로 반영하시겠습니까?`
      : '1순위 추천 마스터와 일치하는 미승인 품목만 승인하시겠습니까?';
    if (!confirm(confirmMsg)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/quotation-cases/${id}/bulk-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approveAll, onlyMatched: !approveAll })
      });
      if (res.ok) {
        if (approveAll) {
          // 일괄 승인 후 자동으로 124개 전체 품목 기준 새 견적서 생성 및 3단계로 이동
          const qRes = await fetch(`/api/quotation-cases/${id}/create-quote`, {
            method: 'POST'
          });
          if (qRes.ok) {
            await fetchData();
            setActiveTab('quote');
            return;
          }
        }
        await fetchData();
      }
    } finally {
      setActionLoading(false);
    }
  };

  // 4-2. Unapprove Item (단일 품목 승인 취소)
  const handleUnapproveItem = async (normalizedItemId: string, itemName?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/quotation-cases/${id}/unapprove-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ normalizedItemId })
      });
      if (res.ok) {
        setSelectedApprovalIds((prev) => prev.filter((itId) => itId !== normalizedItemId));
        await fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || '승인 취소 처리 실패');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // 4-3. Bulk Unapprove (전체 승인 일괄 초기화 or 선택 항목 일괄 취소)
  const handleBulkUnapprove = async (targetItemIds?: string[]) => {
    const isSelectedOnly = Array.isArray(targetItemIds) && targetItemIds.length > 0;
    const confirmMsg = isSelectedOnly
      ? `선택한 ${targetItemIds.length}개 품목의 승인을 취소하고 검토 대기 상태로 되돌리시겠습니까?`
      : `현재 승인 완료된 모든 품목(${approvedItemsCount}건)의 승인을 취소하고, 초기 검토 상태로 되돌리시겠습니까?`;

    if (!confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/quotation-cases/${id}/bulk-unapprove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: isSelectedOnly ? targetItemIds : undefined })
      });
      if (res.ok) {
        if (isSelectedOnly) {
          setSelectedApprovalIds((prev) => prev.filter((itId) => !targetItemIds.includes(itId)));
        } else {
          setSelectedApprovalIds([]);
        }
        await fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || '일괄 승인 취소 실패');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // 4-4. Bulk Approve Selected Items (선택 항목만 일괄 승인)
  const handleBulkApproveSelected = async (targetItemIds: string[]) => {
    if (!targetItemIds || targetItemIds.length === 0) return;
    setActionLoading(true);
    try {
      for (const itemId of targetItemIds) {
        const norm = normalizedItems.find((n: any) => n.id === itemId);
        if (!norm) continue;
        const cand = candidates.find((c: any) => c.normalized_item_id === itemId && c.rank === 1);
        const decisionType = cand ? 'EXISTING_MASTER' : 'NEW_ITEM_CANDIDATE';
        await fetch(`/api/quotation-cases/${id}/approve-item`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            normalizedItemId: itemId,
            decisionType,
            selectedMasterId: cand?.master_id || null,
            selectedMasterCode: cand?.master_code || null,
            finalName: cand?.standard_name || norm.normalized_name,
            finalSpec: cand?.specification || norm.spec_candidate,
            finalMaterial: cand?.material || norm.material_candidate,
            finalQuantity: norm.quantity,
            finalUnit: norm.unit,
            decisionReason: cand ? '1순위 마스터 추천 선택 승인' : '도면 가공품 선택 승인'
          })
        });
      }
      setSelectedApprovalIds([]);
      await fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Create Quote (PROMPT 14)
  const handleCreateQuote = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/quotation-cases/${id}/create-quote`, {
        method: 'POST'
      });
      if (res.ok) {
        await fetchData();
        setActiveTab('quote');
      } else {
        const err = await res.json();
        alert(err.error || '견적서 생성 실패');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // 5-2. Auto-Approve & Create Quote in One-Click (BOM 견적 즉시 산출)
  const handleAutoApproveAndCreateQuote = async () => {
    setActionLoading(true);
    try {
      // 1. Bulk approve AI 1st recommended master items
      await fetch(`/api/quotation-cases/${id}/bulk-approve`, {
        method: 'POST'
      });
      // 2. Create quote with approved items
      const res = await fetch(`/api/quotation-cases/${id}/create-quote`, {
        method: 'POST'
      });
      if (res.ok) {
        await fetchData();
        setActiveTab('quote');
      } else {
        const err = await res.json();
        alert(err.error || '견적서 생성 실패');
      }
    } catch (err: any) {
      alert('견적서 자동 산출 중 오류: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 5-3. Save Inline Unit Price Directly (원클릭 직접 단가 입력 & 즉시 자동 저장)
  const handleSaveInlinePrice = async (itemId: string, priceValue: string, autoAdvance: boolean = false) => {
    if (isSavingInlineRef.current) return;
    const cleanStr = String(priceValue || '').replace(/[^0-9]/g, '');
    if (cleanStr === '') {
      setInlineEditId(null);
      return;
    }
    const numPrice = Number(cleanStr);
    if (isNaN(numPrice) || numPrice < 0) {
      setInlineEditId(null);
      return;
    }

    // If unchanged and not advancing, just close
    const currentItem = data?.quoteItems?.find((q: any) => q.id === itemId);
    if (currentItem && currentItem.unit_price === numPrice && !autoAdvance) {
      setInlineEditId(null);
      return;
    }

    isSavingInlineRef.current = true;
    setSavingPriceId(itemId);

    // Auto-advance: find next unregistered item if user pressed Enter/Tab
    let nextUnregisteredId: string | null = null;
    if (autoAdvance && data?.quoteItems) {
      const currentIdx = data.quoteItems.findIndex((q: any) => q.id === itemId);
      if (currentIdx >= 0) {
        const nextItem = data.quoteItems.slice(currentIdx + 1).find((q: any) => !q.unit_price || q.unit_price <= 0);
        if (nextItem) {
          nextUnregisteredId = nextItem.id;
        }
      }
    }

    try {
      const res = await fetch(`/api/quote-items/${itemId}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitPrice: numPrice,
          remark: '직접 단가 입력',
          isIncluded: numPrice > 0
        })
      });
      const resJson = await res.json();
      if (res.ok && resJson.success) {
        // Optimistic UI Update (0ms instant response)
        setData((prev: any) => {
          if (!prev) return prev;
          const updatedItems = (prev.quoteItems || []).map((item: any) => {
            if (item.id === itemId) {
              return {
                ...item,
                unit_price: numPrice,
                amount: Math.round(item.quantity * numPrice),
                price_source: 'MANUAL_PRICE',
                price_status: 'READY',
                is_included: numPrice > 0 ? 1 : item.is_included
              };
            }
            return item;
          });
          return {
            ...prev,
            quoteItems: updatedItems,
            latestQuote: prev.latestQuote ? {
              ...prev.latestQuote,
              subtotal: resJson.subtotal,
              tax_amount: resJson.taxAmount,
              total_amount: resJson.totalAmount
            } : prev.latestQuote
          };
        });

        if (nextUnregisteredId) {
          setInlineEditId(nextUnregisteredId);
          setInlineEditValue('');
        } else {
          setInlineEditId(null);
          setInlineEditValue('');
        }

        fetchData();
      } else {
        alert(resJson.error || '단가 저장에 실패했습니다.');
      }
    } catch (err: any) {
      alert('통신 오류: ' + err.message);
    } finally {
      setSavingPriceId(null);
      setTimeout(() => {
        isSavingInlineRef.current = false;
      }, 150);
    }
  };

  // 6. Manual Price Handlers (방안 A: 수기 단가 추천 및 자동 누적 풀)
  const handleOpenManualPriceModal = async (item: any) => {
    setManualPriceModal(item);
    setManualPriceInput(item.unit_price > 0 ? Number(item.unit_price).toLocaleString() : '');
    setManualPriceReason(item.remark || '');
    setSelectedHistoryId(null);
    setApplyScope('SINGLE'); // Default to SINGLE (Safe mode: only this 1 item)
    setAutoIncludeInQuote(true);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/manual-prices?name=${encodeURIComponent(item.item_name)}`);
      if (res.ok) {
        const json = await res.json();
        const list = json.list || [];
        setManualPriceHistory(list);
        if (item.unit_price > 0) {
          const matched = list.find((h: any) => h.unit_price === item.unit_price);
          if (matched) setSelectedHistoryId(matched.id);
        }
      } else {
        setManualPriceHistory([]);
      }
    } catch {
      setManualPriceHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDirectApplyPrice = async (numPrice: number, reason: string) => {
    if (!manualPriceModal || actionLoading) return;
    if (isNaN(numPrice) || numPrice <= 0) return;

    const currentModal = manualPriceModal;
    const applyToSame = applyScope === 'ALL_SAME';
    const willInclude = autoIncludeInQuote && numPrice > 0;
    setActionLoading(true);

    // Close modal immediately for smooth response
    setManualPriceModal(null);
    setManualPriceInput('');
    setManualPriceReason('');
    setManualPriceHistory([]);
    setSelectedHistoryId(null);

    // Optimistic UI Update (0ms instant response)
    setData((prev: any) => {
      if (!prev || !prev.quoteItems) return prev;
      const updatedItems = prev.quoteItems.map((item: any) => {
        const isTarget = item.id === currentModal.id || (applyToSame && item.item_name === currentModal.item_name);
        if (isTarget) {
          const amt = Math.round(item.quantity * numPrice);
          return {
            ...item,
            unit_price: numPrice,
            amount: amt,
            price_source: 'MANUAL_PRICE',
            price_status: 'READY',
            is_included: willInclude ? 1 : (autoIncludeInQuote ? item.is_included : 0),
            remark: reason || 'Manual Price 적용'
          };
        }
        return item;
      });

      const activeSubtotal = updatedItems
        .filter((qi: any) => qi.is_included === 1)
        .reduce((sum: number, qi: any) => sum + (Number(qi.amount) || 0), 0);
      const taxRate = prev.quotes?.[0]?.tax_rate ?? 0.10;
      const taxAmount = Math.round(activeSubtotal * taxRate);
      const totalAmount = activeSubtotal + taxAmount;

      const updatedQuotes = (prev.quotes || []).map((q: any, idx: number) => {
        if (idx === 0) {
          return { ...q, subtotal: activeSubtotal, tax_amount: taxAmount, total_amount: totalAmount };
        }
        return q;
      });

      return {
        ...prev,
        quoteItems: updatedItems,
        quotes: updatedQuotes,
        latestQuote: prev.latestQuote ? {
          ...prev.latestQuote,
          subtotal: activeSubtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount
        } : prev.latestQuote
      };
    });

    try {
      const res = await fetch(`/api/quote-items/${currentModal.id}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitPrice: numPrice,
          remark: reason || 'Manual Price 적용',
          isIncluded: willInclude,
          applyToSameItems: applyToSame
        })
      });
      if (res.ok) {
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || '단가 적용에 실패했습니다.');
        await fetchData();
      }
    } catch (err: any) {
      alert(err.message);
      await fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveManualPrice = async () => {
    if (!manualPriceModal) return;
    const cleanStr = String(manualPriceInput || '').replace(/[^0-9]/g, '');
    if (cleanStr === '') {
      alert('적용할 단가 금액을 입력해 주세요.');
      return;
    }
    const numPrice = Number(cleanStr);
    await handleDirectApplyPrice(numPrice, manualPriceReason || 'Manual Price 적용');
  };

  // 7. Approve Quote & Lock (PROMPT 14)
  const handleApproveQuote = async (quoteId: string) => {
    if (!confirm('이 견적서를 최종 승인하고 수정을 잠그시겠습니까?')) return;
    try {
      const res = await fetch(`/api/quotes/${quoteId}/approve`, {
        method: 'POST'
      });
      if (res.ok) {
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || '승인 실패');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 8. Clone Quote Version (PROMPT 14)
  const handleCloneVersion = async (quoteId: string) => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}/clone-version`, {
        method: 'POST'
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 8-1. Toggle Quote Drawing Inclusion (도면별 견적 체크박스 실시간 연동)
  const handleToggleQuoteDrawing = async (drawingNos: string[], isIncluded: boolean) => {
    if (!latestQuote || latestQuote.is_locked) return;

    // Optimistic UI Update (0ms instant response)
    setData((prev: any) => {
      if (!prev || !prev.quoteItems) return prev;
      const noSet = new Set(drawingNos);
      const incVal = isIncluded ? 1 : 0;
      const updatedItems = prev.quoteItems.map((qi: any) => {
        if (noSet.has(qi.drawing_no) || noSet.has(qi.item_name)) {
          return { ...qi, is_included: incVal };
        }
        return qi;
      });

      const activeSubtotal = updatedItems
        .filter((qi: any) => qi.is_included === 1)
        .reduce((sum: number, qi: any) => sum + (Number(qi.amount) || 0), 0);
      const taxRate = prev.quotes?.[0]?.tax_rate ?? 0.10;
      const taxAmount = Math.round(activeSubtotal * taxRate);
      const totalAmount = activeSubtotal + taxAmount;

      const updatedQuotes = (prev.quotes || []).map((q: any, idx: number) => {
        if (idx === 0) {
          return { ...q, subtotal: activeSubtotal, tax_amount: taxAmount, total_amount: totalAmount };
        }
        return q;
      });

      return {
        ...prev,
        quoteItems: updatedItems,
        quotes: updatedQuotes,
        latestQuote: prev.latestQuote ? {
          ...prev.latestQuote,
          subtotal: activeSubtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount
        } : prev.latestQuote
      };
    });

    try {
      const res = await fetch(`/api/quotation-cases/${id}/toggle-quote-drawing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawingNos, isIncluded })
      });
      if (res.ok) {
        const resJson = await res.json();
        setData((prev: any) => {
          if (!prev || !prev.quotes) return prev;
          const updatedQuotes = prev.quotes.map((q: any, idx: number) => {
            if (idx === 0) {
              return {
                ...q,
                subtotal: resJson.subtotal,
                tax_amount: resJson.taxAmount,
                total_amount: resJson.totalAmount
              };
            }
            return q;
          });
          return {
            ...prev,
            quotes: updatedQuotes,
            latestQuote: prev.latestQuote ? {
              ...prev.latestQuote,
              subtotal: resJson.subtotal,
              tax_amount: resJson.taxAmount,
              total_amount: resJson.totalAmount
            } : prev.latestQuote
          };
        });
      }
    } catch (err) {
      console.error('Failed to sync toggle quote drawing:', err);
    }
  };

  // 8-2. Toggle All Quote Drawings Inclusion
  const handleToggleAllQuoteDrawings = async (isIncluded: boolean) => {
    setQuoteDropdownOpen(false);
    if (!latestQuote || latestQuote.is_locked) return;

    const incVal = isIncluded ? 1 : 0;
    setData((prev: any) => {
      if (!prev || !prev.quoteItems) return prev;
      const updatedItems = prev.quoteItems.map((qi: any) => ({ ...qi, is_included: incVal }));
      const activeSubtotal = isIncluded
        ? updatedItems.reduce((sum: number, qi: any) => sum + (Number(qi.amount) || 0), 0)
        : 0;
      const taxRate = prev.quotes?.[0]?.tax_rate ?? 0.10;
      const taxAmount = Math.round(activeSubtotal * taxRate);
      const totalAmount = activeSubtotal + taxAmount;

      const updatedQuotes = (prev.quotes || []).map((q: any, idx: number) => {
        if (idx === 0) {
          return { ...q, subtotal: activeSubtotal, tax_amount: taxAmount, total_amount: totalAmount };
        }
        return q;
      });

      return {
        ...prev,
        quoteItems: updatedItems,
        quotes: updatedQuotes,
        latestQuote: prev.latestQuote ? {
          ...prev.latestQuote,
          subtotal: activeSubtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount
        } : prev.latestQuote
      };
    });

    try {
      const res = await fetch(`/api/quotation-cases/${id}/toggle-quote-drawing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true, isIncluded })
      });
      if (res.ok) {
        const resJson = await res.json();
        setData((prev: any) => {
          if (!prev || !prev.quotes) return prev;
          const updatedQuotes = prev.quotes.map((q: any, idx: number) => {
            if (idx === 0) {
              return {
                ...q,
                subtotal: resJson.subtotal,
                tax_amount: resJson.taxAmount,
                total_amount: resJson.totalAmount
              };
            }
            return q;
          });
          return {
            ...prev,
            quotes: updatedQuotes,
            latestQuote: prev.latestQuote ? {
              ...prev.latestQuote,
              subtotal: resJson.subtotal,
              tax_amount: resJson.taxAmount,
              total_amount: resJson.totalAmount
            } : prev.latestQuote
          };
        });
      }
    } catch (err) {
      console.error('Failed to sync toggle all quote drawings:', err);
    }
  };

  // 8-3. Select Priced Items Only (단가 있는 품목만 선택)
  const handleSelectPricedOnly = async () => {
    setQuoteDropdownOpen(false);
    if (!latestQuote || latestQuote.is_locked) return;

    setData((prev: any) => {
      if (!prev || !prev.quoteItems) return prev;
      const updatedItems = prev.quoteItems.map((qi: any) => {
        const isPriced = Number(qi.unit_price) > 0;
        return { ...qi, is_included: isPriced ? 1 : 0 };
      });
      const activeSubtotal = updatedItems.reduce(
        (sum: number, qi: any) => (qi.is_included !== 0 ? sum + (Number(qi.amount) || 0) : sum),
        0
      );
      const taxRate = prev.quotes?.[0]?.tax_rate ?? 0.10;
      const taxAmount = Math.round(activeSubtotal * taxRate);
      const totalAmount = activeSubtotal + taxAmount;

      const updatedQuotes = (prev.quotes || []).map((q: any, idx: number) => {
        if (idx === 0) {
          return { ...q, subtotal: activeSubtotal, tax_amount: taxAmount, total_amount: totalAmount };
        }
        return q;
      });

      return {
        ...prev,
        quoteItems: updatedItems,
        quotes: updatedQuotes,
        latestQuote: prev.latestQuote ? {
          ...prev.latestQuote,
          subtotal: activeSubtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount
        } : prev.latestQuote
      };
    });

    try {
      const res = await fetch(`/api/quotation-cases/${id}/toggle-quote-drawing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricedOnly: true })
      });
      if (res.ok) {
        const resJson = await res.json();
        setData((prev: any) => {
          if (!prev || !prev.quotes) return prev;
          const updatedQuotes = prev.quotes.map((q: any, idx: number) => {
            if (idx === 0) {
              return {
                ...q,
                subtotal: resJson.subtotal,
                tax_amount: resJson.taxAmount,
                total_amount: resJson.totalAmount
              };
            }
            return q;
          });
          return {
            ...prev,
            quotes: updatedQuotes,
            latestQuote: prev.latestQuote ? {
              ...prev.latestQuote,
              subtotal: resJson.subtotal,
              tax_amount: resJson.taxAmount,
              total_amount: resJson.totalAmount
            } : prev.latestQuote
          };
        });
      }
    } catch (err) {
      console.error('Failed to sync select priced only:', err);
    }
  };

  // 9. Export to Excel (PROMPT 15)
  const handleExportExcel = async (quoteId: string, customOptions?: any) => {
    setActionLoading(true);
    setExportResult(null);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/export-excel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: customOptions ? JSON.stringify(customOptions) : undefined
      });
      const json = await res.json();
      if (res.ok) {
        setExportResult(json);
        await fetchData();
      } else {
        alert(json.error || '엑셀 출력 실패');
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-24 text-slate-500 font-medium">견적 워크벤치 로딩 중...</div>;
  }

  const qc = data?.case;
  const rawFiles = data?.files || [];
  const files = rawFiles.filter((f: any) => f.file_role !== 'VECTOR_SVG' && f.file_type !== 'SVG' && !f.original_file_name.endsWith('.svg'));
  const latestParseRun = data?.latestParseRun;
  const analyzedFileId = latestParseRun?.source_file_id || (files.length > 0 ? files[0]?.id : null);
  const drawings = data?.drawings || [];

  // Check if a file is analyzed directly or via its derived DXF
  const isFileAnalyzed = (file: any) => {
    if (!file || drawings.length === 0) return false;
    if (file.id === analyzedFileId) return true;
    if (file.derived_from_file_id && file.derived_from_file_id === analyzedFileId) return true;
    const derived = files.find((other: any) => other.derived_from_file_id === file.id);
    if (derived && derived.id === analyzedFileId) return true;
    if (latestParseRun && file.original_file_name) {
      const baseName = file.original_file_name.replace(/\.(dwg|dxf)$/i, '');
      const analyzedFile = files.find((f: any) => f.id === analyzedFileId);
      if (analyzedFile && analyzedFile.original_file_name.startsWith(baseName)) return true;
    }
    return false;
  };

  // Resolve currently active file (calculated inline without hook to adhere to Rules of Hooks)
  let activeFile = null;
  if (selectedFileId) {
    activeFile = files.find((f: any) => f.id === selectedFileId) || null;
  }
  if (!activeFile) {
    activeFile = files.find((f: any) => isFileAnalyzed(f) && (f.file_type === 'DXF' || f.id === analyzedFileId)) || files[0] || null;
  }

  const rawBomItems = data?.rawBomItems || [];
  const flattenedBomItems = data?.flattenedBomItems || [];
  const normalizedItems = data?.normalizedItems || [];
  const candidates = data?.candidates || [];
  const finalBomItems = data?.finalBomItems || [];
  const latestQuote = data?.latestQuote;
  const quoteItems = data?.quoteItems || [];

  // 💎 Filtered and Counted Normalized Items for Tab 2 (Calculated inline without hook to avoid early-return violation)
  const approvedItemIds = new Set(finalBomItems.map((f: any) => f.normalized_item_id));
  const pendingItemsCount = normalizedItems.filter((ni: any) => !approvedItemIds.has(ni.id)).length;
  const approvedItemsCount = normalizedItems.filter((ni: any) => approvedItemIds.has(ni.id)).length;

  const filteredNormalizedItems = normalizedItems.filter((ni: any) => {
    const isApproved = approvedItemIds.has(ni.id);
    if (approvalFilterTab === 'PENDING' && isApproved) return false;
    if (approvalFilterTab === 'APPROVED' && !isApproved) return false;
    if (approvalSearchText.trim()) {
      const query = approvalSearchText.trim().toLowerCase();
      const dwgNo = (ni.drawing_no || '').toLowerCase();
      const name = (ni.drawing_name || ni.normalized_name || '').toLowerCase();
      const rawName = (ni.raw_name || '').toLowerCase();
      const mat = (ni.drawing_material || ni.material_candidate || '').toLowerCase();
      const proj = (ni.project_name || '').toLowerCase();
      return dwgNo.includes(query) || name.includes(query) || rawName.includes(query) || mat.includes(query) || proj.includes(query);
    }
    return true;
  });

  // 💎 Live Real-Time Statistics for Quote Items (Calculated inline without hook to avoid early-return violation)
  let totalAllQty = 0;
  let totalIncludedQty = 0;
  let liveActiveSubtotal = 0;
  quoteItems.forEach((qi: any) => {
    const q = Number(qi.quantity) || 0;
    totalAllQty += q;
    if (qi.is_included !== 0) {
      totalIncludedQty += q;
      liveActiveSubtotal += Number(qi.amount) || 0;
    }
  });
  const totalQtyStats = { totalAll: totalAllQty, totalIncluded: totalIncludedQty };
  const liveTaxRate = latestQuote?.tax_rate ?? 0.10;
  const liveActiveTax = Math.round(liveActiveSubtotal * liveTaxRate);
  const liveActiveTotal = liveActiveSubtotal + liveActiveTax;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="no-print print:hidden bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-sm font-mono font-bold px-3 py-1 bg-slate-100 text-slate-800 rounded-lg">
              {qc.case_no}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                qc.quote_readiness === 'READY_FOR_QUOTE'
                  ? 'bg-emerald-100 text-emerald-800'
                  : qc.status === 'ANALYZED'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {qc.quote_readiness === 'READY_FOR_QUOTE'
                ? '견적 산출 준비완료 (READY_FOR_QUOTE)'
                : qc.status === 'ANALYZED'
                ? '도면/BOM 분석완료 (검토 필요)'
                : '도면 등록 대기'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-slate-900">{qc.case_name}</h1>
            {qc.visibility === 'SHARED' && <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700">사내 공유중</span>}
            {qc.visibility === 'PRIVATE_PENDING' && <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700">공개 불가 심사중</span>}
            {qc.visibility === 'PRIVATE' && <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">공개 불가(보안)</span>}
          </div>
          {qc.visibility === 'SHARED' && (user?.userId === qc.created_by_user_id || user?.role === 'SUPER_ADMIN') && (
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="mt-2 text-xs text-slate-500 hover:text-amber-600 underline text-left"
            >
              이 견적건 공개 불가 요청하기
            </button>
          )}
          {qc.visibility === 'PRIVATE_PENDING' && user?.role === 'SUPER_ADMIN' && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-bold text-amber-800 mb-1">비공개 요청 사유:</p>
              <p className="text-sm text-amber-900 mb-3">{qc.visibility_reason}</p>
              <div className="flex space-x-2">
                <button
                  onClick={async () => {
                    if(!confirm('비공개 요청을 승인하시겠습니까?')) return;
                    const res = await fetch(`/api/quotation-cases/${id}/visibility`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'APPROVE' })
                    });
                    if (res.ok) fetchData();
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded transition-colors"
                >
                  승인 (비공개)
                </button>
                <button
                  onClick={async () => {
                    if(!confirm('비공개 요청을 반려하시겠습니까?')) return;
                    const res = await fetch(`/api/quotation-cases/${id}/visibility`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'REJECT' })
                    });
                    if (res.ok) fetchData();
                  }}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded transition-colors"
                >
                  반려 (공유 유지)
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
            <span className="flex items-center space-x-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-700">{qc.company_name}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Folder className="w-3.5 h-3.5 text-slate-400" />
              <span>{qc.project_name}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>의뢰일: {qc.request_date}</span>
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="text-center px-3 border-r border-slate-200">
            <div className="text-xs text-slate-500 font-medium">도면 수</div>
            <div className="text-lg font-bold text-slate-900">{drawings.length}</div>
          </div>
          <div className="text-center px-3 border-r border-slate-200">
            <div className="text-xs text-slate-500 font-medium">추출 BOM</div>
            <div className="text-lg font-bold text-slate-900">{flattenedBomItems.length}</div>
          </div>
          <div className="text-center px-3">
            <div className="text-xs text-slate-500 font-medium">승인 품목</div>
            <div className="text-lg font-bold text-blue-600">
              {finalBomItems.filter((f: any) => f.approval_status === 'APPROVED').length} / {normalizedItems.length}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="no-print print:hidden flex items-center space-x-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('cad')}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'cad'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>1. 도면등록 & 뷰어</span>
        </button>

        <button
          onClick={() => setActiveTab('approval')}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'approval'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>2. 마스터 매칭 & 검수자 승인</span>
        </button>

        <button
          onClick={() => setActiveTab('quote')}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'quote'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>3. 견적서 산출 & 단가</span>
        </button>

        <button
          onClick={() => setActiveTab('excel')}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'excel'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>4. 표준 견적서 미리보기 (PDF/Excel)</span>
        </button>

        <button
          onClick={() => setActiveTab('structure')}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'structure'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>5. 도면구조 & 다단계 BOM</span>
        </button>
      </div>

      {/* TAB 1: CAD File Upload & Viewer (PROMPT 03, 04, 05, 06, 18-R1, 18-R2) */}
      <div className={activeTab === 'cad' ? "flex flex-col lg:flex-row gap-4 items-start w-full" : "hidden"}>
          {/* Unified Upload & Files Left Panel (Collapsible) */}
          {isSidebarOpen ? (
            <div className="w-full lg:w-[340px] xl:w-[360px] shrink-0 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in slide-in-from-left-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>통합 도면 파일 등록</span>
                </h2>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="도면 등록 패널 접기"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Unified Dropzone with Native Drag & Drop */}
              <div
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleProcessFile(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                  isDragging
                    ? 'border-blue-600 bg-blue-50 scale-[1.02] shadow-md ring-4 ring-blue-100'
                    : 'border-slate-200 hover:border-blue-500 bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  id="file-upload"
                  accept=".dwg,.dxf,.pdf,.xls,.xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2.5 transition-colors ${
                    isDragging ? 'bg-blue-600 text-white animate-bounce' : 'bg-blue-100 text-blue-600'
                  }`}>
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {isDragging ? '🚀 파일을 놓으면 즉시 분석 시작!' : 'DWG 또는 DXF 도면 드래그 & 드롭'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    (클릭하여 파일 선택 가능 / 지원: .dwg, .dxf)
                  </span>
                </label>
              </div>

              {(uploading || analyzing) && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl flex items-center space-x-2 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-blue-600" />
                  <div className="space-y-0.5">
                    <span className="font-bold block">
                      {uploading ? '도면 업로드 및 무결성 검증 중...' : 'DWG 자동변환 및 다단계 BOM 분석 중...'}
                    </span>
                    <span className="text-[11px] text-blue-600 block">
                      {uploading ? '서버 스토리지 저장 중' : 'LibreDWG 변환 → ezdxf 파싱 → 다단계 BOM 롤업'}
                    </span>
                  </div>
                </div>
              )}

              {/* Team Activity UI */}
              <TeamActivityAccordion />

              {/* Uploaded Files List */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    등록된 도면 파일 목록 ({files.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">클릭하여 선택</span>
                </div>
                {files.map((f: any) => {
                  const isSelected = (selectedFileId === f.id) || (!selectedFileId && f.id === activeFile?.id);
                  const isCurrentlyAnalyzed = isFileAnalyzed(f);
                  const isThisFileAnalyzing = analyzing && (analyzingFileId === f.id || (!analyzingFileId && isSelected));
                  const isDwg = f.file_type === 'DWG' || f.original_file_name.endsWith('.dwg');

                  return (
                    <div
                      key={f.id}
                      onClick={() => setSelectedFileId(f.id)}
                      className={`p-3 rounded-xl border text-xs space-y-2 cursor-pointer transition-all ${
                        isThisFileAnalyzing
                          ? 'bg-amber-50/90 border-amber-500 shadow-md ring-2 ring-amber-400/50 animate-pulse'
                          : isSelected
                          ? 'bg-blue-50/90 border-blue-500 shadow-sm ring-2 ring-blue-400/50'
                          : 'bg-slate-50 hover:bg-slate-100/90 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-900">
                        <div className="flex items-center space-x-2 truncate">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            isThisFileAnalyzing
                              ? 'bg-amber-500 animate-ping'
                              : isCurrentlyAnalyzed
                              ? 'bg-emerald-500 ring-2 ring-emerald-300'
                              : isSelected
                              ? 'bg-blue-600'
                              : 'bg-slate-300'
                          }`} />
                          <span className="truncate font-bold text-slate-900">{f.original_file_name}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                            isDwg ? 'bg-blue-600 text-white' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {isDwg ? '원본 DWG' : 'CAD DXF'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFile(f.id, f.original_file_name);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-100/70 transition-colors cursor-pointer"
                            title="도면 파일 삭제"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span className="font-mono">{(f.file_size / 1024).toFixed(1)} KB</span>
                        {isThisFileAnalyzing ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-700 font-bold flex items-center space-x-1">
                            <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                            <span>현재 분석 진행 중...</span>
                          </span>
                        ) : isCurrentlyAnalyzed ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 font-bold flex items-center space-x-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>분석 완료 ({drawings.length}개 도면)</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-600 font-medium">
                            업로드 완료 (대기)
                          </span>
                        )}
                      </div>

                      {/* File Action Toolbar on Selection */}
                      {isSelected && !analyzing && (
                        <div className="flex items-center justify-between pt-1.5 border-t border-blue-200/60">
                          <span className="text-[11px] text-blue-700 font-semibold">
                            {isCurrentlyAnalyzed ? '도면 뷰어 활성화됨' : '선택된 도면'}
                          </span>
                          {!isCurrentlyAnalyzed ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartAnalysis(f.id);
                              }}
                              disabled={analyzing}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50 cursor-pointer flex items-center space-x-1"
                            >
                              <Play className="w-3 h-3 fill-white" />
                              <span>이 도면으로 분석 실행</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center space-x-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>{drawings.length}개 도면 표시 중</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Single Action Button (PROMPT 18-R1) */}
              {files.length > 0 && (() => {
                const targetFile = files.find((f: any) => f.id === (selectedFileId || analyzedFileId)) || files[0];
                return (
                  <button
                    onClick={() => handleStartAnalysis(targetFile?.id)}
                    disabled={analyzing}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {analyzing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>[{targetFile?.original_file_name || '도면'}] 분석 진행 중 (약 6초)...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>[{targetFile?.original_file_name || '도면'}] 분석 시작 (CAD 자동 분석 실행)</span>
                      </>
                    )}
                  </button>
                );
              })()}
            </div>
          ) : (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="hidden lg:flex flex-col items-center justify-center p-3 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl text-slate-600 hover:text-blue-600 text-xs font-bold space-y-2 cursor-pointer transition-all shadow-xs shrink-0"
              title="도면 등록 패널 펼치기"
            >
              <ChevronRight className="w-4 h-4" />
              <span className="[writing-mode:vertical-lr] tracking-widest text-[11px] font-bold">도면 파일 패널 열기</span>
            </button>
          )}

          {/* 2D Real CAD Vector Viewer (Takes 100% of remaining width!) */}
          <div className="flex-1 w-full min-w-0">
            <CadViewer
              caseId={id}
              cadObjects={data?.cadObjects || []}
              drawings={drawings}
              relationships={data?.relationships || []}
              bomAreas={data?.bomAreas || []}
              rawBomItems={rawBomItems}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              externalFocusIdx={externalFocusIdx}
              onClearExternalFocus={() => setExternalFocusIdx(null)}
              quoteItems={quoteItems}
              latestQuote={latestQuote}
              onToggleQuoteItem={handleToggleQuoteDrawing}
              onToggleAllQuoteDrawings={handleToggleAllQuoteDrawings}
              selectedFile={activeFile}
              onStartAnalysis={handleStartAnalysis}
              isAnalyzing={analyzing}
              allFiles={files}
              onSelectFile={(fileId) => setSelectedFileId(fileId)}
            />
          </div>
      </div>

      {/* TAB 2: Quote Engine & Pricing Workspace (PROMPT 14) */}
      {activeTab === 'quote' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">견적서 작성 및 단가 산출 (Quote Engine)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                승인된 Final BOM 기준으로 Price Master 단가를 매칭하여 품목별 금액, 소계, 부가세(10%), 총 견적금액을 계산합니다.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCreateQuote}
                disabled={actionLoading}
                className="btn-hover-effect px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                title="현재 검수 승인된 전체 Final BOM 품목을 반영하여 최신 견적서를 재산출합니다."
              >
                <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
                <span>{latestQuote ? '최신 승인 BOM으로 견적서 재계산' : 'BOM 견적서 생성'}</span>
              </button>
              {latestQuote && (
                <button
                  onClick={() => handleCloneVersion(latestQuote.id)}
                  className="btn-hover-effect-secondary px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 cursor-pointer"
                >
                  새 버전 복제 (V{latestQuote.quote_version + 1})
                </button>
              )}
            </div>
          </div>

          {/* Mismatch Warning Alert Banner (If approved items count doesn't match quote items count) */}
          {finalBomItems.filter((f: any) => f.approval_status === 'APPROVED').length !== quoteItems.length && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-xs">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-xs text-amber-900">
                    최신 승인된 BOM 품목({finalBomItems.filter((f: any) => f.approval_status === 'APPROVED').length}개)이 현재 견적서({quoteItems.length}개)와 일치하지 않습니다.
                  </h4>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    도면 품목 승인 내역을 견적서에 반영하려면 아래 버튼을 클릭하여 견적서를 최신으로 동기화하세요.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCreateQuote}
                disabled={actionLoading}
                className="btn-hover-effect px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 shrink-0 cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                <span>최신 {finalBomItems.filter((f: any) => f.approval_status === 'APPROVED').length}개 품목으로 견적서 동기화 🔄</span>
              </button>
            </div>
          )}

          {latestQuote ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              {/* Quote Header Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 block">견적번호</span>
                  <span className="text-sm font-bold font-mono text-slate-900">{latestQuote.quote_no}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">견적상태</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {latestQuote.status} {latestQuote.is_locked ? '(잠금)' : ''}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">공급가액 (Subtotal)</span>
                  <span className="text-sm font-bold text-slate-900">₩{liveActiveSubtotal.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">총 견적금액 (VAT포함)</span>
                  <span className="text-base font-extrabold text-blue-600">₩{liveActiveTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Quote Items Table */}
              <div className="overflow-x-auto min-h-[260px]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 font-bold border-b-2 border-slate-200">
                      <th className="py-1.5 pl-3 pr-2 border-l-[3.5px] border-l-transparent">No</th>
                      <th className="py-1.5 px-2 text-center w-24 relative select-none">
                        <div ref={quoteDropdownRef} className="inline-block relative">
                          <button
                            type="button"
                            onClick={() => setQuoteDropdownOpen(!quoteDropdownOpen)}
                            disabled={latestQuote.is_locked}
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded border text-[11px] font-bold transition-all cursor-pointer ${
                              quoteDropdownOpen
                                ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs'
                            } disabled:opacity-50`}
                            title="견적 체크박스 전체선택 / 전체해제 풀다운 메뉴"
                          >
                            <span>견적</span>
                            <ChevronDown
                              className={`w-3 h-3 transition-transform duration-150 ${
                                quoteDropdownOpen ? 'rotate-180 text-white' : 'text-slate-500'
                              }`}
                            />
                          </button>

                          {/* Pull-down Menu Popover */}
                          {quoteDropdownOpen && (
                            <div className="absolute left-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-1.5 text-left text-xs animate-in fade-in zoom-in-95">
                              <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] text-slate-500 font-medium flex items-center justify-between">
                                <span>견적 포함 항목 제어</span>
                                <span className="font-bold font-mono text-blue-600">
                                  {quoteItems.filter((q: any) => q.is_included !== 0).length} / {quoteItems.length}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleAllQuoteDrawings(true)}
                                className="w-full px-3 py-2 text-left text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 cursor-pointer font-semibold transition-colors"
                              >
                                <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                                <div className="leading-tight">
                                  <div className="font-bold text-slate-800">전체 선택 (All)</div>
                                  <div className="text-[10px] text-slate-400 font-normal">모든 품목 견적서 포함</div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleAllQuoteDrawings(false)}
                                className="w-full px-3 py-2 text-left text-slate-700 hover:bg-rose-50 hover:text-rose-700 flex items-center space-x-2 cursor-pointer font-semibold transition-colors"
                              >
                                <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                <div className="leading-tight">
                                  <div className="font-bold text-slate-800">전체 해제 (Clear)</div>
                                  <div className="text-[10px] text-slate-400 font-normal">모든 품목 견적서 제외</div>
                                </div>
                              </button>

                              <div className="border-t border-slate-100 my-1"></div>

                              <button
                                type="button"
                                onClick={handleSelectPricedOnly}
                                className="w-full px-3 py-2 text-left text-slate-700 hover:bg-amber-50 hover:text-amber-800 flex items-center space-x-2 cursor-pointer font-semibold transition-colors"
                              >
                                <Coins className="w-4 h-4 text-amber-500 shrink-0" />
                                <div className="leading-tight">
                                  <div className="font-bold text-slate-800">단가 있는 품목만 선택</div>
                                  <div className="text-[10px] text-slate-400 font-normal">미단가(0원) 품목 제외</div>
                                </div>
                              </button>
                            </div>
                          )}
                        </div>
                      </th>
                      <th className="py-1.5 px-3">마스터 코드</th>
                      <th className="py-1.5 px-2 text-center w-24">도면 위치</th>
                      <th className="py-1.5 px-3">품명 (Standard Name)</th>
                      <th className="py-1.5 px-3">규격 / 재질</th>
                      <th className="py-1.5 px-3 text-right">
                        <div className="inline-flex items-center justify-end space-x-1.5 whitespace-nowrap">
                          <span>수량</span>
                          <span
                            className="text-[10.5px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200"
                            title={
                              totalQtyStats.totalIncluded !== totalQtyStats.totalAll
                                ? `견적 포함 수량: ${totalQtyStats.totalIncluded.toLocaleString()} EA / 전체 수량: ${totalQtyStats.totalAll.toLocaleString()} EA`
                                : `총 수량 합계: ${totalQtyStats.totalIncluded.toLocaleString()} EA`
                            }
                          >
                            (합계: {totalQtyStats.totalIncluded.toLocaleString()}
                            {totalQtyStats.totalIncluded !== totalQtyStats.totalAll && (
                              <span className="text-slate-400 font-normal text-[9.5px]">/{totalQtyStats.totalAll.toLocaleString()}</span>
                            )}{' '}
                            EA)
                          </span>
                        </div>
                      </th>
                      <th className="py-1.5 px-3 text-right">
                        <div className="inline-flex items-center justify-end space-x-1.5 whitespace-nowrap">
                          <span>단가 (원)</span>
                          <span
                            className="text-[10.5px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 inline-flex items-center space-x-0.5"
                            title="단가 셀을 클릭하여 직접 수정하거나 Manual Price로 변경할 수 있습니다"
                          >
                            <Pencil className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                            <span>(수정 가능)</span>
                          </span>
                        </div>
                      </th>
                      <th className="py-1.5 px-3 text-right">금액 (원)</th>
                      <th className="py-1.5 px-3 text-center">단가 출처</th>
                      <th className="py-1.5 px-3 text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60">
                    {quoteItems.map((qi: any, idx: number) => {
                      const isStripe = idx % 2 === 1;
                      const isExcluded = qi.is_included === 0;
                      return (
                        <tr
                          key={qi.id}
                          className={`dwell-row-hover ${
                            isExcluded
                              ? 'dwell-row-excluded opacity-40 bg-slate-100/60 text-slate-400'
                              : isStripe
                              ? 'bg-slate-100/80'
                              : 'bg-white'
                          }`}
                        >
                          <td className="dwell-indicator py-1.5 pl-3 pr-2 font-mono font-bold text-slate-500 border-l-[3.5px] border-l-transparent">
                            {qi.item_no}
                          </td>
                          <td className="py-1.5 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={!isExcluded}
                              disabled={latestQuote.is_locked}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                handleToggleQuoteDrawing([qi.drawing_no || qi.item_name], checked);
                              }}
                              className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                              title={!isExcluded ? '견적 포함 (클릭 시 견적 제외)' : '견적 제외됨 (클릭 시 견적 포함)'}
                            />
                          </td>
                          <td className={`py-1.5 px-3 font-semibold ${isExcluded ? 'text-slate-400' : 'text-slate-900'}`}>
                            {qi.master_code}
                          </td>
                          <td className="py-1 px-2 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigateToCadDrawing(qi);
                              }}
                              className="btn-hover-effect px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10.5px] font-bold inline-flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
                              title="1. 도면등록 & 뷰어 탭으로 이동하여 해당 도면/BOM 위치를 줌인합니다."
                            >
                              <Search className="w-3 h-3" />
                              <span>도면 보기</span>
                            </button>
                          </td>
                          <td className={`py-1.5 px-3 font-medium ${isExcluded ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {qi.item_name}
                          </td>
                          <td className="py-1.5 px-3 text-slate-600">
                            {qi.specification} / {qi.material}
                          </td>
                          <td className="py-1.5 px-3 font-bold text-slate-900 text-right">
                            {qi.quantity} {qi.unit}
                          </td>
                          <td
                            className={`py-1 px-3 font-mono text-right text-slate-800 transition-colors ${
                              !latestQuote.is_locked && inlineEditId !== qi.id
                                ? 'cursor-pointer hover:bg-blue-200/50'
                                : ''
                            }`}
                            onClick={() => {
                              if (!latestQuote.is_locked && inlineEditId !== qi.id) {
                                setInlineEditId(qi.id);
                                setInlineEditValue(qi.unit_price > 0 ? Number(qi.unit_price).toLocaleString() : '');
                              }
                            }}
                            title={!latestQuote.is_locked && inlineEditId !== qi.id ? '클릭하여 단가 바로 입력 (Enter/외부 클릭 시 자동 저장)' : undefined}
                          >
                            {!latestQuote.is_locked && inlineEditId === qi.id ? (
                              <div
                                className="inline-flex items-center justify-end w-full relative"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="text-blue-500 font-bold text-xs mr-1 select-none">₩</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  autoFocus
                                  onFocus={(e) => e.target.select()}
                                  value={inlineEditValue}
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/[^0-9]/g, '');
                                    setInlineEditValue(raw ? Number(raw).toLocaleString() : '');
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === 'Tab') {
                                      e.preventDefault();
                                      isCancelledRef.current = false;
                                      handleSaveInlinePrice(qi.id, inlineEditValue, true);
                                    } else if (e.key === 'Escape') {
                                      e.preventDefault();
                                      isCancelledRef.current = true;
                                      setInlineEditId(null);
                                    }
                                  }}
                                  onBlur={() => {
                                    if (isCancelledRef.current) {
                                      isCancelledRef.current = false;
                                      return;
                                    }
                                    if (!isSavingInlineRef.current) {
                                      handleSaveInlinePrice(qi.id, inlineEditValue, false);
                                    }
                                  }}
                                  placeholder="0"
                                  className="w-24 sm:w-28 px-2 py-0.5 bg-white border border-blue-500 rounded text-xs font-mono font-bold text-right text-slate-900 focus:outline-hidden ring-1 ring-blue-200"
                                />
                              </div>
                            ) : qi.unit_price > 0 ? (
                              <div
                                className="group/price inline-flex items-center justify-end space-x-1 font-mono font-bold text-slate-800 group-hover/price:text-blue-700 cursor-pointer"
                              >
                                <span>₩{qi.unit_price.toLocaleString()}</span>
                                {!latestQuote.is_locked && (
                                  <Pencil className="w-2.5 h-2.5 opacity-0 group-hover/price:opacity-100 text-blue-500 transition-opacity" />
                                )}
                              </div>
                            ) : (
                              <div
                                className="group/price inline-flex items-center justify-end space-x-1 font-mono font-semibold text-slate-400 group-hover/row:text-blue-600 cursor-pointer px-1.5 py-0.5 rounded-sm hover:bg-blue-100/80 transition-colors"
                              >
                                <span>0</span>
                                {!latestQuote.is_locked && (
                                  <Pencil className="w-2.5 h-2.5 opacity-0 group-hover/price:opacity-100 text-blue-400 transition-opacity" />
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-1.5 px-3 font-mono font-bold text-right text-slate-900 group-hover/row:text-blue-950 transition-colors">
                            {isExcluded ? (
                              <span className="text-slate-400 font-normal text-[11px]">₩0 (제외)</span>
                            ) : (
                              `₩${qi.amount.toLocaleString()}`
                            )}
                          </td>
                          <td className="py-1.5 px-3 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              qi.price_source === 'MANUAL_PRICE'
                                ? 'bg-blue-100 text-blue-800 font-semibold'
                                : 'bg-slate-200/70 text-slate-700'
                            }`}>
                              {qi.price_source}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-center">
                            {!latestQuote.is_locked && (
                              <button
                                onClick={() => handleOpenManualPriceModal(qi)}
                                className="px-2 py-0.5 bg-blue-50 group-hover/row:bg-blue-600 hover:bg-blue-700 text-blue-700 group-hover/row:text-white border border-blue-200 group-hover/row:border-blue-600 rounded text-[10px] font-bold transition-all cursor-pointer shadow-2xs inline-flex items-center space-x-1 shrink-0"
                                title="과거 수기 단가 이력 조회 및 Manual Price 적용"
                              >
                                <Database className="w-2.5 h-2.5 shrink-0" />
                                <span>Manual Price 적용</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {quoteItems.length > 0 && (
                    <tfoot className="bg-slate-50/95 border-t-2 border-slate-300 font-bold text-slate-800">
                      <tr>
                        <td colSpan={6} className="py-2 px-3 text-right font-sans text-slate-600">
                          견적 포함 수량 합계:
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-blue-700 font-bold whitespace-nowrap">
                          {totalQtyStats.totalIncluded.toLocaleString()} EA
                          {totalQtyStats.totalIncluded !== totalQtyStats.totalAll && (
                            <span className="block text-[10px] text-slate-400 font-normal">
                              전체 {totalQtyStats.totalAll.toLocaleString()} EA
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-400 font-sans text-[11px]">-</td>
                        <td className="py-2 px-3 text-right font-mono text-blue-700 font-bold whitespace-nowrap">
                          ₩{liveActiveSubtotal.toLocaleString()}
                        </td>
                        <td colSpan={2} className="py-2 px-3 text-center text-slate-400 text-[10px] font-sans">
                          공급가액 기준
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <div className="flex items-center space-x-2.5">
                  {!latestQuote.is_locked ? (
                    <button
                      onClick={() => handleApproveQuote(latestQuote.id)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-2 cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>최종 견적 승인 및 잠금 (Lock)</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-emerald-700 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>최종 승인 완료 (수정 잠금 상태)</span>
                    </div>
                  )}

                  <button
                    onClick={() => setActiveTab('structure')}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors"
                    title="상세 도면 구조 및 다단계 BOM 트리 확인"
                  >
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>4. 도면구조 & BOM 상세</span>
                  </button>
                </div>

                <button
                  onClick={() => setActiveTab('excel')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
                >
                  <span>다음: 3. 표준견적서 미리보기 & 출력</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-600 shadow-xs">
                <Database className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="text-slate-900 font-bold text-base">견적서 산출 준비</h4>
                <p className="text-slate-500 text-xs mt-1">
                  도면 분석 결과 추출된 {normalizedItems.length}개 BOM 품목에 대해 단가 마스터를 매칭하여 총 견적 금액을 즉시 계산합니다.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleAutoApproveAndCreateQuote}
                  disabled={actionLoading}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>🚀 AI 1순위 추천 일괄 승인 & 견적서 즉시 산출</span>
                </button>
                <button
                  onClick={() => setActiveTab('approval')}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>2. 마스터 매칭 직접 검토로 이동</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Standard Quotation Preview & PDF / Excel Export */}
      {activeTab === 'excel' && (
        <QuotationDocumentPreview
          quote={latestQuote}
          quoteItems={quoteItems}
          caseData={data}
          onExportExcel={handleExportExcel}
          exportResult={exportResult}
          actionLoading={actionLoading}
        />
      )}

      {/* TAB 4: Structure Map & Multi-Level BOM (PROMPT 07, 08, 09, 10) */}
      {activeTab === 'structure' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Drawing Structure Tree */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>도면 구조 계층 (총 {drawings.length}개 도면)</span>
                </h3>
                <span className="text-[11px] font-medium text-slate-400">
                  메인 {drawings.filter((d: any) => d.drawing_type === 'MAIN_ASSEMBLY').length}개 · 서브 {drawings.filter((d: any) => d.drawing_type !== 'MAIN_ASSEMBLY').length}개
                </span>
              </div>

              <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                {/* Main Assembly Group */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center space-x-1.5 px-1">
                    <Folder className="w-3.5 h-3.5 text-blue-600" />
                    <span>메인 조립도 (Main Assembly)</span>
                  </div>
                  {drawings.filter((d: any) => d.drawing_type === 'MAIN_ASSEMBLY').map((d: any) => (
                    <div
                      key={d.id}
                      onClick={() => handleNavigateToCadDrawing(d)}
                      className="p-3 bg-blue-50/60 hover:bg-blue-100/70 rounded-xl border border-blue-200/80 hover:border-blue-500 text-xs space-y-1.5 cursor-pointer group hover:shadow-md hover:scale-[1.01] transition-all shadow-2xs"
                      title="클릭 시 CAD 뷰어로 이동하여 이 도면을 화면에 꽉 차게 봅니다"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span className="font-mono text-blue-700 group-hover:text-blue-950 transition-colors">{d.drawing_no_raw}</span>
                        <div className="flex items-center space-x-1">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-600 group-hover:bg-blue-700 text-white font-semibold flex items-center space-x-1 shadow-2xs transition-colors">
                            <Search className="w-2.5 h-2.5" />
                            <span>도면 보기</span>
                          </span>
                        </div>
                      </div>
                      <div className="text-slate-800 font-bold text-xs group-hover:text-blue-900 transition-colors">{d.drawing_name_raw}</div>
                      <div className="text-[11px] text-slate-500 pt-1 border-t border-blue-100 flex items-center justify-between">
                        <span>프로젝트: {d.project_name || '인버터 조립 LINE'}</span>
                        <span className="flex items-center space-x-0.5 text-blue-600 font-medium">
                          <span>설계: {d.designer || '이경중'} | {d.scale || '1/5'}</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sub Part Group */}
                {drawings.filter((d: any) => d.drawing_type !== 'MAIN_ASSEMBLY').length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-purple-900 uppercase tracking-wider flex items-center space-x-1.5 px-1">
                      <FileText className="w-3.5 h-3.5 text-purple-600" />
                      <span>단위 부품도 / 서브도면 (Sub-Part Drawings)</span>
                    </div>
                    {drawings.filter((d: any) => d.drawing_type !== 'MAIN_ASSEMBLY').map((d: any) => (
                      <div
                        key={d.id}
                        onClick={() => handleNavigateToCadDrawing(d)}
                        className="p-2.5 bg-slate-50 hover:bg-purple-50/70 rounded-xl border border-slate-200 hover:border-purple-400 text-xs space-y-1.5 cursor-pointer group hover:shadow-md hover:scale-[1.01] transition-all shadow-2xs"
                        title="클릭 시 CAD 뷰어로 이동하여 이 도면을 화면에 꽉 차게 봅니다"
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-900">
                          <span className="font-mono text-slate-700 group-hover:text-purple-900 transition-colors">{d.drawing_no_raw}</span>
                          <div className="flex items-center space-x-1">
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 group-hover:bg-purple-600 group-hover:text-white text-purple-800 font-medium flex items-center space-x-1 border border-purple-200 group-hover:border-purple-600 transition-all">
                              <Search className="w-2.5 h-2.5" />
                              <span>도면 보기</span>
                            </span>
                          </div>
                        </div>
                        <div className="text-slate-700 font-medium group-hover:text-purple-950 transition-colors">{d.drawing_name_raw}</div>
                        <div className="text-[10.5px] text-slate-400 flex items-center justify-between pt-0.5">
                          <span>재질: {d.material || 'SS400/S45C'} · Rev: {d.revision || 'R00'}</span>
                          <span className="flex items-center space-x-0.5 text-purple-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Flattened BOM & Multi-Level Rollup Table */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span>다단계 BOM 롤업 및 Flattened BOM ({flattenedBomItems.length} 품목)</span>
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  수량 전파 공식: Qty(Effective) = Qty(Root) × Qty(Sub) × Qty(Part)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">도면 품번</th>
                      <th className="py-2.5 px-3">품명 (Raw Name)</th>
                      <th className="py-2.5 px-3">규격</th>
                      <th className="py-2.5 px-3">재질</th>
                      <th className="py-2.5 px-3 text-right">총 소요수량</th>
                      <th className="py-2.5 px-3 text-center">단위</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {flattenedBomItems.map((it: any, idx: number) => {
                      const matchedDwg = drawings.find((d: any) =>
                        (it.part_no && it.part_no !== '-' && d.drawing_no_raw && (d.drawing_no_raw === it.part_no || d.drawing_no_raw.includes(it.part_no))) ||
                        (it.name && d.drawing_name_raw && it.name === d.drawing_name_raw)
                      );
                      return (
                        <tr key={it.id} className="hover:bg-slate-50/80 group">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            <div className="flex items-center justify-between space-x-1">
                              <span className="font-mono">{it.part_no || '-'}</span>
                              {matchedDwg && (
                                <button
                                  onClick={() => handleNavigateToCadDrawing(matchedDwg)}
                                  className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white border border-blue-200 group-hover:border-blue-600 font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-2xs shrink-0"
                                  title={`[${matchedDwg.drawing_no_raw}] CAD 도면으로 이동하여 전체 화면 보기`}
                                >
                                  <Search className="w-2.5 h-2.5" />
                                  <span>도면 보기</span>
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">{it.name}</td>
                          <td className="py-2.5 px-3 text-slate-600">{it.specification || '-'}</td>
                          <td className="py-2.5 px-3 text-slate-600">{it.material || '-'}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 text-right">{it.total_quantity}</td>
                          <td className="py-2.5 px-3 text-center text-slate-500">{it.unit}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setActiveTab('quote')}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>3. 견적서 산출로 이동</span>
                </button>

                <button
                  onClick={() => setActiveTab('approval')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>2. 마스터 매칭 및 검수자 승인으로 이동</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Master Matching & Reviewer Approval (PROMPT 11, 12, 13) */}
      {activeTab === 'approval' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-extrabold font-mono">
                  STEP 2
                </span>
                <h3 className="font-bold text-slate-900 text-base">마스터 매칭 & 검수자 승인 워크벤치</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                도면에서 추출된 BOM 부품을 검토하여 사내 마스터 매칭 또는 신규 가공품으로 확정 승인 후 3단계 견적서로 전달합니다.
              </p>
            </div>

            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              <button
                onClick={() => handleBulkApprove(true)}
                disabled={actionLoading}
                className="btn-hover-effect px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-2 transition-colors cursor-pointer disabled:opacity-50"
                title="AI 마스터 추천 품목과 미매칭 주문가공품을 포함하여 전체 도면 품목을 일괄 승인합니다."
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>도면 품목 전수 일괄 승인 ({normalizedItems.length}개 전체)</span>
              </button>
              <button
                onClick={() => handleBulkApprove(false)}
                disabled={actionLoading}
                className="btn-hover-effect-secondary px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="AI 1순위 추천 마스터와 매칭된 품목만 승인합니다."
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>AI 추천만 승인</span>
              </button>
              {approvedItemsCount > 0 && (
                <button
                  type="button"
                  onClick={() => handleBulkUnapprove()}
                  disabled={actionLoading}
                  className="btn-hover-effect-secondary px-3.5 py-2.5 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 rounded-xl text-xs font-bold border border-rose-300 shadow-2xs flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="현재 승인 완료된 모든 품목을 검토 대기 상태로 일괄 초기화합니다."
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>승인 일괄 해제 ({approvedItemsCount}건) ↺</span>
                </button>
              )}
              <button
                onClick={handleCreateQuote}
                disabled={actionLoading}
                className="btn-hover-effect px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>승인 반영 ➡️ 3. 견적서 산출로 이동</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Normalized Items List (1-Row Excel Sheet Mode / Card Mode) */}
            <div className="lg:col-span-7 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3.5 flex flex-col">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                      <span>정규화 도면 BOM 목록</span>
                    </h4>
                    <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      {filteredNormalizedItems.length} / {normalizedItems.length}건
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    1행 고밀도 시트 뷰 • 가로 스크롤로 표제란 스펙 확인
                  </p>
                </div>

                {/* View Mode Switcher (Sheet vs Card) */}
                <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setApprovalViewMode('TABLE')}
                    className={`px-2.5 py-1 rounded text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer ${
                      approvalViewMode === 'TABLE'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="1행 고밀도 엑셀 시트 모드"
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>시트형</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalViewMode('CARD')}
                    className={`px-2.5 py-1 rounded text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer ${
                      approvalViewMode === 'CARD'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="상세 카드 모드"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>카드형</span>
                  </button>
                </div>
              </div>

              {/* Filter Tabs and Search Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                {/* Segmented Status Tabs */}
                <div className="flex items-center space-x-1 bg-slate-100/80 p-0.5 rounded-xl border border-slate-200 text-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setApprovalFilterTab('ALL')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      approvalFilterTab === 'ALL'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    전체 <span className="text-[10px] opacity-75">({normalizedItems.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalFilterTab('PENDING')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                      approvalFilterTab === 'PENDING'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-amber-700 hover:bg-amber-100/60'
                    }`}
                  >
                    <span>검토필요</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      approvalFilterTab === 'PENDING' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {pendingItemsCount}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalFilterTab('APPROVED')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                      approvalFilterTab === 'APPROVED'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-emerald-700 hover:bg-emerald-100/60'
                    }`}
                  >
                    <span>승인완료</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      approvalFilterTab === 'APPROVED' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {approvedItemsCount}
                    </span>
                  </button>
                </div>

                {/* Search Box */}
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="도면번호, 품명, 재질 검색..."
                    value={approvalSearchText}
                    onChange={(e) => setApprovalSearchText(e.target.value)}
                    className="w-full pl-8 pr-7 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all"
                  />
                  {approvalSearchText && (
                    <button
                      onClick={() => setApprovalSearchText('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Multi-Selection Batch Action Toolbar */}
              {selectedApprovalIds.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-blue-900 shadow-xs animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                    <span className="font-extrabold">선택 품목: {selectedApprovalIds.length}개</span>
                    <span className="text-slate-500 text-[11px]">
                      (승인완료: {selectedApprovalIds.filter(id => finalBomItems.some((f: any) => f.normalized_item_id === id)).length}건 / 미승인: {selectedApprovalIds.filter(id => !finalBomItems.some((f: any) => f.normalized_item_id === id)).length}건)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleBulkApproveSelected(selectedApprovalIds)}
                      disabled={actionLoading}
                      className="btn-hover-effect px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-2xs flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>선택 {selectedApprovalIds.length}개 일괄 승인</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkUnapprove(selectedApprovalIds)}
                      disabled={actionLoading}
                      className="btn-hover-effect-secondary px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-300 rounded-lg font-bold text-xs shadow-2xs flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                      <span>선택 승인 해제 ↺</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedApprovalIds([])}
                      className="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                    >
                      선택 해제
                    </button>
                  </div>
                </div>
              )}

              {/* View Mode 1: High-Density 1-Row Excel Sheet View */}
              {approvalViewMode === 'TABLE' ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white flex flex-col">
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full text-left border-collapse min-w-[980px] text-xs">
                      <thead className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur shadow-[0_1px_2px_rgba(0,0,0,0.06)] text-slate-700 text-[11px] font-bold border-b border-slate-200">
                        <tr>
                          <th className="w-8 min-w-[34px] max-w-[34px] px-1.5 py-2 text-center sticky left-0 z-30 bg-slate-100 border-r border-slate-200">
                            <input
                              type="checkbox"
                              checked={filteredNormalizedItems.length > 0 && filteredNormalizedItems.every((n: any) => selectedApprovalIds.includes(n.id))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const allIds = Array.from(new Set([...selectedApprovalIds, ...filteredNormalizedItems.map((n: any) => n.id)]));
                                  setSelectedApprovalIds(allIds);
                                } else {
                                  const filteredSet = new Set(filteredNormalizedItems.map((n: any) => n.id));
                                  setSelectedApprovalIds(selectedApprovalIds.filter((id) => !filteredSet.has(id)));
                                }
                              }}
                              className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                              title="전체 선택 / 전체 해제"
                            />
                          </th>
                          <th className="w-9 min-w-[38px] max-w-[38px] px-1.5 py-2 text-center sticky left-[34px] z-30 bg-slate-100 border-r border-slate-200">
                            No.
                          </th>
                          <th className="min-w-[135px] max-w-[160px] px-2.5 py-2 sticky left-[72px] z-30 bg-slate-100 border-r border-slate-200">
                            도면번호 (DWG NO.)
                          </th>
                          <th className="min-w-[150px] px-2.5 py-2">
                            도면 품명 / 정규화명
                          </th>
                          <th className="w-24 min-w-[90px] px-2 py-2 text-center">
                            검수 상태
                          </th>
                          <th className="w-16 min-w-[65px] px-2 py-2 text-right">
                            수량
                          </th>
                          <th className="w-20 min-w-[80px] px-2 py-2">
                            재질
                          </th>
                          <th className="w-14 min-w-[55px] px-1.5 py-2 text-center">
                            척도
                          </th>
                          <th className="w-12 min-w-[50px] px-1.5 py-2 text-center">
                            Rev
                          </th>
                          <th className="min-w-[130px] px-2.5 py-2">
                            프로젝트명
                          </th>
                          <th className="min-w-[150px] px-2.5 py-2">
                            승인 매칭 마스터
                          </th>
                          <th className="w-24 min-w-[96px] px-2 py-2 text-center sticky right-0 z-30 bg-slate-100 border-l border-slate-200">
                            도면 위치
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredNormalizedItems.length === 0 ? (
                          <tr>
                            <td colSpan={12} className="py-14 text-center text-slate-400">
                              <p className="font-semibold text-xs">일치하는 품목이 없습니다.</p>
                              {approvalSearchText && (
                                <button
                                  type="button"
                                  onClick={() => setApprovalSearchText('')}
                                  className="mt-2 text-[11px] text-blue-600 hover:underline font-bold cursor-pointer"
                                >
                                  검색어 초기화
                                </button>
                              )}
                            </td>
                          </tr>
                        ) : (
                          filteredNormalizedItems.map((ni: any, index: number) => {
                            const finalItem = finalBomItems.find((f: any) => f.normalized_item_id === ni.id);
                            const isSelected = selectedNormItem?.id === ni.id;

                            return (
                              <tr
                                key={ni.id}
                                onClick={() => setSelectedNormItem(ni)}
                                className={`group h-9 transition-colors cursor-pointer text-xs ${
                                  isSelected
                                    ? 'bg-blue-100/75 text-blue-950 font-medium ring-1 ring-inset ring-blue-300'
                                    : 'bg-white hover:bg-slate-50/80 text-slate-700'
                                }`}
                              >
                                {/* Checkbox Column (Frozen Column 1) */}
                                <td
                                  className={`px-1.5 py-1 text-center sticky left-0 z-10 border-r border-slate-200/80 ${
                                    isSelected ? 'bg-blue-100' : 'bg-white group-hover:bg-slate-50'
                                  }`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedApprovalIds.includes(ni.id)}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      if (checked) {
                                        setSelectedApprovalIds((prev) => [...prev, ni.id]);
                                      } else {
                                        setSelectedApprovalIds((prev) => prev.filter((id) => id !== ni.id));
                                      }
                                    }}
                                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  />
                                </td>

                                {/* No. (Frozen Column 2) */}
                                <td
                                  className={`px-1.5 py-1 text-center font-mono text-[11px] sticky left-[34px] z-10 border-r border-slate-200/80 ${
                                    isSelected ? 'bg-blue-100 text-blue-900 font-bold' : 'bg-white group-hover:bg-slate-50 text-slate-500'
                                  }`}
                                >
                                  {index + 1}
                                </td>

                                {/* DWG NO. (Frozen Column 3) */}
                                <td
                                  className={`px-2.5 py-1 font-mono font-bold text-[11px] sticky left-[72px] z-10 border-r border-slate-200/80 truncate max-w-[160px] ${
                                    isSelected ? 'bg-blue-100 text-blue-900' : 'bg-white group-hover:bg-slate-50 text-blue-700'
                                  }`}
                                  title={ni.drawing_no || '도면번호 미지정'}
                                >
                                  {ni.drawing_no || '도면번호 미지정'}
                                </td>

                                {/* Drawing / Normalized Name */}
                                <td className="px-2.5 py-1 truncate max-w-[180px]" title={ni.drawing_name || ni.normalized_name}>
                                  <span className={`font-semibold ${isSelected ? 'text-blue-950' : 'text-slate-900'}`}>
                                    {ni.drawing_name || ni.normalized_name}
                                  </span>
                                </td>

                                {/* Status Badge & Hover Unapprove Action */}
                                <td className="px-2 py-1 text-center whitespace-nowrap">
                                  {finalItem ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUnapproveItem(ni.id, ni.drawing_name || ni.normalized_name);
                                      }}
                                      className="group/btn inline-flex items-center space-x-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 hover:bg-rose-100 text-emerald-800 hover:text-rose-700 border border-emerald-200 hover:border-rose-300 transition-all cursor-pointer shadow-2xs"
                                      title="승인완료 상태입니다. 클릭 시 승인을 취소하고 '검토필요' 상태로 되돌립니다."
                                    >
                                      <Check className="w-2.5 h-2.5 text-emerald-600 group-hover/btn:hidden shrink-0" />
                                      <RotateCcw className="w-2.5 h-2.5 text-rose-600 hidden group-hover/btn:inline shrink-0" />
                                      <span className="group-hover/btn:hidden">승인완료</span>
                                      <span className="hidden group-hover/btn:inline font-bold">승인 취소 ↺</span>
                                    </button>
                                  ) : (
                                    <span className="inline-block px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800 border border-amber-200">
                                      검토필요
                                    </span>
                                  )}
                                </td>

                                {/* Quantity */}
                                <td className="px-2 py-1 text-right font-extrabold whitespace-nowrap">
                                  <span className={isSelected ? 'text-blue-900' : 'text-slate-900'}>
                                    {ni.quantity}
                                  </span>{' '}
                                  <span className="text-[10px] text-slate-500 font-normal">{ni.unit || 'EA'}</span>
                                </td>

                                {/* Material */}
                                <td className="px-2 py-1 truncate max-w-[100px] text-slate-600 text-[11px]" title={ni.drawing_material || ni.material_candidate}>
                                  {ni.drawing_material || ni.material_candidate || 'SS400'}
                                </td>

                                {/* Scale */}
                                <td className="px-1.5 py-1 text-center text-slate-500 text-[11px] font-mono">
                                  {ni.drawing_scale || '-'}
                                </td>

                                {/* Revision */}
                                <td className="px-1.5 py-1 text-center font-mono text-[11px] font-bold text-slate-600">
                                  {ni.drawing_revision || 'R00'}
                                </td>

                                {/* Project Name */}
                                <td className="px-2.5 py-1 truncate max-w-[150px] text-slate-600 text-[11px]" title={ni.project_name || data?.case?.project_name}>
                                  {ni.project_name || data?.case?.project_name || '-'}
                                </td>

                                {/* Approved Master Matching */}
                                <td className="px-2.5 py-1 truncate max-w-[160px] text-[11px]">
                                  {finalItem ? (
                                    <span className="text-emerald-700 font-semibold flex items-center space-x-1" title={`[${finalItem.final_master_code}] ${finalItem.final_name}`}>
                                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                      <span className="truncate">[{finalItem.final_master_code}] {finalItem.final_name}</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic">미매칭 (검토 대기)</span>
                                  )}
                                </td>

                                {/* CAD Drawing Zoom In Action (Frozen Right Column) */}
                                <td
                                  className={`px-2 py-1 text-center sticky right-0 z-10 border-l border-slate-200/80 whitespace-nowrap ${
                                    isSelected ? 'bg-blue-100' : 'bg-white group-hover:bg-slate-50'
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedNormItem(ni);
                                      handleNavigateToCadDrawing(ni);
                                    }}
                                    className="btn-hover-effect px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10.5px] font-bold inline-flex items-center space-x-1 transition-all cursor-pointer shadow-xs"
                                    title="1. 도면등록 & 뷰어 탭으로 이동하여 해당 도면/BOM 위치를 줌인합니다."
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>줌인 ↗</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-slate-50 px-3 py-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-1 text-[10.5px] text-slate-500">
                    <span>💡 행 클릭 시 우측 상세 검토 패널이 열리며, 가로 스크롤로 표제란 전체 스펙을 확인할 수 있습니다.</span>
                    <span className="font-mono font-medium">총 {filteredNormalizedItems.length}개 표시 중</span>
                  </div>
                </div>
              ) : (
                /* View Mode 2: Card View Fallback */
                <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                  {filteredNormalizedItems.length === 0 ? (
                    <div className="py-14 text-center text-slate-400">
                      <p className="font-semibold text-xs">일치하는 품목이 없습니다.</p>
                      {approvalSearchText && (
                        <button
                          type="button"
                          onClick={() => setApprovalSearchText('')}
                          className="mt-2 text-[11px] text-blue-600 hover:underline font-bold cursor-pointer"
                        >
                          검색어 초기화
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredNormalizedItems.map((ni: any) => {
                      const finalItem = finalBomItems.find((f: any) => f.normalized_item_id === ni.id);
                      const isSelected = selectedNormItem?.id === ni.id;

                      return (
                        <div
                          key={ni.id}
                          onClick={() => setSelectedNormItem(ni)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer text-xs space-y-2 relative group ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-2 ring-blue-400/30'
                              : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/60 bg-white'
                          }`}
                        >
                          {/* Top Header: Drawing No Badge + Item Name + Status Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center space-x-1.5 flex-wrap">
                                <span className="font-mono font-extrabold text-[11px] text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded border border-blue-200 shrink-0">
                                  {ni.drawing_no || '도면번호 미지정'}
                                </span>
                                <h4 className="font-extrabold text-slate-900 text-xs truncate">
                                  {ni.drawing_name || ni.normalized_name}
                                </h4>
                              </div>
                            </div>

                            {finalItem ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnapproveItem(ni.id, ni.drawing_name || ni.normalized_name);
                                }}
                                className="group/btn px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 hover:bg-rose-100 text-emerald-800 hover:text-rose-700 border border-emerald-200 hover:border-rose-300 transition-all cursor-pointer shadow-2xs shrink-0 flex items-center space-x-1"
                                title="승인완료 상태입니다. 클릭 시 승인을 취소하고 '검토필요' 상태로 되돌립니다."
                              >
                                <Check className="w-2.5 h-2.5 text-emerald-600 group-hover/btn:hidden shrink-0" />
                                <RotateCcw className="w-2.5 h-2.5 text-rose-600 hidden group-hover/btn:inline shrink-0" />
                                <span className="group-hover/btn:hidden">승인완료</span>
                                <span className="hidden group-hover/btn:inline font-bold">승인 취소 ↺</span>
                              </button>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                                검토필요
                              </span>
                            )}
                          </div>

                          {/* Project Name from Drawing Title Block */}
                          <div className="flex items-center space-x-1 text-[11px] text-slate-600 truncate bg-slate-50 px-2 py-1 rounded border border-slate-100">
                            <Folder className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="text-slate-400 font-medium shrink-0">프로젝트:</span>
                            <span className="font-semibold text-slate-700 truncate">
                              {ni.project_name || data?.case?.project_name || '기본 프로젝트'}
                            </span>
                          </div>

                          {/* Title Block Specs Grid (Rev, Material, Scale, Qty) */}
                          <div className="grid grid-cols-4 gap-1 text-[10.5px] bg-slate-50/60 p-1.5 rounded border border-slate-100 text-slate-600">
                            <div className="truncate">
                              <span className="text-slate-400">Rev:</span> <strong className="text-slate-700 font-semibold">{ni.drawing_revision || 'R00'}</strong>
                            </div>
                            <div className="truncate">
                              <span className="text-slate-400">재질:</span> <strong className="text-slate-700 font-semibold">{ni.drawing_material || ni.material_candidate || 'SS400'}</strong>
                            </div>
                            <div className="truncate">
                              <span className="text-slate-400">척도:</span> <strong className="text-slate-700 font-semibold">{ni.drawing_scale || '-'}</strong>
                            </div>
                            <div className="text-right truncate">
                              <span className="text-slate-400">수량:</span> <strong className="text-blue-700 font-extrabold">{ni.quantity} {ni.unit || 'EA'}</strong>
                            </div>
                          </div>

                          {/* Bottom: Raw Text and Action Button to Navigate to CAD Drawing Location */}
                          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2">
                            <div className="text-slate-400 text-[10.5px] truncate">
                              Raw: <span className="font-mono text-slate-600">{ni.raw_name}</span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedNormItem(ni);
                                handleNavigateToCadDrawing(ni);
                              }}
                              className="btn-hover-effect px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-xs shrink-0"
                              title="클릭 시 1. 도면등록 & 뷰어 탭으로 이동하여 해당 도면/BOM 위치로 화면을 맞춥니다."
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>도면 위치 줌인 ↗</span>
                            </button>
                          </div>

                          {finalItem && (
                            <div className="text-[11px] text-emerald-700 font-semibold pt-1 border-t border-emerald-100 flex items-center space-x-1">
                              <Check className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">승인 마스터: [{finalItem.final_master_code}] {finalItem.final_name}</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Selected Item & Top 3 Recommendations */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              {selectedNormItem ? (
                <>
                  <div className="border-b border-slate-100 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        선택 품목 검토
                      </div>
                      <button
                        onClick={() => handleNavigateToCadDrawing(selectedNormItem)}
                        className="btn-hover-effect px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer group"
                        title="CAD 뷰어로 이동하여 이 품목이 그려진 도면과 표제란 위치를 줌인합니다."
                      >
                        <ExternalLink className="w-3.5 h-3.5 group-hover:scale-115 transition-transform" />
                        <span>CAD 도면 위치 줌인 ↗</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-2 mt-1">
                      <span className="font-mono font-extrabold text-xs text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded border border-blue-200">
                        {selectedNormItem.drawing_no || '도면번호 미지정'}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {selectedNormItem.drawing_name || selectedNormItem.normalized_name}
                      </h3>
                    </div>

                    {/* Detailed Title Block Spec Card */}
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="flex items-center justify-between text-slate-500 font-semibold border-b border-slate-200 pb-1.5">
                        <span className="flex items-center space-x-1.5 text-blue-700">
                          <FileText className="w-3.5 h-3.5" />
                          <span>도면 표제란(Title Block) 메타데이터</span>
                        </span>
                        <span className="text-[10px] text-slate-400">도면 1:1 동기화 완료</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600">
                        <div>
                          <span className="text-slate-400 block text-[10px]">도면 번호 (DWG No.)</span>
                          <strong className="font-mono font-bold text-slate-900">{selectedNormItem.drawing_no || '-'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">프로젝트명</span>
                          <span className="font-semibold text-slate-800 truncate block" title={selectedNormItem.project_name || data?.case?.project_name}>
                            {selectedNormItem.project_name || data?.case?.project_name || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">고객사 (Customer)</span>
                          <span className="font-semibold text-slate-800 truncate block">
                            {selectedNormItem.company_name || data?.case?.company_name || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">리비전 (Rev)</span>
                          <span className="font-bold text-slate-800">{selectedNormItem.drawing_revision || 'R00'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">재질 (Material)</span>
                          <span className="font-semibold text-slate-800">{selectedNormItem.drawing_material || selectedNormItem.material_candidate || 'SS400'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">척도 (Scale)</span>
                          <span className="font-semibold text-slate-800">{selectedNormItem.drawing_scale || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">규격/사양</span>
                          <span className="font-semibold text-slate-800">{selectedNormItem.spec_candidate || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">산출 수량</span>
                          <span className="font-extrabold text-blue-700">{selectedNormItem.quantity} {selectedNormItem.unit || 'EA'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Approval Status Banner (If already approved) */}
                  {finalBomItems.find((f: any) => f.normalized_item_id === selectedNormItem.id) && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <strong className="font-bold">검수 승인 완료된 품목입니다</strong>
                          {(() => {
                            const fItem = finalBomItems.find((f: any) => f.normalized_item_id === selectedNormItem.id);
                            return (
                              <div className="text-[11px] text-emerald-700 font-mono mt-0.5">
                                [{fItem?.final_master_code || '도면 가공품'}] {fItem?.final_name} • {fItem?.final_quantity} {fItem?.final_unit}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                          승인완료
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUnapproveItem(selectedNormItem.id, selectedNormItem.drawing_name || selectedNormItem.normalized_name)}
                          disabled={actionLoading}
                          className="btn-hover-effect-secondary px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-300 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                          title="이 품목의 승인을 취소하고 검토 대기 상태로 되돌립니다."
                        >
                          <RotateCcw className="w-3 h-3 text-rose-600" />
                          <span>승인 취소 ↺</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Top 3 Master Recommendation Cards */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        추천 마스터 후보 (
                        {candidates.filter((c: any) => c.normalized_item_id === selectedNormItem.id).length}건)
                      </span>
                    </h4>

                    {candidates.filter((c: any) => c.normalized_item_id === selectedNormItem.id).length > 0 ? (
                      candidates
                        .filter((c: any) => c.normalized_item_id === selectedNormItem.id)
                        .map((cand: any) => {
                          const pos = JSON.parse(cand.positive_evidence_json || '[]');
                          const neg = JSON.parse(cand.negative_evidence_json || '[]');

                          return (
                            <div
                              key={cand.id}
                              className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 transition-all space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center">
                                    {cand.rank}
                                  </span>
                                  <span className="font-bold text-slate-900 text-sm">
                                    [{cand.master_code}] {cand.standard_name}
                                  </span>
                                </div>
                                <span className="text-xs font-extrabold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                                  점수: {cand.total_score}점
                                </span>
                              </div>

                              {/* Evidence Reasons (PROMPT 12) */}
                              <div className="space-y-1 text-xs">
                                {pos.map((p: string, i: number) => (
                                  <div key={i} className="text-emerald-700 flex items-center space-x-1">
                                    <Check className="w-3.5 h-3.5 shrink-0" />
                                    <span>{p}</span>
                                  </div>
                                ))}
                                {neg.map((n: string, i: number) => (
                                  <div key={i} className="text-red-600 flex items-center space-x-1">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{n}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Approval Action Buttons (PROMPT 13) */}
                              <div className="flex items-center space-x-2 pt-2 border-t border-slate-200">
                                <button
                                  onClick={() => handleApproveItem(selectedNormItem.id, 'EXISTING_MASTER', cand)}
                                  disabled={actionLoading}
                                  className="btn-hover-effect px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                  이 마스터로 승인
                                </button>
                                <button
                                  onClick={() => handleApproveItem(selectedNormItem.id, 'SIMILAR_MASTER', cand, '유사품 규격 차이 승인')}
                                  disabled={actionLoading}
                                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  유사품으로 승인
                                </button>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-2.5">
                        <Info className="w-5 h-5 text-slate-400 mx-auto" />
                        <div>
                          <p className="text-xs font-bold text-slate-700">사내 기성 표준품 DB에 일치하는 후보가 없습니다.</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            도면에서 직접 추출된 고유 주문 제작 가공품/어셈블리 부품입니다.
                          </p>
                        </div>
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => handleApproveItem(selectedNormItem.id, 'NEW_ITEM_CANDIDATE', null, '도면 주문가공품 승인')}
                            disabled={actionLoading}
                            className="btn-hover-effect px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>도면 가공품으로 확정 승인</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Exception Decisions (PROMPT 13) */}
                  <div className="flex items-center space-x-2 pt-3 border-t border-slate-100 flex-wrap gap-y-2">
                    {candidates.filter((c: any) => c.normalized_item_id === selectedNormItem.id).length > 0 && (
                      <button
                        onClick={() => handleApproveItem(selectedNormItem.id, 'NEW_ITEM_CANDIDATE', null, '신규 마스터 등록 후보')}
                        disabled={actionLoading}
                        className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        신규 마스터 후보 지정
                      </button>
                    )}
                    <button
                      onClick={() => handleApproveItem(selectedNormItem.id, 'EXCLUDED', null, '견적 제외 품목')}
                      disabled={actionLoading}
                      className="px-3 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      견적 제외 (EXCLUDED)
                    </button>
                    {finalBomItems.find((f: any) => f.normalized_item_id === selectedNormItem.id) && (
                      <button
                        type="button"
                        onClick={() => handleUnapproveItem(selectedNormItem.id, selectedNormItem.drawing_name || selectedNormItem.normalized_name)}
                        disabled={actionLoading}
                        className="btn-hover-effect-secondary px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center space-x-1"
                        title="이 품목의 승인을 취소하고 검토 대기 상태로 되돌립니다."
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                        <span>승인 취소 (검토 대기로 복귀)</span>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-16 text-slate-400 text-sm">품목을 선택해주세요.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Price Modal (방안 A: 수기 단가 추천 이력 & 자동 누적 풀) */}
      {/* Privacy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">공개 불가 요청</h3>
            <p className="text-sm text-slate-600 mb-4">
              기본적으로 모든 견적은 사내에 공유됩니다. 보안 등 특별한 사유로 본인만 열람해야 하는 경우 사유를 작성해 주세요. (최고 승인권자의 결재 후 비공개 처리됩니다.)
            </p>
            <textarea
              className="w-full border border-slate-300 rounded p-3 text-sm h-24 mb-4"
              placeholder="공개 불가 사유를 입력하세요..."
              value={privacyReason}
              onChange={e => setPrivacyReason(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  const res = await fetch(`/api/quotation-cases/${id}/visibility`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'REQUEST_PRIVATE', reason: privacyReason })
                  });
                  if (res.ok) {
                    setShowPrivacyModal(false);
                    fetchData();
                  } else {
                    alert('요청 중 오류가 발생했습니다.');
                  }
                }}
                className="px-4 py-2 text-sm font-bold text-white bg-amber-600 rounded hover:bg-amber-700 transition-colors"
              >
                요청하기
              </button>
            </div>
          </div>
        </div>
      )}

      {manualPriceModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 font-bold text-xs rounded-md">
                    Manual Price
                  </span>
                  <h3 className="text-base font-bold text-slate-900">수기 단가 적용 & 추천 이력</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  과거 적용된 Manual Price 리스트를 조회하여 원클릭으로 선택하거나, 신규 단가를 직접 입력하여 적용합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManualPriceModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Item Info Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{manualPriceModal.item_name}</span>
                <span className="font-mono text-slate-500 font-semibold">{manualPriceModal.master_code || '미등록'}</span>
              </div>
              <div className="text-slate-600 flex items-center space-x-3 text-[11px]">
                <span>규격: <strong className="text-slate-800">{manualPriceModal.specification || '-'}</strong></span>
                <span>재질: <strong className="text-slate-800">{manualPriceModal.material || '-'}</strong></span>
                <span>수량: <strong className="text-slate-800 font-mono">{manualPriceModal.quantity} {manualPriceModal.unit}</strong></span>
              </div>
            </div>

            {/* Past Manual Price Candidates / Recommendation List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Manual Price 추천 이력 ({manualPriceHistory.length}건)</span>
                </h4>
                <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  클릭: 자동 입력 / 더블클릭: 즉시 적용 및 닫기
                </span>
              </div>

              {loadingHistory ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl flex items-center justify-center space-x-2 border border-slate-100">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>추천 리스트 불러오는 중...</span>
                </div>
              ) : manualPriceHistory.length > 0 ? (
                <div className="max-h-52 overflow-y-auto space-y-2 pr-1 p-1">
                  {manualPriceHistory.map((item: any) => {
                    const isSelected = selectedHistoryId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedHistoryId(item.id);
                          setManualPriceInput(Number(item.unit_price).toLocaleString());
                          setManualPriceReason(item.remark || '과거 Manual Price 이력 적용');
                        }}
                        onDoubleClick={() => {
                          handleDirectApplyPrice(Number(item.unit_price), item.remark || '과거 Manual Price 이력 적용');
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group select-none ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/90 ring-2 ring-blue-500/25 shadow-xs'
                            : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 bg-white hover:shadow-2xs'
                        }`}
                        title="클릭 시 단가/사유 입력창 반영 | 더블클릭 시 이 단가로 즉시 적용하고 창 닫기"
                      >
                        <div className="space-y-1 min-w-0 flex-1 mr-3">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className={`font-bold text-xs ${isSelected ? 'text-blue-900 font-extrabold' : 'text-slate-900 group-hover:text-blue-700'}`}>
                              {item.item_name}
                            </span>
                            {item.specification && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                isSelected ? 'bg-white text-blue-800 border-blue-200 font-medium' : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}>
                                {item.specification}
                              </span>
                            )}
                            {item.material && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                isSelected ? 'bg-white text-blue-800 border-blue-200 font-medium' : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}>
                                {item.material}
                              </span>
                            )}
                          </div>
                          <p className={`text-[11px] truncate ${isSelected ? 'text-blue-700 font-medium' : 'text-slate-500'}`}>
                            사유: {item.remark || '-'}
                          </p>
                        </div>

                        <div className="text-right shrink-0 flex flex-col items-end space-y-1">
                          <div className="flex items-center space-x-1.5">
                            {isSelected ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white flex items-center space-x-1 shadow-2xs">
                                <Check className="w-2.5 h-2.5" />
                                <span>선택됨 (더블클릭 즉시적용)</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                더블클릭 즉시적용 ➔
                              </span>
                            )}
                            <span className={`font-mono text-sm ${
                              isSelected
                                ? 'font-extrabold text-blue-700'
                                : 'font-bold text-blue-600 group-hover:text-blue-700'
                            }`}>
                              ₩{Number(item.unit_price).toLocaleString()}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {item.created_at?.slice(0, 10)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  등록된 과거 Manual Price 이력이 없습니다. 아래에서 직접 입력하시면 풀(Pool)에 자동 저장됩니다.
                </div>
              )}
            </div>

            {/* Input Form */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    적용 단가 (원) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-400 font-bold text-xs">₩</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={manualPriceInput}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setManualPriceInput(raw ? Number(raw).toLocaleString() : '');
                      }}
                      placeholder="예: 45,000"
                      className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    입력 사유 (비고)
                  </label>
                  <input
                    type="text"
                    value={manualPriceReason}
                    onChange={(e) => setManualPriceReason(e.target.value)}
                    placeholder="예: 외주 임가공비 협의가, 원자재 시세 반영 등"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-xl text-[11px] text-blue-800 flex items-start space-x-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                <span>
                  <strong>방안 A 자동 학습:</strong> 지금 적용한 단가와 사유는 회사의 <strong>Manual Price 풀</strong>에 자동 저장되어, 다음 번 견적 시 유사 부품 추천 리스트로 제공됩니다.
                </span>
              </div>

              {/* Application Scope & Quote Inclusion Options */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                {/* Auto include in quote toggle */}
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoIncludeInQuote}
                    onChange={(e) => setAutoIncludeInQuote(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="flex items-center space-x-1.5 flex-wrap">
                    <span className="text-slate-900 font-bold">견적 선택 체크 자동 활성화</span>
                    <span className="text-slate-500 text-[11px] font-normal">(단가 적용 시 해당 품목을 견적서에 자동 포함)</span>
                  </span>
                </label>

                {/* Scope selection: SINGLE vs ALL_SAME */}
                {(() => {
                  const sameCount = (quoteItems || []).filter((q: any) => q.item_name === manualPriceModal?.item_name).length;
                  return (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                      <div className="text-[11px] font-bold text-slate-600">단가 및 견적 적용 범위 선택:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label
                          className={`flex items-start space-x-2 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                            applyScope === 'SINGLE'
                              ? 'bg-blue-50/90 border-blue-500 text-blue-950 font-bold ring-1 ring-blue-500/20 shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
                          }`}
                        >
                          <input
                            type="radio"
                            name="applyScope"
                            value="SINGLE"
                            checked={applyScope === 'SINGLE'}
                            onChange={() => setApplyScope('SINGLE')}
                            className="mt-0.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <div className="text-xs leading-tight">
                            <div className="font-bold flex items-center space-x-1">
                              <span>현재 품목 1건만 적용</span>
                              <span className="text-[10px] px-1 py-0.2 bg-blue-100 text-blue-800 rounded font-semibold">기본(안전)</span>
                            </div>
                            <div className="text-[10.5px] text-slate-500 font-normal mt-1">
                              No. {manualPriceModal?.item_no} ({manualPriceModal?.quantity} {manualPriceModal?.unit})에만 적용
                            </div>
                          </div>
                        </label>

                        {sameCount > 1 ? (
                          <label
                            className={`flex items-start space-x-2 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                              applyScope === 'ALL_SAME'
                                ? 'bg-blue-50/90 border-blue-500 text-blue-950 font-bold ring-1 ring-blue-500/20 shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
                            }`}
                          >
                            <input
                              type="radio"
                              name="applyScope"
                              value="ALL_SAME"
                              checked={applyScope === 'ALL_SAME'}
                              onChange={() => setApplyScope('ALL_SAME')}
                              className="mt-0.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <div className="text-xs leading-tight">
                              <div className="font-bold text-blue-900">동일 품명 {sameCount}건 일괄 적용</div>
                              <div className="text-[10.5px] text-blue-600 font-normal mt-1">
                                {manualPriceModal?.item_name} 전체에 동시 적용
                              </div>
                            </div>
                          </label>
                        ) : (
                          <div className="p-2.5 rounded-xl border border-dashed border-slate-200 text-slate-400 text-[11px] flex items-center justify-center">
                            동일한 다른 부품 없음 (단일 부품)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setManualPriceModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveManualPrice}
                disabled={actionLoading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Manual Price 확정 및 적용</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
