import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DelTech - Asisten Pilah Sampah AI",
  description: "Pilah sampah dengan AI, kumpulkan poin, dan selamatkan Bali.",
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