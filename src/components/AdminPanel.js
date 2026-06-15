'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useCrm } from '@/lib/CrmContext';
import { ROLES, ROOM_TYPES, ROOM_STATUSES, MEDICINE_CATEGORIES, SERVICE_CATEGORIES, generateId } from '@/lib/demoData';
import {
  Sidebar, Header, StatCard, Modal, ConfirmDialog, TabNav,
  EmptyState, useToast, formatMoney, formatDate, getAge, ProfileSettings,
  PatientHistorySection, normalizeUzPhone
} from './SharedComponents';
import {
  LayoutDashboard, Users, BedDouble, Pill, DollarSign, ClipboardList,
  BarChart3, Settings, Plus, Edit, Trash2, Eye, Download, Printer, Award,
  UserPlus, Search, Filter, TrendingUp, TrendingDown, Activity,
  AlertTriangle, Calendar, Clock, CheckCircle, XCircle, RefreshCw,
  Building2, Phone, Mail, MapPin, Shield, ChevronRight, Package,
  FileText, CreditCard, PieChart, ArrowUpDown, User, Copy
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart as RPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { key: 'staff', label: 'Xodimlar', icon: <Users size={18} /> },
  { key: 'rooms', label: 'Xonalar', icon: <BedDouble size={18} /> },
  { key: 'finance', label: 'Moliya', icon: <DollarSign size={18} /> },
  { key: 'kpi', label: 'Maosh & KPI', icon: <Award size={18} /> },
  { key: 'services', label: 'Xizmatlar', icon: <ClipboardList size={18} /> },
  { key: 'patients', label: 'Mijozlar Tarixi', icon: <Clock size={18} /> },
  { key: 'reports', label: 'Hisobotlar', icon: <BarChart3 size={18} /> },
  { key: 'sms', label: 'SMS Boshqaruvi', icon: <Mail size={18} /> },
  { key: 'settings', label: 'Sozlamalar', icon: <Settings size={18} /> },
];

const COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#EF4444', '#9333EA', '#EC4899', '#06B6D4', '#84CC16'];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && TABS.some(t => t.key === tab)) {
        setTimeout(() => setActiveTab(tab), 0);
      }
    }
  }, []);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabKey);
      window.history.pushState(null, '', url.pathname + url.search);
    }
  };

  return (
    <div className="flex">
      <Sidebar role="admin" tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="main-content">
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'staff' && <StaffManagement />}
        {activeTab === 'rooms' && <RoomsManagement />}
        {activeTab === 'finance' && <FinanceManagement />}
        {activeTab === 'kpi' && <KpiManagement />}
        {activeTab === 'services' && <ServicesManagement />}
        {activeTab === 'patients' && (
          <div>
            <Header title="Mijozlar Tarixi" role="admin" />
            <PatientHistorySection />
          </div>
        )}
        {activeTab === 'reports' && <ReportsSection />}
        {activeTab === 'sms' && <SmsManagement />}
        {activeTab === 'settings' && <SettingsSection />}
      </div>
    </div>
  );
}

// ===== DASHBOARD =====
function AdminDashboard() {
  const { patients, rooms, finances, activityLog, medicines, staff } = useCrm();
  const today = new Date().toISOString().split('T')[0];

  const stats = useMemo(() => {
    const todayPatients = patients.filter(p => p.admissionDate === today);
    const freeRooms = rooms.filter(r => r.status === 'free').length;
    const busyRooms = rooms.filter(r => r.status === 'busy').length;
    const todayFinance = finances.find(f => f.date === today);
    const monthIncome = finances.reduce((s, f) => s + f.income, 0);
    const queuePatients = patients.filter(p => p.queueStatus === 'waiting').length;
    const recoveredToday = patients.filter(p => p.status === 'tuzalgan' && p.visits?.some(v => v.date === today)).length;
    const activeStaff = staff.filter(s => s.active).length;

    return {
      todayPatients: todayPatients.length,
      freeRooms, busyRooms,
      todayIncome: todayFinance?.income || 0,
      monthIncome,
      queuePatients,
      recoveredToday,
      activeStaff,
    };
  }, [patients, rooms, finances, staff, today]);

  const patientChartData = useMemo(() => finances.map(f => ({ name: f.date.slice(5), bemorlar: f.patients })), [finances]);
  const incomeChartData = useMemo(() => finances.map(f => ({ name: f.date.slice(5), daromad: f.income / 1000000, xarajat: f.expense / 1000000 })), [finances]);

  const diseaseData = useMemo(() => {
    const map = {};
    patients.forEach(p => p.visits?.forEach(v => {
      if (v.diagnosis) { map[v.diagnosis] = (map[v.diagnosis] || 0) + 1; }
    }));
    return Object.entries(map).slice(0, 6).map(([name, value]) => ({ name: name.substring(0, 15), value }));
  }, [patients]);

  const roomChartData = useMemo(() => {
    return ROOM_STATUSES.map(s => ({
      name: s.label, value: rooms.filter(r => r.status === s.key).length, color: s.color,
    })).filter(d => d.value > 0);
  }, [rooms]);

  return (
    <div>
      <Header title="Dashboard" subtitle="Bugungi umumiy ko'rsatkichlar" role="admin" />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Users size={24} />} title="Bugungi bemorlar" value={stats.todayPatients} colorClass="stat-blue" />
        <StatCard icon={<BedDouble size={24} />} title="Bo'sh xonalar" value={`${stats.freeRooms} / ${rooms.length}`} subtitle={`${stats.busyRooms} ta band`} colorClass="stat-green" />
        <StatCard icon={<DollarSign size={24} />} title="Bugungi daromad" value={`${formatMoney(stats.todayIncome)} so'm`} colorClass="stat-yellow" />
        <StatCard icon={<TrendingUp size={24} />} title="Oylik daromad" value={`${formatMoney(stats.monthIncome)} so'm`} colorClass="stat-purple" />
        <StatCard icon={<Clock size={24} />} title="Navbatdagilar" value={stats.queuePatients} colorClass="stat-indigo" />
        <StatCard icon={<CheckCircle size={24} />} title="Tuzalganlar" value={stats.recoveredToday} subtitle="bugun" colorClass="stat-green" />
        <StatCard icon={<Users size={24} />} title="Faol xodimlar" value={stats.activeStaff} colorClass="stat-red" />
        <StatCard icon={<Activity size={24} />} title="Jami bemorlar" value={patients.length} colorClass="stat-blue" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Patient Line Chart */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity size={18} className="text-blue-500" /> Oxirgi 7 kunlik bemor soni
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={patientChartData}>
              <defs>
                <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <Tooltip />
              <Area type="monotone" dataKey="bemorlar" stroke="#2563EB" strokeWidth={2} fill="url(#colorPatients)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Income Bar Chart */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-green-500" /> Daromad dinamikasi (mln so&apos;m)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={incomeChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <Tooltip />
              <Legend />
              <Bar dataKey="daromad" fill="#16A34A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="xarajat" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Disease Pie Chart */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart size={18} className="text-purple-500" /> Kasalliklar taqsimoti
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <RPieChart>
              <Pie data={diseaseData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {diseaseData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </RPieChart>
          </ResponsiveContainer>
        </div>

        {/* Room Status Chart */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BedDouble size={18} className="text-yellow-500" /> Xonalar holati
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <RPieChart>
              <Pie data={roomChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {roomChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </RPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Log */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-blue-500" /> So&apos;nggi amallar
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activityLog.slice(0, 15).map((log, i) => (
            <div key={log.id || i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-semibold">{log.user}</span> — {log.action}
                </p>
                <p className="text-xs text-gray-500 truncate">{log.target}</p>
              </div>
              <p className="text-xs text-gray-400 flex-shrink-0">{new Date(log.time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== STAFF MANAGEMENT =====
function StaffManagement() {
  const { staff, addStaff, updateStaff, deleteStaff } = useCrm();
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const emptyForm = { firstName: '', lastName: '', role: 'doctor', phone: '', email: '', address: '', salary: '', specialization: '', workDays: ['Dush', 'Sesh', 'Chor', 'Pay', 'Juma'], hireDate: new Date().toISOString().split('T')[0], username: '', password: '' };
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    return staff.filter(s => {
      const matchSearch = !searchQuery ||
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone.includes(searchQuery);
      const matchRole = filterRole === 'all' || s.role === filterRole;
      return matchSearch && matchRole;
    });
  }, [staff, searchQuery, filterRole]);

  const handleSubmit = () => {
    const roleConfig = ROLES[form.role];
    const needsLogin = !roleConfig?.noLogin;

    if (!form.firstName || !form.lastName || !form.phone || (needsLogin && (!form.username || !form.password))) {
      toast('Majburiy maydonlarni to\'ldiring', 'error');
      return;
    }
    if (editingStaff) {
      updateStaff(editingStaff.id, { ...form, salary: Number(form.salary) });
      toast('Xodim yangilandi', 'success');
    } else {
      addStaff({ ...form, salary: Number(form.salary) });
      toast('Yangi xodim qo\'shildi', 'success');
    }
    setShowModal(false);
    setEditingStaff(null);
    setForm(emptyForm);
  };

  const handleEdit = (member) => {
    setEditingStaff(member);
    setForm({ ...member });
    setShowModal(true);
  };

  const handleDelete = (member) => {
    deleteStaff(member.id);
    setConfirmDelete(null);
    toast('Xodim o\'chirildi', 'success');
  };

  return (
    <div>
      <Header title="Xodimlar Boshqaruvi" subtitle={`Jami: ${staff.length} ta xodim`} role="admin" />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Qidirish..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <select className="input select w-44" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="all">Barcha rollar</option>
          {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button className="btn btn-primary" onClick={() => { setEditingStaff(null); setForm(emptyForm); setShowModal(true); }}>
          <UserPlus size={16} /> Yangi xodim
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Xodim</th>
                <th>Rol</th>
                <th>Telefon</th>
                <th>Maosh</th>
                <th>Bemorlar</th>
                <th>Holat</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(member => (
                <tr key={member.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: ROLES[member.role]?.color || '#6B7280' }}>
                        {member.firstName[0]}{member.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{member.firstName} {member.lastName}</p>
                        <p className="text-xs text-gray-500">{member.specialization}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-info">{ROLES[member.role]?.label || member.role}</span></td>
                  <td className="text-sm">{member.phone}</td>
                  <td className="text-sm font-medium">{formatMoney(member.salary)} so&apos;m</td>
                  <td className="text-sm">{member.patientsServed || 0}</td>
                  <td>
                    <span className={`badge ${member.active ? 'badge-success' : 'badge-danger'}`}>
                      {member.active ? 'Faol' : 'Bloklangan'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button className="btn btn-icon btn-outline btn-sm" onClick={() => handleEdit(member)}><Edit size={14} /></button>
                      <button className="btn btn-icon btn-outline btn-sm" onClick={() => updateStaff(member.id, { active: !member.active })}>
                        {member.active ? <XCircle size={14} className="text-red-500" /> : <CheckCircle size={14} className="text-green-500" />}
                      </button>
                      <button className="btn btn-icon btn-outline btn-sm" onClick={() => setConfirmDelete(member)}><Trash2 size={14} className="text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingStaff ? 'Xodimni tahrirlash' : 'Yangi xodim'}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Ism *</label>
            <input className="input" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Familiya *</label>
            <input className="input" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Rol</label>
            <select className="input select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Mutaxassislik</label>
            <input className="input" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Telefon *</label>
            <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
            <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Manzil</label>
            <input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Maosh</label>
            <input className="input" type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Ish boshlagan sana</label>
            <input className="input" type="date" value={form.hireDate} onChange={e => setForm({ ...form, hireDate: e.target.value })} />
          </div>
          {!(ROLES[form.role]?.noLogin) && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Login (Foydalanuvchi nomi) *</label>
                <input className="input" value={form.username || ''} onChange={e => setForm({ ...form, username: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Parol *</label>
                <input className="input" type="text" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>Bekor qilish</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editingStaff ? 'Saqlash' : "Qo'shish"}</button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Xodimni o'chirish"
        message={`${confirmDelete?.firstName} ${confirmDelete?.lastName} ni o'chirishni tasdiqlaysizmi?`}
        onConfirm={() => handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
        danger
      />
    </div>
  );
}

// ===== ROOMS MANAGEMENT =====
function RoomsManagement() {
  const { rooms, addRoom, updateRoom, deleteRoom, patients } = useCrm();
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const emptyForm = { number: '', type: 'Oddiy', floor: 1, pricePerDay: 200000, status: 'free', capacity: 1, equipment: [] };
  const [form, setForm] = useState(emptyForm);
  const [equipmentInput, setEquipmentInput] = useState('');

  const handleSubmit = () => {
    if (!form.number) { toast('Xona raqamini kiriting', 'error'); return; }
    const data = { ...form, pricePerDay: Number(form.pricePerDay), floor: Number(form.floor), capacity: Number(form.capacity) };
    if (editingRoom) {
      updateRoom(editingRoom.id, data);
      toast('Xona yangilandi', 'success');
    } else {
      addRoom(data);
      toast('Yangi xona qo\'shildi', 'success');
    }
    setShowModal(false);
    setEditingRoom(null);
    setForm(emptyForm);
  };

  const addEquipment = () => {
    if (equipmentInput.trim()) {
      setForm({ ...form, equipment: [...(form.equipment || []), equipmentInput.trim()] });
      setEquipmentInput('');
    }
  };

  return (
    <div>
      <Header title="Xonalar Boshqaruvi" subtitle={`Jami: ${rooms.length} ta xona`} role="admin" />

      <div className="flex justify-end mb-4">
        <button className="btn btn-primary" onClick={() => { setEditingRoom(null); setForm(emptyForm); setShowModal(true); }}>
          <Plus size={16} /> Yangi xona
        </button>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {rooms.map(room => {
          const roomPatients = patients.filter(p => p.roomId === room.id && p.status === 'stasionar');
          const isFull = roomPatients.length >= room.capacity;
          const displayStatus = (room.status === 'free' || room.status === 'busy') 
            ? (isFull ? 'busy' : 'free') 
            : room.status;
          const statusInfo = ROOM_STATUSES.find(s => s.key === displayStatus);
          return (
            <div key={room.id} className={`floor-room room-${displayStatus}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">#{room.number}</h4>
                  <p className="text-xs text-gray-500">{room.type}</p>
                </div>
                <span className="text-xl">{statusInfo?.emoji}</span>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Qavat: {room.floor} | Sig&apos;im: {room.capacity}</p>
                <p>Narx: {formatMoney(room.pricePerDay)} so&apos;m/kun</p>
                <p className="mt-1">Joylar: <span className="font-semibold">{roomPatients.length}/{room.capacity}</span></p>
                {roomPatients.length > 0 && (
                  <div className="mt-1 pt-1 border-t border-black/5 font-medium text-gray-700 space-y-0.5">
                    {roomPatients.map(p => (
                      <p key={p.id}>👤 {p.firstName} {p.lastName}</p>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 mt-3">
                <select
                  className="input text-xs py-1"
                  value={room.status}
                  onChange={e => updateRoom(room.id, { status: e.target.value })}
                >
                  {ROOM_STATUSES.map(s => <option key={s.key} value={s.key}>{s.emoji} {s.label}</option>)}
                </select>
                <button className="btn btn-icon btn-outline btn-sm" onClick={() => { setEditingRoom(room); setForm({ ...room }); setShowModal(true); }}>
                  <Edit size={12} />
                </button>
                <button className="btn btn-icon btn-outline btn-sm" onClick={() => setConfirmDelete(room)}>
                  <Trash2 size={12} className="text-red-500" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingRoom ? 'Xonani tahrirlash' : 'Yangi xona'}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Xona raqami *</label>
            <input className="input" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Turi</label>
            <select className="input select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Qavat</label>
            <input className="input" type="number" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Sig&apos;im</label>
            <input className="input" type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Narx (kun)</label>
            <input className="input" type="number" value={form.pricePerDay} onChange={e => setForm({ ...form, pricePerDay: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Holat</label>
            <select className="input select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {ROOM_STATUSES.map(s => <option key={s.key} value={s.key}>{s.emoji} {s.label}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Jihozlar</label>
            <div className="flex gap-2 mb-2">
              <input className="input" placeholder="Jihoz nomi..." value={equipmentInput} onChange={e => setEquipmentInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addEquipment()} />
              <button className="btn btn-outline" onClick={addEquipment}>+</button>
            </div>
            <div className="flex flex-wrap gap-1">
              {(form.equipment || []).map((eq, i) => (
                <span key={i} className="badge badge-info cursor-pointer" onClick={() => setForm({ ...form, equipment: form.equipment.filter((_, idx) => idx !== i) })}>
                  {eq} ✕
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>Bekor qilish</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editingRoom ? 'Saqlash' : "Qo'shish"}</button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!confirmDelete} title="Xonani o'chirish" message={`#${confirmDelete?.number} xonani o'chirishni tasdiqlaysizmi?`} onConfirm={() => { deleteRoom(confirmDelete.id); setConfirmDelete(null); toast('Xona o\'chirildi', 'success'); }} onCancel={() => setConfirmDelete(null)} danger />
    </div>
  );
}

// ===== FINANCE =====
function FinanceManagement() {
  const { finances, payments, patients } = useCrm();

  const totalIncome = finances.reduce((s, f) => s + f.income, 0);
  const totalExpense = finances.reduce((s, f) => s + f.expense, 0);
  const netProfit = totalIncome - totalExpense;
  const unpaidPayments = payments.filter(p => p.status === 'unpaid' || p.status === 'partial');
  const totalDebt = unpaidPayments.reduce((s, p) => s + (p.totalAmount - p.discount - p.paid), 0);

  const methodStats = useMemo(() => {
    const map = {};
    payments.forEach(p => { map[p.method] = (map[p.method] || 0) + p.paid; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [payments]);

  return (
    <div>
      <Header title="Moliya va Hisob-Kitob" role="admin" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<TrendingUp size={24} />} title="Umumiy daromad" value={`${formatMoney(totalIncome)} so'm`} colorClass="stat-green" />
        <StatCard icon={<TrendingDown size={24} />} title="Umumiy xarajat" value={`${formatMoney(totalExpense)} so'm`} colorClass="stat-red" />
        <StatCard icon={<DollarSign size={24} />} title="Sof foyda" value={`${formatMoney(netProfit)} so'm`} colorClass="stat-blue" />
        <StatCard icon={<AlertTriangle size={24} />} title="Qarzlar" value={`${formatMoney(totalDebt)} so'm`} subtitle={`${unpaidPayments.length} ta qarz`} colorClass="stat-yellow" />
      </div>

      {/* Payment method stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <h3 className="font-bold text-gray-900 mb-4">To&apos;lov usullari</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RPieChart>
              <Pie data={methodStats} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name }) => name}>
                {methodStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(val) => formatMoney(val) + " so'm"} />
            </RPieChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h3 className="font-bold text-gray-900 mb-4">Kunlik daromad/xarajat</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={finances}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => (v / 1000000).toFixed(0) + 'M'} />
              <Tooltip formatter={v => formatMoney(v) + " so'm"} />
              <Bar dataKey="income" fill="#16A34A" radius={[3, 3, 0, 0]} name="Daromad" />
              <Bar dataKey="expense" fill="#EF4444" radius={[3, 3, 0, 0]} name="Xarajat" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Debts */}
      {unpaidPayments.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" /> To&apos;lanmagan qarzlar
          </h3>
          <table className="data-table">
            <thead>
              <tr><th>Bemor</th><th>Xizmatlar</th><th>Umumiy</th><th>To&apos;langan</th><th>Qarz</th><th>Usul</th></tr>
            </thead>
            <tbody>
              {unpaidPayments.map(p => {
                const patient = patients.find(pt => pt.id === p.patientId);
                const debt = p.totalAmount - p.discount - p.paid;
                return (
                  <tr key={p.id}>
                    <td className="text-sm font-medium">{patient ? `${patient.firstName} ${patient.lastName}` : p.patientId}</td>
                    <td className="text-sm text-gray-500">{p.services?.join(', ')}</td>
                    <td className="text-sm">{formatMoney(p.totalAmount)}</td>
                    <td className="text-sm text-green-600">{formatMoney(p.paid)}</td>
                    <td className="text-sm font-bold text-red-600">{formatMoney(debt)}</td>
                    <td><span className="badge badge-info">{p.method}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-3 mt-4 no-print">
        <button className="btn btn-outline" onClick={() => window.print()}>
          <Printer size={16} /> Chop etish
        </button>
      </div>
    </div>
  );
}

// ===== SERVICES =====
function ServicesManagement() {
  const { services, addService, updateService } = useCrm();
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingSrv, setEditingSrv] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');

  const emptyForm = { name: '', category: 'Konsultatsiya', price: 0, discount: 0 };
  const [form, setForm] = useState(emptyForm);

  const filtered = filterCategory === 'all' ? services : services.filter(s => s.category === filterCategory);

  const handleSubmit = () => {
    if (!form.name) { toast('Xizmat nomini kiriting', 'error'); return; }
    const data = { ...form, price: Number(form.price), discount: Number(form.discount) };
    if (editingSrv) {
      updateService(editingSrv.id, data);
      toast('Xizmat yangilandi', 'success');
    } else {
      addService(data);
      toast('Yangi xizmat qo\'shildi', 'success');
    }
    setShowModal(false);
    setEditingSrv(null);
    setForm(emptyForm);
  };

  return (
    <div>
      <Header title="Xizmatlar va Narxlar" role="admin" />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select className="input select w-44" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="all">Barcha kategoriya</option>
          {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn btn-primary ml-auto" onClick={() => { setEditingSrv(null); setForm(emptyForm); setShowModal(true); }}>
          <Plus size={16} /> Yangi xizmat
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr><th>Xizmat nomi</th><th>Kategoriya</th><th>Narx</th><th>Chegirma</th><th>Amallar</th></tr>
          </thead>
          <tbody>
            {filtered.map(srv => (
              <tr key={srv.id}>
                <td className="text-sm font-medium text-gray-900">{srv.name}</td>
                <td><span className="badge badge-info">{srv.category}</span></td>
                <td className="text-sm font-medium">{formatMoney(srv.price)} so&apos;m</td>
                <td className="text-sm">{srv.discount ? `${formatMoney(srv.discount)} so'm` : '—'}</td>
                <td>
                  <button className="btn btn-icon btn-outline btn-sm" onClick={() => { setEditingSrv(srv); setForm({ ...srv }); setShowModal(true); }}>
                    <Edit size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingSrv ? 'Xizmatni tahrirlash' : 'Yangi xizmat'}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Nomi *</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Kategoriya</label>
            <select className="input select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Narx (so&apos;m)</label>
            <input className="input" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Chegirma (so&apos;m)</label>
            <input className="input" type="number" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>Bekor qilish</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editingSrv ? 'Saqlash' : "Qo'shish"}</button>
        </div>
      </Modal>
    </div>
  );
}



// ===== REPORTS =====
function ReportsSection() {
  const { patients, staff, finances, payments, rooms, medicines } = useCrm();
  const [reportType, setReportType] = useState('general');
  const [dateFilter, setDateFilter] = useState('all'); // 'today' | 'week' | 'month' | 'all'

  // Filter helper functions
  const filterByDate = useCallback((itemDateStr) => {
    if (dateFilter === 'all' || !itemDateStr) return true;
    const itemDate = new Date(itemDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === 'today') {
      return itemDate >= today;
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return itemDate >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return itemDate >= monthAgo;
    }
    return true;
  }, [dateFilter]);

  // Filtered Datasets
  const filteredPatients = useMemo(() => {
    return patients.filter(p => filterByDate(p.admissionDate));
  }, [patients, filterByDate]);

  const filteredFinances = useMemo(() => {
    return finances.filter(f => filterByDate(f.date));
  }, [finances, filterByDate]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => filterByDate(p.date));
  }, [payments, filterByDate]);

  // 1. General tab stats & charts
  const genderData = useMemo(() => {
    const male = filteredPatients.filter(p => p.gender === 'Erkak').length;
    const female = filteredPatients.filter(p => p.gender === 'Ayol').length;
    return [
      { name: 'Erkak', value: male },
      { name: 'Ayol', value: female }
    ].filter(d => d.value > 0);
  }, [filteredPatients]);

  const generalStats = useMemo(() => {
    const totalIncome = filteredPayments.reduce((s, p) => s + p.paid, 0);
    const totalPatients = filteredPatients.length;
    const arpu = totalPatients > 0 ? Math.round(totalIncome / totalPatients) : 0;
    const insuredCount = filteredPatients.filter(p => p.insurance).length;
    const insuranceShare = totalPatients > 0 ? Math.round((insuredCount / totalPatients) * 100) : 0;

    return {
      totalIncome,
      totalPatients,
      arpu,
      insuranceShare
    };
  }, [filteredPatients, filteredPayments]);

  // 2. Demographics tab calculations
  const ageData = useMemo(() => {
    const groups = { '0-17': 0, '18-30': 0, '31-50': 0, '51-70': 0, '70+': 0 };
    filteredPatients.forEach(p => {
      const age = getAge(p.birthDate);
      if (age <= 17) groups['0-17']++;
      else if (age <= 30) groups['18-30']++;
      else if (age <= 50) groups['31-50']++;
      else if (age <= 70) groups['51-70']++;
      else groups['70+']++;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [filteredPatients]);

  const chronicDiseaseStats = useMemo(() => {
    const map = {};
    filteredPatients.forEach(p => {
      if (p.chronicDiseases && Array.isArray(p.chronicDiseases)) {
        p.chronicDiseases.forEach(d => {
          map[d] = (map[d] || 0) + 1;
        });
      }
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filteredPatients]);

  // 3. Doctors Performance tab calculations
  const doctorPerformance = useMemo(() => {
    return staff.filter(s => s.role === 'doctor').map(d => {
      // Calculate revenue generated by this doctor (payments from patients assigned to this doctor)
      const docPatients = patients.filter(p => p.assignedDoctor === d.id);
      const docPatientIds = docPatients.map(p => p.id);
      const generatedRevenue = payments
        .filter(p => docPatientIds.includes(p.patientId) && filterByDate(p.date))
        .reduce((sum, pay) => sum + pay.paid, 0);

      const periodPatientsServed = docPatients.filter(p => filterByDate(p.admissionDate)).length;

      return {
        name: `${d.firstName} ${d.lastName[0]}.`,
        bemorlar: periodPatientsServed,
        revenue: generatedRevenue,
        soatlar: d.hoursWorked || 0
      };
    });
  }, [staff, patients, payments, filterByDate]);

  // 4. Financials tab calculations
  const methodStats = useMemo(() => {
    const map = {};
    filteredPayments.forEach(p => {
      map[p.method] = (map[p.method] || 0) + p.paid;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredPayments]);

  const serviceTypeStats = useMemo(() => {
    const map = {};
    filteredPayments.forEach(p => {
      if (p.services && Array.isArray(p.services)) {
        p.services.forEach(s => {
          map[s] = (map[s] || 0) + (p.paid / p.services.length);
        });
      }
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [filteredPayments]);

  // 5. Occupancy tab calculations
  const occupancyStats = useMemo(() => {
    const totalCapacity = rooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
    const occupiedCapacity = patients.filter(p => p.status === 'stasionar' && p.roomId).length;
    const occupancyRate = totalCapacity > 0 ? Math.round((occupiedCapacity / totalCapacity) * 100) : 0;

    const typeOccupancy = {};
    rooms.forEach(r => {
      const currentInRoom = patients.filter(p => p.roomId === r.id && p.status === 'stasionar').length;
      typeOccupancy[r.type] = typeOccupancy[r.type] || { occupied: 0, total: 0 };
      typeOccupancy[r.type].occupied += currentInRoom;
      typeOccupancy[r.type].total += r.capacity || 0;
    });

    const statusCounts = {
      free: rooms.filter(r => r.status === 'free').length,
      busy: rooms.filter(r => r.status === 'busy').length,
      cleaning: rooms.filter(r => r.status === 'cleaning').length,
      repair: rooms.filter(r => r.status === 'repair').length
    };

    return {
      totalCapacity,
      occupiedCapacity,
      occupancyRate,
      statusCounts,
      typeOccupancy: Object.entries(typeOccupancy).map(([type, d]) => ({
        type,
        rate: d.total > 0 ? Math.round((d.occupied / d.total) * 100) : 0,
        occupied: d.occupied,
        total: d.total
      }))
    };
  }, [rooms, patients]);

  // 6. Inventory tab calculations
  const inventoryStats = useMemo(() => {
    const totalItems = medicines.length;
    const totalStockVal = medicines.reduce((sum, m) => sum + (m.quantity * m.unitPrice), 0);
    const lowStockItems = medicines.filter(m => m.quantity <= m.minStock);
    
    const categoryDistribution = {};
    medicines.forEach(m => {
      categoryDistribution[m.category] = (categoryDistribution[m.category] || 0) + m.quantity;
    });

    return {
      totalItems,
      totalStockVal,
      lowStockCount: lowStockItems.length,
      lowStockList: lowStockItems.slice(0, 5),
      categoryData: Object.entries(categoryDistribution).map(([name, value]) => ({ name, value }))
    };
  }, [medicines]);

  return (
    <div className="animate-fadeIn">
      <Header title="Kengaytirilgan Hisobotlar" subtitle="Klinika faoliyati bo'yicha tahlillar va hisobotlar" role="admin" />
      
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 no-print">
        <div className="flex-1 min-w-[300px]">
          <TabNav
            tabs={[
              { key: 'general', label: 'Umumiy' },
              { key: 'financials', label: 'Moliya Tahlili' },
              { key: 'doctors', label: 'Shifokorlar' },
              { key: 'demographics', label: 'Demografiya' },
              { key: 'occupancy', label: 'Xonalar & Bandlik' },
            ]}
            activeTab={reportType}
            onChange={setReportType}
          />
        </div>
        
        {/* Date Filter Control */}
        <div className="flex items-center gap-2 bg-black/5 border border-black/5 dark:bg-white/5 dark:border-white/10 p-1.5 rounded-full">
          <button 
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${dateFilter === 'today' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
            onClick={() => setDateFilter('today')}
          >
            Bugun
          </button>
          <button 
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${dateFilter === 'week' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
            onClick={() => setDateFilter('week')}
          >
            Haftalik
          </button>
          <button 
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${dateFilter === 'month' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
            onClick={() => setDateFilter('month')}
          >
            Oylik
          </button>
          <button 
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${dateFilter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
            onClick={() => setDateFilter('all')}
          >
            Barchasi
          </button>
        </div>
      </div>

      {/* 1. GENERAL TAB */}
      {reportType === 'general' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<Users size={20} />} title="Qabul qilingan bemorlar" value={generalStats.totalPatients} colorClass="stat-blue" />
            <StatCard icon={<DollarSign size={20} />} title="Kassaga kelib tushgan" value={`${formatMoney(generalStats.totalIncome)} so'm`} colorClass="stat-green" />
            <StatCard icon={<TrendingUp size={20} />} title="O'rtacha bemor tushumi (ARPU)" value={`${formatMoney(generalStats.arpu)} so'm`} colorClass="stat-yellow" />
            <StatCard icon={<Shield size={20} />} title="Sug'urta ulushi" value={`${generalStats.insuranceShare}%`} subtitle="Sug'urtali bemorlar" colorClass="stat-purple" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Activity size={18} className="text-blue-500" /> Bemor qabuli dinamikasi
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={filteredFinances}>
                  <defs>
                    <linearGradient id="generalPatientsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="patients" name="Bemorlar" stroke="#2563EB" fill="url(#generalPatientsGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="card p-5">
              <h3 className="font-bold text-gray-900 mb-4">Bemorlar jins taqsimoti</h3>
              {genderData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <RPieChart>
                    <Pie data={genderData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                      <Cell fill="#2563EB" /><Cell fill="#EC4899" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RPieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="Ma'lumotlar mavjud emas" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. FINANCIALS TAB */}
      {reportType === 'financials' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card p-5 lg:col-span-2">
              <h3 className="font-bold text-gray-900 mb-4">Daromad tushum usuli bo&apos;yicha</h3>
              {methodStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <RPieChart>
                    <Pie data={methodStats} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name }) => name}>
                      {methodStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(val) => formatMoney(val) + " so'm"} />
                    <Legend />
                  </RPieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="Ma'lumotlar mavjud emas" />
              )}
            </div>

            <div className="card p-5">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FileText size={18} className="text-green-500" /> Top xizmatlar (Tushum)
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {serviceTypeStats.length > 0 ? (
                  serviceTypeStats.map(({ name, value: val }, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{name}</p>
                      </div>
                      <span className="text-xs font-bold text-green-600">{formatMoney(Math.round(val))} so&apos;m</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-xs text-center py-4">To&apos;lovlar topilmadi</p>
                )}
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-4">Daromad va Xarajat hisoboti</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={filteredFinances}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => (v / 1000000).toFixed(0) + 'M'} />
                <Tooltip formatter={v => formatMoney(v) + " so'm"} />
                <Legend />
                <Bar dataKey="income" name="Daromad" fill="#16A34A" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expense" name="Xarajat" fill="#EF4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 3. DOCTORS TAB */}
      {reportType === 'doctors' && (
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-4">Shifokorlar qabul qilgan bemorlar soni</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={doctorPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="bemorlar" fill="#2563EB" name="Bemorlar soni" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award size={18} className="text-purple-500" /> Shifokorlarning moliyaviy samaradorligi (Kelib tushgan to&apos;lovlar)
            </h3>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Shifokor</th>
                    <th>Xizmat ko&apos;rsatilgan bemorlar</th>
                    <th>Keltirilgan umumiy tushum</th>
                    <th>Ish soatlari</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorPerformance.map((doc, idx) => (
                    <tr key={idx}>
                      <td className="text-sm font-semibold text-gray-900">{doc.name}</td>
                      <td className="text-sm">{doc.bemorlar} ta bemor</td>
                      <td className="text-sm font-bold text-green-600">{formatMoney(doc.revenue)} so&apos;m</td>
                      <td className="text-sm">{doc.soatlar} soat</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. DEMOGRAPHICS TAB */}
      {reportType === 'demographics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-4">Yosh guruhlari taqsimoti</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#9333EA" name="Bemorlar soni" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-4">Surunkali kasalliklar bo&apos;yicha ulush</h3>
            <div className="space-y-4">
              {chronicDiseaseStats.length > 0 ? (
                chronicDiseaseStats.map(([disease, count], idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-700 w-32 truncate">{disease}</span>
                    <div className="flex-1 h-5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(count / filteredPatients.length) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold text-gray-900 w-8">{count}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-xs text-center py-8">Surunkali kasalliklar aniqlanmadi</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. OCCUPANCY TAB */}
      {reportType === 'occupancy' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon={<BedDouble size={20} />} title="Stasionardagilar" value={occupancyStats.occupiedCapacity} subtitle={`Jami sig&apos;im: ${occupancyStats.totalCapacity}`} colorClass="stat-blue" />
            <StatCard icon={<Activity size={20} />} title="Bo'sh xonalar" value={occupancyStats.statusCounts.free} colorClass="stat-green" />
            <StatCard icon={<AlertTriangle size={20} />} title="Band xonalar" value={occupancyStats.statusCounts.busy} colorClass="stat-red" />
            <StatCard icon={<RefreshCw size={20} />} title="Tozalashda" value={occupancyStats.statusCounts.cleaning} colorClass="stat-yellow" />
            <StatCard icon={<Settings size={20} />} title="Ta'mirda" value={occupancyStats.statusCounts.repair} colorClass="stat-purple" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5 flex flex-col justify-center items-center">
              <h3 className="font-bold text-gray-900 mb-4 w-full">Stasionar bandlik darajasi</h3>
              <div className="relative w-44 h-44 flex items-center justify-center rounded-full border-[10px] border-gray-100 dark:border-white/5">
                <div className="absolute inset-0 rounded-full border-[10px] border-blue-600" style={{ clipPath: `polygon(50% 50%, -50% -50%, ${occupancyStats.occupancyRate * 3.6}% -50%)` }} />
                <div className="text-center">
                  <span className="text-4xl font-extrabold text-gray-900">{occupancyStats.occupancyRate}%</span>
                  <p className="text-xs text-gray-500 mt-1">Bandlik ko&apos;rsatkichi</p>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-bold text-gray-900 mb-4">Xona turlari bo&apos;yicha bandlik</h3>
              <div className="space-y-4">
                {occupancyStats.typeOccupancy.map((roomData, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-gray-700">
                      <span>{roomData.type}</span>
                      <span>{roomData.occupied} / {roomData.total} ({roomData.rate}%)</span>
                    </div>
                    <div className="h-4 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${roomData.rate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-4 no-print">
        <button className="btn btn-outline" onClick={() => window.print()}><Printer size={16} /> Chop etish</button>
      </div>
    </div>
  );
}

// ===== SETTINGS =====
function SettingsSection() {
  const { clinicSettings, setClinicSettings, exportData, resetData } = useCrm();
  const toast = useToast();
  const [form, setForm] = useState(clinicSettings);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setForm(clinicSettings);
    }, 0);
    return () => clearTimeout(timer);
  }, [clinicSettings]);

  const handleSave = () => {
    setClinicSettings(form);
    toast('Sozlamalar saqlandi', 'success');
  };

  return (
    <div>
      <Header title="Sozlamalar" role="admin" />

      <div className="space-y-6 max-w-6xl">
        {/* Section 1: Klinika ma'lumotlari */}
        <div className="card p-6 bg-white dark:bg-white/5 dark:border-white/5 border border-gray-100 shadow-sm rounded-2xl animate-fadeIn">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-500">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Klinika ma&apos;lumotlari</h3>
              <p className="text-gray-400 text-xs mt-0.5 font-medium">Klinika nomi, manzili, aloqa ma&apos;lumotlari va ish vaqti</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wider">Klinika nomi</label>
              <input className="input" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wider">Manzil</label>
              <input className="input" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wider">Telefon raqam</label>
                <input className="input" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wider">Email pochta</label>
                <input className="input" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wider">SMS xabar tarif narxi (so'm)</label>
              <input className="input w-44 font-mono font-bold" type="number" value={form.smsCost || 150} onChange={e => setForm({ ...form, smsCost: Number(e.target.value) })} />
            </div>
            
            <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-3">
              <h4 className="text-xs font-bold text-gray-900 uppercase dark:text-white">Android SMS Gateway API</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-semibold text-gray-500">1. Marketing API (GET/POST)</span>
                    <button 
                      type="button"
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}/api/sms/marketing`);
                          toast("Marketing API havolasi nusxalandi!", "success");
                        }
                      }}
                    >
                      <Copy size={10} className="inline-block" /> Nusxa olish
                    </button>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 p-2 rounded-lg font-mono text-[10px] text-gray-600 dark:text-gray-300 break-all select-all border border-black/5">
                    {typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/api/sms/marketing` : 'http://localhost:3000/api/sms/marketing'}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-semibold text-gray-500">2. Majburiy (Muolaja) API (GET/POST)</span>
                    <button 
                      type="button"
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}/api/sms/scheduled`);
                          toast("Muolaja API havolasi nusxalandi!", "success");
                        }
                      }}
                    >
                      <Copy size={10} className="inline-block" /> Nusxa olish
                    </button>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 p-2 rounded-lg font-mono text-[10px] text-gray-600 dark:text-gray-300 break-all select-all border border-black/5">
                    {typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/api/sms/scheduled` : 'http://localhost:3000/api/sms/scheduled'}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wider">Ish vaqtlari (hafta kunlari)</label>
              <div className="flex gap-3 items-center">
                <input className="input w-28 text-center" type="time" value={form.workHours?.weekdays?.start || '08:00'} onChange={e => setForm({ ...form, workHours: { ...form.workHours, weekdays: { ...form.workHours?.weekdays, start: e.target.value } } })} />
                <span className="text-gray-400">—</span>
                <input className="input w-28 text-center" type="time" value={form.workHours?.weekdays?.end || '20:00'} onChange={e => setForm({ ...form, workHours: { ...form.workHours, weekdays: { ...form.workHours?.weekdays, end: e.target.value } } })} />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <button className="btn btn-primary px-6 py-2.5 text-sm font-semibold" onClick={handleSave}>
              Saqlash
            </button>
          </div>
        </div>

        {/* Section 2: Shaxsiy Profil & Xavfsizlik */}
        <ProfileSettings />

        {/* Section 3: Tizim & Zaxira */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          {/* Backup Section */}
          <div className="card p-6 bg-white dark:bg-white/5 dark:border-white/5 border border-gray-100 shadow-sm rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-green-50 dark:bg-green-500/10 rounded-xl text-green-500">
                  <Download size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Ma&apos;lumotlar Zaxirasi</h3>
                  <p className="text-gray-400 text-xs mt-0.5 font-medium">Tizimdagi barcha ma&apos;lumotlarni JSON formatida saqlab oling</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-6">
                Ushbu fayl yordamida keyinchalik tizim holatini to&apos;liq tiklashingiz yoki boshqa qurilmaga o&apos;tkazishingiz mumkin.
              </p>
            </div>
            <div>
              <button className="btn btn-outline w-full flex items-center justify-center gap-2 font-semibold" onClick={exportData}>
                <Download size={16} /> Backup Faylini Yuklash
              </button>
            </div>
          </div>

          {/* Reset Section */}
          <div className="card p-6 bg-white dark:bg-white/5 dark:border-white/5 border border-gray-100 shadow-sm rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-red-50 dark:bg-red-500/10 rounded-xl text-red-500">
                  <RefreshCw size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Tizimni Tozalash</h3>
                  <p className="text-gray-400 text-xs mt-0.5 font-medium">Ma&apos;lumotlar bazasini boshlang&apos;ich holatga qaytarish</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-6 text-red-500/90 dark:text-red-400/90 font-medium">
                DIQQAT: Barcha bemorlar, xizmatlar, xonalar va to&apos;lovlar o&apos;chiriladi. Ushbu amalni ortga qaytarib bo&apos;lmaydi.
              </p>
            </div>
            <div>
              <button className="btn btn-danger w-full flex items-center justify-center gap-2 font-semibold" onClick={() => setConfirmReset(true)}>
                <RefreshCw size={16} /> Barcha Ma&apos;lumotlarni O&apos;chirish
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmReset}
        title="Ma'lumotlarni tiklash"
        message="Barcha ma'lumotlar o'chiriladi va boshlang'ich holatga qaytariladi. Davom etasizmi?"
        onConfirm={resetData}
        onCancel={() => setConfirmReset(false)}
        danger
        confirmText="Ha, tiklash"
      />
    </div>
  );
}

// Constants for KPI rates
const KPI_RATES = {
  doctor: { label: 'Har bir bemor', rate: 50000, unit: 'bemor' },
  nurse: { label: 'Ishlagan soat', rate: 15000, unit: 'soat' },
  reception: { label: 'Bemor ro\'yxatga olish', rate: 10000, unit: 'bemor' }
};

// ===== KPI & PAYROLL =====
const PAYMENT_TYPES = [
  { key: 'salary', label: 'Oylik maosh', icon: '💰', color: '#34C759' },
  { key: 'bonus', label: 'Bonus', icon: '🎁', color: '#007AFF' },
  { key: 'advance', label: 'Avans', icon: '⏩', color: '#FF9500' },
  { key: 'loan', label: 'Qarz', icon: '🤝', color: '#AF52DE' },
  { key: 'loan_repayment', label: 'Qarz to\'lovi', icon: '💳', color: '#10B981' },
  { key: 'penalty', label: 'Jarima', icon: '⚠️', color: '#FF3B30' },
];

function KpiManagement() {
  const { staff, updateStaff, finances, setFinances, addActivityLogEntry } = useCrm();
  const toast = useToast();
  const [activeSection, setActiveSection] = useState('payroll');
  const [confirmPayout, setConfirmPayout] = useState(null);
  const [editingKpi, setEditingKpi] = useState(null);
  const [kpiForm, setKpiForm] = useState({ activity: '', rate: '' });
  const [paymentModal, setPaymentModal] = useState(null); // { staff member }
  const [paymentForm, setPaymentForm] = useState({ type: 'bonus', amount: '', note: '' });

  // Compute calculated values for staff
  const payrollList = useMemo(() => {
    return staff.map(member => {
      const config = KPI_RATES[member.role] || { label: 'KPI Ko\'rsatkichi', rate: 0, unit: 'kpi' };
      const rate = member.customKpiRate !== undefined ? member.customKpiRate : config.rate;
      const kpiActivity = member.role === 'nurse' ? (member.hoursWorked || 0) : (member.patientsServed || 0);
      const kpiBonus = kpiActivity * rate;
      const totalSalary = (member.salary || 0) + kpiBonus;
      const paymentHistory = member.paymentHistory || [];
      const totalBonuses = paymentHistory.filter(p => p.type === 'bonus').reduce((s, p) => s + p.amount, 0);
      const totalAdvances = paymentHistory.filter(p => p.type === 'advance').reduce((s, p) => s + p.amount, 0);
      const totalLoans = paymentHistory.filter(p => p.type === 'loan').reduce((s, p) => s + p.amount, 0);
      const totalRepayments = paymentHistory.filter(p => p.type === 'loan_repayment').reduce((s, p) => s + p.amount, 0);
      const totalPenalties = paymentHistory.filter(p => p.type === 'penalty').reduce((s, p) => s + p.amount, 0);
      const currentBalance = totalSalary + totalBonuses + totalRepayments - totalAdvances - totalLoans - totalPenalties;
      return {
        ...member,
        kpiLabel: config.label,
        kpiRate: rate,
        kpiUnit: config.unit,
        kpiActivity,
        kpiBonus,
        totalSalary,
        paymentHistory,
        totalBonuses,
        totalAdvances,
        totalLoans,
        totalRepayments,
        totalPenalties,
        currentBalance,
        status: member.salaryStatus || 'pending'
      };
    });
  }, [staff]);

  const handleEditKpi = (member) => {
    setEditingKpi(member);
    setKpiForm({
      activity: member.kpiActivity || 0,
      rate: member.kpiRate || 0
    });
  };

  const handleSaveKpi = () => {
    if (!editingKpi) return;
    const isNurse = editingKpi.role === 'nurse';
    const updates = { customKpiRate: Number(kpiForm.rate) };
    if (isNurse) {
      updates.hoursWorked = Number(kpiForm.activity);
    } else {
      updates.patientsServed = Number(kpiForm.activity);
    }
    updateStaff(editingKpi.id, updates);
    toast('KPI ko\'rsatkichlari yangilandi', 'success');
    setEditingKpi(null);
  };

  const stats = useMemo(() => {
    const totalPayroll = payrollList.reduce((s, m) => s + m.totalSalary, 0);
    const totalPaid = payrollList.filter(m => m.status === 'paid').reduce((s, m) => s + m.totalSalary, 0);
    const totalPending = totalPayroll - totalPaid;
    let topPerformer = null;
    let maxBonus = -1;
    payrollList.forEach(m => {
      if (m.kpiBonus > maxBonus) { maxBonus = m.kpiBonus; topPerformer = m; }
    });
    return {
      totalPayroll, totalPaid, totalPending,
      topPerformerName: topPerformer ? `${topPerformer.firstName} ${topPerformer.lastName}` : '—',
      topPerformerRole: topPerformer ? ROLES[topPerformer.role]?.label : '',
      topPerformerBonus: maxBonus
    };
  }, [payrollList]);

  const handlePay = (member) => {
    const today = new Date().toISOString().split('T')[0];
    const newPayment = {
      id: `PAY-${Date.now()}`,
      type: 'salary',
      amount: Number(member.totalSalary),
      note: "Maosh to'lovi",
      date: today,
      by: 'Admin'
    };
    const paymentHistory = [...(member.paymentHistory || []), newPayment];
    
    updateStaff(member.id, { 
      salaryStatus: 'paid', 
      lastSalaryPaidDate: today, 
      paymentHistory 
    });
    
    const updatedFinances = finances.map(f => f.date === today ? { ...f, expense: f.expense + member.totalSalary } : f);
    if (!finances.some(f => f.date === today)) {
      updatedFinances.push({ date: today, income: 0, expense: member.totalSalary, patients: 0 });
    }
    setFinances(updatedFinances);
    addActivityLogEntry({ user: 'Admin', action: 'Xodimga maosh to\'landi', target: `${member.firstName} ${member.lastName} - ${formatMoney(member.totalSalary)} so'm` });
    toast(`${member.firstName} ${member.lastName}ga maosh to'landi.`, 'success');
    setConfirmPayout(null);
  };

  const handleAddPayment = () => {
    if (!paymentForm.amount || isNaN(Number(paymentForm.amount)) || Number(paymentForm.amount) <= 0) {
      toast('To\'g\'ri miqdor kiriting', 'error'); return;
    }
    const member = paymentModal;
    const newPayment = {
      id: `PAY-${Date.now()}`,
      type: paymentForm.type,
      amount: Number(paymentForm.amount),
      note: paymentForm.note,
      date: new Date().toISOString().split('T')[0],
      by: 'Admin'
    };
    const paymentHistory = [...(member.paymentHistory || []), newPayment];
    updateStaff(member.id, { paymentHistory });

    // Record in finances
    const today = new Date().toISOString().split('T')[0];
    const isExpense = ['salary', 'bonus', 'advance', 'loan'].includes(paymentForm.type);
    const isIncome = paymentForm.type === 'loan_repayment';
    if (isExpense) {
      const updatedFinances = finances.map(f => f.date === today ? { ...f, expense: f.expense + Number(paymentForm.amount) } : f);
      if (!finances.some(f => f.date === today)) {
        updatedFinances.push({ date: today, income: 0, expense: Number(paymentForm.amount), patients: 0 });
      }
      setFinances(updatedFinances);
    } else if (isIncome) {
      const updatedFinances = finances.map(f => f.date === today ? { ...f, income: f.income + Number(paymentForm.amount) } : f);
      if (!finances.some(f => f.date === today)) {
        updatedFinances.push({ date: today, income: Number(paymentForm.amount), expense: 0, patients: 0 });
      }
      setFinances(updatedFinances);
    }

    const typeLabel = PAYMENT_TYPES.find(t => t.key === paymentForm.type)?.label || paymentForm.type;
    const actionText = paymentForm.type === 'loan_repayment' ? 'Xodimdan qarz to\'lovi qabul qilindi' : `Xodimga ${typeLabel} berildi`;
    addActivityLogEntry({ user: 'Admin', action: actionText, target: `${member.firstName} ${member.lastName} - ${formatMoney(Number(paymentForm.amount))} so'm` });
    toast(`${typeLabel} muvaffaqiyatli qo'shildi!`, 'success');
    setPaymentModal(null);
    setPaymentForm({ type: 'bonus', amount: '', note: '' });
  };

  const handleExport = () => {
    const data = payrollList.map(m => ({
      ID: m.id,
      Xodim: `${m.firstName} ${m.lastName}`,
      Lavozim: ROLES[m.role]?.label || m.role,
      'Asosiy maosh': m.salary,
      'KPI faollik': `${m.kpiActivity} ${m.kpiUnit}`,
      'KPI Bonus': m.kpiBonus,
      'Jami Maosh': m.totalSalary,
      Holat: m.status === 'paid' ? 'To\'langan' : 'Kutilmoqda'
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `klinika_payroll_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Payroll ro'yxati JSON ko'rinishida yuklandi.", 'success');
  };

  return (
    <div className="animate-fadeIn">
      <Header title="Maosh va KPI Boshqaruvi" subtitle="Xodimlar faolligi, KPI va moliyaviy operatsiyalar" role="admin" />

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<DollarSign size={24} />} title="Jami maoshlar" value={`${formatMoney(stats.totalPayroll)} so'm`} colorClass="stat-blue" />
        <StatCard icon={<CheckCircle size={24} />} title="To'langan" value={`${formatMoney(stats.totalPaid)} so'm`} colorClass="stat-green" />
        <StatCard icon={<Clock size={24} />} title="To'lov kutilmoqda" value={`${formatMoney(stats.totalPending)} so'm`} colorClass="stat-yellow" />
        <StatCard icon={<Award size={24} />} title="Eng faol xodim" value={stats.topPerformerName} subtitle={`${stats.topPerformerRole} (+${formatMoney(stats.topPerformerBonus)} so'm)`} colorClass="stat-purple" />
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          className={`btn btn-sm ${activeSection === 'payroll' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveSection('payroll')}
        >
          <Award size={14} /> Oylik Varaqasi
        </button>
        <button
          className={`btn btn-sm ${activeSection === 'payments' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveSection('payments')}
        >
          <CreditCard size={14} /> Bonus / Avans / Qarz
        </button>
      </div>

      {activeSection === 'payroll' && (
        <>
          {/* Control Buttons */}
          <div className="flex gap-3 mb-4 no-print justify-between flex-wrap">
            <h3 className="text-lg font-bold text-gray-900 my-auto">Xodimlar oylik varaqasi</h3>
            <div className="flex gap-2">
              <button className="btn btn-outline btn-sm" onClick={handleExport}>
                <Download size={16} /> JSON ga eksport
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
                <Printer size={16} /> Hisobotni chop etish
              </button>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Xodim</th>
                    <th>Lavozim</th>
                    <th>Asosiy maosh</th>
                    <th>KPI Faolligi</th>
                    <th>KPI Bonus</th>
                    <th>Jami maosh</th>
                    <th className="no-print">Holat</th>
                    <th className="no-print">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollList.map(member => (
                    <tr key={member.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: ROLES[member.role]?.color || '#6B7280' }}>
                            {member.firstName?.[0]}{member.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{member.firstName} {member.lastName}</div>
                            <div className="text-xs text-gray-500">{formatDate(member.hireDate)}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ background: ROLES[member.role]?.color + '15', color: ROLES[member.role]?.color }}>
                          {ROLES[member.role]?.label || member.role}
                        </span>
                      </td>
                      <td className="font-medium">{formatMoney(member.salary)} so&apos;m</td>
                      <td className="font-semibold">{member.kpiActivity} {member.kpiUnit}</td>
                      <td className="text-green-600 font-semibold">+{formatMoney(member.kpiBonus)} so&apos;m</td>
                      <td className="font-bold text-gray-900">{formatMoney(member.totalSalary)} so&apos;m</td>
                      <td className="no-print">
                        <span className={`badge ${member.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                          {member.status === 'paid' ? 'To\'landi' : 'Kutilmoqda'}
                        </span>
                      </td>
                      <td className="no-print">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-start gap-1">
                            <button 
                              className={`btn btn-sm ${member.lastSalaryPaidDate && member.lastSalaryPaidDate.startsWith(new Date().toISOString().slice(0, 7)) ? 'btn-outline border-green-500 text-green-600' : 'btn-success'}`}
                              onClick={() => setConfirmPayout(member)}
                            >
                              {member.lastSalaryPaidDate && member.lastSalaryPaidDate.startsWith(new Date().toISOString().slice(0, 7)) ? "Qayta to'lash" : "Maosh to'lash"}
                            </button>
                            {member.lastSalaryPaidDate && (
                              <span className="text-[10px] text-gray-400 font-medium">Oxirgi: {formatDate(member.lastSalaryPaidDate)}</span>
                            )}
                          </div>
                          <button className="btn btn-icon btn-outline btn-sm" onClick={() => handleEditKpi(member)} title="KPI tahrirlash">
                            <Edit size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
 
      {activeSection === 'payments' && (
        <>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <h3 className="text-lg font-bold text-gray-900">Xodimlar balans boshqaruvi</h3>
            <p className="text-sm text-gray-500">Bonus, avans yoki qarz berish uchun xodimni tanlang</p>
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {payrollList.map(member => (
              <div key={member.id} className="card p-5 hover:shadow-lg transition-shadow">
                {/* Staff header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0" style={{ background: ROLES[member.role]?.color || '#6B7280' }}>
                    {member.firstName?.[0]}{member.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{member.firstName} {member.lastName}</p>
                    <p className="text-xs text-gray-500">{ROLES[member.role]?.label || member.role}</p>
                  </div>
                </div>
                {/* Balance info */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-3 mb-3">
                  <p className="text-xs text-gray-500 mb-1">Joriy balans (taxminiy)</p>
                  <p className="text-xl font-bold text-gray-900">{formatMoney(member.currentBalance)} <span className="text-sm font-normal text-gray-500">so&apos;m</span></p>
                </div>

                {/* Qarz qoldig'i ogohlantirish kartasi */}
                {member.totalLoans - (member.totalRepayments || 0) > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3 flex items-center gap-2 animate-fadeIn">
                    <AlertTriangle size={18} className="text-red-500 shrink-0" />
                    <div>
                      <p className="text-[10px] text-red-600 font-semibold uppercase tracking-wider">Qarz qoldig&apos;i</p>
                      <p className="text-sm font-bold text-red-700">{formatMoney(member.totalLoans - (member.totalRepayments || 0))} so&apos;m</p>
                    </div>
                  </div>
                )}

                {/* Mini stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-green-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">Oylik</p>
                    <p className="text-sm font-bold text-green-700">{formatMoney(member.totalSalary)}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">Bonus</p>
                    <p className="text-sm font-bold text-blue-700">+{formatMoney(member.totalBonuses)}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">Avans</p>
                    <p className="text-sm font-bold text-orange-600">-{formatMoney(member.totalAdvances)}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">Qarz</p>
                    <p className="text-sm font-bold text-purple-600">-{formatMoney(member.totalLoans)}</p>
                  </div>
                </div>

                {/* Last payments */}
                {member.paymentHistory.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">So&apos;nggi to&apos;lovlar</p>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {[...member.paymentHistory].reverse().slice(0, 3).map(p => {
                        const pt = PAYMENT_TYPES.find(t => t.key === p.type);
                        return (
                          <div key={p.id} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1">
                              <span>{pt?.icon}</span>
                              <span className="text-gray-600">{pt?.label}</span>
                            </span>
                            <span className="font-semibold" style={{ color: pt?.color }}>{formatMoney(p.amount)} so&apos;m</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  className="btn btn-primary w-full btn-sm"
                  onClick={() => { setPaymentModal(member); setPaymentForm({ type: 'bonus', amount: '', note: '' }); }}
                >
                  <Plus size={14} /> To&apos;lov qo&apos;shish
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Payout Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmPayout}
        title="Maosh to'lash"
        message={
          confirmPayout 
            ? `${confirmPayout.lastSalaryPaidDate && confirmPayout.lastSalaryPaidDate.startsWith(new Date().toISOString().slice(0, 7)) 
                ? "Siz bu oy uchun oylik bergansiz. Baribir to'lamoqchimisiz?\n\n" 
                : ""}${confirmPayout.firstName} ${confirmPayout.lastName}ga jami ${formatMoney(confirmPayout.totalSalary)} so'm maosh to'lamoqchimisiz?` 
            : ''
        }
        onConfirm={() => handlePay(confirmPayout)}
        onCancel={() => setConfirmPayout(null)}
        danger={!!(confirmPayout?.lastSalaryPaidDate && confirmPayout.lastSalaryPaidDate.startsWith(new Date().toISOString().slice(0, 7)))}
        confirmText={confirmPayout?.lastSalaryPaidDate && confirmPayout.lastSalaryPaidDate.startsWith(new Date().toISOString().slice(0, 7)) ? "Baribir to'lash" : "Ha, to'lash"}
      />

      {/* KPI Edit Modal */}
      <Modal isOpen={!!editingKpi} onClose={() => setEditingKpi(null)} title="KPI ko'rsatkichlarini tahrirlash">
        {editingKpi && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 font-medium">Xodim: <span className="text-gray-900 font-semibold">{editingKpi.firstName} {editingKpi.lastName}</span></p>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">KPI Faolligi ({editingKpi.kpiLabel} - {editingKpi.kpiUnit})</label>
              <input className="input" type="number" value={kpiForm.activity} onChange={e => setKpiForm({ ...kpiForm, activity: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">KPI Stavkasi (so&apos;m / {editingKpi.kpiUnit})</label>
              <input className="input" type="number" value={kpiForm.rate} onChange={e => setKpiForm({ ...kpiForm, rate: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn btn-outline" onClick={() => setEditingKpi(null)}>Bekor qilish</button>
              <button className="btn btn-primary" onClick={handleSaveKpi}>Saqlash</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Payment Modal */}
      <Modal isOpen={!!paymentModal} onClose={() => setPaymentModal(null)} title={`To&apos;lov qo&apos;shish — ${paymentModal?.firstName} ${paymentModal?.lastName}`}>
        {paymentModal && (
          <div className="space-y-5">
            {/* Staff info */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: ROLES[paymentModal.role]?.color }}>
                {paymentModal.firstName?.[0]}{paymentModal.lastName?.[0]}
              </div>
              <div>
                <p className="font-bold text-gray-900">{paymentModal.firstName} {paymentModal.lastName}</p>
                <p className="text-xs text-gray-500">{ROLES[paymentModal.role]?.label} • Joriy balans: <span className="font-semibold text-gray-700">{formatMoney(payrollList.find(m => m.id === paymentModal.id)?.currentBalance || 0)} so&apos;m</span></p>
              </div>
            </div>

            {/* Payment type selector */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">To&apos;lov turi</label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {PAYMENT_TYPES.map(pt => (
                  <button
                    key={pt.key}
                    onClick={() => setPaymentForm(f => ({ ...f, type: pt.key }))}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${
                      paymentForm.type === pt.key
                        ? 'border-current shadow-md'
                        : 'border-transparent bg-gray-50 hover:bg-gray-100'
                    }`}
                    style={paymentForm.type === pt.key ? { borderColor: pt.color, background: pt.color + '15' } : {}}
                  >
                    <span className="text-xl">{pt.icon}</span>
                    <span className="text-xs font-medium" style={paymentForm.type === pt.key ? { color: pt.color } : { color: '#6B7280' }}>{pt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Miqdor (so&apos;m) *</label>
              <input
                className="input text-lg font-bold"
                type="number"
                placeholder="0"
                value={paymentForm.amount}
                onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))}
              />
            </div>

            {/* Note */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Izoh (ixtiyoriy)</label>
              <input
                className="input"
                placeholder="To'lov sababi..."
                value={paymentForm.note}
                onChange={e => setPaymentForm(f => ({ ...f, note: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button className="btn btn-outline" onClick={() => setPaymentModal(null)}>Bekor qilish</button>
              <button
                className="btn btn-primary"
                onClick={handleAddPayment}
                style={{ background: PAYMENT_TYPES.find(t => t.key === paymentForm.type)?.color }}
              >
                {PAYMENT_TYPES.find(t => t.key === paymentForm.type)?.icon} {paymentForm.type === 'loan_repayment' ? 'Qarz to\'lovini kiritish' : `${PAYMENT_TYPES.find(t => t.key === paymentForm.type)?.label} berish`}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ===== SMS MANAGEMENT =====
function SmsManagement() {
  const { smsQueue, addSms, clearSmsQueue, retryFailedSms, deleteSms, clinicSettings, setClinicSettings } = useCrm();
  const toast = useToast();
  const [numbers, setNumbers] = useState([]);
  const [template, setTemplate] = useState("Salom, bu $nomer band qilinganmi?");
  const [scheduledTime, setScheduledTime] = useState("");
  const [simSlot, setSimSlot] = useState(0);
  const [fileName, setFileName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [smsCostInput, setSmsCostInput] = useState(clinicSettings.smsCost || 150);

  // New state for treatment reminder template
  const [scheduledTemplate, setScheduledTemplate] = useState(
    clinicSettings.scheduledSmsTemplate || 
    "Hurmatli $bemor, sizda $sana kuni soat $vaqt da $muolaja muolajasi bor. Kelishingizni kutamiz. Tel: $tel"
  );

  useEffect(() => {
    if (clinicSettings.scheduledSmsTemplate) {
      setScheduledTemplate(clinicSettings.scheduledSmsTemplate);
    }
  }, [clinicSettings.scheduledSmsTemplate]);

  const handleSaveCost = () => {
    setClinicSettings({ ...clinicSettings, smsCost: Number(smsCostInput) });
    toast("SMS narxi muvaffaqiyatli saqlandi!", "success");
  };

  const handleSaveScheduledTemplate = () => {
    setClinicSettings({ ...clinicSettings, scheduledSmsTemplate: scheduledTemplate });
    toast("Muolaja SMS shabloni muvaffaqiyatli saqlandi!", "success");
  };

  const copyToClipboard = (text, type) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast(`${type} havolasi nusxalandi!`, "success");
    } else {
      toast("Nusxa olishda xatolik yuz berdi", "error");
    }
  };

  const baseUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : 'http://localhost:3000';
  const marketingApiUrl = `${baseUrl}/api/sms/marketing`;
  const scheduledApiUrl = `${baseUrl}/api/sms/scheduled`;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    
    const fileExt = file.name.split('.').pop().toLowerCase();
    setLoading(true);
    
    try {
      if (fileExt === 'xlsx' || fileExt === 'xls') {
        const reader = new FileReader();
        reader.onload = async (evt) => {
          try {
            const XLSX = await new Promise((resolve) => {
              if (window.XLSX) {
                resolve(window.XLSX);
                return;
              }
              const script = document.createElement('script');
              script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
              script.onload = () => resolve(window.XLSX);
              document.head.appendChild(script);
              document.head.appendChild(script);
            });
            
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            const parsedNumbers = [];
            json.forEach(row => {
              if (Array.isArray(row)) {
                row.forEach(cell => {
                  if (cell !== undefined && cell !== null) {
                    const cleaned = String(cell).replace(/[\s-()]/g, '');
                    if (/^\+?[0-9]{9,15}$/.test(cleaned)) {
                      const normalized = normalizeUzPhone(cleaned);
                      if (normalized) {
                        parsedNumbers.push(normalized);
                      }
                    }
                  }
                });
              }
            });
            
            const uniqueNumbers = [...new Set(parsedNumbers)];
            setNumbers(uniqueNumbers);
            toast(`${uniqueNumbers.length} ta telefon raqami Excel fayldan yuklandi!`, 'success');
          } catch (error) {
            toast("Excel faylni o'qishda xatolik yuz berdi!", 'error');
          } finally {
            setLoading(false);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const text = evt.target.result;
          const matches = text.match(/\+?[0-9\s-()]{9,18}/g) || [];
          const parsedNumbers = [];
          matches.forEach(m => {
            const cleaned = m.replace(/[\s-()]/g, '');
            if (/^\+?[0-9]{9,15}$/.test(cleaned)) {
              const normalized = normalizeUzPhone(cleaned);
              if (normalized) {
                parsedNumbers.push(normalized);
              }
            }
          });
          const uniqueNumbers = [...new Set(parsedNumbers)];
          setNumbers(uniqueNumbers);
          toast(`${uniqueNumbers.length} ta telefon raqami fayldan yuklandi!`, 'success');
          setLoading(false);
        };
        reader.onerror = () => {
          toast("Faylni o'qishda xatolik yuz berdi!", 'error');
          setLoading(false);
        };
        reader.readAsText(file);
      }
    } catch (err) {
      toast("Fayl qayta ishlashda xatolik: " + err.message, "error");
      setLoading(false);
    }
  };

  const handleInsertTag = () => {
    setTemplate(prev => prev + " $nomer");
  };

  const handleSendCampaign = () => {
    if (numbers.length === 0) {
      toast("Iltimos, avval telefon raqamlar bazasini yuklang!", "error");
      return;
    }
    if (!template.trim()) {
      toast("Iltimos, SMS xabar matnini yozing!", "error");
      return;
    }

    const campaignId = 'CAM-' + Date.now();
    const smsList = numbers.map((num, i) => {
      const msg = template.replace(/\$nomer/g, num);
      return {
        id: `SMS-${campaignId}-${i}`,
        phone: num,
        message: msg,
        status: 'pending',
        type: 'marketing',
        sim: Number(simSlot),
        createdAt: new Date().toISOString(),
        scheduledFor: scheduledTime ? new Date(scheduledTime).toISOString() : new Date().toISOString()
      };
    });

    addSms(smsList);
    toast(`${smsList.length} ta xabar muvaffaqiyatli navbatga qo'shildi!`, "success");
    setNumbers([]);
    setFileName("");
    setScheduledTime("");
  };

  const stats = useMemo(() => {
    const total = smsQueue.length;
    const pending = smsQueue.filter(s => s.status === 'pending').length;
    const sent = smsQueue.filter(s => s.status === 'sent').length;
    const failed = smsQueue.filter(s => s.status === 'failed').length;
    const totalCost = sent * (clinicSettings.smsCost || 150);
    return { total, pending, sent, failed, totalCost };
  }, [smsQueue, clinicSettings.smsCost]);

  const filteredLogs = useMemo(() => {
    return smsQueue.filter(sms => {
      const matchSearch = !searchQuery || sms.phone.includes(searchQuery) || sms.message.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || sms.status === statusFilter;
      return matchSearch && matchStatus;
    }).reverse();
  }, [smsQueue, searchQuery, statusFilter]);

  const previewText = useMemo(() => {
    if (numbers.length > 0) {
      return template.replace(/\$nomer/g, numbers[0]);
    }
    return template.replace(/\$nomer/g, "+998901234567");
  }, [template, numbers]);

  return (
    <div>
      <Header title="SMS Boshqaruvi" subtitle="SMS Gateway yordamida guruhli va avtomatik bildirishnomalar yuborish" role="admin" />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard icon={<Mail size={24} />} title="Jami xabarlar" value={stats.total} colorClass="stat-blue" />
        <StatCard icon={<Clock size={24} />} title="Kutilmoqda" value={stats.pending} colorClass="stat-yellow" />
        <StatCard icon={<CheckCircle size={24} />} title="Yuborildi" value={stats.sent} colorClass="stat-green" />
        <StatCard icon={<XCircle size={24} />} title="Xatolik berdi" value={stats.failed} colorClass="stat-red" />
        <StatCard icon={<DollarSign size={24} />} title="Sarflangan mablag'" value={`${formatMoney(stats.totalCost)} so'm`} subtitle={`Tarif: ${clinicSettings.smsCost || 150} so'm/SMS`} colorClass="stat-purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="card p-5 flex flex-col gap-4">
            <h3 className="font-bold text-gray-900 mb-2 border-b border-gray-100 pb-2">Yangi SMS kampaniyasi</h3>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">1. Baza Yuklash (.txt, .csv, .xlsx)</label>
              <div className="flex items-center gap-3">
                <label className="btn btn-outline cursor-pointer flex items-center gap-2 flex-1 text-center justify-center py-2.5">
                  <Download size={14} className="rotate-180" />
                  <span>{fileName ? `${fileName.substring(0, 18)}...` : "Fayl tanlang"}</span>
                  <input type="file" accept=".txt,.csv,.xlsx,.xls" className="hidden" onChange={handleFileChange} />
                </label>
                {numbers.length > 0 && (
                  <span className="badge badge-success font-bold py-2 shrink-0">{numbers.length} ta raqam</span>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase block">2. SMS Xabar Matni</label>
                <button className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1" onClick={handleInsertTag}>
                  + $nomer qo'shish
                </button>
              </div>
              <textarea
                className="input w-full min-h-[100px] text-sm"
                rows={4}
                placeholder="SMS matnini kiriting. Masalan: Salom bu $nomer sizmi?"
                value={template}
                onChange={e => setTemplate(e.target.value)}
              />
            </div>

            <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-3 text-xs">
              <span className="font-bold text-blue-800 dark:text-blue-400 block mb-1">SMS xabar namunasi:</span>
              <p className="text-gray-700 dark:text-gray-300 italic font-mono">"{previewText}"</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">SIM Slot</label>
                <select className="input select py-2" value={simSlot} onChange={e => setSimSlot(Number(e.target.value))}>
                  <option value={0}>SIM-1 (Slot 0)</option>
                  <option value={1}>SIM-2 (Slot 1)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Yuborish vaqti (Ixtiyoriy)</label>
                <input className="input py-2 text-xs" type="datetime-local" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} />
              </div>
            </div>

            <button className="btn btn-primary w-full py-3 mt-2 font-bold" onClick={handleSendCampaign} disabled={loading || numbers.length === 0}>
              {loading ? "Fayl o'qilmoqda..." : `SMS Navbatga Yuklash (${numbers.length} ta raqam)`}
            </button>
          </div>

          <div className="card p-5 flex flex-col gap-4 border-t-4 border-t-purple-500 shadow-md">
            <h3 className="font-bold text-gray-900 mb-2 border-b border-gray-100 pb-2 flex items-center justify-between">
              <span>SMS Gateway & Sozlamalar</span>
              {clinicSettings.lastSmsPollTime ? (
                (() => {
                  const diff = Date.now() - new Date(clinicSettings.lastSmsPollTime).getTime();
                  const isOnline = diff < 60000 * 5; // 5 mins
                  return (
                    <span className={`badge ${isOnline ? 'badge-success' : 'badge-danger'} text-[10px] py-1`}>
                      {isOnline ? "🟢 Onlayn" : "🔴 Offlayn"}
                    </span>
                  );
                })()
              ) : (
                <span className="badge badge-gray text-[10px] py-1">🔴 Offlayn</span>
              )}
            </h3>
            {clinicSettings.lastSmsPollTime && (
              <p className="text-[10px] text-gray-400 -mt-3 mb-1 font-mono">
                Oxirgi bog'lanish: {new Date(clinicSettings.lastSmsPollTime).toLocaleString('uz-UZ')}
              </p>
            )}

            <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl flex items-center justify-between gap-2 border border-black/5">
              <div>
                <p className="text-xs font-semibold text-gray-500">SMS Xabar Tarif Narxi</p>
                <p className="text-[10px] text-gray-400">1 dona xabar yuborish narxi</p>
              </div>
              <div className="flex gap-1 items-center">
                <input className="input py-1 px-2 text-xs w-20 font-bold font-mono text-right" type="number" value={smsCostInput} onChange={e => setSmsCostInput(e.target.value)} />
                <span className="text-xs text-gray-500 font-semibold">so'm</span>
                <button className="btn btn-primary btn-sm py-1 px-2 text-xs" onClick={handleSaveCost}>Saqlash</button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-500 uppercase block">Muolaja eslatma shabloni</label>
                <div className="flex flex-wrap gap-1">
                  {['$bemor', '$sana', '$vaqt', '$muolaja', '$tel'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      className="text-[9px] bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 px-1.5 py-0.5 rounded font-mono font-semibold"
                      onClick={() => setScheduledTemplate(prev => prev + " " + tag)}
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                className="input w-full min-h-[90px] text-xs font-sans"
                rows={3}
                placeholder="Muolajalar uchun eslatma SMS shabloni..."
                value={scheduledTemplate}
                onChange={e => setScheduledTemplate(e.target.value)}
              />
              <button className="btn btn-outline btn-sm w-full py-1.5 text-xs font-semibold" onClick={handleSaveScheduledTemplate}>
                Shablonni saqlash
              </button>
            </div>

            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-white/5">
              <h4 className="text-xs font-bold text-gray-900 uppercase">Android SMS Gateway API</h4>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-semibold text-gray-500">1. Marketing API (GET/POST)</span>
                    <button 
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                      onClick={() => copyToClipboard(marketingApiUrl, 'Marketing API')}
                    >
                      <Copy size={10} /> Nusxa olish
                    </button>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 p-2 rounded-lg font-mono text-[10px] text-gray-600 dark:text-gray-300 break-all select-all border border-black/5">
                    {marketingApiUrl}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-semibold text-gray-500">2. Majburiy (Muolaja) API (GET/POST)</span>
                    <button 
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                      onClick={() => copyToClipboard(scheduledApiUrl, 'Muolaja API')}
                    >
                      <Copy size={10} /> Nusxa olish
                    </button>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 p-2 rounded-lg font-mono text-[10px] text-gray-600 dark:text-gray-300 break-all select-all border border-black/5">
                    {scheduledApiUrl}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 card p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2 flex-wrap gap-2">
            <h3 className="font-bold text-gray-900">SMS yuborish jurnali</h3>
            <div className="flex gap-2">
              <button className="btn btn-outline btn-sm text-red-500 hover:bg-red-50" onClick={clearSmsQueue}>
                Navbatni tozalash
              </button>
              <button className="btn btn-outline btn-sm text-yellow-600 hover:bg-yellow-50" onClick={retryFailedSms}>
                <RefreshCw size={12} className="inline mr-1" /> Xatoliklarni qaytarish
              </button>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <input
              className="input pl-3 text-xs w-48"
              placeholder="Nomer yoki xabardan qidirish..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <select className="input select text-xs w-36 py-1" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">Barcha holatlar</option>
              <option value="pending">Kutilmoqda</option>
              <option value="sent">Yuborildi</option>
              <option value="failed">Xatolik</option>
            </select>
          </div>

          <div className="overflow-x-auto max-h-[360px] border border-gray-100 dark:border-white/5 rounded-xl">
            <table className="data-table text-xs">
              <thead>
                <tr>
                  <th>Telefon</th>
                  <th>Xabar matni</th>
                  <th>Rejalashtirilgan</th>
                  <th>Holat</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-400 italic">SMS jurnali bo'sh</td>
                  </tr>
                ) : (
                  filteredLogs.map(sms => (
                    <tr key={sms.id}>
                      <td className="font-mono whitespace-nowrap">{sms.phone}</td>
                      <td className="max-w-[200px] truncate" title={sms.message}>{sms.message}</td>
                      <td className="whitespace-nowrap text-gray-500">
                        {sms.scheduledFor ? new Date(sms.scheduledFor).toLocaleString('uz-UZ', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : "Hozir"}
                      </td>
                      <td>
                        <span className={`badge ${sms.status === 'sent' ? 'badge-success' : sms.status === 'failed' ? 'badge-danger' : 'badge-warning'}`}>
                          {sms.status === 'sent' ? 'Yuborildi' : sms.status === 'failed' ? 'Xatolik' : 'Kutilmoqda'}
                        </span>
                        {sms.error && <p className="text-[10px] text-red-500 mt-0.5 truncate max-w-[120px]" title={sms.error}>{sms.error}</p>}
                      </td>
                      <td>
                        <button className="btn btn-icon btn-outline btn-sm text-red-500" onClick={() => deleteSms(sms.id)}>
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}