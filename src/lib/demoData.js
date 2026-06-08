// Demo Data for Klinika CRM

export const ROLES = {
  admin: { key: 'admin', label: 'Administrator', color: '#2563EB', password: 'admin123' },
  doctor: { key: 'doctor', label: 'Shifokor', color: '#16A34A', password: 'doctor123' },
  nurse: { key: 'nurse', label: 'Hamshira', color: '#9333EA', password: 'nurse123' },
  reception: { key: 'reception', label: 'Resepshion', color: '#F59E0B', password: 'reception123' },
};

export const ROOM_TYPES = ['Oddiy', 'VIP', 'Ikki kishilik', 'Reanimatsiya (ICU)', 'Operatsiya', 'Jarrohlik', "Ko'rish xonasi"];
export const ROOM_STATUSES = [
  { key: 'free', label: "Bo'sh", color: '#22C55E', emoji: '🟢' },
  { key: 'busy', label: 'Band', color: '#EF4444', emoji: '🔴' },
  { key: 'cleaning', label: 'Tozalash kerak', color: '#EAB308', emoji: '🟡' },
  { key: 'repair', label: "Ta'mirda", color: '#374151', emoji: '⚫' },
  { key: 'reserved', label: 'Rezerv', color: '#3B82F6', emoji: '🔵' },
];

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const MEDICINE_CATEGORIES = ['Antibiotik', "Og'riq qoldiruvchi", 'Vitamin', 'Yurak', 'Asab', 'Allergiya', 'Oshqozon', 'Diabet', 'Bosim', 'Shamollash'];

export const SERVICE_CATEGORIES = ['Konsultatsiya', 'Tahlil', 'Rentgen/UZI', 'Operatsiya', 'Fizioterapiya', 'Stomatologiya', 'Laboratoriya', 'Tez yordam'];

export const DIET_TYPES = ['Umumiy', 'Diabetik', 'Yurak', 'Buyrak', 'Yumshoq ovqat', 'Och qolish'];

export const PATIENT_STATUSES = ['ambulatoriya', 'stasionar', 'tuzalgan', 'navbatda'];

export function generateId(prefix = 'KL') {
  const year = new Date().getFullYear();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${num}`;
}

export function getDefaultStaff() {
  return [
    {
      id: 'STF-001', firstName: 'Akbar', lastName: 'Karimov', role: 'doctor',
      phone: '+998901234567', email: 'akbar@klinika.uz', address: "Toshkent, Chilonzor tumani",
      salary: 8000000, photo: null, active: true, specialization: 'Terapevt',
      workDays: ['Dush', 'Sesh', 'Chor', 'Pay', 'Juma'], hireDate: '2023-01-15',
      patientsServed: 342, hoursWorked: 1200
    },
    {
      id: 'STF-002', firstName: 'Dilnoza', lastName: 'Rahimova', role: 'doctor',
      phone: '+998901234568', email: 'dilnoza@klinika.uz', address: "Toshkent, Yunusobod tumani",
      salary: 9000000, photo: null, active: true, specialization: 'Kardiolog',
      workDays: ['Dush', 'Sesh', 'Chor', 'Pay'], hireDate: '2022-06-10',
      patientsServed: 418, hoursWorked: 1450
    },
    {
      id: 'STF-003', firstName: 'Bobur', lastName: 'Toshmatov', role: 'doctor',
      phone: '+998901234569', email: 'bobur@klinika.uz', address: "Toshkent, Mirzo Ulug'bek tumani",
      salary: 10000000, photo: null, active: true, specialization: 'Jarroh',
      workDays: ['Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan'], hireDate: '2021-03-20',
      patientsServed: 256, hoursWorked: 1600
    },
    {
      id: 'STF-004', firstName: 'Nodira', lastName: 'Usmanova', role: 'nurse',
      phone: '+998901234570', email: 'nodira@klinika.uz', address: "Toshkent, Sergeli tumani",
      salary: 4000000, photo: null, active: true, specialization: 'Hamshira',
      workDays: ['Dush', 'Sesh', 'Chor', 'Pay', 'Juma'], hireDate: '2023-05-01',
      patientsServed: 520, hoursWorked: 900
    },
    {
      id: 'STF-005', firstName: 'Malika', lastName: 'Qodirova', role: 'nurse',
      phone: '+998901234571', email: 'malika@klinika.uz', address: "Toshkent, Yakkasaroy tumani",
      salary: 4000000, photo: null, active: true, specialization: 'Hamshira',
      workDays: ['Sesh', 'Chor', 'Pay', 'Juma', 'Shan'], hireDate: '2023-08-15',
      patientsServed: 380, hoursWorked: 750
    },
    {
      id: 'STF-006', firstName: 'Sardor', lastName: 'Nazarov', role: 'reception',
      phone: '+998901234572', email: 'sardor@klinika.uz', address: "Toshkent, Olmazor tumani",
      salary: 3500000, photo: null, active: true, specialization: 'Resepshion',
      workDays: ['Dush', 'Sesh', 'Chor', 'Pay', 'Juma'], hireDate: '2024-01-10',
      patientsServed: 890, hoursWorked: 600
    },
  ];
}

export function getDefaultRooms() {
  return [
    { id: 'RM-101', number: '101', type: 'Oddiy', floor: 1, pricePerDay: 200000, status: 'free', capacity: 2, equipment: ['Karavot', 'Monitor', 'Kislorod'] },
    { id: 'RM-102', number: '102', type: 'Oddiy', floor: 1, pricePerDay: 200000, status: 'busy', capacity: 2, equipment: ['Karavot', 'Monitor'] },
    { id: 'RM-201', number: '201', type: 'VIP', floor: 2, pricePerDay: 500000, status: 'busy', capacity: 1, equipment: ['Karavot', 'Monitor', 'TV', 'Konditsioner', 'Dush'] },
    { id: 'RM-202', number: '202', type: 'VIP', floor: 2, pricePerDay: 500000, status: 'free', capacity: 1, equipment: ['Karavot', 'Monitor', 'TV', 'Konditsioner', 'Dush'] },
    { id: 'RM-301', number: '301', type: 'Ikki kishilik', floor: 3, pricePerDay: 350000, status: 'cleaning', capacity: 2, equipment: ['2x Karavot', 'Monitor', 'Kislorod'] },
    { id: 'RM-302', number: '302', type: 'Reanimatsiya (ICU)', floor: 3, pricePerDay: 1000000, status: 'busy', capacity: 1, equipment: ['ICU karavot', 'Ventilator', 'Monitor', 'Infuzion pompa', 'Defibrilator'] },
    { id: 'RM-401', number: '401', type: 'Operatsiya', floor: 4, pricePerDay: 0, status: 'free', capacity: 1, equipment: ['Operatsiya stoli', 'Anestezia jihozi', 'Monitoring', 'Lampalar'] },
    { id: 'RM-402', number: '402', type: "Ko'rish xonasi", floor: 4, pricePerDay: 0, status: 'free', capacity: 1, equipment: ['Stol', 'Stul', 'Kompyuter', 'Tibbiy jihoz'] },
  ];
}

export function getDefaultPatients() {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  return [
    {
      id: 'KL-2024-1001', firstName: 'Aziz', lastName: 'Sobirov', middleName: 'Kamoliddin',
      birthDate: '1985-03-15', gender: 'Erkak', nationality: "O'zbek",
      phone: '+998901111111', phone2: '', email: 'aziz@mail.uz',
      address: { region: 'Toshkent', district: 'Chilonzor', street: "Bunyodkor ko'chasi 15" },
      bloodGroup: 'A+', allergies: ['Penisilin'], chronicDiseases: ['Diabet'],
      visitReason: "Ko'krak og'rig'i", visitType: 'Qayta', status: 'stasionar',
      assignedDoctor: 'STF-002', roomId: 'RM-201', admissionDate: yesterday,
      expectedDischarge: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      insurance: { company: "O'zbekinvest sug'urta", policyNumber: 'INS-2024-5567', validUntil: '2025-12-31' },
      queueNumber: null, queueTime: null, queueStatus: 'completed',
      visits: [
        { date: '2024-06-01', doctor: 'STF-002', diagnosis: 'Gipertoniya', icdCode: 'I10', notes: 'Doimiy kuzatuv kerak' },
        { date: today, doctor: 'STF-002', diagnosis: 'Stenokardiya', icdCode: 'I20', notes: 'Stasionarga yotqizildi' }
      ],
      prescriptions: [
        { medicine: 'Aspirin', dose: '100mg', frequency: '1 mahal', duration: '30 kun', instructions: 'Ovqatdan keyin', date: today },
        { medicine: 'Atorvastatin', dose: '20mg', frequency: '1 mahal kechqurun', duration: '90 kun', instructions: 'Ovqat bilan', date: today }
      ],
      vitalSigns: [
        { time: '08:00', date: today, temperature: 36.8, bloodPressure: '140/90', pulse: 78, respRate: 18, spo2: 97, sugar: 5.4, weight: 82, nurse: 'STF-004' },
        { time: '12:00', date: today, temperature: 36.6, bloodPressure: '135/85', pulse: 72, respRate: 16, spo2: 98, sugar: null, weight: null, nurse: 'STF-004' },
        { time: '16:00', date: today, temperature: 37.0, bloodPressure: '138/88', pulse: 75, respRate: 17, spo2: 97, sugar: 5.8, weight: null, nurse: 'STF-005' },
      ],
      medications: [
        { name: 'Aspirin', dose: '100mg', time: '08:00', status: 'given', nurse: 'STF-004', date: today },
        { name: 'Atorvastatin', dose: '20mg', time: '20:00', status: 'pending', nurse: null, date: today },
        { name: 'Kaptopress', dose: '25mg', time: '08:00', status: 'given', nurse: 'STF-004', date: today },
        { name: 'Kaptopress', dose: '25mg', time: '20:00', status: 'pending', nurse: null, date: today },
      ],
      treatments: [
        { type: 'Tomchi (dropper)', name: 'NaCl 0.9%', time: '10:00', status: 'done', nurse: 'STF-004', date: today },
        { type: 'EKG', name: 'Elektrokardiografiya', time: '14:00', status: 'pending', nurse: null, date: today },
      ],
      diet: { type: 'Yurak', restrictions: ['Tuz cheklangan', "Yog' oz"], meals: { breakfast: true, lunch: false, dinner: false } },
      nurseNotes: [
        { shift: 'Tonggi', time: '08:30', note: "Bemor ertalab o'zini yaxshi his qilmoqda. Qon bosimi yuqori.", nurse: 'STF-004', date: today },
      ],
      overallCondition: 'moderate',
    },
    {
      id: 'KL-2024-1002', firstName: 'Malika', lastName: 'Tursunova', middleName: 'Anvarovna',
      birthDate: '1990-07-22', gender: 'Ayol', nationality: "O'zbek",
      phone: '+998902222222', phone2: '+998712223344', email: '',
      address: { region: 'Toshkent', district: 'Yunusobod', street: "Amir Temur ko'chasi 45" },
      bloodGroup: 'B+', allergies: [], chronicDiseases: [],
      visitReason: "Bosh og'rig'i", visitType: 'Birinchi marta', status: 'ambulatoriya',
      assignedDoctor: 'STF-001', roomId: null, admissionDate: today,
      expectedDischarge: null,
      insurance: null,
      queueNumber: 3, ticketNumber: 'TER-02', doctorQueueNumber: 2, queueTime: '10:30', queueStatus: 'waiting',
      visits: [
        { date: today, doctor: 'STF-001', diagnosis: 'Migren', icdCode: 'G43', notes: "Dori yozildi, 7 kundan keyin qayta ko'rik" }
      ],
      prescriptions: [
        { medicine: 'Ibuprofen', dose: '400mg', frequency: '2 mahal', duration: '5 kun', instructions: 'Ovqatdan keyin', date: today },
      ],
      vitalSigns: [],
      medications: [],
      treatments: [],
      diet: null,
      nurseNotes: [],
      overallCondition: 'good',
    },
    {
      id: 'KL-2024-1003', firstName: 'Jasur', lastName: 'Xolmatov', middleName: 'Bahodir o\'g\'li',
      birthDate: '1978-11-30', gender: 'Erkak', nationality: "O'zbek",
      phone: '+998903333333', phone2: '', email: 'jasur78@mail.uz',
      address: { region: 'Toshkent', district: "Mirzo Ulug'bek", street: "Mustaqillik ko'chasi 12" },
      bloodGroup: 'O+', allergies: ['Sulfanilamid'], chronicDiseases: ['Gipertoniya', 'Astma'],
      visitReason: "Appenditsit operatsiyasi", visitType: 'Tez yordam', status: 'stasionar',
      assignedDoctor: 'STF-003', roomId: 'RM-302', admissionDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      expectedDischarge: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      insurance: { company: 'Alskom', policyNumber: 'INS-2024-8899', validUntil: '2025-06-30' },
      queueNumber: null, queueTime: null, queueStatus: 'completed',
      visits: [
        { date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], doctor: 'STF-003', diagnosis: 'Appenditsit', icdCode: 'K35', notes: "Shoshilinch operatsiya o'tkazildi" }
      ],
      prescriptions: [
        { medicine: 'Sefazolin', dose: '1g', frequency: '3 mahal', duration: '7 kun', instructions: 'Vena ichiga', date: today },
        { medicine: 'Ketonal', dose: '100mg', frequency: '2 mahal', duration: '5 kun', instructions: "Og'riq paytida", date: today },
      ],
      vitalSigns: [
        { time: '06:00', date: today, temperature: 37.2, bloodPressure: '130/80', pulse: 88, respRate: 20, spo2: 96, sugar: null, weight: 75, nurse: 'STF-005' },
        { time: '12:00', date: today, temperature: 37.5, bloodPressure: '125/82', pulse: 84, respRate: 19, spo2: 95, sugar: null, weight: null, nurse: 'STF-004' },
        { time: '18:00', date: today, temperature: 37.8, bloodPressure: '128/84', pulse: 90, respRate: 21, spo2: 94, sugar: null, weight: null, nurse: 'STF-005' },
      ],
      medications: [
        { name: 'Sefazolin', dose: '1g', time: '06:00', status: 'given', nurse: 'STF-005', date: today },
        { name: 'Sefazolin', dose: '1g', time: '14:00', status: 'given', nurse: 'STF-004', date: today },
        { name: 'Sefazolin', dose: '1g', time: '22:00', status: 'pending', nurse: null, date: today },
        { name: 'Ketonal', dose: '100mg', time: '08:00', status: 'given', nurse: 'STF-005', date: today },
        { name: 'Ketonal', dose: '100mg', time: '20:00', status: 'pending', nurse: null, date: today },
      ],
      treatments: [
        { type: 'Tomchi (dropper)', name: 'Ringer eritmasi', time: '08:00', status: 'done', nurse: 'STF-005', date: today },
        { type: "Bog'lam almashtirish", name: 'Steril bog\'lam', time: '10:00', status: 'done', nurse: 'STF-004', date: today },
        { type: 'Tomchi (dropper)', name: 'Metronidazol', time: '16:00', status: 'pending', nurse: null, date: today },
      ],
      diet: { type: 'Yumshoq ovqat', restrictions: ["Qattiq ovqat taqiqlangan", "Gazli ichimlik yo'q"], meals: { breakfast: true, lunch: true, dinner: false } },
      nurseNotes: [
        { shift: 'Tonggi', time: '07:00', note: "Operatsiyadan keyingi 2-kun. Harorat biroz ko'tarilgan. Shifokorga xabar berildi.", nurse: 'STF-005', date: today },
        { shift: 'Kunduzi', time: '13:00', note: "Bemor o'zini o'rtacha his qilmoqda. Ovqat yedi. Og'riq bor.", nurse: 'STF-004', date: today },
      ],
      overallCondition: 'serious',
    },
    {
      id: 'KL-2024-1004', firstName: 'Shahlo', lastName: 'Mirzayeva', middleName: 'Toxirovna',
      birthDate: '1995-02-14', gender: 'Ayol', nationality: "O'zbek",
      phone: '+998904444444', phone2: '', email: 'shahlo@gmail.com',
      address: { region: 'Toshkent', district: 'Yakkasaroy', street: "Shota Rustaveli ko'chasi 7" },
      bloodGroup: 'AB+', allergies: ['Lidokain'], chronicDiseases: [],
      visitReason: "Homiladorlik tekshiruvi", visitType: 'Qayta', status: 'ambulatoriya',
      assignedDoctor: 'STF-001', roomId: null, admissionDate: today,
      expectedDischarge: null, insurance: null,
      queueNumber: 5, ticketNumber: 'TER-03', doctorQueueNumber: 3, queueTime: '11:00', queueStatus: 'waiting',
      visits: [
        { date: '2024-05-15', doctor: 'STF-001', diagnosis: 'Homiladorlik 20-hafta', icdCode: 'Z34', notes: 'Normal kechmoqda' },
        { date: today, doctor: 'STF-001', diagnosis: 'Homiladorlik 24-hafta', icdCode: 'Z34', notes: "UZI tayinlandi" }
      ],
      prescriptions: [
        { medicine: 'Foliy kislota', dose: '5mg', frequency: '1 mahal', duration: '30 kun', instructions: 'Ertalab ovqat bilan', date: today },
        { medicine: 'Temir preparati', dose: '100mg', frequency: '1 mahal', duration: '30 kun', instructions: 'Kechqurun', date: today },
      ],
      vitalSigns: [],
      medications: [],
      treatments: [],
      diet: null,
      nurseNotes: [],
      overallCondition: 'good',
    },
    {
      id: 'KL-2024-1005', firstName: 'Olim', lastName: 'Ergashev', middleName: 'Nuriddin o\'g\'li',
      birthDate: '1960-08-03', gender: 'Erkak', nationality: "O'zbek",
      phone: '+998905555555', phone2: '+998715556677', email: '',
      address: { region: 'Samarqand', district: 'Samarqand shahar', street: "Registon ko'chasi 33" },
      bloodGroup: 'A-', allergies: [], chronicDiseases: ['Yurak yetishmovchiligi', 'Diabet 2-tur'],
      visitReason: "Nafas qisilishi", visitType: 'Tez yordam', status: 'stasionar',
      assignedDoctor: 'STF-002', roomId: 'RM-102', admissionDate: today,
      expectedDischarge: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      insurance: { company: 'Kafolat', policyNumber: 'INS-2024-3344', validUntil: '2025-03-15' },
      queueNumber: null, queueTime: null, queueStatus: 'completed',
      visits: [
        { date: today, doctor: 'STF-002', diagnosis: "Yurak yetishmovchiligi zo'rayishi", icdCode: 'I50', notes: "Intensiv terapiya boshlandi" }
      ],
      prescriptions: [
        { medicine: 'Furosemid', dose: '40mg', frequency: '2 mahal', duration: '10 kun', instructions: 'Ertalab va tushda', date: today },
        { medicine: 'Digoksin', dose: '0.25mg', frequency: '1 mahal', duration: '14 kun', instructions: 'Ertalab', date: today },
        { medicine: 'Insulin', dose: '10 birlik', frequency: '2 mahal', duration: 'Doimiy', instructions: 'Ovqatdan 30 daq oldin', date: today },
      ],
      vitalSigns: [
        { time: '08:00', date: today, temperature: 36.4, bloodPressure: '160/100', pulse: 98, respRate: 24, spo2: 92, sugar: 8.2, weight: 90, nurse: 'STF-004' },
        { time: '14:00', date: today, temperature: 36.5, bloodPressure: '150/95', pulse: 92, respRate: 22, spo2: 94, sugar: 7.5, weight: null, nurse: 'STF-005' },
      ],
      medications: [
        { name: 'Furosemid', dose: '40mg', time: '08:00', status: 'given', nurse: 'STF-004', date: today },
        { name: 'Digoksin', dose: '0.25mg', time: '08:00', status: 'given', nurse: 'STF-004', date: today },
        { name: 'Insulin', dose: '10 birlik', time: '07:30', status: 'given', nurse: 'STF-004', date: today },
        { name: 'Furosemid', dose: '40mg', time: '14:00', status: 'given', nurse: 'STF-005', date: today },
        { name: 'Insulin', dose: '10 birlik', time: '13:30', status: 'pending', nurse: null, date: today },
      ],
      treatments: [
        { type: 'Tomchi (dropper)', name: 'Dobutamin', time: '09:00', status: 'done', nurse: 'STF-004', date: today },
        { type: 'Kislorod terapiyasi', name: 'Kislorod 4L/min', time: '08:00', status: 'done', nurse: 'STF-004', date: today },
      ],
      diet: { type: 'Yurak', restrictions: ['Tuz yo\'q', "Yog' cheklangan", 'Suyuqlik 1.5L/kun'], meals: { breakfast: true, lunch: false, dinner: false } },
      nurseNotes: [
        { shift: 'Tonggi', time: '08:30', note: "Bemor qiyin holda keldi. Nafas qisilishi bor. Kislorod berilmoqda. SpO2 92% dan 94% ga ko'tarildi.", nurse: 'STF-004', date: today },
      ],
      overallCondition: 'critical',
    },
    {
      id: 'KL-2024-1006', firstName: 'Nigora', lastName: 'Salimova', middleName: 'Rustamovna',
      birthDate: '2000-12-05', gender: 'Ayol', nationality: "O'zbek",
      phone: '+998906666666', phone2: '', email: 'nigora@mail.uz',
      address: { region: 'Toshkent', district: 'Olmazor', street: "Navoiy ko'chasi 89" },
      bloodGroup: 'O-', allergies: ['Aspirin'], chronicDiseases: [],
      visitReason: 'Angina', visitType: 'Birinchi marta', status: 'tuzalgan',
      assignedDoctor: 'STF-001', roomId: null, admissionDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      expectedDischarge: null, insurance: null,
      queueNumber: null, queueTime: null, queueStatus: 'completed',
      visits: [
        { date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], doctor: 'STF-001', diagnosis: 'Angina', icdCode: 'J03', notes: "Antibiotik yozildi, 5 kundan keyin tekshiruv" },
        { date: today, doctor: 'STF-001', diagnosis: 'Angina - tuzalgan', icdCode: 'J03', notes: "Tuzalib chiqqan, davolanish yakunlandi" }
      ],
      prescriptions: [
        { medicine: 'Amoksitsillin', dose: '500mg', frequency: '3 mahal', duration: '7 kun', instructions: 'Ovqatdan keyin', date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0] },
      ],
      vitalSigns: [],
      medications: [],
      treatments: [],
      diet: null,
      nurseNotes: [],
      overallCondition: 'good',
    },
    {
      id: 'KL-2024-1007', firstName: 'Rustam', lastName: 'Qodirov', middleName: 'Sherzod o\'g\'li',
      birthDate: '1972-04-18', gender: 'Erkak', nationality: "O'zbek",
      phone: '+998907777777', phone2: '', email: '',
      address: { region: 'Buxoro', district: 'Buxoro shahar', street: "Navoiy ko'chasi 5" },
      bloodGroup: 'B-', allergies: [], chronicDiseases: ['Buyrak toshi'],
      visitReason: "Bel og'rig'i", visitType: 'Qayta', status: 'navbatda',
      assignedDoctor: 'STF-001', roomId: null, admissionDate: today,
      expectedDischarge: null, insurance: null,
      queueNumber: 7, ticketNumber: 'TER-04', doctorQueueNumber: 4, queueTime: '11:30', queueStatus: 'waiting',
      visits: [],
      prescriptions: [],
      vitalSigns: [],
      medications: [],
      treatments: [],
      diet: null,
      nurseNotes: [],
      overallCondition: 'good',
    },
    {
      id: 'KL-2024-1008', firstName: 'Fotima', lastName: 'Xasanova', middleName: 'Ulug\'bek qizi',
      birthDate: '1988-09-25', gender: 'Ayol', nationality: "O'zbek",
      phone: '+998908888888', phone2: '', email: 'fotima88@gmail.com',
      address: { region: 'Toshkent', district: 'Shayhontohur', street: "Bog' ko'chasi 21" },
      bloodGroup: 'AB-', allergies: ['Novokain', 'Yong\'oq'], chronicDiseases: ['Allergik rinit'],
      visitReason: "Ko'z tekshiruvi", visitType: 'Birinchi marta', status: 'navbatda',
      assignedDoctor: 'STF-001', roomId: null, admissionDate: today,
      expectedDischarge: null, insurance: { company: "O'zsug'urta", policyNumber: 'INS-2024-7712', validUntil: '2025-08-20' },
      queueNumber: 8, ticketNumber: 'TER-05', doctorQueueNumber: 5, queueTime: '12:00', queueStatus: 'waiting',
      visits: [],
      prescriptions: [],
      vitalSigns: [],
      medications: [],
      treatments: [],
      diet: null,
      nurseNotes: [],
      overallCondition: 'good',
    },
    {
      id: 'KL-2024-1009', firstName: 'Sherzod', lastName: 'Aliyev', middleName: 'Ibrohim o\'g\'li',
      birthDate: '1955-01-10', gender: 'Erkak', nationality: "O'zbek",
      phone: '+998909999999', phone2: '', email: '',
      address: { region: 'Toshkent', district: 'Bektemir', street: "Tinchlik ko'chasi 3" },
      bloodGroup: 'O+', allergies: [], chronicDiseases: ['XOBL', 'Gipertoniya'],
      visitReason: "Yo'tal va nafas qisilishi", visitType: 'Qayta', status: 'tuzalgan',
      assignedDoctor: 'STF-002', roomId: null,
      admissionDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      expectedDischarge: null, insurance: null,
      queueNumber: null, queueTime: null, queueStatus: 'completed',
      visits: [
        { date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], doctor: 'STF-002', diagnosis: 'XOBL kuchayishi', icdCode: 'J44', notes: "Stasionarga yotqizildi, davolandi, chiqarildi" },
      ],
      prescriptions: [
        { medicine: 'Salbutamol inhaler', dose: '2 puf', frequency: 'Zarur bo\'lganda', duration: 'Doimiy', instructions: 'Nafas qisilganda', date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0] },
      ],
      vitalSigns: [],
      medications: [],
      treatments: [],
      diet: null,
      nurseNotes: [],
      overallCondition: 'good',
    },
    {
      id: 'KL-2024-1010', firstName: 'Dildora', lastName: 'Yusupova', middleName: 'Abdulhay qizi',
      birthDate: '2010-06-20', gender: 'Ayol', nationality: "O'zbek",
      phone: '+998900000001', phone2: '+998710001122', email: '',
      address: { region: 'Toshkent', district: 'Sergeli', street: "Yosh gvardiya ko'chasi 8" },
      bloodGroup: 'A+', allergies: [], chronicDiseases: [],
      visitReason: "Tish og'rig'i", visitType: 'Birinchi marta', status: 'ambulatoriya',
      assignedDoctor: 'STF-001', roomId: null, admissionDate: today,
      expectedDischarge: null, insurance: null,
      queueNumber: 2, ticketNumber: 'TER-01', doctorQueueNumber: 1, queueTime: '09:30', queueStatus: 'in-progress',
      visits: [
        { date: today, doctor: 'STF-001', diagnosis: 'Kariyes', icdCode: 'K02', notes: "Stomatologga yo'naltirildi" }
      ],
      prescriptions: [],
      vitalSigns: [],
      medications: [],
      treatments: [],
      diet: null,
      nurseNotes: [],
      overallCondition: 'good',
    },
  ];
}

export function getDefaultMedicines() {
  return [
    { id: 'MED-001', name: 'Amoksitsillin', category: 'Antibiotik', quantity: 500, unit: 'tabletka', unitPrice: 2000, expiryDate: '2025-08-15', minStock: 100, location: 'A-1', supplier: 'Dori Darmon' },
    { id: 'MED-002', name: 'Paratsetamol', category: "Og'riq qoldiruvchi", quantity: 800, unit: 'tabletka', unitPrice: 1000, expiryDate: '2026-03-20', minStock: 200, location: 'A-2', supplier: 'Pharma Plus' },
    { id: 'MED-003', name: 'Ibuprofen', category: "Og'riq qoldiruvchi", quantity: 350, unit: 'tabletka', unitPrice: 1500, expiryDate: '2025-12-10', minStock: 100, location: 'A-3', supplier: 'Dori Darmon' },
    { id: 'MED-004', name: 'Vitamin C', category: 'Vitamin', quantity: 1200, unit: 'tabletka', unitPrice: 800, expiryDate: '2026-06-01', minStock: 200, location: 'B-1', supplier: 'Vita Farm' },
    { id: 'MED-005', name: 'Aspirin', category: 'Yurak', quantity: 600, unit: 'tabletka', unitPrice: 1200, expiryDate: '2025-11-30', minStock: 150, location: 'B-2', supplier: 'Pharma Plus' },
    { id: 'MED-006', name: 'Atorvastatin', category: 'Yurak', quantity: 200, unit: 'tabletka', unitPrice: 5000, expiryDate: '2025-09-15', minStock: 50, location: 'B-3', supplier: 'Cardio Med' },
    { id: 'MED-007', name: 'Diazepam', category: 'Asab', quantity: 80, unit: 'tabletka', unitPrice: 3000, expiryDate: '2025-07-20', minStock: 30, location: 'C-1', supplier: 'Neuro Farm' },
    { id: 'MED-008', name: 'Loratadin', category: 'Allergiya', quantity: 450, unit: 'tabletka', unitPrice: 1800, expiryDate: '2026-01-15', minStock: 100, location: 'C-2', supplier: 'Dori Darmon' },
    { id: 'MED-009', name: 'Omeprazol', category: 'Oshqozon', quantity: 300, unit: 'kapsula', unitPrice: 2500, expiryDate: '2025-10-05', minStock: 80, location: 'C-3', supplier: 'Pharma Plus' },
    { id: 'MED-010', name: 'Metformin', category: 'Diabet', quantity: 400, unit: 'tabletka', unitPrice: 3500, expiryDate: '2026-02-28', minStock: 100, location: 'D-1', supplier: 'Dia Farm' },
    { id: 'MED-011', name: 'Kaptopress', category: 'Bosim', quantity: 550, unit: 'tabletka', unitPrice: 2200, expiryDate: '2025-12-31', minStock: 120, location: 'D-2', supplier: 'Cardio Med' },
    { id: 'MED-012', name: 'Sefazolin', category: 'Antibiotik', quantity: 150, unit: 'flakon', unitPrice: 8000, expiryDate: '2025-08-01', minStock: 50, location: 'A-4', supplier: 'Dori Darmon' },
    { id: 'MED-013', name: 'Furosemid', category: 'Yurak', quantity: 300, unit: 'tabletka', unitPrice: 1500, expiryDate: '2026-04-15', minStock: 80, location: 'B-4', supplier: 'Cardio Med' },
    { id: 'MED-014', name: 'Ketonal', category: "Og'riq qoldiruvchi", quantity: 25, unit: 'ampula', unitPrice: 12000, expiryDate: '2025-07-10', minStock: 30, location: 'E-1', supplier: 'Pharma Plus' },
    { id: 'MED-015', name: 'Insulin Aktrapid', category: 'Diabet', quantity: 40, unit: 'flakon', unitPrice: 45000, expiryDate: '2025-09-30', minStock: 20, location: 'F-1', supplier: 'Dia Farm' },
    { id: 'MED-016', name: 'Digoksin', category: 'Yurak', quantity: 180, unit: 'tabletka', unitPrice: 4000, expiryDate: '2026-05-20', minStock: 50, location: 'B-5', supplier: 'Cardio Med' },
    { id: 'MED-017', name: 'Salbutamol inhaler', category: 'Shamollash', quantity: 60, unit: 'dona', unitPrice: 25000, expiryDate: '2026-01-10', minStock: 20, location: 'G-1', supplier: 'Vita Farm' },
    { id: 'MED-018', name: 'Foliy kislota', category: 'Vitamin', quantity: 900, unit: 'tabletka', unitPrice: 600, expiryDate: '2026-08-15', minStock: 200, location: 'B-6', supplier: 'Vita Farm' },
    { id: 'MED-019', name: 'Temir preparati', category: 'Vitamin', quantity: 400, unit: 'tabletka', unitPrice: 3000, expiryDate: '2026-03-10', minStock: 100, location: 'B-7', supplier: 'Vita Farm' },
    { id: 'MED-020', name: 'NaCl 0.9%', category: 'Shamollash', quantity: 100, unit: 'flakon', unitPrice: 10000, expiryDate: '2026-12-01', minStock: 30, location: 'H-1', supplier: 'Infuzion Med' },
  ];
}

export function getDefaultServices() {
  return [
    { id: 'SRV-001', name: 'Terapevt konsultatsiyasi', category: 'Konsultatsiya', price: 80000, discount: 0, active: true },
    { id: 'SRV-002', name: 'Kardiolog konsultatsiyasi', category: 'Konsultatsiya', price: 120000, discount: 0, active: true },
    { id: 'SRV-003', name: 'Jarroh konsultatsiyasi', category: 'Konsultatsiya', price: 100000, discount: 0, active: true },
    { id: 'SRV-004', name: 'Umumiy qon tahlili', category: 'Tahlil', price: 50000, discount: 0, active: true },
    { id: 'SRV-005', name: 'Bioximik qon tahlili', category: 'Tahlil', price: 80000, discount: 0, active: true },
    { id: 'SRV-006', name: 'Siydik tahlili', category: 'Tahlil', price: 30000, discount: 0, active: true },
    { id: 'SRV-007', name: "Ko'krak qafasi rentgeni", category: 'Rentgen/UZI', price: 100000, discount: 0, active: true },
    { id: 'SRV-008', name: "Qorin bo'shlig'i UZI", category: 'Rentgen/UZI', price: 120000, discount: 0, active: true },
    { id: 'SRV-009', name: 'EKG', category: 'Tahlil', price: 60000, discount: 0, active: true },
    { id: 'SRV-010', name: 'Appendektomiya', category: 'Operatsiya', price: 5000000, discount: 0, active: true },
    { id: 'SRV-011', name: 'Fizioterapiya seansi', category: 'Fizioterapiya', price: 40000, discount: 0, active: true },
    { id: 'SRV-012', name: "Tish plomba qo'yish", category: 'Stomatologiya', price: 150000, discount: 0, active: true },
    { id: 'SRV-013', name: 'Yurak UZI (ExoKG)', category: 'Rentgen/UZI', price: 200000, discount: 0, active: true },
    { id: 'SRV-014', name: 'MRT tekshiruvi', category: 'Rentgen/UZI', price: 500000, discount: 0, active: true },
    { id: 'SRV-015', name: 'Tez yordam chaqiruvi', category: 'Tez yordam', price: 200000, discount: 0, active: true },
  ];
}

export function getDefaultFinances() {
  const today = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      income: Math.floor(5000000 + Math.random() * 10000000),
      expense: Math.floor(2000000 + Math.random() * 3000000),
      patients: Math.floor(8 + Math.random() * 15),
    });
  }
  return days;
}

export function getDefaultPayments() {
  const today = new Date().toISOString().split('T')[0];
  return [
    { id: 'PAY-001', patientId: 'KL-2024-1001', date: today, services: ['Kardiolog konsultatsiyasi', 'EKG', 'Yurak UZI (ExoKG)'], totalAmount: 380000, discount: 0, paid: 380000, method: 'Karta', status: 'paid' },
    { id: 'PAY-002', patientId: 'KL-2024-1002', date: today, services: ['Terapevt konsultatsiyasi'], totalAmount: 80000, discount: 0, paid: 80000, method: 'Naqd', status: 'paid' },
    { id: 'PAY-003', patientId: 'KL-2024-1003', date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], services: ['Appendektomiya', 'Umumiy qon tahlili'], totalAmount: 5050000, discount: 250000, paid: 3000000, method: "Sug'urta", status: 'partial' },
    { id: 'PAY-004', patientId: 'KL-2024-1004', date: today, services: ['Terapevt konsultatsiyasi', "Qorin bo'shlig'i UZI"], totalAmount: 200000, discount: 0, paid: 200000, method: 'Naqd', status: 'paid' },
    { id: 'PAY-005', patientId: 'KL-2024-1005', date: today, services: ['Kardiolog konsultatsiyasi', 'EKG', 'Tez yordam chaqiruvi'], totalAmount: 380000, discount: 0, paid: 0, method: "Sug'urta", status: 'unpaid' },
    { id: 'PAY-006', patientId: 'KL-2024-1006', date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], services: ['Terapevt konsultatsiyasi'], totalAmount: 80000, discount: 10000, paid: 70000, method: 'Naqd', status: 'paid' },
    { id: 'PAY-007', patientId: 'KL-2024-1010', date: today, services: ['Terapevt konsultatsiyasi'], totalAmount: 80000, discount: 0, paid: 80000, method: 'Karta', status: 'paid' },
  ];
}

export function getDefaultPrescriptionQueue() {
  const today = new Date().toISOString().split('T')[0];
  return [
    { id: 'RX-001', patientId: 'KL-2024-1001', doctorId: 'STF-002', date: today, status: 'completed',
      medicines: [
        { name: 'Aspirin', dose: '100mg', quantity: 30 },
        { name: 'Atorvastatin', dose: '20mg', quantity: 90 },
      ]
    },
    { id: 'RX-002', patientId: 'KL-2024-1003', doctorId: 'STF-003', date: today, status: 'pending',
      medicines: [
        { name: 'Sefazolin', dose: '1g', quantity: 21 },
        { name: 'Ketonal', dose: '100mg', quantity: 10 },
      ]
    },
    { id: 'RX-003', patientId: 'KL-2024-1005', doctorId: 'STF-002', date: today, status: 'pending',
      medicines: [
        { name: 'Furosemid', dose: '40mg', quantity: 20 },
        { name: 'Digoksin', dose: '0.25mg', quantity: 14 },
      ]
    },
    { id: 'RX-004', patientId: 'KL-2024-1002', doctorId: 'STF-001', date: today, status: 'completed',
      medicines: [
        { name: 'Ibuprofen', dose: '400mg', quantity: 10 },
      ]
    },
  ];
}

export function getDefaultNotifications() {
  const now = new Date();
  return [
    { id: 'NOT-001', type: 'medicine', message: "Ketonal miqdori kam qoldi (25 ta)", time: now.toISOString(), roles: ['admin'], read: false },
    { id: 'NOT-002', type: 'patient', message: "Yangi bemor qabul qilindi: Olim Ergashev (Tez yordam)", time: new Date(now - 3600000).toISOString(), roles: ['doctor', 'nurse'], read: false },
    { id: 'NOT-003', type: 'queue', message: "3 ta bemor navbatda kutmoqda", time: new Date(now - 1800000).toISOString(), roles: ['doctor'], read: false },
    { id: 'NOT-004', type: 'sos', message: "⚠️ Dori muddati tugamoqda: Diazepam (2025-07-20)", time: new Date(now - 7200000).toISOString(), roles: ['admin', 'nurse'], read: true },
    { id: 'NOT-005', type: 'payment', message: "Jasur Xolmatov - 2,050,000 so'm qarz qoldig'i", time: new Date(now - 5400000).toISOString(), roles: ['admin', 'reception'], read: false },
    { id: 'NOT-006', type: 'discharge', message: "Sherzod Aliyev bugun chiqarildi", time: new Date(now - 9000000).toISOString(), roles: ['reception'], read: true },
  ];
}

export function getDefaultActivityLog() {
  const now = new Date();
  return [
    { id: 'LOG-001', user: 'Sardor (Resepshion)', action: "Yangi bemor ro'yxatdan o'tkazildi", target: 'Olim Ergashev', time: new Date(now - 1800000).toISOString() },
    { id: 'LOG-002', user: 'Akbar (Shifokor)', action: 'Tashxis qo\'yildi', target: 'Malika Tursunova - Migren', time: new Date(now - 3600000).toISOString() },
    { id: 'LOG-003', user: 'Nodira (Hamshira)', action: 'Dori berildi', target: 'Aziz Sobirov - Aspirin 100mg', time: new Date(now - 5400000).toISOString() },
    { id: 'LOG-004', user: 'Nodira (Hamshira)', action: 'Retsept bo\'yicha dori berdi', target: 'Aziz Sobirov - Aspirin, Atorvastatin', time: new Date(now - 7200000).toISOString() },
    { id: 'LOG-005', user: 'Sardor (Resepshion)', action: "To'lov qabul qilindi", target: 'Shahlo Mirzayeva - 200,000 so\'m', time: new Date(now - 9000000).toISOString() },
    { id: 'LOG-006', user: 'Bobur (Jarroh)', action: 'Bemorni operatsiya qildi', target: 'Jasur Xolmatov - Appendektomiya', time: new Date(now - 2 * 86400000).toISOString() },
    { id: 'LOG-007', user: 'Malika (Hamshira)', action: "Vital belgilar o'lchandi", target: "Jasur Xolmatov - Harorat: 37.5°C", time: new Date(now - 10800000).toISOString() },
    { id: 'LOG-008', user: 'Admin', action: "Yangi xodim qo'shildi", target: 'Sardor Nazarov - Resepshion', time: new Date(now - 5 * 86400000).toISOString() },
  ];
}

export function getDefaultClinicSettings() {
  return {
    name: 'Hayot Klinikasi',
    logo: null,
    address: "Toshkent shahri, Chilonzor tumani, Bunyodkor ko'chasi, 15-uy",
    phone: '+998 71 200 00 01',
    email: 'info@hayotklinika.uz',
    workHours: {
      weekdays: { start: '08:00', end: '20:00' },
      saturday: { start: '09:00', end: '15:00' },
      sunday: { start: null, end: null },
    },
    language: "O'zbek",
  };
}

export function getDefaultDiseaseStats() {
  return [
    { name: 'Gipertoniya (I10)', count: 45 },
    { name: 'Diabet (E11)', count: 32 },
    { name: 'XOBL (J44)', count: 18 },
    { name: 'Gastrit (K29)', count: 25 },
    { name: 'Angina (J03)', count: 15 },
    { name: 'Appenditsit (K35)', count: 8 },
    { name: 'Migren (G43)', count: 22 },
    { name: 'Stenokardiya (I20)', count: 12 },
  ];
}

export function getDefaultCallLog() {
  const today = new Date().toISOString().split('T')[0];
  return [
    { id: 'CALL-001', date: today, time: '08:15', callerName: 'Anvar Toshmatov', phone: '+998901112233', reason: "Navbat olish", note: "14:00 ga yozildi, Terapevt", status: 'completed' },
    { id: 'CALL-002', date: today, time: '09:00', callerName: 'Zulfiya Karimova', phone: '+998902223344', reason: "Tahlil natijasi", note: "Ertaga tayyor bo'ladi deb aytildi", status: 'completed' },
    { id: 'CALL-003', date: today, time: '09:45', callerName: "Noma'lum", phone: '+998903334455', reason: "Narxlar haqida so'radi", note: "Konsultatsiya narxlari aytildi", status: 'completed' },
    { id: 'CALL-004', date: today, time: '10:30', callerName: 'Rustam Qodirov', phone: '+998907777777', reason: "Navbat olish", note: "11:30 ga yozildi", status: 'completed' },
  ];
}

export function getDefaultSuppliers() {
  return [
    { id: 'SUP-001', name: 'Dori Darmon', phone: '+998712001001', email: 'info@doridarmon.uz', address: "Toshkent, Mirzo Ulug'bek tumani" },
    { id: 'SUP-002', name: 'Pharma Plus', phone: '+998712002002', email: 'sales@pharmaplus.uz', address: "Toshkent, Chilonzor tumani" },
    { id: 'SUP-003', name: 'Vita Farm', phone: '+998712003003', email: 'info@vitafarm.uz', address: "Toshkent, Yunusobod tumani" },
    { id: 'SUP-004', name: 'Cardio Med', phone: '+998712004004', email: 'order@cardiomed.uz', address: "Toshkent, Yakkasaroy tumani" },
    { id: 'SUP-005', name: 'Neuro Farm', phone: '+998712005005', email: 'info@neurofarm.uz', address: "Samarqand shahri" },
    { id: 'SUP-006', name: 'Dia Farm', phone: '+998712006006', email: 'sales@diafarm.uz', address: "Buxoro shahri" },
    { id: 'SUP-007', name: 'Infuzion Med', phone: '+998712007007', email: 'info@infuzionmed.uz', address: "Toshkent, Sergeli tumani" },
  ];
}
