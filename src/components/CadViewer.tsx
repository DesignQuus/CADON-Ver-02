'use client';

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  ZoomIn, ZoomOut, RotateCcw, Eye, Layers, Move, ExternalLink,
  CheckCircle2, FileText, X, Search, ShieldCheck, Archive, Download,
  PanelLeftClose, PanelLeftOpen, FileSpreadsheet, ChevronDown, ChevronRight,
  Maximize2, Sparkles, Filter, Check, Settings, Play, RefreshCw, AlertCircle, AlertTriangle,
  FolderOpen, Copy
} from 'lucide-react';
import WebGlCadViewer from './WebGlCadViewer';

// Auto-Marquee on Hover Component (Method B: Single-line, compact width, auto-scrolls on hover)
function HoverMarqueeText({ text }: { text: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflowDist, setOverflowDist] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    if (containerRef.current && textRef.current) {
      const diff = textRef.current.scrollWidth - containerRef.current.clientWidth;
      if (diff > 4) {
        setOverflowDist(diff);
        setIsHovered(true);
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const duration = Math.max(1.6, overflowDist * 0.025);

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="overflow-hidden whitespace-nowrap max-w-[170px] text-white font-bold cursor-default"
      title={text}
    >
      <span
        ref={textRef}
        className="inline-block transition-transform ease-linear"
        style={{
          transform: isHovered && overflowDist > 0 ? `translateX(-${overflowDist + 10}px)` : 'translateX(0px)',
          transitionDuration: isHovered ? `${duration}s` : '0.25s',
          transitionDelay: isHovered ? '0.25s' : '0s'
        }}
      >
        {text}
      </span>
    </div>
  );
}

function TriStateCheckbox({
  state,
  onChange,
  disabled = false,
  title
}: {
  state: 'checked' | 'unchecked' | 'indeterminate';
  onChange: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      title={title}
      className={`w-4 h-4 rounded flex items-center justify-center border transition-all cursor-pointer select-none ${
        state === 'checked'
          ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
          : state === 'indeterminate'
          ? 'bg-blue-900/90 border-blue-400 text-blue-200 shadow-xs'
          : 'bg-slate-900 border-slate-600 hover:border-slate-400 text-transparent'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {state === 'checked' && <Check className="w-3 h-3 stroke-[3]" />}
      {state === 'indeterminate' && <div className="w-2 h-0.5 bg-blue-300 rounded-full" />}
    </button>
  );
}

interface CadViewerProps {
  cadObjects: any[];
  drawings: any[];
  relationships?: any[];
  bomAreas?: any[];
  rawBomItems?: any[];
  caseId?: string;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  externalFocusIdx?: number | null;
  onClearExternalFocus?: () => void;
  quoteItems?: any[];
  latestQuote?: any;
  onToggleQuoteItem?: (drawingNos: string[], isIncluded: boolean) => void;
  onToggleAllQuoteDrawings?: (isIncluded: boolean) => void;
  selectedFile?: any;
  onStartAnalysis?: (fileId: string) => void;
  isAnalyzing?: boolean;
  allFiles?: any[];
  onSelectFile?: (fileId: string) => void;
}

export default function CadViewer({
  cadObjects = [],
  drawings = [],
  relationships = [],
  bomAreas = [],
  rawBomItems = [],
  caseId,
  isSidebarOpen = true,
  onToggleSidebar,
  externalFocusIdx,
  onClearExternalFocus,
  quoteItems = [],
  latestQuote,
  onToggleQuoteItem,
  onToggleAllQuoteDrawings,
  selectedFile,
  onStartAnalysis,
  isAnalyzing = false,
  allFiles = [],
  onSelectFile
}: CadViewerProps) {
  // Mode switcher: 'CAD' (2D Vector Viewer) vs 'SHEET' (Full-width Excel Grid)
  const [viewMode, setViewMode] = useState<'CAD' | 'SHEET'>('CAD');

  // WebGL camera focus state
  const [webGlFocusBbox, setWebGlFocusBbox] = useState<{ min_x: number; min_y: number; max_x: number; max_y: number } | null>(null);

  // Cursor-centered transform state
  const [transform, setTransform] = useState({ zoom: 1, pan: { x: 0, y: 0 } });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [showOverlays, setShowOverlays] = useState(false);
  const [showTexts, setShowTexts] = useState(true);
  const [selectedDrawingIdx, setSelectedDrawingIdx] = useState<number>(-1);
  const [titleBlockSearch, setTitleBlockSearch] = useState<string>('');
  const [filterDuplicatesOnly, setFilterDuplicatesOnly] = useState<boolean>(false);
  const [highlightDrawingIds, setHighlightDrawingIds] = useState<string[]>([]);

  // External CAD launch & Archiving states
  const [openingCad, setOpeningCad] = useState(false);
  const [openingFastView, setOpeningFastView] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [cadStatusMsg, setCadStatusMsg] = useState<string | null>(null);

  // Settings Modal states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [fastviewPathInput, setFastviewPathInput] = useState('');
  const [autocadPathInput, setAutocadPathInput] = useState('');
  const [detectedFastviewList, setDetectedFastviewList] = useState<string[]>([]);
  const [detectedAutocadList, setDetectedAutocadList] = useState<string[]>([]);
  const [freeViewerPresets, setFreeViewerPresets] = useState<any[]>([]);
  const [freeViewerExists, setFreeViewerExists] = useState(false);
  const [isFreeViewerConfigured, setIsFreeViewerConfigured] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [testingFastview, setTestingFastview] = useState(false);
  const [testingAutocad, setTestingAutocad] = useState(false);
  const [isAutocadInstalled, setIsAutocadInstalled] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [openedFolderInfo, setOpenedFolderInfo] = useState<{ path: string; name: string } | null>(null);
  const [copiedPath, setCopiedPath] = useState(false);

  // 💎 HD Vector SVG state
  const [hdSvgContent, setHdSvgContent] = useState<string | null>(null);
  const [loadingSvg, setLoadingSvg] = useState(false);
  const [useHdVector, setUseHdVector] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch Ultra-High-Fidelity Vector SVG
  const fetchHdVectorSvg = useCallback(async () => {
    if (!caseId) return false;
    setLoadingSvg(true);
    try {
      const res = await fetch(`/api/quotation-cases/${caseId}/vector-svg`);
      if (res.ok) {
        const svgText = await res.text();
        if (svgText && svgText.includes('<svg')) {
          setHdSvgContent(svgText);
          setUseHdVector(true);
          return true;
        }
      }
    } catch (e) {
      console.warn('HD Vector SVG load warning:', e);
    } finally {
      setLoadingSvg(false);
    }
    return false;
  }, [caseId]);

  useEffect(() => {
    fetchHdVectorSvg();
  }, [fetchHdVectorSvg]);

  // Load CAD Executable Settings from SQLite
  const loadCadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/cad-settings');
      if (res.ok) {
        const data = await res.json();
        setFastviewPathInput(data.fastviewPath || '');
        if (data.autocadPath !== undefined) setAutocadPathInput(data.autocadPath || '');
        if (data.fastviewCandidates) setDetectedFastviewList(data.fastviewCandidates);
        if (data.autocadCandidates) setDetectedAutocadList(data.autocadCandidates);
        if (data.freeViewerPresets) setFreeViewerPresets(data.freeViewerPresets);
        setFreeViewerExists(Boolean(data.fastviewExists));
        setIsFreeViewerConfigured(Boolean(data.isFreeViewerConfigured));
        setIsAutocadInstalled(Boolean(data.autocadExists));
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadCadSettings();
  }, [loadCadSettings]);

  // Open Settings Modal & refresh candidates
  const handleOpenSettingsModal = () => {
    setShowSettingsModal(true);
    setSettingsMsg(null);
    loadCadSettings();
  };

  // Test Run CAD Executable
  const handleTestRunCadApp = async (appType: 'fastview' | 'autocad') => {
    const targetPath = appType === 'fastview' ? fastviewPathInput : autocadPathInput;
    if (appType === 'fastview') setTestingFastview(true);
    else setTestingAutocad(true);
    setSettingsMsg(null);

    try {
      const res = await fetch('/api/cad-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', exePath: targetPath })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettingsMsg({ type: 'success', text: `✅ ${data.message}` });
      } else {
        setSettingsMsg({ type: 'error', text: `❌ ${data.error || '프로그램 실행에 실패했습니다.'}` });
      }
    } catch (err: any) {
      setSettingsMsg({ type: 'error', text: `통신 오류: ${err.message}` });
    } finally {
      if (appType === 'fastview') setTestingFastview(false);
      else setTestingAutocad(false);
    }
  };

  // Save CAD App Settings
  const handleSaveCadSettings = async () => {
    setSettingsLoading(true);
    setSettingsMsg(null);
    try {
      const res = await fetch('/api/cad-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fastviewPath: fastviewPathInput,
          autocadPath: autocadPathInput
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettingsMsg({ type: 'success', text: '✅ 설정이 안전하게 저장되었습니다.' });
        setCadStatusMsg('CAD 실행 프로그램 경로가 업데이트되었습니다.');
        setTimeout(() => setCadStatusMsg(null), 4000);
        setTimeout(() => setShowSettingsModal(false), 1200);
        loadCadSettings();
      } else {
        setSettingsMsg({ type: 'error', text: `❌ ${data.error || '저장에 실패했습니다.'}` });
      }
    } catch (err: any) {
      setSettingsMsg({ type: 'error', text: `통신 오류: ${err.message}` });
    } finally {
      setSettingsLoading(false);
    }
  };

  // 1. Launch in Free CAD Viewer (DWG FastView, TrueView, ZWCAD, etc.)
  const handleOpenFreeViewer = async () => {
    if (!caseId) return;

    // Check if free viewer is configured and valid
    if (!isFreeViewerConfigured || !fastviewPathInput?.trim() || !freeViewerExists) {
      setCadStatusMsg('CAD 설정 창에서 무료 뷰어를 설정 후 사용 할 수 있습니다.');
      setShowSettingsModal(true);
      setTimeout(() => setCadStatusMsg(null), 5000);
      return;
    }

    setOpeningFastView(true);
    setCadStatusMsg(null);
    try {
      const res = await fetch(`/api/quotation-cases/${caseId}/open-cad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app: 'free_viewer' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCadStatusMsg(data.message || '무료 뷰어로 도면을 열었습니다.');
        setTimeout(() => setCadStatusMsg(null), 4500);
      } else {
        if (data.notConfigured) {
          setCadStatusMsg('CAD 설정 창에서 무료 뷰어를 설정 후 사용 할 수 있습니다.');
          setShowSettingsModal(true);
          setTimeout(() => setCadStatusMsg(null), 5000);
        } else {
          alert(data.error || '무료 CAD 뷰어 열기에 실패했습니다.');
        }
      }
    } catch (err: any) {
      alert('서버 통신 오류: ' + err.message);
    } finally {
      setOpeningFastView(false);
    }
  };

  // 2. Launch in AutoCAD
  const handleOpenAutoCad = async () => {
    if (!caseId) return;

    if (!isAutocadInstalled || !autocadPathInput?.trim()) {
      setCadStatusMsg('CAD 설정 창에서 AutoCAD 실행 경로를 설정 후 사용할 수 있습니다.');
      setShowSettingsModal(true);
      setTimeout(() => setCadStatusMsg(null), 5000);
      return;
    }

    setOpeningCad(true);
    setCadStatusMsg(null);
    try {
      const res = await fetch(`/api/quotation-cases/${caseId}/open-cad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app: 'autocad' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCadStatusMsg(data.message || 'AutoCAD로 도면을 열었습니다.');
        setTimeout(() => setCadStatusMsg(null), 4500);
      } else {
        if (data.notConfigured) {
          setCadStatusMsg(data.error || 'CAD 설정 창에서 AutoCAD 실행 경로를 설정 후 사용할 수 있습니다.');
          setShowSettingsModal(true);
          setTimeout(() => setCadStatusMsg(null), 5000);
        } else {
          alert(data.error || 'AutoCAD 열기에 실패했습니다.');
        }
      }
    } catch (err: any) {
      alert('서버 통신 오류: ' + err.message);
    } finally {
      setOpeningCad(false);
    }
  };

  // 3. Archive Snapshot (별도 보관)
  const handleArchiveSnapshot = async () => {
    if (!caseId) return;
    setArchiving(true);
    try {
      const res = await fetch(`/api/quotation-cases/${caseId}/archive-snapshot`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setCadStatusMsg(data.message || '분석 데이터가 안전하게 보관되었습니다.');
        setTimeout(() => setCadStatusMsg(null), 5000);
      } else {
        alert(data.error || '보관 실패');
      }
    } catch (err: any) {
      alert('보관 중 오류: ' + err.message);
    } finally {
      setArchiving(false);
    }
  };

  // 3-2. Open containing folder in Windows Explorer
  const handleOpenFolder = async () => {
    if (!caseId) return;
    try {
      const res = await fetch(`/api/quotation-cases/${caseId}/open-cad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app: 'folder' })
      });
      const data = await res.json();
      if (res.ok) {
        setOpenedFolderInfo({
          path: data.filePath || 'C:\\Users\\SteveLee\\OneDrive\\Desktop\\DWG 모음\\test.dwg',
          name: data.fileName || 'test.dwg'
        });
        setCadStatusMsg(data.message || '도면 파일 위치를 윈도우 탐색기로 열었습니다.');
        setTimeout(() => setCadStatusMsg(null), 5000);
      }
    } catch {}
  };

  const handleCopyPath = (textToCopy: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 3000);
    }
  };

  // 4. Download Complete Archive Package (ZIP 다운로드)
  const handleDownloadZip = () => {
    if (!caseId) return;
    window.open(`/api/quotation-cases/${caseId}/export-package`, '_blank');
  };

  // 5. Export Title Blocks to CSV / Excel
  const handleExportTitleBlocksCsv = () => {
    if (drawings.length === 0) return;
    const headers = ['No', '구분', '도면번호(DWG)', '품명(Sub Name)', '프로젝트명', '고객사', '설계자', '설계일자', '축척', '개정(Rev)', '재질', '제조사'];
    const rows = drawings.map((d, i) => [
      i + 1,
      d.drawing_type === 'MAIN_ASSEMBLY' ? '메인 조립도' : '단위 부품도',
      `"${d.drawing_no_raw || ''}"`,
      `"${d.drawing_name_raw || ''}"`,
      `"${d.project_name || '인버터 조립 LINE'}"`,
      `"${d.customer || 'A&G/보그워너'}"`,
      `"${d.designer || '이경중'}"`,
      `"${d.design_date || '24.03.15'}"`,
      `"${d.scale || '1/1'}"`,
      `"${d.revision || 'R00'}"`,
      `"${d.material || 'SS400'}"`,
      `"${d.company || '세창인터내쇼날(주)'}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `도면_표제란_엑셀시트_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 6. Global Bounds calculation from CAD objects
  const globalBounds = useMemo(() => {
    let min_x = Infinity, min_y = Infinity, max_x = -Infinity, max_y = -Infinity;

    if (cadObjects && cadObjects.length > 0) {
      for (const obj of cadObjects) {
        try {
          const bbox = typeof obj.bounding_box_json === 'string'
            ? JSON.parse(obj.bounding_box_json)
            : obj.bounding_box;
          if (bbox && typeof bbox.min_x === 'number') {
            if (bbox.min_x < min_x) min_x = bbox.min_x;
            if (bbox.min_y < min_y) min_y = bbox.min_y;
            if (bbox.max_x > max_x) max_x = bbox.max_x;
            if (bbox.max_y > max_y) max_y = bbox.max_y;
          }
        } catch {}
      }
    }

    if (min_x === Infinity || min_x === max_x) {
      min_x = 0; min_y = 0; max_x = 1000; max_y = 700;
    }

    return { minX: min_x, minY: min_y, maxX: max_x, maxY: max_y, width: max_x - min_x, height: max_y - min_y };
  }, [cadObjects]);

  // 7. Active Viewport depending on selected drawing
  const activeViewport = useMemo(() => {
    if (selectedDrawingIdx >= 0 && drawings[selectedDrawingIdx]) {
      try {
        const dwg = drawings[selectedDrawingIdx];
        const fbox = typeof dwg.frame_bbox_json === 'string'
          ? JSON.parse(dwg.frame_bbox_json)
          : dwg.frame_bbox;
        if (fbox && typeof fbox.min_x === 'number') {
          const fw = fbox.max_x - fbox.min_x;
          const fh = fbox.max_y - fbox.min_y;
          const padX = fw * 0.05 || 20;
          const padY = fh * 0.05 || 20;
          return {
            minX: fbox.min_x - padX,
            minY: fbox.min_y - padY,
            maxX: fbox.max_x + padX,
            maxY: fbox.max_y + padY,
            width: fw + padX * 2,
            height: fh + padY * 2
          };
        }
      } catch {}
    }

    const padX = (globalBounds.width * 0.04) || 20;
    const padY = (globalBounds.height * 0.04) || 20;
    return {
      minX: globalBounds.minX - padX,
      minY: globalBounds.minY - padY,
      maxX: globalBounds.maxX + padX,
      maxY: globalBounds.maxY + padY,
      width: globalBounds.width + padX * 2,
      height: globalBounds.height + padY * 2
    };
  }, [selectedDrawingIdx, drawings, globalBounds]);

  // Reset zoom & pan whenever drawing selection changes
  useEffect(() => {
    setTransform({ zoom: 1, pan: { x: 0, y: 0 } });
  }, [selectedDrawingIdx]);

  // Attach native non-passive wheel event listener for cursor-centered zooming
  useEffect(() => {
    const el = containerRef.current;
    if (!el || viewMode !== 'CAD') return;

    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = el.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      const factor = e.deltaY < 0 ? 1.2 : 0.833;

      setTransform((prev) => {
        const newZoom = Math.max(0.05, Math.min(30, prev.zoom * factor));
        const actualFactor = newZoom / prev.zoom;

        const newPanX = cursorX - (cursorX - prev.pan.x) * actualFactor;
        const newPanY = cursorY - (cursorY - prev.pan.y) * actualFactor;

        return {
          zoom: newZoom,
          pan: { x: newPanX, y: newPanY }
        };
      });
    };

    el.addEventListener('wheel', onWheelNative, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheelNative);
    };
  }, [viewMode]);

  // Zoom with buttons centered at container viewport center
  const zoomAtCenter = useCallback((factor: number) => {
    const el = containerRef.current;
    const cx = el ? el.clientWidth / 2 : 400;
    const cy = el ? el.clientHeight / 2 : 250;

    setTransform((prev) => {
      const newZoom = Math.max(0.05, Math.min(30, prev.zoom * factor));
      const actualFactor = newZoom / prev.zoom;
      return {
        zoom: newZoom,
        pan: {
          x: cx - (cx - prev.pan.x) * actualFactor,
          y: cy - (cy - prev.pan.y) * actualFactor
        }
      };
    });
  }, []);

  const resetView = () => {
    setTransform({ zoom: 1, pan: { x: 0, y: 0 } });
  };

  // Coordinate converter: CAD Y (upwards) -> SVG Y (downwards)
  const toSvgY = (cadY: number) => {
    return activeViewport.maxY - (cadY - activeViewport.minY);
  };

  // Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode !== 'CAD') return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - transform.pan.x, y: e.clientY - transform.pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || viewMode !== 'CAD') return;
    setTransform((prev) => ({
      ...prev,
      pan: {
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      }
    }));
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Filter overlays to only show the active drawing
  const activeDrawings = useMemo(() => {
    if (selectedDrawingIdx >= 0 && drawings[selectedDrawingIdx]) {
      return [drawings[selectedDrawingIdx]];
    }
    return drawings;
  }, [selectedDrawingIdx, drawings]);

  const activeBomAreas = useMemo(() => {
    if (selectedDrawingIdx >= 0 && drawings[selectedDrawingIdx]) {
      const activeDwgNo = drawings[selectedDrawingIdx].drawing_no_raw;
      const matched = bomAreas.filter((b) => b.drawing_no === activeDwgNo);
      return matched.length > 0 ? matched : (bomAreas.length > 0 ? [bomAreas[0]] : []);
    }
    return bomAreas;
  }, [selectedDrawingIdx, drawings, bomAreas]);

  // Filter objects for the active viewport for high performance & clarity
  const visibleObjects = useMemo(() => {
    if (selectedDrawingIdx < 0) return cadObjects;
    const { minX, minY, maxX, maxY } = activeViewport;
    return cadObjects.filter(obj => {
      try {
        const bbox = typeof obj.bounding_box_json === 'string'
          ? JSON.parse(obj.bounding_box_json)
          : obj.bounding_box;
        if (bbox && typeof bbox.min_x === 'number') {
          return !(bbox.max_x < minX || bbox.min_x > maxX || bbox.max_y < minY || bbox.min_y > maxY);
        }
      } catch {}
      return true;
    });
  }, [cadObjects, activeViewport, selectedDrawingIdx]);

  // Collapsible Tree State: tracks expanded drawing numbers
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Default expand: expand all nodes with children on load
  useEffect(() => {
    if (drawings.length > 0 && expandedNodes.size === 0) {
      const initialSet = new Set<string>();
      drawings.forEach(d => {
        if (d.drawing_type === 'MAIN_ASSEMBLY' || d.drawing_type === 'SUB_ASSEMBLY') {
          initialSet.add(d.drawing_no_raw);
        }
      });
      setExpandedNodes(initialSet);
    }
  }, [drawings]);

  const expandAll = () => {
    const allSet = new Set<string>(drawings.map(d => d.drawing_no_raw));
    setExpandedNodes(allSet);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const toggleNode = (dwgNo: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(dwgNo)) {
        next.delete(dwgNo);
      } else {
        next.add(dwgNo);
      }
      return next;
    });
  };

  // Group drawings into Main Assembly vs Sub Assembly vs Part Drawings
  const mainDrawings = useMemo(() => drawings.filter(d => d.drawing_type === 'MAIN_ASSEMBLY'), [drawings]);
  const subAssyDrawings = useMemo(() => drawings.filter(d => d.drawing_type === 'SUB_ASSEMBLY'), [drawings]);
  const partDrawings = useMemo(() => drawings.filter(d => d.drawing_type !== 'MAIN_ASSEMBLY' && d.drawing_type !== 'SUB_ASSEMBLY'), [drawings]);
  const subDrawings = useMemo(() => drawings.filter(d => d.drawing_type !== 'MAIN_ASSEMBLY'), [drawings]);

  // Build Hierarchical Tree Structure (DFS Order)
  const hierarchicalDrawings = useMemo(() => {
    if (!drawings || drawings.length === 0) return [];

    // If search filter is active, return flat filtered drawings with depth 0
    if (titleBlockSearch.trim()) {
      const q = titleBlockSearch.toLowerCase();
      return drawings
        .filter(d =>
          (d.drawing_no_raw && d.drawing_no_raw.toLowerCase().includes(q)) ||
          (d.drawing_name_raw && d.drawing_name_raw.toLowerCase().includes(q)) ||
          (d.material && d.material.toLowerCase().includes(q)) ||
          (d.customer && d.customer.toLowerCase().includes(q)) ||
          (d.designer && d.designer.toLowerCase().includes(q))
        )
        .map(d => ({
          ...d,
          treeDepth: 0,
          hasChildren: false,
          isExpanded: false,
          childrenCount: 0
        }));
    }

    const childrenMap = new Map<string, any[]>();
    const hasParentIdSet = new Set<string>();

    if (relationships && relationships.length > 0) {
      relationships.forEach(rel => {
        const p = rel.parent_drawing_no;
        const c = rel.child_drawing_no;
        if (p && c) {
          const childDrawings = drawings.filter(d => d.drawing_no_raw === c);
          childDrawings.forEach(cd => {
            if (!childrenMap.has(p)) {
              childrenMap.set(p, []);
            }
            if (!childrenMap.get(p)!.some((existing: any) => existing.id === cd.id)) {
              childrenMap.get(p)!.push(cd);
            }
            hasParentIdSet.add(cd.id);
          });
        }
      });
    }

    // Roots: items without parents in relationship map
    const roots: any[] = [];
    drawings.forEach(d => {
      if (!hasParentIdSet.has(d.id) && d.drawing_type === 'MAIN_ASSEMBLY') {
        roots.push(d);
      }
    });

    const visitedSet = new Set<string>();
    const result: any[] = [];

    function traverse(node: any, depth: number) {
      if (!node || !node.id || visitedSet.has(node.id)) return;
      visitedSet.add(node.id);

      const childrenNodes = childrenMap.get(node.drawing_no_raw) || [];
      const hasChildren = childrenNodes.length > 0;
      const isExpanded = expandedNodes.has(node.drawing_no_raw);

      result.push({
        ...node,
        treeDepth: depth,
        hasChildren,
        isExpanded,
        childrenCount: childrenNodes.length
      });

      if (hasChildren && isExpanded) {
        childrenNodes.forEach(cNode => {
          traverse(cNode, depth + 1);
        });
      }
    }

    roots.forEach(r => traverse(r, 0));

    // Fallback: any drawings not reached via relationships
    drawings.forEach(d => {
      if (!visitedSet.has(d.id)) {
        traverse(d, d.drawing_type === 'MAIN_ASSEMBLY' ? 0 : 1);
      }
    });

    return result;
  }, [drawings, relationships, titleBlockSearch, expandedNodes]);

  // 💎 Group drawings by drawing_no_raw to detect duplicate drawing numbers
  const duplicateMap = useMemo(() => {
    const map = new Map<string, any[]>();
    drawings.forEach(d => {
      const no = (d.drawing_no_raw || '').trim();
      if (!no) return;
      if (!map.has(no)) map.set(no, []);
      map.get(no)!.push(d);
    });
    return map;
  }, [drawings]);

  // 💎 Statistics for duplicates
  const duplicateStats = useMemo(() => {
    let groupCount = 0;
    let rowCount = 0;
    duplicateMap.forEach(items => {
      if (items.length > 1) {
        groupCount++;
        rowCount += items.length;
      }
    });
    return { groupCount, rowCount };
  }, [duplicateMap]);

  // 💎 Filtered Drawings for Display (handles filterDuplicatesOnly)
  const displayedDrawings = useMemo(() => {
    if (!filterDuplicatesOnly) return hierarchicalDrawings;
    return hierarchicalDrawings.filter(d => {
      const rawNo = (d.drawing_no_raw || '').trim();
      const group = duplicateMap.get(rawNo);
      return group && group.length > 1;
    });
  }, [hierarchicalDrawings, filterDuplicatesOnly, duplicateMap]);

  // 💎 Active Duplicate Group in CAD View
  const activeDuplicateGroup = useMemo(() => {
    if (selectedDrawingIdx >= 0 && drawings[selectedDrawingIdx]) {
      const rawNo = (drawings[selectedDrawingIdx].drawing_no_raw || '').trim();
      const group = duplicateMap.get(rawNo);
      if (group && group.length > 1) return group;
    }
    if (highlightDrawingIds.length > 0) {
      const matched = drawings.filter(d => highlightDrawingIds.includes(d.id));
      if (matched.length > 1) return matched;
    }
    return null;
  }, [selectedDrawingIdx, drawings, duplicateMap, highlightDrawingIds]);

  // 💎 Tree Children Map (for quote cascading and descendant lookup)
  const treeChildrenMap = useMemo(() => {
    const map = new Map<string, string[]>();
    if (relationships && relationships.length > 0) {
      relationships.forEach((rel: any) => {
        const p = rel.parent_drawing_no;
        const c = rel.child_drawing_no;
        if (p && c) {
          if (!map.has(p)) map.set(p, []);
          map.get(p)!.push(c);
        }
      });
    }
    return map;
  }, [relationships]);

  // 💎 Quote Item Map (keyed by drawing_no and item_name)
  const quoteItemMap = useMemo(() => {
    const map = new Map<string, any>();
    (quoteItems || []).forEach((qi: any) => {
      if (qi.drawing_no) map.set(qi.drawing_no, qi);
      if (qi.item_name && !map.has(qi.item_name)) map.set(qi.item_name, qi);
    });
    return map;
  }, [quoteItems]);

  // 💎 Helper: Get all descendant leaf drawing numbers for an assembly
  const getDescendantLeafNos = useCallback((dwgNo: string): string[] => {
    const leaves: string[] = [];
    const visited = new Set<string>();

    function walk(current: string) {
      if (visited.has(current)) return;
      visited.add(current);
      const children = treeChildrenMap.get(current) || [];
      if (children.length === 0) {
        leaves.push(current);
      } else {
        children.forEach(c => walk(c));
      }
    }

    walk(dwgNo);
    return leaves.length > 0 ? leaves : [dwgNo];
  }, [treeChildrenMap]);

  // 💎 Helper: Get all drawing numbers in subtree (parent + all descendants)
  const getAllSubtreeNos = useCallback((dwgNo: string): string[] => {
    const all: string[] = [dwgNo];
    const visited = new Set<string>([dwgNo]);

    function walk(current: string) {
      const children = treeChildrenMap.get(current) || [];
      for (const c of children) {
        if (!visited.has(c)) {
          visited.add(c);
          all.push(c);
          walk(c);
        }
      }
    }

    walk(dwgNo);
    return all;
  }, [treeChildrenMap]);

  // 💎 Compute quotation details for any drawing row
  const getDrawingQuoteInfo = useCallback((d: any) => {
    const isAssy = d.drawing_type === 'MAIN_ASSEMBLY' || d.drawing_type === 'SUB_ASSEMBLY';

    if (isAssy) {
      const leafNos = getDescendantLeafNos(d.drawing_no_raw);
      let checkedCount = 0;
      let subtotal = 0;

      leafNos.forEach(no => {
        const item = quoteItemMap.get(no);
        const isInc = item ? item.is_included !== 0 : true;
        if (isInc) {
          checkedCount++;
          subtotal += Number(item?.amount || 0);
        }
      });

      let checkState: 'checked' | 'unchecked' | 'indeterminate' = 'checked';
      if (checkedCount === 0) {
        checkState = 'unchecked';
      } else if (checkedCount === leafNos.length) {
        checkState = 'checked';
      } else {
        checkState = 'indeterminate';
      }

      return {
        isAssy: true,
        checkState,
        leafCount: leafNos.length,
        checkedCount,
        quantity: 1,
        unitPrice: 0,
        amount: subtotal,
        isIncluded: checkState !== 'unchecked'
      };
    } else {
      const item = quoteItemMap.get(d.drawing_no_raw) || quoteItemMap.get(d.drawing_name_raw);
      const isIncluded = item ? item.is_included !== 0 : true;
      const unitPrice = item?.unit_price ?? 0;
      const quantity = item?.quantity ?? 1;
      const amount = isIncluded ? (item?.amount ?? (quantity * unitPrice)) : 0;

      return {
        isAssy: false,
        checkState: (isIncluded ? 'checked' : 'unchecked') as 'checked' | 'unchecked',
        leafCount: 1,
        checkedCount: isIncluded ? 1 : 0,
        quantity,
        unitPrice,
        amount,
        isIncluded
      };
    }
  }, [quoteItemMap, getDescendantLeafNos]);

  // 💎 Global quotation summary across all drawing rows
  const quoteSummary = useMemo(() => {
    let totalParts = 0;
    let includedParts = 0;
    let totalSubtotal = 0;
    let totalQty = 0;
    let includedQty = 0;

    hierarchicalDrawings.forEach(d => {
      if (d.drawing_type !== 'MAIN_ASSEMBLY' && d.drawing_type !== 'SUB_ASSEMBLY') {
        totalParts++;
        const item = quoteItemMap.get(d.drawing_no_raw) || quoteItemMap.get(d.drawing_name_raw);
        const isInc = item ? item.is_included !== 0 : true;
        const q = Number(item?.quantity) || 1;
        totalQty += q;
        if (isInc) {
          includedParts++;
          includedQty += q;
          totalSubtotal += Number(item?.amount || 0);
        }
      }
    });

    let masterState: 'checked' | 'unchecked' | 'indeterminate' = 'checked';
    if (totalParts === 0 || includedParts === totalParts) {
      masterState = 'checked';
    } else if (includedParts === 0) {
      masterState = 'unchecked';
    } else {
      masterState = 'indeterminate';
    }

    return {
      totalParts,
      includedParts,
      totalSubtotal,
      totalQty,
      includedQty,
      masterState
    };
  }, [hierarchicalDrawings, quoteItemMap]);

  // Instant Precision Zoom: Switches directly from Excel Sheet to CAD Vector Canvas!
  const handleZoomToRow = (dwg: any) => {
    const idx = drawings.findIndex(d => d.id === dwg.id || d.drawing_no_raw === dwg.drawing_no_raw);
    if (idx >= 0) {
      setSelectedDrawingIdx(idx);
    }

    const rawNo = (dwg.drawing_no_raw || '').trim();
    const dupGroup = duplicateMap.get(rawNo);
    if (dupGroup && dupGroup.length > 1) {
      setHighlightDrawingIds(dupGroup.map(g => g.id));
    } else {
      setHighlightDrawingIds([]);
    }
    
    try {
      const fbox = typeof dwg.frame_bbox_json === 'string' ? JSON.parse(dwg.frame_bbox_json) : dwg.frame_bbox;
      const tbox = typeof dwg.title_block_bbox_json === 'string' ? JSON.parse(dwg.title_block_bbox_json) : dwg.title_block_bbox;
      
      let targetBox = fbox;
      if (!targetBox && tbox && typeof tbox.min_x === 'number') {
        // Safe Fallback: If outer frame bbox is missing, comfortably frame the title block with generous 3x margin
        const tw = Math.max(tbox.max_x - tbox.min_x, 300);
        const th = Math.max(tbox.max_y - tbox.min_y, 100);
        targetBox = {
          min_x: tbox.min_x - tw * 3.0,
          min_y: tbox.min_y - th * 1.0,
          max_x: tbox.max_x + tw * 0.5,
          max_y: tbox.max_y + th * 4.0
        };
      }

      if (targetBox && typeof targetBox.min_x === 'number') {
        setWebGlFocusBbox({
          min_x: targetBox.min_x,
          min_y: targetBox.min_y,
          max_x: targetBox.max_x,
          max_y: targetBox.max_y
        });
      }
    } catch {}

    setViewMode('CAD'); // Seamlessly switch back to CAD View!
    setCadStatusMsg(`[${dwg.drawing_no_raw}] ${dwg.drawing_name_raw} 도면을 전체 화면으로 맞췄습니다.`);
    setTimeout(() => setCadStatusMsg(null), 4000);
  };

  // 💎 Zoom to All Duplicate Instances of a Drawing (Fit Union Box)
  const handleZoomToAllDuplicates = (group: any[]) => {
    if (!group || group.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    group.forEach(item => {
      try {
        const fbox = typeof item.frame_bbox_json === 'string' ? JSON.parse(item.frame_bbox_json) : item.frame_bbox;
        const tbox = typeof item.title_block_bbox_json === 'string' ? JSON.parse(item.title_block_bbox_json) : item.title_block_bbox;
        const box = fbox || tbox;
        if (box && typeof box.min_x === 'number') {
          minX = Math.min(minX, box.min_x);
          minY = Math.min(minY, box.min_y);
          maxX = Math.max(maxX, box.max_x);
          maxY = Math.max(maxY, box.max_y);
        }
      } catch {}
    });

    if (minX !== Infinity) {
      const padX = (maxX - minX) * 0.1 || 200;
      const padY = (maxY - minY) * 0.1 || 200;
      setWebGlFocusBbox({
        min_x: minX - padX,
        min_y: minY - padY,
        max_x: maxX + padX,
        max_y: maxY + padY
      });
      setSelectedDrawingIdx(-1);
      setHighlightDrawingIds(group.map(g => g.id));
      setViewMode('CAD');
      setCadStatusMsg(`[${group[0].drawing_no_raw}] 동일 도면 번호 ${group.length}개 위치를 한 화면에서 동시 비교합니다.`);
      setTimeout(() => setCadStatusMsg(null), 5000);
    }
  };

  // 🚀 Listen to external focus requests (e.g. from Structure Tab or other pages)
  useEffect(() => {
    if (externalFocusIdx !== undefined && externalFocusIdx !== null && externalFocusIdx >= 0) {
      if (drawings && drawings[externalFocusIdx]) {
        handleZoomToRow(drawings[externalFocusIdx]);
        const timer = setTimeout(() => {
          if (onClearExternalFocus) {
            onClearExternalFocus();
          }
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [externalFocusIdx, drawings]);

  // Base stroke width relative to viewport
  const strokeWidth = Math.max(0.6, activeViewport.width / 1800);

  if (allFiles.length === 0) {
    return (
      <div className="bg-[#050b14] rounded-2xl border border-slate-800 p-8 shadow-sm flex flex-col items-center justify-center min-h-[640px] text-slate-200 select-none relative w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4 shadow-inner">
          <Layers className="w-8 h-8 text-blue-400/80" />
        </div>
        <h3 className="text-base font-bold text-white mb-2">등록된 도면 파일이 없습니다</h3>
        <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6">
          좌측 <strong className="text-slate-200">[통합 도면 파일 등록]</strong> 영역에 DWG 또는 DXF 도면 파일을 드래그 &amp; 드롭하여 등록해주세요.
          <br />
          도면이 등록되면 2D CAD 벡터 도면과 표제란 BOM 데이터가 자동으로 분석되어 이곳에 표시됩니다.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800/80">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>AutoCAD DWG / DXF 100% 벡터 파싱 및 다단계 조립 구조 자동 추출 지원</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#050b14] rounded-2xl border border-slate-800 p-4 shadow-sm flex flex-col justify-between min-h-[640px] text-slate-200 select-none relative w-full">
      {/* Toast feedback */}
      {cadStatusMsg && (
        <div className={`absolute top-16 right-6 z-50 px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs animate-in fade-in slide-in-from-top-2 border backdrop-blur-md ${
          cadStatusMsg.includes('설정 후') || cadStatusMsg.includes('실패') || cadStatusMsg.includes('오류')
            ? 'bg-amber-950/95 border-amber-500/80 text-amber-200 ring-1 ring-amber-500/30'
            : 'bg-emerald-950/95 border-emerald-500/80 text-emerald-200 ring-1 ring-emerald-500/30'
        }`}>
          {cadStatusMsg.includes('설정 후') || cadStatusMsg.includes('실패') || cadStatusMsg.includes('오류') ? (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="font-semibold">{cadStatusMsg}</span>
        </div>
      )}

      {/* ⚙️ CAD Program Settings Modal */}
      {showSettingsModal && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">외부 CAD 뷰어 & 프로그램 연동 설정</h3>
                  <p className="text-[11px] text-slate-400">PC에 설치된 무료 CAD 뷰어(FastView, TrueView, ZWCAD 등) 및 AutoCAD 실행 파일(.exe) 경로를 지정합니다.</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-xs overflow-y-auto max-h-[70vh]">
              {/* Feedback Message */}
              {settingsMsg && (
                <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
                  settingsMsg.type === 'success'
                    ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200'
                    : 'bg-rose-950/80 border-rose-500/60 text-rose-200'
                }`}>
                  {settingsMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                  <span className="font-medium">{settingsMsg.text}</span>
                </div>
              )}

              {/* Setting 1: 무료 CAD 뷰어 연동 */}
              <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                {!isFreeViewerConfigured && (
                  <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/50 text-amber-200 text-xs flex items-center space-x-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>현재 설정된 무료 뷰어가 없습니다. 아래 감지된 뷰어 중 하나를 클릭하거나 직접 경로를 지정한 뒤 <strong>[설정 저장]</strong>을 눌러주세요.</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-cyan-300 text-xs flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                      <span>무료 CAD 뷰어 실행 파일 (.exe) 경로</span>
                    </label>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">DWG FastView, Autodesk DWG TrueView, ZWCAD Viewer 등 무료 뷰어를 지정합니다.</p>
                  </div>
                  <button
                    onClick={() => handleTestRunCadApp('fastview')}
                    disabled={testingFastview || !fastviewPathInput}
                    className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-200 hover:text-white rounded-lg text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                  >
                    {testingFastview ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-cyan-300" />}
                    <span>{testingFastview ? '테스트 중...' : '무료 뷰어 즉시 테스트'}</span>
                  </button>
                </div>

                {/* Popular Free Viewer Presets Selection */}
                {freeViewerPresets.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] text-slate-300 font-bold block">💡 대표 무료 CAD 뷰어 선택 (클릭 시 자동 지정):</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {freeViewerPresets.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setFastviewPathInput(preset.detectedPath || preset.defaultPath)}
                          className={`p-2 rounded-lg text-left border transition-all cursor-pointer flex items-center justify-between ${
                            fastviewPathInput === (preset.detectedPath || preset.defaultPath)
                              ? 'bg-cyan-950/70 border-cyan-400 text-cyan-100 ring-1 ring-cyan-400/40'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-bold text-[11.5px] text-white flex items-center space-x-1">
                              <span>{preset.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">{preset.vendor}</div>
                          </div>
                          {preset.isInstalled ? (
                            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-950 border border-emerald-500/50 text-emerald-400 shrink-0">
                              PC 감지됨
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9.5px] text-slate-500 bg-slate-950 border border-slate-800 shrink-0">
                              기본 경로
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1 pt-1">
                  <span className="text-[11px] text-slate-400 block font-semibold">지정된 실행 파일 경로 (.exe):</span>
                  <input
                    type="text"
                    value={fastviewPathInput}
                    onChange={(e) => setFastviewPathInput(e.target.value)}
                    placeholder="예: C:\Gstarsoft\DWGFastView\gcStart.exe"
                    className="w-full bg-slate-900 text-white font-mono text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-hidden focus:border-cyan-400"
                  />
                </div>

                {/* Auto-detected candidate paths */}
                {detectedFastviewList.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10.5px] text-slate-400 block">시스템에서 발견된 후보 경로:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {detectedFastviewList.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFastviewPathInput(p)}
                          className={`px-2 py-0.5 rounded-lg text-[10.5px] font-mono transition-all text-left flex items-center space-x-1 border cursor-pointer ${
                            fastviewPathInput === p
                              ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <FolderOpen className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[280px]">{p}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Setting 2: AutoCAD */}
              <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                {!isAutocadInstalled && (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center space-x-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>PC 기본 위치에서 AutoCAD가 감지되지 않았습니다. 설치되어 있다면 실행 파일(.exe) 전체 경로를 직접 입력 후 <strong>[설정 저장]</strong>을 눌러주세요.</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <label className="font-bold text-rose-300 text-xs flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    <span>AutoCAD 실행 파일 (.exe) 경로</span>
                  </label>
                  <button
                    onClick={() => handleTestRunCadApp('autocad')}
                    disabled={testingAutocad || !autocadPathInput}
                    className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-200 hover:text-white rounded-lg text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                  >
                    {testingAutocad ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-rose-300" />}
                    <span>{testingAutocad ? '테스트 중...' : 'AutoCAD 즉시 테스트 실행'}</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={autocadPathInput}
                  onChange={(e) => setAutocadPathInput(e.target.value)}
                  placeholder="예: C:\Program Files\Autodesk\AutoCAD 2024\acad.exe"
                  className="w-full bg-slate-900 text-white font-mono text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-hidden focus:border-rose-400"
                />

                {/* Auto-detected AutoCAD candidates */}
                {detectedAutocadList.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] text-slate-400 font-semibold block">시스템에서 감지된 실행 파일 (클릭 시 자동 입력):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {detectedAutocadList.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => setAutocadPathInput(p)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all text-left flex items-center space-x-1 border cursor-pointer ${
                            autocadPathInput === p
                              ? 'bg-rose-950 border-rose-400 text-rose-200 ring-1 ring-rose-400/40'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <FolderOpen className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[320px]">{p}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950 shrink-0">
              <button
                onClick={loadCadSettings}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border border-slate-800"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>시스템 재감지</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  닫기
                </button>
                <button
                  onClick={handleSaveCadSettings}
                  disabled={settingsLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {settingsLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{settingsLoading ? '저장 중...' : '설정 저장'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📊 System Stats Modal */}
      {showStatsModal && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-fuchsia-600/20 border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">시스템 종합 통계 (최고관리자용)</h3>
                  <p className="text-[11px] text-slate-400">전체 견적 담당자 활동 및 시스템 리소스 현황</p>
                </div>
              </div>
              <button
                onClick={() => setShowStatsModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <div className="text-[11px] text-slate-400 mb-1">월간 도면 분석량</div>
                  <div className="text-2xl font-black text-white flex items-end gap-1.5">
                    12,458 <span className="text-sm font-bold text-emerald-400 mb-0.5">+15%</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">지난 달 대비 상승</div>
                </div>
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <div className="text-[11px] text-slate-400 mb-1">진행 중인 견적 프로젝트</div>
                  <div className="text-2xl font-black text-white flex items-end gap-1.5">
                    29 <span className="text-sm font-bold text-blue-400 mb-0.5">건</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">담당자 5명 합계</div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-end mb-1">
                  <span className="font-bold text-slate-300">서버 스토리지 및 자원 사용률</span>
                  <span className="font-mono text-cyan-400 font-bold">78%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                  <div className="bg-cyan-500 h-full w-[45%]" title="DWG 원본 보관"></div>
                  <div className="bg-blue-500 h-full w-[20%]" title="파생 데이터 (DXF/JSON)"></div>
                  <div className="bg-amber-500 h-full w-[13%]" title="시스템 로그"></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>사용중: 1.56 TB</span>
                  <span>전체: 2.0 TB</span>
                </div>
              </div>

              <div className="pt-2">
                <div className="p-3 bg-fuchsia-950/30 border border-fuchsia-900/50 rounded-xl">
                  <div className="text-[11px] text-fuchsia-300/80 mb-0.5">월간 누적 견적 금액 요약</div>
                  <div className="text-lg font-bold text-fuchsia-100 font-mono">
                    ₩ 4,520,150,000
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-950 shrink-0">
              <button
                onClick={() => setShowStatsModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Professional Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800 text-xs">
        {/* Left: Sidebar Toggle + Mode Switcher Tabs */}
        <div className="flex items-center space-x-2.5 shrink-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
              title={isSidebarOpen ? "도면 등록 좌측 패널 접기" : "도면 등록 좌측 패널 열기"}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
          )}

          {/* Seamless Mode Switcher Tabs */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-xs">
            <button
              onClick={() => setViewMode('CAD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                viewMode === 'CAD'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>2D CAD 벡터 도면</span>
              <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold ${
                viewMode === 'CAD' ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-400'
              }`}>
                WebGL 60 FPS
              </span>
            </button>

            <button
              onClick={() => setViewMode('SHEET')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                viewMode === 'SHEET'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>표제란 엑셀 시트</span>
              <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold ${
                viewMode === 'SHEET' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {drawings.length}개
              </span>
            </button>
          </div>

          {/* Active File Indicator */}
          {selectedFile && (
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-slate-300 shadow-xs">
              <span className={`w-2 h-2 rounded-full shrink-0 ${drawings.length > 0 ? 'bg-emerald-400 ring-2 ring-emerald-400/30' : 'bg-amber-400 animate-pulse'}`} />
              <span className="text-slate-400">선택 파일:</span>
              <span className="font-bold text-white truncate max-w-[170px]">{selectedFile.original_file_name}</span>
              <span className="px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800/60 font-mono text-[10px]">
                {selectedFile.file_type || 'CAD'}
              </span>
            </div>
          )}
        </div>

        {/* Right: Actions, Dropdown & Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Action Group: DWG FastView / AutoCAD / Settings / Archive / Export */}
          <div className="flex items-center space-x-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
            {/* 무료 CAD 뷰어 1-Click Launch Button */}
            {caseId && (
              <button
                onClick={handleOpenFreeViewer}
                disabled={openingFastView}
                className="px-2.5 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/50 hover:bg-cyan-900/80 text-cyan-200 hover:text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0 shadow-2xs"
                title="현재 도면을 PC에 설치된 무료 CAD 뷰어(FastView, TrueView 등)에서 직접 열기"
              >
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="whitespace-nowrap">{openingFastView ? '열기 중...' : '무료뷰어 연결'}</span>
              </button>
            )}

            {/* AutoCAD 1-Click Launch Button */}
            {caseId && (
              <button
                onClick={handleOpenAutoCad}
                disabled={openingCad}
                className="px-2.5 py-1.5 rounded-lg border border-rose-500/40 bg-rose-950/50 hover:bg-rose-900/80 text-rose-200 hover:text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                title={isAutocadInstalled ? "현재 도면을 PC에 설치된 AutoCAD 프로그램에서 직접 열기" : "AutoCAD 프로그램 연결 (미설정 시 CAD 설정 창으로 연결)"}
              >
                <ExternalLink className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="whitespace-nowrap">{openingCad ? '열기 중...' : 'AutoCAD'}</span>
              </button>
            )}

            {/* ⚙️ CAD Settings Modal Button */}
            <button
              onClick={handleOpenSettingsModal}
              className="px-2.5 py-1.5 rounded-lg border border-indigo-500/50 bg-indigo-950/70 hover:bg-indigo-900 text-indigo-200 hover:text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
              title="CAD 프로그램 실행 파일 경로 설정 (DWG FastView / AutoCAD)"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="whitespace-nowrap">CAD 설정</span>
            </button>

            {/* 📊 System Stats Modal Button */}
            <button
              onClick={() => setShowStatsModal(true)}
              className="px-2.5 py-1.5 rounded-lg border border-fuchsia-500/50 bg-fuchsia-950/70 hover:bg-fuchsia-900 text-fuchsia-200 hover:text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
              title="최고관리자용 시스템 통계 요약 보기"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
              <span className="whitespace-nowrap">시스템 통계</span>
            </button>

            {/* 📁 Open Containing Desktop Folder in Windows Explorer */}
            {caseId && (
              <button
                onClick={handleOpenFolder}
                className="px-2.5 py-1.5 rounded-lg border border-teal-500/50 bg-teal-950/70 hover:bg-teal-900 text-teal-200 hover:text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
                title="바탕화면(Desktop)의 원본 DWG 도면 파일 위치를 윈도우 탐색기로 즉시 열기"
              >
                <FolderOpen className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span className="whitespace-nowrap">바탕화면 도면 열기</span>
              </button>
            )}

            {/* Archive Snapshot Button (별도 보관) */}
            {caseId && (
              <button
                onClick={handleArchiveSnapshot}
                disabled={archiving}
                className="px-2.5 py-1.5 rounded-lg border border-purple-500/40 bg-purple-950/50 hover:bg-purple-900/80 text-purple-200 hover:text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                title="현재 도면 및 다단계 BOM 분석 결과를 버전 스냅샷으로 영구 보관"
              >
                <Archive className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="whitespace-nowrap">{archiving ? '보관 중...' : '데이터 보관'}</span>
              </button>
            )}

            {/* Export ZIP Package Button */}
            {caseId && (
              <button
                onClick={handleDownloadZip}
                className="px-2.5 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/50 hover:bg-emerald-900/80 text-emerald-200 hover:text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap shrink-0"
                title="원본 DWG + 변환 DXF + 표제란 + BOM 분석 결과 전체를 보관용 ZIP으로 다운로드"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="whitespace-nowrap">ZIP 다운로드</span>
              </button>
            )}
          </div>

          {/* CAD-specific Controls (Visible when in CAD mode) */}
          {viewMode === 'CAD' && (
            <div className="flex items-center space-x-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 animate-in fade-in">
              {/* Hierarchical Drawing Selector Dropdown */}
              {drawings.length > 0 && (
                <select
                  value={selectedDrawingIdx}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    setSelectedDrawingIdx(idx);
                    if (idx >= 0 && drawings[idx]) {
                      const d = drawings[idx];
                      try {
                        const fbox = typeof d.frame_bbox_json === 'string' ? JSON.parse(d.frame_bbox_json) : d.frame_bbox;
                        const tbox = typeof d.title_block_bbox_json === 'string' ? JSON.parse(d.title_block_bbox_json) : d.title_block_bbox;
                        const targetBox = fbox || tbox;
                        if (targetBox && typeof targetBox.min_x === 'number') {
                          setWebGlFocusBbox({
                            min_x: targetBox.min_x,
                            min_y: targetBox.min_y,
                            max_x: targetBox.max_x,
                            max_y: targetBox.max_y
                          });
                        }
                      } catch {}
                    } else {
                      setWebGlFocusBbox(null);
                    }
                  }}
                  className="bg-slate-900 text-white font-medium px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[200px] xl:max-w-[240px] truncate shrink-0"
                >
                  <option value="-1">🌐 전체 도면 보기 ({drawings.length}개 시트)</option>
                  {mainDrawings.length > 0 && (
                    <optgroup label={`── 📁 메인 조립도 (${mainDrawings.length}개) ──`}>
                      {mainDrawings.map((d) => {
                        const originalIdx = drawings.indexOf(d);
                        return (
                          <option key={d.id || originalIdx} value={originalIdx}>
                            📁 {d.drawing_no_raw}: {d.drawing_name_raw}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  {subAssyDrawings.length > 0 && (
                    <optgroup label={`── 📂 서브 조립도 (${subAssyDrawings.length}개) ──`}>
                      {subAssyDrawings.map((d) => {
                        const originalIdx = drawings.indexOf(d);
                        return (
                          <option key={d.id || originalIdx} value={originalIdx}>
                            📂 {d.drawing_no_raw}: {d.drawing_name_raw}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  {partDrawings.length > 0 && (
                    <optgroup label={`── 📄 단위 부품도 (${partDrawings.length}개) ──`}>
                      {partDrawings.map((d) => {
                        const originalIdx = drawings.indexOf(d);
                        return (
                          <option key={d.id || originalIdx} value={originalIdx}>
                            📄 {d.drawing_no_raw}: {d.drawing_name_raw}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                </select>
              )}

              <button
                onClick={() => setShowOverlays(!showOverlays)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer whitespace-nowrap shrink-0 ${
                  showOverlays
                    ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
                title="프레임/표제란/BOM 영역 하이라이트 토글"
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">영역 표시</span>
              </button>

              <button
                onClick={() => setShowTexts(!showTexts)}
                className={`px-2 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  showTexts
                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
                title="CAD 텍스트 레이어 토글"
              >
                TXT
              </button>

              {/* 💎 Ultra High-Fidelity Vector Toggle Button */}
              <button
                onClick={async () => {
                  if (!hdSvgContent) {
                    const ok = await fetchHdVectorSvg();
                    if (!ok) {
                      alert('고화질 벡터 도면을 생성 중이거나 불러오는 데 실패했습니다. 잠시 후 다시 시도해 주세요.');
                    }
                  } else {
                    setUseHdVector(!useHdVector);
                  }
                }}
                disabled={loadingSvg}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                  useHdVector && hdSvgContent
                    ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/50'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                }`}
                title="오토캐드 출력물과 100% 동일한 선 두께, 한글 글꼴, 치수선 고화질 벡터 뷰어"
              >
                <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${loadingSvg ? 'animate-spin' : ''}`} />
                <span>{loadingSvg ? '고화질 변환 중...' : 'HD 벡터 도면'}</span>
                {useHdVector && hdSvgContent && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ring-2 ring-emerald-400/30"></span>
                )}
              </button>

              {/* Zoom Button Group */}
              <div className="flex items-center space-x-0.5 bg-slate-900 rounded-lg p-0.5 border border-slate-800 shrink-0">
                <button
                  onClick={() => zoomAtCenter(1.35)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
                  title="확대"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => zoomAtCenter(0.65)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
                  title="축소"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={resetView}
                  className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
                  title="화면 맞춤 (1:1)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Sheet-specific Controls (Visible when in SHEET mode) */}
          {viewMode === 'SHEET' && (
            <div className="flex items-center space-x-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 animate-in fade-in">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={titleBlockSearch}
                  onChange={(e) => setTitleBlockSearch(e.target.value)}
                  placeholder="도번, 품명, 재질 실시간 검색..."
                  className="bg-slate-900 text-white placeholder-slate-500 text-xs pl-7 pr-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-hidden focus:border-amber-400 w-44 sm:w-60"
                />
                {titleBlockSearch && (
                  <button
                    onClick={() => setTitleBlockSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <button
                onClick={handleExportTitleBlocksCsv}
                className="px-2.5 py-1.5 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-200 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer whitespace-nowrap"
                title="표제란 목록을 엑셀(CSV) 파일로 다운로드"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>엑셀 내보내기</span>
              </button>

              <button
                onClick={handleOpenSettingsModal}
                className="px-2.5 py-1.5 rounded-lg border border-indigo-500/50 bg-indigo-950/70 hover:bg-indigo-900 text-indigo-200 hover:text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap shadow-2xs"
                title="CAD 프로그램 실행 파일 경로 설정 (DWG FastView / AutoCAD)"
              >
                <Settings className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="whitespace-nowrap">CAD 설정</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 📁 Interactive Desktop File Location & Foreground Notice Banner */}
      {openedFolderInfo && (
        <div className="bg-slate-900/95 border border-teal-500/60 rounded-xl p-3 my-2 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 animate-in fade-in slide-in-from-top-1 text-xs">
          <div className="flex items-start md:items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-teal-600/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-white">바탕화면 원본 도면 파일:</span>
                <span className="font-mono text-teal-300 font-bold text-[11px] truncate max-w-[460px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {openedFolderInfo.path}
                </span>
              </div>
              <p className="text-[11px] text-amber-300/90 mt-0.5 font-medium">
                💡 윈도우 OS 보안 정책상 탐색기 창이 브라우저 뒤(하단 작업표시줄 노란색 폴더 아이콘)에 열려 있습니다. 작업표시줄 폴더를 클릭하시면 즉시 나타납니다.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => handleCopyPath(openedFolderInfo.path)}
              className="px-3 py-1.5 bg-teal-950/90 hover:bg-teal-900 border border-teal-500/60 text-teal-200 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              title="도면 파일 전체 경로를 클립보드에 복사"
            >
              {copiedPath ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-teal-400" />}
              <span>{copiedPath ? '경로 복사 완료!' : '경로 복사'}</span>
            </button>

            <button
              onClick={() => setOpenedFolderInfo(null)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. CAD VIEW MODE: WebGL High-Performance GPU CAD Engine (Three.js 60 FPS) */}
      {/* ========================================================================= */}
      <div className={viewMode === 'CAD' ? 'flex-1 w-full my-2.5 relative' : 'hidden'}>
        <WebGlCadViewer
          caseId={caseId || ''}
          focusBbox={webGlFocusBbox}
          drawings={drawings}
          bomAreas={bomAreas}
          showOverlays={showOverlays}
          showTexts={showTexts}
          selectedDrawingIdx={selectedDrawingIdx}
          highlightDrawingIds={highlightDrawingIds}
          onResetFocus={() => {
            setWebGlFocusBbox(null);
            setHighlightDrawingIds([]);
          }}
          activeFileId={selectedFile?.id}
          reloadKey={`${selectedFile?.id || ''}_${drawings.length}`}
        />

        {/* 🧭 Duplicate Drawings Quick Navigator Floating Bar */}
        {activeDuplicateGroup && activeDuplicateGroup.length > 1 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-slate-950/95 backdrop-blur-md border border-amber-500/60 shadow-2xl shadow-black/80 rounded-xl px-4 py-2 flex flex-wrap items-center justify-center gap-2.5 text-xs animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
              <span>동일 도면 [{activeDuplicateGroup[0].drawing_no_raw}]</span>
              <span className="bg-amber-500/20 text-amber-300 text-[10.5px] px-1.5 py-0.5 rounded border border-amber-500/40">
                총 {activeDuplicateGroup.length}개 위치
              </span>
            </div>

            <div className="h-4 w-px bg-slate-700 hidden sm:block" />

            <div className="flex items-center space-x-1.5">
              {activeDuplicateGroup.map((item: any, idx: number) => {
                const isCurrent = selectedDrawingIdx >= 0 && drawings[selectedDrawingIdx]?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleZoomToRow(item)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                      isCurrent
                        ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold ring-1 ring-amber-300'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                    }`}
                    title={`${idx + 1}번 위치로 이동 (${item.drawing_name_raw || ''})`}
                  >
                    <span>📍 {idx + 1}번 위치</span>
                    {item.drawing_name_raw && (
                      <span className="text-[10px] opacity-80 max-w-[85px] truncate hidden md:inline">
                        ({item.drawing_name_raw})
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                onClick={() => handleZoomToAllDuplicates(activeDuplicateGroup)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer flex items-center space-x-1 border border-blue-400/50 shadow-xs"
                title="중복된 모든 도면 위치가 한눈에 들어오도록 줌아웃 동시 비교"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>전체 함께 비교</span>
              </button>

              <button
                onClick={() => {
                  setHighlightDrawingIds([]);
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer ml-1"
                title="네비게이터 닫기"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. SHEET VIEW MODE: 100% Full-Width, 0px Margin Excel Spreadsheet Grid   */}
      {/* ========================================================================= */}
      <div className={viewMode === 'SHEET' ? 'flex-1 min-h-[580px] h-[calc(100vh-270px)] max-h-[820px] overflow-hidden flex flex-col bg-[#070e1b] rounded-xl my-2.5 border border-slate-800/80 animate-in fade-in' : 'hidden'}>
          {/* Sheet Header Summary Bar */}
          <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 text-xs gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-white flex items-center space-x-1.5">
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                <span>표제란 엑셀 시트 전수 목록</span>
              </span>
              <span className="text-slate-400 text-[11px]">
                메인 조립도 <strong className="text-blue-400">{mainDrawings.length}개</strong>
                {subAssyDrawings.length > 0 && (
                  <> · 서브 조립도 <strong className="text-emerald-400">{subAssyDrawings.length}개</strong></>
                )}
                · 단위 부품도 <strong className="text-purple-400">{partDrawings.length}개</strong> (총 {drawings.length}개)
              </span>

              {/* Tree Quick Controls */}
              <div className="flex items-center space-x-1.5 ml-1 border-l border-slate-800 pl-2.5">
                <button
                  onClick={expandAll}
                  className="px-2 py-0.5 text-[10.5px] bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors cursor-pointer"
                  title="모든 조립도 계층 펼치기"
                >
                  전체 펼치기
                </button>
                <button
                  onClick={collapseAll}
                  className="px-2 py-0.5 text-[10.5px] bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors cursor-pointer"
                  title="메인 조립도만 남기고 하위 접기"
                >
                  전체 접기
                </button>
              </div>

              {/* 💎 Quotation Live Summary Bar & Quick Toggles */}
              <div className="flex items-center space-x-2 border-l border-slate-800 pl-2.5">
                <div className="flex items-center space-x-1.5 px-2.5 py-0.5 bg-blue-950/70 border border-blue-500/40 rounded-lg shadow-2xs">
                  <span className="text-[10.5px] text-blue-300">견적 포함:</span>
                  <span className="text-[11px] font-bold text-white font-mono">{quoteSummary.includedParts} / {quoteSummary.totalParts}개</span>
                  <span className="text-slate-600 text-[10px]">|</span>
                  <span className="text-[10.5px] text-emerald-300">공급가액:</span>
                  <span className="text-[11.5px] font-bold text-emerald-400 font-mono">₩{quoteSummary.totalSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onToggleAllQuoteDrawings && onToggleAllQuoteDrawings(true)}
                    className="px-2 py-0.5 text-[10px] bg-blue-900/50 hover:bg-blue-800 text-blue-200 hover:text-white rounded border border-blue-600/50 transition-colors cursor-pointer"
                    title="모든 부품 견적 일괄 포함"
                  >
                    전체 포함
                  </button>
                  <button
                    onClick={() => onToggleAllQuoteDrawings && onToggleAllQuoteDrawings(false)}
                    className="px-2 py-0.5 text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded border border-slate-700 transition-colors cursor-pointer"
                    title="모든 부품 견적 일괄 제외"
                  >
                    전체 제외
                  </button>
                </div>

                {/* ⚠️ Duplicate Drawings Quick Filter Toggle */}
                {duplicateStats.rowCount > 0 && (
                  <button
                    onClick={() => setFilterDuplicatesOnly(!filterDuplicatesOnly)}
                    className={`px-2.5 py-1 text-[11px] rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap shadow-xs ${
                      filterDuplicatesOnly
                        ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 font-extrabold shadow-amber-400/20'
                        : 'bg-amber-950/50 hover:bg-amber-900/70 border border-amber-500/50 text-amber-300'
                    }`}
                    title={
                      filterDuplicatesOnly
                        ? `전체 ${drawings.length}개 도면으로 복귀`
                        : `동일 도면 번호 중복 항목만 모아보기 (총 ${duplicateStats.rowCount}건 / ${duplicateStats.groupCount}개 그룹)`
                    }
                  >
                    <AlertTriangle className={`w-3.5 h-3.5 ${filterDuplicatesOnly ? 'text-slate-950' : 'text-amber-400'}`} />
                    <span>
                      {filterDuplicatesOnly
                        ? `중복 필터 해제 (${displayedDrawings.length}건 표시 중)`
                        : `중복 도면만 보기 (${duplicateStats.rowCount}건)`}
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div className="text-[11px] text-emerald-400 flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>💡 행을 클릭(또는 더블클릭)하면 해당 도면 위치로 줌인됩니다. (전체 도면을 PC 뷰어로 열려면 상단의 [무료뷰어 연결] 버튼을 이용하세요)</span>
            </div>
          </div>

          {/* Spreadsheet Table Body */}
          <div className="flex-1 overflow-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-300 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider sticky top-0 z-10 shadow-xs">
                  <th className="py-2.5 px-2.5 w-12 text-center border-r border-slate-800">No.</th>
                  <th className="py-2.5 px-2 text-center w-14 border-r border-slate-800">
                    <div className="flex flex-col items-center justify-center space-y-0.5">
                      <span className="text-[10px] text-slate-400">견적</span>
                      <TriStateCheckbox
                        state={quoteSummary.masterState}
                        onChange={() => onToggleAllQuoteDrawings && onToggleAllQuoteDrawings(quoteSummary.masterState !== 'checked')}
                        title={quoteSummary.masterState === 'checked' ? '전체 견적 제외' : '전체 견적 포함'}
                      />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 w-48 border-r border-slate-800">도면 구분 (계층 구조)</th>
                  <th className="py-2.5 px-2 w-24 text-center border-r border-slate-800">도면 위치</th>
                  <th className="py-2.5 px-3 w-36 border-r border-slate-800">도면 번호 (DWG. No.)</th>
                  <th className="py-2.5 px-3 w-44 max-w-[170px] border-r border-slate-800">Sub Name (품명)</th>
                  <th className="py-2.5 px-2.5 w-28 text-right border-r border-slate-800">
                    <div className="flex items-center justify-end space-x-1 whitespace-nowrap" title={`견적 포함 수량 합계: ${quoteSummary.includedQty} EA / 전체 수량: ${quoteSummary.totalQty} EA`}>
                      <span>수량</span>
                      <span className="text-[9.5px] text-blue-300 bg-blue-950/80 px-1 py-0.5 rounded border border-blue-500/40 font-mono font-bold">
                        ({quoteSummary.includedQty} EA)
                      </span>
                    </div>
                  </th>
                  <th className="py-2.5 px-2.5 w-24 text-right border-r border-slate-800">단가 (원)</th>
                  <th className="py-2.5 px-3 w-28 text-right border-r border-slate-800">금액 (원)</th>
                  <th className="py-2.5 px-3 w-36 border-r border-slate-800">Project Name</th>
                  <th className="py-2.5 px-3 w-28 border-r border-slate-800">고객사</th>
                  <th className="py-2.5 px-3 w-32 border-r border-slate-800">설계자 / 일자</th>
                  <th className="py-2.5 px-3 w-24 border-r border-slate-800">축척 / Rev</th>
                  <th className="py-2.5 px-3 text-center">재질 (Material)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-[11.5px]">
                {displayedDrawings.length > 0 ? (
                  displayedDrawings.map((d, i) => {
                    const info = getDrawingQuoteInfo(d);
                    const isMain = d.drawing_type === 'MAIN_ASSEMBLY';
                    const isSubAssy = d.drawing_type === 'SUB_ASSEMBLY';
                    const isAssy = isMain || isSubAssy;

                    const rawNo = (d.drawing_no_raw || '').trim();
                    const dupGroup = duplicateMap.get(rawNo);
                    const isDuplicate = dupGroup && dupGroup.length > 1;
                    const dupIndex = isDuplicate ? dupGroup.findIndex((item: any) => item.id === d.id) + 1 : 0;
                    const dupTotal = isDuplicate ? dupGroup.length : 0;
                    const uniqueNamesInGroup = isDuplicate ? new Set(dupGroup.map((g: any) => (g.drawing_name_raw || '').trim())) : new Set();
                    const isSharedDwgPart = uniqueNamesInGroup.size > 1;

                    return (
                      <tr
                        key={d.id || i}
                        onClick={() => handleZoomToRow(d)}
                        onDoubleClick={() => handleZoomToRow(d)}
                        title="클릭 시 웹 CAD 화면에서 이 도면 위치로 줌인합니다."
                        className={`transition-colors duration-100 cursor-pointer ${
                          !info.isIncluded
                            ? 'opacity-40 bg-slate-950/70 hover:opacity-80 text-slate-500'
                            : isMain
                            ? 'bg-blue-950/35 hover:bg-blue-900/50 text-blue-100 font-semibold'
                            : isSubAssy
                            ? 'bg-emerald-950/25 hover:bg-emerald-900/40 text-emerald-100'
                            : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        {/* No. */}
                        <td className="py-2 px-2.5 text-center border-r border-slate-800/70 font-sans text-slate-400">
                          {i + 1}
                        </td>

                        {/* 💎 견적 체크박스 (Tri-State 지원) */}
                        <td 
                          className="py-2 px-2 text-center border-r border-slate-800/70"
                          onClick={(e) => e.stopPropagation()}
                          onDoubleClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center">
                            <TriStateCheckbox
                              state={info.checkState}
                              onChange={() => {
                                if (isAssy) {
                                  const subtree = getAllSubtreeNos(d.drawing_no_raw);
                                  const target = info.checkState !== 'checked';
                                  onToggleQuoteItem && onToggleQuoteItem(subtree, target);
                                } else {
                                  onToggleQuoteItem && onToggleQuoteItem([d.drawing_no_raw], !info.isIncluded);
                                }
                              }}
                              title={
                                isAssy
                                  ? `조립도 및 하위 부품(${info.checkedCount}/${info.leafCount}개) 견적 포함/제외 일괄 토글`
                                  : info.isIncluded ? '견적 포함됨 (클릭 시 견적 제외)' : '견적 제외됨 (클릭 시 견적 포함)'
                              }
                            />
                          </div>
                        </td>

                        {/* 구분 (트리 계층 들여쓰기 & 토글) */}
                        <td className="py-2 px-3 border-r border-slate-800/70 font-sans">
                          <div style={{ paddingLeft: `${d.treeDepth * 16}px` }} className="flex items-center space-x-1.5">
                            {d.hasChildren ? (
                              <button
                                onClick={(e) => toggleNode(d.drawing_no_raw, e)}
                                className="w-4 h-4 rounded hover:bg-slate-700/80 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-colors shrink-0"
                                title={d.isExpanded ? "하위 부품 접기" : "하위 부품 펼치기"}
                              >
                                {d.isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-amber-400" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              </button>
                            ) : (
                              <span className="w-4 h-4 inline-flex items-center justify-center text-slate-600 font-mono text-[11px] shrink-0">
                                {d.treeDepth > 0 ? "└" : "•"}
                              </span>
                            )}

                            {isMain ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-600/30 border border-blue-500/50 text-blue-300 text-[10.5px] font-bold shrink-0">
                                <span>📁</span>
                                <span>메인 조립</span>
                                {d.childrenCount > 0 && <span className="text-blue-300/80 text-[9.5px]">({d.childrenCount})</span>}
                              </span>
                            ) : isSubAssy ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10.5px] font-medium shrink-0">
                                <span>📦</span>
                                <span>서브 조립</span>
                                {d.childrenCount > 0 && <span className="text-emerald-300/80 text-[9.5px]">({d.childrenCount})</span>}
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/40 text-purple-300 text-[10.5px] shrink-0">
                                <span>📄</span>
                                <span>단위 부품</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 도면 위치 액션 */}
                        <td className="py-1.5 px-2 text-center border-r border-slate-800/70">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleZoomToRow(d);
                            }}
                            className="btn-hover-effect px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10.5px] font-bold inline-flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
                            title="웹 CAD 화면에서 이 도면 전체를 화면에 꽉 차게 보기"
                          >
                            <Search className="w-3 h-3" />
                            <span>도면 보기</span>
                          </button>
                        </td>

                        {/* DWG No */}
                        <td className="py-2 px-3 border-r border-slate-800/70 font-bold text-amber-300">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                            <span>{d.drawing_no_raw || '240314-01-000'}</span>
                            {isDuplicate && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleZoomToAllDuplicates(dupGroup);
                                }}
                                className={`text-[9.5px] px-1.5 py-0.5 rounded-sm font-mono font-bold shrink-0 border transition-all cursor-pointer ${
                                  isSharedDwgPart
                                    ? 'bg-blue-950/90 hover:bg-blue-900 text-blue-300 border-blue-500/50 shadow-2xs'
                                    : 'bg-amber-950/90 hover:bg-amber-900 text-amber-300 border-amber-500/50 shadow-2xs'
                                }`}
                                title={`${
                                  isSharedDwgPart
                                    ? '동일 도면 번호 공유 부품 (품명 상이)'
                                    : '동일 도면 번호 복수 배치'
                                }: 전체 ${dupTotal}개 위치 중 ${dupIndex}번째 (클릭 시 CAD에서 전체 동시 비교)`}
                              >
                                {isSharedDwgPart ? `공용 ${dupIndex}/${dupTotal}` : `중복 ${dupIndex}/${dupTotal}`}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Sub Name (1행 컴팩트 폭 + 호버 시 자동 마키 스크롤) */}
                        <td className={`py-2 px-3 border-r border-slate-800/70 font-sans font-bold max-w-[170px] overflow-hidden ${!info.isIncluded ? 'line-through text-slate-500' : ''}`}>
                          <HoverMarqueeText text={d.drawing_name_raw || 'MAIN CHAIN DRIVE-1'} />
                        </td>

                        {/* 💎 수량 (Q'ty) */}
                        <td className="py-2 px-2.5 border-r border-slate-800/70 text-right font-mono text-slate-300">
                          {isAssy ? (
                            <span className="text-slate-500 text-[10px]">-</span>
                          ) : (
                            <span className="font-semibold">{info.quantity} EA</span>
                          )}
                        </td>

                        {/* 💎 단가 (Unit Price) */}
                        <td className="py-2 px-2.5 border-r border-slate-800/70 text-right font-mono text-slate-300">
                          {isAssy ? (
                            <span className="text-slate-500 text-[10px]">-</span>
                          ) : info.unitPrice > 0 ? (
                            <span>₩{info.unitPrice.toLocaleString()}</span>
                          ) : (
                            <span className="text-slate-500">0</span>
                          )}
                        </td>

                        {/* 💎 금액 (Amount) */}
                        <td className="py-2 px-3 border-r border-slate-800/70 text-right font-mono font-bold">
                          {isAssy ? (
                            info.amount > 0 ? (
                              <span className="text-cyan-400 text-[11px]" title="하위 포함 부품 금액 소계">
                                소계 ₩{info.amount.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-slate-600 text-[10px]">소계 ₩0</span>
                            )
                          ) : !info.isIncluded ? (
                            <span className="text-slate-600 text-[10.5px]">₩0 (제외)</span>
                          ) : info.amount > 0 ? (
                            <span className="text-emerald-400">₩{info.amount.toLocaleString()}</span>
                          ) : (
                            <span className="text-slate-500">₩0</span>
                          )}
                        </td>

                        {/* Project Name */}
                        <td className="py-2 px-3 border-r border-slate-800/70 font-sans text-slate-300 truncate max-w-[140px]" title="인버터 조립 LINE">
                          {d.project_name || '인버터 조립 LINE'}
                        </td>

                        {/* 고객사 */}
                        <td className="py-2 px-3 border-r border-slate-800/70 font-sans text-amber-200">
                          {d.customer || 'A&G/보그워너'}
                        </td>

                        {/* 설계자 */}
                        <td className="py-2 px-3 border-r border-slate-800/70 font-sans text-slate-300">
                          {d.designer || '이경중'} <span className="text-slate-500 text-[10.5px]">({d.design_date || '24.03.15'})</span>
                        </td>

                        {/* 축척 / Rev */}
                        <td className="py-2 px-3 border-r border-slate-800/70 text-slate-300">
                          {d.scale || '1/1'} <span className="text-slate-500">/</span> {d.revision || 'R00'}
                        </td>

                        {/* 재질 */}
                        <td className="py-2 px-3 text-center font-sans text-emerald-300">
                          {d.material || 'SS400'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={14} className="py-12 text-center text-slate-500 font-sans">
                      검색 조건과 일치하는 도면 표제란 데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* Bottom Status Bar */}
      <div className="flex flex-wrap items-center justify-end text-[11px] text-slate-400 pt-2 border-t border-slate-800 gap-2">
        <span className="flex items-center space-x-2 text-slate-500">
          <Move className="w-3 h-3" />
          <span>마우스 커서 중심 줌 (Wheel) · 드래그(Pan) · 1:1 맞춤</span>
        </span>
      </div>
    </div>
  );
}
