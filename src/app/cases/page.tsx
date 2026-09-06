'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import CaseWorkflowSidebar, { WorkflowTab } from '@/components/cases/CaseWorkflowSidebar';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Search,
  Building2,
  Folder,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  UploadCloud,
  FileCode2,
  Zap,
  Sliders,
  DollarSign,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  LayoutList,
  LayoutGrid,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  CheckSquare,
  Square,
  Minus,
  X
} from 'lucide-react';

type SortField = 'date' | 'amount' | 'drawings' | 'bom' | 'case_no' | 'case_name';
type SortDirection = 'asc' | 'desc';

// Korean Chosung Search Helper
const CHOSUNG_LIST = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

function getChosung(str: string): string {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i) - 0xac00;
    if (code >= 0 && code <= 11171) {
      result += CHOSUNG_LIST[Math.floor(code / 588)];
    } else {
      result += str.charAt(i);
    }
  }
  return result;
}

function matchHangulSearch(target: string, query: string): boolean {
  if (!target) return false;
  const lowerTarget = target.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return true;
  if (lowerTarget.includes(lowerQuery)) return true;
  const chosungTarget = getChosung(lowerTarget);
  const chosungQuery = getChosung(lowerQuery);
  return chosungTarget.includes(chosungQuery);
}

export default function CasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [caseName, setCaseName] = useState('');
  const [companyId, setCompanyId] = useState('comp_001');
  const [projectId, setProjectId] = useState('proj_001');
  const [submitting, setSubmitting] = useState(false);

  // Filter & Search States
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'READY_FOR_QUOTE' | 'ANALYZED' | 'PENDING' | 'PRIVATE_APPROVAL' | 'SECURE_VAULT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterManager, setFilterManager] = useState('ALL');
  const [filterCompany, setFilterCompany] = useState('ALL');

  // Enterprise View, Sorting & Pagination States
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARD'>('TABLE');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);

  // Drag & Drop Quick Upload States
  const [isDragging, setIsDragging] = useState(false);
  const [quickUploading, setQuickUploading] = useState(false);
  const [quickUploadStatus, setQuickUploadStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const fetchCases = async () => {
    try {
      const res = await fetch('/api/quotation-cases');
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases || []);
      }
    } catch {
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  // Reset pagination when search, tab, or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTab, searchQuery, pageSize]);

  // Quick DWG Upload & Auto Case Creation Handler
  const handleQuickUploadFile = async (file: File) => {
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.dwg', '.dxf'].includes(ext)) {
      alert('CAD 도면 파일(.dwg 또는 .dxf)만 업로드할 수 있습니다.');
      return;
    }

    setQuickUploading(true);
    setQuickUploadStatus(`'${file.name}' 도면으로 신규 견적 프로젝트 생성 중...`);

    try {
      // 1. Create a new case automatically
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      const autoCaseName = `${cleanName} 견적의뢰 (DWG 자동분석)`;
      const createRes = await fetch('/api/quotation-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: 'comp_001',
          projectId: 'proj_001',
          caseName: autoCaseName
        })
      });

      if (!createRes.ok) {
        throw new Error('신규 견적 프로젝트 생성에 실패했습니다.');
      }
      const createData = await createRes.json();
      const newCaseId = createData.caseId;

      // 2. Upload the DWG file to the new case
      setQuickUploadStatus(`'${file.name}' DWG 도면 업로드 및 저장 중...`);
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch(`/api/quotation-cases/${newCaseId}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) {
        throw new Error('도면 파일 업로드에 실패했습니다.');
      }

      // 3. Immediately redirect to the case workbench
      setQuickUploadStatus('워크벤치로 이동 중...');
      router.push(`/cases/${newCaseId}`);
    } catch (err: any) {
      alert(err.message || '빠른 도면 등록 중 오류가 발생했습니다.');
      setQuickUploading(false);
    }
  };

    const handleBatchUploadPrompt = () => {
    if (confirm('도면이 여러 개인 경우:\n\n1. [확인]: 하나의 견적건으로 묶어서 처리 (통합 BOM 합산)\n2. [취소]: 각각 개별 견적건으로 쪼개서 처리')) {
      alert('[통합 견적 처리 모드] 여러 도면의 BOM을 하나로 합산합니다. (개발 예정)');
    } else {
      alert('[개별 견적 처리 모드] 각 도면마다 별도의 견적건을 생성합니다. (개발 예정)');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleQuickUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleManualCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/quotation-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, projectId, caseName })
      });
      if (res.ok) {
        setShowModal(false);
        setCaseName('');
        fetchCases();
      }
    } finally {
      setSubmitting(false);
    }
  };

  // KPI Calculations
  const uniqueManagers = Array.from(new Set(cases.map(c => c.created_by_user_id).filter(Boolean)));
  const uniqueCompanies = Array.from(new Set(cases.map(c => c.company_name).filter(Boolean)));
  
  const secureVaultCount = cases.filter(c => c.visibility === 'PRIVATE').length;
  
  const totalCasesCount = cases.length;
  const readyCount = cases.filter(c => c.quote_readiness === 'READY_FOR_QUOTE').length;
  const analyzedCount = cases.filter(c => c.status === 'ANALYZED' && c.quote_readiness !== 'READY_FOR_QUOTE').length;
  const pendingCount = cases.filter(c => c.status !== 'ANALYZED' && c.quote_readiness !== 'READY_FOR_QUOTE').length;
  const pendingApprovalCount = cases.filter(c => c.visibility === 'PRIVATE_PENDING').length;

  const totalDrawingsSum = cases.reduce((acc, c) => acc + (c.drawings_count || c.files_count || 0), 0);
  const totalBomItemsSum = cases.reduce((acc, c) => acc + (c.bom_items_count || 0), 0);
  const totalQuotedAmountSum = cases.reduce((acc, c) => acc + (c.quote_total_amount || 0), 0);

  // Filtered cases list
  const filteredCases = cases.filter(c => {
    if (selectedTab === 'READY_FOR_QUOTE' && c.quote_readiness !== 'READY_FOR_QUOTE') return false;
    if (selectedTab === 'ANALYZED' && (c.status !== 'ANALYZED' || c.quote_readiness === 'READY_FOR_QUOTE')) return false;
    if (selectedTab === 'PENDING' && (c.status === 'ANALYZED' || c.quote_readiness === 'READY_FOR_QUOTE')) return false;
    if (selectedTab === 'PRIVATE_APPROVAL' && c.visibility !== 'PRIVATE_PENDING') return false;
    if (selectedTab === 'SECURE_VAULT' && c.visibility !== 'PRIVATE') return false;
    
    if (filterManager !== 'ALL' && c.created_by_user_id !== filterManager) return false;
    if (filterCompany !== 'ALL' && c.company_name !== filterCompany) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      const matchName = matchHangulSearch(c.case_name || '', q);
      const matchNo = matchHangulSearch(c.case_no || '', q);
      const matchComp = matchHangulSearch(c.company_name || '', q);
      const matchProj = matchHangulSearch(c.project_name || '', q);
      return matchName || matchNo || matchComp || matchProj;
    }
    return true;
  });

  // Sorting
  const sortedCases = [...filteredCases].sort((a, b) => {
    let valA: any = 0;
    let valB: any = 0;
    switch (sortField) {
      case 'date':
        valA = new Date(a.request_date || a.created_at || 0).getTime();
        valB = new Date(b.request_date || b.created_at || 0).getTime();
        break;
      case 'amount':
        valA = Number(a.quote_total_amount || 0);
        valB = Number(b.quote_total_amount || 0);
        break;
      case 'drawings':
        valA = Number(a.drawings_count || a.files_count || 0);
        valB = Number(b.drawings_count || b.files_count || 0);
        break;
      case 'bom':
        valA = Number(a.bom_items_count || 0);
        valB = Number(b.bom_items_count || 0);
        break;
      case 'case_no':
        valA = a.case_no || '';
        valB = b.case_no || '';
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      case 'case_name':
        valA = a.case_name || '';
        valB = b.case_name || '';
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    if (sortDirection === 'asc') return valA > valB ? 1 : valA < valB ? -1 : 0;
    return valA < valB ? 1 : valA > valB ? -1 : 0;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedCases.length / pageSize));
  const paginatedCases = sortedCases.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Subtotal for filtered set
  const filteredTotalAmount = filteredCases.reduce((acc, c) => acc + (c.quote_total_amount || 0), 0);

  // Selection handlers
  const pageIds = paginatedCases.map(c => c.id);
  const isAllPageSelected = pageIds.length > 0 && pageIds.every(id => selectedCaseIds.includes(id));
  const isSomePageSelected = pageIds.some(id => selectedCaseIds.includes(id)) && !isAllPageSelected;

  const handleToggleSelectAll = () => {
    if (isAllPageSelected) {
      setSelectedCaseIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedCaseIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCaseIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 ml-1 inline" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600 ml-1 inline" />
    );
  };

  const myRecentCases = user ? cases.filter(c => c.created_by_user_id === user.userId) : [];
  const recentCase = myRecentCases.length > 0 ? myRecentCases[0] : null;

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Quick Upload Progress Overlay */}
      {quickUploading && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[4px] p-8 max-w-md w-full shadow-2xl text-center space-y-4 border border-slate-200">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[3px] flex items-center justify-center mx-auto shadow-inner">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">DWG 쾌속 견적 프로젝트 생성</h3>
              <p className="text-xs text-slate-500 mt-1">{quickUploadStatus}</p>
            </div>
            <div className="w-full bg-slate-100 rounded-[2px] h-2 overflow-hidden">
              <div className="bg-blue-600 h-2 rounded-[2px] animate-pulse w-3/4"></div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input for Dropzone */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".dwg,.dxf"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleQuickUploadFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* Zone 2: 3-Step BOM Automation Guide & Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1 */}
        <div className="bg-white p-5 rounded-[4px] border border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="w-7 h-7 rounded-[3px] bg-blue-100 text-blue-700 text-xs font-extrabold flex items-center justify-center">
              1
            </span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-[3px]">CAD 분석</span>
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm mt-3">CAD DWG 자동 분석</h3>
          <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
            도면 외곽선, 표제란, BOM 테이블 영역 자동 검출 및 2D 벡터/3D WebGL 변환
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>분석된 도면</span>
            <span className="font-mono font-extrabold text-sm text-slate-900">{totalDrawingsSum.toLocaleString()} 장</span>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white p-5 rounded-[4px] border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="w-7 h-7 rounded-[3px] bg-emerald-100 text-emerald-700 text-xs font-extrabold flex items-center justify-center">
              2
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-[3px]">단가 최적화</span>
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm mt-3">AI 단가 최적화 매칭</h3>
          <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
            사내 마스터 단가 자동 조회 및 누적된 Manual Price 1-클릭 일괄 적용
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>정규화된 BOM 부품</span>
            <span className="font-mono font-extrabold text-sm text-emerald-600">{totalBomItemsSum.toLocaleString()} 개</span>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white p-5 rounded-[4px] border border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="w-7 h-7 rounded-[3px] bg-teal-100 text-teal-700 text-xs font-extrabold flex items-center justify-center">
              3
            </span>
            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-[3px]">견적서 발행</span>
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm mt-3">표준 엑셀 견적서 발행</h3>
          <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
            인쇄용 표준 화이트 양식 출력 및 공인 비즈니스 엑셀 서식 즉시 다운로드
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>누적 견적 총액</span>
            <span className="font-mono font-extrabold text-sm text-teal-700">{totalQuotedAmountSum.toLocaleString()} 원</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Workflow Layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Left Column: Vertical Workflow Pipeline Sidebar (With Integrated Drag & Drop Zone) */}
        <CaseWorkflowSidebar
          selectedTab={selectedTab}
          onSelectTab={setSelectedTab}
          counts={{
            total: totalCasesCount,
            pending: pendingCount,
            analyzed: analyzedCount,
            ready: readyCount,
            pendingApproval: pendingApprovalCount,
            secureVault: secureVaultCount,
          }}
          user={user}
          onSingleUploadClick={() => fileInputRef.current?.click()}
          onBatchUploadClick={handleBatchUploadPrompt}
          isDragging={isDragging}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        />

        {/* Right Column: Main Workbench */}
        <div className="flex-1 min-w-0 space-y-4 w-full">
{/* Zone 3: Quick Resume Widget */}
      {recentCase && (
        <div className="bg-slate-900 text-white rounded-[4px] p-5 sm:p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-11 h-11 rounded-[3px] bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <Zap className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-blue-400 font-mono">{recentCase.case_no}</span>
                <span className="text-xs font-bold bg-blue-900/60 text-blue-200 px-2.5 py-0.5 rounded-[3px] border border-blue-700/50">
                  {user ? `${user.name} 영업담당님의 최근 작업 건` : '최근 작업 건'}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white mt-1 line-clamp-1">
                {recentCase.case_name}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-100 mt-1.5 font-medium">
                <span className="flex items-center space-x-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-300" />
                  <span className="font-semibold text-white">{recentCase.company_name}</span>
                </span>
                <span className="text-slate-500">•</span>
                <span>도면 <strong className="text-white font-bold">{recentCase.drawings_count || recentCase.files_count || 0}</strong>장</span>
                <span className="text-slate-500">•</span>
                <span>BOM 부품 <strong className="text-white font-bold">{recentCase.bom_items_count || 0}</strong>개</span>
                <span className="text-slate-500">•</span>
                <span className="text-blue-200 font-bold">
                  견적액: {recentCase.quote_total_amount ? `${Number(recentCase.quote_total_amount).toLocaleString()}원` : '산출 진행 중'}
                </span>
              </div>
            </div>
          </div>

          <Link
            href={`/cases/${recentCase.id}`}
            className="btn-hover-effect px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-[3px] text-xs font-extrabold shadow-sm transition-all flex items-center justify-center space-x-2 shrink-0 self-start md:self-auto cursor-pointer group"
          >
            <span>이어서 견적 작업하기</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}

      {/* Zone 4: Enterprise High-Density Table / Card Grid Section */}
      <div className="space-y-3.5">
        {/* Top Control Toolbar */}
        <div className="bg-white p-3.5 rounded-[4px] border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pb-1 lg:pb-0">
            <button
              onClick={() => setSelectedTab('ALL')}
              className={`btn-hover-effect-tab px-3 py-1.5 rounded-[3px] text-xs font-bold transition-all cursor-pointer shrink-0 ${
                selectedTab === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              전체 ({totalCasesCount})
            </button>
            <button
              onClick={() => setSelectedTab('READY_FOR_QUOTE')}
              className={`btn-hover-effect-tab px-3 py-1.5 rounded-[3px] text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center space-x-1 ${
                selectedTab === 'READY_FOR_QUOTE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700'
              }`}
            >
              <span>견적준비완료 ({readyCount})</span>
            </button>
            <button
              onClick={() => setSelectedTab('ANALYZED')}
              className={`btn-hover-effect-tab px-3 py-1.5 rounded-[3px] text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center space-x-1 ${
                selectedTab === 'ANALYZED'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700'
              }`}
            >
              <span>분석완료 ({analyzedCount})</span>
            </button>
            <button
              onClick={() => setSelectedTab('PENDING')}
              className={`btn-hover-effect-tab px-3 py-1.5 rounded-[3px] text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center space-x-1 ${
                selectedTab === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700'
              }`}
            >
              <span>도면대기 ({pendingCount})</span>
            </button>
            {user?.role === 'SUPER_ADMIN' && (
              <>
                <button
                  onClick={() => setSelectedTab('PRIVATE_APPROVAL')}
                  className={`btn-hover-effect-tab px-3 py-1.5 rounded-[3px] text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center space-x-1 ${
                    selectedTab === 'PRIVATE_APPROVAL'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700'
                  }`}
                >
                  <span>결재 대기 ({pendingApprovalCount})</span>
                </button>
                <button
                  onClick={() => setSelectedTab('SECURE_VAULT')}
                  className={`btn-hover-effect-tab px-3 py-1.5 rounded-[3px] text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center space-x-1 ${
                    selectedTab === 'SECURE_VAULT'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <span>🔒 보안 견적함 ({secureVaultCount})</span>
                </button>
              </>
            )}
          </div>

          {/* Right Controls: Search, Rows Per Page, View Mode Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            
              {/* Filters */}
              <div className="flex space-x-2">
                <select
                  value={filterManager}
                  onChange={e => setFilterManager(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-[120px]"
                >
                  <option value="ALL">👤 모든 담당자</option>
                  {uniqueManagers.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select
                  value={filterCompany}
                  onChange={e => setFilterCompany(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-[140px]"
                >
                  <option value="ALL">🏢 모든 고객사</option>
                  {uniqueCompanies.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Search Box */}
            <div className="relative min-w-[240px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="고객사, 프로젝트, 관리번호 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8.5 pr-8 py-1.5 bg-white border border-slate-300 rounded-[3px] text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors font-medium shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  title="검색어 초기화"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              </div>

            {/* Page Size Selector */}
            <div className="flex items-center space-x-1 bg-white border border-slate-300 rounded-[3px] px-2.5 py-1 shadow-2xs">
              <span className="text-xs font-semibold text-slate-600">보기:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none focus:outline-none cursor-pointer"
              >
                <option value={15}>15건</option>
                <option value={20}>20건</option>
                <option value={50}>50건</option>
                <option value={100}>100건</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-[3px] border border-slate-200">
              <button
                onClick={() => setViewMode('TABLE')}
                title="대량 견적에 최적화된 고밀도 테이블 목록"
                className={`btn-hover-effect-tab flex items-center space-x-1 px-3 py-1.5 rounded-[2px] text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'TABLE'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutList className="w-4 h-4" />
                <span className="hidden sm:inline">테이블 목록</span>
              </button>
              <button
                onClick={() => setViewMode('CARD')}
                title="카드 그리드 형식"
                className={`btn-hover-effect-tab flex items-center space-x-1 px-3 py-1.5 rounded-[2px] text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'CARD'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">카드 뷰</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sub-bar: Filtering Summary & Bulk Selection Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-700 font-medium bg-slate-50 px-4 py-2.5 rounded-[3px] border border-slate-200/80 gap-2">
          <div className="flex items-center flex-wrap gap-2">
            <span>
              조회 결과: <strong className="text-slate-900 font-bold">{filteredCases.length}건</strong>
              {filteredCases.length !== totalCasesCount && ` (전체 ${totalCasesCount}건 중)`}
            </span>
            <span className="text-slate-400">•</span>
            <span>
              합산 견적액: <strong className="text-blue-700 font-mono font-bold text-sm">₩{filteredTotalAmount.toLocaleString()}</strong>
            </span>

            {selectedCaseIds.length > 0 && (
              <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-[3px] font-bold text-xs ml-2">
                <span>✓ {selectedCaseIds.length}건 선택됨</span>
                <button
                  onClick={() => setSelectedCaseIds([])}
                  className="text-xs underline hover:text-blue-900 cursor-pointer ml-1 font-semibold"
                >
                  선택 해제
                </button>
              </div>
            )}
          </div>

          <div className="text-slate-700 font-semibold">
            {filteredCases.length > 0 && (
              <span>
                {currentPage} / {totalPages} 페이지 (
                {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredCases.length)}건 표시)
              </span>
            )}
          </div>
        </div>

        {/* Main Data Container */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 font-medium bg-white rounded-[4px] border border-slate-200">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <span>견적 프로젝트 데이터 로딩 중...</span>
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[4px] border border-slate-200 shadow-xs">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-bold text-sm">등록된 견적 프로젝트가 없습니다.</p>
            <p className="text-slate-400 text-xs mt-1">상단의 DWG 퀵 드롭존을 이용해 첫 도면을 등록해 보세요.</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-[3px] text-xs font-bold transition-colors cursor-pointer"
            >
              DWG 도면 파일 등록하기
            </button>
          </div>
        ) : viewMode === 'TABLE' ? (
          /* Enterprise High-Density Data Grid Table */
          <div className="bg-white rounded-[4px] border border-slate-200 shadow-xs overflow-hidden min-h-[340px]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-xs font-extrabold text-slate-800 select-none">
                    <th className="py-3 px-3.5 w-10 text-center">
                      <button
                        onClick={handleToggleSelectAll}
                        className="cursor-pointer text-slate-400 hover:text-slate-700 flex items-center justify-center mx-auto"
                        title={isAllPageSelected ? '현재 페이지 전체 해제' : '현재 페이지 전체 선택'}
                      >
                        {isAllPageSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : isSomePageSelected ? (
                          <Minus className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th
                      onClick={() => handleSort('case_no')}
                      className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors w-36 whitespace-nowrap group"
                    >
                      <span>관리번호</span>
                      {renderSortIndicator('case_no')}
                    </th>
                    <th
                      onClick={() => handleSort('case_name')}
                      className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors group"
                    >
                      <span>견적의뢰 건명</span>
                      {renderSortIndicator('case_name')}
                    </th>
                    <th className="py-3 px-3.5 w-52 whitespace-nowrap">
                      <span>고객사 / 프로젝트</span>
                    </th>
                    <th className="py-3 px-3.5 w-32 text-center whitespace-nowrap">
                      <span>진행 상태</span>
                    </th>
                    <th
                      onClick={() => handleSort('drawings')}
                      className="py-3 px-3.5 text-center cursor-pointer hover:bg-slate-100 transition-colors w-20 whitespace-nowrap group"
                    >
                      <span>도면수</span>
                      {renderSortIndicator('drawings')}
                    </th>
                    <th
                      onClick={() => handleSort('bom')}
                      className="py-3 px-3.5 text-center cursor-pointer hover:bg-slate-100 transition-colors w-24 whitespace-nowrap group"
                    >
                      <span>BOM품목</span>
                      {renderSortIndicator('bom')}
                    </th>
                    <th
                      onClick={() => handleSort('amount')}
                      className="py-3 px-3.5 text-right cursor-pointer hover:bg-slate-100 transition-colors w-36 whitespace-nowrap group"
                    >
                      <span>견적 합계액</span>
                      {renderSortIndicator('amount')}
                    </th>
                    <th
                      onClick={() => handleSort('date')}
                      className="py-3 px-3.5 text-center cursor-pointer hover:bg-slate-100 transition-colors w-28 whitespace-nowrap group"
                    >
                      <span>의뢰일자</span>
                      {renderSortIndicator('date')}
                    </th>
                    <th className="py-3 px-3.5 text-center w-24 whitespace-nowrap">
                      <span>작업</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800 text-[13px]">
                  {paginatedCases.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-16 text-center text-slate-500">
                        <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-sm text-slate-700">
                          {searchQuery ? `'${searchQuery}' 검색 조건에 맞는 견적 건이 없습니다.` : '해당 필터 조건의 견적 건이 없습니다.'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          검색어나 상단 상태 탭을 변경해 보세요.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedCases.map((c) => {
                      const isSelected = selectedCaseIds.includes(c.id);
                      const isReady = c.quote_readiness === 'READY_FOR_QUOTE';
                      const isAnalyzed = c.status === 'ANALYZED';
                      const totalAmount = c.quote_total_amount;

                      return (
                        <tr
                          key={c.id}
                          onClick={() => router.push(`/cases/${c.id}`)}
                          className={`transition-colors cursor-pointer group ${
                            isSelected
                              ? 'bg-blue-50/70 hover:bg-blue-50'
                              : 'hover:bg-slate-50/90'
                          }`}
                        >
                          {/* Checkbox */}
                          <td
                            className="py-3 px-3.5 text-center"
                            onClick={(e) => handleToggleSelect(c.id, e)}
                          >
                            <div className="flex items-center justify-center">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
                              )}
                            </div>
                          </td>

                          {/* Case No */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-100 group-hover:bg-blue-100/60 text-slate-800 rounded-[3px] transition-colors">
                              {c.case_no}
                            </span>
                          </td>

                          {/* Case Name */}
                          <td className="py-3 px-3.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 text-[13.5px]">
                                {c.case_name}
                                </span>
                                {c.visibility === 'SHARED' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 shrink-0">사내 공유중</span>}
                                {c.visibility === 'PRIVATE_PENDING' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 shrink-0">비공개 심사</span>}
                                {c.visibility === 'PRIVATE' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 shrink-0">공개 불가</span>}
                              {c.id === recentCase?.id && (
                                <span className="px-2 py-0.5 rounded-[2px] text-[11px] font-bold bg-blue-100 text-blue-700 shrink-0">
                                  최근
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Customer & Project */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <div className="space-y-0.5">
                              <div className="font-bold text-slate-900 flex items-center space-x-1.5 text-[13px]">
                                <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="truncate max-w-[170px]">{c.company_name}</span>
                              </div>
                              <div className="text-xs text-slate-700 font-medium flex items-center space-x-1.5">
                                <Folder className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="truncate max-w-[170px]">{c.project_name}</span>
                              </div>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-3.5 text-center whitespace-nowrap">
                            <span
                              className={`inline-block text-xs font-bold px-2.5 py-1 rounded-[3px] border ${
                                isReady
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : isAnalyzed
                                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}
                            >
                              {isReady ? '견적준비완료' : isAnalyzed ? '분석완료' : '도면등록대기'}
                            </span>
                          </td>

                          {/* Drawings Count */}
                          <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-900 whitespace-nowrap text-[13px]">
                            {c.drawings_count || c.files_count || 0}
                            <span className="text-xs font-semibold text-slate-600 ml-0.5">장</span>
                          </td>

                          {/* BOM Items Count */}
                          <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-900 whitespace-nowrap text-[13px]">
                            {c.bom_items_count ? (
                              <span className="text-blue-700 font-extrabold">{c.bom_items_count}</span>
                            ) : (
                              <span className="text-slate-400 font-normal">-</span>
                            )}
                            {c.bom_items_count ? (
                              <span className="text-xs font-semibold text-slate-600 ml-0.5">개</span>
                            ) : null}
                          </td>

                          {/* Quoted Total Amount */}
                          <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono font-extrabold">
                            {totalAmount ? (
                              <span className="text-blue-700 text-[13.5px]">
                                ₩{Number(totalAmount).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal text-xs">-</span>
                            )}
                          </td>

                          {/* Request Date */}
                          <td className="py-3 px-3.5 text-center font-mono text-xs font-semibold text-slate-700 whitespace-nowrap">
                            {c.request_date || c.created_at?.slice(0, 10) || '-'}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <Link
                              href={`/cases/${c.id}`}
                              className="btn-hover-effect-tab inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-[3px] bg-slate-100 hover:bg-blue-600 text-slate-800 hover:text-white font-bold text-xs transition-all shadow-2xs group"
                            >
                              <span>상세</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Card Grid View (Alternative Mode) */
          paginatedCases.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[4px] border border-slate-200 shadow-xs min-h-[300px] flex flex-col items-center justify-center">
              <Search className="w-8 h-8 text-slate-300 mb-2" />
              <p className="font-bold text-sm text-slate-700">
                {searchQuery ? `'${searchQuery}' 검색 조건에 맞는 견적 건이 없습니다.` : '해당 필터 조건의 견적 건이 없습니다.'}
              </p>
              <p className="text-xs text-slate-400 mt-1">검색어나 상단 상태 탭을 변경해 보세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedCases.map((c) => {
                const isReady = c.quote_readiness === 'READY_FOR_QUOTE';
                const isAnalyzed = c.status === 'ANALYZED';
                const totalAmount = c.quote_total_amount;

                return (
                  <Link
                    key={c.id}
                    href={`/cases/${c.id}`}
                    className="bg-white hover:border-blue-500 border border-slate-200/90 rounded-[4px] p-5 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group cursor-pointer hover:-translate-y-0.5"
                  >
                    <div>
                      {/* Header: Case No & Status Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono font-extrabold px-2.5 py-1 bg-slate-100 text-slate-800 rounded-[3px]">
                          {c.case_no}
                        </span>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-[3px] border ${
                            isReady
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : isAnalyzed
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          {isReady ? '견적준비완료' : isAnalyzed ? '분석완료' : '도면등록대기'}
                        </span>
                      </div>

                      {/* Title */}
                      <div>
                            <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                              {c.case_name}
                            </h3>
                            <div className="mb-3">
                              {c.visibility === 'SHARED' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 shrink-0 mr-1">사내 공유중</span>}
                              {c.visibility === 'PRIVATE_PENDING' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 shrink-0 mr-1">비공개 심사</span>}
                              {c.visibility === 'PRIVATE' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 shrink-0 mr-1">공개 불가</span>}
                            </div>
                          </div>

                      {/* Company & Project Metadata */}
                      <div className="space-y-1.5 text-xs text-slate-700 border-t border-slate-100 pt-3 mb-4">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="font-bold text-slate-900 truncate">{c.company_name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Folder className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate font-medium text-slate-700">{c.project_name}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-600 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>의뢰일: <strong className="text-slate-800 font-mono">{c.request_date}</strong></span>
                        </div>
                      </div>

                      {/* 3-Metric Stats Badges */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-[3px] border border-slate-200/70 text-center">
                        <div>
                          <div className="text-xs text-slate-600 font-bold">도면 파일</div>
                          <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                            {c.drawings_count || c.files_count || 0}장
                          </div>
                        </div>
                        <div className="border-x border-slate-200">
                          <div className="text-xs text-slate-600 font-bold">BOM 품목</div>
                          <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                            {c.bom_items_count || 0}개
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-600 font-bold">견적 총액</div>
                          <div className="text-xs font-bold font-mono text-blue-700 mt-0.5 truncate px-1">
                            {totalAmount ? `₩${Number(totalAmount).toLocaleString()}` : '-'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Link Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                      <span>상세 워크벤치 진입</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        )}

        {/* Enterprise Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-700 font-medium hidden sm:block">
              전체 <strong className="text-slate-900 font-bold">{sortedCases.length}</strong>개 항목 중 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, sortedCases.length)}번째
            </div>

            <div className="flex items-center space-x-1 mx-auto sm:mx-0">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-[3px] border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 cursor-pointer"
                title="첫 페이지"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-[3px] border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 cursor-pointer"
                title="이전 페이지"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 2
                  );
                })
                .map((page, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && page - prev > 1;

                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && (
                        <span className="px-1.5 text-xs text-slate-400 font-bold">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-[3px] text-xs font-bold transition-all cursor-pointer ${
                          currentPage === page
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-[3px] border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 cursor-pointer"
                title="다음 페이지"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-[3px] border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 cursor-pointer"
                title="마지막 페이지"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

              </div>
      </div>

      {/* Manual New Case Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[4px] max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200">
            <h2 className="text-lg font-extrabold text-slate-900 mb-4">신규 견적의뢰 건 직접 등록</h2>
            <form onSubmit={handleManualCreateCase} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">고객사 선택</label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-[3px] text-xs font-semibold text-slate-800 outline-none focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                >
                  <option value="comp_001">A기계공업 (주) [CUST-0001]</option>
                  <option value="comp_002">B자동화시스템 (주) [CUST-0002]</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">프로젝트</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-[3px] text-xs font-semibold text-slate-800 outline-none focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                >
                  <option value="proj_001">2026 고속 가이드레일 및 프레임 증설라인</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">견적의뢰 건 명칭</label>
                <input
                  type="text"
                  required
                  placeholder="예: 조립라인 3호기 가이드레일 및 브라켓 견적"
                  value={caseName}
                  onChange={(e) => setCaseName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-[3px] text-xs font-medium text-slate-900 outline-none focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-[3px] cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-[3px] shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? '등록 중...' : '견적의뢰 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
