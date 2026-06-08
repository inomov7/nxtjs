'use client';

import { useState, useMemo } from 'react';
import { useCrm } from '@/lib/CrmContext';
import { ROLES, BLOOD_GROUPS, ROOM_STATUSES, generateId } from '@/lib/demoData';
import {
  Sidebar, Header, StatCard, Modal, useToast, TabNav,
  formatMoney, formatDate, getAge, EmptyState, ConfirmDialog,
} from './SharedComponents';
import {
  UserPlus, ListOrdered, BedDouble, CreditCard, PhoneCall,
  BarChart3, Search, Plus, Clock, CheckCircle, XCircle,
  ArrowUp, Printer, User, Phone, Calendar, MapPin,
  ChevronRight, AlertCircle, FileText,
} from 'lucide-react';

const TABS = [
  { key: 'register', label: "Ro'yxatdan o'tkazish", icon: <UserPlus size={18} /> },
  { key: 'queue', label: 'Navbat', icon: <ListOrdered size={18} /> },
  { key: 'rooms', label: 'Xona Tanlash', icon: <BedDouble size={18} /> },
  { key: 'payment', label: "To'lov", icon: <CreditCard size={18} /> },
  { key: 'calls', label: "Qo'ng'iroqlar", icon: <PhoneCall size={18} /> },
  { key: 'report', label: 'Hisobot', icon: <BarChart3 size={18} /> },
];

export default function ReceptionPanel() {
  const [activeTab, setActiveTab] = useState('register');
  return (
    <div className="flex">
      <Sidebar role="reception" tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="main-content">
        {activeTab === 'register' && <PatientRegistration />}
        {activeTab === 'queue' && <QueueManagement />}
        {activeTab === 'rooms' && <RoomSelection />}
        {activeTab === 'payment' && <PaymentSection />}
        {activeTab === 'calls' && <CallLogSection />}
        {activeTab === 'report' && <ReceptionReport />}
      </div>
    </div>
  );
}

// ===== THERMAL TICKET PRINTING (80mm) =====
export function printThermalTicket(patient, doctor) {
  const printWindow = window.open('', '_blank', 'width=350,height=600');
  if (!printWindow) {
    alert("Iltimos, qalqib chiquvchi oynalar (popup) bloklanishini taqiqlab qayta urining.");
    return;
  }
  
  const today = new Date();
  const dateStr = today.toLocaleDateString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeStr = today.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Navbat Cheki #${patient.ticketNumber || patient.queueNumber}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 72mm;
            margin: 0 auto;
            padding: 8px 4px;
            font-size: 13px;
            line-height: 1.4;
            color: #000000;
            text-align: center;
          }
          .header {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 3px;
            text-transform: uppercase;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 8px 0;
          }
          .ticket-number {
            font-size: 36px;
            font-weight: bold;
            margin: 12px 0;
            letter-spacing: 1px;
          }
          .details {
            text-align: left;
            font-size: 12px;
            margin-bottom: 12px;
          }
          .details-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
          }
          .footer {
            font-size: 10px;
            margin-top: 15px;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="header">HAYOT KLINIKASI</div>
        <div>Navbat Chiptasi</div>
        <div class="divider"></div>
        
        <div class="ticket-number">${patient.ticketNumber || `#${patient.queueNumber}`}</div>
        
        <div class="divider"></div>
        <div class="details">
          <div class="details-row">
            <span>Bemor:</span>
            <strong>${patient.lastName} ${patient.firstName}</strong>
          </div>
          <div class="details-row">
            <span>Shifokor:</span>
            <strong>Dr. ${doctor ? `${doctor.lastName} ${doctor.firstName[0]}.` : 'Noma\'lum'}</strong>
          </div>
          <div class="details-row">
            <span>Bo'lim:</span>
            <strong>${doctor ? doctor.specialization : 'Noma\'lum'}</strong>
          </div>
          <div class="details-row">
            <span>Sana:</span>
            <strong>${dateStr}</strong>
          </div>
          <div class="details-row">
            <span>Vaqt:</span>
            <strong>${patient.queueTime || timeStr}</strong>
          </div>
        </div>
        <div class="divider"></div>
        <div class="footer">
          Sog'ligingiz — bizning baxtimiz!<br>
          Navbatingizni kuting. Rahmat!
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
}

// ===== PATIENT REGISTRATION =====
function PatientRegistration() {
  const { addPatient, staff, patients } = useCrm();
  const toast = useToast();

  const emptyForm = {
    firstName: '', lastName: '', middleName: '', birthDate: '', gender: 'Erkak', nationality: "O'zbek",
    phone: '', phone2: '', email: '',
    address: { region: 'Toshkent', district: '', street: '' },
    bloodGroup: '', allergies: [], chronicDiseases: [],
    visitReason: '', visitType: 'Birinchi marta',
    assignedDoctor: '', queueTime: '',
    insurance: { company: '', policyNumber: '', validUntil: '' },
  };
  const [form, setForm] = useState(emptyForm);
  const [allergyInput, setAllergyInput] = useState('');
  const [diseaseInput, setDiseaseInput] = useState('');
  const [registeredPatient, setRegisteredPatient] = useState(null);

  const doctors = staff.filter(s => s.role === 'doctor' && s.active);
  const nextQueueNumber = Math.max(...patients.map(p => p.queueNumber || 0), 0) + 1;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.phone || !form.visitReason) {
      toast("Majburiy maydonlarni to'ldiring (Ism, Familiya, Telefon, Kelish sababi)", 'error');
      return;
    }

    const newPatient = addPatient({
      ...form,
      status: 'navbatda',
      queueNumber: nextQueueNumber,
      queueTime: form.queueTime || new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      queueStatus: 'waiting',
      admissionDate: new Date().toISOString().split('T')[0],
      roomId: null,
      expectedDischarge: null,
      diet: null,
    });

    toast(`${form.firstName} ${form.lastName} ro'yxatdan o'tkazildi. ID: ${newPatient.id}`, 'success');
    setRegisteredPatient(newPatient);
    setForm(emptyForm);
  };

  return (
    <div>
      <Header title="Bemor Ro'yxatdan O'tkazish" subtitle={`Navbat: #${nextQueueNumber}`} role="reception" />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Personal */}
          <div className="card p-5">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><User size={18} /> Shaxsiy ma&apos;lumotlar</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Ism *</label>
                <input className="input" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Familiya *</label>
                <input className="input" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Otasining ismi</label>
                <input className="input" value={form.middleName} onChange={e => setForm({ ...form, middleName: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Tug&apos;ilgan sana</label>
                <input className="input" type="date" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Jinsi</label>
                <select className="input select" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                  <option>Erkak</option>
                  <option>Ayol</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Millati</label>
                <input className="input" value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="card p-5">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Phone size={18} /> Aloqa ma&apos;lumotlari</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Telefon (asosiy) *</label>
                <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+998 90 123 45 67" required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Qo&apos;shimcha telefon</label>
                <input className="input" value={form.phone2} onChange={e => setForm({ ...form, phone2: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Manzil</label>
                <div className="grid grid-cols-3 gap-2">
                  <input className="input" placeholder="Viloyat" value={form.address.region} onChange={e => setForm({ ...form, address: { ...form.address, region: e.target.value } })} />
                  <input className="input" placeholder="Tuman" value={form.address.district} onChange={e => setForm({ ...form, address: { ...form.address, district: e.target.value } })} />
                  <input className="input" placeholder="Ko'cha" value={form.address.street} onChange={e => setForm({ ...form, address: { ...form.address, street: e.target.value } })} />
                </div>
              </div>
            </div>
          </div>

          {/* Medical */}
          <div className="card p-5">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><AlertCircle size={18} /> Tibbiy ma&apos;lumotlar</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Qon guruhi</label>
                <select className="input select" value={form.bloodGroup} onChange={e => setForm({ ...form, bloodGroup: e.target.value })}>
                  <option value="">Tanlang</option>
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Allergiyalar</label>
                <div className="flex gap-2 mb-1">
                  <input className="input" placeholder="Allergiya..." value={allergyInput} onChange={e => setAllergyInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (allergyInput.trim()) { setForm({ ...form, allergies: [...form.allergies, allergyInput.trim()] }); setAllergyInput(''); } } }} />
                  <button type="button" className="btn btn-outline" onClick={() => { if (allergyInput.trim()) { setForm({ ...form, allergies: [...form.allergies, allergyInput.trim()] }); setAllergyInput(''); } }}>+</button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {form.allergies.map((a, i) => <span key={i} className="badge badge-danger cursor-pointer" onClick={() => setForm({ ...form, allergies: form.allergies.filter((_, idx) => idx !== i) })}>{a} ✕</span>)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Surunkali kasalliklar</label>
                <div className="flex gap-2 mb-1">
                  <input className="input" placeholder="Kasallik..." value={diseaseInput} onChange={e => setDiseaseInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (diseaseInput.trim()) { setForm({ ...form, chronicDiseases: [...form.chronicDiseases, diseaseInput.trim()] }); setDiseaseInput(''); } } }} />
                  <button type="button" className="btn btn-outline" onClick={() => { if (diseaseInput.trim()) { setForm({ ...form, chronicDiseases: [...form.chronicDiseases, diseaseInput.trim()] }); setDiseaseInput(''); } }}>+</button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {form.chronicDiseases.map((d, i) => <span key={i} className="badge badge-warning cursor-pointer" onClick={() => setForm({ ...form, chronicDiseases: form.chronicDiseases.filter((_, idx) => idx !== i) })}>{d} ✕</span>)}
                </div>
              </div>
            </div>
          </div>

          {/* Visit & Insurance */}
          <div className="card p-5">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Calendar size={18} /> Tashrif ma&apos;lumotlari</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Kelish sababi *</label>
                <input className="input" value={form.visitReason} onChange={e => setForm({ ...form, visitReason: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Kelish turi</label>
                  <select className="input select" value={form.visitType} onChange={e => setForm({ ...form, visitType: e.target.value })}>
                    <option>Birinchi marta</option>
                    <option>Qayta</option>
                    <option>Tez yordam</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Navbat vaqti</label>
                  <input className="input" type="time" value={form.queueTime} onChange={e => setForm({ ...form, queueTime: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Shifokor</label>
                <select className="input select" value={form.assignedDoctor} onChange={e => setForm({ ...form, assignedDoctor: e.target.value })}>
                  <option value="">Shifokor tanlang</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName} ({d.specialization})</option>)}
                </select>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Sug&apos;urta (ixtiyoriy)</h5>
                <div className="grid grid-cols-2 gap-2">
                  <input className="input" placeholder="Kompaniya" value={form.insurance.company} onChange={e => setForm({ ...form, insurance: { ...form.insurance, company: e.target.value } })} />
                  <input className="input" placeholder="Polis raqami" value={form.insurance.policyNumber} onChange={e => setForm({ ...form, insurance: { ...form.insurance, policyNumber: e.target.value } })} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button type="button" className="btn btn-outline" onClick={() => setForm(emptyForm)}>Tozalash</button>
          <button type="submit" className="btn btn-success btn-lg">
            <CheckCircle size={18} /> Ro&apos;yxatdan o&apos;tkazish
          </button>
        </div>
      </form>

      {/* Ticket Preview Modal */}
      {registeredPatient && (
        <Modal
          isOpen={!!registeredPatient}
          onClose={() => setRegisteredPatient(null)}
          title="Navbat Cheki"
          size="default"
        >
          <div className="flex flex-col items-center p-4">
            <div className="w-[300px] bg-white text-black p-6 rounded-2xl shadow-lg border border-gray-200 font-mono text-center select-none mb-6">
              <h3 className="font-bold text-lg tracking-wider uppercase mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>HAYOT KLINIKASI</h3>
              <p className="text-xs text-gray-500">Navbat Chiptasi</p>
              <div className="border-t border-dashed border-gray-400 my-3"></div>
              
              <div className="text-4xl font-extrabold my-4 tracking-wide text-gray-900">
                {registeredPatient.ticketNumber || `#${registeredPatient.queueNumber}`}
              </div>
              
              <div className="border-t border-dashed border-gray-400 my-3"></div>
              
              <div className="text-left text-xs space-y-2 text-gray-800">
                <div className="flex justify-between">
                  <span>Bemor:</span>
                  <strong className="text-right">{registeredPatient.lastName} {registeredPatient.firstName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Shifokor:</span>
                  <strong>Dr. {(() => {
                    const doc = staff.find(s => s.id === registeredPatient.assignedDoctor);
                    return doc ? `${doc.lastName} ${doc.firstName[0]}.` : 'Noma\'lum';
                  })()}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Bo'lim:</span>
                  <strong>{(() => {
                    const doc = staff.find(s => s.id === registeredPatient.assignedDoctor);
                    return doc ? doc.specialization : 'Noma\'lum';
                  })()}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Sana:</span>
                  <strong>{new Date().toLocaleDateString('uz-UZ')}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Vaqt:</span>
                  <strong>{registeredPatient.queueTime || new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</strong>
                </div>
              </div>
              
              <div className="border-t border-dashed border-gray-400 my-3"></div>
              <p className="text-[10px] italic leading-tight text-gray-600 mt-2">
                Sog'ligingiz — bizning baxtimiz!<br />
                Navbatingizni kuting. Rahmat!
              </p>
            </div>
            
            <div className="flex gap-3 w-full justify-end">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setRegisteredPatient(null)}
              >
                Yopish
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  const doc = staff.find(s => s.id === registeredPatient.assignedDoctor);
                  printThermalTicket(registeredPatient, doc);
                }}
              >
                <Printer size={16} /> Chop etish
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ===== QUEUE MANAGEMENT =====
function QueueManagement() {
  const { patients, updatePatient, staff } = useCrm();
  const toast = useToast();
  const today = new Date().toISOString().split('T')[0];

  const queuePatients = useMemo(() => {
    return patients
      .filter(p => p.admissionDate === today && p.queueNumber)
      .sort((a, b) => {
        const order = { 'in-progress': 0, 'waiting': 1, 'completed': 2, 'no-show': 3 };
        return (order[a.queueStatus] || 9) - (order[b.queueStatus] || 9) || (a.queueNumber || 0) - (b.queueNumber || 0);
      });
  }, [patients, today]);

  const moveToFirst = (patient) => {
    updatePatient(patient.id, { queueNumber: 0, visitType: 'Tez yordam' });
    toast(`${patient.firstName} navbat boshiga o'tkazildi`, 'info');
  };

  return (
    <div>
      <Header title="Navbat Boshqaruvi" subtitle={`Bugun: ${queuePatients.length} ta bemor`} role="reception" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={<Clock size={24} />} title="Kutmoqda" value={queuePatients.filter(p => p.queueStatus === 'waiting').length} colorClass="stat-yellow" />
        <StatCard icon={<CheckCircle size={24} />} title="Tugallangan" value={queuePatients.filter(p => p.queueStatus === 'completed').length} colorClass="stat-green" />
        <StatCard icon={<XCircle size={24} />} title="Kelmadi" value={queuePatients.filter(p => p.queueStatus === 'no-show').length} colorClass="stat-red" />
      </div>

      <div className="space-y-2">
        {queuePatients.map((p, idx) => {
          const statusColor = p.queueStatus === 'waiting' ? 'border-l-yellow-400' : p.queueStatus === 'in-progress' ? 'border-l-blue-500' : p.queueStatus === 'completed' ? 'border-l-green-500' : 'border-l-red-400';
          const doctor = staff.find(s => s.id === p.assignedDoctor);
          return (
            <div key={p.id} className={`card p-4 border-l-4 ${statusColor} animate-fadeIn`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1.5 rounded-xl bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 text-yellow-700 dark:text-yellow-400 font-mono font-bold text-sm tracking-wide shadow-sm">
                    {p.ticketNumber || `#${p.queueNumber}`}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">{p.firstName} {p.lastName}</h4>
                    <p className="text-xs text-gray-500">
                      {p.id} • 🕐 {p.queueTime}
                      {doctor ? ` • Shifokor: Dr. ${doctor.lastName} (${doctor.specialization})` : ''}
                      {p.visitReason ? ` • ${p.visitReason}` : ''}
                    </p>
                    {p.visitType === 'Tez yordam' && <span className="badge badge-danger text-xs">🚑 Tez yordam</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(p.queueStatus === 'waiting' || p.queueStatus === 'in-progress') && (
                    <button 
                      className="btn btn-sm btn-outline" 
                      onClick={() => {
                        printThermalTicket(p, doctor);
                        toast('Chek chop etildi', 'success');
                      }}
                      title="Chekni qayta chop etish"
                    >
                      <Printer size={12} /> Chek
                    </button>
                  )}
                  {p.queueStatus === 'waiting' && (
                    <>
                      <button className="btn btn-sm btn-warning" onClick={() => moveToFirst(p)}>
                        <ArrowUp size={12} /> Birinchiga
                      </button>
                      <button className="btn btn-sm btn-outline" onClick={() => { updatePatient(p.id, { queueStatus: 'no-show' }); toast('Bemor kelmadi deb belgilandi', 'info'); }}>
                        <XCircle size={12} /> Kelmadi
                      </button>
                    </>
                  )}
                  <span className={`badge ${p.queueStatus === 'waiting' ? 'badge-warning' : p.queueStatus === 'in-progress' ? 'badge-info' : p.queueStatus === 'completed' ? 'badge-success' : 'badge-danger'}`}>
                    {p.queueStatus === 'waiting' ? '⏳ Kutmoqda' : p.queueStatus === 'in-progress' ? '🔵 Jarayonda' : p.queueStatus === 'completed' ? '✅ Tugadi' : '❌ Kelmadi'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== ROOM SELECTION =====
function RoomSelection() {
  const { rooms, updateRoom, patients, updatePatient } = useCrm();
  const toast = useToast();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState('');

  const availablePatients = patients.filter(p => !p.roomId && (p.status === 'navbatda' || p.status === 'ambulatoriya'));

  const handleAssign = () => {
    if (!selectedRoom || !selectedPatient) { toast('Xona va bemor tanlang', 'error'); return; }
    
    const roomPatientsCount = patients.filter(p => p.roomId === selectedRoom.id && p.status === 'stasionar').length;
    if (roomPatientsCount >= selectedRoom.capacity) {
      toast("Xonada bo'sh joy qolmadi!", 'error');
      return;
    }

    updatePatient(selectedPatient, { roomId: selectedRoom.id, status: 'stasionar' });
    
    // Update status to busy if it reaches capacity
    const isFull = (roomPatientsCount + 1) >= selectedRoom.capacity;
    updateRoom(selectedRoom.id, { status: isFull ? 'busy' : 'free' });
    
    toast('Bemor xonaga joylashtirildi', 'success');
    setSelectedRoom(null);
    setSelectedPatient('');
  };

  return (
    <div>
      <Header title="Xona Tanlash va Joylashtirish" role="reception" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {rooms.map(room => {
          const roomPatients = patients.filter(p => p.roomId === room.id && p.status === 'stasionar');
          const isFull = roomPatients.length >= room.capacity;
          const canSelect = (room.status === 'free' || room.status === 'busy') && !isFull;
          
          // Determine status visually
          const displayStatus = (room.status === 'free' || room.status === 'busy') 
            ? (isFull ? 'busy' : 'free') 
            : room.status;
          const statusInfo = ROOM_STATUSES.find(s => s.key === displayStatus);

          return (
            <div
              key={room.id}
              tabIndex={canSelect ? 0 : -1}
              role="button"
              aria-label={`Xona #${room.number}, ${room.type}, Bandlik: ${roomPatients.length}/${room.capacity}`}
              className={`floor-room room-${displayStatus} ${selectedRoom?.id === room.id ? 'ring-2 ring-blue-500' : ''} ${canSelect ? 'cursor-pointer hover:scale-[1.02]' : 'opacity-75'}`}
              onClick={() => canSelect ? setSelectedRoom(room) : null}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (canSelect) setSelectedRoom(room);
                }
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-lg">#{room.number}</h4>
                <span className="text-xl">{statusInfo?.emoji}</span>
              </div>
              <p className="text-xs text-gray-600">{room.type} • Qavat {room.floor}</p>
              <p className="text-xs font-medium mt-1">{formatMoney(room.pricePerDay)} so&apos;m/kun</p>
              <p className="text-xs text-gray-500 mt-1">Joylar: <span className="font-semibold text-gray-800">{roomPatients.length}/{room.capacity}</span></p>
              
              {roomPatients.length > 0 && (
                <div className="mt-2 pt-2 border-t border-black/5 space-y-1">
                  {roomPatients.map(p => (
                    <p key={p.id} className="text-[11px] text-gray-700 truncate font-medium">👤 {p.firstName} {p.lastName}</p>
                  ))}
                </div>
              )}
              
              <div className="flex flex-wrap gap-1 mt-2">
                {(room.equipment || []).slice(0, 3).map((eq, i) => (
                  <span key={i} className="text-[10px] bg-white/50 px-1.5 py-0.5 rounded">{eq}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedRoom && (
        <div className="card p-5 max-w-md mx-auto animate-fadeIn">
          <h4 className="font-bold text-gray-900 mb-4">Bemorni joylashtirish — #{selectedRoom.number}</h4>
          <select className="input select mb-4" value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}>
            <option value="">Bemor tanlang...</option>
            {availablePatients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.id})</option>)}
          </select>
          <div className="flex gap-3">
            <button className="btn btn-outline" onClick={() => setSelectedRoom(null)}>Bekor</button>
            <button className="btn btn-success" onClick={handleAssign}>Joylashtirish</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== PAYMENT =====
function PaymentSection() {
  const { services, patients, addPayment } = useCrm();
  const toast = useToast();
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Naqd');
  const [paidAmount, setPaidAmount] = useState('');

  const totalAmount = selectedServices.reduce((s, srvId) => {
    const srv = services.find(sv => sv.id === srvId);
    return s + (srv?.price || 0);
  }, 0);
  const finalAmount = totalAmount - Number(discount);

  const handlePayment = () => {
    if (!selectedPatient || selectedServices.length === 0) { toast("Bemor va xizmatlarni tanlang", 'error'); return; }
    const paid = Number(paidAmount) || finalAmount;
    const srvNames = selectedServices.map(id => services.find(s => s.id === id)?.name || '');

    addPayment({
      patientId: selectedPatient,
      services: srvNames,
      totalAmount,
      discount: Number(discount),
      paid,
      method: paymentMethod,
      status: paid >= finalAmount ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
    });

    toast(`To'lov qabul qilindi: ${formatMoney(paid)} so'm`, 'success');
    setSelectedPatient('');
    setSelectedServices([]);
    setDiscount(0);
    setPaidAmount('');
  };

  const toggleService = (srvId) => {
    setSelectedServices(prev => prev.includes(srvId) ? prev.filter(id => id !== srvId) : [...prev, srvId]);
  };

  return (
    <div>
      <Header title="To'lov Qabul Qilish" role="reception" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h4 className="font-bold text-gray-900 mb-4">Bemor tanlash</h4>
          <select className="input select mb-4" value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}>
            <option value="">Bemor tanlang...</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.id})</option>)}
          </select>

          <h4 className="font-bold text-gray-900 mb-3">Xizmatlar</h4>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {services.map(srv => (
              <label key={srv.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedServices.includes(srv.id) ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                <input type="checkbox" checked={selectedServices.includes(srv.id)} onChange={() => toggleService(srv.id)} className="w-4 h-4 rounded" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{srv.name}</p>
                  <p className="text-xs text-gray-500">{srv.category}</p>
                </div>
                <span className="text-sm font-bold text-gray-900">{formatMoney(srv.price)} so&apos;m</span>
              </label>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h4 className="font-bold text-gray-900 mb-4">Hisob-kitob</h4>

          <div className="space-y-3 mb-6">
            {selectedServices.map(srvId => {
              const srv = services.find(s => s.id === srvId);
              return srv ? (
                <div key={srvId} className="flex justify-between text-sm">
                  <span>{srv.name}</span>
                  <span className="font-medium">{formatMoney(srv.price)} so&apos;m</span>
                </div>
              ) : null;
            })}

            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between text-sm mb-2">
                <span>Jami:</span>
                <span className="font-medium">{formatMoney(totalAmount)} so&apos;m</span>
              </div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Chegirma:</span>
                <input className="input w-32 text-right" type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" />
              </div>
              <div className="flex justify-between text-lg font-bold text-green-600">
                <span>Yakuniy:</span>
                <span>{formatMoney(finalAmount)} so&apos;m</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">To&apos;lov usuli</label>
              <select className="input select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option>Naqd</option>
                <option>Karta</option>
                <option>Sug&apos;urta</option>
                <option>Muddatli to&apos;lov</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">To&apos;langan summa</label>
              <input className="input" type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} placeholder={finalAmount.toString()} />
            </div>

            <button className="btn btn-success btn-lg w-full" onClick={handlePayment}>
              <CreditCard size={18} /> To&apos;lovni tasdiqlash
            </button>
            <button className="btn btn-outline w-full" onClick={() => window.print()}>
              <Printer size={16} /> Chek chop etish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== CALL LOG =====
function CallLogSection() {
  const { callLog, addCallLogEntry } = useCrm();
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ time: '', callerName: '', phone: '', reason: '', note: '', status: 'completed' });

  const handleSubmit = () => {
    if (!form.callerName || !form.phone) { toast("Ma'lumotlarni to'ldiring", 'error'); return; }
    addCallLogEntry({ ...form, time: form.time || new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) });
    toast("Qo'ng'iroq qayd etildi", 'success');
    setShowModal(false);
    setForm({ time: '', callerName: '', phone: '', reason: '', note: '', status: 'completed' });
  };

  return (
    <div>
      <Header title="Qo'ng'iroqlar Jurnali" role="reception" />

      <div className="flex justify-end mb-4">
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Yangi yozuv
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr><th>Vaqt</th><th>Qo&apos;ng&apos;iroqchi</th><th>Telefon</th><th>Sabab</th><th>Izoh</th></tr>
          </thead>
          <tbody>
            {callLog.map(call => (
              <tr key={call.id}>
                <td className="text-sm">{call.time}</td>
                <td className="text-sm font-medium">{call.callerName}</td>
                <td className="text-sm">{call.phone}</td>
                <td className="text-sm">{call.reason}</td>
                <td className="text-sm text-gray-500">{call.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Yangi qo'ng'iroq">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Ism</label>
              <input className="input" value={form.callerName} onChange={e => setForm({ ...form, callerName: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Telefon</label>
              <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Sabab</label>
            <input className="input" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Izoh</label>
            <textarea className="input" rows={2} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>Bekor</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Saqlash</button>
        </div>
      </Modal>
    </div>
  );
}

// ===== RECEPTION REPORT =====
function ReceptionReport() {
  const { patients, payments } = useCrm();
  const today = new Date().toISOString().split('T')[0];

  const todayPatients = patients.filter(p => p.admissionDate === today);
  const todayPayments = payments.filter(p => p.date === today);
  const todayIncome = todayPayments.reduce((s, p) => s + p.paid, 0);
  const cancelledQueues = todayPatients.filter(p => p.queueStatus === 'no-show').length;

  return (
    <div>
      <Header title="Resepshion Hisoboti" subtitle={formatDate(today)} role="reception" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={<User size={24} />} title="Qabul qilingan" value={todayPatients.length} colorClass="stat-blue" />
        <StatCard icon={<CreditCard size={24} />} title="Yig'ilgan to'lov" value={`${formatMoney(todayIncome)} so'm`} colorClass="stat-green" />
        <StatCard icon={<XCircle size={24} />} title="Bekor qilingan" value={cancelledQueues} colorClass="stat-red" />
      </div>

      <div className="card p-5">
        <h4 className="font-bold text-gray-900 mb-3">Bugungi bemorlar</h4>
        <table className="data-table">
          <thead>
            <tr><th>Bemor</th><th>ID</th><th>Kelish sababi</th><th>Turi</th><th>Holat</th></tr>
          </thead>
          <tbody>
            {todayPatients.map(p => (
              <tr key={p.id}>
                <td className="text-sm font-medium">{p.firstName} {p.lastName}</td>
                <td className="text-sm text-gray-500">{p.id}</td>
                <td className="text-sm">{p.visitReason}</td>
                <td><span className="badge badge-info">{p.visitType}</span></td>
                <td>
                  <span className={`badge ${p.queueStatus === 'completed' ? 'badge-success' : p.queueStatus === 'waiting' ? 'badge-warning' : p.queueStatus === 'in-progress' ? 'badge-info' : 'badge-danger'}`}>
                    {p.queueStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3 mt-4 no-print">
        <button className="btn btn-outline" onClick={() => window.print()}><Printer size={16} /> Chop etish</button>
      </div>
    </div>
  );
}
