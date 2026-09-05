'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, ShieldCheck, UserCheck, KeyRound, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '로그인에 실패했습니다.');
      }

      router.push('/cases');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (id: string, pass: string) => {
    setLoginId(id);
    setPassword(pass);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md mb-4">
          <Layers className="w-9 h-9" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          CADON-BOM <span className="text-blue-600">AI</span>
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          CAD 도면 자동 분석 & BOM 견적 산출 서버 시스템
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700">아이디 (ID)</label>
              <div className="mt-1 relative">
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="예: admin 또는 sales1"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">비밀번호 (Password)</label>
              <div className="mt-1 relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? '로그인 중...' : '시스템 로그인'}
            </button>
          </form>

          {/* Quick Demo Login Credentials */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
              1-클릭 빠른 테스트 계정 선택
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickLogin('admin', 'admin1234!')}
                className="p-2.5 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200 rounded-xl text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-1.5 text-purple-700 font-semibold text-xs mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>최고관리자</span>
                </div>
                <div className="text-[11px] text-slate-500">ID: admin</div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('sales1', 'sales1234!')}
                className="p-2.5 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 rounded-xl text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-1.5 text-blue-700 font-semibold text-xs mb-0.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>영업담당자</span>
                </div>
                <div className="text-[11px] text-slate-500">ID: sales1</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
