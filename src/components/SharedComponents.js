'use client';

import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { X, Bell, Search, LogOut, ChevronDown, Menu, Sun, Moon } from 'lucide-react';
import { useCrm } from '@/lib/CrmContext';
import { ROLES } from '@/lib/demoData';

// ===== TOAST SYSTEM =====
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

// ===== CONFIRM DIALOG =====
export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Ha', cancelText = "Yo'q", danger = false }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 text-sm mb-6">{message}</p>
          <div className="flex justify-end gap-3">
            <button className="btn btn-outline" onClick={onCancel}>{cancelText}</button>
            <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmText}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== MODAL =====
export function Modal({ isOpen, onClose, title, children, size = 'default' }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const sizeClass = size === 'lg' ? 'modal-content-lg' : size === 'xl' ? 'modal-content-xl' : '';
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${sizeClass}`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="btn btn-icon btn-outline p-1.5">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ===== NOTIFICATION BELL =====
export function NotificationBell({ role }) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useCrm();
  const [isOpen, setIsOpen] = useState(false);

  const myNotifications = notifications.filter(n => n.roles?.includes(role));
  const unreadCount = myNotifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center border border-black/5 dark:border-white/5"
      >
        <Bell size={18} className="text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-heartbeat">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 animate-fadeIn">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <h4 className="font-bold text-gray-900 text-sm">Bildirishnomalar</h4>
            {unreadCount > 0 && (
              <button
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => markAllNotificationsRead(role)}
              >
                Barchasini o&apos;qildi
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {myNotifications.length === 0 ? (
              <p className="p-4 text-gray-400 text-sm text-center">Bildirishnomalar yo&apos;q</p>
            ) : (
              myNotifications.slice(0, 10).map(n => (
                <div
                  key={n.id}
                  className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                  onClick={() => markNotificationRead(n.id)}
                >
                  <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.time).toLocaleString('uz-UZ')}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== GLOBAL SEARCH =====
export function GlobalSearch() {
  const { patients } = useCrm();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const q = query.toLowerCase();
    const found = patients.filter(p =>
      p.id.toLowerCase().includes(q) ||
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      p.phone.includes(q)
    ).slice(0, 8);
    setResults(found);
  }, [query, patients]);

  return (
    <div className="relative">
      <div className="flex items-center bg-black/5 rounded-xl px-3 py-2 border border-black/5">
        <Search size={16} className="text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Qidirish (Alt+S)..."
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 text-sm ml-2 w-44"
        />
      </div>
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-100 z-50 animate-fadeIn">
          {results.map(p => (
            <div key={p.id} className="p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold text-sm text-gray-900">{p.firstName} {p.lastName}</p>
                  <p className="text-xs text-gray-500">{p.id} • {p.phone}</p>
                </div>
                <span className={`badge ${p.status === 'stasionar' ? 'badge-danger' : p.status === 'ambulatoriya' ? 'badge-info' : p.status === 'tuzalgan' ? 'badge-success' : 'badge-warning'}`}>
                  {p.status === 'stasionar' ? 'Stasionar' : p.status === 'ambulatoriya' ? 'Ambulatoriya' : p.status === 'tuzalgan' ? 'Tuzalgan' : 'Navbatda'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== SIDEBAR =====
export function Sidebar({ role, tabs, activeTab, onTabChange }) {
  const { logout, clinicSettings } = useCrm();
  const roleConfig = ROLES[role];
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    const handleClose = () => setIsOpen(false);
    window.addEventListener('toggle-sidebar', handleToggle);
    window.addEventListener('close-sidebar', handleClose);
    return () => {
      window.removeEventListener('toggle-sidebar', handleToggle);
      window.removeEventListener('close-sidebar', handleClose);
    };
  }, []);

  useEffect(() => {
    const handleShortcuts = (e) => {
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (index < tabs.length) {
          e.preventDefault();
          onTabChange(tabs[index].key);
          setIsOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, [tabs, onTabChange]);

  const handleItemClick = (key) => {
    onTabChange(key);
    setIsOpen(false);
  };

  return (
    <>
      {isOpen && (
        <div 
          className="sidebar-backdrop lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      <div 
        className={`sidebar ${isOpen ? 'open' : ''}`} 
        style={{ '--active-accent': roleConfig.color }}
      >
        {/* Logo */}
        <div className="p-5 border-b border-black/5">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-[28%] flex items-center justify-center shadow-md border border-white/10 text-white font-bold"
              style={{ background: `linear-gradient(135deg, ${roleConfig.color} 0%, ${roleConfig.color}dd 100%)` }}
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div className="sidebar-text">
              <h1 className="text-gray-900 font-bold text-sm leading-tight">{clinicSettings.name || 'Hayot Klinikasi'}</h1>
              <p className="text-gray-500 text-xs">{roleConfig.label}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleItemClick(tab.key)}
              className={`sidebar-item w-[calc(100%-24px)] ${activeTab === tab.key ? 'active' : ''}`}
            >
              {tab.icon}
              <span className="sidebar-text">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Search & Logout */}
        <div className="p-4 border-t border-black/5 space-y-3">
          <GlobalSearch />
          <button
            onClick={logout}
            className="sidebar-item w-[calc(100%-24px)] text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} className="text-red-500" />
            <span className="sidebar-text font-medium">Chiqish</span>
          </button>
        </div>
      </div>
    </>
  );
}

// ===== HEADER =====
export function Header({ title, subtitle, role }) {
  const { theme, toggleTheme } = useCrm();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
          className="sidebar-toggle-btn no-print"
          aria-label="Menuni ochish"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3 no-print">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center border border-black/5 dark:border-white/5"
          aria-label="Rejimni o'zgartirish"
        >
          {theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-gray-600" />}
        </button>
        <NotificationBell role={role} />
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100 dark:bg-white/5 dark:border-white/5">
          <div className="w-8 h-8 rounded-[28%] flex items-center justify-center text-white text-xs font-bold shadow-sm" style={{ background: ROLES[role]?.color }}>
            {ROLES[role]?.label?.[0]}
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{ROLES[role]?.label}</span>
        </div>
      </div>
    </div>
  );
}

// ===== STAT CARD =====
export function StatCard({ icon, title, value, subtitle, colorClass = 'stat-blue', trend }) {
  return (
    <div className={`card card-stat p-5 ${colorClass} animate-fadeIn`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="text-gray-400">{icon}</div>
      </div>
      {trend && (
        <div className={`mt-2 text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% o&apos;tgan haftaga nisbatan
        </div>
      )}
    </div>
  );
}

// ===== TABS =====
export function TabNav({ tabs, activeTab, onChange }) {
  return (
    <div className="tab-nav mb-4">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.icon && <span className="mr-1">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ===== EMPTY STATE =====
export function EmptyState({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <div className="text-gray-300 mb-3">{icon}</div>
      <h3 className="text-lg font-medium text-gray-500">{title}</h3>
      {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
    </div>
  );
}

// ===== FORMAT HELPERS =====
export function formatMoney(amount) {
  if (!amount && amount !== 0) return '0';
  return Number(amount).toLocaleString('uz-UZ');
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('uz-UZ');
}

export function getAge(birthDate) {
  if (!birthDate) return '';
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}
