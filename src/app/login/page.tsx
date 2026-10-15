'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Layers, KeyRound, UserRound, AlertCircle, ArrowRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';

/**
 * 개발 전용 빠른 로그인. 아래 조건을 모두 만족할 때만 화면에 나타난다.
 *  - NODE_ENV === 'development'
 *  - NEXT_PUBLIC_DEMO_LOGIN=1
 * 계정은 서버가 SEED_DEMO_DATA=1 로 시작할 때 만들어지며, 비밀번호는 NEXT_PUBLIC_DEMO_PASSWORD 로만 받는다.
 */
const DEMO_LOGIN =
  process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEMO_LOGIN === '1';
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? '';
const DEMO_ACCOUNTS = [
  { loginId: 'kim', label: '김견적' },
  { loginId: 'lee', label: '이견적' },
  { loginId: 'choi', label: '최견적' },
  { loginId: 'song', label: '송견적' },
  { loginId: 'park', label: '박견적' },
  { loginId: 'admin', label: '관리자' },
];

/** 로그인 후 이동 경로: 같은 사이트 내부 경로만 허용한다 (open redirect 방지). */
function safeRedirectPath(raw: string | null): string {
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/cases';
}

export default function LoginPage() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId: loginId.trim(), password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
      }

      try {
        localStorage.setItem('cadon_user', JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem('cadon_token', data.token);
        }
      } catch {}

      const params = new URLSearchParams(window.location.search);
      window.location.replace(safeRedirectPath(params.get('redirect')));
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-xl mx-auto mb-6">
        <Link href="/cases" className="inline-block group">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md mb-3 group-hover:scale-105 transition-transform">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
            CADON-BOM <span className="text-blue-600">AI</span>
          </h1>
        </Link>
        <p className="mt-1.5 text-sm text-slate-600">
          CAD 도면 자동 분석 & BOM 견적 산출 시스템
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-lg border border-slate-200/80 p-6 sm:p-8 max-w-md w-full">
        {DEMO_LOGIN && (
          <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="text-[11px] font-bold text-amber-800 mb-2">개발용 빠른 선택 (이 서버는 개발 모드입니다)</div>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.loginId}
                  type="button"
                  onClick={() => {
                    setLoginId(a.loginId);
                    setPassword(DEMO_PASSWORD);
                    setError('');
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 cursor-pointer"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="loginId" className="block text-xs font-bold text-slate-700 mb-1.5">
              아이디
            </label>
            <div className="relative">
              <UserRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="loginId"
                type="text"
                required
                autoComplete="username"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold text-slate-700 mb-1.5">
              비밀번호
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? '로그인 중...' : '로그인'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <span className="text-[11px] text-slate-400 font-semibold">CADON-BOM AI Ver-02</span>
        </div>
      </div>
    </div>
  );
}
