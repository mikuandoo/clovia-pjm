import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clovia High Creative PM",
  description: "High creative production management prototype for Clovia."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
