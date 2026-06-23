import * as XLSX from 'xlsx';
import { readDb, insertEntity } from './db';

export async function checkAndSendTelegramPatients() {
  try {
    const data = await readDb();
    const patients = data.patients || [];
    
    // Unsent patients are those whose telegramSent is not true
    const unsentPatients = patients.filter(p => !p.telegramSent);

    if (unsentPatients.length >= 20) {
      // Get the first 20 unsent patients
      const batch = unsentPatients.slice(0, 20);

      // Get Telegram Bot Token and Chat ID strictly from environment variables for security
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      if (!botToken || !chatId) {
        console.warn("[Telegram Bot] Bot token or Chat ID is missing in environment variables. Skipping Excel report.");
        return;
      }

      // Map patient data to rows for Excel
      const rows = batch.map((p, idx) => ({
        "T/r": idx + 1,
        "Ism": p.firstName || "",
        "Familiya": p.lastName || "",
        "Telefon (asosiy)": p.phone || "",
        "Qo'shimcha telefon": p.phone2 || "",
        "Yashash manzili": p.address 
          ? `${p.address.region || ""}, ${p.address.district || ""}, ${p.address.street || ""}`.trim().replace(/^,|,$/g, '')
          : ""
      }));

      // Create Excel workbook and sheet
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Bemorlar Ro'yxati");

      // Write excel workbook to buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Create native FormData and Blob for uploading
      const formData = new FormData();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fileName = `bemorlar_baza_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      formData.append('chat_id', chatId);
      formData.append('document', blob, fileName);
      formData.append('caption', `📊 *Klinika CRM: Baza yangilandi*\n\nYangi 20 ta bemor ro'yxatdan o'tdi. Excel fayl shakllantirildi va yuklandi.\n\n📅 Sana: ${new Date().toLocaleString('uz-UZ')}`);

      // Call Telegram API document upload endpoint
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        console.log(`[Telegram Bot] Successfully sent Excel file with 20 patients.`);
        
        // Update database: mark these 20 patients as telegramSent = true
        const { openDb, run } = await import('./db');
        const db = await openDb();
        try {
          await run(db, 'BEGIN TRANSACTION');
          for (const p of batch) {
            const row = await db.get(`SELECT value FROM patients WHERE id = ?`, [p.id]);
            if (row) {
              const currentVal = JSON.parse(row.value);
              currentVal.telegramSent = true;
              await db.run(`UPDATE patients SET value = ? WHERE id = ?`, [JSON.stringify(currentVal), p.id]);
            }
          }
          await run(db, 'COMMIT');
        } catch (dbErr) {
          await run(db, 'ROLLBACK').catch(() => {});
          console.error("[Telegram Bot] Failed to update telegramSent status in DB:", dbErr);
        } finally {
          db.close();
        }

        // Write to system activityLog
        try {
          const logEntry = {
            id: 'LOG-TG-' + Date.now() + Math.floor(Math.random() * 1000),
            user: 'CRM Tizimi',
            action: 'Bemorlar bazasi Telegramga yuborildi',
            target: '20 ta bemor (Excel fayl)',
            time: new Date().toISOString()
          };
          await insertEntity('activityLog', logEntry);
        } catch (logErr) {
          console.error("[Telegram Bot] Failed to write activity log:", logErr);
        }
      } else {
        const errText = await res.text();
        console.error("[Telegram Bot] API error from Telegram:", errText);
      }
    }
  } catch (error) {
    console.error("[Telegram Bot] Error generating or sending Excel report:", error);
  }
}
