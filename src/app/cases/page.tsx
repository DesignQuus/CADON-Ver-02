'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Plus, Search, Building2, Folder, Calendar, ArrowRight, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

export default function CasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [caseName, setCaseName] = useState('');
  const [companyId, setCompanyId] = useState('comp_001');
  const [projectId, setProjectId] = useState('proj_001');
  const [submitting, setSubmitting] = useState(false);

  const fetchCases = async () => {
    try {
      const res = await fetch('/api/quotation-cases');
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
  }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">견적의뢰 관리 (Quotation Cases)</h1>
          <p className="text-sm text-slate-500 mt-1">
            고객사별 도면등록, 자동 BOM 분석, 마스터 매칭 및 엑셀 견적 산출 프로젝트 목록
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>신규 견적의뢰 등록</span>
        </button>
      </div>

      {/* Cases List */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 font-medium">견적의뢰 목록 로딩 중...</div>
      ) : cases.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">등록된 견적의뢰 건이 없습니다.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors"
          >
            첫 견적의뢰 등록하기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cases.map((c) => (
            <Link
              key={c.id}
              href={`/cases/${c.id}`}
              className="bg-white hover:border-blue-500 border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md">
                    {c.case_no}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      c.quote_readiness === 'READY_FOR_QUOTE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : c.status === 'ANALYZED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {c.quote_readiness === 'READY_FOR_QUOTE'
                      ? '견적준비완료'
                      : c.status === 'ANALYZED'
                      ? '분석완료'
                      : '도면등록대기'}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors line-clamp-2 mb-3">
                  {c.case_name}
                </h3>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium truncate">{c.company_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Folder className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{c.project_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>의뢰일: {c.request_date}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                <span>상세 워크벤치 진입</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New Case Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">신규 견적의뢰 건 등록</h2>
            <form onSubmit={handleCreateCase} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">고객사 선택</label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                >
                  <option value="comp_001">A기계공업 (주) [CUST-0001]</option>
                  <option value="comp_002">B자동화시스템 (주) [CUST-0002]</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">프로젝트</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                >
                  <option value="proj_001">2026 고속 가이드레일 및 프레임 증설라인</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">견적의뢰 건 명칭</label>
                <input
                  type="text"
                  required
                  placeholder="예: 조립라인 3호기 가이드레일 및 브라켓 견적"
                  value={caseName}
                  onChange={(e) => setCaseName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs"
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
