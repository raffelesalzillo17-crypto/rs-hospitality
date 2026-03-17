import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RS Hospitality — Property Management a Marcianise",
  description:
    "RS Hospitality gestisce appartamenti di qualità a Marcianise, Italia. Due categorie: RS Comfort e RS Superior.",
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
