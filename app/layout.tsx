import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AINARA Trace — Recycled Gold Traceability",
  description: "AINARA Trace digital traceability platform for recycled gold supply chains.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
