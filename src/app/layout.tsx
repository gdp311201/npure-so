import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const LOGO_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/npure-assets/logo.png`;

export const metadata: Metadata = {
  title: "NPURE SO — Stock Opname System",
  description: "Sistem stock opname personal untuk brand kosmetik NPURE",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NPURE SO",
  },
  icons: {
    icon: LOGO_URL,
    apple: LOGO_URL,
    shortcut: LOGO_URL,
  },
};

export const viewport: Viewport = {
  themeColor: "#ec4899",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id-ID">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="wallpaper-bg" />
        <div className="wallpaper-veil" />
        {children}
      </body>
    </html>
  );
}
