import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Ajaia Docs",
    template: "%s · Ajaia Docs",
  },
  description: "A focused workspace for writing, importing, and sharing documents with your team.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
