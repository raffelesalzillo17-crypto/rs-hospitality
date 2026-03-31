import type { Metadata } from "next";
import "./globals.css";
import WhatsAppButton from "@/app/components/WhatsAppButton";

export const metadata: Metadata = {
  title: {
    default: "RS Hospitality — Affitti brevi a Marcianise, Caserta",
    template: "%s | RS Hospitality",
  },
  description:
    "Affitti brevi a Marcianise, Caserta. Il Tulipano: camera matrimoniale con bagno privato esclusivo a pochi minuti dal casello A1. Prenota su Booking o Airbnb.",
  openGraph: {
    title: "RS Hospitality — Affitti brevi a Marcianise, Caserta",
    description:
      "Camera matrimoniale con bagno privato a Marcianise (CE). Affitti brevi vicino Caserta.",
    siteName: "RS Hospitality",
    locale: "it_IT",
    type: "website",
    images: [
      {
        url: "/images/tulipano/Foto letto ampia.png",
        width: 1200,
        height: 630,
        alt: "Il Tulipano — camera matrimoniale a Marcianise",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RS Hospitality — Affitti brevi Marcianise, Caserta",
    description:
      "Camera matrimoniale con bagno privato a Marcianise (CE). Prenotazione su Booking e Airbnb.",
    images: ["/images/tulipano/Foto letto ampia.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "RS Hospitality",
    description: "Affitti brevi a Marcianise, Caserta. Camera matrimoniale con bagno privato esclusivo.",
    telephone: "+393661033691",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Via Clanio 60",
      addressLocality: "Marcianise",
      addressRegion: "CE",
      postalCode: "81025",
      addressCountry: "IT",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 41.0312,
      longitude: 14.2991,
    },
    priceRange: "€€",
    image: "/images/tulipano/Foto letto ampia.png",
    sameAs: [
      "https://www.booking.com/Share-KLD1dK0",
      "https://www.airbnb.it/rooms/1151100346729188269",
    ],
  };

  return (
    <html lang="it">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        {children}

        {/* ── WHATSAPP BUTTON (nascosto su /admin) ── */}
        <WhatsAppButton />
      </body>
    </html>
  );
}
