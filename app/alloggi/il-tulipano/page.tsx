"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

const c = {
  tabacco: "#2C2416",
  lino: "#F0EBE0",
  cammello: "#8B7355",
  sabbia: "#D4C9B5",
} as const;

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

const fade = (inView: boolean, delay = 0): React.CSSProperties => ({
  opacity: inView ? 1 : 0,
  transform: inView ? "translateY(0)" : "translateY(20px)",
  transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
});

const gallery = [
  { src: "/images/tulipano/dettaglio letto.png",         alt: "Camera, dettaglio letto" },
  { src: "/images/tulipano/Foto letto ampia.png",        alt: "Camera matrimoniale" },
  { src: "/images/tulipano/cucina e sala da pranzo.png", alt: "Cucina e soggiorno" },
  { src: "/images/tulipano/colazione.png",               alt: "Kit benvenuto tè e caffè" },
  { src: "/images/tulipano/bagno vista amplia.png",      alt: "Bagno, vista ampia" },
  { src: "/images/tulipano/bagno.png",                   alt: "Bagno" },
  { src: "/images/tulipano/ingresso.png",                alt: "Ingresso" },
  { src: "/images/tulipano/Collage tot.png",             alt: "Alloggio — vista d'insieme" },
];

const dotazioni = [
  { label: "Wi-Fi gratuito",           path: "M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0L12 20h.01" },
  { label: "Bagno privato esclusivo",  path: "M12 2a5 5 0 0 0-5 5v3H5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V11a1 1 0 0 0-1-1h-2V7a5 5 0 0 0-5-5zM12 14v3" },
  { label: "Letto matrimoniale",       path: "M2 4v16M22 4v16M2 13h20M8 13v-3a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3" },
  { label: "Asciugamani inclusi",      path: "M8 2h8v14H8zM6 16h12M5 19h14M5 22h14" },
  { label: "Kit benvenuto tè/caffè",   path: "M17 8h1a4 4 0 0 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" },
  { label: "Phon",                     path: "M3 12a6 6 0 0 1 6-6h6M15 6l4-4M15 10l4 4M19 2v8M9 12a3 3 0 0 0 3 3h3" },
  { label: "Vasca da bagno",           path: "M4 12h16M4 12V9a2 2 0 0 1 4 0v1M4 12v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" },
  { label: "TV",                       path: "M2 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8zM8 19h8M12 17v2" },
  { label: "Cucina condivisa",         path: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zM21 15v7" },
  { label: "Riscaldamento",            path: "M12 2c-4 4-6 8-6 11a6 6 0 0 0 12 0c0-3-2-7-6-11zM9 15s1 2 3 2 3-2 3-2" },
];


function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDateIT(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function IlTulipano() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    document.title = "Il Tulipano — Camera matrimoniale affitti brevi Marcianise, Caserta | RS Hospitality";

    const ldJson = {
      "@context": "https://schema.org",
      "@type": "LodgingBusiness",
      name: "Il Tulipano — RS Hospitality",
      description: "Camera matrimoniale con bagno privato ad uso esclusivo a Marcianise (CE). Affitti brevi vicino Caserta, da €55 a notte.",
      telephone: "+393661033691",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Via Clanio 60",
        addressLocality: "Marcianise",
        addressRegion: "CE",
        postalCode: "81025",
        addressCountry: "IT",
      },
      priceRange: "€55–€80",
      image: "/images/tulipano/Foto letto ampia.png",
      amenityFeature: [
        { "@type": "LocationFeatureSpecification", name: "Wi-Fi gratuito", value: true },
        { "@type": "LocationFeatureSpecification", name: "Bagno privato esclusivo", value: true },
        { "@type": "LocationFeatureSpecification", name: "Letto matrimoniale", value: true },
      ],
    };
    let script = document.getElementById("ld-lodging") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "ld-lodging";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(ldJson);
    return () => { script?.remove(); };
  }, []);

  const [descRef,    descInView]    = useInView();
  const [dotRef,     dotInView]     = useInView();
  const [prezzoRef,  prezzoInView]  = useInView();
  const [mappaRef,   mappaInView]   = useInView();

  // Form disponibilità
  const [formArrivo, setFormArrivo] = useState("");
  const [formPartenza, setFormPartenza] = useState("");
  const [formOspiti, setFormOspiti] = useState(2);
  const [disponibilita, setDisponibilita] = useState<boolean | null>(null);
  const [formVerificando, setFormVerificando] = useState(false);
  const [dateAlternative, setDateAlternative] = useState<{start: string; end: string}[]>([]);

  const verificaDisponibilita = async () => {
    if (!formArrivo || !formPartenza) return;
    setFormVerificando(true);
    setDisponibilita(null);
    setDateAlternative([]);
    try {
      const res = await fetch("/api/calendar");
      const data = await res.json();
      const events: { start: string; end: string }[] = data.events ?? [];
      const arrivo = new Date(formArrivo);
      const partenza = new Date(formPartenza);
      const occupato = events.some(({ start, end }) => {
        const s = new Date(start);
        const e = new Date(end);
        return arrivo < e && partenza > s;
      });
      setDisponibilita(!occupato);
      if (occupato) {
        const duration = Math.round((partenza.getTime() - arrivo.getTime()) / (1000 * 60 * 60 * 24));
        const alternatives: { start: string; end: string }[] = [];
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const searchEnd = new Date(today); searchEnd.setDate(searchEnd.getDate() + 120);
        const windowFree = (ws: Date, we: Date) =>
          !events.some(({ start, end }) => ws < new Date(end) && we > new Date(start));
        const cur = new Date(today);
        while (alternatives.length < 3 && cur < searchEnd) {
          const wStart = new Date(cur);
          const wEnd = new Date(cur); wEnd.setDate(wEnd.getDate() + duration);
          const startStr = toDateStr(wStart);
          if (windowFree(wStart, wEnd) && startStr !== formArrivo) {
            alternatives.push({ start: startStr, end: toDateStr(wEnd) });
            cur.setDate(cur.getDate() + duration);
          } else {
            cur.setDate(cur.getDate() + 1);
          }
        }
        setDateAlternative(alternatives);
      }
    } catch {
      setDisponibilita(null);
    } finally {
      setFormVerificando(false);
    }
  };

  const navLinks = [
    { label: "Alloggi",   href: "/#alloggi" },
    { label: "Chi siamo", href: "/#chi-siamo" },
    { label: "Contatti",  href: "/#footer" },
  ];

  const prevImg = () => setActiveImg((i) => (i - 1 + gallery.length) % gallery.length);
  const nextImg = () => setActiveImg((i) => (i + 1) % gallery.length);

  return (
    <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>

      {/* ── MOBILE OVERLAY ──────────────────────────────────────────────────── */}
      <div
        aria-hidden={!menuOpen}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: c.tabacco,
          zIndex: 250,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "2.5rem",
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? "all" : "none",
          transition: "opacity 0.3s ease",
        }}
      >
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            onClick={() => setMenuOpen(false)}
            style={{
              color: c.lino,
              textDecoration: "none",
              fontSize: "1.1rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontWeight: 300,
            }}
          >
            {link.label}
          </a>
        ))}
        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
          <a href="tel:+393661033691" style={{ color: c.cammello, textDecoration: "none", fontSize: "0.85rem", letterSpacing: "0.08em" }}>
            +39 366 103 3691
          </a>
          <a
            href="https://wa.me/393661033691"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: c.sabbia, textDecoration: "none", fontSize: "0.75rem", letterSpacing: "0.06em" }}
          >
            WhatsApp
          </a>
        </div>
      </div>

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 300,
          backgroundColor: scrolled ? c.tabacco : "transparent",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "none",
          transition: "background-color 0.4s ease",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 clamp(1.25rem, 5vw, 2.5rem)",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <a
            href="/"
            style={{
              color: c.lino,
              textDecoration: "none",
              fontSize: "0.78rem",
              fontWeight: 500,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            RS Hospitality
          </a>

          <div className="rs-nav-links">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                style={{
                  color: c.sabbia,
                  textDecoration: "none",
                  fontSize: "0.78rem",
                  letterSpacing: "0.08em",
                  transition: "color 0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = c.lino)}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = c.sabbia)}
              >
                {link.label}
              </a>
            ))}
          </div>

          <button
            className="rs-hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Chiudi menu" : "Apri menu"}
            aria-expanded={menuOpen}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  display: "block",
                  width: 22,
                  height: 1.5,
                  backgroundColor: c.lino,
                  transformOrigin: "center",
                  transition: "transform 0.28s ease, opacity 0.28s ease",
                  transform:
                    menuOpen && i === 0 ? "translateY(6.5px) rotate(45deg)"
                    : menuOpen && i === 2 ? "translateY(-6.5px) rotate(-45deg)"
                    : "none",
                  opacity: menuOpen && i === 1 ? 0 : 1,
                }}
              />
            ))}
          </button>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          height: "100svh",
          minHeight: 540,
          overflow: "hidden",
        }}
      >
        {/* Background photo */}
        <Image
          src="/images/tulipano/dettaglio letto.png"
          alt="Il Tulipano — camera matrimoniale"
          fill
          style={{ objectFit: "cover", objectPosition: "center" }}
          sizes="100vw"
          priority
        />
        {/* Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(to bottom, rgba(44,36,22,0.3) 0%, rgba(44,36,22,0.6) 100%)`,
          }}
        />
        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "6rem clamp(1.25rem, 5vw, 2rem) 4rem",
          }}
        >
          <p
            style={{
              color: c.sabbia,
              fontSize: "0.65rem",
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              marginBottom: "1.75rem",
              textShadow: "0 1px 3px rgba(0,0,0,0.6)",
            }}
          >
            RS Comfort · Via Clanio 60, Marcianise
          </p>

          <h1
            style={{
              color: c.lino,
              fontSize: "clamp(3rem, 8vw, 6rem)",
              fontWeight: 300,
              letterSpacing: "0.06em",
              lineHeight: 1.05,
              marginBottom: "2rem",
              textShadow: "0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            Il Tulipano
          </h1>

          <div style={{ width: 36, height: 1, backgroundColor: c.cammello, marginBottom: "3rem" }} />

          <a
            href="#galleria"
            style={{
              display: "inline-block",
              border: `1px solid ${c.cammello}`,
              color: c.lino,
              textDecoration: "none",
              fontSize: "0.68rem",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              padding: "0.85rem 2.4rem",
              transition: "background-color 0.25s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = c.cammello; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            Sfoglia le foto
          </a>
        </div>

        {/* Scroll line */}
        <div
          style={{
            position: "absolute",
            bottom: "2.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: 0.45,
          }}
        >
          <div style={{ width: 1, height: 44, backgroundColor: c.lino }} />
        </div>
      </section>

      {/* ── GALLERIA ────────────────────────────────────────────────────────── */}
      <section
        id="galleria"
        style={{
          backgroundColor: c.tabacco,
          padding: "clamp(3rem, 6vw, 5rem) clamp(1.25rem, 5vw, 2.5rem)",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* Main image */}
          <div style={{ position: "relative", overflow: "hidden", aspectRatio: "16 / 9", borderRadius: "2px" }}>
            <img
              key={activeImg}
              src={gallery[activeImg].src}
              alt={gallery[activeImg].alt}
              width={1200}
              height={675}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
                display: "block",
              }}
            />

            {/* Counter */}
            <div
              style={{
                position: "absolute",
                bottom: "1.25rem",
                right: "1.5rem",
                color: "rgba(240,235,224,0.6)",
                fontSize: "0.62rem",
                letterSpacing: "0.15em",
                fontWeight: 300,
              }}
            >
              {activeImg + 1} / {gallery.length}
            </div>

            {/* Prev */}
            <button
              onClick={prevImg}
              aria-label="Foto precedente"
              style={{
                position: "absolute", left: 0, top: 0, bottom: 0,
                width: "18%", background: "none", border: "none",
                cursor: "pointer", display: "flex", alignItems: "center",
                paddingLeft: "1.25rem",
              }}
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(240,235,224,0.7)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            {/* Next */}
            <button
              onClick={nextImg}
              aria-label="Foto successiva"
              style={{
                position: "absolute", right: 0, top: 0, bottom: 0,
                width: "18%", background: "none", border: "none",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "flex-end", paddingRight: "1.25rem",
              }}
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(240,235,224,0.7)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* Caption */}
          <p
            style={{
              color: "rgba(212,201,181,0.55)",
              fontSize: "0.62rem",
              letterSpacing: "0.1em",
              textAlign: "center",
              marginTop: "1rem",
              fontWeight: 300,
            }}
          >
            {gallery[activeImg].alt}
          </p>

          {/* Thumbnails */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              marginTop: "1.25rem",
              overflowX: "auto",
              paddingBottom: "4px",
              scrollbarWidth: "none",
            }}
          >
            {gallery.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                aria-label={img.alt}
                style={{
                  flex: "0 0 auto",
                  width: 80,
                  height: 54,
                  padding: 0,
                  border: i === activeImg ? `2px solid ${c.cammello}` : "2px solid transparent",
                  borderRadius: "2px",
                  cursor: "pointer",
                  overflow: "hidden",
                  transition: "border-color 0.2s, opacity 0.2s",
                  opacity: i === activeImg ? 1 : 0.45,
                  background: "none",
                }}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={80}
                  height={54}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── LOGO + DESCRIZIONE ──────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: c.lino,
          padding: "64px clamp(1.25rem, 5vw, 2.5rem)",
        }}
      >
        <div ref={descRef} style={{ maxWidth: 820, margin: "0 auto", ...fade(descInView) }}>

          {/* Logo + header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2rem",
              flexWrap: "wrap",
              marginBottom: "3rem",
            }}
          >
            <Image
              src="/images/tulipano/Logo.png"
              alt="Logo Il Tulipano"
              height={68}
              width={120}
              style={{ height: 68, width: "auto", objectFit: "contain", opacity: 0.82 }}
            />
            <div>
              <p
                style={{
                  color: c.cammello,
                  fontSize: "0.6rem",
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  marginBottom: "0.4rem",
                }}
              >
                RS Comfort
              </p>
              <h2
                style={{
                  color: c.tabacco,
                  fontSize: "clamp(1.4rem, 3vw, 1.9rem)",
                  fontWeight: 300,
                  letterSpacing: "0.02em",
                }}
              >
                Il Tulipano
              </h2>
              <p
                style={{
                  color: c.cammello,
                  fontSize: "0.72rem",
                  letterSpacing: "0.04em",
                  marginTop: "0.3rem",
                  fontWeight: 300,
                }}
              >
                Via Clanio 60, Marcianise (CE)
              </p>
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: c.sabbia, marginBottom: "3rem" }} />

          {/* Description */}
          <p
            style={{
              color: c.tabacco,
              fontSize: "clamp(0.95rem, 2vw, 1.05rem)",
              fontWeight: 300,
              lineHeight: 1.9,
              letterSpacing: "0.01em",
              marginBottom: "1.5rem",
            }}
          >
            Camera matrimoniale con bagno privato ad uso esclusivo, in un
            appartamento a pochi passi dalla stazione ferroviaria di Marcianise.
          </p>
          <p
            style={{
              color: c.tabacco,
              fontSize: "clamp(0.95rem, 2vw, 1.05rem)",
              fontWeight: 300,
              lineHeight: 1.9,
              letterSpacing: "0.01em",
              opacity: 0.68,
            }}
          >
            Cucina e soggiorno condivisi con gli altri ospiti, in un ambiente
            ordinato e silenzioso. Il bagno è riservato esclusivamente a questa
            camera. Pulizie incluse. Lettino aggiuntivo su richiesta, a €20 a notte.
          </p>

        </div>
      </section>

      {/* ── DOTAZIONI ───────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: c.sabbia,
          padding: "64px clamp(1.25rem, 5vw, 2.5rem)",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div ref={dotRef} style={{ ...fade(dotInView) }}>
            <p
              style={{
                color: c.tabacco,
                fontSize: "0.62rem",
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                marginBottom: "0.6rem",
                opacity: 0.5,
              }}
            >
              Cosa trovi
            </p>
            <h2
              style={{
                color: c.tabacco,
                fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)",
                fontWeight: 300,
                marginBottom: "3rem",
              }}
            >
              Dotazioni
            </h2>

            <div className="rs-dotazioni-grid">
              {dotazioni.map((d, i) => (
                <div
                  key={d.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.85rem",
                    ...fade(dotInView, i * 0.05),
                  }}
                >
                  <svg
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={c.cammello}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0 }}
                  >
                    <path d={d.path} />
                  </svg>
                  <span
                    style={{
                      color: c.tabacco,
                      fontSize: "0.82rem",
                      fontWeight: 300,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DISPONIBILITÀ E PRENOTAZIONE ────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: c.lino,
          padding: "clamp(4rem, 8vw, 7rem) clamp(1.25rem, 5vw, 2.5rem)",
        }}
      >
        <div ref={prezzoRef} style={{ maxWidth: 1100, margin: "0 auto", ...fade(prezzoInView) }}>
          <div className="rs-prezzo-layout">

            {/* Modulo disponibilità */}
            <div
              style={{
                backgroundColor: c.tabacco,
                padding: "clamp(2rem, 4vw, 3rem)",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              <p
                style={{
                  color: c.cammello,
                  fontSize: "0.6rem",
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                }}
              >
                Verifica disponibilità
              </p>

              <h3
                style={{
                  color: c.lino,
                  fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)",
                  fontWeight: 300,
                  letterSpacing: "0.01em",
                }}
              >
                Il Tulipano
              </h3>

              {/* Form date */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div>
                  <label style={{ color: c.sabbia, fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>
                    Data arrivo
                  </label>
                  <input
                    type="date"
                    value={formArrivo}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => { setFormArrivo(e.target.value); setDisponibilita(null); setDateAlternative([]); }}
                    style={{
                      width: "100%",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: `1px solid ${c.cammello}`,
                      color: c.lino,
                      fontSize: "0.82rem",
                      padding: "0.75rem 0.9rem",
                      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ color: c.sabbia, fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>
                    Data partenza
                  </label>
                  <input
                    type="date"
                    value={formPartenza}
                    min={formArrivo || new Date().toISOString().split("T")[0]}
                    onChange={(e) => { setFormPartenza(e.target.value); setDisponibilita(null); setDateAlternative([]); }}
                    style={{
                      width: "100%",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: `1px solid ${c.cammello}`,
                      color: c.lino,
                      fontSize: "0.82rem",
                      padding: "0.75rem 0.9rem",
                      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ color: c.sabbia, fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>
                    Numero ospiti
                  </label>
                  <select
                    value={formOspiti}
                    onChange={(e) => setFormOspiti(Number(e.target.value))}
                    style={{
                      width: "100%",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: `1px solid ${c.cammello}`,
                      color: c.lino,
                      fontSize: "0.82rem",
                      padding: "0.75rem 0.9rem",
                      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                      outline: "none",
                      boxSizing: "border-box",
                      appearance: "none",
                    }}
                  >
                    {[1, 2, 3].map((n) => (
                      <option key={n} value={n} style={{ backgroundColor: c.tabacco }}>
                        {n} {n === 1 ? "ospite" : "ospiti"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bottone verifica */}
              <button
                onClick={verificaDisponibilita}
                disabled={!formArrivo || !formPartenza || formVerificando}
                style={{
                  backgroundColor: (!formArrivo || !formPartenza) ? "rgba(139,115,85,0.3)" : c.cammello,
                  color: c.lino,
                  border: "none",
                  fontSize: "0.68rem",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  padding: "1rem 1.5rem",
                  cursor: (!formArrivo || !formPartenza) ? "not-allowed" : "pointer",
                  transition: "background-color 0.25s",
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                }}
                onMouseEnter={(e) => { if (formArrivo && formPartenza) e.currentTarget.style.backgroundColor = c.tabacco; }}
                onMouseLeave={(e) => { if (formArrivo && formPartenza) e.currentTarget.style.backgroundColor = c.cammello; }}
              >
                {formVerificando ? "Verifica in corso…" : "Verifica disponibilità"}
              </button>

              {/* Esito verifica */}
              {disponibilita === true && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div
                    style={{
                      backgroundColor: "rgba(46,125,82,0.18)",
                      border: "1px solid rgba(46,125,82,0.5)",
                      padding: "0.85rem 1rem",
                    }}
                  >
                    <p style={{ color: "#4caf7d", fontSize: "0.78rem", fontWeight: 400, letterSpacing: "0.04em" }}>
                      Disponibile per le date selezionate
                    </p>
                  </div>
                  <a
                    href={`https://wa.me/393661033691?text=${encodeURIComponent(`Ciao, vorrei prenotare Il Tulipano dal ${formatDateIT(formArrivo)} al ${formatDateIT(formPartenza)} per ${formOspiti} ${formOspiti === 1 ? "ospite" : "ospiti"}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#25D366",
                      color: "#fff",
                      textDecoration: "none",
                      fontSize: "0.7rem",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      padding: "1rem 1.5rem",
                      transition: "opacity 0.2s",
                      fontWeight: 400,
                      gap: "0.3rem",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                  >
                    Prenota su WhatsApp
                    <span style={{ fontSize: "0.6rem", letterSpacing: "0.06em", opacity: 0.85, textTransform: "none", fontWeight: 300 }}>
                      Miglior prezzo garantito · risposta entro 1 ora
                    </span>
                  </a>
                </div>
              )}

              {disponibilita === false && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <div
                    style={{
                      backgroundColor: "rgba(192,57,43,0.15)",
                      border: "1px solid rgba(192,57,43,0.4)",
                      padding: "0.85rem 1rem",
                    }}
                  >
                    <p style={{ color: "#e57373", fontSize: "0.78rem", fontWeight: 400, letterSpacing: "0.04em", marginBottom: "0.3rem" }}>
                      Periodo occupato
                    </p>
                    {dateAlternative.length > 0 && (
                      <p style={{ color: "rgba(240,235,224,0.55)", fontSize: "0.7rem", fontWeight: 300 }}>
                        Date libere vicine:
                      </p>
                    )}
                  </div>
                  {dateAlternative.map((alt) => (
                    <button
                      key={alt.start}
                      onClick={() => {
                        setFormArrivo(alt.start);
                        setFormPartenza(alt.end);
                        setDisponibilita(true);
                      }}
                      style={{
                        backgroundColor: "rgba(46,125,82,0.18)",
                        border: "1px solid rgba(46,125,82,0.5)",
                        color: "#4caf7d",
                        fontSize: "0.72rem",
                        letterSpacing: "0.04em",
                        padding: "0.75rem 1rem",
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                      }}
                    >
                      Disponibile: {formatDateIT(alt.start)} → {formatDateIT(alt.end)}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.07)" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div>
                  <a
                    href="https://www.booking.com/Share-KLD1dK0"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "transparent",
                      border: `1px solid ${c.cammello}`,
                      color: c.lino,
                      textDecoration: "none",
                      fontSize: "0.7rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      padding: "1rem 1.5rem",
                      transition: "background-color 0.25s",
                      fontWeight: 300,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = c.cammello; e.currentTarget.style.color = c.tabacco; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = c.lino; }}
                  >
                    Prenota su Booking.com
                  </a>
                  <p style={{ color: "rgba(212,201,181,0.6)", fontSize: "0.62rem", letterSpacing: "0.06em", textAlign: "center", marginTop: "0.4rem" }}>
                    Conferma immediata · Cancellazione gratuita
                  </p>
                </div>

                <div>
                  <a
                    href="https://www.airbnb.it/rooms/1151100346729188269"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "transparent",
                      border: `1px solid ${c.cammello}`,
                      color: c.lino,
                      textDecoration: "none",
                      fontSize: "0.7rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      padding: "1rem 1.5rem",
                      transition: "background-color 0.25s",
                      fontWeight: 300,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = c.cammello; e.currentTarget.style.color = c.tabacco; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = c.lino; }}
                  >
                    Prenota su Airbnb
                  </a>
                  <p style={{ color: "rgba(212,201,181,0.6)", fontSize: "0.62rem", letterSpacing: "0.06em", textAlign: "center", marginTop: "0.4rem" }}>
                    Pagamento sicuro · Assistenza 24/7
                  </p>
                </div>

                <a
                  href="tel:+393661033691"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "transparent",
                    border: `1px solid ${c.cammello}`,
                    color: c.lino,
                    textDecoration: "none",
                    fontSize: "0.68rem",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    padding: "0.9rem 1.5rem",
                    transition: "background-color 0.25s, color 0.25s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = c.cammello; e.currentTarget.style.color = c.tabacco; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = c.lino; }}
                >
                  Contattaci direttamente
                </a>
              </div>
            </div>

            {/* Assistenza */}
            <div
              style={{
                border: `1px solid ${c.sabbia}`,
                padding: "clamp(2rem, 4vw, 3rem)",
                display: "flex",
                flexDirection: "column",
                gap: "1.75rem",
              }}
            >
              <div>
                <p
                  style={{
                    color: c.cammello,
                    fontSize: "0.6rem",
                    letterSpacing: "0.32em",
                    textTransform: "uppercase",
                    marginBottom: "1rem",
                  }}
                >
                  Assistenza in loco
                </p>
                <p
                  style={{
                    color: c.tabacco,
                    fontSize: "0.88rem",
                    fontWeight: 300,
                    lineHeight: 1.8,
                  }}
                >
                  Per ogni necessità durante il soggiorno, <strong style={{ fontWeight: 400 }}>Lella</strong> è
                  la referente sul posto. Disponibile per il check-in,
                  informazioni locali e supporto durante il tuo soggiorno.
                </p>
              </div>

              <a
                href="tel:+393394304429"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.55rem",
                  color: c.tabacco,
                  textDecoration: "none",
                  fontSize: "0.8rem",
                  letterSpacing: "0.03em",
                  borderBottom: `1px solid ${c.sabbia}`,
                  paddingBottom: "2px",
                  alignSelf: "flex-start",
                  transition: "color 0.2s, border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = c.cammello;
                  e.currentTarget.style.borderColor = c.cammello;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = c.tabacco;
                  e.currentTarget.style.borderColor = c.sabbia;
                }}
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 11.9 19.79 19.79 0 0 1 1.06 3.24 2 2 0 0 1 3.04 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z" />
                </svg>
                Lella — +39 339 430 4429
              </a>

              <div style={{ height: 1, backgroundColor: c.sabbia }} />

              <div>
                <p
                  style={{
                    color: c.tabacco,
                    fontSize: "0.75rem",
                    fontWeight: 300,
                    lineHeight: 1.75,
                    opacity: 0.65,
                    marginBottom: "0.75rem",
                  }}
                >
                  Per informazioni prima della prenotazione o domande generali,
                  il team RS Hospitality è a tua disposizione.
                </p>
                <a
                  href="tel:+393661033691"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    color: c.cammello,
                    textDecoration: "none",
                    fontSize: "0.78rem",
                    letterSpacing: "0.03em",
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                >
                  RS Hospitality — +39 366 103 3691
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── MAPPA ───────────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: c.tabacco,
          padding: "64px clamp(1.25rem, 5vw, 2.5rem)",
        }}
      >
        <div ref={mappaRef} style={{ maxWidth: 1100, margin: "0 auto", ...fade(mappaInView) }}>
          <p
            style={{
              color: c.cammello,
              fontSize: "0.62rem",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              marginBottom: "0.6rem",
            }}
          >
            Come raggiungerci
          </p>
          <h3
            style={{
              color: c.lino,
              fontSize: "clamp(1.1rem, 2.5vw, 1.4rem)",
              fontWeight: 300,
              marginBottom: "2.5rem",
              letterSpacing: "0.01em",
            }}
          >
            Via Clanio 60, Marcianise (CE)
          </h3>

          <div style={{ overflow: "hidden", backgroundColor: c.sabbia, borderRadius: "4px" }}>
            <iframe
              src="https://maps.google.com/maps?q=Via+Clanio+60,+Marcianise+CE&output=embed&z=16"
              width="100%"
              height="420"
              style={{ border: 0, display: "block" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Via Clanio 60, Marcianise CE"
            />
          </div>
          <div style={{ marginTop: "1.25rem" }}>
            <a
              href="https://maps.google.com/?q=Via+Clanio+60,+Marcianise+CE"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                color: c.cammello,
                textDecoration: "none",
                fontSize: "0.68rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                border: `1px solid ${c.cammello}`,
                padding: "0.65rem 1.6rem",
                transition: "background-color 0.25s, color 0.25s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = c.cammello;
                e.currentTarget.style.color = c.lino;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = c.cammello;
              }}
            >
              Apri in Google Maps →
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer
        id="footer"
        style={{
          backgroundColor: c.tabacco,
          padding: "48px clamp(1.25rem, 5vw, 2.5rem) 3rem",
          borderTop: "1px solid rgba(240,235,224,0.15)",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>

          <div className="rs-footer-top">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <span style={{ color: c.lino, fontSize: "0.78rem", fontWeight: 500, letterSpacing: "0.28em", textTransform: "uppercase" }}>
                RS Hospitality
              </span>
              <span style={{ color: c.cammello, fontSize: "0.72rem", letterSpacing: "0.04em" }}>
                Marcianise, Caserta — Italia
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
              <a href="tel:+393661033691" style={{ color: c.cammello, textDecoration: "none", fontSize: "0.72rem", letterSpacing: "0.04em" }}>
                +39 366 103 3691
              </a>
              <a
                href="https://wa.me/393661033691"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: c.cammello, textDecoration: "none", fontSize: "0.72rem", letterSpacing: "0.04em" }}
              >
                WhatsApp
              </a>
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.07)" }} />

          <div className="rs-footer-bottom">
            <p style={{ color: c.cammello, fontSize: "0.65rem", letterSpacing: "0.05em" }}>
              © {new Date().getFullYear()} RS Hospitality · Fondato da Raffaele Salzillo
            </p>
            <p style={{ color: "rgba(139,115,85,0.4)", fontSize: "0.65rem" }}>
              Privacy Policy · Cookie Policy
            </p>
          </div>

        </div>
      </footer>

    </div>
  );
}
