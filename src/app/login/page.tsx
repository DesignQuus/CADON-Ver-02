'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Layers,
  ShieldCheck,
  UserCheck,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Lock,
  Building,
  Info,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Check
} from 'lucide-react';

interface DemoUser {
  id: string;
  loginId: string;
  name: string;
  department: string;
  position: string;
  role: string;
  color: string;
  defaultPass: string;
}

const DEMO_USERS: DemoUser[] = [
  {
    id: 'usr_kim',
    loginId: 'kim',
    name: '김견적',
    department: '영업견적 1팀',
    position: '과장',
    role: 'SALES_USER',
    color: 'border-blue-500 bg-blue-50/50 text-blue-700',
    defaultPass: 'Cadon1234!@'
  },
  {
    id: 'usr_lee',
    loginId: 'lee',
    name: '이견적',
    department: '영업견적 1팀',
    position: '대리',
    role: 'SALES_USER',
    color: 'border-emerald-500 bg-emerald-50/50 text-emerald-700',
    defaultPass: 'Cadon1234!@'
  },
  {
    id: 'usr_choi',
    loginId: 'choi',
    name: '최견적',
    department: '기술견적 2팀',
    position: '차장',
    role: 'SALES_USER',
    color: 'border-indigo-500 bg-indigo-50/50 text-indigo-700',
    defaultPass: 'Cadon1234!@'
  },
  {
    id: 'usr_song',
    loginId: 'song',
    name: '송견적',
    department: '기술견적 2팀',
    position: '주임',
    role: 'SALES_USER',
    color: 'border-purple-500 bg-purple-50/50 text-purple-700',
    defaultPass: 'Cadon1234!@'
  },
  {
    id: 'usr_park',
    loginId: 'park',
    name: '박견적',
    department: '정밀견적 3팀',
    position: '대리',
    role: 'SALES_USER',
    color: 'border-amber-500 bg-amber-50/50 text-amber-700',
    defaultPass: 'Cadon1234!@'
  },
];

export default function LoginPage() {
  const [selectedUser, setSelectedUser] = useState<DemoUser>(DEMO_USERS[0]);
  const [password, setPassword] = useState('Cadon1234!@');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const router = useRouter();

  const handleSelectUser = (u: DemoUser) => {
    setSelectedUser(u);
    setPassword(u.defaultPass);
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId: selectedUser.loginId, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '로그인에 실패했습니다. 비밀번호를 확인해주세요.');
      }

      // Redirect to main cases page or previous page
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const redirectUrl = params.get('redirect') || '/cases';
        window.location.href = redirectUrl;
      } else {
        router.push('/cases');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminQuickSelect = () => {
    const adminUser: DemoUser = {
      id: 'usr_admin',
      loginId: 'admin',
      name: '시스템 최고관리자',
      department: '총괄 전산실',
      position: 'SUPER_ADMIN',
      role: 'SUPER_ADMIN',
      color: 'border-purple-600 bg-purple-50 text-purple-800',
      defaultPass: 'Cadon1234!@'
    };
    setSelectedUser(adminUser);
    setPassword('Cadon1234!@');
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="text-center max-w-xl mx-auto mb-6">
        <Link href="/cases" className="inline-block group" title="견적의뢰 관리 메인 대시보드로 이동">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md mb-3 group-hover:scale-105 transition-transform">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
            CADON-BOM <span className="text-blue-600">AI</span>
          </h1>
        </Link>
        <p className="mt-1.5 text-sm text-slate-600">
          CAD 도면 자동 분석 & BOM 견적 산출 엔터프라이즈 시스템
        </p>
        <div className="mt-2 inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Info className="w-3.5 h-3.5" />
          <span>시스템 설명 및 시연용 로그인 모드 가동 중</span>
        </div>
      </div>

      {/* Direct link to main dashboard */}
      <div className="mb-4">
        <Link
          href="/cases"
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-bold transition-all shadow-2xs group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:-translate-x-0.5 transition-transform" />
          <span>← 로그인 건너뛰고 메인 화면(견적의뢰 관리)으로 이동</span>
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="bg-white rounded-3xl shadow-lg border border-slate-200/80 p-6 sm:p-8 max-w-2xl w-full">
        {/* Step 1: Select User */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>1단계: 접속할 견적 담당자를 선택해 주세요 (5인)</span>
            </label>
            <button
              type="button"
              onClick={handleAdminQuickSelect}
              className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                selectedUser.loginId === 'admin'
                  ? 'bg-purple-100 border-purple-300 text-purple-800'
                  : 'bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-700 border-slate-200'
              }`}
            >
              👑 최고관리자(admin) 선택
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {DEMO_USERS.map((u) => {
              const isSelected = selectedUser.loginId === u.loginId;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSelectUser(u)}
                  className={`p-3 rounded-2xl text-left border-2 transition-all relative cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm">{u.name}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{u.position}</div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono truncate">
                    {u.department}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected User Banner */}
        <div className="mb-5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
              {selectedUser.name.slice(0, 1)}
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                <span>{selectedUser.name}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {selectedUser.position}
                </span>
                <span className="text-xs text-slate-500 font-normal">({selectedUser.department})</span>
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                계정 ID: <span className="font-bold text-slate-800">{selectedUser.loginId}</span>
              </div>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
              선택됨
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 2: Password Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                2단계: 비밀번호 입력 (샘플 기본값: <span className="font-mono text-blue-600 font-bold">Cadon1234!@</span>)
              </label>
              <button
                type="button"
                onClick={() => setPassword(selectedUser.defaultPass)}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
              >
                비밀번호 ({selectedUser.defaultPass}) 자동입력
              </button>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력 (기본: Cadon1234!@)"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? '로그인 중...' : `[${selectedUser.name}] 담당자로 로그인`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Audit Log Guarantee Note */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>로그인 후 단가수정, 견적토글, 엑셀출력 등 모든 작업이 <strong>{selectedUser.name}</strong> 님의 활동 로그로 기록됩니다.</span>
          </span>
        </div>

        {/* Bottom Quick Return */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <Link
            href="/cases"
            className="text-xs text-slate-500 hover:text-blue-600 flex items-center space-x-1 font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>로그인하지 않고 메인 견적의뢰 목록 바로가기</span>
          </Link>
          <span className="text-[11px] text-slate-400">CADON-BOM AI Ver-02</span>
        </div>
      </div>

      {/* Enterprise Super Admin Approval Showcase Banner */}
      <div className="mt-6 max-w-2xl w-full bg-slate-900 text-slate-300 rounded-3xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-white text-sm">최고관리자 로그인 승인 거버넌스 프로세스 안내</span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  구축 시 활성화
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                실제 고객사 현장 구축 시에는 무단 접근 방지를 위해 <strong>최고관리자(Super Admin)의 로그인 사전 승인</strong>(사내 인가 IP, 단말기 식별, 2단계 보안 인증) 절차가 기본 적용됩니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAdminModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer border border-slate-700 self-start sm:self-auto"
          >
            승인 절차 상세 보기
          </button>
        </div>
      </div>

      {/* Super Admin Approval Governance Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  실제 기업 구축 시 최고관리자 로그인 승인 절차
                </h3>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs text-slate-600">
              <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl">
                <div className="font-bold text-purple-900 text-sm mb-1">
                  🏢 실제 구축 환경 보안 인가 3단계 정책
                </div>
                <p className="text-purple-800 leading-relaxed">
                  견적서 및 도면 데이터는 기업의 핵심 기밀 자산이므로, 현장 도입 시 철저한 접근 통제가 이루어집니다.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">사용자 계정 생성 및 승인 요청</div>
                    <div className="text-slate-500 mt-0.5">신규 견적 담당자가 접속 신청을 진행하면 시스템에 [승인 대기] 상태로 등록됩니다.</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">사내 인가 IP 및 단말기 인증 (Device Binding)</div>
                    <div className="text-slate-500 mt-0.5">사내망 허용 IP 및 승인된 업무용 PC에서만 접속할 수 있도록 단말기 정보를 대조합니다.</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">최고관리자의 최종 원클릭 인가 승인</div>
                    <div className="text-slate-500 mt-0.5">총괄 관리자가 권한(영업견적, 기술견적 등)을 검토 후 승인하면 최종 로그인이 활성화됩니다.</div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px]">
                💡 <strong>현재 시연 모드 안내</strong>: 지금은 시스템 기능 시연 및 조작 설명 단계이므로 <strong>김견적, 이견적, 최견적, 송견적, 박견적</strong> 5인을 클릭하면 승인 절차 없이 즉시 테스트가 가능합니다.
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                확인 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
