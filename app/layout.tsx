import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "wesk.cc - AI Ассистент",
  description: "Ваш русскоязычный AI-ассистент для решения любых задач",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
