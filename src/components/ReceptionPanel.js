'use client';

import { useState, useMemo, useCallback } from 'react';
import { useCrm } from '@/lib/CrmContext';
import { ROLES, BLOOD_GROUPS, ROOM_STATUSES, generateId } from '@/lib/demoData';
import {
  Sidebar, Header, StatCard, Modal, Drawer, TabNav, useToast,
  formatMoney, formatDate, getAge, EmptyState, ConfirmDialog, ProfileSettings,
  PatientHistorySection, normalizeUzPhone
} from './SharedComponents';
import {
  UserPlus, ListOrdered, BedDouble, CreditCard, PhoneCall,
  BarChart3, Search, Plus, Clock, CheckCircle, XCircle,
  ArrowUp, Printer, User, Phone, Calendar, MapPin,
  ChevronRight, AlertCircle, FileText, Settings, Shield, Tag, Copy, Edit,
  DoorOpen, TrendingDown, TrendingUp, Receipt, Wallet, Coins, Stethoscope, X,
  Filter, Upload, Download, Trash2, Heart
} from 'lucide-react';

const TABS = [
  { key: 'register', label: "Ro'yxatdan o'tkazish", icon: <UserPlus size={18} /> },
  { key: 'queue', label: 'Navbat', icon: <ListOrdered size={18} /> },
  { key: 'rooms', label: 'Xona Tanlash', icon: <BedDouble size={18} /> },
  { key: 'payment', label: "To'lov", icon: <CreditCard size={18} /> },
  { key: 'treatments', label: 'Licheniya', icon: <Calendar size={18} /> },
  { key: 'expenses', label: 'Kirim-Chiqim', icon: <Receipt size={18} /> },
  { key: 'patients', label: 'Mijozlar Tarixi', icon: <Clock size={18} /> },
  { key: 'calls', label: "Qo'ng'iroqlar", icon: <PhoneCall size={18} /> },
  { key: 'report', label: 'Hisobot', icon: <BarChart3 size={18} /> },
  { key: 'settings', label: 'Sozlamalar', icon: <Settings size={18} /> },
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
        {activeTab === 'treatments' && <TreatmentPlanning />}
        {activeTab === 'expenses' && <ExpenseSection />}
        {activeTab === 'patients' && (
          <div>
            <Header title="Mijozlar Tarixi" role="reception" />
            <PatientHistorySection />
          </div>
        )}
        {activeTab === 'calls' && <CallLogSection />}
        {activeTab === 'report' && <ReceptionReport />}
        {activeTab === 'settings' && (
          <div>
            <Header title="Sozlamalar" role="reception" />
            <ProfileSettings />
          </div>
        )}
      </div>
    </div>
  );
}

// ===== THERMAL TICKET PRINTING (80mm) =====
export function printThermalTicket(patient, doctor, payment) {
  const printWindow = window.open('', '_blank', 'width=350,height=600');
  if (!printWindow) {
    alert("Iltimos, qalqib chiquvchi oynalar (popup) bloklanishini taqiqlab qayta urining.");
    return;
  }
  
  const today = new Date();
  const dateStr = today.toLocaleDateString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeStr = today.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  
  let paymentHtml = '';
  if (payment) {
    const srvRows = (payment.services || []).map(srv => `
      <div class="details-row">
        <span style="max-width: 155px; text-align: left; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">${srv}</span>
        <span>${formatMoney(payment.paid / (payment.services.length || 1))} so'm</span>
      </div>
    `).join('');

    paymentHtml = `
      <div class="divider"></div>
      <div style="font-weight: bold; font-size: 11px; margin-bottom: 5px; text-transform: uppercase;">To'lov Kvitansiyasi</div>
      <div class="details">
        ${srvRows}
        <div class="divider" style="border-top: 1px dotted #000; margin: 4px 0;"></div>
        <div class="details-row" style="font-weight: bold;">
          <span>Jami:</span>
          <span>${formatMoney(payment.totalAmount)} so'm</span>
        </div>
        ${payment.discount ? `
        <div class="details-row">
          <span>Chegirma:</span>
          <span>-${formatMoney(payment.discount)} so'm</span>
        </div>` : ''}
        <div class="details-row" style="font-weight: bold; font-size: 14px;">
          <span>To'landi (${payment.method}):</span>
          <span>${formatMoney(payment.paid)} so'm</span>
        </div>
      </div>
    `;
  }
  
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
            width: 68mm;
            margin: 0 auto;
            padding: 8px 2px;
            font-size: 12px;
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
        <div class="header">KLINIKA CRM</div>
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
        ${paymentHtml}
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
  const { addPatient, staff, patients, services, addPayment, addTreatment } = useCrm();
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
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Treatment integration states
  const [hasTreatment, setHasTreatment] = useState(false);
  const [treatmentForm, setTreatmentForm] = useState({
    serviceId: '',
    customName: '',
    startDate: new Date().toISOString().split('T')[0],
    time: '17:00',
    durationDays: 10,
    frequency: 'Kunda',
    price: '',
    smsOffsetMinutes: 30
  });

  const handleInlineServiceChange = (e) => {
    const val = e.target.value;
    const priceVal = val && val !== 'custom' ? (services.find(s => s.id === val)?.price || "") : "";
    setTreatmentForm(prev => ({ ...prev, serviceId: val, price: priceVal }));
  };

  // Payment states for pre-payment
  const [selectedServices, setSelectedServices] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Naqd');
  const [paidAmount, setPaidAmount] = useState('');

  const toggleService = (srvId) => {
    setSelectedServices(prev => prev.includes(srvId) ? prev.filter(id => id !== srvId) : [...prev, srvId]);
  };

  const totalAmount = selectedServices.reduce((s, srvId) => {
    const srv = services.find(sv => sv.id === srvId);
    return s + (srv?.price || 0);
  }, 0);
  const finalAmount = totalAmount - Number(discount);

  const filteredPatients = useMemo(() => {
    if (!searchQuery) return [];
    return patients.filter(p => {
      const fullName = `${p.firstName || ''} ${p.lastName || ''} ${p.middleName || ''}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase()) || 
             (p.phone && p.phone.includes(searchQuery)) || 
             (p.id && p.id.toLowerCase().includes(searchQuery.toLowerCase()));
    });
  }, [patients, searchQuery]);

  const doctors = staff.filter(s => s.role === 'doctor' && s.active);
  const nextQueueNumber = Math.max(...patients.map(p => p.queueNumber || 0), 0) + 1;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let treatmentName = "";
    if (hasTreatment) {
      if (treatmentForm.serviceId === 'custom') {
        treatmentName = treatmentForm.customName;
      } else {
        treatmentName = services.find(s => s.id === treatmentForm.serviceId)?.name || "";
      }
    }

    if (!form.firstName || !form.lastName || !form.phone || (!hasTreatment && !form.visitReason)) {
      toast("Majburiy maydonlarni to'ldiring (Ism, Familiya, Telefon, Kelish sababi)", 'error');
      return;
    }

    const normalizedPhone = normalizeUzPhone(form.phone);
    if (!normalizedPhone) {
      toast("Telefon raqami noto'g'ri kiritildi!", 'error');
      return;
    }

    let processedBirthDate = form.birthDate ? form.birthDate.trim() : '';
    if (processedBirthDate) {
      // If only a 4-digit year is provided, e.g. 1990
      if (/^\d{4}$/.test(processedBirthDate)) {
        processedBirthDate = `${processedBirthDate}-01-01`;
      } 
      // If DD.MM.YYYY, e.g. 15.05.1990
      else if (/^\d{2}\.\d{2}\.\d{4}$/.test(processedBirthDate)) {
        const parts = processedBirthDate.split('.');
        processedBirthDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      } 
      // If DD/MM/YYYY, e.g. 15/05/1990
      else if (/^\d{2}\/\d{2}\/\d{4}$/.test(processedBirthDate)) {
        const parts = processedBirthDate.split('/');
        processedBirthDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      // If YYYY.MM.DD or YYYY/MM/DD
      else if (/^\d{4}[\./]\d{2}[\./]\d{2}$/.test(processedBirthDate)) {
        processedBirthDate = processedBirthDate.replace(/[\./]/g, '-');
      }
    }

    const newPatient = addPatient({
      ...form,
      birthDate: processedBirthDate,
      phone: normalizedPhone,
      visitReason: hasTreatment ? `Muolaja: ${treatmentName}` : form.visitReason,
      status: 'navbatda',
      queueNumber: nextQueueNumber,
      queueTime: form.queueTime || new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      queueStatus: 'waiting',
      admissionDate: new Date().toISOString().split('T')[0],
      roomId: null,
      expectedDischarge: null,
      diet: null,
    });

    const paid = Number(paidAmount) || finalAmount;
    const srvNames = selectedServices.map(id => services.find(s => s.id === id)?.name || '');

    let newPayment = null;
    if (selectedServices.length > 0) {
      newPayment = addPayment({
        patientId: newPatient.id,
        services: srvNames,
        totalAmount,
        discount: Number(discount),
        paid,
        method: paymentMethod,
        status: paid >= finalAmount ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
      });
    }

    // Inline treatment planning
    if (hasTreatment) {
      let treatmentName = "";
      if (treatmentForm.serviceId === 'custom') {
        treatmentName = treatmentForm.customName;
      } else {
        treatmentName = services.find(s => s.id === treatmentForm.serviceId)?.name || "";
      }
      
      if (treatmentName && treatmentForm.price && Number(treatmentForm.price) > 0) {
        addTreatment({
          patientId: newPatient.id,
          patientName: `${newPatient.firstName} ${newPatient.lastName}`,
          patientPhone: newPatient.phone,
          treatmentName,
          startDate: treatmentForm.startDate,
          time: treatmentForm.time,
          durationDays: Number(treatmentForm.durationDays),
          frequency: treatmentForm.frequency,
          price: Number(treatmentForm.price),
          smsOffsetMinutes: Number(treatmentForm.smsOffsetMinutes),
        }, newPatient);
      }
    }

    toast(`${form.firstName} ${form.lastName} ro'yxatdan o'tkazildi. ID: ${newPatient.id}`, 'success');
    setRegisteredPatient({ ...newPatient, payment: newPayment });
    
    // Clear states
    setForm(emptyForm);
    setSelectedServices([]);
    setDiscount(0);
    setPaymentMethod('Naqd');
    setPaidAmount('');
    setHasTreatment(false);
    setTreatmentForm({
      serviceId: '',
      customName: '',
      startDate: new Date().toISOString().split('T')[0],
      time: '17:00',
      durationDays: 10,
      frequency: 'Kunda',
      price: '',
      smsOffsetMinutes: 30
    });
  };

  return (
    <div>
      <Header title="Bemor Ro'yxatdan O'tkazish" subtitle={`Navbat: #${nextQueueNumber}`} role="reception" />

      <div className="flex justify-end mb-4">
        <button 
          type="button" 
          className="btn btn-outline flex items-center gap-2"
          onClick={() => setShowSearchModal(true)}
        >
          <Search size={16} /> Eski bemorlardan qidirish (Qayta qabul)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="animate-fadeIn">
        {/* Inline Treatment Plan Card */}
        <div className="card p-6 border-t-4 border-t-purple-600 shadow-md mb-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3">
            <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="text-purple-600" size={20} />
              <span>Muolaja yozish (Davolanish rejalash)</span>
            </h4>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={hasTreatment} 
                onChange={e => setHasTreatment(e.target.checked)} 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
              <span className="ml-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Faollashtirish</span>
            </label>
          </div>

          {hasTreatment && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 animate-fadeIn">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Muolaja turi *</label>
                <select 
                  className="input select py-2" 
                  value={treatmentForm.serviceId} 
                  onChange={handleInlineServiceChange} 
                  required
                >
                  <option value="">Tanlang...</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
                  <option value="custom">-- Boshqa (Qo&apos;lda yozish) --</option>
                </select>
              </div>

              {treatmentForm.serviceId === 'custom' && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Muolaja nomi (Qo&apos;lda) *</label>
                  <input 
                    className="input py-2" 
                    value={treatmentForm.customName} 
                    onChange={e => setTreatmentForm({ ...treatmentForm, customName: e.target.value })} 
                    placeholder="Masalan: Fizioterapiya" 
                    required 
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Boshlanish sanasi</label>
                <input 
                  className="input py-2 text-xs" 
                  type="date" 
                  value={treatmentForm.startDate} 
                  onChange={e => setTreatmentForm({ ...treatmentForm, startDate: e.target.value })} 
                  required 
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Kunlik vaqti *</label>
                <input 
                  className="input py-2 text-xs" 
                  type="time" 
                  value={treatmentForm.time} 
                  onChange={e => setTreatmentForm({ ...treatmentForm, time: e.target.value })} 
                  required 
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Davomiyligi (seans)</label>
                <input 
                  className="input py-2" 
                  type="number" 
                  min={1} 
                  max={90} 
                  value={treatmentForm.durationDays} 
                  onChange={e => setTreatmentForm({ ...treatmentForm, durationDays: Number(e.target.value) })} 
                  required 
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Davriylik *</label>
                <select 
                  className="input select py-2" 
                  value={treatmentForm.frequency} 
                  onChange={e => setTreatmentForm({ ...treatmentForm, frequency: e.target.value })} 
                  required
                >
                  <option value="Kunda">Har kuni (Kunda)</option>
                  <option value="Kun ora">Kun ora</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Narxi (so&apos;m) *</label>
                <input 
                  className="input py-2 font-mono font-semibold" 
                  type="number" 
                  value={treatmentForm.price} 
                  onChange={e => setTreatmentForm({ ...treatmentForm, price: e.target.value })} 
                  required 
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Eslatma SMSi (daqiqa oldin)</label>
                <input 
                  className="input py-2" 
                  type="number" 
                  min={5} 
                  max={360} 
                  value={treatmentForm.smsOffsetMinutes} 
                  onChange={e => setTreatmentForm({ ...treatmentForm, smsOffsetMinutes: Number(e.target.value) })} 
                  required 
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Patient Personal & Contact info */}
          <div className="space-y-6">
            {/* Personal Info Card */}
            <div className="card p-6 border-t-4 border-t-blue-500 shadow-md">
              <h4 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-3">
                <User className="text-blue-500" size={20} />
                <span>Shaxsiy ma&apos;lumotlar</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Ism *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <User size={16} />
                    </span>
                    <input 
                      className="input pl-9" 
                      value={form.firstName} 
                      placeholder="Aziz"
                      onChange={e => setForm({ ...form, firstName: e.target.value })} 
                      required 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Familiya *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <User size={16} />
                    </span>
                    <input 
                      className="input pl-9" 
                      value={form.lastName} 
                      placeholder="Sobirov"
                      onChange={e => setForm({ ...form, lastName: e.target.value })} 
                      required 
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Otasining ismi</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <User size={16} />
                    </span>
                    <input 
                      className="input pl-9" 
                      value={form.middleName} 
                      placeholder="Masalan: Kamoliddin o'g'li"
                      onChange={e => setForm({ ...form, middleName: e.target.value })} 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Tug&apos;ilgan sana</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Calendar size={16} />
                    </span>
                    <input 
                      className="input pl-9 text-sm" 
                      type="text" 
                      value={form.birthDate} 
                      placeholder="YYYY-MM-DD yoki faqat Yil (Masalan: 1995)"
                      onChange={e => setForm({ ...form, birthDate: e.target.value })} 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Jinsi</label>
                  <div className="flex gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl w-full">
                    {['Erkak', 'Ayol'].map(g => (
                      <button
                        key={g}
                        type="button"
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                          form.gender === g 
                            ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm border border-black/5' 
                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                        }`}
                        onClick={() => setForm({ ...form, gender: g })}
                      >
                        {g === 'Erkak' ? '👨 Erkak' : '👩 Ayol'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Millati</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <User size={16} />
                    </span>
                    <input 
                      className="input pl-9" 
                      value={form.nationality} 
                      placeholder="O'zbek"
                      onChange={e => setForm({ ...form, nationality: e.target.value })} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info Card */}
            <div className="card p-6 border-t-4 border-t-green-500 shadow-md">
              <h4 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-3">
                <Phone className="text-green-500" size={20} />
                <span>Aloqa ma&apos;lumotlari</span>
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Telefon (asosiy) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Phone size={16} />
                      </span>
                      <input 
                        className="input pl-9" 
                        value={form.phone} 
                        onChange={e => setForm({ ...form, phone: e.target.value })} 
                        placeholder="+998 90 123 45 67" 
                        required 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Qo&apos;shimcha telefon</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Phone size={16} />
                      </span>
                      <input 
                        className="input pl-9" 
                        value={form.phone2} 
                        onChange={e => setForm({ ...form, phone2: e.target.value })} 
                        placeholder="+998 71 200 00 00"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Manzil (Viloyat, Tuman/Shahar, Ko&apos;cha/Uy)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><MapPin size={14} /></span>
                      <input className="input pl-8 text-xs" placeholder="Viloyat" value={form.address.region} onChange={e => setForm({ ...form, address: { ...form.address, region: e.target.value } })} />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><MapPin size={14} /></span>
                      <input className="input pl-8 text-xs" placeholder="Tuman/Shahar" value={form.address.district} onChange={e => setForm({ ...form, address: { ...form.address, district: e.target.value } })} />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><MapPin size={14} /></span>
                      <input className="input pl-8 text-xs" placeholder="Ko'cha / Uy" value={form.address.street} onChange={e => setForm({ ...form, address: { ...form.address, street: e.target.value } })} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Medical, Visit, and Payment info */}
          <div className="space-y-6">
            {/* Medical Info Card */}
            <div className="card p-6 border-t-4 border-t-red-500 shadow-md">
              <h4 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-3">
                <AlertCircle className="text-red-500" size={20} />
                <span>Tibbiy ma&apos;lumotlar</span>
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Qon guruhi</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {BLOOD_GROUPS.map(bg => (
                      <button
                        key={bg}
                        type="button"
                        className={`py-1.5 text-xs font-bold rounded-lg border-2 transition-all ${
                          form.bloodGroup === bg
                            ? 'bg-red-500 text-white border-red-500 shadow-sm'
                            : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                        }`}
                        onClick={() => setForm({ ...form, bloodGroup: bg })}
                      >
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Allergiyalar</label>
                  <div className="flex gap-2 mb-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <AlertCircle size={14} />
                      </span>
                      <input 
                        className="input pl-8 text-xs" 
                        placeholder="Masalan: Penisilin, asal (Enter bosing)..." 
                        value={allergyInput} 
                        onChange={e => setAllergyInput(e.target.value)} 
                        onKeyDown={e => { 
                          if (e.key === 'Enter') { 
                            e.preventDefault(); 
                            if (allergyInput.trim()) { 
                              setForm({ ...form, allergies: [...form.allergies, allergyInput.trim()] }); 
                              setAllergyInput(''); 
                            } 
                          } 
                        }} 
                      />
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-outline btn-sm font-bold w-10 shrink-0" 
                      onClick={() => { 
                        if (allergyInput.trim()) { 
                          setForm({ ...form, allergies: [...form.allergies, allergyInput.trim()] }); 
                          setAllergyInput(''); 
                        } 
                      }}
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {form.allergies.length === 0 ? (
                      <span className="text-xs text-gray-400 italic">Mavjud emas</span>
                    ) : (
                      form.allergies.map((a, i) => (
                        <span 
                          key={i} 
                          className="badge badge-danger cursor-pointer hover:bg-red-200 transition-colors" 
                          onClick={() => setForm({ ...form, allergies: form.allergies.filter((_, idx) => idx !== i) })}
                        >
                          {a} <span className="font-bold ml-1">✕</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Surunkali kasalliklar</label>
                  <div className="flex gap-2 mb-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <AlertCircle size={14} />
                      </span>
                      <input 
                        className="input pl-8 text-xs" 
                        placeholder="Masalan: Diabet, gipertoniya (Enter bosing)..." 
                        value={diseaseInput} 
                        onChange={e => setDiseaseInput(e.target.value)} 
                        onKeyDown={e => { 
                          if (e.key === 'Enter') { 
                            e.preventDefault(); 
                            if (diseaseInput.trim()) { 
                              setForm({ ...form, chronicDiseases: [...form.chronicDiseases, diseaseInput.trim()] }); 
                              setDiseaseInput(''); 
                            } 
                          } 
                        }} 
                      />
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-outline btn-sm font-bold w-10 shrink-0" 
                      onClick={() => { 
                        if (diseaseInput.trim()) { 
                          setForm({ ...form, chronicDiseases: [...form.chronicDiseases, diseaseInput.trim()] }); 
                          setDiseaseInput(''); 
                        } 
                      }}
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {form.chronicDiseases.length === 0 ? (
                      <span className="text-xs text-gray-400 italic">Mavjud emas</span>
                    ) : (
                      form.chronicDiseases.map((d, i) => (
                        <span 
                          key={i} 
                          className="badge badge-warning cursor-pointer hover:bg-yellow-200 transition-colors" 
                          onClick={() => setForm({ ...form, chronicDiseases: form.chronicDiseases.filter((_, idx) => idx !== i) })}
                        >
                          {d} <span className="font-bold ml-1">✕</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Visit & Insurance Info Card */}
            {!hasTreatment && (
              <div className="card p-6 border-t-4 border-t-yellow-500 shadow-md">
                <h4 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-3">
                  <Calendar className="text-yellow-500" size={20} />
                  <span>Tashrif ma&apos;lumotlari</span>
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Kelish sababi *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <FileText size={16} />
                      </span>
                      <input 
                        className="input pl-9" 
                        value={form.visitReason} 
                        placeholder="Masalan: Bosh og'rig'i, ko'rik va h.k."
                        onChange={e => setForm({ ...form, visitReason: e.target.value })} 
                        required 
                      />
                    </div>
                  </div>
                  <div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Kelish turi</label>
                      <div className="flex gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl w-full">
                        {['Birinchi marta', 'Qayta', 'Tez yordam'].map(t => (
                          <button
                            key={t}
                            type="button"
                            className={`flex-1 py-2 text-[10px] sm:text-xs font-semibold rounded-lg transition-all ${
                              form.visitType === t || (t === 'Qayta' && form.visitType === 'Qayta qabul')
                                ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm border border-black/5' 
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                            }`}
                            onClick={() => setForm({ ...form, visitType: t })}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Shifokor</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <User size={16} />
                      </span>
                      <select 
                        className="input select pl-9" 
                        value={form.assignedDoctor} 
                        onChange={e => setForm({ ...form, assignedDoctor: e.target.value })}
                      >
                        <option value="">Shifokor tanlang</option>
                        {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} ({d.specialization})</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                    <h5 className="text-xs font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
                      <Shield size={16} className="text-blue-500" />
                      <span>Sug&apos;urta (ixtiyoriy)</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <Shield size={14} />
                        </span>
                        <input 
                          className="input pl-8 text-xs" 
                          placeholder="Kompaniya nomi" 
                          value={form.insurance.company} 
                          onChange={e => setForm({ ...form, insurance: { ...form.insurance, company: e.target.value } })} 
                        />
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <FileText size={14} />
                        </span>
                        <input 
                          className="input pl-8 text-xs" 
                          placeholder="Polis raqami" 
                          value={form.insurance.policyNumber} 
                          onChange={e => setForm({ ...form, insurance: { ...form.insurance, policyNumber: e.target.value } })} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Section Card */}
            <div className="card p-6 border-t-4 border-t-purple-500 shadow-md">
              <h4 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-3">
                <CreditCard className="text-purple-500" size={20} />
                <span>To&apos;lov (Oldindan to&apos;lov)</span>
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Xizmatlarni tanlang</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-gray-100 dark:border-white/5 rounded-xl p-3 bg-gray-50/50 dark:bg-white/5">
                    {services.map(srv => {
                      const isSelected = selectedServices.includes(srv.id);
                      return (
                        <div
                          key={srv.id}
                          onClick={() => toggleService(srv.id)}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-blue-500/10 border-blue-500 shadow-sm dark:bg-blue-500/20'
                              : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-1.5">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                            }`}>
                              {srv.category}
                            </span>
                            <input 
                              type="checkbox" 
                              checked={isSelected} 
                              readOnly
                              className="w-4 h-4 rounded text-blue-500 border-gray-300 focus:ring-blue-500 pointer-events-none" 
                            />
                          </div>
                          <p className="font-semibold text-xs text-gray-900 dark:text-white truncate mb-2">{srv.name}</p>
                          <p className="font-bold text-xs text-blue-600 dark:text-blue-400 text-right">{formatMoney(srv.price)} so&apos;m</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-white/5 dark:to-white/10 p-4 rounded-2xl border border-gray-100 dark:border-white/5 text-sm space-y-3 font-mono">
                  <div className="flex justify-between text-gray-500 dark:text-gray-400 text-xs">
                    <span>Jami summa:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{formatMoney(totalAmount)} so&apos;m</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Chegirma:</span>
                    <div className="relative w-32">
                      <input 
                        className="input py-1 px-2 text-right text-xs font-bold font-mono" 
                        type="number" 
                        value={discount} 
                        onChange={e => setDiscount(e.target.value)} 
                        placeholder="0" 
                      />
                      <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 font-bold">so&apos;m</span>
                    </div>
                  </div>
                  <div className="border-t border-dashed border-gray-300 dark:border-white/10 my-2"></div>
                  <div className="flex justify-between text-sm font-bold text-green-600 dark:text-green-400">
                    <span>Yakuniy to&apos;lov:</span>
                    <span>{formatMoney(finalAmount)} so&apos;m</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">To&apos;lov usuli</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><CreditCard size={14} /></span>
                      <select 
                        className="input select pl-8 py-2 text-xs font-semibold" 
                        value={paymentMethod} 
                        onChange={e => setPaymentMethod(e.target.value)}
                      >
                        <option>Naqd</option>
                        <option>Karta</option>
                        <option>Sug&apos;urta</option>
                        <option>Muddatli to&apos;lov</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">To&apos;langan summa</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><CreditCard size={14} /></span>
                      <input 
                        className="input pl-8 py-2 text-xs font-bold text-green-600" 
                        type="number" 
                        value={paidAmount} 
                        onChange={e => setPaidAmount(e.target.value)} 
                        placeholder={finalAmount.toString()} 
                      />
                    </div>
                  </div>
                </div>
              </div>
                  </div>
        </div>      </div>

        <div className="flex justify-end gap-3 mt-6 border-t border-gray-100 dark:border-white/5 pt-4">
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={() => { setForm(emptyForm); setSelectedServices([]); setDiscount(0); setPaymentMethod('Naqd'); setPaidAmount(''); }}
          >
            Tozalash
          </button>
          <button type="submit" className="btn btn-success btn-lg shadow-lg">
            <CheckCircle size={18} /> Ro&apos;yxatdan o&apos;tkazish va To&apos;lov
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
              <h3 className="font-bold text-lg tracking-wider uppercase mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>KLINIKA CRM</h3>
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
                  <span>{"Bo'lim:"}</span>
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

              {registeredPatient.payment && (
                <>
                  <div className="border-t border-dashed border-gray-400 my-3"></div>
                  <div className="text-left text-xs space-y-1 text-gray-800">
                    <div className="text-center font-bold text-[10px] uppercase mb-1">To&apos;lov Kvitansiyasi</div>
                    {(registeredPatient.payment.services || []).map((srv, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="truncate max-w-[150px]">{srv}</span>
                        <span>{formatMoney(services.find(s => s.name === srv)?.price || 0)} so&apos;m</span>
                      </div>
                    ))}
                    <div className="border-t border-dotted border-gray-400 my-1"></div>
                    <div className="flex justify-between font-bold">
                      <span>Jami:</span>
                      <span>{formatMoney(registeredPatient.payment.totalAmount)} so&apos;m</span>
                    </div>
                    {registeredPatient.payment.discount > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Chegirma:</span>
                        <span>-{formatMoney(registeredPatient.payment.discount)} so&apos;m</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm">
                      <span>To&apos;landi ({registeredPatient.payment.method}):</span>
                      <span>{formatMoney(registeredPatient.payment.paid)} so&apos;m</span>
                    </div>
                  </div>
                </>
              )}
              
              <div className="border-t border-dashed border-gray-400 my-3"></div>
              <p className="text-[10px] italic leading-tight text-gray-600 mt-2">
                {"Sog'ligingiz — bizning baxtimiz!"}<br />
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
                  printThermalTicket(registeredPatient, doc, registeredPatient.payment);
                }}
              >
                <Printer size={16} /> Chop etish
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Eski Bemor Qidirish Modal */}
      <Modal 
        isOpen={showSearchModal} 
        onClose={() => { setShowSearchModal(false); setSearchQuery(''); }} 
        title="Eski bemorlardan qidirish"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              className="input pl-9" 
              placeholder="Ism, familiya, ID yoki telefon raqami..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {filteredPatients.length === 0 ? (
              <p className="text-center py-6 text-gray-400 text-sm italic">
                {searchQuery ? "Bemor topilmadi" : "Qidirish uchun ism yoki telefon kiriting"}
              </p>
            ) : (
              filteredPatients.map(p => (
                <button
                  key={p.id}
                  type="button"
                  className="w-full text-left p-3 rounded-xl border border-gray-100 hover:bg-gray-50 flex items-center justify-between dark:border-white/5 dark:hover:bg-white/5"
                  onClick={() => {
                    setForm({
                      ...emptyForm,
                      firstName: p.firstName || '',
                      lastName: p.lastName || '',
                      middleName: p.middleName || '',
                      birthDate: p.birthDate || '',
                      gender: p.gender || 'Erkak',
                      nationality: p.nationality || "O'zbek",
                      phone: p.phone || '',
                      phone2: p.phone2 || '',
                      email: p.email || '',
                      address: p.address || { region: 'Toshkent', district: '', street: '' },
                      bloodGroup: p.bloodGroup || '',
                      allergies: p.allergies || [],
                      chronicDiseases: p.chronicDiseases || [],
                      visitReason: '',
                      visitType: 'Qayta qabul',
                      assignedDoctor: p.assignedDoctor || '',
                      insurance: p.insurance || { company: '', policyNumber: '', validUntil: '' }
                    });
                    toast(`${p.firstName} ${p.lastName} ma&apos;lumotlari yuklandi`, 'success');
                    setShowSearchModal(false);
                    setSearchQuery('');
                  }}
                >
                  <div>
                    <h5 className="font-semibold text-sm text-gray-900">{p.firstName} {p.lastName}</h5>
                    <p className="text-xs text-gray-500">Tug&apos;ilgan sana: {p.birthDate} | Telefon: {p.phone}</p>
                  </div>
                  <span className="text-xs text-blue-500 font-medium">Tanlash →</span>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ===== QUEUE MANAGEMENT =====
function QueueManagement() {
  const { patients, updatePatient, staff, payments } = useCrm();
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
                        const payment = payments?.find(pay => pay.patientId === p.id);
                        printThermalTicket(p, doctor, payment);
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
  const { 
    rooms, updateRoom, patients, updatePatient, addPatientHistoryEvent, 
    dischargePatient, addPayment, addExpense, staff, services, addPatient,
    payments, expenses, user 
  } = useCrm();
  const toast = useToast();
  const [detailRoom, setDetailRoom] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [dischargeModal, setDischargeModal] = useState(null); // { patient, room }
  const [dischargePayMethod, setDischargePayMethod] = useState('Naqd');
  const [dischargeDiscount, setDischargeDiscount] = useState(0);
  const [dischargePaid, setDischargePaid] = useState('');

  // Qidiruv va bemor tanlash state
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [patientSelectQuery, setPatientSelectQuery] = useState('');

  // Yangi bemor qo'shish state
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    phone: '',
    phone2: '',
    address: { region: 'Toshkent', district: '', street: '' },
    bloodGroup: '',
    allergies: '',
    chronicDiseases: ''
  });

  // Xarajat yozish state
  const [expensePatient, setExpensePatient] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    description: '',
    category: 'Dori-darmon',
    paymentMethod: 'Naqd'
  });

  // Xizmatga yuborish state
  const [servicePatient, setServicePatient] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    serviceId: '',
    doctorId: '',
    price: '',
    discount: 0,
    paidAmount: '',
    paymentMethod: 'Naqd'
  });

  // Calculate days stayed: count midnight boundaries crossed since admission
  const calcDaysStayed = (patient) => {
    if (!patient.roomId || !patient.admissionDate) return 0;
    const admissionDateTime = patient.admissionDateTime 
      ? new Date(patient.admissionDateTime)
      : new Date(patient.admissionDate + 'T00:00:00');
    const now = new Date();
    const admissionMidnight = new Date(admissionDateTime);
    admissionMidnight.setHours(0, 0, 0, 0);
    const nowMidnight = new Date(now);
    nowMidnight.setHours(0, 0, 0, 0);
    const diffMs = nowMidnight.getTime() - admissionMidnight.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  };

  const availablePatients = patients.filter(p => !p.roomId && (p.status === 'navbatda' || p.status === 'ambulatoriya'));

  // Filter available patients for selection query
  const filteredAvailablePatients = useMemo(() => {
    if (!patientSelectQuery.trim()) return availablePatients;
    const q = patientSelectQuery.toLowerCase();
    return availablePatients.filter(p => 
      (p.firstName || '').toLowerCase().includes(q) ||
      (p.lastName || '').toLowerCase().includes(q) ||
      (p.phone || '').includes(q)
    );
  }, [availablePatients, patientSelectQuery]);

  // Filter stasionar patients by name/lastname/phone
  const foundStasionarPatients = useMemo(() => {
    if (!roomSearchQuery.trim()) return [];
    const q = roomSearchQuery.toLowerCase();
    return patients.filter(p => 
      p.status === 'stasionar' && 
      p.roomId && 
      ((p.firstName || '').toLowerCase().includes(q) || 
       (p.lastName || '').toLowerCase().includes(q) || 
       (p.phone || '').includes(q))
    );
  }, [patients, roomSearchQuery]);

  // Compute patient stasionar financials
  const getPatientStasionarFinance = useCallback((patient, room, billDays) => {
    const roomCost = room.pricePerDay * billDays;
    
    // Expenses (chiqimlar) yozilgan dori/darmonlar summasi
    const patientExpenses = (expenses || [])
      .filter(e => e.patientId === patient.id)
      .reduce((s, e) => s + (e.amount || 0), 0);
      
    // Barcha to'lovlar
    const patientPayments = (payments || []).filter(p => p.patientId === patient.id);
    
    // Bemorga yozilgan xizmatlar summasi (xona ijarasidan tashqari)
    const servicesTotal = patientPayments
      .filter(p => !p.services?.[0]?.includes('Xona ijarasi') && !p.services?.[0]?.includes('Stasionar yakuniy'))
      .reduce((s, p) => s + (p.totalAmount || 0), 0);
      
    // Ular uchun to'langan pullar
    const servicesPaid = patientPayments
      .filter(p => !p.services?.[0]?.includes('Xona ijarasi') && !p.services?.[0]?.includes('Stasionar yakuniy'))
      .reduce((s, p) => s + (p.paid || 0), 0);
      
    const totalCalculated = roomCost + patientExpenses + servicesTotal;
    const totalPaidBefore = servicesPaid;
    const dueAmount = Math.max(0, totalCalculated - totalPaidBefore);

    return {
      roomCost,
      patientExpenses,
      servicesTotal,
      servicesPaid,
      totalCalculated,
      totalPaidBefore,
      dueAmount
    };
  }, [expenses, payments]);

  const handleAssign = () => {
    if (!detailRoom || !selectedPatient) { toast('Xona va bemor tanlang', 'error'); return; }
    
    const roomPatientsCount = patients.filter(p => p.roomId === detailRoom.id && p.status === 'stasionar').length;
    if (roomPatientsCount >= detailRoom.capacity) {
      toast("Xonada bo'sh joy qolmadi!", 'error');
      return;
    }

    const assignerName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Resepshion' : 'Resepshion';
    updatePatient(selectedPatient, { 
      roomId: detailRoom.id, 
      status: 'stasionar',
      admissionDateTime: new Date().toISOString(),
      roomAssignedBy: assignerName,
      roomAssignedAt: new Date().toISOString()
    });
    addPatientHistoryEvent(selectedPatient, {
      type: 'room',
      title: 'Palataga yotqizildi',
      details: `#${detailRoom.number}-palataga joylashtirildi`
    });
    
    const isFull = (roomPatientsCount + 1) >= detailRoom.capacity;
    updateRoom(detailRoom.id, { status: isFull ? 'busy' : 'free' });
    
    toast('Bemor xonaga joylashtirildi', 'success');
    setDetailRoom(null);
    setSelectedPatient('');
    setPatientSelectQuery('');
  };

  const handleCreateAndAssignPatient = () => {
    if (!newPatientForm.firstName || !newPatientForm.lastName || !newPatientForm.phone) {
      toast("Majburiy maydonlarni to'ldiring (Ism, Familiya, Telefon)", 'error');
      return;
    }

    const normalizedPhone = normalizeUzPhone(newPatientForm.phone);
    if (!normalizedPhone) {
      toast("Telefon raqami noto'g'ri kiritildi!", 'error');
      return;
    }

    const roomPatientsCount = patients.filter(p => p.roomId === detailRoom.id && p.status === 'stasionar').length;
    if (roomPatientsCount >= detailRoom.capacity) {
      toast("Xonada bo'sh joy qolmadi!", 'error');
      return;
    }

    const assignerName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Resepshion' : 'Resepshion';
    const newPatient = addPatient({
      firstName: newPatientForm.firstName,
      lastName: newPatientForm.lastName,
      middleName: newPatientForm.middleName,
      phone: normalizedPhone,
      phone2: newPatientForm.phone2,
      birthDate: '',
      gender: 'Erkak',
      nationality: "O'zbek",
      email: '',
      address: newPatientForm.address,
      bloodGroup: newPatientForm.bloodGroup,
      allergies: newPatientForm.allergies ? newPatientForm.allergies.split(',').map(a => a.trim()).filter(Boolean) : [],
      chronicDiseases: newPatientForm.chronicDiseases ? newPatientForm.chronicDiseases.split(',').map(c => c.trim()).filter(Boolean) : [],
      visitReason: 'Stasionar joylashtirish',
      status: 'stasionar',
      roomId: detailRoom.id,
      admissionDateTime: new Date().toISOString(),
      admissionDate: new Date().toISOString().split('T')[0],
      queueTime: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      queueStatus: 'completed',
      roomAssignedBy: assignerName,
      roomAssignedAt: new Date().toISOString()
    });

    addPatientHistoryEvent(newPatient.id, {
      type: 'room',
      title: 'Palataga yotqizildi',
      details: `#${detailRoom.number}-palataga yangi ro'yxatdan o'tib joylashtirildi`
    });

    const isFull = (roomPatientsCount + 1) >= detailRoom.capacity;
    updateRoom(detailRoom.id, { status: isFull ? 'busy' : 'free' });

    toast(`${newPatientForm.firstName} ${newPatientForm.lastName} ro'yxatdan o'tkazildi va joylashtirildi`, 'success');
    setShowAddPatientModal(false);
    setDetailRoom(null);
    setSelectedPatient('');
    setPatientSelectQuery('');
  };

  const openDischargeModal = (patient, room) => {
    setDischargeModal({ patient, room });
    setDischargePayMethod('Naqd');
    setDischargeDiscount(0);
    setDischargePaid('');
  };

  const handleDischarge = () => {
    if (!dischargeModal) return;
    const { patient, room } = dischargeModal;
    const days = calcDaysStayed(patient);
    const billDays = Math.max(1, days);
    
    // Fetch stasionar finances
    const fin = getPatientStasionarFinance(patient, room, billDays);
    
    const discountAmt = Number(dischargeDiscount) || 0;
    const finalCost = Math.max(0, fin.dueAmount - discountAmt);
    const paidAmt = dischargePaid !== '' ? Number(dischargePaid) : finalCost;

    // Save stasionar checkout payment to database
    if (finalCost > 0 || paidAmt > 0) {
      addPayment({
        patientId: patient.id,
        services: [`Stasionar yakuniy to'lovi (#${room.number}, ${billDays} kun)`],
        totalAmount: fin.dueAmount,
        discount: discountAmt,
        paid: paidAmt,
        method: dischargePayMethod,
        status: paidAmt >= finalCost ? 'paid' : paidAmt > 0 ? 'partial' : 'unpaid',
        note: `Xona: ${formatMoney(fin.roomCost)}, Rasxodlar: ${formatMoney(fin.patientExpenses)}, Xizmatlar: ${formatMoney(fin.servicesTotal)}`
      });
    }

    dischargePatient(patient.id, room.id);
    const remainingPats = patients.filter(p => p.roomId === room.id && p.status === 'stasionar' && p.id !== patient.id);
    updateRoom(room.id, { status: remainingPats.length > 0 ? (remainingPats.length >= room.capacity ? 'busy' : 'free') : 'free' });
    toast(`${patient.firstName} ${patient.lastName} chiqarildi. To'lov: ${formatMoney(paidAmt)} so'm bazaga saqlandi`, 'success');
    setDischargeModal(null);
  };

  const openExpenseModal = (patient) => {
    setExpensePatient(patient);
    setExpenseForm({
      amount: '',
      description: `Dori-darmon (${patient.firstName} ${patient.lastName} uchun)`,
      category: 'Dori-darmon',
      paymentMethod: 'Naqd'
    });
  };

  const handleExpenseSave = () => {
    if (!expenseForm.amount || !expenseForm.description) {
      toast("Summa va izohni kiriting", 'error');
      return;
    }

    addExpense({
      description: expenseForm.description,
      amount: Number(expenseForm.amount),
      category: expenseForm.category,
      paymentMethod: expenseForm.paymentMethod,
      patientId: expensePatient.id, // Save patient ID relation
      note: `Stasionar bemor: ${expensePatient.firstName} ${expensePatient.lastName} (ID: ${expensePatient.id})`
    });

    addPatientHistoryEvent(expensePatient.id, {
      type: 'expense',
      title: 'Bemor uchun xarajat kiritildi',
      details: `${expenseForm.description}: ${Number(expenseForm.amount).toLocaleString()} so'm. To'lov turi: ${expenseForm.paymentMethod}`
    });

    toast("Bemor xarajati muvaffaqiyatli saqlandi", 'success');
    setExpensePatient(null);
  };

  const openServiceModal = (patient) => {
    setServicePatient(patient);
    setServiceForm({
      serviceId: '',
      doctorId: '',
      price: '',
      discount: 0,
      paidAmount: '',
      paymentMethod: 'Naqd'
    });
  };

  const handleServiceChangeInModal = (serviceId) => {
    const srv = services.find(s => s.id === serviceId);
    setServiceForm(prev => ({
      ...prev,
      serviceId,
      price: srv ? srv.price : '',
      paidAmount: srv ? srv.price : ''
    }));
  };

  const handleServiceSave = () => {
    const { serviceId, doctorId, price, discount, paidAmount, paymentMethod } = serviceForm;
    if (!serviceId) {
      toast("Iltimos, xizmat tanlang", 'error');
      return;
    }

    const srv = services.find(s => s.id === serviceId);
    const serviceName = srv ? srv.name : '';
    const totalAmount = Number(price) || 0;
    const discountAmt = Number(discount) || 0;
    const finalAmount = Math.max(0, totalAmount - discountAmt);
    const paid = paidAmount !== '' ? Number(paidAmount) : finalAmount;

    // 1. Add payment record
    const createdPayment = addPayment({
      patientId: servicePatient.id,
      services: [serviceName],
      totalAmount,
      discount: discountAmt,
      paid,
      method: paymentMethod,
      status: paid >= finalAmount ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
      note: `Stasionar bemor xizmati: ${serviceName}`
    });

    // 2. Put in queue/assigned doctor
    const nextQueueNumber = Math.max(...patients.map(p => p.queueNumber || 0), 0) + 1;
    updatePatient(servicePatient.id, {
      assignedDoctor: doctorId || null,
      queueStatus: 'waiting',
      queueTime: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      queueNumber: nextQueueNumber,
      visitReason: serviceName,
      admissionDate: new Date().toISOString().split('T')[0]
    });

    // 3. History entry
    const doc = staff.find(s => s.id === doctorId);
    const doctorStr = doc ? `Dr. ${doc.lastName} (${doc.specialization})` : 'Yo\'naltirilmagan';
    addPatientHistoryEvent(servicePatient.id, {
      type: 'appointment',
      title: 'Xizmatga yo\'naltirildi (Stasionar)',
      details: `${serviceName} (${doctorStr}). Summa: ${totalAmount.toLocaleString()} so'm. To'lov: ${paid.toLocaleString()} so'm (${paymentMethod})`
    });

    // 4. Print Thermal Ticket for the service queue automatically
    const updatedPatientForTicket = {
      ...servicePatient,
      assignedDoctor: doctorId || null,
      queueStatus: 'waiting',
      queueTime: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      queueNumber: nextQueueNumber,
      visitReason: serviceName
    };
    printThermalTicket(updatedPatientForTicket, doc, createdPayment || {
      patientId: servicePatient.id,
      services: [serviceName],
      totalAmount,
      discount: discountAmt,
      paid,
      method: paymentMethod
    });

    toast(`Bemor xizmatga muvaffaqiyatli yo'naltirildi. To'lov qabul qilindi & Chek chop etildi`, 'success');
    setServicePatient(null);
  };

  return (
    <div>
      <Header title="Xona Tanlash va Joylashtirish" role="reception" />

      {/* Qidiruv paneli */}
      <div className="card p-4 mb-6">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            className="input pl-10 w-full"
            placeholder="Bemor ismi, familiyasi yoki telefon raqami bo'yicha qidirish..."
            value={roomSearchQuery}
            onChange={(e) => setRoomSearchQuery(e.target.value)}
          />
        </div>

        {roomSearchQuery.trim() && (
          <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-3">
            <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">Qidiruv natijalari</h5>
            {foundStasionarPatients.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Bemor topilmadi.</p>
            ) : (
              <div className="space-y-2">
                {foundStasionarPatients.map(p => {
                  const room = rooms.find(r => r.id === p.roomId);
                  const days = calcDaysStayed(p);
                  return (
                    <div key={p.id} className="flex justify-between items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          👤 {p.firstName} {p.lastName} {p.middleName ? ` ${p.middleName}` : ''}
                        </p>
                        <p className="text-xs text-gray-500">
                          ID: {p.id} • 📞 {p.phone}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="badge badge-info text-xs">
                          🚪 Xona #{room ? room.number : 'Noma\'lum'} ({room ? room.type : ''})
                        </span>
                        <p className="text-[10px] text-gray-400 mt-1">
                          Qavat: {room ? room.floor : ''} • {days === 0 ? 'Bugun yotdi' : `${days} kun yotdi`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {rooms.map(room => {
          const roomPatients = patients.filter(p => p.roomId === room.id && p.status === 'stasionar');
          const isFull = roomPatients.length >= room.capacity;
          const canSelect = (room.status === 'free' || room.status === 'busy') && !isFull;
          
          const displayStatus = (room.status === 'free' || room.status === 'busy') 
            ? (isFull ? 'busy' : 'free') 
            : room.status;
          const statusInfo = ROOM_STATUSES.find(s => s.key === displayStatus);

          return (
            <div
              key={room.id}
              tabIndex={canSelect ? 0 : -1}
              role="button"
              className={`floor-room room-${displayStatus} ${detailRoom?.id === room.id ? 'ring-2 ring-blue-500' : ''} cursor-pointer hover:scale-[1.02]`}
              onClick={() => setDetailRoom(room)}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-lg">#{room.number}</h4>
                <span className="text-xl">{statusInfo?.emoji}</span>
              </div>
              <p className="text-xs text-gray-600">{room.type} • Qavat {room.floor}</p>
              <p className="text-xs font-medium mt-1">{formatMoney(room.pricePerDay)} so'm/kun</p>
              <p className="text-xs text-gray-500 mt-1">Joylar: <span className="font-semibold text-gray-800">{roomPatients.length}/{room.capacity}</span></p>
              
              {roomPatients.length > 0 && (
                <div className="mt-2 pt-2 border-t border-black/5 space-y-2">
                  {roomPatients.map(p => {
                    const days = calcDaysStayed(p);
                    const billDays = Math.max(1, days);
                    const fin = getPatientStasionarFinance(p, room, billDays);
                    return (
                      <div key={p.id} className="flex flex-col gap-1.5 p-1.5 rounded bg-black/5 dark:bg-white/5">
                        <div className="flex items-center justify-between gap-1">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-gray-700 dark:text-gray-300 truncate font-semibold">👤 {p.firstName} {p.lastName}</p>
                            <p className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold">
                              🛏 {days === 0 ? 'Bugun yotdi' : `${days} kun yotdi`}
                            </p>
                            
                            {/* Finance breakdown on room list */}
                            <div className="text-[9px] text-gray-500 mt-1 space-y-0.5 border-t border-black/5 pt-1">
                              {fin.patientExpenses > 0 && (
                                <p className="text-red-650 font-medium">💰 Rasxod: {formatMoney(fin.patientExpenses)} so'm</p>
                              )}
                              {fin.servicesTotal > 0 && (
                                <p className="text-purple-650 font-medium">🩺 Xizmat: {formatMoney(fin.servicesTotal)} so'm (Qarz: {formatMoney(fin.servicesTotal - fin.servicesPaid)} so'm)</p>
                              )}
                              <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">Jami: {formatMoney(fin.dueAmount)} so'm</p>
                            </div>
                          </div>
                          
                          <button
                            className="btn btn-sm btn-danger shrink-0 py-0.5 px-1 text-[9px] flex items-center gap-0.5 self-start"
                            onClick={(e) => { e.stopPropagation(); openDischargeModal(p, room); }}
                            title="Xonadan chiqarish"
                          >
                            <DoorOpen size={9} /> Chiqar
                          </button>
                        </div>
                        
                        <div className="flex gap-1 justify-end border-t border-black/5 pt-1.5">
                          <button
                            className="btn btn-sm btn-outline text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white shrink-0 py-0.5 px-1 text-[9px] flex items-center gap-0.5"
                            onClick={(e) => { e.stopPropagation(); openExpenseModal(p); }}
                            title="Xarajat yozish"
                          >
                            <Coins size={9} /> Xarajat
                          </button>
                          <button
                            className="btn btn-sm btn-info text-white shrink-0 py-0.5 px-1 text-[9px] flex items-center gap-0.5"
                            onClick={(e) => { e.stopPropagation(); openServiceModal(p); }}
                            title="Xizmatga yuborish"
                          >
                            <Stethoscope size={9} /> Xizmat
                          </button>
                        </div>
                      </div>
                    );
                  })}
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



      {/* Yangi bemor qo'shish modal */}
      {showAddPatientModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <UserPlus size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Yangi bemor qo'shish va xonaga joylashtirish</h3>
                <p className="text-xs text-gray-500">#{detailRoom?.number}-xona • {detailRoom?.type}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Ism *</label>
                <input 
                  type="text" 
                  className="input" 
                  value={newPatientForm.firstName} 
                  onChange={e => setNewPatientForm({...newPatientForm, firstName: e.target.value})} 
                  placeholder="Ismi" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Familiya *</label>
                <input 
                  type="text" 
                  className="input" 
                  value={newPatientForm.lastName} 
                  onChange={e => setNewPatientForm({...newPatientForm, lastName: e.target.value})} 
                  placeholder="Familiyasi" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Otasining ismi</label>
                <input 
                  type="text" 
                  className="input" 
                  value={newPatientForm.middleName} 
                  onChange={e => setNewPatientForm({...newPatientForm, middleName: e.target.value})} 
                  placeholder="Otasining ismi" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Telefon raqami *</label>
                <input 
                  type="text" 
                  className="input" 
                  value={newPatientForm.phone} 
                  onChange={e => setNewPatientForm({...newPatientForm, phone: e.target.value})} 
                  placeholder="+998 (90) 123-45-67" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Qo'shimcha telefon</label>
                <input 
                  type="text" 
                  className="input" 
                  value={newPatientForm.phone2} 
                  onChange={e => setNewPatientForm({...newPatientForm, phone2: e.target.value})} 
                  placeholder="Qo'shimcha telefon raqam" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Qon guruhi</label>
                <select 
                  className="input select" 
                  value={newPatientForm.bloodGroup} 
                  onChange={e => setNewPatientForm({...newPatientForm, bloodGroup: e.target.value})}
                >
                  <option value="">Tanlang...</option>
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
            </div>

            {/* Manzil */}
            <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-3 mb-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Yashash manzili</span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-0.5">Viloyat</label>
                  <input 
                    type="text" 
                    className="input py-1 px-2 text-sm" 
                    value={newPatientForm.address.region} 
                    onChange={e => setNewPatientForm({...newPatientForm, address: {...newPatientForm.address, region: e.target.value}})} 
                    placeholder="Viloyat" 
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-0.5">Tuman/Shahar</label>
                  <input 
                    type="text" 
                    className="input py-1 px-2 text-sm" 
                    value={newPatientForm.address.district} 
                    onChange={e => setNewPatientForm({...newPatientForm, address: {...newPatientForm.address, district: e.target.value}})} 
                    placeholder="Tuman" 
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-0.5">Ko'cha/Uy</label>
                  <input 
                    type="text" 
                    className="input py-1 px-2 text-sm" 
                    value={newPatientForm.address.street} 
                    onChange={e => setNewPatientForm({...newPatientForm, address: {...newPatientForm.address, street: e.target.value}})} 
                    placeholder="Ko'cha" 
                  />
                </div>
              </div>
            </div>

            {/* Tibbiy ma'lumotlar */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Allergiyalar (vergul bilan)</label>
                <input 
                  type="text" 
                  className="input" 
                  value={newPatientForm.allergies} 
                  onChange={e => setNewPatientForm({...newPatientForm, allergies: e.target.value})} 
                  placeholder="Penitsillin, chang" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Surunkali kasalliklar</label>
                <input 
                  type="text" 
                  className="input" 
                  value={newPatientForm.chronicDiseases} 
                  onChange={e => setNewPatientForm({...newPatientForm, chronicDiseases: e.target.value})} 
                  placeholder="Qandli diabet, Asma" 
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button className="btn btn-outline flex-1" onClick={() => setShowAddPatientModal(false)}>Bekor qilish</button>
              <button className="btn btn-success flex-1" onClick={handleCreateAndAssignPatient}>
                <CheckCircle size={16} /> Tasdiqlash & Yotqizish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discharge Payment Modal */}
      {dischargeModal && (() => {
        const { patient, room } = dischargeModal;
        const days = calcDaysStayed(patient);
        const billDays = Math.max(1, days);
        const fin = getPatientStasionarFinance(patient, room, billDays);
        const discountAmt = Number(dischargeDiscount) || 0;
        const finalCost = Math.max(0, fin.dueAmount - discountAmt);
        return (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-fadeIn">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <DoorOpen size={24} className="text-orange-600 dark:text-orange-450" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Xonadan chiqarish & To'lov</h3>
                  <p className="text-xs text-gray-500">#{room.number}-xona • {room.type}</p>
                </div>
              </div>

              {/* Cost breakdown */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 mb-4 space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                <p className="font-bold text-gray-900 dark:text-gray-150 text-sm mb-2">👤 {patient.firstName} {patient.lastName}</p>
                
                <div className="flex justify-between border-b border-black/5 dark:border-white/5 pb-1">
                  <span>Xona ijarasi ({billDays} kun):</span>
                  <span className="font-semibold">{formatMoney(fin.roomCost)} so'm</span>
                </div>
                
                {fin.patientExpenses > 0 && (
                  <div className="flex justify-between border-b border-black/5 dark:border-white/5 pb-1 text-red-600">
                    <span>Qilingan rasxodlar (dori/darmon):</span>
                    <span className="font-semibold">+{formatMoney(fin.patientExpenses)} so'm</span>
                  </div>
                )}
                
                {fin.servicesTotal > 0 && (
                  <div className="flex justify-between border-b border-black/5 dark:border-white/5 pb-1 text-purple-600 dark:text-purple-400">
                    <span>Qo'shimcha xizmatlar:</span>
                    <span className="font-semibold">+{formatMoney(fin.servicesTotal)} so'm</span>
                  </div>
                )}

                {fin.servicesPaid > 0 && (
                  <div className="flex justify-between border-b border-black/5 dark:border-white/5 pb-1 text-green-600 dark:text-green-400">
                    <span>Xizmatlarga to'langan:</span>
                    <span className="font-semibold">-{formatMoney(fin.servicesPaid)} so'm</span>
                  </div>
                )}

                <div className="flex justify-between pt-1.5 font-bold text-sm text-gray-900 dark:text-gray-100">
                  <span>Jami to'lov:</span>
                  <span>{formatMoney(fin.dueAmount)} so'm</span>
                </div>

                {patient.admissionDateTime && (
                  <p className="text-[10px] text-gray-400 text-center pt-1 border-t border-black/5 dark:border-white/5 mt-1.5">
                    Kirilgan: {new Date(patient.admissionDateTime).toLocaleString('uz-UZ')}
                  </p>
                )}
              </div>

              {/* Payment inputs */}
              <div className="space-y-3 mb-5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Chegirma (so'm)</label>
                    <input className="input font-mono" type="number" value={dischargeDiscount}
                      onChange={e => setDischargeDiscount(e.target.value)} placeholder="0" min="0" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">To'lov usuli</label>
                    <select className="input select" value={dischargePayMethod} onChange={e => setDischargePayMethod(e.target.value)}>
                      <option>Naqd</option><option>Karta</option><option>Bank o'tkazmasi</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">To'langan summa (bo'sh qoldiring = to'liq)</label>
                  <input className="input font-mono font-bold text-green-600 text-lg" type="number"
                    value={dischargePaid} onChange={e => setDischargePaid(e.target.value)}
                    placeholder={finalCost.toString()} min="0" />
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 flex justify-between items-center border border-green-200 dark:border-green-700">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">To'lanishi kerak:</span>
                  <span className="text-2xl font-extrabold text-green-600 dark:text-green-400">{formatMoney(finalCost)} so'm</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="btn btn-outline flex-1" onClick={() => setDischargeModal(null)}>Bekor qilish</button>
                <button className="btn btn-success flex-1" onClick={handleDischarge}>
                  <CheckCircle size={16} /> Tasdiqlash & Chiqarish
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Xarajat yozish modali */}
      {expensePatient && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Coins size={24} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Bemorga Xarajat yozish</h3>
                <p className="text-xs text-gray-500">👤 {expensePatient.firstName} {expensePatient.lastName}</p>
              </div>
            </div>

            <div className="space-y-4 mb-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Xarajat nomi/Izoh *</label>
                <input 
                  type="text" 
                  className="input" 
                  value={expenseForm.description} 
                  onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} 
                  placeholder="Masalan: Dori-darmonlar"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Summa (so'm) *</label>
                  <input 
                    type="number" 
                    className="input font-mono" 
                    value={expenseForm.amount} 
                    onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} 
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Kategoriya</label>
                  <select 
                    className="input select" 
                    value={expenseForm.category} 
                    onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}
                  >
                    <option>Dori-darmon</option>
                    <option>Boshqa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Kassadan chiqish usuli</label>
                <select 
                  className="input select" 
                  value={expenseForm.paymentMethod} 
                  onChange={e => setExpenseForm({...expenseForm, paymentMethod: e.target.value})}
                >
                  <option>Naqd</option>
                  <option>Karta</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="btn btn-outline flex-1" onClick={() => setExpensePatient(null)}>Bekor qilish</button>
              <button className="btn btn-danger flex-1" onClick={handleExpenseSave}>
                <CheckCircle size={16} /> Xarajatni saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Xizmatga yuborish modali */}
      {servicePatient && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-fadeIn animate-duration-200">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Stethoscope size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Xizmatga yo'naltirish & To'lov</h3>
                <p className="text-xs text-gray-500">👤 {servicePatient.firstName} {servicePatient.lastName}</p>
              </div>
            </div>

            <div className="space-y-4 mb-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Xizmat tanlang *</label>
                <select 
                  className="input select" 
                  value={serviceForm.serviceId} 
                  onChange={e => handleServiceChangeInModal(e.target.value)}
                >
                  <option value="">Xizmat tanlang...</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} ({formatMoney(s.price)} so'm)</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Shifokor (ixtiyoriy)</label>
                <select 
                  className="input select" 
                  value={serviceForm.doctorId} 
                  onChange={e => setServiceForm({...serviceForm, doctorId: e.target.value})}
                >
                  <option value="">Shifokor tanlang...</option>
                  {staff.filter(s => s.role === 'doctor' && s.active).map(d => (
                    <option key={d.id} value={d.id}>Dr. {d.lastName} {d.firstName} ({d.specialization})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Narxi (so'm)</label>
                  <input 
                    type="number" 
                    className="input font-mono" 
                    value={serviceForm.price} 
                    onChange={e => setServiceForm({...serviceForm, price: e.target.value, paidAmount: e.target.value - serviceForm.discount})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Chegirma (so'm)</label>
                  <input 
                    type="number" 
                    className="input font-mono" 
                    value={serviceForm.discount} 
                    onChange={e => {
                      const disc = Number(e.target.value) || 0;
                      setServiceForm({...serviceForm, discount: e.target.value, paidAmount: (serviceForm.price - disc).toString()});
                    }}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">To'lov usuli</label>
                  <select 
                    className="input select" 
                    value={serviceForm.paymentMethod} 
                    onChange={e => setServiceForm({...serviceForm, paymentMethod: e.target.value})}
                  >
                    <option>Naqd</option>
                    <option>Karta</option>
                    <option>Sug'urta</option>
                    <option>Muddatli to'lov</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">To'langan summa</label>
                  <input 
                    type="number" 
                    className="input font-mono font-bold text-green-600 dark:text-green-400" 
                    value={serviceForm.paidAmount} 
                    onChange={e => setServiceForm({...serviceForm, paidAmount: e.target.value})} 
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="btn btn-outline flex-1" onClick={() => setServicePatient(null)}>Bekor qilish</button>
              <button className="btn btn-success flex-1" onClick={handleServiceSave}>
                <CheckCircle size={16} /> Tasdiqlash & Yuborish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Xona batafsil ma'lumotlari sidebari (Right Drawer) */}
      {detailRoom && (
        <div className="drawer-overlay" onClick={() => setDetailRoom(null)}>
          <div className="drawer-content animate-slideInRight" onClick={e => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-zinc-800 shrink-0">
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">#{detailRoom.number}-xona tafsilotlari</h3>
                <p className="text-xs text-gray-500">{detailRoom.type} • {detailRoom.floor}-qavat</p>
              </div>
              <button onClick={() => setDetailRoom(null)} className="btn btn-icon btn-outline p-1.5">
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Room Stats */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800/80">
                <div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Narxi/kun</span>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{formatMoney(detailRoom.pricePerDay)} so'm</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Joylar bandligi</span>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">
                    {patients.filter(p => p.roomId === detailRoom.id && p.status === 'stasionar').length} / {detailRoom.capacity}
                  </span>
                </div>
                <div className="col-span-2 border-t border-gray-100 dark:border-zinc-800/80 pt-2.5 mt-1.5">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Jihozlar</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(detailRoom.equipment || []).length > 0 ? (
                      (detailRoom.equipment || []).map((eq, i) => (
                        <span key={i} className="text-[10px] bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700/80 px-2 py-0.5 rounded-lg text-gray-700 dark:text-gray-300">{eq}</span>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-450 italic">Mavjud emas</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Occupying Patients */}
              <div>
                <h4 className="font-bold text-xs text-gray-500 uppercase tracking-wider mb-3">Yotgan Bemorlar</h4>
                {(() => {
                  const roomPatients = patients.filter(p => p.roomId === detailRoom.id && p.status === 'stasionar');
                  if (roomPatients.length === 0) {
                    return (
                      <div className="text-center py-6 border-2 border-dashed border-gray-100 dark:border-zinc-800 rounded-2xl bg-gray-50/20 dark:bg-white/5">
                        <p className="text-xs text-gray-455 italic">Bu xonada hozirda bemorlar yo'q</p>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-4">
                      {roomPatients.map(p => {
                        const days = calcDaysStayed(p);
                        const billDays = Math.max(1, days);
                        const fin = getPatientStasionarFinance(p, detailRoom, billDays);
                        const assignedBy = p.roomAssignedBy || (p.assignedDoctor ? (staff.find(s => s.id === p.assignedDoctor) ? `Dr. ${staff.find(s => s.id === p.assignedDoctor).lastName} ${staff.find(s => s.id === p.assignedDoctor).firstName[0]}.` : 'Shifokor') : 'Resepshion');
                        
                        return (
                          <div key={p.id} className="p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
                            {/* Patient Header */}
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h5 className="font-bold text-sm text-gray-900 dark:text-white">
                                  👤 {p.lastName} {p.firstName}
                                </h5>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  ID: {p.id} • 📞 {p.phone}
                                </p>
                              </div>
                              <button
                                className="btn btn-sm btn-danger shrink-0 py-1 px-2.5 text-xs flex items-center gap-1"
                                onClick={() => openDischargeModal(p, detailRoom)}
                              >
                                <DoorOpen size={12} /> Chiqar
                              </button>
                            </div>

                            {/* Admission Details */}
                            <div className="grid grid-cols-2 gap-2 text-[10px] bg-gray-50/50 dark:bg-white/5 p-2 rounded-xl border border-gray-100/50 dark:border-zinc-800/80">
                              <div>
                                <span className="text-gray-450 block">Yotqizilgan sana:</span>
                                <span className="font-semibold text-gray-800 dark:text-gray-200">
                                  {p.admissionDateTime ? new Date(p.admissionDateTime).toLocaleDateString('uz-UZ') : p.admissionDate}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-450 block">Yotqizgan mas'ul:</span>
                                <span className="font-semibold text-gray-800 dark:text-gray-200 truncate block" title={assignedBy}>
                                  {assignedBy}
                                </span>
                              </div>
                              <div className="col-span-2 border-t border-gray-200 dark:border-zinc-800/80 pt-1 mt-1">
                                <span className="text-gray-450">Joylashgan muddati: </span>
                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                  {days === 0 ? "Bugun joylashdi" : `${days} kun bo'ldi`}
                                </span>
                              </div>
                            </div>

                            {/* Financial breakdown */}
                            <div className="text-[11px] space-y-1 border-t border-dashed border-gray-100 dark:border-zinc-800/80 pt-2.5">
                              <div className="flex justify-between text-gray-500">
                                <span>Xona ijarasi:</span>
                                <span>{formatMoney(fin.roomCost)} so'm</span>
                              </div>
                              {fin.patientExpenses > 0 && (
                                <div className="flex justify-between text-red-500 font-medium">
                                  <span>Dori va xarajatlar:</span>
                                  <span>+{formatMoney(fin.patientExpenses)} so'm</span>
                                </div>
                              )}
                              {fin.servicesTotal > 0 && (
                                <div className="flex justify-between text-purple-600 dark:text-purple-400 font-medium">
                                  <span>Qo'shimcha xizmatlar:</span>
                                  <span>+{formatMoney(fin.servicesTotal)} so'm</span>
                                </div>
                              )}
                              <div className="flex justify-between font-bold text-gray-800 dark:text-gray-200 pt-1 border-t border-gray-100 dark:border-zinc-800/80 mt-1">
                                <span>Joriy qarz:</span>
                                <span className="text-xs text-red-650 font-semibold">{formatMoney(fin.dueAmount)} so'm</span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-zinc-800/80 mt-2">
                              <button
                                className="btn btn-sm btn-outline flex-1 text-xs py-1.5"
                                onClick={() => openExpenseModal(p)}
                              >
                                <Coins size={12} /> + Xarajat
                              </button>
                              <button
                                className="btn btn-sm btn-info text-white flex-1 text-xs py-1.5"
                                onClick={() => openServiceModal(p)}
                              >
                                <Stethoscope size={12} /> + Xizmat
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Assign Patient section if room has vacancy */}
              {(() => {
                const roomPatients = patients.filter(p => p.roomId === detailRoom.id && p.status === 'stasionar');
                const hasVacancy = roomPatients.length < detailRoom.capacity;
                if (!hasVacancy) return null;
                return (
                  <div className="border-t border-dashed border-gray-200 dark:border-zinc-800 pt-5 space-y-4">
                    <h4 className="font-bold text-xs text-gray-550 uppercase tracking-wider">Bemorni joylashtirish</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Bemorlarni qidirish</label>
                        <input
                          type="text"
                          className="input text-xs py-1.5"
                          placeholder="Ism, familiya yoki tel bo'yicha qidiring..."
                          value={patientSelectQuery}
                          onChange={e => setPatientSelectQuery(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Bemor tanlang</label>
                        <select 
                          className="input select text-xs py-1.5" 
                          value={selectedPatient} 
                          onChange={e => setSelectedPatient(e.target.value)}
                        >
                          <option value="">Bemor tanlang...</option>
                          {filteredAvailablePatients.map(p => (
                            <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.phone})</option>
                          ))}
                        </select>
                      </div>

                      <button 
                        className="btn btn-success w-full text-xs py-2 mt-2 font-semibold"
                        onClick={handleAssign} 
                        disabled={!selectedPatient}
                      >
                        Xonaga joylashtirish
                      </button>

                      <div className="flex items-center justify-between my-2 text-gray-400">
                        <hr className="w-[42%] border-gray-200 dark:border-zinc-800" />
                        <span className="text-[9px] uppercase font-bold tracking-widest text-gray-400">yoki</span>
                        <hr className="w-[42%] border-gray-200 dark:border-zinc-800" />
                      </div>

                      <button 
                        className="btn btn-outline btn-primary w-full text-xs py-2 font-semibold"
                        onClick={() => {
                          setNewPatientForm({
                            firstName: '',
                            lastName: '',
                            middleName: '',
                            phone: '',
                            phone2: '',
                            address: { region: 'Toshkent', district: '', street: '' },
                            bloodGroup: '',
                            allergies: '',
                            chronicDiseases: ''
                          });
                          setShowAddPatientModal(true);
                        }}
                      >
                        <UserPlus size={13} /> Yangi bemor ro'yxatga olish
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== PAYMENT =====
function PaymentSection() {
  const { services, patients, addPayment, treatments, updateTreatment, addPatientHistoryEvent } = useCrm();
  const toast = useToast();
  const [activeSubTab, setActiveSubTab] = useState('general'); // 'general' or 'treatment'

  // General payment states
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Naqd');
  const [paidAmount, setPaidAmount] = useState('');

  // Treatment payment states
  const [treatmentPatient, setTreatmentPatient] = useState('');
  const [selectedTreatmentId, setSelectedTreatmentId] = useState('');
  const [treatmentPaidInput, setTreatmentPaidInput] = useState('');
  const [treatmentPayMethod, setTreatmentPayMethod] = useState('Naqd');

  const activeTreatmentsForPatient = useMemo(() => {
    if (!treatmentPatient) return [];
    return treatments.filter(t => t.patientId === treatmentPatient && t.status === 'active');
  }, [treatmentPatient, treatments]);

  const selectedTreatment = useMemo(() => {
    if (!selectedTreatmentId) return null;
    return treatments.find(t => t.id === selectedTreatmentId);
  }, [selectedTreatmentId, treatments]);

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

  const handleTreatmentPayment = () => {
    if (!treatmentPatient || !selectedTreatmentId || !treatmentPaidInput || Number(treatmentPaidInput) <= 0) {
      toast("Bemor, muolaja va to'lov summasini to'g'ri tanlang", 'error');
      return;
    }

    const payAmt = Number(treatmentPaidInput);
    const oldPaid = Number(selectedTreatment.paidAmount || 0);
    const maxAllowed = selectedTreatment.price - oldPaid;
    
    if (payAmt > maxAllowed) {
      toast(`Kiritilgan summa qolgan qarzdan ko'p! Maksimal to'lov: ${formatMoney(maxAllowed)} so'm`, 'error');
      return;
    }

    const nextPaid = oldPaid + payAmt;
    
    const newPaymentObj = {
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      amount: payAmt,
      method: treatmentPayMethod
    };
    
    const updatedPayments = [...(selectedTreatment.payments || []), newPaymentObj];

    updateTreatment(selectedTreatment.id, {
      paidAmount: nextPaid,
      payments: updatedPayments
    });

    addPayment({
      patientId: treatmentPatient,
      services: [`Muolaja to'lovi: ${selectedTreatment.treatmentName}`],
      totalAmount: Number(selectedTreatment.price),
      discount: 0,
      paid: payAmt,
      method: treatmentPayMethod,
      status: nextPaid >= selectedTreatment.price ? 'paid' : nextPaid > 0 ? 'partial' : 'unpaid',
    });

    addPatientHistoryEvent(treatmentPatient, {
      type: 'payment',
      title: `Muolaja bo'lib to'lash`,
      details: `"${selectedTreatment.treatmentName}" muolajasi uchun ${payAmt.toLocaleString()} so'm to'landi. To'lov usuli: ${treatmentPayMethod}. Jami to'langan: ${nextPaid.toLocaleString()} so'm. Qolgan qarz: ${Math.max(0, selectedTreatment.price - nextPaid).toLocaleString()} so'm.`,
    });

    toast(`Muolaja uchun ${formatMoney(payAmt)} so'm to'lov qabul qilindi`, 'success');
    setTreatmentPaidInput('');
  };

  const toggleService = (srvId) => {
    setSelectedServices(prev => prev.includes(srvId) ? prev.filter(id => id !== srvId) : [...prev, srvId]);
  };

  return (
    <div>
      <Header title="To'lov Qabul Qilish" role="reception" />

      <div className="mb-4">
        <TabNav
          tabs={[
            { key: 'general', label: "Umumiy xizmatlar to'lovi" },
            { key: 'treatment', label: "Muolaja to'lovlari (Bo'lib to'lash)" }
          ]}
          activeTab={activeSubTab}
          onChange={setActiveSubTab}
        />
      </div>

      {activeSubTab === 'general' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fadeIn">
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fadeIn">
          <div className="card p-5">
            <h4 className="font-bold text-gray-900 mb-4">Muolaja bo&apos;yicha bemor tanlash</h4>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Bemor tanlang</label>
                <select className="input select" value={treatmentPatient} onChange={e => { setTreatmentPatient(e.target.value); setSelectedTreatmentId(''); }}>
                  <option value="">Bemor tanlang...</option>
                  {patients.map(p => {
                    const hasActive = treatments.some(t => t.patientId === p.id && t.status === 'active');
                    if (!hasActive) return null;
                    return <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.id})</option>;
                  })}
                </select>
              </div>

              {treatmentPatient && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Faol muolaja rejasi</label>
                  <select className="input select" value={selectedTreatmentId} onChange={e => setSelectedTreatmentId(e.target.value)}>
                    <option value="">Muolajani tanlang...</option>
                    {activeTreatmentsForPatient.map(t => (
                      <option key={t.id} value={t.id}>{t.treatmentName} ({formatMoney(t.price)} so&apos;m)</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {selectedTreatment && (
            <div className="card p-5 flex flex-col gap-4 border-t-4 border-t-purple-500 shadow-md animate-fadeIn">
              <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center justify-between">
                <span>Muolaja holati &amp; To&apos;lov</span>
                <span className="badge badge-purple text-xs">{selectedTreatment.id}</span>
              </h4>

              <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-black/5 text-xs space-y-2.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-500">Muolaja nomi:</span>
                  <strong className="text-gray-900 dark:text-white">{selectedTreatment.treatmentName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Boshlanish sanasi:</span>
                  <strong className="text-gray-900 dark:text-white">{selectedTreatment.startDate}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Davomiyligi:</span>
                  <strong className="text-gray-900 dark:text-white">{selectedTreatment.durationDays} kun / {selectedTreatment.frequency}</strong>
                </div>
                <div className="border-t border-dashed border-gray-200 dark:border-white/10 my-2"></div>
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-500">Umumiy narxi:</span>
                  <span className="text-gray-900 dark:text-white">{formatMoney(selectedTreatment.price)} so&apos;m</span>
                </div>
                <div className="flex justify-between font-semibold text-green-600 dark:text-green-400">
                  <span>To&apos;langan summa:</span>
                  <span>{formatMoney(selectedTreatment.paidAmount || 0)} so&apos;m</span>
                </div>
                <div className="flex justify-between font-bold text-red-600 dark:text-red-400">
                  <span>Qolgan qarz:</span>
                  <span>{formatMoney(Math.max(0, selectedTreatment.price - (selectedTreatment.paidAmount || 0)))} so&apos;m</span>
                </div>
              </div>

              {selectedTreatment.payments && selectedTreatment.payments.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-gray-500 block">To&apos;lovlar tarixi</span>
                  <div className="max-h-28 overflow-y-auto border border-gray-100 dark:border-white/5 rounded-xl bg-gray-50/50 p-2 text-[10px] space-y-1.5">
                    {selectedTreatment.payments.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                        <span>{p.date} {p.time} ({p.method})</span>
                        <strong className="text-green-600">+{formatMoney(p.amount)} so&apos;m</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">To&apos;lov usuli</label>
                    <select className="input select" value={treatmentPayMethod} onChange={e => setTreatmentPayMethod(e.target.value)}>
                      <option>Naqd</option>
                      <option>Karta</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">To&apos;lanayotgan summa (so&apos;m)</label>
                    <input 
                      className="input font-mono font-bold text-green-600" 
                      type="number" 
                      value={treatmentPaidInput} 
                      onChange={e => setTreatmentPaidInput(e.target.value)} 
                      placeholder={Math.max(0, selectedTreatment.price - (selectedTreatment.paidAmount || 0)).toString()} 
                      max={Math.max(0, selectedTreatment.price - (selectedTreatment.paidAmount || 0))}
                    />
                  </div>
                </div>

                <button className="btn btn-success w-full py-2.5 font-bold" onClick={handleTreatmentPayment}>
                  To&apos;lovni tasdiqlash va yozish
                </button>
              </div>
            </div>
          )}
        </div>
      )}
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
  const { patients, payments, expenses, staff, treatments, updatePatient } = useCrm();
  const toast = useToast();
  const today = new Date().toISOString().split('T')[0];

  // Filters State
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [activePreset, setActivePreset] = useState('today');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVisitType, setFilterVisitType] = useState('all');
  const [filterDoctor, setFilterDoctor] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Drawer & Tabs State
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [drawerTab, setDrawerTab] = useState('general');



  // Date presets setter
  const setPreset = (preset) => {
    const now = new Date();
    const format = (d) => d.toISOString().split('T')[0];
    
    if (preset === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'yesterday') {
      const yesterday = new Date(Date.now() - 86400000);
      setStartDate(format(yesterday));
      setEndDate(format(yesterday));
    } else if (preset === 'last7') {
      const last7 = new Date(Date.now() - 7 * 86400000);
      setStartDate(format(last7));
      setEndDate(today);
    } else if (preset === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(format(startOfMonth));
      setEndDate(today);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
    setActivePreset(preset);
  };

  // Base range filters
  const rangePatients = useMemo(() => {
    return patients.filter(p => {
      if (startDate && p.admissionDate < startDate) return false;
      if (endDate && p.admissionDate > endDate) return false;
      return true;
    });
  }, [patients, startDate, endDate]);

  const rangePayments = useMemo(() => {
    return payments.filter(p => {
      if (startDate && p.date < startDate) return false;
      if (endDate && p.date > endDate) return false;
      return true;
    });
  }, [payments, startDate, endDate]);

  const rangeExpenses = useMemo(() => {
    return (expenses || []).filter(e => {
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date > endDate) return false;
      return true;
    });
  }, [expenses, startDate, endDate]);

  // Stat computations based on range
  const rangeIncome = useMemo(() => {
    const paymentSum = rangePayments.reduce((s, p) => s + (p.paid || 0), 0);
    const otherIncomeSum = rangeExpenses.filter(e => e.type === 'income').reduce((s, e) => s + (e.amount || 0), 0);
    return paymentSum + otherIncomeSum;
  }, [rangePayments, rangeExpenses]);

  const rangeOutflow = useMemo(() => {
    return rangeExpenses.filter(e => e.type !== 'income').reduce((s, e) => s + (e.amount || 0), 0);
  }, [rangeExpenses]);

  const rangeBalance = rangeIncome - rangeOutflow;
  const rangeCancelled = rangePatients.filter(p => p.queueStatus === 'no-show').length;

  // Payments total map per patient (all-time)
  const patientPaymentMap = useMemo(() => {
    const map = {};
    payments.forEach(p => {
      if (!map[p.patientId]) map[p.patientId] = 0;
      map[p.patientId] += (p.paid || 0);
    });
    return map;
  }, [payments]);

  // Extract unique regions for filter
  const regions = useMemo(() => {
    const set = new Set();
    patients.forEach(p => {
      if (p.address?.region) set.add(p.address.region);
    });
    return Array.from(set).sort();
  }, [patients]);

  // Extract doctors
  const doctorsList = useMemo(() => {
    return staff.filter(s => s.role === 'doctor');
  }, [staff]);

  // Main filtered patients for table display
  const filteredPatients = useMemo(() => {
    return rangePatients.filter(p => {
      // 1. Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const fullname = `${p.firstName || ''} ${p.lastName || ''} ${p.middleName || ''}`.toLowerCase();
        const matchesSearch = fullname.includes(q) ||
          p.id.toLowerCase().includes(q) ||
          (p.phone && p.phone.includes(searchQuery)) ||
          (p.visitReason && p.visitReason.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      // 2. Status
      if (filterStatus !== 'all') {
        if (filterStatus === 'active') {
          if (!['navbatda', 'stasionar', 'ambulatoriya'].includes(p.status)) return false;
        } else if (p.status !== filterStatus && p.queueStatus !== filterStatus) {
          return false;
        }
      }

      // 3. Visit Type
      if (filterVisitType !== 'all') {
        if (p.visitType !== filterVisitType) return false;
      }

      // 4. Doctor
      if (filterDoctor !== 'all') {
        if (p.doctorId !== filterDoctor && p.assignedDoctor !== filterDoctor) return false;
      }

      // 5. Gender
      if (filterGender !== 'all') {
        if (p.gender !== filterGender) return false;
      }

      // 6. Region
      if (filterRegion !== 'all') {
        if (p.address?.region !== filterRegion) return false;
      }

      // 7. Payment status
      if (filterPaymentStatus !== 'all') {
        const patPayments = payments.filter(pay => pay.patientId === p.id);
        const totalPaid = patPayments.reduce((s, pay) => s + (pay.paid || 0), 0);
        const totalBilled = patPayments.reduce((s, pay) => s + (pay.totalAmount || 0), 0);
        const debt = totalBilled - totalPaid;
        
        if (filterPaymentStatus === 'paid') {
          if (totalBilled === 0 || debt > 0) return false;
        } else if (filterPaymentStatus === 'partial') {
          if (totalPaid === 0 || debt <= 0) return false;
        } else if (filterPaymentStatus === 'unpaid') {
          if (totalBilled === 0 || totalPaid > 0) return false;
        }
      }

      return true;
    });
  }, [rangePatients, searchQuery, filterStatus, filterVisitType, filterDoctor, filterGender, filterRegion, filterPaymentStatus, payments]);

  // Helper details extractors
  const getPatientTreatments = (patientId) => treatments.filter(t => t.patientId === patientId);
  const getPatientPayments = (patientId) => payments.filter(p => p.patientId === patientId);
  const getDoctor = (doctorId) => staff.find(s => s.id === doctorId);

  // File type icons
  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) return '🖼️';
    if (ext === 'pdf') return '📕';
    if (['doc', 'docx'].includes(ext)) return '📘';
    if (['xls', 'xlsx'].includes(ext)) return '📗';
    return '📄';
  };

  // Local File handlers
  const handleHistoryFileUpload = (e) => {
    if (!selectedPatient) return;
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
          content: reader.result,
          date: new Date().toLocaleDateString('uz-UZ')
        };
        const updatedFiles = [...(selectedPatient.files || []), fileObj];
        updatePatient(selectedPatient.id, { files: updatedFiles });
        setSelectedPatient(prev => ({ ...prev, files: updatedFiles }));
        toast("Fayl muvaffaqiyatli yuklandi!", "success");
      };
      reader.readAsDataURL(file);
    });
  };

  const handleHistoryFileDelete = (fileId) => {
    if (!selectedPatient) return;
    const updatedFiles = (selectedPatient.files || []).filter(f => f.id !== fileId);
    updatePatient(selectedPatient.id, { files: updatedFiles });
    setSelectedPatient(prev => ({ ...prev, files: updatedFiles }));
    toast("Fayl muvaffaqiyatli o'chirildi", "success");
  };

  return (
    <div>
      <Header title="Resepshion Hisoboti" subtitle={startDate && endDate ? `${formatDate(startDate)} dan ${formatDate(endDate)} gacha` : "Barcha davrlar"} role="reception" />

      {/* Date Presets and Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard icon={<User size={24} />} title="Range: Qabul" value={rangePatients.length} colorClass="stat-blue" />
        <StatCard icon={<CreditCard size={24} />} title="Range: Kirim" value={`${formatMoney(rangeIncome)} so'm`} colorClass="stat-green" />
        <StatCard icon={<TrendingDown size={24} />} title="Range: Chiqim" value={`${formatMoney(rangeOutflow)} so'm`} colorClass="stat-red" />
        <StatCard icon={<Wallet size={24} />} title="Range: Balans" value={`${formatMoney(rangeBalance)} so'm`} colorClass="stat-green" />
        <StatCard icon={<XCircle size={24} />} title="Range: Bekor" value={rangeCancelled} colorClass="stat-red" />
      </div>

      {/* Advanced Filter Bar */}
      <div className="card p-5 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
          <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Filter size={18} className="text-blue-500" /> Kengaytirilgan hisobot filtrlari
          </h4>
          <div className="flex gap-1 bg-gray-150 dark:bg-zinc-800 p-1 rounded-xl">
            <button className={`btn btn-sm py-1 px-3 rounded-lg border-none text-xs font-semibold ${activePreset === 'today' ? 'bg-white dark:bg-zinc-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900'}`} onClick={() => setPreset('today')}>Bugun</button>
            <button className={`btn btn-sm py-1 px-3 rounded-lg border-none text-xs font-semibold ${activePreset === 'yesterday' ? 'bg-white dark:bg-zinc-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900'}`} onClick={() => setPreset('yesterday')}>Kecha</button>
            <button className={`btn btn-sm py-1 px-3 rounded-lg border-none text-xs font-semibold ${activePreset === 'last7' ? 'bg-white dark:bg-zinc-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900'}`} onClick={() => setPreset('last7')}>7 kun</button>
            <button className={`btn btn-sm py-1 px-3 rounded-lg border-none text-xs font-semibold ${activePreset === 'month' ? 'bg-white dark:bg-zinc-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900'}`} onClick={() => setPreset('month')}>Shu oy</button>
            <button className={`btn btn-sm py-1 px-3 rounded-lg border-none text-xs font-semibold ${activePreset === 'all' ? 'bg-white dark:bg-zinc-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900'}`} onClick={() => setPreset('all')}>Barchasi</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Boshlanish sanasi</label>
            <input type="date" className="input text-sm w-full" value={startDate} onChange={e => { setStartDate(e.target.value); setActivePreset('custom'); }} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Tugash sanasi</label>
            <input type="date" className="input text-sm w-full" value={endDate} onChange={e => { setEndDate(e.target.value); setActivePreset('custom'); }} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Biriktirilgan shifokor</label>
            <select className="input select text-sm w-full" value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)}>
              <option value="all">Barcha shifokorlar</option>
              {doctorsList.map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Bemor holati</label>
            <select className="input select text-sm w-full" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">Barcha holatlar</option>
              <option value="navbatda">Navbatda (kutilmoqda)</option>
              <option value="in-progress">Ko&apos;rikda</option>
              <option value="completed">Tugallangan</option>
              <option value="stasionar">Stasionar</option>
              <option value="ambulatoriya">Ambulatoriya</option>
              <option value="tuzalgan">Tuzalgan</option>
              <option value="no-show">Kelmadi</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">To&apos;lov holati</label>
            <select className="input select text-sm w-full" value={filterPaymentStatus} onChange={e => setFilterPaymentStatus(e.target.value)}>
              <option value="all">Barcha holatlar</option>
              <option value="paid">To&apos;liq to&apos;langan</option>
              <option value="partial">Qisman to&apos;langan</option>
              <option value="unpaid">Qarzi bor (To&apos;lanmagan)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Qabul turi</label>
            <select className="input select text-sm w-full" value={filterVisitType} onChange={e => setFilterVisitType(e.target.value)}>
              <option value="all">Barcha turlar</option>
              <option value="Birinchi marta">Birinchi marta</option>
              <option value="Qayta">Qayta</option>
              <option value="Tez yordam">Tez yordam</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Hudud / Viloyat</label>
            <select className="input select text-sm w-full" value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
              <option value="all">Barcha hududlar</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Jinsi</label>
            <select className="input select text-sm w-full" value={filterGender} onChange={e => setFilterGender(e.target.value)}>
              <option value="all">Barchasi</option>
              <option value="Erkak">Erkak</option>
              <option value="Ayol">Ayol</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button className="btn btn-outline py-2 px-4 text-xs font-semibold" onClick={() => {
            setStartDate(today);
            setEndDate(today);
            setActivePreset('today');
            setFilterStatus('all');
            setFilterVisitType('all');
            setFilterDoctor('all');
            setFilterGender('all');
            setFilterRegion('all');
            setFilterPaymentStatus('all');
            setSearchQuery('');
          }}>
            Filtrlarni tozalash
          </button>
        </div>
      </div>

      {/* Main Results Card */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Mijozlar ro&apos;yxati ({filteredPatients.length} ta bemor)
          </h4>
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9 pr-3"
              placeholder="Ism, telefon, ID yoki kelish sababi..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setSearchQuery('')}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bemor</th>
                <th>Sana</th>
                <th>Telefon</th>
                <th>Kelish sababi</th>
                <th>Turi</th>
                <th>To&apos;lagan</th>
                <th>Holat</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400 italic">
                  Tanlangan parametrlar bo&apos;yicha bemorlar topilmadi
                </td></tr>
              ) : (
                filteredPatients.map(p => (
                  <tr
                    key={p.id}
                    className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    onClick={() => { setSelectedPatient(p); setDrawerTab('general'); }}
                  >
                    <td className="text-sm font-medium">
                      <div>{p.firstName} {p.lastName}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{p.id}</div>
                    </td>
                    <td className="text-sm">{p.admissionDate}</td>
                    <td className="text-sm text-gray-600">{p.phone || '—'}</td>
                    <td className="text-sm max-w-[200px] truncate">{p.visitReason || '—'}</td>
                    <td>
                      <span className="badge badge-info">{p.visitType || 'Ambulatoriya'}</span>
                    </td>
                    <td className="text-sm font-bold font-mono text-green-600">
                      {patientPaymentMap[p.id] ? `${formatMoney(patientPaymentMap[p.id])} so'm` : <span className="text-gray-400 font-normal">0</span>}
                    </td>
                    <td>
                      <span className={`badge ${
                        p.queueStatus === 'completed' || p.status === 'tuzalgan' ? 'badge-success' :
                        p.queueStatus === 'waiting' || p.status === 'navbatda' ? 'badge-warning' :
                        p.queueStatus === 'in-progress' || p.status === 'stasionar' ? 'badge-info' : 'badge-danger'
                      }`}>
                        {p.queueStatus || p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3 mt-4 no-print">
        <button className="btn btn-outline" onClick={() => window.print()}><Printer size={16} /> Chop etish</button>
      </div>

      {/* Slide-over Patient Drawer */}
      <Drawer isOpen={!!selectedPatient} onClose={() => setSelectedPatient(null)} title={selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName} — Mijoz kartochkasi` : ''} size="lg">
        {selectedPatient && (() => {
          const patPayments = getPatientPayments(selectedPatient.id);
          const patTreatments = getPatientTreatments(selectedPatient.id);
          const doctor = getDoctor(selectedPatient.assignedDoctor || selectedPatient.doctorId);
          
          const totalPaid = patPayments.reduce((s, p) => s + (p.paid || 0), 0);
          const totalBilled = patPayments.reduce((s, p) => s + (p.totalAmount || 0), 0);
          const debt = totalBilled - totalPaid;

          return (
            <div className="flex flex-col h-full">
              {/* Tabs navigation */}
              <div className="flex gap-2 border-b border-gray-100 dark:border-gray-800 pb-2 mb-4 overflow-x-auto shrink-0">
                <button className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-none ${drawerTab === 'general' ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-zinc-800 dark:text-gray-300'}`} onClick={() => setDrawerTab('general')}>Umumiy</button>
                <button className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-none ${drawerTab === 'medical' ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-zinc-800 dark:text-gray-300'}`} onClick={() => setDrawerTab('medical')}>Tibbiy Tarix</button>
                <button className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-none ${drawerTab === 'treatments' ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-zinc-800 dark:text-gray-300'}`} onClick={() => setDrawerTab('treatments')}>Muolaja & Dorilar</button>
                <button className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-none ${drawerTab === 'financial' ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-zinc-800 dark:text-gray-300'}`} onClick={() => setDrawerTab('financial')}>To&apos;lovlar</button>
                <button className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-none ${drawerTab === 'documents' ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-zinc-800 dark:text-gray-300'}`} onClick={() => setDrawerTab('documents')}>Analizlar & Hujjatlar</button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 space-y-4">
                
                {/* 1. GENERAL TAB */}
                {drawerTab === 'general' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl p-5 border border-blue-100/50 dark:border-blue-900/30">
                      <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-4 flex items-center gap-1.5"><User size={16} /> Shaxsiy ma&apos;lumotlar</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                        <p><span className="text-gray-400">F.I.SH:</span> <span className="font-semibold text-gray-900 dark:text-white">{selectedPatient.firstName} {selectedPatient.lastName} {selectedPatient.middleName || ''}</span></p>
                        <p><span className="text-gray-400">Bemor ID:</span> <span className="font-mono font-medium text-gray-800 dark:text-gray-200">{selectedPatient.id}</span></p>
                        <p><span className="text-gray-400">Tug&apos;ilgan sana:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedPatient.birthDate || '—'} {selectedPatient.birthDate && `(${getAge(selectedPatient.birthDate)} yosh)`}</span></p>
                        <p><span className="text-gray-400">Jinsi:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedPatient.gender || '—'}</span></p>
                        <p><span className="text-gray-400">Telefon:</span> <span className="font-mono font-medium text-gray-900 dark:text-white">{selectedPatient.phone || '—'}</span></p>
                        <p><span className="text-gray-400">Qo&apos;shimcha tel:</span> <span className="font-mono font-medium text-gray-900 dark:text-white">{selectedPatient.phone2 || '—'}</span></p>
                        <p><span className="text-gray-400">Millati:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedPatient.nationality || '—'}</span></p>
                        <p><span className="text-gray-400">Qon guruhi:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedPatient.bloodGroup || '—'}</span></p>
                        <p className="sm:col-span-2"><span className="text-gray-400">Yashash manzili:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedPatient.address ? `${selectedPatient.address.region || ''} ${selectedPatient.address.district || ''} ${selectedPatient.address.street || ''}`.trim() : '—'}</span></p>
                        <p className="sm:col-span-2"><span className="text-gray-400">E-mail:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedPatient.email || '—'}</span></p>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-2xl p-5 border border-gray-150 dark:border-zinc-800">
                      <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-1.5"><Heart size={15} className="text-red-500" /> Sog&apos;liq ko&apos;rsatkichlari & Allergiyalar</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Allergiyalar</span>
                          {selectedPatient.allergies && selectedPatient.allergies.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {selectedPatient.allergies.map(a => <span key={a} className="badge badge-danger text-xs px-2.5 py-1">{a}</span>)}
                            </div>
                          ) : <span className="text-sm text-gray-500 italic">Mavjud emas</span>}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Surunkali kasalliklar</span>
                          {selectedPatient.chronicDiseases && selectedPatient.chronicDiseases.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {selectedPatient.chronicDiseases.map(c => <span key={c} className="badge badge-warning text-xs px-2.5 py-1">{c}</span>)}
                            </div>
                          ) : <span className="text-sm text-gray-500 italic">Mavjud emas</span>}
                        </div>
                      </div>
                    </div>

                    {selectedPatient.insurance ? (
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/10 dark:to-pink-950/10 rounded-2xl p-5 border border-purple-100/50 dark:border-purple-900/20">
                        <h4 className="text-sm font-bold text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-1.5">🛡️ Tibbiy sug&apos;urta</h4>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <p><span className="text-gray-400">Sug&apos;urta kompaniyasi:</span> <span className="font-semibold block mt-0.5 text-gray-800 dark:text-gray-200">{selectedPatient.insurance.company}</span></p>
                          <p><span className="text-gray-400">Polis raqami:</span> <span className="font-mono block mt-0.5 text-gray-800 dark:text-gray-200">{selectedPatient.insurance.policyNumber}</span></p>
                          <p className="col-span-2"><span className="text-gray-400">Amal qilish muddati:</span> <span className="font-medium block mt-0.5 text-gray-800 dark:text-gray-200">{selectedPatient.insurance.validUntil}</span></p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-100/55 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-gray-250 dark:border-zinc-850 text-center text-xs text-gray-400">
                        Sug&apos;urta polisi biriktirilmagan
                      </div>
                    )}
                  </div>
                )}

                {/* 2. MEDICAL HISTORY TAB */}
                {drawerTab === 'medical' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl p-5 border border-green-100/50 dark:border-green-900/30">
                      <h4 className="text-sm font-bold text-green-700 dark:text-green-400 mb-4 flex items-center gap-1.5"><Stethoscope size={16} /> Tibbiy holat</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                        <p><span className="text-gray-400">Kelish sababi:</span> <span className="font-medium text-gray-900 dark:text-white block mt-0.5">{selectedPatient.visitReason || '—'}</span></p>
                        <p><span className="text-gray-400">Qo&apos;yilgan tashxis:</span> <span className="font-semibold text-gray-900 dark:text-white block mt-0.5">{selectedPatient.diagnosis || '—'}</span></p>
                        <p><span className="text-gray-400">Qabul shifokori:</span> <span className="font-medium text-gray-900 dark:text-white block mt-0.5">{doctor ? `${doctor.firstName} ${doctor.lastName} (${doctor.specialization || 'Shifokor'})` : '—'}</span></p>
                        <p><span className="text-gray-400">Palata (Stasionar):</span> <span className="font-semibold text-gray-900 dark:text-white block mt-0.5">{selectedPatient.roomId ? `Palata #${selectedPatient.roomId.replace('RM-', '')}` : 'Ambulator davolanishda'}</span></p>
                        <p><span className="text-gray-400">Kelgan sana:</span> <span className="font-medium text-gray-900 dark:text-white block mt-0.5">{selectedPatient.admissionDate} {selectedPatient.queueTime && `soat ${selectedPatient.queueTime}`}</span></p>
                        <p><span className="text-gray-400">Ketish / Javob sanasi:</span> <span className="font-medium text-gray-900 dark:text-white block mt-0.5">{selectedPatient.expectedDischarge || '—'}</span></p>
                        <p><span className="text-gray-400">Tizimdagi holati:</span> <span className="block mt-1"><span className={`badge ${selectedPatient.status === 'stasionar' ? 'badge-danger' : selectedPatient.status === 'tuzalgan' ? 'badge-success' : 'badge-info'}`}>{selectedPatient.status}</span></span></p>
                        <p><span className="text-gray-400">Umumiy ahvoli:</span> <span className="block mt-1"><span className={`badge ${selectedPatient.overallCondition === 'good' ? 'badge-success' : selectedPatient.overallCondition === 'moderate' ? 'badge-warning' : 'badge-danger'}`}>{selectedPatient.overallCondition}</span></span></p>
                      </div>
                    </div>

                    {/* Vital Signs measured by nurse */}
                    <div>
                      <h5 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1.5">🫀 Vital ko&apos;rsatkichlar tarixi</h5>
                      {selectedPatient.vitalSigns && selectedPatient.vitalSigns.length > 0 ? (
                        <div className="overflow-x-auto border border-gray-100 dark:border-zinc-800 rounded-xl">
                          <table className="data-table text-xs">
                            <thead>
                              <tr>
                                <th>Sana / Vaqt</th>
                                <th>Harorat</th>
                                <th>Bosim</th>
                                <th>Puls</th>
                                <th>SpO2</th>
                                <th>Qand</th>
                                <th>Vazn</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedPatient.vitalSigns.map((v, i) => (
                                <tr key={i}>
                                  <td>{v.date} · {v.time}</td>
                                  <td className="font-semibold">{v.temperature ? `${v.temperature}°C` : '—'}</td>
                                  <td className="font-mono">{v.bloodPressure || '—'}</td>
                                  <td>{v.pulse ? `${v.pulse} /min` : '—'}</td>
                                  <td>{v.spo2 ? `${v.spo2}%` : '—'}</td>
                                  <td>{v.sugar ? `${v.sugar} mmol` : '—'}</td>
                                  <td>{v.weight ? `${v.weight} kg` : '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : <p className="text-xs text-gray-400 italic text-center py-4 bg-gray-50/50 dark:bg-zinc-800/10 rounded-xl border border-dashed border-gray-200">Hayotiy ko&apos;rsatkichlar qayd etilmagan</p>}
                    </div>

                    {/* Nurse shift notes */}
                    <div>
                      <h5 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1.5">📝 Hamshira izohlari jurnali</h5>
                      {selectedPatient.nurseNotes && selectedPatient.nurseNotes.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {selectedPatient.nurseNotes.map((n, i) => (
                            <div key={i} className="p-3 bg-gray-55/40 dark:bg-zinc-800/30 rounded-xl border border-gray-100/50 dark:border-zinc-800/50 text-xs">
                              <div className="flex justify-between font-semibold text-gray-500 mb-1 text-[10px]">
                                <span>📅 {n.date} • {n.time} ({n.shift} smena)</span>
                                <span>ID: {n.nurse}</span>
                              </div>
                              <p className="text-gray-800 dark:text-gray-200 italic">&ldquo;{n.note}&rdquo;</p>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-xs text-gray-400 italic text-center py-4 bg-gray-50/50 dark:bg-zinc-800/10 rounded-xl border border-dashed border-gray-200">Hamshira qaydlari mavjud emas</p>}
                    </div>

                    {/* Previous Visits */}
                    <div>
                      <h5 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1.5">📅 Tashriflar tarixi</h5>
                      {selectedPatient.visits && selectedPatient.visits.length > 0 ? (
                        <div className="space-y-2">
                          {selectedPatient.visits.map((vis, i) => (
                            <div key={i} className="p-3 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-xl text-xs">
                              <div className="flex justify-between font-semibold text-gray-400 mb-1">
                                <span>Tashrif sanasi: {vis.date}</span>
                                <span className="badge badge-info">{vis.icdCode || 'ICD-10'}</span>
                              </div>
                              <p className="font-bold text-gray-900 dark:text-white">Tashxis: {vis.diagnosis}</p>
                              {vis.notes && <p className="mt-1 text-gray-650 dark:text-gray-400">Izoh: {vis.notes}</p>}
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-xs text-gray-400 italic text-center py-4 bg-gray-50/50 dark:bg-zinc-800/10 rounded-xl border border-dashed border-gray-200">Avvalgi tashriflar tarixi mavjud emas</p>}
                    </div>
                  </div>
                )}

                {/* 3. TREATMENTS AND MEDICINES TAB */}
                {drawerTab === 'treatments' && (
                  <div className="space-y-4 animate-fadeIn">
                    {/* Active Treatment Plans */}
                    <div>
                      <h5 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1.5">📋 Muolajalar & Rejalar</h5>
                      {patTreatments.length > 0 ? (
                        <div className="space-y-3">
                          {patTreatments.map(t => (
                            <div key={t.id} className="p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl text-xs space-y-2 shadow-sm">
                              <div className="flex justify-between items-center">
                                <h6 className="font-bold text-sm text-blue-600 dark:text-blue-400">{t.treatmentName}</h6>
                                <span className={`badge ${t.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{t.status === 'active' ? 'Faol' : 'Bekor'}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-gray-500">
                                <p>📅 Boshlanishi: <span className="font-semibold text-gray-700 dark:text-gray-300">{t.startDate}</span></p>
                                <p>⏱️ Vaqt: <span className="font-semibold text-gray-700 dark:text-gray-300">{t.time}</span></p>
                                <p>📅 Davomiyligi: <span className="font-semibold text-gray-700 dark:text-gray-300">{t.durationDays} kun ({t.frequency})</span></p>
                                <p>💵 Summa: <span className="font-semibold text-gray-700 dark:text-gray-300 font-mono">{formatMoney(t.price)} so&apos;m</span></p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-xs text-gray-400 italic text-center py-6 bg-gray-50/50 dark:bg-zinc-800/10 rounded-2xl border border-dashed border-gray-200">Muolaja rejalari mavjud emas</p>}
                    </div>

                    {/* Prescriptions */}
                    <div>
                      <h5 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1.5">💊 Shifokor yozgan retseptlar</h5>
                      {selectedPatient.prescriptions && selectedPatient.prescriptions.length > 0 ? (
                        <div className="overflow-x-auto border border-gray-100 dark:border-zinc-800 rounded-xl">
                          <table className="data-table text-xs">
                            <thead>
                              <tr>
                                <th>Dori</th>
                                <th>Dozasi</th>
                                <th>Muddati</th>
                                <th>Ko&apos;rsatma</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedPatient.prescriptions.map((pr, i) => (
                                <tr key={i}>
                                  <td className="font-semibold text-gray-900 dark:text-white">{pr.medicine}</td>
                                  <td>{pr.dose} · {pr.frequency}</td>
                                  <td>{pr.duration}</td>
                                  <td className="text-gray-500">{pr.instructions || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : <p className="text-xs text-gray-400 italic text-center py-4 bg-gray-50/50 dark:bg-zinc-800/10 rounded-xl border border-dashed border-gray-200">Hozircha retseptlar yozilmagan</p>}
                    </div>

                    {/* Medications Distribution */}
                    <div>
                      <h5 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1.5">💉 Dorilar qabul qilinish tarixi</h5>
                      {selectedPatient.medications && selectedPatient.medications.length > 0 ? (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {selectedPatient.medications.map((m, i) => (
                            <div key={i} className="flex justify-between items-center p-2.5 bg-gray-55/35 dark:bg-zinc-850/30 rounded-xl text-xs">
                              <div>
                                <span className="font-semibold text-gray-900 dark:text-white">{m.name}</span>
                                <span className="ml-2 text-gray-400 font-normal">({m.dose})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400">{m.date} {m.time}</span>
                                <span className={`badge ${m.status === 'given' ? 'badge-success' : 'badge-warning'}`}>
                                  {m.status === 'given' ? 'Berildi' : 'Kutilmoqda'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-xs text-gray-400 italic text-center py-4 bg-gray-50/50 dark:bg-zinc-800/10 rounded-xl border border-dashed border-gray-200">Dori berish jurnali bo&apos;sh</p>}
                    </div>

                    {/* Diet details */}
                    {selectedPatient.diet ? (
                      <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/10 dark:to-orange-950/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl text-xs">
                        <h6 className="font-bold text-amber-700 dark:text-amber-400 mb-2">🍽️ Parhez va ovqatlanish rejasi</h6>
                        <p><span className="text-gray-500">Parhez turi:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedPatient.diet.type}</span></p>
                        {selectedPatient.diet.restrictions && <p className="mt-1 text-gray-500">Taqiqlar: <span className="font-medium text-gray-800 dark:text-gray-200">{selectedPatient.diet.restrictions.join(', ') || selectedPatient.diet.restrictions}</span></p>}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-450 italic text-center py-3">Bemor uchun maxsus parhez tayinlanmagan</p>
                    )}
                  </div>
                )}

                {/* 4. FINANCIAL TAB */}
                {drawerTab === 'financial' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/10 dark:to-orange-950/10 rounded-2xl p-5 border border-yellow-200/50 dark:border-yellow-900/20">
                      <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-400 mb-4 flex items-center gap-1.5"><Wallet size={16} /> Balans holati</h4>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-yellow-100 dark:border-zinc-800 shadow-sm">
                          <p className="text-[10px] text-gray-400 uppercase font-semibold">Jami hisob</p>
                          <p className="text-base font-bold text-gray-900 dark:text-white font-mono mt-1">{formatMoney(totalBilled)}</p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-yellow-100 dark:border-zinc-800 shadow-sm">
                          <p className="text-[10px] text-gray-400 uppercase font-semibold font-green-600">To&apos;langan</p>
                          <p className="text-base font-bold text-green-650 font-mono mt-1">{formatMoney(totalPaid)}</p>
                        </div>
                        <div className={`rounded-xl p-3 shadow-sm border-2 ${debt > 0 ? 'bg-red-50/50 dark:bg-red-950/10 border-red-200' : 'bg-green-50/50 dark:bg-green-950/10 border-green-200'}`}>
                          <p className="text-[10px] text-gray-500 uppercase font-bold">{debt > 0 ? 'Qarz' : 'Holat'}</p>
                          <p className={`text-base font-extrabold font-mono mt-1 ${debt > 0 ? 'text-red-600' : 'text-green-600'}`}>{debt > 0 ? formatMoney(debt) : "Qarz yo'q"}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1.5"><CreditCard size={14} /> To&apos;lovlar operatsiyalari jurnali</h5>
                      {patPayments.length > 0 ? (
                        <div className="overflow-x-auto border border-gray-100 dark:border-zinc-800 rounded-xl">
                          <table className="data-table text-xs">
                            <thead>
                              <tr>
                                <th>ID / Sana</th>
                                <th>Xizmatlar</th>
                                <th>Jami narxi</th>
                                <th>Chegirma</th>
                                <th>To&apos;langan</th>
                                <th>Usul</th>
                              </tr>
                            </thead>
                            <tbody>
                              {patPayments.map(p => (
                                <tr key={p.id}>
                                  <td>
                                    <div className="font-semibold text-gray-700 dark:text-gray-300">{p.id.split('-').pop()}</div>
                                    <div className="text-[9px] text-gray-400">{p.date}</div>
                                  </td>
                                  <td className="max-w-[150px] truncate text-gray-700 dark:text-gray-300" title={p.services?.join(', ')}>
                                    {p.services?.join(', ') || '—'}
                                  </td>
                                  <td className="font-mono">{formatMoney(p.totalAmount)}</td>
                                  <td className="font-mono text-gray-400">{p.discount ? `-${formatMoney(p.discount)}` : '0'}</td>
                                  <td className="font-mono font-bold text-green-650">{formatMoney(p.paid)}</td>
                                  <td>
                                    <span className="badge badge-info">{p.method || 'Naqd'}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : <p className="text-xs text-gray-400 italic text-center py-6 bg-gray-50/50 dark:bg-zinc-800/10 rounded-2xl border border-dashed border-gray-200">To&apos;lovlar tarixi mavjud emas</p>}
                    </div>
                  </div>
                )}

                {/* 5. DOCUMENTS TAB */}
                {drawerTab === 'documents' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                      <h5 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1.5">📁 Analizlar, Rentgen va Tibbiy Hujjatlar</h5>
                      <label className="btn btn-primary btn-sm cursor-pointer py-1.5 px-4 text-xs">
                        <Upload size={14} /> Yangi fayl qo&apos;shish
                        <input type="file" multiple className="hidden" onChange={handleHistoryFileUpload} />
                      </label>
                    </div>

                    {selectedPatient.files && selectedPatient.files.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedPatient.files.map(file => (
                          <div key={file.id} className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm text-xs">
                            <div className="flex items-center gap-2 truncate max-w-[70%]">
                              <span className="text-2xl shrink-0">{getFileIcon(file.name)}</span>
                              <div className="truncate">
                                <p className="font-semibold text-gray-850 dark:text-gray-200 truncate" title={file.name}>{file.name}</p>
                                <p className="text-[10px] text-gray-400">{(file.size / 1024).toFixed(1)} KB • {file.date}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <a href={file.content} download={file.name} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-550/10 text-blue-500 flex items-center justify-center" title="Yuklab olish">
                                <Download size={14} />
                              </a>
                              <button type="button" onClick={() => handleHistoryFileDelete(file.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-550/10 text-red-500 flex items-center justify-center border-none bg-transparent" title="O'chirish">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center border border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl bg-gray-50/50 dark:bg-zinc-900/10 text-gray-400 text-xs italic">
                        Ushbu bemor uchun hozircha analiz natijalari va tibbiy hujjatlar yuklanmagan
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          );
        })()}
      </Drawer>
    </div>
  );
}

// ===== TREATMENT PLANNING =====
function TreatmentPlanning() {
  const { patients, services, treatments, addTreatment, updateTreatment, deleteTreatment, smsQueue, addPatient } = useCrm();
  const toast = useToast();
  
  const [selectedPatient, setSelectedPatient] = useState("");
  const [newPatientFirstName, setNewPatientFirstName] = useState("");
  const [newPatientLastName, setNewPatientLastName] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [customServiceText, setCustomServiceText] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState("17:00");
  const [durationDays, setDurationDays] = useState(10);
  const [frequency, setFrequency] = useState("Kunda");
  const [price, setPrice] = useState("");
  const [smsOffsetMinutes, setSmsOffsetMinutes] = useState(30);

  // Edit states
  const [editingTreatment, setEditingTreatment] = useState(null);
  const [editForm, setEditForm] = useState({ startDate: '', time: '', price: 0, smsOffsetMinutes: 30, frequency: 'Kunda' });
  const [confirmCancel, setConfirmCancel] = useState(null);

  const handleServiceChange = (e) => {
    const val = e.target.value;
    setSelectedService(val);
    if (val && val !== 'custom') {
      const srv = services.find(s => s.id === val);
      if (srv) {
        setPrice(srv.price);
      }
    } else {
      setPrice("");
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!selectedPatient) { toast("Bemor tanlanishi shart!", "error"); return; }
    
    let treatmentName = "";
    if (selectedService === 'custom') {
      treatmentName = customServiceText;
    } else {
      treatmentName = services.find(s => s.id === selectedService)?.name || "";
    }
    
    if (!treatmentName) { toast("Muolaja nomi tanlanishi yoki yozilishi shart!", "error"); return; }
    if (!price || Number(price) <= 0) { toast("Muolaja narxi kiritilishi shart!", "error"); return; }

    let patient = null;
    let patientId = selectedPatient;

    if (selectedPatient === 'new') {
      if (!newPatientFirstName || !newPatientLastName || !newPatientPhone) {
        toast("Yangi bemor ma'lumotlarini to'liq kiriting!", "error");
        return;
      }
      const normalizedPhone = normalizeUzPhone(newPatientPhone);
      if (!normalizedPhone) {
        toast("Telefon raqami noto'g'ri kiritildi!", 'error');
        return;
      }
      
      const newPatientObj = addPatient({
        firstName: newPatientFirstName,
        lastName: newPatientLastName,
        phone: normalizedPhone,
        visitReason: `Muolaja: ${treatmentName}`,
        status: 'ambulatoriya',
        gender: 'Erkak',
        birthDate: '',
        nationality: "O'zbek",
        address: { region: 'Toshkent', district: '', street: '' },
        bloodGroup: '',
        allergies: [],
        chronicDiseases: [],
      });
      patient = newPatientObj;
      patientId = newPatientObj.id;
    } else {
      patient = patients.find(p => p.id === selectedPatient);
      if (!patient) { toast("Bemor tanlanishi shart!", "error"); return; }
    }

    // Check conflicts (double-booking)
    const newDates = [];
    let curDate = new Date(startDate);
    for (let i = 0; i < Number(durationDays); i++) {
      newDates.push(curDate.toISOString().split('T')[0]);
      curDate.setDate(curDate.getDate() + (frequency === 'Kunda' ? 1 : 2));
    }

    const patientTreatments = treatments.filter(t => t.patientId === patientId && t.status === 'active');
    let conflictFound = null;

    for (const t of patientTreatments) {
      if (t.time === startTime) {
        const existingDates = [];
        let eDate = new Date(t.startDate);
        for (let j = 0; j < t.durationDays; j++) {
          existingDates.push(eDate.toISOString().split('T')[0]);
          eDate.setDate(eDate.getDate() + (t.frequency === 'Kunda' ? 1 : 2));
        }

        const overlap = newDates.find(d => existingDates.includes(d));
        if (overlap) {
          conflictFound = { treatment: t, date: overlap };
          break;
        }
      }
    }

    if (conflictFound) {
      const proceed = window.confirm(
        `Ogohlantirish! Bemor ${patient.firstName} ${patient.lastName}da shu vaqtda (${startTime}) allaqachon faol "${conflictFound.treatment.treatmentName}" muolajasi rejalashtirilgan (${conflictFound.date} kuni kesishadi). Baribir davom ettirilsinmi?`
      );
      if (!proceed) return;
    }

    addTreatment({
      patientId: patientId,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientPhone: patient.phone,
      treatmentName,
      startDate,
      time: startTime,
      durationDays: Number(durationDays),
      frequency,
      price: Number(price),
      smsOffsetMinutes: Number(smsOffsetMinutes),
    });

    toast("Yangi muolaja rejasi muvaffaqiyatli yaratildi va SMSlar rejalashtiriladi!", "success");
    setSelectedPatient("");
    setNewPatientFirstName("");
    setNewPatientLastName("");
    setNewPatientPhone("");
    setSelectedService("");
    setCustomServiceText("");
    setPrice("");
    setDurationDays(10);
    setFrequency("Kunda");
    setStartTime("17:00");
  };

  const handleEditOpen = (treatment) => {
    setEditingTreatment(treatment);
    setEditForm({
      startDate: treatment.startDate,
      time: treatment.time,
      price: treatment.price,
      smsOffsetMinutes: treatment.smsOffsetMinutes || 30,
      frequency: treatment.frequency || 'Kunda'
    });
  };

  const handleEditSubmit = () => {
    if (!editForm.startDate || !editForm.time || Number(editForm.price) <= 0) {
      toast("Barcha maydonlarni to'g'ri to'ldiring", "error");
      return;
    }

    // Check conflicts (double-booking) for edited treatment
    const newDates = [];
    let curDate = new Date(editForm.startDate);
    for (let i = 0; i < Number(editingTreatment.durationDays); i++) {
      newDates.push(curDate.toISOString().split('T')[0]);
      curDate.setDate(curDate.getDate() + (editForm.frequency === 'Kunda' ? 1 : 2));
    }

    const patientTreatments = treatments.filter(t => t.patientId === editingTreatment.patientId && t.id !== editingTreatment.id && t.status === 'active');
    let conflictFound = null;

    for (const t of patientTreatments) {
      if (t.time === editForm.time) {
        const existingDates = [];
        let eDate = new Date(t.startDate);
        for (let j = 0; j < t.durationDays; j++) {
          existingDates.push(eDate.toISOString().split('T')[0]);
          eDate.setDate(eDate.getDate() + (t.frequency === 'Kunda' ? 1 : 2));
        }

        const overlap = newDates.find(d => existingDates.includes(d));
        if (overlap) {
          conflictFound = { treatment: t, date: overlap };
          break;
        }
      }
    }

    if (conflictFound) {
      const proceed = window.confirm(
        `Ogohlantirish! Bemorga shu yangi vaqtda (${editForm.time}) allaqachon faol "${conflictFound.treatment.treatmentName}" muolajasi rejalashtirilgan (${conflictFound.date} kuni kesishadi). Baribir davom ettirilsinmi?`
      );
      if (!proceed) return;
    }

    updateTreatment(editingTreatment.id, {
      startDate: editForm.startDate,
      time: editForm.time,
      price: Number(editForm.price),
      smsOffsetMinutes: Number(editForm.smsOffsetMinutes),
      frequency: editForm.frequency
    });
    toast("Muolaja rejasi va rejalashtirilgan SMSlar yangilandi!", "success");
    setEditingTreatment(null);
  };

  const handleCancelConfirm = () => {
    deleteTreatment(confirmCancel.id);
    toast("Muolaja rejasi bekor qilindi va SMSlar o'chirildi", "success");
    setConfirmCancel(null);
  };

  const printTreatmentPlan = (treatment) => {
    const printWindow = window.open('', '_blank', 'width=450,height=700');
    if (!printWindow) {
      alert("Iltimos, qalqib chiquvchi oynalar (popup) bloklanishini taqiqlab qayta urining.");
      return;
    }
    
    const sessions = [];
    let curDate = new Date(treatment.startDate);
    for (let i = 0; i < treatment.durationDays; i++) {
      sessions.push(new Date(curDate).toLocaleDateString('uz-UZ'));
      if (treatment.frequency === 'Kunda') {
        curDate.setDate(curDate.getDate() + 1);
      } else {
        curDate.setDate(curDate.getDate() + 2);
      }
    }

    const rowsHtml = sessions.map((sDate, idx) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${idx + 1}-seans</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${sDate}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${treatment.time}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Muolaja Rejasi - ${treatment.patientName}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 25px; color: #333; max-width: 400px; margin: 0 auto; line-height: 1.5; }
            .header { text-align: center; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: bold; color: #1a1a1a; letter-spacing: 0.5px; }
            .subtitle { font-size: 12px; color: #666; margin-top: 4px; text-transform: uppercase; }
            .divider { border-top: 1px dashed #ccc; margin: 15px 0; }
            .details { text-align: left; font-size: 13px; background: #f9f9f9; padding: 12px; rounded: 8px; margin-bottom: 15px; }
            .details p { margin: 6px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
            th { background-color: #f5f5f5; padding: 8px; font-weight: bold; border-bottom: 2px solid #ddd; }
            .footer { font-size: 11px; text-align: center; color: #777; margin-top: 20px; font-style: italic; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">KLINIKA CRM</div>
            <div class="subtitle">Muolaja va Davolanish Rejasi</div>
          </div>
          <div class="divider"></div>
          <div class="details">
            <p><strong>Bemor:</strong> ${treatment.patientName}</p>
            <p><strong>Muolaja:</strong> ${treatment.treatmentName}</p>
            <p><strong>Boshlanish sanasi:</strong> ${treatment.startDate}</p>
            <p><strong>Davomiyligi:</strong> ${treatment.durationDays} kun (${treatment.frequency === 'Kunda' ? 'har kuni' : 'kun ora'})</p>
            <p><strong>Umumiy narxi:</strong> ${Number(treatment.price).toLocaleString()} so'm</p>
          </div>
          <div class="divider"></div>
          <h4 style="margin: 10px 0; text-align: center;">Muolajalar jadvali</h4>
          <table>
            <thead>
              <tr><th>Kun</th><th>Sana</th><th>Vaqt</th></tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="divider"></div>
          <div class="footer">
            * Seanslardan ${treatment.smsOffsetMinutes || 30} daqiqa oldin sizga eslatma SMS yuboriladi.<br>
            Sog'ligingiz — bizning baxtimiz!
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 300);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const activeTreatments = treatments.filter(t => t.status !== 'cancelled').reverse();

  const baseUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : 'http://localhost:3000';
  const scheduledApiUrl = `${baseUrl}/api/sms/scheduled`;

  return (
    <div>
      <Header title="Licheniya (Muolaja) Rejalash" subtitle="Bemorlarga muolajalar rejalashtirish va SMS bildirishnomalarini boshqarish" role="reception" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="card p-5 flex flex-col gap-4 border-t-4 border-t-blue-500 shadow-md">
            <h3 className="font-bold text-gray-900 mb-2 border-b border-gray-100 pb-2">Yangi muolaja rejalash</h3>
            
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Bemor tanlash *</label>
                <select className="input select py-2" value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)} required>
                  <option value="">Bemor tanlang...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.id})</option>)}
                  <option value="new">-- Yangi bemor qo&apos;shish --</option>
                </select>
              </div>

              {selectedPatient === 'new' && (
                <div className="space-y-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-black/5 animate-fadeIn">
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Yangi bemor ma&apos;lumotlari:</p>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">Ism *</label>
                    <input className="input py-1.5 text-xs" value={newPatientFirstName} onChange={e => setNewPatientFirstName(e.target.value)} placeholder="Aziz" required={selectedPatient === 'new'} />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">Familiya *</label>
                    <input className="input py-1.5 text-xs" value={newPatientLastName} onChange={e => setNewPatientLastName(e.target.value)} placeholder="Aliyev" required={selectedPatient === 'new'} />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">Telefon raqam *</label>
                    <input className="input py-1.5 text-xs" value={newPatientPhone} onChange={e => setNewPatientPhone(e.target.value)} placeholder="+998 90 123 45 67" required={selectedPatient === 'new'} />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Muolaja turi *</label>
                <select className="input select py-2" value={selectedService} onChange={handleServiceChange} required>
                  <option value="">Tanlang...</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
                  <option value="custom">-- Boshqa (Qo&apos;lda yozish) --</option>
                </select>
              </div>

              {selectedService === 'custom' && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Muolaja nomi (Qo&apos;lda) *</label>
                  <input className="input py-2" value={customServiceText} onChange={e => setCustomServiceText(e.target.value)} placeholder="Masalan: Elektrik stimulyatsiya" required />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Boshlanish sanasi</label>
                  <input className="input py-2 text-xs" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Kunlik vaqti *</label>
                  <input className="input py-2 text-xs" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Davomiyligi (kun/seans)</label>
                  <input className="input py-2" type="number" min={1} max={90} value={durationDays} onChange={e => setDurationDays(e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Davriylik *</label>
                  <select className="input select py-2" value={frequency} onChange={e => setFrequency(e.target.value)} required>
                    <option value="Kunda">Har kuni (Kunda)</option>
                    <option value="Kun ora">Kun ora</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Umumiy narxi (so&apos;m) *</label>
                  <input className="input py-2 font-mono font-semibold" type="number" value={price} onChange={e => setPrice(e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Eslatma SMSi (daqiqa oldin)</label>
                  <input className="input py-2" type="number" min={5} max={360} value={smsOffsetMinutes} onChange={e => setSmsOffsetMinutes(e.target.value)} required />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full py-2.5 font-semibold text-sm">
                Muolajani saqlash va rejalash
              </button>
            </form>
          </div>

          <div className="card p-5 flex flex-col gap-4 border-t-4 border-t-purple-500 shadow-md">
            <h3 className="font-bold text-gray-900 mb-1 border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <Copy size={16} className="text-purple-500" />
              <span>SMS Gateway Ulanishi</span>
            </h3>
            <p className="text-[10px] text-gray-500 leading-normal">Android eslatma ilovasida API poller rejimini ushbu manzildan eslatmalarni olishga sozlang:</p>
            <div className="bg-gray-50 dark:bg-white/5 p-2.5 rounded-xl border border-black/5 flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold text-gray-500">Majburiy (Muolaja) SMS API:</span>
              <div className="flex items-center justify-between gap-2 bg-white dark:bg-white/10 p-2 rounded-lg border border-black/5">
                <span className="font-mono text-[10px] text-gray-600 dark:text-gray-300 break-all select-all flex-1 truncate">
                  {scheduledApiUrl}
                </span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(scheduledApiUrl);
                    toast("Havola nusxalandi!", "success");
                  }}
                  className="btn btn-outline btn-xs p-1 text-[10px] font-semibold shrink-0"
                >
                  Nusxa
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 card p-5 flex flex-col gap-4 shadow-md">
          <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Faol muolaja rejalari</h3>

          <div className="overflow-x-auto border border-gray-100 dark:border-white/5 rounded-xl">
            <table className="data-table text-xs">
              <thead>
                <tr>
                  <th>Bemor</th>
                  <th>Muolaja</th>
                  <th>Grafik</th>
                  <th>Jami narxi</th>
                  <th>SMS Eslatma</th>
                  <th>SMS holati</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {activeTreatments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-gray-400 italic">Faol muolajalar mavjud emas</td>
                  </tr>
                ) : (
                  activeTreatments.map(t => {
                    const relatedSms = smsQueue.filter(s => s.treatmentId === t.id);
                    const sentSms = relatedSms.filter(s => s.status === 'sent').length;
                    const pendingSms = relatedSms.filter(s => s.status === 'pending').length;
                    
                    return (
                      <tr key={t.id}>
                        <td>
                          <p className="font-semibold text-gray-900">{t.patientName}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{t.patientPhone}</p>
                        </td>
                        <td className="font-medium">{t.treatmentName}</td>
                        <td>
                          <p>{t.startDate}</p>
                          <p className="text-[10px] text-gray-500">{t.durationDays} kun / {t.time} / {t.frequency}</p>
                        </td>
                        <td className="font-bold font-mono text-gray-900">{Number(t.price).toLocaleString()} so&apos;m</td>
                        <td>{t.smsOffsetMinutes || 30} daqiqa oldin</td>
                        <td>
                          <span className="badge badge-success font-mono">{sentSms} ta yuborildi</span>
                          <span className="badge badge-warning font-mono ml-1">{pendingSms} ta kutilmoqda</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button className="btn btn-icon btn-outline btn-sm" onClick={() => handleEditOpen(t)} title="Tahrirlash">
                              <Edit size={12} />
                            </button>
                            <button className="btn btn-icon btn-outline btn-sm text-red-500" onClick={() => setConfirmCancel(t)} title="Bekor qilish">
                              <XCircle size={12} />
                            </button>
                            <button className="btn btn-icon btn-outline btn-sm text-blue-500" onClick={() => printTreatmentPlan(t)} title="Chop etish">
                              <Printer size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={!!editingTreatment} onClose={() => setEditingTreatment(null)} title={`Muolajani tahrirlash: ${editingTreatment?.treatmentName}`}>
        {editingTreatment && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Boshlanish sanasi</label>
              <input className="input py-2" type="date" value={editForm.startDate} onChange={e => setEditForm({ ...editForm, startDate: e.target.value })} required />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Kunlik vaqti</label>
                <input className="input py-2" type="time" value={editForm.time} onChange={e => setEditForm({ ...editForm, time: e.target.value })} required />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Davriylik</label>
                <select className="input select py-2" value={editForm.frequency} onChange={e => setEditForm({ ...editForm, frequency: e.target.value })} required>
                  <option value="Kunda">Har kuni (Kunda)</option>
                  <option value="Kun ora">Kun ora</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Umumiy narxi (so&apos;m)</label>
                <input className="input py-2 font-mono font-semibold" type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} required />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Eslatma SMSi (daqiqa oldin)</label>
                <input className="input py-2" type="number" value={editForm.smsOffsetMinutes} onChange={e => setEditForm({ ...editForm, smsOffsetMinutes: e.target.value })} required />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button className="btn btn-outline" onClick={() => setEditingTreatment(null)}>Bekor qilish</button>
              <button className="btn btn-primary" onClick={handleEditSubmit}>O&apos;zgarishlarni saqlash</button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmCancel}
        title="Muolajani bekor qilish"
        message={`${confirmCancel?.patientName} ga rejalashtirilgan "${confirmCancel?.treatmentName}" muolajasini bekor qilmoqchimisiz? Buning natijasida barcha kelgusi rejalashtirilgan eslatma SMSlari o&apos;chiriladi!`}
        onConfirm={handleCancelConfirm}
        onCancel={() => setConfirmCancel(null)}
        confirmText="Ha, bekor qilinsin"
        danger={true}
      />
    </div>
  );
}

// ===== EXPENSE SECTION (RASXODLAR) =====
const EXPENSE_CATEGORIES = [
  'Oziq-ovqat', 'Dori-darmon', 'Kommunal xizmatlar', 'Transport',
  'Ish haqi', 'Jihozlar', "Ta'mirlash", 'Ofis buyumlari', 'Boshqa'
];

const STAFF_PAY_TYPES = [
  { key: 'advance', label: "Avans (oylikdan ayiriladi)" },
  { key: 'loan',    label: "Qarz (keyinroq qaytariladi)" },
  { key: 'bonus',   label: "Bonus (oylikka qo'shiladi)" },
  { key: 'salary',  label: "Oylik to'lov" },
  { key: 'penalty', label: "Jarima (oylikdan ayiriladi)" },
];

function ExpenseSection() {
  const { expenses, addExpense, addIncome, staff, updateStaff, finances, setFinances: updateFinances, addActivityLogEntry } = useCrm();
  const toast = useToast();
  const today = new Date().toISOString().split('T')[0];

  const emptyForm = {
    description: '', amount: '', category: 'Boshqa',
    paymentMethod: 'Naqd', date: today, note: '',
    staffId: '', staffPayType: 'advance'
  };
  const emptyIncomeForm = {
    description: '', amount: '', date: today
  };
  const [form, setForm] = useState(emptyForm);
  const [incomeForm, setIncomeForm] = useState(emptyIncomeForm);
  const [showForm, setShowForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);

  // Separate income and expense entries
  const allEntries = expenses || [];
  const expenseEntries = allEntries.filter(e => e.type !== 'income');
  const incomeEntries = allEntries.filter(e => e.type === 'income');

  const totalExpenseToday = expenseEntries.filter(e => e.date === today).reduce((s, e) => s + (e.amount || 0), 0);
  const totalExpenseAll = expenseEntries.reduce((s, e) => s + (e.amount || 0), 0);
  const totalIncomeToday = incomeEntries.filter(e => e.date === today).reduce((s, e) => s + (e.amount || 0), 0);
  const totalIncomeAll = incomeEntries.reduce((s, e) => s + (e.amount || 0), 0);

  // Compute each staff member's net salary (deducting advances/loans/penalties)
  const staffBalance = useMemo(() => {
    return staff.map(member => {
      const ph = member.paymentHistory || [];
      const totalAdvances  = ph.filter(p => p.type === 'advance').reduce((s, p) => s + p.amount, 0);
      const totalLoans     = ph.filter(p => p.type === 'loan').reduce((s, p) => s + p.amount, 0);
      const totalRepaid    = ph.filter(p => p.type === 'loan_repayment').reduce((s, p) => s + p.amount, 0);
      const totalBonuses   = ph.filter(p => p.type === 'bonus').reduce((s, p) => s + p.amount, 0);
      const totalPenalties = ph.filter(p => p.type === 'penalty').reduce((s, p) => s + p.amount, 0);
      const deductions = totalAdvances + totalLoans - totalRepaid + totalPenalties;
      const netSalary  = Math.max(0, (member.salary || 0) + totalBonuses - deductions);
      return { ...member, totalAdvances, totalLoans, totalRepaid, totalBonuses, totalPenalties, deductions, netSalary };
    });
  }, [staff]);

  const selectedStaffInfo = useMemo(() => {
    if (!form.staffId) return null;
    return staffBalance.find(m => m.id === form.staffId);
  }, [form.staffId, staffBalance]);

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!form.description || !form.amount || Number(form.amount) <= 0) {
      toast("Tavsif va summani to'ldiring", 'error'); return;
    }

    // If salary expense and staff selected → record in staff paymentHistory
    if (form.category === 'Ish haqi' && form.staffId) {
      const member = staff.find(s => s.id === form.staffId);
      if (member) {
        const newPay = {
          id: `PAY-${Date.now()}`, type: form.staffPayType,
          amount: Number(form.amount), note: form.note || form.description,
          date: form.date, by: 'Resepshion'
        };
        const paymentHistory = [...(member.paymentHistory || []), newPay];
        updateStaff(form.staffId, { paymentHistory });
        if (addActivityLogEntry) {
          addActivityLogEntry({
            user: 'Resepshion',
            action: `Xodimga ${STAFF_PAY_TYPES.find(t => t.key === form.staffPayType)?.label || form.staffPayType} berildi`,
            target: `${member.firstName} ${member.lastName} — ${Number(form.amount).toLocaleString()} so'm`
          });
        }
      }
    }

    addExpense({ ...form, amount: Number(form.amount) });
    toast(`Xarajat yozildi: ${formatMoney(Number(form.amount))} so'm`, 'success');
    setForm(emptyForm); setShowForm(false);
  };

  const handleIncomeSubmit = (ev) => {
    ev.preventDefault();
    if (!incomeForm.description || !incomeForm.amount || Number(incomeForm.amount) <= 0) {
      toast("Sabab va summani to'ldiring", 'error'); return;
    }
    addIncome({ description: incomeForm.description, amount: Number(incomeForm.amount), date: incomeForm.date });
    toast(`Kirim yozildi: ${formatMoney(Number(incomeForm.amount))} so'm`, 'success');
    setIncomeForm(emptyIncomeForm); setShowIncomeForm(false);
  };

  const sortedEntries = [...allEntries].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

  return (
    <div>
      <Header title="Xarajatlar va Kirimlar" subtitle="Kunlik kirim-chiqimlarni qayd etish" role="reception" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="card p-4 border-l-4 border-l-red-500">
          <p className="text-xs text-gray-500 mb-1">Bugungi chiqim</p>
          <p className="text-xl font-bold text-red-600">{formatMoney(totalExpenseToday)} so&apos;m</p>
        </div>
        <div className="card p-4 border-l-4 border-l-orange-400">
          <p className="text-xs text-gray-500 mb-1">Jami chiqim</p>
          <p className="text-xl font-bold text-orange-600">{formatMoney(totalExpenseAll)} so&apos;m</p>
        </div>
        <div className="card p-4 border-l-4 border-l-green-500">
          <p className="text-xs text-gray-500 mb-1">Bugungi kirim</p>
          <p className="text-xl font-bold text-green-600">{formatMoney(totalIncomeToday)} so&apos;m</p>
        </div>
        <div className="card p-4 border-l-4 border-l-emerald-400">
          <p className="text-xs text-gray-500 mb-1">Jami kirim</p>
          <p className="text-xl font-bold text-emerald-600">{formatMoney(totalIncomeAll)} so&apos;m</p>
        </div>
      </div>

      {/* Staff salary summary — always visible if any deductions exist */}
      {staffBalance.some(s => s.deductions > 0 || s.totalBonuses > 0) && (
        <div className="card p-5 mb-5 border-t-4 border-t-yellow-500">
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Wallet size={18} className="text-yellow-500" /> Xodimlar maosh holati (avans / qarz / bonus)
          </h4>
          <div className="overflow-x-auto">
            <table className="data-table text-xs">
              <thead>
                <tr>
                  <th>Xodim</th>
                  <th>Asosiy maosh</th>
                  <th>Bonus</th>
                  <th>Avans</th>
                  <th>Qarz (qoldig&apos;i)</th>
                  <th>Jarima</th>
                  <th className="text-green-700 bg-green-50">Berish kerak</th>
                </tr>
              </thead>
              <tbody>
                {staffBalance.filter(s => s.active).map(m => (
                  <tr key={m.id}>
                    <td className="font-semibold">
                      {m.firstName} {m.lastName}
                      <span className="ml-1 text-gray-400 font-normal text-[10px]">({m.role})</span>
                    </td>
                    <td className="font-mono">{formatMoney(m.salary || 0)}</td>
                    <td className="font-mono text-green-600">+{formatMoney(m.totalBonuses)}</td>
                    <td className="font-mono text-orange-600">-{formatMoney(m.totalAdvances)}</td>
                    <td className="font-mono text-red-600">-{formatMoney(Math.max(0, m.totalLoans - m.totalRepaid))}</td>
                    <td className="font-mono text-amber-600">-{formatMoney(m.totalPenalties)}</td>
                    <td className="font-mono font-bold text-green-700 text-base bg-green-50 dark:bg-green-900/20">
                      {formatMoney(m.netSalary)} so&apos;m
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add buttons */}
      <div className="flex flex-wrap justify-end gap-3 mb-4">
        <button className="btn btn-success" onClick={() => { setShowIncomeForm(!showIncomeForm); setShowForm(false); }}>
          <TrendingUp size={16} /> Kirim yozish
        </button>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setShowIncomeForm(false); }}>
          <Plus size={16} /> Xarajat yozish
        </button>
      </div>

      {/* Income Form */}
      {showIncomeForm && (
        <div className="card p-5 mb-5 border-t-4 border-t-green-500 animate-fadeIn">
          <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-green-500" /> Kirim qo&apos;shish
          </h4>
          <form onSubmit={handleIncomeSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Sabab / Tavsif *</label>
              <input className="input" placeholder="Masalan: Homiy pul tashlab ketdi"
                value={incomeForm.description} onChange={e => setIncomeForm({ ...incomeForm, description: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Summa (so&apos;m) *</label>
              <input className="input font-mono font-bold" type="number" placeholder="0"
                value={incomeForm.amount} onChange={e => setIncomeForm({ ...incomeForm, amount: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Sana</label>
              <input className="input" type="date" value={incomeForm.date}
                onChange={e => setIncomeForm({ ...incomeForm, date: e.target.value })} />
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-3">
              <button type="button" className="btn btn-outline"
                onClick={() => { setShowIncomeForm(false); setIncomeForm(emptyIncomeForm); }}>Bekor</button>
              <button type="submit" className="btn btn-success">
                <TrendingUp size={16} /> Kirimni saqlash
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expense Form */}
      {showForm && (
        <div className="card p-5 mb-5 border-t-4 border-t-red-500 animate-fadeIn">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Receipt size={18} className="text-red-500" /> Xarajat qo&apos;shish
          </h4>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Description */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Tavsif *</label>
              <input className="input" placeholder="Masalan: Transport xarajati"
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
            </div>
            {/* Amount */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Summa (so&apos;m) *</label>
              <input className="input font-mono font-bold" type="number" placeholder="0"
                value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
            </div>
            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Kategoriya</label>
              <select className="input select" value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value, staffId: '', staffPayType: 'advance' })}>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* ===== SALARY-SPECIFIC FIELDS ===== */}
            {form.category === 'Ish haqi' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Xodim tanlang</label>
                  <select className="input select" value={form.staffId}
                    onChange={e => setForm({ ...form, staffId: e.target.value })}>
                    <option value="">— Xodimni tanlang —</option>
                    {staffBalance.filter(s => s.active).map(m => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} · berish kerak: {formatMoney(m.netSalary)} so&apos;m
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">To&apos;lov turi</label>
                  <select className="input select" value={form.staffPayType}
                    onChange={e => setForm({ ...form, staffPayType: e.target.value })}>
                    {STAFF_PAY_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </select>
                </div>

                {/* Staff balance card */}
                {selectedStaffInfo && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 dark:border-yellow-700 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4">
                      <p className="text-xs font-bold text-gray-600 uppercase mb-3">
                        📋 {selectedStaffInfo.firstName} {selectedStaffInfo.lastName} — Maosh holati
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
                          <p className="text-[10px] text-gray-400">Asosiy maosh</p>
                          <p className="text-sm font-bold text-gray-800">{formatMoney(selectedStaffInfo.salary || 0)}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
                          <p className="text-[10px] text-gray-400">Bonus</p>
                          <p className="text-sm font-bold text-green-600">+{formatMoney(selectedStaffInfo.totalBonuses)}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
                          <p className="text-[10px] text-gray-400">Avans</p>
                          <p className="text-sm font-bold text-orange-500">-{formatMoney(selectedStaffInfo.totalAdvances)}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
                          <p className="text-[10px] text-gray-400">Qarz (qolg&apos;i)</p>
                          <p className="text-sm font-bold text-red-500">-{formatMoney(Math.max(0, selectedStaffInfo.totalLoans - selectedStaffInfo.totalRepaid))}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
                          <p className="text-[10px] text-gray-400">Jarima</p>
                          <p className="text-sm font-bold text-amber-500">-{formatMoney(selectedStaffInfo.totalPenalties)}</p>
                        </div>
                        <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-2 border-2 border-green-400">
                          <p className="text-[10px] text-green-600 font-bold">BERISH KERAK</p>
                          <p className="text-base font-extrabold text-green-700">{formatMoney(selectedStaffInfo.netSalary)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Payment method */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">To&apos;lov usuli</label>
              <select className="input select" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                <option>Naqd</option><option>Karta</option><option>Bank o&apos;tkazmasi</option>
              </select>
            </div>
            {/* Date */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Sana</label>
              <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            {/* Note */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Izoh</label>
              <input className="input" placeholder="Qo'shimcha izoh..."
                value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-3">
              <button type="button" className="btn btn-outline"
                onClick={() => { setShowForm(false); setForm(emptyForm); }}>Bekor</button>
              <button type="submit" className="btn btn-danger">
                <TrendingDown size={16} /> Xarajatni saqlash
              </button>
            </div>
          </form>
        </div>
      )}

      {/* All Entries List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Turi</th>
                <th>Sana</th><th>Tavsif</th><th>Kategoriya</th>
                <th>Summa</th><th>Izoh</th>
              </tr>
            </thead>
            <tbody>
              {sortedEntries.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400 italic">Yozuvlar mavjud emas</td></tr>
              ) : (
                sortedEntries.map(exp => (
                  <tr key={exp.id} className={exp.type === 'income' ? 'bg-green-50/50 dark:bg-green-900/10' : ''}>
                    <td>
                      {exp.type === 'income' ? (
                        <span className="badge badge-success flex items-center gap-1 w-fit">
                          <TrendingUp size={12} /> Kirim
                        </span>
                      ) : (
                        <span className="badge badge-danger flex items-center gap-1 w-fit">
                          <TrendingDown size={12} /> Chiqim
                        </span>
                      )}
                    </td>
                    <td className="text-sm font-medium">{exp.date}</td>
                    <td className="text-sm font-semibold text-gray-900 dark:text-white">{exp.description}</td>
                    <td>{exp.type === 'income' ? <span className="badge badge-success">Kirim</span> : <span className="badge badge-warning">{exp.category}</span>}</td>
                    <td className={`text-sm font-bold font-mono ${exp.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {exp.type === 'income' ? '+' : '-'}{formatMoney(exp.amount)} so&apos;m
                    </td>
                    <td className="text-xs text-gray-500">{exp.note || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

