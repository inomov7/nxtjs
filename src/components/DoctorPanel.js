'use client';

import { useState, useMemo, useCallback } from 'react';
import { useCrm } from '@/lib/CrmContext';
import { ROLES, MEDICINE_CATEGORIES, generateId } from '@/lib/demoData';
import {
  Sidebar, Header, StatCard, Modal, TabNav, useToast,
  formatMoney, formatDate, getAge, EmptyState,
} from './SharedComponents';
import {
  Calendar, Stethoscope, BedDouble, FolderOpen, BookOpen,
  Clock, CheckCircle, XCircle, AlertCircle, Play, Eye,
  Plus, FileText, Pill, Search, User, Activity, ClipboardList,
  Upload, Download, Trash2,
} from 'lucide-react';

const getFileIcon = (name) => {
  if (!name) return '📄';
  const ext = name.split('.').pop().toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return '🖼️';
  if (ext === 'pdf') return '📕';
  if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return '📝';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
  return '📄';
};

const TABS = [
  { key: 'queue', label: 'Bugungi Navbatlar', icon: <Calendar size={18} /> },
  { key: 'examine', label: 'Qabul Oynasi', icon: <Stethoscope size={18} /> },
  { key: 'inpatients', label: 'Stasionar', icon: <BedDouble size={18} /> },
  { key: 'history', label: 'Bemor Tarixi', icon: <FolderOpen size={18} /> },
  { key: 'diary', label: 'Kundalik', icon: <BookOpen size={18} /> },
];

const QUEUE_STATUSES = [
  { key: 'waiting', label: 'Kutmoqda', emoji: '⏳', color: 'badge-warning' },
  { key: 'in-progress', label: 'Qabul jarayonida', emoji: '🔵', color: 'badge-info' },
  { key: 'completed', label: 'Tugadi', emoji: '✅', color: 'badge-success' },
  { key: 'no-show', label: 'Kelmadi', emoji: '❌', color: 'badge-danger' },
];

export default function DoctorPanel() {
  const [activeTab, setActiveTab] = useState('queue');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const handleStartExam = (patient) => {
    setSelectedPatient(patient);
    setActiveTab('examine');
  };

  return (
    <div className="flex">
      <Sidebar role="doctor" tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="main-content">
        {activeTab === 'queue' && <QueueSection onStartExam={handleStartExam} />}
        {activeTab === 'examine' && <ExamineSection patient={selectedPatient} onBack={() => setActiveTab('queue')} />}
        {activeTab === 'inpatients' && <InpatientsSection onSelectPatient={handleStartExam} />}
        {activeTab === 'history' && <PatientHistorySection />}
        {activeTab === 'diary' && <DoctorDiary />}
      </div>
    </div>
  );
}

// ===== QUEUE =====
function QueueSection({ onStartExam }) {
  const { patients, updatePatient, staff } = useCrm();
  const toast = useToast();
  const today = new Date().toISOString().split('T')[0];

  const queuePatients = useMemo(() => {
    return patients
      .filter(p => p.admissionDate === today && (p.queueStatus === 'waiting' || p.queueStatus === 'in-progress' || p.queueStatus === 'completed' || p.queueStatus === 'no-show'))
      .sort((a, b) => {
        const order = { 'in-progress': 0, 'waiting': 1, 'completed': 2, 'no-show': 3 };
        return (order[a.queueStatus] || 9) - (order[b.queueStatus] || 9);
      });
  }, [patients, today]);

  const handleStatusChange = (patient, newStatus) => {
    updatePatient(patient.id, { queueStatus: newStatus });
    toast(`${patient.firstName} ${patient.lastName} - holat o'zgartirildi`, 'success');
  };

  const waitingCount = queuePatients.filter(p => p.queueStatus === 'waiting').length;
  const completedCount = queuePatients.filter(p => p.queueStatus === 'completed').length;

  return (
    <div>
      <Header title="Bugungi Navbatlar" subtitle={formatDate(today)} role="doctor" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={<Clock size={24} />} title="Kutmoqda" value={waitingCount} colorClass="stat-yellow" />
        <StatCard icon={<Activity size={24} />} title="Jami bugun" value={queuePatients.length} colorClass="stat-blue" />
        <StatCard icon={<CheckCircle size={24} />} title="Tugallangan" value={completedCount} colorClass="stat-green" />
      </div>

      <div className="space-y-3">
        {queuePatients.map((patient) => {
          const statusInfo = QUEUE_STATUSES.find(s => s.key === patient.queueStatus);
          return (
            <div key={patient.id} className="card p-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-lg">
                    {patient.queueNumber || '—'}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{patient.firstName} {patient.lastName}</h4>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{patient.id}</span>
                      <span>•</span>
                      <span>{getAge(patient.birthDate)} yosh, {patient.gender}</span>
                      <span>•</span>
                      <span>🕐 {patient.queueTime || '—'}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{patient.visitReason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${statusInfo?.color}`}>{statusInfo?.emoji} {statusInfo?.label}</span>
                  {patient.queueStatus === 'waiting' && (
                    <button className="btn btn-success btn-sm" onClick={() => { handleStatusChange(patient, 'in-progress'); onStartExam(patient); }}>
                      <Play size={14} /> Qabul boshlash
                    </button>
                  )}
                  {patient.queueStatus === 'in-progress' && (
                    <button className="btn btn-primary btn-sm" onClick={() => onStartExam(patient)}>
                      <Eye size={14} /> Davom etish
                    </button>
                  )}
                  {(patient.queueStatus === 'waiting') && (
                    <button className="btn btn-outline btn-sm" onClick={() => handleStatusChange(patient, 'no-show')}>
                      <XCircle size={14} /> Kelmadi
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {queuePatients.length === 0 && (
          <EmptyState icon={<Calendar size={48} />} title="Bugun navbat yo'q" description="Hozircha bemor navbatga yozilmagan" />
        )}
      </div>
    </div>
  );
}

// ===== EXAMINE SECTION =====
function ExamineSection({ patient, onBack }) {
  const { updatePatient, medicines, addPrescription, rooms, updateRoom, staff, addActivityLogEntry, addNotification, patients } = useCrm();
  const toast = useToast();
  const [complaints, setComplaints] = useState('');
  const [examination, setExamination] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [icdCode, setIcdCode] = useState('');
  const [notes, setNotes] = useState('');
  const [nextVisit, setNextVisit] = useState('');
  const [prescriptions, setPrescriptions] = useState([]);
  const [newRx, setNewRx] = useState({ medicine: '', dose: '', frequency: '', duration: '', instructions: '' });
  const [treatments, setTreatments] = useState([]);
  const [newTreatment, setNewTreatment] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [admitToHospital, setAdmitToHospital] = useState(false);
  const [files, setFiles] = useState([]);

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    uploadedFiles.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast("Fayl hajmi 5MB dan oshmasligi kerak", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const fileObj = {
          id: 'FL-' + Date.now() + Math.random().toString(36).substring(2, 5).toUpperCase(),
          name: file.name,
          size: file.size,
          type: file.type,
          content: reader.result, // base64 string
          date: new Date().toISOString().split('T')[0]
        };
        setFiles(prev => [...prev, fileObj]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeUploadedFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  if (!patient) {
    return (
      <div>
        <Header title="Qabul Oynasi" role="doctor" />
        <EmptyState icon={<Stethoscope size={48} />} title="Bemor tanlanmagan" description="Navbatlar bo'limidan bemorni tanlang" />
      </div>
    );
  }

  const freeRooms = rooms.filter(r => {
    const roomPatientsCount = patients.filter(p => p.roomId === r.id && p.status === 'stasionar').length;
    const hasSpace = roomPatientsCount < r.capacity;
    return (r.status === 'free' || r.status === 'busy') && hasSpace && r.type !== 'Operatsiya' && r.type !== "Ko'rish xonasi";
  });

  const addPrescriptionItem = () => {
    if (!newRx.medicine || !newRx.dose) { toast('Dori nomi va dozasini kiriting', 'error'); return; }
    setPrescriptions([...prescriptions, { ...newRx }]);
    setNewRx({ medicine: '', dose: '', frequency: '', duration: '', instructions: '' });
  };

  const handleSave = () => {
    if (!diagnosis) { toast('Tashxis qo\'yilmagan', 'error'); return; }

    const today = new Date().toISOString().split('T')[0];
    const doctorId = staff.find(s => s.id === patient.assignedDoctor);
    const doctorName = doctorId ? `${doctorId.firstName} ${doctorId.lastName}` : 'Shifokor';

    // Add visit
    const newVisit = { date: today, doctor: patient.assignedDoctor, diagnosis, icdCode, notes: `${complaints ? 'Shikoyat: ' + complaints + '. ' : ''}${examination ? 'Ko\'rik: ' + examination + '. ' : ''}${notes}` };
    const updatedVisits = [...(patient.visits || []), newVisit];

    // Add prescriptions
    const newPrescriptions = prescriptions.map(rx => ({ ...rx, date: today }));
    const updatedPrescriptions = [...(patient.prescriptions || []), ...newPrescriptions];

    // Update patient
    const updates = {
      visits: updatedVisits,
      prescriptions: updatedPrescriptions,
      queueStatus: 'completed',
      files: [...(patient.files || []), ...files],
    };

    if (admitToHospital && selectedRoom) {
      updates.status = 'stasionar';
      updates.roomId = selectedRoom;
      
      const roomObj = rooms.find(r => r.id === selectedRoom);
      if (roomObj) {
        const roomPatientsCount = patients.filter(p => p.roomId === selectedRoom && p.status === 'stasionar').length;
        const isFull = (roomPatientsCount + 1) >= roomObj.capacity;
        updateRoom(selectedRoom, { status: isFull ? 'busy' : 'free' });
      }
    }

    if (nextVisit) {
      updates.nextVisitDate = nextVisit;
    }

    updatePatient(patient.id, updates);

    // Send prescription to pharmacy
    if (prescriptions.length > 0) {
      addPrescription({
        patientId: patient.id,
        doctorId: patient.assignedDoctor,
        medicines: prescriptions.map(rx => ({ name: rx.medicine, dose: rx.dose, quantity: parseInt(rx.duration) * (rx.frequency === '3 mahal' ? 3 : rx.frequency === '2 mahal' ? 2 : 1) || 10 })),
      });
    }

    addActivityLogEntry({
      user: `${doctorName} (Shifokor)`,
      action: 'Tashxis qo\'yildi',
      target: `${patient.firstName} ${patient.lastName} - ${diagnosis}`,
    });

    toast('Qabul muvaffaqiyatli yakunlandi', 'success');
    onBack();
  };

  return (
    <div>
      <Header title="Qabul Oynasi" subtitle={`${patient.firstName} ${patient.lastName}`} role="doctor" />

      {/* Patient Info */}
      <div className="card p-5 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-xl font-bold">
            {patient.firstName[0]}{patient.lastName[0]}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg">{patient.firstName} {patient.lastName} {patient.middleName || ''}</h3>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500 mt-1">
              <span>🆔 {patient.id}</span>
              <span>📅 {getAge(patient.birthDate)} yosh ({patient.gender})</span>
              <span>🩸 {patient.bloodGroup}</span>
              <span>📞 {patient.phone}</span>
            </div>
            {patient.allergies?.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <span className="badge badge-danger">⚠️ Allergiya: {patient.allergies.join(', ')}</span>
              </div>
            )}
            {patient.chronicDiseases?.length > 0 && (
              <div className="mt-1 flex items-center gap-2">
                <span className="badge badge-warning">Surunkali: {patient.chronicDiseases.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Examination */}
        <div className="space-y-4">
          <div className="card p-5">
            <h4 className="font-bold text-gray-900 mb-3">Shikoyatlar</h4>
            <textarea className="input" rows={3} placeholder="Bemorning shikoyatlari..." value={complaints} onChange={e => setComplaints(e.target.value)} />
          </div>

          <div className="card p-5">
            <h4 className="font-bold text-gray-900 mb-3">Ob&apos;ektiv ko&apos;rik</h4>
            <textarea className="input mb-4" rows={3} placeholder="Shifokor ko'rik natijasi..." value={examination} onChange={e => setExamination(e.target.value)} />
            
            {/* File Upload Dropzone */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Analizlar va Hujjatlar (Maks: 5MB)</label>
              
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-green-400 dark:hover:border-green-500 rounded-2xl p-5 text-center cursor-pointer transition-all bg-gray-50/50 hover:bg-green-50/5 dark:bg-white/5 dark:hover:bg-white/10 flex flex-col items-center justify-center relative">
                <input 
                  type="file" 
                  multiple 
                  onChange={handleFileUpload} 
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                />
                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-500/10 text-green-500 flex items-center justify-center mb-2">
                  <Upload size={20} />
                </div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Analiz faylini tanlang yoki sudrab tashlang</p>
                <p className="text-[10px] text-gray-400 mt-1">Rasm, PDF yoki Tibbiy Hujjatlar</p>
              </div>

              {/* Uploaded Files preview */}
              {[...(patient.files || []), ...files].length > 0 && (
                <div className="mt-4 space-y-2">
                  {[...(patient.files || []), ...files].map(file => {
                    const isNew = files.some(f => f.id === file.id);
                    return (
                      <div key={file.id} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-zinc-900 shadow-sm text-xs animate-fadeIn">
                        <div className="flex items-center gap-2.5 truncate max-w-[75%]">
                          <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-lg font-bold shrink-0">
                            {getFileIcon(file.name)}
                          </div>
                          <div className="truncate">
                            <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{file.name}</p>
                            <p className="text-[10px] text-gray-400">
                              {(file.size / 1024).toFixed(1)} KB • {file.date} {isNew && <span className="text-green-500 font-medium">(Yangi)</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <a 
                            href={file.content} 
                            download={file.name}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-blue-500 transition-colors flex items-center justify-center"
                            title="Yuklab olish"
                          >
                            <Download size={14} />
                          </a>
                          {isNew && (
                            <button 
                              type="button" 
                              onClick={() => removeUploadedFile(file.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors flex items-center justify-center"
                              title="O'chirish"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h4 className="font-bold text-gray-900 mb-3">Tashxis</h4>
            <div className="grid grid-cols-2 gap-3">
              <input className="input" placeholder="Kasallik nomi..." value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
              <input className="input" placeholder="ICD-10 kodi (masalan I10)..." value={icdCode} onChange={e => setIcdCode(e.target.value)} />
            </div>
          </div>

          <div className="card p-5">
            <h4 className="font-bold text-gray-900 mb-3">Qo&apos;shimcha</h4>
            <textarea className="input mb-3" rows={2} placeholder="Izohlar..." value={notes} onChange={e => setNotes(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Keyingi ko&apos;rik</label>
                <input className="input" type="date" value={nextVisit} onChange={e => setNextVisit(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Stasionarga yotqizish</label>
                <div className="flex items-center gap-3 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={admitToHospital} onChange={e => setAdmitToHospital(e.target.checked)} className="w-4 h-4 rounded" />
                    <span className="text-sm">Ha</span>
                  </label>
                  {admitToHospital && (
                    <select className="input select" value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)}>
                      <option value="">Xona tanlang</option>
                      {freeRooms.map(r => <option key={r.id} value={r.id}>#{r.number} ({r.type})</option>)}
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Prescriptions & Treatments */}
        <div className="space-y-4">
          <div className="card p-5">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Pill size={18} /> Retsept yozish
            </h4>
            <div className="space-y-3 mb-3">
              <div className="grid grid-cols-2 gap-2">
                <input className="input" placeholder="Dori nomi" value={newRx.medicine} onChange={e => setNewRx({ ...newRx, medicine: e.target.value })} list="medicine-list" />
                <datalist id="medicine-list">
                  {medicines.map(m => <option key={m.id} value={m.name} />)}
                </datalist>
                <input className="input" placeholder="Doza (masalan 500mg)" value={newRx.dose} onChange={e => setNewRx({ ...newRx, dose: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <select className="input select" value={newRx.frequency} onChange={e => setNewRx({ ...newRx, frequency: e.target.value })}>
                  <option value="">Qabul tartibi</option>
                  <option value="1 mahal">1 mahal/kun</option>
                  <option value="2 mahal">2 mahal/kun</option>
                  <option value="3 mahal">3 mahal/kun</option>
                  <option value="Zarur bo'lganda">Zarur bo&apos;lganda</option>
                </select>
                <input className="input" placeholder="Davomiylik (7 kun)" value={newRx.duration} onChange={e => setNewRx({ ...newRx, duration: e.target.value })} />
                <input className="input" placeholder="Ko'rsatma" value={newRx.instructions} onChange={e => setNewRx({ ...newRx, instructions: e.target.value })} />
              </div>
              <button className="btn btn-outline w-full" onClick={addPrescriptionItem}><Plus size={14} /> Qo&apos;shish</button>
            </div>

            {prescriptions.length > 0 && (
              <div className="space-y-2">
                {prescriptions.map((rx, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{rx.medicine} — {rx.dose}</p>
                      <p className="text-xs text-gray-500">{rx.frequency} • {rx.duration} • {rx.instructions}</p>
                    </div>
                    <button className="text-red-400 hover:text-red-600" onClick={() => setPrescriptions(prescriptions.filter((_, idx) => idx !== i))}>
                      <XCircle size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <ClipboardList size={18} /> Muolajalar buyurtmasi
            </h4>
            <div className="flex gap-2 mb-3">
              <input className="input" placeholder="Tahlil, Rentgen, UZI, Fizioterapiya..." value={newTreatment} onChange={e => setNewTreatment(e.target.value)} />
              <button className="btn btn-outline" onClick={() => { if (newTreatment) { setTreatments([...treatments, newTreatment]); setNewTreatment(''); } }}>+</button>
            </div>
            {treatments.map((t, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg mb-1">
                <span className="text-sm text-gray-900">{t}</span>
                <button className="text-red-400" onClick={() => setTreatments(treatments.filter((_, idx) => idx !== i))}><XCircle size={14} /></button>
              </div>
            ))}
          </div>

          {/* Previous visits */}
          {patient.visits?.length > 0 && (
            <div className="card p-5">
              <h4 className="font-bold text-gray-900 mb-3">Oldingi tashriflar</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {patient.visits.map((v, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">{v.diagnosis}</span>
                      <span className="text-xs text-gray-500">{formatDate(v.date)}</span>
                    </div>
                    {v.icdCode && <span className="badge badge-gray text-xs mt-1">{v.icdCode}</span>}
                    {v.notes && <p className="text-xs text-gray-500 mt-1">{v.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Buttons */}
      <div className="flex justify-end gap-3 mt-6 no-print">
        <button className="btn btn-outline" onClick={onBack}>Ortga</button>
        <button className="btn btn-success btn-lg" onClick={handleSave}>
          <CheckCircle size={18} /> Qabulni yakunlash
        </button>
      </div>
    </div>
  );
}

// ===== INPATIENTS =====
function InpatientsSection({ onSelectPatient }) {
  const { patients, rooms, staff } = useCrm();

  const inpatients = useMemo(() => {
    return patients.filter(p => p.status === 'stasionar');
  }, [patients]);

  return (
    <div>
      <Header title="Stasionar Bemorlar" subtitle={`${inpatients.length} ta bemor yotmoqda`} role="doctor" />

      <div className="space-y-3">
        {inpatients.map(patient => {
          const room = rooms.find(r => r.id === patient.roomId);
          const doctor = staff.find(s => s.id === patient.assignedDoctor);
          return (
            <div key={patient.id} className="card p-4 hover:border-green-300 cursor-pointer transition-all" onClick={() => onSelectPatient(patient)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${patient.overallCondition === 'good' ? 'bg-green-500' : patient.overallCondition === 'moderate' ? 'bg-yellow-500' : patient.overallCondition === 'serious' ? 'bg-orange-500' : 'bg-red-500'}`} />
                  <div>
                    <h4 className="font-bold text-gray-900">{patient.firstName} {patient.lastName}</h4>
                    <p className="text-sm text-gray-500">
                      {patient.id} • {getAge(patient.birthDate)} yosh • Xona: #{room?.number || '—'} ({room?.type || '—'})
                    </p>
                    <p className="text-sm text-gray-600">{patient.visits?.[patient.visits.length - 1]?.diagnosis || patient.visitReason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`badge ${patient.overallCondition === 'good' ? 'badge-success' : patient.overallCondition === 'moderate' ? 'badge-warning' : 'badge-danger'}`}>
                    {patient.overallCondition === 'good' ? '🟢 Yaxshi' : patient.overallCondition === 'moderate' ? "🟡 O'rta" : patient.overallCondition === 'serious' ? "🔴 Og'ir" : "⚫ Juda og'ir"}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">Yotgan: {formatDate(patient.admissionDate)}</p>
                  {patient.expectedDischarge && <p className="text-xs text-gray-400">Chiqish: {formatDate(patient.expectedDischarge)}</p>}
                </div>
              </div>
            </div>
          );
        })}

        {inpatients.length === 0 && (
          <EmptyState icon={<BedDouble size={48} />} title="Stasionar bemorlar yo'q" />
        )}
      </div>
    </div>
  );
}

// ===== PATIENT HISTORY =====
function PatientHistorySection() {
  const { patients, staff } = useCrm();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const filtered = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return patients.filter(p =>
      p.id.toLowerCase().includes(q) ||
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      p.phone.includes(q)
    ).slice(0, 10);
  }, [patients, searchQuery]);

  return (
    <div>
      <Header title="Bemor Tarixi" role="doctor" />

      <div className="mb-4 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Bemor qidirish (ism, ID, telefon)..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setSelectedPatient(null); }} />
      </div>

      {!selectedPatient ? (
        <div className="space-y-2">
          {filtered.map(p => (
            <div key={p.id} className="card p-4 cursor-pointer hover:border-green-300 transition-all" onClick={() => setSelectedPatient(p)}>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-gray-900">{p.firstName} {p.lastName}</h4>
                  <p className="text-sm text-gray-500">{p.id} • {p.phone} • {getAge(p.birthDate)} yosh</p>
                </div>
                <span className={`badge ${p.status === 'stasionar' ? 'badge-danger' : p.status === 'tuzalgan' ? 'badge-success' : 'badge-info'}`}>
                  {p.status}
                </span>
              </div>
            </div>
          ))}
          {searchQuery.length >= 2 && filtered.length === 0 && <EmptyState icon={<Search size={48} />} title="Bemor topilmadi" />}
        </div>
      ) : (
        <div>
          <button className="btn btn-outline mb-4" onClick={() => setSelectedPatient(null)}>← Ortga</button>

          <div className="card p-5 mb-4">
            <h3 className="font-bold text-gray-900 text-lg mb-2">{selectedPatient.firstName} {selectedPatient.lastName} {selectedPatient.middleName || ''}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
              <div><span className="font-medium text-gray-500">ID:</span> {selectedPatient.id}</div>
              <div><span className="font-medium text-gray-500">Yosh:</span> {getAge(selectedPatient.birthDate)}</div>
              <div><span className="font-medium text-gray-500">Qon:</span> {selectedPatient.bloodGroup}</div>
              <div><span className="font-medium text-gray-500">Tel:</span> {selectedPatient.phone}</div>
            </div>
          </div>

          <h4 className="font-bold text-gray-900 mb-3">Tashriflar tarixi ({selectedPatient.visits?.length || 0})</h4>
          <div className="space-y-3">
            {(selectedPatient.visits || []).map((v, i) => (
              <div key={i} className="card p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-gray-900">{v.diagnosis}</h5>
                    {v.icdCode && <span className="badge badge-info text-xs mt-1">{v.icdCode}</span>}
                    {v.notes && <p className="text-sm text-gray-600 mt-2">{v.notes}</p>}
                  </div>
                  <span className="text-sm text-gray-400">{formatDate(v.date)}</span>
                </div>
              </div>
            ))}
          </div>

          {selectedPatient.prescriptions?.length > 0 && (
            <div className="mt-6">
              <h4 className="font-bold text-gray-900 mb-3">Retseptlar</h4>
              <div className="card overflow-hidden">
                <table className="data-table">
                  <thead><tr><th>Dori</th><th>Doza</th><th>Qabul</th><th>Davomiylik</th><th>Sana</th></tr></thead>
                  <tbody>
                    {selectedPatient.prescriptions.map((rx, i) => (
                      <tr key={i}>
                        <td className="text-sm font-medium">{rx.medicine}</td>
                        <td className="text-sm">{rx.dose}</td>
                        <td className="text-sm">{rx.frequency}</td>
                        <td className="text-sm">{rx.duration}</td>
                        <td className="text-sm text-gray-500">{formatDate(rx.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedPatient.files?.length > 0 && (
            <div className="mt-6 animate-fadeIn">
              <h4 className="font-bold text-gray-900 mb-3">Analizlar va Hujjatlar</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedPatient.files.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-zinc-900 shadow-sm text-xs">
                    <div className="flex items-center gap-2.5 truncate max-w-[80%]">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-lg font-bold shrink-0">
                        {getFileIcon(file.name)}
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{file.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {(file.size / 1024).toFixed(1)} KB • {file.date}
                        </p>
                      </div>
                    </div>
                    <a 
                      href={file.content} 
                      download={file.name}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-blue-500 transition-colors flex items-center justify-center"
                      title="Yuklab olish"
                    >
                      <Download size={14} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== DOCTOR DIARY =====
function DoctorDiary() {
  const { patients } = useCrm();
  const today = new Date().toISOString().split('T')[0];

  const todayStats = useMemo(() => {
    const todayPatients = patients.filter(p => p.admissionDate === today);
    const completed = todayPatients.filter(p => p.queueStatus === 'completed').length;
    const prescriptions = todayPatients.reduce((s, p) => s + (p.prescriptions?.filter(rx => rx.date === today).length || 0), 0);
    return { total: todayPatients.length, completed, prescriptions };
  }, [patients, today]);

  return (
    <div>
      <Header title="Shifokor Kundaligi" subtitle={formatDate(today)} role="doctor" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={<User size={24} />} title="Bugun ko'rildi" value={todayStats.completed} colorClass="stat-green" />
        <StatCard icon={<FileText size={24} />} title="Retseptlar" value={todayStats.prescriptions} colorClass="stat-blue" />
        <StatCard icon={<Calendar size={24} />} title="Jami navbat" value={todayStats.total} colorClass="stat-yellow" />
      </div>

      <div className="card p-5">
        <h4 className="font-bold text-gray-900 mb-3">Bugungi qabul qilingan bemorlar</h4>
        <div className="space-y-2">
          {patients.filter(p => p.admissionDate === today && p.queueStatus === 'completed').map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 text-sm">{p.firstName} {p.lastName}</p>
                <p className="text-xs text-gray-500">{p.visits?.[p.visits.length - 1]?.diagnosis || '—'}</p>
              </div>
              <span className="badge badge-success">✅ Tugallandi</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
