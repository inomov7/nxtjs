import { Inter } from "next/font/google";
import "./globals.css";

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
    <html lang="uz" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
