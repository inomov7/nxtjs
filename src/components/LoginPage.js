'use client';

import { useState, useEffect } from 'react';
import { useCrm } from '@/lib/CrmContext';
import { ROLES } from '@/lib/demoData';
import { useToast } from './SharedComponents';
import { Lock, User, ShieldCheck, Stethoscope, HeartPulse, Phone, Pill, ArrowRight } from 'lucide-react';

const roleIcons = {
  admin: <ShieldCheck size={32} />,
  doctor: <Stethoscope size={32} />,
  nurse: <HeartPulse size={32} />,
  reception: <Phone size={32} />,
};

const appleColors = {
  admin: '#007AFF',
  doctor: '#34C759',
  nurse: '#AF52DE',
  reception: '#FF9500',
};

export default function LoginPage() {
  const { login } = useCrm();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(null);

  // Live clock for macOS/iPadOS lock screen vibe
  useEffect(() => {
    const timeout = setTimeout(() => setCurrentTime(new Date()), 0);
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => {
      clearTimeout(timeout);
      clearInterval(timer);
    };
  }, []);

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Login va parolni kiriting');
      return;
    }

    setIsLoading(true);
    setTimeout(async () => {
      const success = await login(username, password);
      setIsLoading(false);
      if (success) {
        toast?.(`${success.firstName} ${success.lastName} sifatida kirdingiz`, 'success');
      } else {
        setError("Login yoki parol noto'g'ri");
      }
    }, 500);
  };

  const formattedTime = currentTime
    ? currentTime.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '';
  const formattedDate = currentTime
    ? currentTime.toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';

  return (
    <div className="login-bg flex flex-col justify-between py-12">
      {/* Top Lock Screen Clock */}
      <div className="text-center text-white/90 animate-fadeIn mt-4 select-none">
        <h2 className="text-7xl font-extralight tracking-tight leading-none mb-1">
          {formattedTime || '12:00'}
        </h2>
        <p className="text-lg font-light tracking-wide opacity-80 capitalize">
          {formattedDate || 'Yakshanba, 7 iyun'}
        </p>
      </div>

      {/* Main Lock Screen Login Box */}
      <div className="login-card relative z-10 my-auto shadow-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white/10 text-white text-3xl mb-4 border border-white/20 shadow-inner backdrop-blur-md">
            🏥
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Hayot Klinikasi</h1>
          <p className="text-white/40 text-xs font-light mt-1">CRM Boshqaruv Tizimi</p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="max-w-[280px] mx-auto mb-6">
          <div className="relative mb-3">
            <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              placeholder="Login..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-full bg-white/10 border ${
                error ? 'border-red-400 focus:border-red-400' : 'border-white/15 focus:border-white/30'
              } text-white placeholder-white/35 outline-none focus:bg-white/15 focus:ring-4 focus:ring-white/5 transition-all text-xs`}
              autoFocus
            />
          </div>

          <div className="relative mb-4">
            <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="Parol..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-full bg-white/10 border ${
                error ? 'border-red-400 focus:border-red-400' : 'border-white/15 focus:border-white/30'
              } text-white placeholder-white/35 outline-none focus:bg-white/15 focus:ring-4 focus:ring-white/5 transition-all text-xs`}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-white/90 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            style={{
              boxShadow: '0 4px 15px rgba(255, 255, 255, 0.15)',
            }}
          >
            {isLoading ? (
              <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                Tizimga kirish <ArrowRight size={14} />
              </>
            )}
          </button>
          
          {error && <p className="text-red-400 text-xs mt-3 text-center">{error}</p>}
        </form>
      </div>

      {/* Footer Lock Screen Text */}
      <div className="text-center text-white/25 text-[11px] font-light tracking-wide mt-4 select-none">
        © 2026 Hayot Klinikasi • Apple Style CRM
      </div>
    </div>
  );
}
