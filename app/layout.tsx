import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Colloquio — domande per colloqui tecnici",
  description:
    "Domande e risposte per preparare colloqui da sviluppatore, organizzate per argomento e stampabili in PDF.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
