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
  const [selectedRole, setSelectedRole] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(null);

  // Live clock for macOS/iPadOS lock screen vibe
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!password) {
      setError('Parolni kiriting');
      return;
    }

    if (password !== ROLES[selectedRole].password) {
      setError("Parol noto'g'ri");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      login(selectedRole);
      toast?.(`${ROLES[selectedRole].label} sifatida kirdingiz`, 'success');
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

        {/* Circular Role Accounts (macOS style) */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {Object.entries(ROLES).map(([key, role]) => {
            const isActive = selectedRole === key;
            const accentColor = appleColors[key];
            return (
              <button
                key={key}
                onClick={() => { setSelectedRole(key); setPassword(''); setError(''); }}
                className="flex flex-col items-center focus:outline-none transition-all duration-350"
                style={{ width: '76px' }}
              >
                <div
                  className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-300 shadow-md ${
                    isActive
                      ? 'scale-110 border-2 shadow-lg'
                      : 'opacity-55 scale-95 hover:opacity-85 hover:scale-100 border'
                  }`}
                  style={{
                    background: isActive ? `rgba(${isActive ? '255,255,255,0.15' : '0,0,0,0'})` : 'rgba(255, 255, 255, 0.03)',
                    borderColor: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)',
                    color: isActive ? '#FFFFFF' : '#E5E5EA',
                    boxShadow: isActive ? `0 0 20px ${accentColor}40` : 'none',
                  }}
                >
                  <div style={{ color: isActive ? '#FFFFFF' : accentColor }}>
                    {roleIcons[key]}
                  </div>
                </div>
                <span
                  className={`text-[11px] font-medium mt-2 tracking-wide truncate max-w-full text-center transition-all ${
                    isActive ? 'text-white font-semibold' : 'text-white/50'
                  }`}
                >
                  {role.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Passcode Field */}
        <form onSubmit={handleLogin} className="max-w-[260px] mx-auto mb-6">
          <div className="relative">
            <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="Parolni kiriting..."
              className={`w-full pl-10 pr-10 py-2.5 rounded-full bg-white/10 border ${
                error ? 'border-red-400 focus:border-red-400' : 'border-white/15 focus:border-white/30'
              } text-white placeholder-white/35 outline-none focus:bg-white/15 focus:ring-4 focus:ring-white/5 transition-all text-xs text-center`}
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all disabled:opacity-50 active:scale-90"
              style={{
                boxShadow: `0 2px 8px ${appleColors[selectedRole]}30`,
              }}
              aria-label="Kirish"
            >
              {isLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowRight size={14} />
              )}
            </button>
          </div>
          {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
        </form>

        {/* Helper Hint Drawer */}
        <div className="bg-white/5 rounded-2xl p-3 border border-white/5 text-center max-w-[320px] mx-auto">
          <div className="flex items-center justify-center gap-1.5 text-white/50 text-[11px]">
            <User size={12} className="opacity-60" />
            <span>Login:</span>
            <span className="text-white/80 font-mono font-medium">{selectedRole}</span>
            <span className="opacity-30 mx-1">|</span>
            <Lock size={12} className="opacity-60" />
            <span>Parol:</span>
            <span className="text-white/80 font-mono font-medium">{ROLES[selectedRole].password}</span>
          </div>
        </div>
      </div>

      {/* Footer Lock Screen Text */}
      <div className="text-center text-white/25 text-[11px] font-light tracking-wide mt-4 select-none">
        © 2026 Hayot Klinikasi • Apple Style CRM
      </div>
    </div>
  );
}
