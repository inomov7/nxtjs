import fs from 'fs/promises';
import path from 'path';
import {
  getDefaultStaff, getDefaultRooms, getDefaultPatients, getDefaultMedicines,
  getDefaultServices, getDefaultFinances, getDefaultPayments, getDefaultPrescriptionQueue,
  getDefaultNotifications, getDefaultActivityLog, getDefaultClinicSettings,
  getDefaultCallLog, getDefaultSuppliers
} from './demoData';

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

export async function readDb() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If the file doesn't exist, create it with all default demo data
    await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
    const defaultDb = {
      staff: getDefaultStaff(),
      rooms: getDefaultRooms(),
      patients: getDefaultPatients(),
      medicines: getDefaultMedicines(),
      services: getDefaultServices(),
      finances: getDefaultFinances(),
      payments: getDefaultPayments(),
      prescriptionQueue: getDefaultPrescriptionQueue(),
      notifications: getDefaultNotifications(),
      activityLog: getDefaultActivityLog(),
      clinicSettings: getDefaultClinicSettings(),
      callLog: getDefaultCallLog(),
      suppliers: getDefaultSuppliers()
    };
    await writeDb(defaultDb);
    return defaultDb;
  }
}

export async function writeDb(data) {
  await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
