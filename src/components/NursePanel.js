'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCrm } from '@/lib/CrmContext';
import { ROLES, ROOM_STATUSES, DIET_TYPES, generateId } from '@/lib/demoData';
import {
  Sidebar, Header, StatCard, Modal, useToast, TabNav,
  formatMoney, formatDate, getAge, EmptyState, ConfirmDialog, ProfileSettings
} from './SharedComponents';
import {
  Map, Activity, ClipboardList, ArrowRightLeft, CheckSquare,
  Thermometer, Heart, Droplets, Wind, Plus, XCircle, CheckCircle,
  AlertTriangle, Clock, Pill, Utensils, FileText, Send, Bell,
  BedDouble, User, ChevronRight, Eye, AlertCircle, Settings
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const TABS = [
  { key: 'floorplan', label: 'Palatalar Xaritasi', icon: <Map size={18} /> },
  { key: 'tasks', label: 'Vazifalar', icon: <CheckSquare size={18} /> },
  { key: 'treatments', label: 'Muolaja Kurslari', icon: <Activity size={18} /> },
  { key: 'shift', label: 'Shift Topshirish', icon: <ArrowRightLeft size={18} /> },
  { key: 'settings', label: 'Sozlamalar', icon: <Settings size={18} /> },
];

const SOS_REASONS = ["Yurak to'xtadi", "Nafas yo'q", "Qon ketmoqda", "Ong yo'q", 'Boshqa'];

export default function NursePanel() {
  const [activeTab, setActiveTab] = useState('floorplan');
  const [selectedPatient, setSelectedPatient] = useState(null);

  return (
    <div className="flex">
      <Sidebar role="nurse" tabs={TABS} activeTab={activeTab} onTabChange={t => { setActiveTab(t); if (t !== 'floorplan') setSelectedPatient(null); }} />
      <div className="main-content">
        {activeTab === 'floorplan' && !selectedPatient && <FloorPlan onSelectPatient={setSelectedPatient} />}
        {activeTab === 'floorplan' && selectedPatient && <PatientMonitor patient={selectedPatient} onBack={() => setSelectedPatient(null)} />}
        {activeTab === 'tasks' && <NurseTasks />}
        {activeTab === 'treatments' && <TreatmentCourses />}
        {activeTab === 'shift' && <ShiftHandover />}
        {activeTab === 'settings' && (
          <div>
            <Header title="Sozlamalar" role="nurse" />
            <ProfileSettings />
          </div>
        )}
      </div>
    </div>
  );
}

// ===== FLOOR PLAN =====
function FloorPlan({ onSelectPatient }) {
  const { rooms, patients } = useCrm();

  const floors = useMemo(() => {
    const map = {};
    rooms.forEach(r => {
      if (!map[r.floor]) map[r.floor] = [];
      map[r.floor].push(r);
    });
    return Object.entries(map).sort((a, b) => a[0] - b[0]);
  }, [rooms]);

  const inpatientCount = patients.filter(p => p.status === 'stasionar').length;
  const freeCount = rooms.filter(r => r.status === 'free').length;

  return (
    <div>
      <Header title="Palatalar Xaritasi" subtitle={`${inpatientCount} bemor yotmoqda • ${freeCount} xona bo'sh`} role="nurse" />

      {floors.map(([floor, floorRooms]) => (
        <div key={floor} className="mb-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
            {floor}-Qavat
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {floorRooms.map(room => {
              const roomPatients = patients.filter(p => p.roomId === room.id && p.status === 'stasionar');
              const statusInfo = ROOM_STATUSES.find(s => s.key === room.status);

              return (
                <div
                  key={room.id}
                  className={`floor-room room-${room.status}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-gray-900 text-lg">#{room.number}</h4>
                    <span className="text-xl">{statusInfo?.emoji}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{room.type} (Joy: {roomPatients.length}/{room.capacity})</p>

                  {roomPatients.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      {roomPatients.map(p => {
                        const conditionColor = p.overallCondition === 'good' ? 'bg-green-500' : p.overallCondition === 'moderate' ? 'bg-yellow-500' : p.overallCondition === 'serious' ? 'bg-orange-500' : p.overallCondition === 'critical' ? 'bg-red-500' : 'bg-gray-400';
                        return (
                          <button
                            key={p.id}
                            onClick={() => onSelectPatient(p)}
                            className="w-full text-left p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200/60 transition-colors flex items-center gap-2"
                          >
                            <div className={`w-2 h-2 rounded-full ${conditionColor} shrink-0`} />
                            <div className="truncate flex-1">
                              <p className="text-xs font-semibold text-gray-800 truncate">{p.firstName} {p.lastName}</p>
                              <p className="text-[10px] text-gray-400">{getAge(p.birthDate)} yosh • {p.gender}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">{statusInfo?.label}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== PATIENT MONITOR =====
function PatientMonitor({ patient, onBack }) {
  const { updatePatient, patients, rooms, updateRoom, staff, user, addNotification, addActivityLogEntry, addPatientHistoryEvent } = useCrm();
  const toast = useToast();
  const [subTab, setSubTab] = useState('vitals');
  const [showVitalModal, setShowVitalModal] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showDischargeConfirm, setShowDischargeConfirm] = useState(false);
  const [showDietModal, setShowDietModal] = useState(false);
  const [showInjectionModal, setShowInjectionModal] = useState(false);
  const [injectionForm, setInjectionForm] = useState({ name: '', dose: '', method: 'Mushak ichiga' });

  const [vitalForm, setVitalForm] = useState({
    temperature: '', bloodPressure: '', pulse: '', respRate: '', spo2: '', sugar: '', weight: '',
  });
  const [noteForm, setNoteForm] = useState({ shift: 'Tonggi', note: '' });
  const [sosReason, setSosReason] = useState('');
  const [dietForm, setDietForm] = useState({
    type: 'Umumiy',
    restrictions: '',
    breakfastTime: '08:00',
    lunchTime: '13:00',
    dinnerTime: '18:00'
  });

  const handleDischarge = () => {
    updatePatient(patient.id, { roomId: null, status: 'tuzalgan', expectedDischarge: new Date().toISOString().split('T')[0] });
    
    // Also update room status back to free
    const roomObj = rooms.find(r => r.id === patient.roomId);
    if (roomObj) {
      const remainingOccupants = patients.filter(p => p.roomId === roomObj.id && p.id !== patient.id && p.status === 'stasionar').length;
      if (remainingOccupants < roomObj.capacity) {
        updateRoom(roomObj.id, { status: 'free' });
      }
    }

    addPatientHistoryEvent(patient.id, {
      type: 'discharge',
      title: 'Klinikadan javob berildi',
      details: 'Bemor tuzalib shifoxonadan chiqarildi'
    });

    toast('Bemor shifoxonadan chiqarildi', 'success');
    addActivityLogEntry({ user: user ? `${user.firstName} ${user.lastName} (Hamshira)` : 'Hamshira', action: 'Bemor shifoxonadan chiqarildi', target: `${patient.firstName} ${patient.lastName}` });
    onBack();
  };

  const doctor = staff.find(s => s.id === patient.assignedDoctor);
  const room = patient.roomId;

  const conditionLabel = patient.overallCondition === 'good' ? '🟢 Yaxshi' : patient.overallCondition === 'moderate' ? "🟡 O'rta" : patient.overallCondition === 'serious' ? "🔴 Og'ir" : "⚫ Juda og'ir";
  const conditionBadge = patient.overallCondition === 'good' ? 'badge-success' : patient.overallCondition === 'moderate' ? 'badge-warning' : 'badge-danger';

  // Give medication
  const giveMedication = (idx) => {
    const meds = [...(patient.medications || [])];
    meds[idx] = { ...meds[idx], status: 'given', nurse: user?.id, givenTime: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) };
    updatePatient(patient.id, { medications: meds });
    addActivityLogEntry({ user: user ? `${user.firstName} ${user.lastName} (Hamshira)` : 'Hamshira', action: 'Dori berildi', target: `${patient.firstName} ${patient.lastName} - ${meds[idx].name} ${meds[idx].dose}` });
    toast(`${meds[idx].name} berildi ✅`, 'success');
  };

  // Skip medication
  const skipMedication = (idx, reason) => {
    const meds = [...(patient.medications || [])];
    meds[idx] = { ...meds[idx], status: 'skipped', skipReason: reason || "Noma'lum sabab" };
    updatePatient(patient.id, { medications: meds });
    toast(`${meds[idx].name} - o'tkazildi`, 'warning');
  };

  // Complete treatment
  const completeTreatment = (idx) => {
    const treatments = [...(patient.treatments || [])];
    treatments[idx] = { ...treatments[idx], status: 'done', nurse: user?.id };
    updatePatient(patient.id, { treatments });
    toast(`${treatments[idx].name} - bajarildi ✅`, 'success');
  };

  // Record vital signs
  const handleVitals = () => {
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    const vital = {
      time, date: today, nurse: user?.id,
      temperature: parseFloat(vitalForm.temperature) || null,
      bloodPressure: vitalForm.bloodPressure || null,
      pulse: parseInt(vitalForm.pulse) || null,
      respRate: parseInt(vitalForm.respRate) || null,
      spo2: parseInt(vitalForm.spo2) || null,
      sugar: parseFloat(vitalForm.sugar) || null,
      weight: parseFloat(vitalForm.weight) || null,
    };
    updatePatient(patient.id, { vitalSigns: [...(patient.vitalSigns || []), vital] });
    addActivityLogEntry({ user: user ? `${user.firstName} ${user.lastName} (Hamshira)` : 'Hamshira', action: "Vital belgilar o'lchandi", target: `${patient.firstName} ${patient.lastName}` });
    toast('Vital belgilar saqlandi', 'success');
    setShowVitalModal(false);
    setVitalForm({ temperature: '', bloodPressure: '', pulse: '', respRate: '', spo2: '', sugar: '', weight: '' });
  };

  // SOS
  const handleSOS = () => {
    if (!sosReason) { toast('Sabab tanlang', 'error'); return; }
    addNotification({ type: 'sos', message: `🚨 SOS! ${patient.firstName} ${patient.lastName} — ${sosReason}`, roles: ['admin', 'doctor', 'nurse', 'reception'] });
    addActivityLogEntry({ user: user ? `${user.firstName} ${user.lastName} (Hamshira)` : 'Hamshira', action: 'SOS signal yuborildi', target: `${patient.firstName} ${patient.lastName} - ${sosReason}` });
    toast('🚨 SOS signal yuborildi!', 'error');
    setShowSOS(false);
    setSosReason('');
  };

  // Add nurse note
  const handleNote = () => {
    if (!noteForm.note) { toast('Izoh kiriting', 'error'); return; }
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    const newNote = { shift: noteForm.shift, time, note: noteForm.note, nurse: user?.id, date: today };
    updatePatient(patient.id, { nurseNotes: [...(patient.nurseNotes || []), newNote] });
    toast('Izoh saqlandi', 'success');
    setShowNoteModal(false);
    setNoteForm({ shift: 'Tonggi', note: '' });
  };

  // Update meal status
  const toggleMeal = (meal) => {
    if (!patient.diet) return;
    const isServed = !patient.diet.meals?.[meal];
    const meals = { ...(patient.diet.meals || {}), [meal]: isServed };
    updatePatient(patient.id, { diet: { ...patient.diet, meals } });

    if (isServed) {
      const mealLabels = { breakfast: 'Nonushta', lunch: 'Tushlik', dinner: 'Kechki ovqat', tea: 'Choy' };
      addPatientHistoryEvent(patient.id, {
        type: meal === 'tea' ? 'tea' : 'meal',
        title: `${mealLabels[meal]} berildi`,
        details: `Bemorga parhez bo'yicha ${mealLabels[meal].toLowerCase()} tarqatildi`
      });
    }
  };

  const handleGiveTea = () => {
    if (patient.diet) {
      const meals = { ...(patient.diet.meals || {}), tea: true };
      updatePatient(patient.id, { diet: { ...patient.diet, meals } });
    }
    addPatientHistoryEvent(patient.id, {
      type: 'tea',
      title: 'Choy berildi',
      details: 'Bemorga issiq choy berildi'
    });
    addActivityLogEntry({ user: user ? `${user.firstName} ${user.lastName} (Hamshira)` : 'Hamshira', action: 'Choy berildi', target: `${patient.firstName} ${patient.lastName}` });
    toast('Bemorga choy berildi ☕', 'success');
  };

  const handleExecuteInjection = () => {
    if (!injectionForm.name) {
      toast('Ukol nomini kiriting', 'error');
      return;
    }
    addPatientHistoryEvent(patient.id, {
      type: 'injection',
      title: 'Ukol qilindi (Injeksiya)',
      details: `${injectionForm.name} ukoli qilindi. Doza: ${injectionForm.dose || "1 ta"} (${injectionForm.method})`
    });
    
    addActivityLogEntry({ user: user ? `${user.firstName} ${user.lastName} (Hamshira)` : 'Hamshira', action: 'Ukol qilindi', target: `${patient.firstName} ${patient.lastName} - ${injectionForm.name}` });

    let updated = false;
    const meds = [...(patient.medications || [])];
    const medIdx = meds.findIndex(m => m.status === 'pending' && m.name.toLowerCase() === injectionForm.name.toLowerCase());
    if (medIdx !== -1) {
      meds[medIdx] = { ...meds[medIdx], status: 'given', nurse: user?.id, givenTime: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) };
      updatePatient(patient.id, { medications: meds });
      updated = true;
    }
    
    if (!updated) {
      const treatments = [...(patient.treatments || [])];
      const treatIdx = treatments.findIndex(t => t.status === 'pending' && t.name.toLowerCase() === injectionForm.name.toLowerCase());
      if (treatIdx !== -1) {
        treatments[treatIdx] = { ...treatments[treatIdx], status: 'done', nurse: user?.id };
        updatePatient(patient.id, { treatments });
      }
    }

    toast(`Ukol qilindi: ${injectionForm.name} 💉`, 'success');
    setShowInjectionModal(false);
    setInjectionForm({ name: '', dose: '', method: 'Mushak ichiga' });
  };

  const handleOpenDietModal = () => {
    if (patient.diet) {
      setDietForm({
        type: patient.diet.type || 'Umumiy',
        restrictions: patient.diet.restrictions?.join(', ') || '',
        breakfastTime: patient.diet.times?.breakfast || '08:00',
        lunchTime: patient.diet.times?.lunch || '13:00',
        dinnerTime: patient.diet.times?.dinner || '18:00'
      });
    } else {
      setDietForm({
        type: 'Umumiy',
        restrictions: '',
        breakfastTime: '08:00',
        lunchTime: '13:00',
        dinnerTime: '18:00'
      });
    }
    setShowDietModal(true);
  };

  const handleSaveDiet = () => {
    const restrictionsArray = dietForm.restrictions
      ? dietForm.restrictions.split(',').map(r => r.trim()).filter(Boolean)
      : [];
      
    const updatedDiet = {
      type: dietForm.type,
      restrictions: restrictionsArray,
      times: {
        breakfast: dietForm.breakfastTime,
        lunch: dietForm.lunchTime,
        dinner: dietForm.dinnerTime
      },
      meals: patient.diet?.meals || { breakfast: false, lunch: false, dinner: false }
    };

    updatePatient(patient.id, { diet: updatedDiet });
    toast('Parhez va ovqatlanish vaqtlari saqlandi', 'success');
    setShowDietModal(false);
  };

  // Vitals chart data
  const vitalsChartData = useMemo(() => {
    return (patient.vitalSigns || []).slice(-5).map(v => ({
      time: v.time,
      harorat: v.temperature,
      puls: v.pulse,
      spo2: v.spo2,
    }));
  }, [patient.vitalSigns]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button className="btn btn-outline" onClick={onBack}>← Ortga</button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{patient.firstName} {patient.lastName}</h1>
            <p className="text-sm text-gray-500">
              {patient.id} • {getAge(patient.birthDate)} yosh • Xona #{room?.replace?.('RM-', '') || '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge ${conditionBadge} text-sm`}>{conditionLabel}</span>
          <button className="btn btn-sm btn-outline text-red-600 hover:bg-red-50 border-red-200" onClick={() => setShowDischargeConfirm(true)}>
            Chiqarish
          </button>
          {/* SOS Button */}
          <button className="sos-btn" onClick={() => setShowSOS(true)}>
            SOS
          </button>
        </div>
      </div>

      {/* Quick Info Bar */}
      <div className="card p-3 mb-4">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span><b>Tashxis:</b> {patient.visits?.[patient.visits.length - 1]?.diagnosis || patient.visitReason}</span>
          <span><b>Shifokor:</b> {doctor ? `${doctor.firstName} ${doctor.lastName}` : '—'}</span>
          <span><b>Yotgan:</b> {formatDate(patient.admissionDate)}</span>
          <span><b>Chiqish:</b> {formatDate(patient.expectedDischarge) || '—'}</span>
          <span><b>Allergiya:</b> {patient.allergies?.length > 0 ? <span className="text-red-600">{patient.allergies.join(', ')}</span> : 'Yo\'q'}</span>
        </div>
      </div>

      {/* Tezkor Amallar Card */}
      <div className="card p-4 mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100/50 dark:border-blue-900/30 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h4 className="font-bold text-blue-950 dark:text-blue-200 text-sm flex items-center gap-1.5">⚡ Tezkor Amallar</h4>
          <p className="text-xs text-blue-800/80 dark:text-blue-300/60 mt-0.5">Bemor uchun choy berish va ukol (injeksiya) qilishni tezkor yozish</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-sm bg-amber-500 hover:bg-amber-600 text-white border-none flex items-center gap-1.5" onClick={handleGiveTea}>
            ☕ Choy berish
          </button>
          <button className="btn btn-sm bg-indigo-600 hover:bg-indigo-700 text-white border-none flex items-center gap-1.5" onClick={() => setShowInjectionModal(true)}>
            💉 Ukol qilish
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <TabNav
        tabs={[
          { key: 'vitals', label: '🌡️ Vital belgilar' },
          { key: 'meds', label: '💊 Dorilar' },
          { key: 'treatments', label: '🔧 Muolajalar' },
          { key: 'diet', label: '🍽️ Ovqatlanish' },
          { key: 'notes', label: '📝 Izohlar' },
        ]}
        activeTab={subTab}
        onChange={setSubTab}
      />

      {/* VITAL SIGNS */}
      {subTab === 'vitals' && (
        <div>
          <div className="flex justify-end mb-3">
            <button className="btn btn-primary" onClick={() => setShowVitalModal(true)}>
              <Plus size={16} /> O&apos;lchash
            </button>
          </div>

          {/* Last vitals */}
          {patient.vitalSigns?.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
              {(() => {
                const last = patient.vitalSigns[patient.vitalSigns.length - 1];
                const isTemp = last.temperature && (last.temperature < 36.1 || last.temperature > 37.2);
                const isBP = last.bloodPressure && (() => { const [s, d] = last.bloodPressure.split('/').map(Number); return s > 140 || s < 90 || d > 90 || d < 60; })();
                const isPulse = last.pulse && (last.pulse < 60 || last.pulse > 100);
                const isResp = last.respRate && (last.respRate < 12 || last.respRate > 20);
                const isSpo2 = last.spo2 && last.spo2 < 95;

                return (
                  <>
                    <div className={`card p-3 text-center ${isTemp ? 'border-red-300 bg-red-50' : ''}`}>
                      <Thermometer size={20} className={`mx-auto mb-1 ${isTemp ? 'text-red-500' : 'text-gray-400'}`} />
                      <p className={`text-xl font-bold ${isTemp ? 'text-red-600' : 'text-gray-900'}`}>{last.temperature || '—'}</p>
                      <p className="text-[10px] text-gray-500">°C Harorat</p>
                    </div>
                    <div className={`card p-3 text-center ${isBP ? 'border-red-300 bg-red-50' : ''}`}>
                      <Heart size={20} className={`mx-auto mb-1 ${isBP ? 'text-red-500' : 'text-gray-400'}`} />
                      <p className={`text-xl font-bold ${isBP ? 'text-red-600' : 'text-gray-900'}`}>{last.bloodPressure || '—'}</p>
                      <p className="text-[10px] text-gray-500">mmHg Bosim</p>
                    </div>
                    <div className={`card p-3 text-center ${isPulse ? 'border-red-300 bg-red-50' : ''}`}>
                      <Activity size={20} className={`mx-auto mb-1 ${isPulse ? 'text-red-500' : 'text-gray-400'}`} />
                      <p className={`text-xl font-bold ${isPulse ? 'text-red-600' : 'text-gray-900'}`}>{last.pulse || '—'}</p>
                      <p className="text-[10px] text-gray-500">urib/min Puls</p>
                    </div>
                    <div className={`card p-3 text-center ${isResp ? 'border-yellow-300 bg-yellow-50' : ''}`}>
                      <Wind size={20} className={`mx-auto mb-1 ${isResp ? 'text-yellow-500' : 'text-gray-400'}`} />
                      <p className={`text-xl font-bold ${isResp ? 'text-yellow-600' : 'text-gray-900'}`}>{last.respRate || '—'}</p>
                      <p className="text-[10px] text-gray-500">mrt/min Nafas</p>
                    </div>
                    <div className={`card p-3 text-center ${isSpo2 ? 'border-red-300 bg-red-50' : ''}`}>
                      <Droplets size={20} className={`mx-auto mb-1 ${isSpo2 ? 'text-red-500' : 'text-gray-400'}`} />
                      <p className={`text-xl font-bold ${isSpo2 ? 'text-red-600' : 'text-gray-900'}`}>{last.spo2 || '—'}</p>
                      <p className="text-[10px] text-gray-500">% SpO2</p>
                    </div>
                    <div className="card p-3 text-center">
                      <Droplets size={20} className="mx-auto mb-1 text-gray-400" />
                      <p className="text-xl font-bold text-gray-900">{last.sugar || '—'}</p>
                      <p className="text-[10px] text-gray-500">mmol/L Shakar</p>
                    </div>
                    <div className="card p-3 text-center">
                      <User size={20} className="mx-auto mb-1 text-gray-400" />
                      <p className="text-xl font-bold text-gray-900">{last.weight || '—'}</p>
                      <p className="text-[10px] text-gray-500">kg Vazn</p>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Vitals chart */}
          {vitalsChartData.length > 1 && (
            <div className="card p-5 mb-4">
              <h4 className="font-bold text-gray-900 mb-3">Tendensiya</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={vitalsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="harorat" stroke="#EF4444" name="Harorat °C" strokeWidth={2} />
                  <Line type="monotone" dataKey="puls" stroke="#2563EB" name="Puls" strokeWidth={2} />
                  <Line type="monotone" dataKey="spo2" stroke="#16A34A" name="SpO2 %" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Vitals history */}
          <div className="card overflow-hidden">
            <table className="data-table">
              <thead><tr><th>Vaqt</th><th>Harorat</th><th>Bosim</th><th>Puls</th><th>Nafas</th><th>SpO2</th><th>Shakar</th></tr></thead>
              <tbody>
                {(patient.vitalSigns || []).slice().reverse().map((v, i) => (
                  <tr key={i}>
                    <td className="text-sm">{v.time}</td>
                    <td className={`text-sm font-medium ${v.temperature && (v.temperature < 36.1 || v.temperature > 37.2) ? 'text-red-600' : ''}`}>{v.temperature || '—'}</td>
                    <td className="text-sm">{v.bloodPressure || '—'}</td>
                    <td className={`text-sm ${v.pulse && (v.pulse < 60 || v.pulse > 100) ? 'text-red-600 font-bold' : ''}`}>{v.pulse || '—'}</td>
                    <td className="text-sm">{v.respRate || '—'}</td>
                    <td className={`text-sm ${v.spo2 && v.spo2 < 95 ? 'text-red-600 font-bold' : ''}`}>{v.spo2 || '—'}%</td>
                    <td className="text-sm">{v.sugar || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MEDICATIONS */}
      {subTab === 'meds' && (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead><tr><th>Dori nomi</th><th>Doza</th><th>Vaqt</th><th>Holat</th><th>Amal</th></tr></thead>
            <tbody>
              {(patient.medications || []).map((med, idx) => (
                <tr key={idx}>
                  <td className="text-sm font-medium">{med.name}</td>
                  <td className="text-sm">{med.dose}</td>
                  <td className="text-sm">{med.time}</td>
                  <td>
                    <span className={`badge ${med.status === 'given' ? 'badge-success' : med.status === 'skipped' ? 'badge-danger' : 'badge-warning'}`}>
                      {med.status === 'given' ? '✅ Berildi' : med.status === 'skipped' ? '❌ O\'tkazildi' : '⏳ Kutilmoqda'}
                    </span>
                  </td>
                  <td>
                    {med.status === 'pending' && (
                      <div className="flex gap-1">
                        <button className="btn btn-sm btn-success" onClick={() => giveMedication(idx)}>✅ Berish</button>
                        <button className="btn btn-sm btn-outline" onClick={() => skipMedication(idx, 'Bemor rad etdi')}>❌</button>
                      </div>
                    )}
                    {med.status === 'given' && <span className="text-xs text-gray-500">{med.givenTime || ''}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!patient.medications || patient.medications.length === 0) && (
            <div className="p-8 text-center text-gray-400 text-sm">Dori jadvali bo&apos;sh</div>
          )}
        </div>
      )}

      {/* TREATMENTS */}
      {subTab === 'treatments' && (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead><tr><th>Turi</th><th>Nomi</th><th>Vaqt</th><th>Holat</th><th>Amal</th></tr></thead>
            <tbody>
              {(patient.treatments || []).map((t, idx) => (
                <tr key={idx}>
                  <td><span className="badge badge-purple">{t.type}</span></td>
                  <td className="text-sm font-medium">{t.name}</td>
                  <td className="text-sm">{t.time}</td>
                  <td>
                    <span className={`badge ${t.status === 'done' ? 'badge-success' : t.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                      {t.status === 'done' ? '✅ Bajarildi' : t.status === 'cancelled' ? '❌ Bekor' : '⏳ Navbatda'}
                    </span>
                  </td>
                  <td>
                    {t.status === 'pending' && (
                      <button className="btn btn-sm btn-success" onClick={() => completeTreatment(idx)}>✅ Bajarildi</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!patient.treatments || patient.treatments.length === 0) && (
            <div className="p-8 text-center text-gray-400 text-sm">Muolajalar ro&apos;yxati bo&apos;sh</div>
          )}
        </div>
      )}

      {/* DIET */}
      {subTab === 'diet' && (
        <div className="card p-5">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-gray-900">Parhez va ovqatlanish</h4>
            <button className="btn btn-outline btn-sm" onClick={handleOpenDietModal}>
              <Plus size={14} /> {patient.diet ? 'Tahrirlash' : 'Tayinlash'}
            </button>
          </div>
          {patient.diet ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="badge badge-info text-sm">{patient.diet.type} parhez</span>
              </div>
              {patient.diet.restrictions?.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Taqiqlar:</h5>
                  <div className="flex flex-wrap gap-2">
                    {patient.diet.restrictions.map((r, i) => <span key={i} className="badge badge-danger">{r}</span>)}
                  </div>
                </div>
              )}
              <h5 className="text-sm font-medium text-gray-700 mb-2">Ovqatlanish:</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(() => {
                  const times = patient.diet.times || { breakfast: '08:00', lunch: '13:00', dinner: '18:00' };
                  return [
                    ['breakfast', 'Nonushta', times.breakfast],
                    ['lunch', 'Tushlik', times.lunch],
                    ['dinner', 'Kechki', times.dinner],
                    ['tea', 'Choy', '16:00']
                  ].map(([key, label, time]) => (
                    <div key={key} className={`card p-4 text-center cursor-pointer transition-all ${patient.diet.meals?.[key] ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`} onClick={() => toggleMeal(key)}>
                      <Utensils size={24} className={`mx-auto mb-2 ${patient.diet.meals?.[key] ? 'text-green-500' : 'text-gray-300'}`} />
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-gray-500">{time}</p>
                      <p className={`text-xs mt-1 font-medium ${patient.diet.meals?.[key] ? 'text-green-600' : 'text-gray-400'}`}>
                        {patient.diet.meals?.[key] ? '✅ Yedi' : 'Yemadi'}
                      </p>
                    </div>
                  ));
                })()}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <EmptyState icon={<Utensils size={48} />} title="Parhez tayinlanmagan" />
              <button className="btn btn-primary mt-4" onClick={handleOpenDietModal}>
                <Plus size={16} /> Parhez tayinlash
              </button>
            </div>
          )}
        </div>
      )}

      {/* NOTES */}
      {subTab === 'notes' && (
        <div>
          <div className="flex justify-end mb-3">
            <button className="btn btn-primary" onClick={() => setShowNoteModal(true)}>
              <Plus size={16} /> Izoh qo&apos;shish
            </button>
          </div>
          <div className="space-y-2">
            {(patient.nurseNotes || []).slice().reverse().map((note, i) => (
              <div key={i} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="badge badge-purple text-xs">{note.shift} smena</span>
                    <p className="text-sm text-gray-800 mt-2">{note.note}</p>
                  </div>
                  <span className="text-xs text-gray-400">{note.time} • {formatDate(note.date)}</span>
                </div>
              </div>
            ))}
            {(!patient.nurseNotes || patient.nurseNotes.length === 0) && (
              <EmptyState icon={<FileText size={48} />} title="Izohlar yo'q" />
            )}
          </div>
        </div>
      )}

      {/* VITAL SIGNS MODAL */}
      <Modal isOpen={showVitalModal} onClose={() => setShowVitalModal(false)} title="Vital belgilar o'lchash">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Harorat (°C)</label>
            <input className="input" type="number" step="0.1" placeholder="36.6" value={vitalForm.temperature} onChange={e => setVitalForm({ ...vitalForm, temperature: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Qon bosimi (mmHg)</label>
            <input className="input" placeholder="120/80" value={vitalForm.bloodPressure} onChange={e => setVitalForm({ ...vitalForm, bloodPressure: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Puls (urib/min)</label>
            <input className="input" type="number" placeholder="72" value={vitalForm.pulse} onChange={e => setVitalForm({ ...vitalForm, pulse: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Nafas tezligi (mrt/min)</label>
            <input className="input" type="number" placeholder="16" value={vitalForm.respRate} onChange={e => setVitalForm({ ...vitalForm, respRate: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">SpO2 (%)</label>
            <input className="input" type="number" placeholder="98" value={vitalForm.spo2} onChange={e => setVitalForm({ ...vitalForm, spo2: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Qon shakari (mmol/L)</label>
            <input className="input" type="number" step="0.1" placeholder="5.5" value={vitalForm.sugar} onChange={e => setVitalForm({ ...vitalForm, sugar: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Vazn (kg)</label>
            <input className="input" type="number" placeholder="70" value={vitalForm.weight} onChange={e => setVitalForm({ ...vitalForm, weight: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button className="btn btn-outline" onClick={() => setShowVitalModal(false)}>Bekor</button>
          <button className="btn btn-primary" onClick={handleVitals}>Saqlash</button>
        </div>
      </Modal>

      {/* SOS MODAL */}
      <Modal isOpen={showSOS} onClose={() => setShowSOS(false)} title="🚨 SOS — Favqulodda Signal">
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Sabab tanlang:</p>
          <div className="grid grid-cols-2 gap-2">
            {SOS_REASONS.map(reason => (
              <button
                key={reason}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${sosReason === reason ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:border-red-300'}`}
                onClick={() => setSosReason(reason)}
              >
                {reason}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button className="btn btn-outline" onClick={() => setShowSOS(false)}>Bekor</button>
          <button className="btn btn-danger btn-lg" onClick={handleSOS}>🚨 Signal yuborish</button>
        </div>
      </Modal>

      {/* NOTE MODAL */}
      <Modal isOpen={showNoteModal} onClose={() => setShowNoteModal(false)} title="Kuzatuv izohi">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Smena</label>
            <select className="input select" value={noteForm.shift} onChange={e => setNoteForm({ ...noteForm, shift: e.target.value })}>
              <option>Tonggi</option>
              <option>Kunduzi</option>
              <option>Kechasi</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Izoh</label>
            <textarea className="input" rows={4} value={noteForm.note} onChange={e => setNoteForm({ ...noteForm, note: e.target.value })} placeholder="Bemor holati, maxsus hodisalar..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button className="btn btn-outline" onClick={() => setShowNoteModal(false)}>Bekor</button>
          <button className="btn btn-primary" onClick={handleNote}>Saqlash</button>
        </div>
      </Modal>

      {/* DIET MODAL */}
      <Modal isOpen={showDietModal} onClose={() => setShowDietModal(false)} title="Parhez va ovqatlanish vaqtlarini belgilash">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Parhez turi</label>
            <select 
              className="input select" 
              value={dietForm.type} 
              onChange={e => setDietForm({ ...dietForm, type: e.target.value })}
            >
              {DIET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Taqiqlar / Cheklovlar (vergul bilan ajrating)</label>
            <input 
              className="input" 
              value={dietForm.restrictions} 
              onChange={e => setDietForm({ ...dietForm, restrictions: e.target.value })}
              placeholder="Tuz yo'q, Yog' cheklangan, Shirinlik mumkin emas"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Nonushta vaqti</label>
              <input 
                className="input" 
                value={dietForm.breakfastTime} 
                onChange={e => setDietForm({ ...dietForm, breakfastTime: e.target.value })}
                placeholder="08:00"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Tushlik vaqti</label>
              <input 
                className="input" 
                value={dietForm.lunchTime} 
                onChange={e => setDietForm({ ...dietForm, lunchTime: e.target.value })}
                placeholder="13:00"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Kechki ovqat vaqti</label>
              <input 
                className="input" 
                value={dietForm.dinnerTime} 
                onChange={e => setDietForm({ ...dietForm, dinnerTime: e.target.value })}
                placeholder="18:00"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button className="btn btn-outline" onClick={() => setShowDietModal(false)}>Bekor qilish</button>
          <button className="btn btn-primary" onClick={handleSaveDiet}>Saqlash</button>
        </div>
      </Modal>
 
      {/* INJECTION MODAL */}
      <Modal isOpen={showInjectionModal} onClose={() => setShowInjectionModal(false)} title="💉 Ukol qilish (Injeksiya yuborish)">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Ukol (dori) nomi *</label>
            <input 
              className="input" 
              placeholder="Masalan: Ketonal, Analgin, Sefazolin..." 
              value={injectionForm.name} 
              onChange={e => setInjectionForm({ ...injectionForm, name: e.target.value })} 
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Doza</label>
            <input 
              className="input" 
              placeholder="Masalan: 2ml, 1 flakon, 1.0 gr..." 
              value={injectionForm.dose} 
              onChange={e => setInjectionForm({ ...injectionForm, dose: e.target.value })} 
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Yuborish uslubi</label>
            <select 
              className="input select" 
              value={injectionForm.method} 
              onChange={e => setInjectionForm({ ...injectionForm, method: e.target.value })}
            >
              <option>Mushak ichiga</option>
              <option>Vena ichiga</option>
              <option>Teri ostiga</option>
              <option>Tomchilab (dropper)</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button className="btn btn-outline" onClick={() => setShowInjectionModal(false)}>Bekor qilish</button>
          <button className="btn btn-primary" onClick={handleExecuteInjection}>Bajarildi</button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDischargeConfirm}
        title="Bemorni chiqarish"
        message="Haqiqatan ham ushbu bemorni shifoxonadan chiqarmoqchimisiz? Uning xonasi bo'shatiladi."
        onConfirm={handleDischarge}
        onCancel={() => setShowDischargeConfirm(false)}
        danger
      />
    </div>
  );
}

// ===== NURSE TASKS =====
function NurseTasks() {
  const { patients } = useCrm();

  const tasks = useMemo(() => {
    const list = [];
    const today = new Date().toISOString().split('T')[0];
    patients.filter(p => p.status === 'stasionar').forEach(p => {
      (p.medications || []).forEach(m => {
        if (m.date === today && m.status === 'pending') {
          list.push({ type: 'medication', patient: `${p.firstName} ${p.lastName}`, task: `${m.name} ${m.dose} berish`, time: m.time, status: 'pending' });
        }
        if (m.date === today && m.status === 'given') {
          list.push({ type: 'medication', patient: `${p.firstName} ${p.lastName}`, task: `${m.name} ${m.dose}`, time: m.time, status: 'done' });
        }
        if (m.date === today && m.status === 'skipped') {
          list.push({ type: 'medication', patient: `${p.firstName} ${p.lastName}`, task: `${m.name} ${m.dose} (${m.skipReason || "o'tkazildi"})`, time: m.time, status: 'skipped' });
        }
      });
      (p.treatments || []).forEach(t => {
        if (t.date === today) {
          list.push({ type: 'treatment', patient: `${p.firstName} ${p.lastName}`, task: `${t.type}: ${t.name}`, time: t.time, status: t.status === 'done' ? 'done' : 'pending' });
        }
      });
    });
    return list.sort((a, b) => a.time.localeCompare(b.time));
  }, [patients]);

  const doneCount = tasks.filter(t => t.status === 'done' || t.status === 'skipped').length;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;

  return (
    <div>
      <Header title="Hamshira Vazifalari" subtitle={`${doneCount}/${tasks.length} bajarildi`} role="nurse" />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard icon={<CheckCircle size={24} />} title="Bajarildi" value={doneCount} colorClass="stat-green" />
        <StatCard icon={<Clock size={24} />} title="Kutilmoqda" value={pendingCount} colorClass="stat-yellow" />
      </div>

      <div className="space-y-2">
        {tasks.map((task, i) => (
          <div 
            key={i} 
            className={`card p-3 border-l-4 ${
              task.status === 'done' 
                ? 'border-l-green-500 bg-green-50/50' 
                : task.status === 'skipped'
                  ? 'border-l-red-500 bg-red-50/30'
                  : 'border-l-yellow-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm">
                  {task.status === 'done' ? '✅' : task.status === 'skipped' ? '❌' : '⏳'}
                </span>
                <div>
                  <p className={`text-sm font-medium ${task.status === 'done' || task.status === 'skipped' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{task.task}</p>
                  <p className="text-xs text-gray-500">{task.patient} • {task.time}</p>
                </div>
              </div>
              <span className={`badge ${task.type === 'medication' ? 'badge-purple' : 'badge-info'}`}>
                {task.type === 'medication' ? '💊 Dori' : '🔧 Muolaja'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== SHIFT HANDOVER =====
function ShiftHandover() {
  const { patients } = useCrm();
  const toast = useToast();
  const today = new Date().toISOString().split('T')[0];

  const inpatients = patients.filter(p => p.status === 'stasionar');
  const totalMeds = inpatients.reduce((s, p) => s + (p.medications?.filter(m => m.date === today).length || 0), 0);
  const givenMeds = inpatients.reduce((s, p) => s + (p.medications?.filter(m => m.date === today && m.status === 'given').length || 0), 0);
  const criticalPatients = inpatients.filter(p => p.overallCondition === 'serious' || p.overallCondition === 'critical');

  const [shiftNotes, setShiftNotes] = useState('');

  return (
    <div>
      <Header title="Shift Topshirish" role="nurse" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={<BedDouble size={24} />} title="Bemorlar soni" value={inpatients.length} colorClass="stat-blue" />
        <StatCard icon={<Pill size={24} />} title="Dorilar berildi" value={`${givenMeds}/${totalMeds}`} colorClass="stat-green" />
        <StatCard icon={<AlertTriangle size={24} />} title="Kritik holatlar" value={criticalPatients.length} colorClass="stat-red" />
      </div>

      <div className="card p-5 mb-4">
        <h4 className="font-bold text-gray-900 mb-3">Bemorlar holati</h4>
        <div className="space-y-2">
          {inpatients.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${p.overallCondition === 'good' ? 'bg-green-500' : p.overallCondition === 'moderate' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                <div>
                  <p className="text-sm font-medium">{p.firstName} {p.lastName}</p>
                  <p className="text-xs text-gray-500">{p.visits?.[p.visits.length - 1]?.diagnosis || '—'}</p>
                </div>
              </div>
              <span className={`badge ${p.overallCondition === 'good' ? 'badge-success' : p.overallCondition === 'moderate' ? 'badge-warning' : 'badge-danger'}`}>
                {p.overallCondition === 'good' ? 'Yaxshi' : p.overallCondition === 'moderate' ? "O'rta" : "Og'ir"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5 mb-4">
        <h4 className="font-bold text-gray-900 mb-3">Keyingi smena uchun izoh</h4>
        <textarea className="input" rows={4} value={shiftNotes} onChange={e => setShiftNotes(e.target.value)} placeholder="Maxsus izohlar, diqqatga sazovor holatlar..." />
      </div>

      <button className="btn btn-success btn-lg" onClick={() => toast('Shift topshirildi! ✅', 'success')}>
        <Send size={18} /> Shiftni topshirish
      </button>
    </div>
  );
}

// ===== OUTPATIENT TREATMENT COURSES =====
function TreatmentCourses() {
  const { treatments, updateTreatment, finances, setFinances, addActivityLogEntry, user } = useCrm();
  const toast = useToast();
  const today = new Date().toISOString().split('T')[0];

  // Find all active treatments that have a session scheduled for today
  const todaySessions = useMemo(() => {
    const list = [];
    treatments.forEach(t => {
      if (t.status !== 'active') return;
      const sessionToday = (t.sessions || []).find(s => s.date === today);
      if (sessionToday) {
        list.push({
          treatmentId: t.id,
          patientName: t.patientName,
          patientPhone: t.patientPhone,
          treatmentName: t.treatmentName,
          time: t.time,
          price: t.price,
          durationDays: t.durationDays,
          session: sessionToday,
          fullTreatment: t
        });
      }
    });
    return list.sort((a, b) => a.time.localeCompare(b.time));
  }, [treatments, today]);

  const handleSessionStatus = (item, newStatus) => {
    const nurseName = user ? `${user.firstName} ${user.lastName}` : 'Hamshira';
    const updatedSessions = item.fullTreatment.sessions.map(s => {
      if (s.date === today) {
        return { ...s, status: newStatus, nurseId: user?.id, nurseName: nurseName };
      }
      return s;
    });

    updateTreatment(item.treatmentId, { sessions: updatedSessions });

    if (newStatus === 'completed') {
      const sessionAmount = item.session.amount || 0;
      // Update finances: increase income
      const updatedFinances = finances.map(f => f.date === today ? { ...f, income: f.income + sessionAmount } : f);
      if (!finances.some(f => f.date === today)) {
        updatedFinances.push({ date: today, income: sessionAmount, expense: 0, patients: 0 });
      }
      setFinances(updatedFinances);

      addActivityLogEntry({
        user: `${nurseName} (Hamshira)`,
        action: 'Muolaja seansi bajarildi (To\'lov tushdi)',
        target: `${item.patientName} - ${item.treatmentName} (${formatMoney(sessionAmount)} so'm)`
      });
      toast(`${item.patientName} - muolajaga keldi. ${formatMoney(sessionAmount)} so'm tushumga qo'shildi!`, 'success');
    } else {
      addActivityLogEntry({
        user: `${nurseName} (Hamshira)`,
        action: 'Muolaja seansiga bemor kelmadi',
        target: `${item.patientName} - ${item.treatmentName}`
      });
      toast(`${item.patientName} - muolajaga kelmadi. Narx hisoblanmadi.`, 'warning');
    }
  };

  const completedCount = todaySessions.filter(item => item.session.status === 'completed').length;
  const pendingCount = todaySessions.filter(item => item.session.status === 'pending').length;
  const absentCount = todaySessions.filter(item => item.session.status === 'no-show').length;

  return (
    <div className="animate-fadeIn">
      <Header title="Bugungi Muolaja Kurslari (Licheniya)" subtitle={`Jami bugun: ${todaySessions.length} ta bemor`} role="nurse" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={<CheckCircle size={24} />} title="Keldi (Bajarildi)" value={completedCount} colorClass="stat-green" />
        <StatCard icon={<Clock size={24} />} title="Kutilmoqda" value={pendingCount} colorClass="stat-yellow" />
        <StatCard icon={<XCircle size={24} />} title="Kelmidi" value={absentCount} colorClass="stat-red" />
      </div>

      <div className="space-y-3">
        {todaySessions.map((item, idx) => (
          <div key={idx} className="card p-4 animate-fadeIn border-l-4 border-l-blue-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h4 className="font-bold text-gray-900 text-base">{item.patientName}</h4>
                <p className="text-xs text-gray-500 mt-0.5">📞 {item.patientPhone} • 🕐 {item.time}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="badge badge-purple">{item.treatmentName}</span>
                  <span className="text-xs text-gray-500 font-semibold">Seans: {item.session.index} / {item.durationDays}</span>
                  <span className="text-xs text-green-600 font-bold">Narxi: {formatMoney(item.session.amount)} so&apos;m</span>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {item.session.status === 'pending' ? (
                  <>
                    <button className="btn btn-success btn-sm font-semibold" onClick={() => handleSessionStatus(item, 'completed')}>
                      ✅ Keldi
                    </button>
                    <button className="btn btn-danger btn-sm font-semibold" onClick={() => handleSessionStatus(item, 'no-show')}>
                      ❌ Kelmidi
                    </button>
                  </>
                ) : (
                  <span className={`badge ${item.session.status === 'completed' ? 'badge-success' : 'badge-danger'}`}>
                    {item.session.status === 'completed' ? '🟢 Keldi (Bajarildi)' : '🔴 Kelmidi'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {todaySessions.length === 0 && (
          <EmptyState icon={<Activity size={48} />} title="Bugun hech qanday muolaja kursi rejalashtirilmagan" />
        )}
      </div>
    </div>
  );
}
