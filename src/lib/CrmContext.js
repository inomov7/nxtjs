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
  const [user, setUser] = useState(null);
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
  const [initialized, setInitialized] = useState(false);
  const [theme, setTheme] = useState('light');

  // Load theme from storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('klinika_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      setTheme(savedTheme);
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

  // Load from server API on mount
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/data');
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
      } catch (error) {
        console.error("Failed to load server data:", error);
      } finally {
        const savedUser = loadFromStorage('currentUser', () => null);
        if (savedUser) setUser(savedUser);
        setInitialized(true);
      }
    }
    loadData();
  }, []);

  const saveToServer = useCallback(async (key, data) => {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: data })
      });
    } catch (e) {
      console.error(`Failed to save ${key} to server:`, e);
    }
  }, []);

  const login = useCallback((role) => {
    const u = { role, loginTime: new Date().toISOString() };
    setUser(u);
    saveToStorage('currentUser', u);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    if (typeof window !== 'undefined') localStorage.removeItem('klinika_currentUser');
  }, []);

  const addNotification = useCallback((notification) => {
    const newNotif = { ...notification, id: generateId('NOT'), time: new Date().toISOString(), read: false };
    setNotifications(prev => {
      const next = [newNotif, ...prev];
      saveToServer('notifications', next);
      return next;
    });
  }, [saveToServer]);

  const addActivityLogEntry = useCallback((entry) => {
    const newEntry = { ...entry, id: generateId('LOG'), time: new Date().toISOString() };
    setActivityLog(prev => {
      const next = [newEntry, ...prev];
      saveToServer('activityLog', next);
      return next;
    });
  }, [saveToServer]);

  const addPatient = useCallback((patient) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const doc = staff.find(s => s.id === patient.assignedDoctor);
    
    // Get specialty prefix
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

    // Calculate doctor-specific queue number for today
    const admissionDate = patient.admissionDate || todayStr;
    const doctorTodayPatients = patients.filter(p => 
      p.assignedDoctor === patient.assignedDoctor && 
      p.admissionDate === admissionDate
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
      overallCondition: 'good',
    };
    setPatients(prev => {
      const next = [...prev, newPatient];
      saveToServer('patients', next);
      return next;
    });
    addActivityLogEntry({ user: 'Resepshion', action: "Yangi bemor ro'yxatdan o'tkazildi", target: `${newPatient.firstName} ${newPatient.lastName}` });
    addNotification({ type: 'patient', message: `Yangi bemor: ${newPatient.firstName} ${newPatient.lastName}`, roles: ['doctor', 'nurse'] });
    return newPatient;
  }, [addActivityLogEntry, addNotification, saveToServer, patients, staff]);

  const updatePatient = useCallback((id, updates) => {
    setPatients(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      saveToServer('patients', next);
      return next;
    });
  }, [saveToServer]);

  const addStaff = useCallback((member) => {
    const newMember = { ...member, id: generateId('STF'), active: true, patientsServed: 0, hoursWorked: 0 };
    setStaff(prev => {
      const next = [...prev, newMember];
      saveToServer('staff', next);
      return next;
    });
    addActivityLogEntry({ user: 'Admin', action: "Yangi xodim qo'shildi", target: `${newMember.firstName} ${newMember.lastName}` });
    return newMember;
  }, [addActivityLogEntry, saveToServer]);

  const updateStaff = useCallback((id, updates) => {
    setStaff(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...updates } : s);
      saveToServer('staff', next);
      return next;
    });
  }, [saveToServer]);

  const deleteStaff = useCallback((id) => {
    setStaff(prev => {
      const next = prev.filter(s => s.id !== id);
      saveToServer('staff', next);
      return next;
    });
  }, [saveToServer]);

  const addRoom = useCallback((room) => {
    const newRoom = { ...room, id: generateId('RM') };
    setRooms(prev => {
      const next = [...prev, newRoom];
      saveToServer('rooms', next);
      return next;
    });
    return newRoom;
  }, [saveToServer]);

  const updateRoom = useCallback((id, updates) => {
    setRooms(prev => {
      const next = prev.map(r => r.id === id ? { ...r, ...updates } : r);
      saveToServer('rooms', next);
      return next;
    });
  }, [saveToServer]);

  const deleteRoom = useCallback((id) => {
    setRooms(prev => {
      const next = prev.filter(r => r.id !== id);
      saveToServer('rooms', next);
      return next;
    });
  }, [saveToServer]);

  const addMedicine = useCallback((medicine) => {
    const newMed = { ...medicine, id: generateId('MED') };
    setMedicines(prev => {
      const next = [...prev, newMed];
      saveToServer('medicines', next);
      return next;
    });
    return newMed;
  }, [saveToServer]);

  const updateMedicine = useCallback((id, updates) => {
    setMedicines(prev => {
      const next = prev.map(m => m.id === id ? { ...m, ...updates } : m);
      saveToServer('medicines', next);
      return next;
    });
  }, [saveToServer]);

  const deleteMedicine = useCallback((id) => {
    setMedicines(prev => {
      const next = prev.filter(m => m.id !== id);
      saveToServer('medicines', next);
      return next;
    });
  }, [saveToServer]);

  const addService = useCallback((service) => {
    const newSrv = { ...service, id: generateId('SRV'), active: true };
    setServices(prev => {
      const next = [...prev, newSrv];
      saveToServer('services', next);
      return next;
    });
    return newSrv;
  }, [saveToServer]);

  const updateService = useCallback((id, updates) => {
    setServices(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...updates } : s);
      saveToServer('services', next);
      return next;
    });
  }, [saveToServer]);

  const addPayment = useCallback((payment) => {
    const newPay = { ...payment, id: generateId('PAY'), date: new Date().toISOString().split('T')[0] };
    setPayments(prev => {
      const next = [...prev, newPay];
      saveToServer('payments', next);
      return next;
    });
    addActivityLogEntry({ user: 'Resepshion', action: "To'lov qabul qilindi", target: `${payment.patientId} - ${payment.totalAmount?.toLocaleString()} so'm` });
    return newPay;
  }, [addActivityLogEntry, saveToServer]);

  const addPrescription = useCallback((prescription) => {
    const newRx = { ...prescription, id: generateId('RX'), date: new Date().toISOString().split('T')[0], status: 'pending' };
    setPrescriptionQueue(prev => {
      const next = [...prev, newRx];
      saveToServer('prescriptionQueue', next);
      return next;
    });
    addNotification({ type: 'prescription', message: `Yangi retsept: ${prescription.patientId}`, roles: ['admin', 'nurse'] });
    return newRx;
  }, [addNotification, saveToServer]);

  const updatePrescription = useCallback((id, updates) => {
    setPrescriptionQueue(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      saveToServer('prescriptionQueue', next);
      return next;
    });
  }, [saveToServer]);

  const addCallLogEntry = useCallback((entry) => {
    const newCall = { ...entry, id: generateId('CALL'), date: new Date().toISOString().split('T')[0] };
    setCallLog(prev => {
      const next = [...prev, newCall];
      saveToServer('callLog', next);
      return next;
    });
    return newCall;
  }, [saveToServer]);

  const markNotificationRead = useCallback((id) => {
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
      saveToServer('notifications', next);
      return next;
    });
  }, [saveToServer]);

  const markAllNotificationsRead = useCallback((role) => {
    setNotifications(prev => {
      const next = prev.map(n => n.roles?.includes(role) ? { ...n, read: true } : n);
      saveToServer('notifications', next);
      return next;
    });
  }, [saveToServer]);

  const updateFinances = useCallback((data) => {
    setFinances(data);
    saveToServer('finances', data);
  }, [saveToServer]);

  const updateClinicSettings = useCallback((data) => {
    setClinicSettings(data);
    saveToServer('clinicSettings', data);
  }, [saveToServer]);

  const updateSuppliers = useCallback((data) => {
    setSuppliers(data);
    saveToServer('suppliers', data);
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
    const data = { staff, rooms, patients, medicines, services, finances, payments, prescriptionQueue, notifications, activityLog, clinicSettings, callLog, suppliers };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `klinika_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [staff, rooms, patients, medicines, services, finances, payments, prescriptionQueue, notifications, activityLog, clinicSettings, callLog, suppliers]);

  const value = {
    user, login, logout, initialized,
    staff, addStaff, updateStaff, deleteStaff,
    rooms, addRoom, updateRoom, deleteRoom,
    patients, addPatient, updatePatient,
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
  };

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const context = useContext(CrmContext);
  if (!context) throw new Error('useCrm must be used within CrmProvider');
  return context;
}
