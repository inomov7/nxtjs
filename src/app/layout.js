import { Inter } from "next/font/google";
import "./globals.css";
import { CrmProvider } from '@/lib/CrmContext';
import { ToastProvider } from '@/components/SharedComponents';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const metadata = {
  title: "Hayot Klinikasi — CRM Boshqaruv Tizimi",
  description: "To'liq funksional klinika CRM tizimi: bemorlar, shifokorlar, hamshiralar, resepshion va aptek boshqaruvi",
  keywords: "klinika, CRM, tibbiyot, boshqaruv, bemor, shifokor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="uz" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">
        <CrmProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </CrmProvider>
      </body>
    </html>
  );
}
