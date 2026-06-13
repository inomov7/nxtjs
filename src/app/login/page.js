'use client';

import LoginPage from '@/components/LoginPage';
import { useCrm } from '@/lib/CrmContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPageWrapper() {
  const { user, initialized } = useCrm();
  const router = useRouter();

  useEffect(() => {
    if (initialized && user) {
      router.push(`/${user.role}`);
    }
  }, [user, initialized, router]);

  if (!initialized || user) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black select-none z-[10000]">
        <div className="flex flex-col items-center">
          <svg 
            className="w-16 h-16 text-white/40 mb-6 animate-pulse" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          <h2 className="text-white/40 text-xs font-semibold tracking-widest uppercase">
            Yuklanmoqda...
          </h2>
        </div>
      </div>
    );
  }

  return <LoginPage />;
}
