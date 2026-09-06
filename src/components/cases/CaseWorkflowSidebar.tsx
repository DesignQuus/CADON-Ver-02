'use client';

import React from 'react';
import {
  UploadCloud,
  FileCode2,
  Folder,
  Layers,
  Cpu,
  DollarSign,
  ShieldCheck,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Lock,
  ChevronRight,
  Plus,
  Copy,
  DownloadCloud
} from 'lucide-react';

export type WorkflowTab =
  | 'ALL'
  | 'PENDING'           // 02. 도면 대기
  | 'ANALYZED'          // 03. AI 분석완료 / 단가 매칭
  | 'READY_FOR_QUOTE'   // 04. 견적 준비 완료
  | 'PRIVATE_APPROVAL'  // 04. 결재 대기 (SUPER_ADMIN)
  | 'SECURE_VAULT';     // 04/05. 보안 견적함 (SUPER_ADMIN)

interface CaseWorkflowSidebarProps {
  selectedTab: WorkflowTab;
  onSelectTab: (tab: WorkflowTab) => void;
  counts: {
    total: number;
    pending: number;
    analyzed: number;
    ready: number;
    pendingApproval: number;
    secureVault: number;
  };
  user: {
    userId?: string;
    name?: string;
    role?: string;
  } | null;
  onSingleUploadClick: () => void;
  onBatchUploadClick: () => void;
  isDragging?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
}

export default function CaseWorkflowSidebar({
  selectedTab,
  onSelectTab,
  counts,
  user,
  onSingleUploadClick,
  onBatchUploadClick,
  isDragging = false,
  onDragOver,
  onDragLeave,
  onDrop,
}: CaseWorkflowSidebarProps) {
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <aside className="w-full lg:w-80 shrink-0 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              작업 파이프라인
            </h3>
          </div>
          <button
            onClick={() => onSelectTab('ALL')}
            className={`btn-hover-effect-tab px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
              selectedTab === 'ALL'
                ? 'bg-blue-600 text-white shadow-2xs ring-2 ring-blue-300'
                : 'bg-slate-200/90 text-slate-700 hover:bg-slate-300'
            }`}
          >
            전체 ({counts.total})
          </button>
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5">
          도면 접수부터 최종 견적 발행까지 순서대로 진행합니다.
        </p>
      </div>

      {/* Vertical Steps List */}
      <div className="p-3 space-y-3 overflow-y-auto flex-1">
        {/* STEP 01: 도면 접수 및 등록 (세로형 Drag & Drop 드롭존 통합) */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`rounded-lg border-2 transition-all p-3 space-y-2.5 ${
            isDragging
              ? 'border-blue-600 bg-blue-50/90 shadow-md scale-[1.01]'
              : 'border-dashed border-blue-300 bg-gradient-to-b from-blue-50/50 via-white to-slate-50/60 hover:border-blue-500 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold flex items-center justify-center">
                1
              </span>
              <span className="text-xs font-extrabold text-slate-900">도면 접수 & 등록</span>
            </div>
            <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">
              원스톱 쾌속 시작
            </span>
          </div>

          {/* Visual Drag & Drop Target Area */}
          <div className="py-3 px-2 bg-white/80 rounded border border-blue-100 flex flex-col items-center justify-center text-center space-y-1.5 shadow-2xs">
            <div className="w-11 h-11 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900 leading-tight">
                DWG 도면 파일을 여기에 끌어다 놓으세요
              </p>
              <p className="text-[10px] text-blue-600 font-bold mt-0.5">
                (Drag & Drop)
              </p>
            </div>
            <p className="text-[10.5px] text-slate-500 leading-snug px-1">
              도면을 드롭하면 <strong className="text-slate-800 font-semibold">신규 프로젝트 자동 생성 ➔ 도면 업로드 ➔ AI BOM 추출 파이프라인</strong>이 즉시 시작됩니다.
            </p>
          </div>

          {/* Action Buttons for Step 1 (Enhanced Hover Highlights) */}
          <div className="space-y-2 pt-0.5">
            <button
              onClick={onSingleUploadClick}
              className="btn-hover-effect w-full px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-xs group"
              title="로컬 PC에서 단일 도면 파일(.dwg, .dxf)을 선택하여 즉시 업로드"
            >
              <FileCode2 className="w-4 h-4 text-blue-200 group-hover:scale-115 group-hover:rotate-6 transition-transform" />
              <span>도면 파일 선택</span>
            </button>

            <button
              onClick={onBatchUploadClick}
              className="btn-hover-effect-secondary w-full px-3 py-2.5 bg-white text-blue-700 border border-blue-300 rounded text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-2xs group"
              title="여러 장의 도면(ZIP 파일 포함)을 일괄 선택하여 통합/개별 처리"
            >
              <Folder className="w-4 h-4 text-blue-500 group-hover:scale-115 group-hover:-translate-y-0.5 transition-transform" />
              <span>다중 도면 일괄 등록</span>
            </button>

            <button
              onClick={() => alert('기존 유사 견적을 복제하여 신규 도면으로 등록하는 기능입니다. (준비중)')}
              className="btn-hover-effect-secondary w-full px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded text-[11px] font-semibold transition-all flex items-center justify-between cursor-pointer group"
            >
              <span className="flex items-center space-x-1.5">
                <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:scale-115 transition-transform" />
                <span>기존 유사 견적 복제</span>
              </span>
              <span className="text-[9px] text-slate-400">준비중</span>
            </button>
          </div>
        </div>

        {/* STEP 02: CAD 도면 & AI 분석 */}
        <div className="rounded-md border border-slate-200 p-2.5 space-y-1.5 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-700 text-white text-[10px] font-extrabold flex items-center justify-center">
                2
              </span>
              <span className="text-xs font-bold text-slate-900">CAD 도면 AI 분석</span>
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <button
              onClick={() => onSelectTab('PENDING')}
              className={`btn-hover-effect-tab w-full px-2.5 py-2 rounded text-xs font-semibold transition-all flex items-center justify-between cursor-pointer border ${
                selectedTab === 'PENDING'
                  ? 'bg-amber-500 text-white font-bold shadow-xs border-amber-600 ring-2 ring-amber-300/50'
                  : 'text-slate-700 hover:bg-amber-50 hover:text-amber-900 border-transparent hover:border-amber-200'
              }`}
            >
              <span className="flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>도면 대기 / 분석 대기</span>
              </span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded font-bold ${
                  selectedTab === 'PENDING' ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {counts.pending}
              </span>
            </button>
          </div>
        </div>

        {/* STEP 03: 부품 추출 & 단가 매칭 */}
        <div className="rounded-md border border-slate-200 p-2.5 space-y-1.5 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-700 text-white text-[10px] font-extrabold flex items-center justify-center">
                3
              </span>
              <span className="text-xs font-bold text-slate-900">부품·단가 최적화</span>
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <button
              onClick={() => onSelectTab('ANALYZED')}
              className={`btn-hover-effect-tab w-full px-2.5 py-2 rounded text-xs font-semibold transition-all flex items-center justify-between cursor-pointer border ${
                selectedTab === 'ANALYZED'
                  ? 'bg-blue-600 text-white font-bold shadow-xs border-blue-700 ring-2 ring-blue-300/50'
                  : 'text-slate-700 hover:bg-blue-50 hover:text-blue-900 border-transparent hover:border-blue-200'
              }`}
            >
              <span className="flex items-center space-x-2">
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                <span>BOM 추출 / 단가 매칭중</span>
              </span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded font-bold ${
                  selectedTab === 'ANALYZED' ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {counts.analyzed}
              </span>
            </button>
          </div>
        </div>

        {/* STEP 04: 검수 거버넌스 및 승인 결재 */}
        <div className="rounded-md border border-slate-200 p-2.5 space-y-1.5 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-700 text-white text-[10px] font-extrabold flex items-center justify-center">
                4
              </span>
              <span className="text-xs font-bold text-slate-900">검수 & 결재 승인</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <button
              onClick={() => onSelectTab('READY_FOR_QUOTE')}
              className={`btn-hover-effect-tab w-full px-2.5 py-2 rounded text-xs font-semibold transition-all flex items-center justify-between cursor-pointer border ${
                selectedTab === 'READY_FOR_QUOTE'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs border-emerald-700 ring-2 ring-emerald-300/50'
                  : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 border-transparent hover:border-emerald-200'
              }`}
            >
              <span className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>견적 준비 완료 (산출완료)</span>
              </span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded font-bold ${
                  selectedTab === 'READY_FOR_QUOTE' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {counts.ready}
              </span>
            </button>

            {/* Admin Exclusive Approvals & Vault */}
            {isSuperAdmin && (
              <>
                <button
                  onClick={() => onSelectTab('PRIVATE_APPROVAL')}
                  className={`btn-hover-effect-tab w-full px-2.5 py-2 rounded text-xs font-semibold transition-all flex items-center justify-between cursor-pointer border ${
                    selectedTab === 'PRIVATE_APPROVAL'
                      ? 'bg-red-600 text-white font-bold shadow-xs border-red-700 ring-2 ring-red-300/50'
                      : 'text-red-700 hover:bg-red-50 border-transparent hover:border-red-200'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
                    <span>비공개 결재 대기</span>
                  </span>
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded font-bold ${
                      selectedTab === 'PRIVATE_APPROVAL' ? 'bg-red-800 text-white' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {counts.pendingApproval}
                  </span>
                </button>

                <button
                  onClick={() => onSelectTab('SECURE_VAULT')}
                  className={`btn-hover-effect-tab w-full px-2.5 py-2 rounded text-xs font-semibold transition-all flex items-center justify-between cursor-pointer border ${
                    selectedTab === 'SECURE_VAULT'
                      ? 'bg-slate-800 text-white font-bold shadow-xs border-slate-900 ring-2 ring-slate-400/50'
                      : 'text-slate-700 hover:bg-slate-100 border-transparent hover:border-slate-300'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span>🔒 보안 견적함</span>
                  </span>
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded font-bold ${
                      selectedTab === 'SECURE_VAULT' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {counts.secureVault}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* STEP 05: 견적서 발행 & 아카이브 */}
        <div className="rounded-md border border-slate-200 p-2.5 space-y-1.5 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-700 text-white text-[10px] font-extrabold flex items-center justify-center">
                5
              </span>
              <span className="text-xs font-bold text-slate-900">견적서 발행 & 보관</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <button
              onClick={() => {
                alert('선택된 견적건들의 표준 엑셀 견적서를 일괄 ZIP 압축 다운로드합니다. (준비중)');
              }}
              className="btn-hover-effect-secondary w-full px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-xs font-bold transition-all flex items-center justify-between cursor-pointer group"
              title="산출 완료된 견적건들의 엑셀 견적서를 일괄 다운로드"
            >
              <span className="flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 group-hover:scale-115 transition-transform" />
                <span>표준 엑셀 일괄 발행</span>
              </span>
              <DownloadCloud className="w-4 h-4 text-emerald-600 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Footer Info */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
        <span>접속: <strong className="text-slate-800 font-bold">{user?.name || '담당자'}</strong></span>
        <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-mono font-bold text-slate-700">
          {user?.role === 'SUPER_ADMIN' ? '관리자' : '영업'}
        </span>
      </div>
    </aside>
  );
}