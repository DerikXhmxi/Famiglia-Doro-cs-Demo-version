import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConnectivityGuard from "@/components/ConnectivityGuard"; // <--- IMPORT THIS
import "@/lib/i18n";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Famiglia Oro CS",
  description: "Golden Family Creator Suite",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* WRAP CHILDREN HERE */}
        <ConnectivityGuard>
          {children}
        </ConnectivityGuard>
      </body>
    </html>
  );
}