'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useCrm } from '@/lib/CrmContext';
import { ROLES, ROOM_TYPES, ROOM_STATUSES, MEDICINE_CATEGORIES, SERVICE_CATEGORIES, generateId } from '@/lib/demoData';
import {
  Sidebar, Header, StatCard, Modal, ConfirmDialog, TabNav,
  EmptyState, useToast, formatMoney, formatDate, getAge,
} from './SharedComponents';
import {
  LayoutDashboard, Users, BedDouble, Pill, DollarSign, ClipboardList,
  BarChart3, Settings, Plus, Edit, Trash2, Eye, Download, Printer, Award,
  UserPlus, Search, Filter, TrendingUp, TrendingDown, Activity,
  AlertTriangle, Calendar, Clock, CheckCircle, XCircle, RefreshCw,
  Building2, Phone, Mail, MapPin, Shield, ChevronRight, Package,
  FileText, CreditCard, PieChart, ArrowUpDown
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart as RPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { key: 'staff', label: 'Xodimlar', icon: <Users size={18} /> },
  { key: 'rooms', label: 'Xonalar', icon: <BedDouble size={18} /> },
  { key: 'pharmacy', label: 'Dorilar Ombori', icon: <Pill size={18} /> },
  { key: 'finance', label: 'Moliya', icon: <DollarSign size={18} /> },
  { key: 'kpi', label: 'Maosh & KPI', icon: <Award size={18} /> },
  { key: 'services', label: 'Xizmatlar', icon: <ClipboardList size={18} /> },
  { key: 'reports', label: 'Hisobotlar', icon: <BarChart3 size={18} /> },
  { key: 'settings', label: 'Sozlamalar', icon: <Settings size={18} /> },
];

const COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#EF4444', '#9333EA', '#EC4899', '#06B6D4', '#84CC16'];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex">
      <Sidebar role="admin" tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="main-content">
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'staff' && <StaffManagement />}
        {activeTab === 'rooms' && <RoomsManagement />}
        {activeTab === 'pharmacy' && <PharmacyManagement />}
        {activeTab === 'finance' && <FinanceManagement />}
        {activeTab === 'kpi' && <KpiManagement />}
        {activeTab === 'services' && <ServicesManagement />}
        {activeTab === 'reports' && <ReportsSection />}
        {activeTab === 'settings' && <SettingsSection />}
      </div>
    </div>
  );
}

// ===== DASHBOARD =====
function AdminDashboard() {
  const { patients, rooms, finances, activityLog, medicines } = useCrm();
  const today = new Date().toISOString().split('T')[0];

  const stats = useMemo(() => {
    const todayPatients = patients.filter(p => p.admissionDate === today);
    const freeRooms = rooms.filter(r => r.status === 'free').length;
    const busyRooms = rooms.filter(r => r.status === 'busy').length;
    const todayFinance = finances.find(f => f.date === today);
    const monthIncome = finances.reduce((s, f) => s + f.income, 0);
    const queuePatients = patients.filter(p => p.queueStatus === 'waiting').length;
    const recoveredToday = patients.filter(p => p.status === 'tuzalgan' && p.visits?.some(v => v.date === today)).length;
    const lowMeds = medicines.filter(m => m.quantity <= m.minStock).length;

    return {
      todayPatients: todayPatients.length,
      freeRooms, busyRooms,
      todayIncome: todayFinance?.income || 0,
      monthIncome,
      queuePatients,
      recoveredToday,
      lowMeds,
    };
  }, [patients, rooms, finances, medicines, today]);

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
        <StatCard icon={<AlertTriangle size={24} />} title="Kam dorilar" value={stats.lowMeds} colorClass="stat-red" />
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

  const emptyForm = { firstName: '', lastName: '', role: 'doctor', phone: '', email: '', address: '', salary: '', specialization: '', workDays: ['Dush', 'Sesh', 'Chor', 'Pay', 'Juma'], hireDate: new Date().toISOString().split('T')[0] };
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
    if (!form.firstName || !form.lastName || !form.phone) {
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

// ===== PHARMACY MANAGEMENT =====
function PharmacyManagement() {
  const { medicines, addMedicine, updateMedicine, deleteMedicine, suppliers } = useCrm();
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const emptyForm = { name: '', category: 'Antibiotik', quantity: 0, unit: 'tabletka', unitPrice: 0, expiryDate: '', minStock: 50, location: '', supplier: '' };
  const [form, setForm] = useState(emptyForm);

  const today = new Date();

  const filtered = useMemo(() => {
    return medicines.filter(m => {
      const matchSearch = !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = filterCategory === 'all' || m.category === filterCategory;
      if (filterStatus === 'low') return matchSearch && matchCategory && m.quantity <= m.minStock;
      if (filterStatus === 'expiring') return matchSearch && matchCategory && new Date(m.expiryDate) - today < 30 * 86400000;
      if (filterStatus === 'expired') return matchSearch && matchCategory && new Date(m.expiryDate) < today;
      return matchSearch && matchCategory;
    });
  }, [medicines, searchQuery, filterCategory, filterStatus, today]);

  const handleSubmit = () => {
    if (!form.name) { toast('Dori nomini kiriting', 'error'); return; }
    const data = { ...form, quantity: Number(form.quantity), unitPrice: Number(form.unitPrice), minStock: Number(form.minStock) };
    if (editingMed) {
      updateMedicine(editingMed.id, data);
      toast('Dori yangilandi', 'success');
    } else {
      addMedicine(data);
      toast('Yangi dori qo\'shildi', 'success');
    }
    setShowModal(false);
    setEditingMed(null);
    setForm(emptyForm);
  };

  const getMedStatus = (med) => {
    const expiry = new Date(med.expiryDate);
    if (expiry < today) return { label: "Muddati o'tgan", class: 'badge-danger' };
    if (expiry - today < 30 * 86400000) return { label: "Muddati yaqin", class: 'badge-warning' };
    if (med.quantity <= med.minStock) return { label: 'Kam qolgan', class: 'badge-danger' };
    return { label: 'Yetarli', class: 'badge-success' };
  };

  return (
    <div>
      <Header title="Dorilar Ombori" subtitle={`Jami: ${medicines.length} ta dori`} role="admin" />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Dori qidirish..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <select className="input select w-40" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="all">Barcha kategoriya</option>
          {MEDICINE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="input select w-40" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">Barcha holat</option>
          <option value="low">Kam qolgan</option>
          <option value="expiring">Muddati yaqin</option>
          <option value="expired">Muddati o&apos;tgan</option>
        </select>
        <button className="btn btn-primary" onClick={() => { setEditingMed(null); setForm(emptyForm); setShowModal(true); }}>
          <Plus size={16} /> Yangi dori
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Dori nomi</th>
                <th>Kategoriya</th>
                <th>Miqdor</th>
                <th>Birlik narxi</th>
                <th>Yaroqlilik</th>
                <th>Holat</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(med => {
                const status = getMedStatus(med);
                return (
                  <tr key={med.id}>
                    <td>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{med.name}</p>
                        <p className="text-xs text-gray-500">{med.location} • {med.supplier}</p>
                      </div>
                    </td>
                    <td><span className="badge badge-purple">{med.category}</span></td>
                    <td className={`text-sm font-medium ${med.quantity <= med.minStock ? 'text-red-600' : 'text-gray-900'}`}>{med.quantity} {med.unit}</td>
                    <td className="text-sm">{formatMoney(med.unitPrice)} so&apos;m</td>
                    <td className="text-sm">{formatDate(med.expiryDate)}</td>
                    <td><span className={`badge ${status.class}`}>{status.label}</span></td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="btn btn-icon btn-outline btn-sm" onClick={() => { setEditingMed(med); setForm({ ...med }); setShowModal(true); }}><Edit size={14} /></button>
                        <button className="btn btn-icon btn-outline btn-sm" onClick={() => { deleteMedicine(med.id); toast('Dori o\'chirildi', 'success'); }}><Trash2 size={14} className="text-red-500" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingMed ? 'Dorini tahrirlash' : 'Yangi dori'}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Nomi *</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Kategoriya</label>
            <select className="input select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {MEDICINE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Miqdori</label>
            <input className="input" type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Birlik</label>
            <input className="input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Birlik narxi</label>
            <input className="input" type="number" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Yaroqlilik muddati</label>
            <input className="input" type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Minimum miqdor</label>
            <input className="input" type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Joylashuv</label>
            <input className="input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Yetkazib beruvchi</label>
            <select className="input select" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}>
              <option value="">Tanlang...</option>
              {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>Bekor qilish</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editingMed ? 'Saqlash' : "Qo'shish"}</button>
        </div>
      </Modal>
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
  const { patients, staff, finances } = useCrm();
  const [reportType, setReportType] = useState('general');

  const genderData = useMemo(() => {
    const male = patients.filter(p => p.gender === 'Erkak').length;
    const female = patients.filter(p => p.gender === 'Ayol').length;
    return [{ name: 'Erkak', value: male }, { name: 'Ayol', value: female }];
  }, [patients]);

  const ageData = useMemo(() => {
    const groups = { '0-17': 0, '18-30': 0, '31-50': 0, '51-70': 0, '70+': 0 };
    patients.forEach(p => {
      const age = getAge(p.birthDate);
      if (age <= 17) groups['0-17']++;
      else if (age <= 30) groups['18-30']++;
      else if (age <= 50) groups['31-50']++;
      else if (age <= 70) groups['51-70']++;
      else groups['70+']++;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [patients]);

  const doctorPerformance = useMemo(() => {
    return staff.filter(s => s.role === 'doctor').map(d => ({
      name: `${d.firstName} ${d.lastName[0]}.`,
      bemorlar: d.patientsServed || 0,
      soatlar: d.hoursWorked || 0,
    }));
  }, [staff]);

  return (
    <div>
      <Header title="Hisobotlar" role="admin" />

      <TabNav
        tabs={[
          { key: 'general', label: 'Umumiy' },
          { key: 'doctors', label: 'Shifokorlar' },
          { key: 'demographics', label: 'Demografiya' },
        ]}
        activeTab={reportType}
        onChange={setReportType}
      />

      {reportType === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-4">Haftalik daromad</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={finances}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => (v / 1000000).toFixed(0) + 'M'} />
                <Tooltip formatter={v => formatMoney(v) + " so'm"} />
                <Area type="monotone" dataKey="income" stroke="#16A34A" fill="url(#incomeGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-4">Bemorlar jins taqsimoti</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RPieChart>
                <Pie data={genderData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                  <Cell fill="#2563EB" /><Cell fill="#EC4899" />
                </Pie>
                <Tooltip />
                <Legend />
              </RPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {reportType === 'doctors' && (
        <div className="card p-5">
          <h3 className="font-bold text-gray-900 mb-4">Shifokorlar samaradorligi</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={doctorPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="bemorlar" fill="#2563EB" name="Bemorlar" radius={[0, 4, 4, 0]} />
              <Bar dataKey="soatlar" fill="#16A34A" name="Ish soatlari" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {reportType === 'demographics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-4">Yosh guruhlari</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#9333EA" name="Bemorlar" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-4">Viloyat bo&apos;yicha</h3>
            {(() => {
              const regionMap = {};
              patients.forEach(p => {
                const r = p.address?.region || "Noma'lum";
                regionMap[r] = (regionMap[r] || 0) + 1;
              });
              return (
                <div className="space-y-2">
                  {Object.entries(regionMap).map(([region, count]) => (
                    <div key={region} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 w-32">{region}</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{ width: `${(count / patients.length) * 100}%` }} />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
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

  useEffect(() => { setForm(clinicSettings); }, [clinicSettings]);

  const handleSave = () => {
    setClinicSettings(form);
    toast('Sozlamalar saqlandi', 'success');
  };

  return (
    <div>
      <Header title="Sozlamalar" role="admin" />

      <div className="card p-6 max-w-2xl">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 size={18} /> Klinika ma&apos;lumotlari
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Klinika nomi</label>
            <input className="input" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Manzil</label>
            <input className="input" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Telefon</label>
              <input className="input" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
              <input className="input" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Ish vaqtlari (hafta kunlari)</label>
            <div className="flex gap-3 items-center">
              <input className="input w-28" type="time" value={form.workHours?.weekdays?.start || '08:00'} onChange={e => setForm({ ...form, workHours: { ...form.workHours, weekdays: { ...form.workHours?.weekdays, start: e.target.value } } })} />
              <span className="text-gray-400">—</span>
              <input className="input w-28" type="time" value={form.workHours?.weekdays?.end || '20:00'} onChange={e => setForm({ ...form, workHours: { ...form.workHours, weekdays: { ...form.workHours?.weekdays, end: e.target.value } } })} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-100">
          <button className="btn btn-primary" onClick={handleSave}>Saqlash</button>
          <button className="btn btn-outline" onClick={exportData}><Download size={16} /> Backup (JSON)</button>
          <button className="btn btn-danger ml-auto" onClick={() => setConfirmReset(true)}>
            <RefreshCw size={16} /> Ma&apos;lumotlarni tiklash
          </button>
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

// ===== KPI & PAYROLL =====
function KpiManagement() {
  const { staff, updateStaff, finances, setFinances, addActivityLogEntry } = useCrm();
  const toast = useToast();
  const [confirmPayout, setConfirmPayout] = useState(null);

  // Constants for KPI rates
  const KPI_RATES = {
    doctor: { label: 'Har bir bemor', rate: 50000, unit: 'bemor' },
    nurse: { label: 'Ishlagan soat', rate: 15000, unit: 'soat' },
    reception: { label: 'Bemor ro\'yxatga olish', rate: 10000, unit: 'bemor' }
  };

  // Compute calculated values for staff
  const payrollList = useMemo(() => {
    return staff.map(member => {
      const config = KPI_RATES[member.role] || { label: 'KPI Ko\'rsatkichi', rate: 0, unit: 'kpi' };
      const kpiActivity = member.role === 'nurse' ? (member.hoursWorked || 0) : (member.patientsServed || 0);
      const kpiBonus = kpiActivity * config.rate;
      const totalSalary = (member.salary || 0) + kpiBonus;
      return {
        ...member,
        kpiLabel: config.label,
        kpiRate: config.rate,
        kpiUnit: config.unit,
        kpiActivity,
        kpiBonus,
        totalSalary,
        status: member.salaryStatus || 'pending'
      };
    });
  }, [staff]);

  const stats = useMemo(() => {
    const totalPayroll = payrollList.reduce((s, m) => s + m.totalSalary, 0);
    const totalPaid = payrollList.filter(m => m.status === 'paid').reduce((s, m) => s + m.totalSalary, 0);
    const totalPending = totalPayroll - totalPaid;
    
    // Find top performer by KPI Bonus
    let topPerformer = null;
    let maxBonus = -1;
    payrollList.forEach(m => {
      if (m.kpiBonus > maxBonus) {
        maxBonus = m.kpiBonus;
        topPerformer = m;
      }
    });

    return {
      totalPayroll,
      totalPaid,
      totalPending,
      topPerformerName: topPerformer ? `${topPerformer.firstName} ${topPerformer.lastName}` : '—',
      topPerformerRole: topPerformer ? ROLES[topPerformer.role]?.label : '',
      topPerformerBonus: maxBonus
    };
  }, [payrollList]);

  const handlePay = (member) => {
    // 1. Update staff salary status in database
    updateStaff(member.id, { salaryStatus: 'paid' });

    // 2. Add expense transaction in global finances database
    const today = new Date().toISOString().split('T')[0];
    const updatedFinances = finances.map(f => {
      if (f.date === today) {
        return { ...f, expense: f.expense + member.totalSalary };
      }
      return f;
    });

    const hasToday = finances.some(f => f.date === today);
    if (!hasToday) {
      updatedFinances.push({
        date: today,
        income: 0,
        expense: member.totalSalary,
        patients: 0
      });
    }
    setFinances(updatedFinances);

    // 3. Log activity
    addActivityLogEntry({
      user: 'Admin',
      action: 'Xodimga maosh to\'landi',
      target: `${member.firstName} ${member.lastName} - ${formatMoney(member.totalSalary)} so'm`
    });

    toast(`${member.firstName} ${member.lastName}ga maosh to'landi.`, 'success');
    setConfirmPayout(null);
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
      <Header title="Maosh va KPI Boshqaruvi" subtitle="Xodimlar faolligi va KPI asosida hisoblangan maoshlar" role="admin" />

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<DollarSign size={24} />} title="Jami maoshlar" value={`${formatMoney(stats.totalPayroll)} so'm`} colorClass="stat-blue" />
        <StatCard icon={<CheckCircle size={24} />} title="To'langan" value={`${formatMoney(stats.totalPaid)} so'm`} colorClass="stat-green" />
        <StatCard icon={<Clock size={24} />} title="To'lov kutilmoqda" value={`${formatMoney(stats.totalPending)} so'm`} colorClass="stat-yellow" />
        <StatCard icon={<Award size={24} />} title="Eng faol xodim" value={stats.topPerformerName} subtitle={`${stats.topPerformerRole} (+${formatMoney(stats.topPerformerBonus)} so'm)`} colorClass="stat-purple" />
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3 mb-4 no-print justify-between">
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
                <th>KPI O'lchov birligi</th>
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
                    <div className="font-semibold text-gray-900">{member.firstName} {member.lastName}</div>
                    <div className="text-xs text-gray-500">{member.id} • Ishga kirgan: {formatDate(member.hireDate)}</div>
                  </td>
                  <td>
                    <span className="badge badge-info" style={{ background: ROLES[member.role]?.color + '15', color: ROLES[member.role]?.color }}>
                      {ROLES[member.role]?.label || member.role}
                    </span>
                  </td>
                  <td className="font-medium">{formatMoney(member.salary)} so'm</td>
                  <td className="text-gray-500 text-xs">{member.kpiLabel} ({formatMoney(member.kpiRate)} so'm)</td>
                  <td className="font-semibold">{member.kpiActivity} {member.kpiUnit}</td>
                  <td className="text-green-600 font-semibold">+{formatMoney(member.kpiBonus)} so'm</td>
                  <td className="font-bold text-gray-900">{formatMoney(member.totalSalary)} so'm</td>
                  <td className="no-print">
                    <span className={`badge ${member.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                      {member.status === 'paid' ? 'To\'landi' : 'Kutilmoqda'}
                    </span>
                  </td>
                  <td className="no-print">
                    {member.status === 'pending' ? (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => setConfirmPayout(member)}
                      >
                        Maosh to'lash
                      </button>
                    ) : (
                      <button
                        className="btn btn-outline btn-sm text-gray-400 border-gray-200 cursor-not-allowed"
                        disabled
                      >
                        To'langan
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Confirmation dialog */}
      <ConfirmDialog
        isOpen={!!confirmPayout}
        title="Maosh to'lash"
        message={confirmPayout ? `${confirmPayout.firstName} ${confirmPayout.lastName}ga jami ${formatMoney(confirmPayout.totalSalary)} so'm maosh to'lamoqchimisiz? Bu tranzaksiya moliya chiqimlariga yoziladi.` : ''}
        onConfirm={() => handlePay(confirmPayout)}
        onCancel={() => setConfirmPayout(null)}
        danger={false}
        confirmText="Ha, to'lash"
      />
    </div>
  );
}
