import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pilah Sampah AI - DelTech",
  description: "Asisten Pilah Sampah AI untuk Bali",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}