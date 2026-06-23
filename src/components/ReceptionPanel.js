'use client';

import { useState, useMemo, useCallback } from 'react';
import { useCrm } from '@/lib/CrmContext';
import { ROLES, BLOOD_GROUPS, ROOM_STATUSES, generateId } from '@/lib/demoData';
import {
  Sidebar, Header, StatCard, Modal, TabNav, useToast,
  formatMoney, formatDate, getAge, EmptyState, ConfirmDialog, ProfileSettings,
  PatientHistorySection, normalizeUzPhone
} from './SharedComponents';
import {
  UserPlus, ListOrdered, BedDouble, CreditCard, PhoneCall,
  BarChart3, Search, Plus, Clock, CheckCircle, XCircle,
  ArrowUp, Printer, User, Phone, Calendar, MapPin,
  ChevronRight, AlertCircle, FileText, Settings, Shield, Tag, Copy, Edit,
  DoorOpen, TrendingDown, Receipt, Wallet, Coins, Stethoscope
} from 'lucide-react';

const TABS = [
  { key: 'register', label: "Ro'yxatdan o'tkazish", icon: <UserPlus size={18} /> },
  { key: 'queue', label: 'Navbat', icon: <ListOrdered size={18} /> },
  { key: 'rooms', label: 'Xona Tanlash', icon: <BedDouble size={18} /> },
  { key: 'payment', label: "To'lov", icon: <CreditCard size={18} /> },
  { key: 'treatments', label: 'Licheniya', icon: <Calendar size={18} /> },
  { key: 'expenses', label: 'Xarajatlar', icon: <Receipt size={18} /> },
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

    const newPatient = addPatient({
      ...form,
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
                      className="input pl-9" 
                      type="date" 
                      value={form.birthDate} 
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
    payments, expenses 
  } = useCrm();
  const toast = useToast();
  const [selectedRoom, setSelectedRoom] = useState(null);
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
    if (!selectedRoom || !selectedPatient) { toast('Xona va bemor tanlang', 'error'); return; }
    
    const roomPatientsCount = patients.filter(p => p.roomId === selectedRoom.id && p.status === 'stasionar').length;
    if (roomPatientsCount >= selectedRoom.capacity) {
      toast("Xonada bo'sh joy qolmadi!", 'error');
      return;
    }

    updatePatient(selectedPatient, { 
      roomId: selectedRoom.id, 
      status: 'stasionar',
      admissionDateTime: new Date().toISOString()
    });
    addPatientHistoryEvent(selectedPatient, {
      type: 'room',
      title: 'Palataga yotqizildi',
      details: `#${selectedRoom.number}-palataga joylashtirildi`
    });
    
    const isFull = (roomPatientsCount + 1) >= selectedRoom.capacity;
    updateRoom(selectedRoom.id, { status: isFull ? 'busy' : 'free' });
    
    toast('Bemor xonaga joylashtirildi', 'success');
    setSelectedRoom(null);
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

    const roomPatientsCount = patients.filter(p => p.roomId === selectedRoom.id && p.status === 'stasionar').length;
    if (roomPatientsCount >= selectedRoom.capacity) {
      toast("Xonada bo'sh joy qolmadi!", 'error');
      return;
    }

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
      roomId: selectedRoom.id,
      admissionDateTime: new Date().toISOString(),
      admissionDate: new Date().toISOString().split('T')[0],
      queueTime: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      queueStatus: 'completed'
    });

    addPatientHistoryEvent(newPatient.id, {
      type: 'room',
      title: 'Palataga yotqizildi',
      details: `#${selectedRoom.number}-palataga yangi ro'yxatdan o'tib joylashtirildi`
    });

    const isFull = (roomPatientsCount + 1) >= selectedRoom.capacity;
    updateRoom(selectedRoom.id, { status: isFull ? 'busy' : 'free' });

    toast(`${newPatientForm.firstName} ${newPatientForm.lastName} ro'yxatdan o'tkazildi va joylashtirildi`, 'success');
    setShowAddPatientModal(false);
    setSelectedRoom(null);
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
              className={`floor-room room-${displayStatus} ${selectedRoom?.id === room.id ? 'ring-2 ring-blue-500' : ''} ${canSelect ? 'cursor-pointer hover:scale-[1.02]' : 'opacity-75'}`}
              onClick={() => canSelect ? setSelectedRoom(room) : null}
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

      {selectedRoom && (
        <div className="card p-5 max-w-md mx-auto animate-fadeIn">
          <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Bemorni joylashtirish — #{selectedRoom.number}</h4>
          
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Bemorlarni ismi/tel bo'yicha qidirish</label>
            <input
              type="text"
              className="input mb-2 text-sm"
              placeholder="Ism, familiya yoki tel bo'yicha qidiring..."
              value={patientSelectQuery}
              onChange={e => setPatientSelectQuery(e.target.value)}
            />
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Tizimdagi bemorlardan tanlang</label>
            <select className="input select mb-2 text-sm" value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}>
              <option value="">Bemor tanlang...</option>
              {filteredAvailablePatients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.phone})</option>)}
            </select>
          </div>

          <div className="flex items-center justify-between my-3 text-gray-400">
            <hr className="w-1/3 border-gray-200 dark:border-gray-700" />
            <span className="text-xs uppercase">yoki</span>
            <hr className="w-1/3 border-gray-200 dark:border-gray-700" />
          </div>

          <button 
            className="btn btn-outline btn-primary w-full flex items-center justify-center gap-2 mb-4" 
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
            <UserPlus size={16} /> Yangi bemor ro'yxatga olish
          </button>

          <div className="flex gap-3 border-t border-gray-100 dark:border-gray-800 pt-3">
            <button className="btn btn-outline flex-1" onClick={() => { setSelectedRoom(null); setSelectedPatient(''); setPatientSelectQuery(''); }}>Bekor</button>
            <button className="btn btn-success flex-1" onClick={handleAssign} disabled={!selectedPatient}>Joylashtirish</button>
          </div>
        </div>
      )}

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
                <p className="text-xs text-gray-500">#{selectedRoom?.number}-xona • {selectedRoom?.type}</p>
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
  const { patients, payments, expenses } = useCrm();
  const today = new Date().toISOString().split('T')[0];

  const todayPatients = patients.filter(p => p.admissionDate === today);
  const todayPayments = payments.filter(p => p.date === today);
  const todayIncome = todayPayments.reduce((s, p) => s + p.paid, 0);
  const todayExpenses = (expenses || []).filter(e => e.date === today).reduce((s, e) => s + (e.amount || 0), 0);
  const todayBalance = todayIncome - todayExpenses;

  // Jami kassa
  const totalIncome = payments.reduce((s, p) => s + p.paid, 0);
  const totalExpenses = (expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
  const totalBalance = totalIncome - totalExpenses;

  const cancelledQueues = todayPatients.filter(p => p.queueStatus === 'no-show').length;

  return (
    <div>
      <Header title="Resepshion Hisoboti" subtitle={formatDate(today)} role="reception" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard icon={<User size={24} />} title="Qabul qilingan" value={todayPatients.length} colorClass="stat-blue" />
        <StatCard icon={<CreditCard size={24} />} title="Bugungi kirim" value={`${formatMoney(todayIncome)} so'm`} colorClass="stat-green" />
        <StatCard icon={<TrendingDown size={24} />} title="Bugungi chiqim" value={`${formatMoney(todayExpenses)} so'm`} colorClass="stat-red" />
        <StatCard icon={<Wallet size={24} />} title="Kassa qoldig'i" value={`${formatMoney(totalBalance)} so'm`} colorClass="stat-green" />
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
  const { expenses, addExpense, staff, updateStaff, finances, setFinances: updateFinances, addActivityLogEntry } = useCrm();
  const toast = useToast();
  const today = new Date().toISOString().split('T')[0];

  const emptyForm = {
    description: '', amount: '', category: 'Boshqa',
    paymentMethod: 'Naqd', date: today, note: '',
    staffId: '', staffPayType: 'advance'
  };
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const totalToday = (expenses || []).filter(e => e.date === today).reduce((s, e) => s + (e.amount || 0), 0);
  const totalAll = (expenses || []).reduce((s, e) => s + (e.amount || 0), 0);

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

  const sortedExpenses = [...(expenses || [])].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

  return (
    <div>
      <Header title="Xarajatlar (Rasxod)" subtitle="Kunlik xarajatlarni qayd etish" role="reception" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="card p-4 border-l-4 border-l-red-500">
          <p className="text-xs text-gray-500 mb-1">Bugungi xarajat</p>
          <p className="text-xl font-bold text-red-600">{formatMoney(totalToday)} so&apos;m</p>
        </div>
        <div className="card p-4 border-l-4 border-l-orange-400">
          <p className="text-xs text-gray-500 mb-1">Jami xarajat</p>
          <p className="text-xl font-bold text-orange-600">{formatMoney(totalAll)} so&apos;m</p>
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

      {/* Add button */}
      <div className="flex justify-end mb-4">
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Yangi xarajat yozish
        </button>
      </div>

      {/* Form */}
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

      {/* Expenses List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sana</th><th>Tavsif</th><th>Kategoriya</th>
                <th>To&apos;lov usuli</th><th>Summa</th><th>Izoh</th>
              </tr>
            </thead>
            <tbody>
              {sortedExpenses.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400 italic">Xarajatlar mavjud emas</td></tr>
              ) : (
                sortedExpenses.map(exp => (
                  <tr key={exp.id}>
                    <td className="text-sm font-medium">{exp.date}</td>
                    <td className="text-sm font-semibold text-gray-900">{exp.description}</td>
                    <td><span className="badge badge-warning">{exp.category}</span></td>
                    <td className="text-sm">{exp.paymentMethod}</td>
                    <td className="text-sm font-bold text-red-600 font-mono">{formatMoney(exp.amount)} so&apos;m</td>
                    <td className="text-xs text-gray-500">{exp.note}</td>
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
