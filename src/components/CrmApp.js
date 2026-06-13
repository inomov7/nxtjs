'use client';

import { useState, useEffect } from 'react';
import { useCrm } from '@/lib/CrmContext';
import LoginPage from './LoginPage';
import AdminPanel from './AdminPanel';
import DoctorPanel from './DoctorPanel';
import ReceptionPanel from './ReceptionPanel';
import NursePanel from './NursePanel';

export default function CrmApp() {
  const { user, initialized } = useCrm();
  const [booting, setBooting] = useState(true);
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [showApp, setShowApp] = useState(false);

  useEffect(() => {
    let startTime = null;
    const duration = 1800; // 1.8 seconds loading animation
    let animationFrameId;

    const updateProgress = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const pct = Math.min((elapsed / duration) * 100, 100);
      
      setProgress(pct);

      if (elapsed < duration) {
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        setTimeout(() => {
          setBooting(false);
        }, 150);
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  useEffect(() => {
    if (initialized && !booting) {
      setTimeout(() => setFadeOut(true), 0);
      const timer = setTimeout(() => {
        setShowApp(true);
      }, 500); // 500ms fade-out duration
      return () => clearTimeout(timer);
    }
  }, [initialized, booting]);

  if (!showApp) {
    return (
      <div 
        className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black transition-opacity duration-500 ease-in-out select-none ${
          fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="flex flex-col items-center">
          {/* Glowing Premium Line-art SVG Clinic Shield Logo */}
          <svg 
            className="w-20 h-20 text-white opacity-95 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] mb-12 animate-pulse" 
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
          
          {/* Apple-style thin loading bar */}
          <div className="w-[220px] h-[4px] bg-[#222225] rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-white rounded-full transition-all duration-75 ease-out shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <h2 className="font-semibold text-white/50 text-[13px] tracking-widest uppercase mt-6 opacity-80" style={{ fontFamily: "'Outfit', sans-serif" }}>
            HAYOT KLINIKASI
          </h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="animate-fadeIn">
        <LoginPage />
      </div>
    );
  }

  const getPanel = () => {
    switch (user.role) {
      case 'admin': return <AdminPanel />;
      case 'doctor': return <DoctorPanel />;
      case 'reception': return <ReceptionPanel />;
      case 'nurse': return <NursePanel />;
      default: return <LoginPage />;
    }
  };

  return (
    <div className="animate-fadeIn min-h-screen">
      {getPanel()}
    </div>
  );
}
