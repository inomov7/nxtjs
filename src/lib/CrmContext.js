'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { generateId } from './demoData';

const CrmContext = createContext(null);

function loadFromStorage(key, defaultFn) {
  if (typeof window === 'undefined') return defaultFn();
  try {
    const stored = localStorage.getItem(`klinika_${key}`);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return defaultFn();
}

function saveToStorage(key, data) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`klinika_${key}`, JSON.stringify(data));
  } catch (e) { /* ignore */ }
}

export function CrmProvider({ children }) {
  const [user, setUser] = useState(() => loadFromStorage('currentUser', () => null));
  const [staff, setStaff] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [patients, setPatients] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [services, setServices] = useState([]);
  const [finances, setFinances] = useState([]);
  const [payments, setPayments] = useState([]);
  const [prescriptionQueue, setPrescriptionQueue] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [clinicSettings, setClinicSettings] = useState({});
  const [callLog, setCallLog] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [smsQueue, setSmsQueue] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [theme, setTheme] = useState('light');

  // Load theme from storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('klinika_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      setTimeout(() => setTheme(savedTheme), 0);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('klinika_theme', theme);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // Fetch all data from server
  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/data');
      if (res.status === 401) {
        setUser(null);
        if (typeof window !== 'undefined') localStorage.removeItem('klinika_currentUser');
        return;
      }
      const data = await res.json();

      setStaff(data.staff || []);
      setRooms(data.rooms || []);
      setPatients(data.patients || []);
      setMedicines(data.medicines || []);
      setServices(data.services || []);
      setFinances(data.finances || []);
      setPayments(data.payments || []);
      setPrescriptionQueue(data.prescriptionQueue || []);
      setNotifications(data.notifications || []);
      setActivityLog(data.activityLog || []);
      setClinicSettings(data.clinicSettings || {});
      setCallLog(data.callLog || []);
      setSuppliers(data.suppliers || []);
      setSmsQueue(data.smsQueue || []);
      setTreatments(data.treatments || []);
    } catch (error) {
      console.error("Failed to load server data:", error);
    }
  }, []);

  // Load data on mount if user is present
  useEffect(() => {
    if (user) {
      setTimeout(() => {
        loadData().finally(() => setInitialized(true));
      }, 0);
    } else {
      setTimeout(() => setInitialized(true), 0);
    }
  }, [user, loadData]);

  // Background polling to keep SMS status and queue logs updated
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      loadData();
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [user, loadData]);

  // Granular Save to Server
  const saveToServer = useCallback(async (table, action, data, id) => {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, action, data, id })
      });
    } catch (e) {
      console.error(`Failed to save ${table} to server:`, e);
    }
  }, []);

  const addPatientHistoryEvent = useCallback((patientId, { type, title, details, nurseId }) => {
    const newEvent = {
      id: generateId('HST'),
      type,
      title,
      time: new Date().toISOString(),
      details: details || '',
      nurseId: nurseId || '',
    };

    setPatients(prev => {
      const next = prev.map(p => {
        if (p.id === patientId) {
          const updatedHistory = [...(p.history || []), newEvent];
          saveToServer('patients', 'update', { history: updatedHistory }, patientId);
          return { ...p, history: updatedHistory };
        }
        return p;
      });
      return next;
    });
  }, [saveToServer]);

  const login = useCallback(async (username, password) => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        return false;
      }
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        saveToStorage('currentUser', data.user);
        await loadData(); // Load data after success login
        return data.user;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, [loadData]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (e) { /* ignore */ }
    setUser(null);
    if (typeof window !== 'undefined') localStorage.removeItem('klinika_currentUser');
  }, []);

  const addNotification = useCallback((notification) => {
    const newNotif = { ...notification, id: generateId('NOT'), time: new Date().toISOString(), read: false };
    setNotifications(prev => {
      const next = [newNotif, ...prev];
      saveToServer('notifications', 'insert', newNotif);
      return next;
    });
  }, [saveToServer]);

  const addActivityLogEntry = useCallback((entry) => {
    const newEntry = { ...entry, id: generateId('LOG'), time: new Date().toISOString() };
    setActivityLog(prev => {
      const next = [newEntry, ...prev];
      saveToServer('activityLog', 'insert', newEntry);
      return next;
    });
  }, [saveToServer]);

  const addPatient = useCallback((patient) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const doc = staff.find(s => s.id === patient.assignedDoctor);

    let specialtyPrefix = 'NAV';
    if (doc && doc.specialization) {
      const spec = doc.specialization.toLowerCase().trim();
      if (spec.startsWith('stom')) specialtyPrefix = 'STOM';
      else if (spec.startsWith('terap') || spec.startsWith('ter')) specialtyPrefix = 'TER';
      else if (spec.startsWith('kard')) specialtyPrefix = 'KARD';
      else if (spec.startsWith('jarr') || spec.startsWith('jar')) specialtyPrefix = 'JAR';
      else if (spec.startsWith('nev')) specialtyPrefix = 'NEVR';
      else if (spec.startsWith('ped')) specialtyPrefix = 'PED';
      else if (spec.startsWith('oft')) specialtyPrefix = 'OFT';
      else if (spec.startsWith('lor')) specialtyPrefix = 'LOR';
      else if (spec.startsWith('ginek') || spec.startsWith('gin')) specialtyPrefix = 'GIN';
      else if (spec.startsWith('urol')) specialtyPrefix = 'UROL';
      else specialtyPrefix = doc.specialization.substring(0, 3).toUpperCase();
    }

    const doctorTodayPatients = patients.filter(p =>
      p.assignedDoctor === patient.assignedDoctor &&
      p.admissionDate === todayStr
    );
    const doctorQueueNumber = doctorTodayPatients.length + 1;
    const ticketNumber = `${specialtyPrefix}-${doctorQueueNumber.toString().padStart(2, '0')}`;

    const newPatient = {
      ...patient,
      id: generateId('KL'),
      ticketNumber,
      doctorQueueNumber,
      visits: [],
      prescriptions: [],
      vitalSigns: [],
      medications: [],
      treatments: [],
      nurseNotes: [],
      history: [
        {
          id: generateId('HST'),
          type: 'admission',
          title: "Ro'yxatdan o'tdi (Kelish)",
          time: new Date().toISOString(),
          details: `Kelish sababi: ${patient.visitReason || "Ko'rik"}`,
        }
      ],
      overallCondition: 'good',
    };

    setPatients(prev => {
      const next = [...prev, newPatient];
      saveToServer('patients', 'insert', newPatient);
      return next;
    });

    let nextFinances = [];
    setFinances(prev => {
      let found = false;
      const next = prev.map(f => {
        if (f.date === todayStr) {
          found = true;
          return { ...f, patients: (f.patients || 0) + 1 };
        }
        return f;
      });
      if (!found) {
        next.push({
          date: todayStr,
          income: 0,
          expense: 0,
          patients: 1
        });
      }
      nextFinances = next;
      saveToServer('finances', 'set_all', next);
      return next;
    });

    addActivityLogEntry({ user: 'Resepshion', action: "Yangi bemor ro'yxatdan o'tkazildi", target: `${newPatient.firstName} ${newPatient.lastName}` });
    addNotification({ type: 'patient', message: `Yangi bemor: ${newPatient.firstName} ${newPatient.lastName}`, roles: ['doctor', 'nurse'] });
    return newPatient;
  }, [addActivityLogEntry, addNotification, saveToServer, patients, staff]);

  const updatePatient = useCallback((id, updates) => {
    setPatients(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      const updatedPatient = next.find(p => p.id === id);
      if (updatedPatient) {
        saveToServer('patients', 'update', updates, id);
      }
      return next;
    });
  }, [saveToServer]);

  const deletePatient = useCallback((id) => {
    setPatients(prev => {
      const next = prev.filter(p => p.id !== id);
      saveToServer('patients', 'delete', null, id);
      return next;
    });
  }, [saveToServer]);

  const addStaff = useCallback((member) => {
    const newMember = { ...member, id: generateId('STF'), active: true, patientsServed: 0, hoursWorked: 0 };
    setStaff(prev => {
      const next = [...prev, newMember];
      saveToServer('staff', 'insert', newMember);
      return next;
    });
    addActivityLogEntry({ user: 'Admin', action: "Yangi xodim qo'shildi", target: `${newMember.firstName} ${newMember.lastName}` });
    return newMember;
  }, [addActivityLogEntry, saveToServer]);

  const updateStaff = useCallback((id, updates) => {
    setStaff(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...updates } : s);
      saveToServer('staff', 'update', updates, id);
      return next;
    });
    setUser(prevUser => {
      if (prevUser && prevUser.id === id) {
        const { password, ...cleanUpdates } = updates;
        const newUser = { ...prevUser, ...cleanUpdates };
        saveToStorage('currentUser', newUser);
        return newUser;
      }
      return prevUser;
    });
  }, [saveToServer]);

  const deleteStaff = useCallback((id) => {
    setStaff(prev => {
      const next = prev.filter(s => s.id !== id);
      saveToServer('staff', 'delete', null, id);
      return next;
    });
  }, [saveToServer]);

  const addRoom = useCallback((room) => {
    const newRoom = { ...room, id: generateId('RM') };
    setRooms(prev => {
      const next = [...prev, newRoom];
      saveToServer('rooms', 'insert', newRoom);
      return next;
    });
    return newRoom;
  }, [saveToServer]);

  const updateRoom = useCallback((id, updates) => {
    setRooms(prev => {
      const next = prev.map(r => r.id === id ? { ...r, ...updates } : r);
      saveToServer('rooms', 'update', updates, id);
      return next;
    });
  }, [saveToServer]);

  const deleteRoom = useCallback((id) => {
    setRooms(prev => {
      const next = prev.filter(r => r.id !== id);
      saveToServer('rooms', 'delete', null, id);
      return next;
    });
  }, [saveToServer]);

  const addMedicine = useCallback((medicine) => {
    const newMed = { ...medicine, id: generateId('MED') };
    setMedicines(prev => {
      const next = [...prev, newMed];
      saveToServer('medicines', 'insert', newMed);
      return next;
    });
    return newMed;
  }, [saveToServer]);

  const updateMedicine = useCallback((id, updates) => {
    setMedicines(prev => {
      const next = prev.map(m => m.id === id ? { ...m, ...updates } : m);
      saveToServer('medicines', 'update', updates, id);
      return next;
    });
  }, [saveToServer]);

  const deleteMedicine = useCallback((id) => {
    setMedicines(prev => {
      const next = prev.filter(m => m.id !== id);
      saveToServer('medicines', 'delete', null, id);
      return next;
    });
  }, [saveToServer]);

  const addService = useCallback((service) => {
    const newSrv = { ...service, id: generateId('SRV'), active: true };
    setServices(prev => {
      const next = [...prev, newSrv];
      saveToServer('services', 'insert', newSrv);
      return next;
    });
    return newSrv;
  }, [saveToServer]);

  const updateService = useCallback((id, updates) => {
    setServices(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...updates } : s);
      saveToServer('services', 'update', updates, id);
      return next;
    });
  }, [saveToServer]);

  const addPayment = useCallback((payment) => {
    const today = new Date().toISOString().split('T')[0];
    const newPay = { ...payment, id: generateId('PAY'), date: today };
    setPayments(prev => {
      const next = [...prev, newPay];
      saveToServer('payments', 'insert', newPay);
      return next;
    });

    setFinances(prev => {
      let found = false;
      const next = prev.map(f => {
        if (f.date === today) {
          found = true;
          return { ...f, income: f.income + (payment.paid || 0) };
        }
        return f;
      });
      if (!found) {
        next.push({
          date: today,
          income: payment.paid || 0,
          expense: 0,
          patients: 0
        });
      }
      saveToServer('finances', 'set_all', next);
      return next;
    });

    addActivityLogEntry({ user: 'Resepshion', action: "To'lov qabul qilindi", target: `${payment.patientId} - ${payment.totalAmount?.toLocaleString()} so'm` });
    return newPay;
  }, [addActivityLogEntry, saveToServer]);

  const addPrescription = useCallback((prescription) => {
    const newRx = { ...prescription, id: generateId('RX'), date: new Date().toISOString().split('T')[0], status: 'pending' };
    setPrescriptionQueue(prev => {
      const next = [...prev, newRx];
      saveToServer('prescriptionQueue', 'insert', newRx);
      return next;
    });

    addNotification({ type: 'prescription', message: `Yangi retsept: ${prescription.patientId}`, roles: ['admin', 'nurse'] });
    return newRx;
  }, [addNotification, saveToServer]);

  const updatePrescription = useCallback((id, updates) => {
    setPrescriptionQueue(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      saveToServer('prescriptionQueue', 'update', updates, id);
      return next;
    });
  }, [saveToServer]);

  const addCallLogEntry = useCallback((entry) => {
    const newCall = { ...entry, id: generateId('CALL'), date: new Date().toISOString().split('T')[0] };
    setCallLog(prev => {
      const next = [...prev, newCall];
      saveToServer('callLog', 'insert', newCall);
      return next;
    });
    return newCall;
  }, [saveToServer]);

  const markNotificationRead = useCallback((id) => {
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
      saveToServer('notifications', 'update', { read: true }, id);
      return next;
    });
  }, [saveToServer]);

  const markAllNotificationsRead = useCallback((role) => {
    setNotifications(prev => {
      const next = prev.map(n => n.roles?.includes(role) ? { ...n, read: true } : n);
      saveToServer('notifications', 'mark_all_read', { role });
      return next;
    });
  }, [saveToServer]);

  const updateFinances = useCallback((data) => {
    setFinances(data);
    saveToServer('finances', 'set_all', data);
  }, [saveToServer]);

  const updateClinicSettings = useCallback((data) => {
    setClinicSettings(data);
    saveToServer('clinicSettings', 'set_all', data);
  }, [saveToServer]);

  const updateSuppliers = useCallback((data) => {
    setSuppliers(data);
    saveToServer('suppliers', 'set_all', data);
  }, [saveToServer]);

  const generateSmsForTreatment = useCallback((patient, treatment, treatmentId) => {
    const smsList = [];
    const duration = Number(treatment.durationDays);
    const offset = Number(treatment.smsOffsetMinutes || 30);
    const startTimeStr = treatment.time;
    const [hour, minute] = startTimeStr.split(':').map(Number);
    
    let currentDate = new Date(treatment.startDate);
    
    const template = clinicSettings.scheduledSmsTemplate || 
      "Hurmatli $bemor, sizda $sana kuni soat $vaqt da $muolaja muolajasi bor. Kelishingizni kutamiz. Tel: $tel";
    
    for (let i = 0; i < duration; i++) {
      const sessionDate = new Date(currentDate);
      sessionDate.setHours(hour, minute, 0, 0);
      
      const scheduledTime = new Date(sessionDate.getTime() - offset * 60 * 1000);
      
      const smsId = `SMS-${treatmentId}-${i}`;
      
      const day = String(sessionDate.getDate()).padStart(2, '0');
      const month = String(sessionDate.getMonth() + 1).padStart(2, '0');
      const year = sessionDate.getFullYear();
      const formattedDate = `${day}.${month}.${year}`;
      
      const message = template
        .replace(/\$sana/g, formattedDate)
        .replace(/\$vaqt/g, startTimeStr)
        .replace(/\$bemor/g, `${patient.firstName} ${patient.lastName}`)
        .replace(/\$muolaja/g, treatment.treatmentName)
        .replace(/\$tel/g, clinicSettings.phone || "+998 71 200 00 01");
      
      smsList.push({
        id: smsId,
        phone: patient.phone,
        message,
        status: 'pending',
        type: 'scheduled',
        createdAt: new Date().toISOString(),
        scheduledFor: scheduledTime.toISOString(),
        treatmentId
      });
      
      if (treatment.frequency === 'Kunda') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else {
        currentDate.setDate(currentDate.getDate() + 2);
      }
    }
    return smsList;
  }, [clinicSettings]);

  const addTreatment = useCallback(async (treatmentData, patientObject = null) => {
    const treatmentId = generateId('TRT');
    const patient = patientObject || patients.find(p => p.id === treatmentData.patientId);
    if (!patient) return null;
    
    const newTreatment = {
      ...treatmentData,
      id: treatmentId,
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    
    const newSmsList = generateSmsForTreatment(patient, newTreatment, treatmentId);
    newTreatment.scheduledSmsIds = newSmsList.map(s => s.id);
    
    setTreatments(prev => {
      const next = [...prev, newTreatment];
      saveToServer('treatments', 'insert', newTreatment);
      return next;
    });
    
    setSmsQueue(prev => {
      const next = [...prev, ...newSmsList];
      saveToServer('smsQueue', 'bulk_insert', newSmsList);
      return next;
    });
    
    addActivityLogEntry({
      user: 'Resepshion',
      action: "Yangi muolaja rejalashtirildi",
      target: `${patient.firstName} ${patient.lastName} - ${newTreatment.treatmentName} (Jami: ${newTreatment.price?.toLocaleString()} so'm)`
    });
    
    return newTreatment;
  }, [patients, saveToServer, addActivityLogEntry, generateSmsForTreatment]);

  const updateTreatment = useCallback(async (id, updates) => {
    let updatedTreatment = null;
    
    setTreatments(prev => {
      const next = prev.map(t => {
        if (t.id === id) {
          updatedTreatment = { ...t, ...updates };
          saveToServer('treatments', 'update', updates, id);
          return updatedTreatment;
        }
        return t;
      });
      return next;
    });
    
    if (!updatedTreatment) return;
    
    const patient = patients.find(p => p.id === updatedTreatment.patientId);
    if (!patient) return;
    
    const newSmsList = generateSmsForTreatment(patient, updatedTreatment, id);
    const now = new Date();
    const futureSmsList = newSmsList.filter(s => new Date(s.scheduledFor) > now);

    saveToServer('smsQueue', 'delete_pending_treatment_sms', null, id).then(() => {
      if (futureSmsList.length > 0) {
        saveToServer('smsQueue', 'bulk_insert', futureSmsList);
      }
    });

    setSmsQueue(prev => {
      const filteredSms = prev.filter(s => !(s.treatmentId === id && s.status === 'pending'));
      return [...filteredSms, ...futureSmsList];
    });
    
    addActivityLogEntry({
      user: 'Resepshion',
      action: "Muolaja vaqti tahrirlandi",
      target: `${patient.firstName} ${patient.lastName} - ${updatedTreatment.treatmentName}`
    });
  }, [patients, saveToServer, addActivityLogEntry, generateSmsForTreatment]);

  const deleteTreatment = useCallback(async (id) => {
    let cancelledTreatment = null;
    
    setTreatments(prev => {
      const next = prev.map(t => {
        if (t.id === id) {
          cancelledTreatment = t;
          return { ...t, status: 'cancelled' };
        }
        return t;
      });
      saveToServer('treatments', 'update', { status: 'cancelled' }, id);
      return next;
    });
    
    if (!cancelledTreatment) return;
    
    const patient = patients.find(p => p.id === cancelledTreatment.patientId);
    
    saveToServer('smsQueue', 'delete_pending_treatment_sms', null, id);
    
    setSmsQueue(prev => {
      const next = prev.filter(s => !(s.treatmentId === id && s.status === 'pending'));
      return next;
    });
    
    addActivityLogEntry({
      user: 'Resepshion',
      action: "Muolaja bekor qilindi",
      target: patient ? `${patient.firstName} ${patient.lastName} - ${cancelledTreatment.treatmentName}` : cancelledTreatment.treatmentName
    });
  }, [patients, saveToServer, addActivityLogEntry]);

  const addCampaignSms = useCallback(async (smsList) => {
    setSmsQueue(prev => [...prev, ...smsList]);
    saveToServer('smsQueue', 'bulk_insert', smsList);
    addActivityLogEntry({
      user: 'Admin',
      action: "SMS xabarlar kampaniyasi yuklandi",
      target: `${smsList.length} ta xabar`
    });
  }, [saveToServer, addActivityLogEntry]);

  const clearSmsQueue = useCallback(async () => {
    setSmsQueue([]);
    await saveToServer('smsQueue', 'set_all', []);
    addActivityLogEntry({
      user: 'Admin',
      action: "SMS navbati tozalandi",
      target: "Barcha xabarlar o'chirildi"
    });
  }, [saveToServer, addActivityLogEntry]);

  const retryFailedSms = useCallback(async () => {
    const failedSms = smsQueue.filter(s => s.status === 'failed');
    if (failedSms.length === 0) return;

    setSmsQueue(prev => prev.map(s => s.status === 'failed' ? { ...s, status: 'pending', error: null } : s));
    
    saveToServer('smsQueue', 'retry_failed_sms', null, null);

    addActivityLogEntry({
      user: 'Admin',
      action: "Muvaffaqiyatsiz SMSlar qayta urinishga qo'yildi",
      target: `${failedSms.length} ta xabar`
    });
  }, [smsQueue, saveToServer, addActivityLogEntry]);

  const deleteSms = useCallback(async (id) => {
    setSmsQueue(prev => {
      const next = prev.filter(s => s.id !== id);
      saveToServer('smsQueue', 'delete', null, id);
      return next;
    });
  }, [saveToServer]);

  const resetData = useCallback(async () => {
    try {
      await fetch('/api/data', { method: 'DELETE' });
      if (typeof window !== 'undefined') localStorage.removeItem('klinika_currentUser');
      window.location.reload();
    } catch (e) {
      console.error("Failed to reset database:", e);
    }
  }, []);

  const exportData = useCallback(() => {
    const data = { staff, rooms, patients, medicines, services, finances, payments, prescriptionQueue, notifications, activityLog, clinicSettings, callLog, suppliers, smsQueue, treatments };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `klinika_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [staff, rooms, patients, medicines, services, finances, payments, prescriptionQueue, notifications, activityLog, clinicSettings, callLog, suppliers, smsQueue, treatments]);

  const value = {
    user, login, logout, initialized,
    staff, addStaff, updateStaff, deleteStaff,
    rooms, addRoom, updateRoom, deleteRoom,
    patients, addPatient, updatePatient, deletePatient, addPatientHistoryEvent,
    medicines, addMedicine, updateMedicine, deleteMedicine,
    services, addService, updateService,
    finances, setFinances: updateFinances,
    payments, addPayment,
    prescriptionQueue, addPrescription, updatePrescription,
    notifications, addNotification, markNotificationRead, markAllNotificationsRead,
    activityLog, addActivityLogEntry,
    clinicSettings, setClinicSettings: updateClinicSettings,
    callLog, addCallLogEntry,
    suppliers, setSuppliers: updateSuppliers,
    resetData, exportData,
    theme, toggleTheme,
    smsQueue, addSms: addCampaignSms, clearSmsQueue, retryFailedSms, deleteSms,
    treatments, addTreatment, updateTreatment, deleteTreatment
  };

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const context = useContext(CrmContext);
  if (!context) throw new Error('useCrm must be used within CrmProvider');
  return context;
}
