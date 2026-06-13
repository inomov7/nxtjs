'use client';

import { useState, useEffect, useCallback, createContext, useContext, useRef, useMemo } from 'react';
import { X, Bell, Search, LogOut, ChevronDown, Menu, Sun, Moon, User, Lock, Settings, Calendar, Clock, Filter, Heart, Trash2 } from 'lucide-react';
import { useCrm } from '@/lib/CrmContext';
import { ROLES } from '@/lib/demoData';
import { createPortal } from 'react-dom';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || !mounted) return null;

  return createPortal(
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
    </div>,
    document.body
  );
}

// ===== MODAL =====
export function Modal({ isOpen, onClose, title, children, size = 'default' }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;
  const sizeClass = size === 'lg' ? 'modal-content-lg' : size === 'xl' ? 'modal-content-xl' : '';

  return createPortal(
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
    </div>,
    document.body
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

  const results = useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    return patients.filter(p =>
      p.id.toLowerCase().includes(q) ||
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      p.phone.includes(q)
    ).slice(0, 8);
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
  const { theme, toggleTheme, logout } = useCrm();

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
        <button
          onClick={logout}
          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-500 hover:scale-105 active:scale-95 transition-all flex items-center justify-center border border-red-100 dark:border-red-500/20"
          title="Tizimdan chiqish"
          aria-label="Tizimdan chiqish"
        >
          <LogOut size={18} />
        </button>
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

export function normalizeUzPhone(num) {
  if (!num) return '';
  let cleaned = String(num).replace(/[\s-()]/g, '');
  if (!cleaned) return '';
  
  let hasPlus = cleaned.startsWith('+');
  let digits = hasPlus ? cleaned.substring(1) : cleaned;
  
  if (/^[0-9]{9}$/.test(digits)) {
    return '+998' + digits;
  }
  if (/^8[0-9]{9}$/.test(digits)) {
    return '+998' + digits.substring(1);
  }
  if (/^998[0-9]{9}$/.test(digits)) {
    return '+' + digits;
  }
  if (/^[0-9]{9,15}$/.test(digits)) {
    return '+' + digits;
  }
  return cleaned.startsWith('+') ? cleaned : '+' + cleaned;
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

export function ProfileSettings() {
  const { user, updateStaff, staff } = useCrm();
  const toast = useToast();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setTimeout(() => setUsername(user.username || ''), 0);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim()) {
      setError("Foydalanuvchi nomini kiriting");
      return;
    }

    const usernameExists = staff.some(s => s.id !== user.id && s.username?.toLowerCase() === username.trim().toLowerCase());
    if (usernameExists) {
      setError("Ushbu foydalanuvchi nomi band. Boshqa nom tanlang.");
      return;
    }

    const updates = { username: username.trim() };

    if (password) {
      if (password.length < 4) {
        setError("Yangi parol kamida 4 ta belgidan iborat bo'lishi kerak");
        return;
      }
      if (password !== confirmPassword) {
        setError("Kiritilgan parollar bir-biriga mos kelmadi");
        return;
      }
      updates.password = password;
    }

    try {
      setLoading(true);
      await updateStaff(user.id, updates);
      toast("Profil ma'lumotlari muvaffaqiyatli yangilandi!", 'success');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError("Profilni yangilashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const roleLabel = ROLES[user.role]?.label || user.role;
  const roleColor = ROLES[user.role]?.color || '#3B82F6';

  // Compute salary/balance from live staff record
  const staffRecord = staff.find(s => s.id === user.id) || user;
  const KPI_RATES_LOCAL = {
    doctor:    { rate: 50000, unit: 'bemor' },
    nurse:     { rate: 15000, unit: 'soat' },
    reception: { rate: 10000, unit: 'bemor' },
  };
  const kpiCfg = KPI_RATES_LOCAL[user.role] || { rate: 0, unit: '' };
  const kpiRate = staffRecord.customKpiRate !== undefined ? staffRecord.customKpiRate : kpiCfg.rate;
  const kpiActivity = user.role === 'nurse' ? (staffRecord.hoursWorked || 0) : (staffRecord.patientsServed || 0);
  const kpiBonus = kpiActivity * kpiRate;
  const totalSalary = (staffRecord.salary || 0) + kpiBonus;
  const paymentHistory = staffRecord.paymentHistory || [];
  const totalBonuses   = paymentHistory.filter(p => p.type === 'bonus').reduce((s, p) => s + p.amount, 0);
  const totalAdvances  = paymentHistory.filter(p => p.type === 'advance').reduce((s, p) => s + p.amount, 0);
  const totalLoans     = paymentHistory.filter(p => p.type === 'loan').reduce((s, p) => s + p.amount, 0);
  const totalPenalties = paymentHistory.filter(p => p.type === 'penalty').reduce((s, p) => s + p.amount, 0);
  const currentBalance = totalSalary + totalBonuses - totalAdvances - totalLoans - totalPenalties;

  const PAYMENT_TYPE_INFO = {
    salary:  { label: 'Oylik',  icon: '💰', color: '#34C759' },
    bonus:   { label: 'Bonus',  icon: '🎁', color: '#007AFF' },
    advance: { label: 'Avans',  icon: '⏩', color: '#FF9500' },
    loan:    { label: 'Qarz',   icon: '🤝', color: '#AF52DE' },
    penalty: { label: 'Jarima', icon: '⚠️', color: '#FF3B30' },
  };

  const isAdminRole = user.role === 'admin';

  return (
    <div className="animate-fadeIn space-y-6">

      {/* ===== BALANCE SECTION (non-admin only) ===== */}
      {!isAdminRole && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Balance overview card */}
          <div className="lg:col-span-5 card p-6 bg-white dark:bg-white/5 dark:border-white/5 border border-gray-100 shadow-sm rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: `linear-gradient(135deg, ${roleColor} 0%, transparent 70%)` }} />
            <div className="relative">
              <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Moliyaviy Holat</h4>
              
              {/* Main balance */}
              <div className="mb-4 p-4 rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${roleColor} 0%, ${roleColor}cc 100%)` }}>
                <p className="text-xs font-medium opacity-80 mb-1">Joriy Balans</p>
                <p className="text-3xl font-black tracking-tight">{Number(currentBalance).toLocaleString('uz-UZ')}</p>
                <p className="text-sm opacity-70 mt-1">so&apos;m</p>
              </div>

              {/* Breakdown grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-50 dark:bg-green-500/10 rounded-xl p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Asosiy Maosh</p>
                  <p className="text-sm font-bold text-green-700 dark:text-green-400 mt-0.5">{Number(staffRecord.salary || 0).toLocaleString('uz-UZ')}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">KPI Bonus</p>
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-400 mt-0.5">+{Number(kpiBonus).toLocaleString('uz-UZ')}</p>
                </div>
                {totalBonuses > 0 && (
                  <div className="bg-sky-50 dark:bg-sky-500/10 rounded-xl p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Qo&apos;shimcha Bonus</p>
                    <p className="text-sm font-bold text-sky-700 dark:text-sky-400 mt-0.5">+{Number(totalBonuses).toLocaleString('uz-UZ')}</p>
                  </div>
                )}
                {totalAdvances > 0 && (
                  <div className="bg-orange-50 dark:bg-orange-500/10 rounded-xl p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Avans</p>
                    <p className="text-sm font-bold text-orange-600 dark:text-orange-400 mt-0.5">-{Number(totalAdvances).toLocaleString('uz-UZ')}</p>
                  </div>
                )}
                {totalLoans > 0 && (
                  <div className="bg-purple-50 dark:bg-purple-500/10 rounded-xl p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Qarz</p>
                    <p className="text-sm font-bold text-purple-600 dark:text-purple-400 mt-0.5">-{Number(totalLoans).toLocaleString('uz-UZ')}</p>
                  </div>
                )}
                {totalPenalties > 0 && (
                  <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Jarima</p>
                    <p className="text-sm font-bold text-red-600 dark:text-red-400 mt-0.5">-{Number(totalPenalties).toLocaleString('uz-UZ')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment history */}
          <div className="lg:col-span-7 card p-6 bg-white dark:bg-white/5 dark:border-white/5 border border-gray-100 shadow-sm rounded-2xl">
            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">To&apos;lov Tarixi</h4>
            {paymentHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <span className="text-4xl mb-2">💳</span>
                <p className="text-sm">Hozircha to&apos;lov tarixi yo&apos;q</p>
                <p className="text-xs text-gray-400 mt-1">Admin tomonidan beriladigan bonus, avans yoki qarzlar bu yerda ko&apos;rinadi</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {[...paymentHistory].reverse().map((p, i) => {
                  const info = PAYMENT_TYPE_INFO[p.type] || { label: p.type, icon: '💵', color: '#6B7280' };
                  const isDeduction = ['advance', 'loan', 'penalty'].includes(p.type);
                  return (
                    <div key={p.id || i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-gray-50 dark:border-white/5">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl shrink-0">{info.icon}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{info.label}</p>
                          {p.note && <p className="text-xs text-gray-400 truncate">{p.note}</p>}
                          <p className="text-xs text-gray-400">{p.date} • {p.by || 'Admin'}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold ml-2 shrink-0" style={{ color: info.color }}>
                        {isDeduction ? '-' : '+'}{Number(p.amount).toLocaleString('uz-UZ')} so&apos;m
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== PROFILE + SECURITY ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Profile Card */}
        <div className="lg:col-span-7 card p-6 bg-white dark:bg-white/5 dark:border-white/5 border border-gray-100 shadow-sm rounded-2xl relative overflow-hidden">
          {/* Decorative backdrop gradient */}
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/5 dark:to-purple-500/5" />
          
          <div className="relative pt-4 flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shrink-0" style={{ background: `linear-gradient(135deg, ${roleColor} 0%, ${roleColor}dd 100%)` }}>
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="text-center sm:text-left flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">{user.firstName} {user.lastName}</h3>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">{user.specialization || roleLabel}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                <span className="badge font-semibold text-xs py-1 px-2.5 rounded-lg text-white" style={{ background: roleColor }}>
                  {roleLabel}
                </span>
                <span className="badge badge-success font-semibold text-xs py-1 px-2.5 rounded-lg">
                  Faol Xodim
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Shaxsiy Ma&apos;lumotlar</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="space-y-1">
                <p className="text-xs text-gray-400 dark:text-gray-500">Telefon raqam</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{user.phone || 'Kiritilmagan'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-400 dark:text-gray-500">Email pochta</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{user.email || 'Kiritilmagan'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-400 dark:text-gray-500">Ish boshlagan sana</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{user.hireDate || 'Noma\'lum'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-400 dark:text-gray-500">Xodim ID raqami</p>
                <p className="font-mono text-xs font-semibold text-gray-800 dark:text-gray-200">{user.id}</p>
              </div>
              <div className="sm:col-span-2 space-y-1">
                <p className="text-xs text-gray-400 dark:text-gray-500">Yashash manzili</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{user.address || 'Kiritilmagan'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings Card */}
        <div className="lg:col-span-5 card p-6 bg-white dark:bg-white/5 dark:border-white/5 border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-500">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Xavfsizlik Sozlamalari</h3>
              <p className="text-gray-400 text-xs mt-0.5">Tizimga kirish login va paroli</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                Foydalanuvchi nomi (Login)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <User size={15} />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="input w-full"
                  style={{ paddingLeft: '36px' }}
                  placeholder="Login..."
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                Yangi Parol
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={15} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input w-full"
                  style={{ paddingLeft: '36px' }}
                  placeholder="Yangi parol..."
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                Parolni tasdiqlash
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={15} />
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="input w-full"
                  style={{ paddingLeft: '36px' }}
                  placeholder="Qayta kiriting..."
                  disabled={!password}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary px-5 flex items-center justify-center gap-2 text-sm font-semibold"
              >
                {loading ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </form>
        </div>
        
      </div>
    </div>
  );
}

// ===== PATIENT HISTORY SECTION =====
export function PatientHistorySection() {
  const { patients, staff, payments, user, deletePatient } = useCrm();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [confirmDeletePatient, setConfirmDeletePatient] = useState(null);

  const selectedPatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId);
  }, [patients, selectedPatientId]);

  // Filter patients
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const fullname = `${p.firstName || ''} ${p.lastName || ''} ${p.middleName || ''}`.toLowerCase();
      const matchesSearch = !searchQuery || 
        fullname.includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.phone && p.phone.includes(searchQuery));

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && ['navbatda', 'stasionar', 'ambulatoriya'].includes(p.status)) ||
        p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [patients, searchQuery, statusFilter]);

  // Construct timeline events
  const timelineEvents = useMemo(() => {
    if (!selectedPatient) return [];
    const events = [];

    // 1. Admission (Kelish)
    if (selectedPatient.admissionDate) {
      events.push({
        type: 'admission',
        title: "Klinikaga keldi",
        time: `${selectedPatient.admissionDate}T${selectedPatient.queueTime || '08:00'}:00`,
        displayTime: selectedPatient.queueTime || '08:00',
        date: selectedPatient.admissionDate,
        details: `Tashrif sababi: ${selectedPatient.visitReason || "Ko'rik"}`,
        icon: '🟢',
        bgColor: 'bg-green-50 dark:bg-green-500/10',
        textColor: 'text-green-700 dark:text-green-400'
      });
    }

    // 2. Room Assignment (Palataga yotish)
    if (selectedPatient.roomId && selectedPatient.admissionDate) {
      events.push({
        type: 'room',
        title: "Palataga joylashtirildi",
        time: `${selectedPatient.admissionDate}T10:00:00`,
        displayTime: '10:00',
        date: selectedPatient.admissionDate,
        details: `Palata #${selectedPatient.roomId.replace('RM-', '')}`,
        icon: '🛏️',
        bgColor: 'bg-blue-50 dark:bg-blue-500/10',
        textColor: 'text-blue-700 dark:text-blue-400'
      });
    }

    // 3. Nurse Notes (Hamshira izohlari)
    if (selectedPatient.nurseNotes) {
      selectedPatient.nurseNotes.forEach((n, idx) => {
        const nurseObj = staff.find(s => s.id === n.nurse);
        const nurseName = nurseObj ? `${nurseObj.firstName} ${nurseObj.lastName}` : n.nurse || 'Hamshira';
        events.push({
          type: 'note',
          title: "Smena hamshirasi izohi",
          time: `${n.date}T${n.time || '00:00'}:00`,
          displayTime: n.time,
          date: n.date,
          details: `${n.shift} smena: ${n.note} (${nurseName})`,
          icon: '📝',
          bgColor: 'bg-purple-50 dark:bg-purple-500/10',
          textColor: 'text-purple-700 dark:text-purple-400'
        });
      });
    }

    // 4. Medications (Dorilar)
    if (selectedPatient.medications) {
      selectedPatient.medications.forEach((m, idx) => {
        if (m.status === 'given') {
          const nurseObj = staff.find(s => s.id === m.nurse);
          const nurseName = nurseObj ? `${nurseObj.firstName} ${nurseObj.lastName}` : m.nurse || 'Hamshira';
          const nameLower = m.name.toLowerCase();
          const isInjection = nameLower.includes('ukol') || nameLower.includes('injek') || nameLower.includes('ampula') || nameLower.includes('vena') || nameLower.includes('mushak');
          
          events.push({
            type: isInjection ? 'injection' : 'medication',
            title: isInjection ? 'Ukol qilindi (Injeksiya)' : 'Dori berildi',
            time: `${m.date}T${m.givenTime || m.time || '08:00'}:00`,
            displayTime: m.givenTime || m.time,
            date: m.date,
            details: `${m.name} (${m.dose}) - ${nurseName}`,
            icon: isInjection ? '💉' : '💊',
            bgColor: isInjection ? 'bg-rose-50 dark:bg-rose-500/10' : 'bg-teal-50 dark:bg-teal-500/10',
            textColor: isInjection ? 'text-rose-700 dark:text-rose-400' : 'text-teal-700 dark:text-teal-400'
          });
        }
      });
    }

    // 5. Treatments (Muolajalar)
    if (selectedPatient.treatments) {
      selectedPatient.treatments.forEach((t, idx) => {
        if (t.status === 'done') {
          const nurseObj = staff.find(s => s.id === t.nurse);
          const nurseName = nurseObj ? `${nurseObj.firstName} ${nurseObj.lastName}` : t.nurse || 'Hamshira';
          const nameLower = t.name.toLowerCase();
          const typeLower = (t.type || '').toLowerCase();
          const isInjection = nameLower.includes('ukol') || nameLower.includes('injek') || nameLower.includes('ampula') || typeLower.includes('ukol') || typeLower.includes('injek') || typeLower.includes('dropper') || typeLower.includes('tomchi');

          events.push({
            type: isInjection ? 'injection' : 'treatment',
            title: isInjection ? 'Ukol qilindi (Injeksiya)' : 'Muolaja bajarildi',
            time: `${t.date}T${t.time || '12:00'}:00`,
            displayTime: t.time,
            date: t.date,
            details: `${t.type}: ${t.name} - ${nurseName}`,
            icon: isInjection ? '💉' : '🔧',
            bgColor: isInjection ? 'bg-rose-50 dark:bg-rose-500/10' : 'bg-indigo-50 dark:bg-indigo-500/10',
            textColor: isInjection ? 'text-rose-700 dark:text-rose-400' : 'text-indigo-700 dark:text-indigo-400'
          });
        }
      });
    }

    // 6. Diet / Meals / Tea
    if (selectedPatient.diet && selectedPatient.diet.meals) {
      const times = selectedPatient.diet.times || { breakfast: '08:00', lunch: '13:00', dinner: '18:00' };
      if (selectedPatient.diet.meals.breakfast) {
        events.push({
          type: 'meal',
          title: "Nonushta yeyildi",
          time: `${selectedPatient.admissionDate}T${times.breakfast}:00`,
          displayTime: times.breakfast,
          date: selectedPatient.admissionDate,
          details: `Parhez: ${selectedPatient.diet.type}`,
          icon: '🍽️',
          bgColor: 'bg-amber-50 dark:bg-amber-500/10',
          textColor: 'text-amber-700 dark:text-amber-400'
        });
      }
      if (selectedPatient.diet.meals.lunch) {
        events.push({
          type: 'meal',
          title: "Tushlik yeyildi",
          time: `${selectedPatient.admissionDate}T${times.lunch}:00`,
          displayTime: times.lunch,
          date: selectedPatient.admissionDate,
          details: `Parhez: ${selectedPatient.diet.type}`,
          icon: '🍽️',
          bgColor: 'bg-amber-50 dark:bg-amber-500/10',
          textColor: 'text-amber-700 dark:text-amber-400'
        });
      }
      if (selectedPatient.diet.meals.dinner) {
        events.push({
          type: 'meal',
          title: "Kechki ovqat yeyildi",
          time: `${selectedPatient.admissionDate}T${times.dinner}:00`,
          displayTime: times.dinner,
          date: selectedPatient.admissionDate,
          details: `Parhez: ${selectedPatient.diet.type}`,
          icon: '🍽️',
          bgColor: 'bg-amber-50 dark:bg-amber-500/10',
          textColor: 'text-amber-700 dark:text-amber-400'
        });
      }
      if (selectedPatient.diet.meals.tea) {
        events.push({
          type: 'tea',
          title: "Choy berildi",
          time: `${selectedPatient.admissionDate}T16:00:00`,
          displayTime: '16:00',
          date: selectedPatient.admissionDate,
          details: "Hamshira tomonidan choy tarqatildi",
          icon: '☕',
          bgColor: 'bg-orange-50 dark:bg-orange-500/10',
          textColor: 'text-orange-700 dark:text-orange-400'
        });
      }
    }

    // 7. General custom history events logged in DB
    if (selectedPatient.history) {
      selectedPatient.history.forEach((h, idx) => {
        const hTime = h.time || new Date().toISOString();
        const datePart = hTime.split('T')[0];
        const timePart = new Date(hTime).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
        
        let icon = '📄';
        let bgColor = 'bg-gray-50 dark:bg-white/5';
        let textColor = 'text-gray-700 dark:text-gray-300';
        
        if (h.type === 'tea') {
          icon = '☕';
          bgColor = 'bg-orange-50 dark:bg-orange-500/10';
          textColor = 'text-orange-700 dark:text-orange-400';
        } else if (h.type === 'injection') {
          icon = '💉';
          bgColor = 'bg-rose-50 dark:bg-rose-500/10';
          textColor = 'text-rose-700 dark:text-rose-400';
        } else if (h.type === 'discharge') {
          icon = '🔴';
          bgColor = 'bg-red-50 dark:bg-red-500/10';
          textColor = 'text-red-700 dark:text-red-400';
        } else if (h.type === 'admission') {
          icon = '🟢';
          bgColor = 'bg-green-50 dark:bg-green-500/10';
          textColor = 'text-green-700 dark:text-green-400';
        } else if (h.type === 'room') {
          icon = '🛏️';
          bgColor = 'bg-blue-50 dark:bg-blue-500/10';
          textColor = 'text-blue-700 dark:text-blue-400';
        }

        events.push({
          type: h.type,
          title: h.title,
          time: hTime,
          displayTime: timePart,
          date: datePart,
          details: h.details,
          icon,
          bgColor,
          textColor
        });
      });
    }

    // 8. Discharge (Ketish)
    if (selectedPatient.status === 'tuzalgan') {
      events.push({
        type: 'discharge',
        title: "Klinikadan ketdi (Tuzalgan)",
        time: `${selectedPatient.expectedDischarge || selectedPatient.admissionDate}T14:00:00`,
        displayTime: '14:00',
        date: selectedPatient.expectedDischarge || selectedPatient.admissionDate,
        details: "Bemor tuzalib shifoxonadan chiqarildi",
        icon: '🔴',
        bgColor: 'bg-red-50 dark:bg-red-500/10',
        textColor: 'text-red-700 dark:text-red-400'
      });
    }

    // 9. Payments (To'lovlar)
    if (payments) {
      const patientPayments = payments.filter(pay => pay.patientId === selectedPatient.id);
      patientPayments.forEach((pay) => {
        events.push({
          type: 'payment',
          title: `To'lov qabul qilindi (${pay.method === 'cash' ? 'Naqd' : pay.method === 'card' ? 'Plastik' : 'Pul o\'tkazish'})`,
          time: `${pay.date}T10:00:00`,
          displayTime: pay.time || '10:00',
          date: pay.date,
          details: `Xizmatlar: ${pay.services?.join(', ') || ''} | Summa: ${formatMoney(pay.paid || 0)} so'm (Chegirma: ${formatMoney(pay.discount || 0)} so'm)`,
          icon: '💳',
          bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
          textColor: 'text-emerald-700 dark:text-emerald-400'
        });
      });
    }

    // Sort by timestamp (newest first)
    const sorted = [...events].sort((a, b) => new Date(b.time) - new Date(a.time));

    // De-duplicate same day/time events
    const unique = [];
    const seen = new Set();
    sorted.forEach(ev => {
      const key = `${ev.type}-${ev.title}-${ev.date}-${ev.displayTime}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(ev);
      }
    });

    return unique;
  }, [selectedPatient, staff, payments]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[calc(100vh-140px)]">
      {/* Patient List (Left Column) */}
      <div className="lg:col-span-4 card p-4 flex flex-col h-full overflow-hidden">
        <h3 className="font-bold text-gray-900 text-sm mb-3">Mijozlar Ro&apos;yxati</h3>
        
        {/* Search & Filter */}
        <div className="space-y-2 mb-4 shrink-0">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              className="input pl-9 w-full py-1.5 text-sm" 
              placeholder="Ism, ID yoki telefon..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="input select w-full py-1.5 text-xs"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">Barcha holatlar</option>
            <option value="active">Faol bemorlar</option>
            <option value="stasionar">Stasionar</option>
            <option value="ambulatoriya">Ambulatoriya</option>
            <option value="navbatda">Navbatda</option>
            <option value="tuzalgan">Tuzalganlar</option>
          </select>
        </div>

        {/* List scroll */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredPatients.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-xs italic">Bemorlar topilmadi</p>
          ) : (
            filteredPatients.map(p => {
              const isActive = selectedPatientId === p.id;
              const statusBadge = p.status === 'stasionar' ? 'badge-danger' : p.status === 'ambulatoriya' ? 'badge-info' : p.status === 'tuzalgan' ? 'badge-success' : 'badge-warning';
              const statusText = p.status === 'stasionar' ? 'Stasionar' : p.status === 'ambulatoriya' ? 'Ambulatoriya' : p.status === 'tuzalgan' ? 'Tuzalgan' : 'Navbatda';
              
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatientId(p.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1.5 ${
                    isActive 
                      ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/10' 
                      : 'bg-white hover:bg-gray-50 border-gray-100 dark:bg-white/5 dark:border-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <span className="font-semibold text-sm truncate flex-1">{p.firstName} {p.lastName}</span>
                    <span className={`badge ${statusBadge} text-[9px] py-0.5 shrink-0 ${isActive ? 'bg-white/20 text-white border-none' : ''}`}>
                      {statusText}
                    </span>
                  </div>
                  <div className={`text-xs flex justify-between w-full ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                    <span>ID: {p.id.split('-').pop()}</span>
                    <span>{p.phone}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Patient Details & Timeline (Right Column) */}
      <div className="lg:col-span-8 card p-5 flex flex-col h-full overflow-hidden">
        {selectedPatient ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header info */}
            <div className="pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedPatient.firstName} {selectedPatient.lastName} {selectedPatient.middleName || ''}
                </h2>
                {user?.role === 'admin' && (
                  <button 
                    className="btn btn-outline border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 btn-sm flex items-center gap-1.5"
                    onClick={() => setConfirmDeletePatient(selectedPatient)}
                  >
                    <Trash2 size={14} /> O&apos;chirish
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span><b>Tug&apos;ilgan yil:</b> {selectedPatient.birthDate} ({getAge(selectedPatient.birthDate)} yosh)</span>
                <span><b>Jinsi:</b> {selectedPatient.gender}</span>
                <span><b>Telefon:</b> {selectedPatient.phone}</span>
                {selectedPatient.roomId && <span><b>Xona:</b> #{selectedPatient.roomId.replace('RM-', '')}</span>}
              </div>
            </div>

            {/* Timeline scroll */}
            <div className="flex-1 overflow-y-auto pt-5 pr-1">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-1.5">
                <Clock size={16} className="text-blue-500" /> Bemor Tarixi va Vaqtlar
              </h3>
              
              {timelineEvents.length === 0 ? (
                <p className="text-center py-12 text-gray-400 text-xs italic">Ushbu bemor uchun tarix topilmadi.</p>
              ) : (
                <div className="relative border-l border-gray-200 dark:border-gray-800 ml-4 pl-6 space-y-6">
                  {timelineEvents.map((event, index) => (
                    <div key={event.id || index} className="relative">
                      {/* Timeline dot/icon */}
                      <span className={`absolute -left-[35px] top-0 w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 border-white dark:border-gray-900 shadow-sm ${event.bgColor}`}>
                        {event.icon}
                      </span>
                      
                      <div className="card p-3.5 bg-gray-50/50 hover:bg-gray-50 dark:bg-white/5 dark:hover:bg-white/10 transition-colors border border-gray-100/50 dark:border-white/5 rounded-xl">
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                          <h4 className={`font-bold text-sm text-gray-800 dark:text-white`}>
                            {event.title}
                          </h4>
                          <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                            📅 {formatDate(event.date)} • 🕐 {event.displayTime}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                          {event.details}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl mb-3">
              <Clock size={40} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-sm font-semibold text-gray-500">Mijoz Tarixini Ko&apos;rish</p>
            <p className="text-xs text-gray-400 text-center max-w-xs mt-1">
              Chap tomondagi ro&apos;yxatdan bemorni tanlang va uning batafsil kelgan-ketgan, dori va ukol olgan vaqtlari tarixini ko&apos;ring.
            </p>
          </div>
        )}
      </div>

      <ConfirmDialog 
        isOpen={!!confirmDeletePatient} 
        title="Bemorni o'chirish" 
        message={`${confirmDeletePatient?.firstName} ${confirmDeletePatient?.lastName}ning barcha ma'lumotlarini o'chirishni tasdiqlaysizmi? Bu amalni ortga qaytarib bo'lmaydi.`} 
        onConfirm={() => { 
          deletePatient(confirmDeletePatient.id); 
          setConfirmDeletePatient(null); 
          setSelectedPatientId(null); 
          toast("Bemor ma'lumotlari muvaffaqiyatli o'chirildi", 'success'); 
        }} 
        onCancel={() => setConfirmDeletePatient(null)} 
        danger 
      />
    </div>
  );
}
