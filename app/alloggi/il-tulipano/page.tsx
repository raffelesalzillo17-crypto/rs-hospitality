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

const MONTH_NAMES = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
                     'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const DAY_LABELS = ['L','M','M','G','V','S','D'];

function renderMonth(year: number, month: number, busyDates: {start: string; end: string}[]) {
  const firstDayMon = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);

  function pad(n: number) { return String(n).padStart(2, '0'); }
  function dateStr(d: number) { return `${year}-${pad(month + 1)}-${pad(d)}`; }
  function isBusy(d: number) {
    const s = dateStr(d);
    return busyDates.some(e => s >= e.start && s < e.end);
  }
  function isPast(d: number) { return new Date(year, month, d) < todayStart; }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayMon; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div key={`${year}-${month}`}>
      <p style={{ color: "#2C2416", fontSize: "0.78rem", fontWeight: 400, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.85rem", textAlign: "center" }}>
        {MONTH_NAMES[month]} {year}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
        {DAY_LABELS.map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: "0.58rem", color: "#8B7355", letterSpacing: "0.04em", paddingBottom: "4px" }}>
            {d}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const past = isPast(day);
          const busy = !past && isBusy(day);
          const free = !past && !busy;
          return (
            <div
              key={i}
              style={{
                textAlign: "center",
                padding: "5px 2px",
                fontSize: "0.7rem",
                borderRadius: "2px",
                backgroundColor: past ? "transparent" : busy ? "#c0392b" : "#2e7d52",
                color: past ? "#8B7355" : "#fff",
                opacity: past ? 0.4 : 1,
                fontWeight: 300,
              }}
              aria-label={`${day} ${MONTH_NAMES[month]} ${year}: ${past ? "passato" : busy ? "occupato" : "libero"}`}
            >
              {day}
            </div>
          );
          void free;
        })}
      </div>
    </div>
  );
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
    document.title = "Il Tulipano — Camera matrimoniale a Marcianise | RS Hospitality";
  }, []);

  useEffect(() => {
    fetch('/api/calendar')
      .then(r => r.json())
      .then(data => { setBusyDates(data.events ?? []); setCalLoading(false); })
      .catch(() => setCalLoading(false));
  }, []);

  const [descRef,    descInView]    = useInView();
  const [dotRef,     dotInView]     = useInView();
  const [prezzoRef,  prezzoInView]  = useInView();
  const [mappaRef,   mappaInView]   = useInView();
  const [calRef,     calInView]     = useInView();
  const [busyDates, setBusyDates] = useState<{start: string; end: string}[]>([]);
  const [calLoading, setCalLoading] = useState(true);

  const navLinks = [
    { label: "Alloggi",   href: "/#alloggi" },
    { label: "Chi siamo", href: "/#proprietari" },
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
            background: `linear-gradient(to bottom, rgba(44,36,22,0.4) 0%, rgba(44,36,22,0.72) 100%)`,
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
              color: c.cammello,
              fontSize: "0.65rem",
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              marginBottom: "1.75rem",
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
            }}
          >
            Il Tulipano
          </h1>

          <div style={{ width: 36, height: 1, backgroundColor: c.cammello, marginBottom: "2rem" }} />

          <p
            style={{
              color: c.sabbia,
              fontSize: "clamp(0.82rem, 1.8vw, 0.95rem)",
              fontWeight: 300,
              letterSpacing: "0.06em",
              marginBottom: "3rem",
            }}
          >
            da €55 / notte
          </p>

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
          <div style={{ position: "relative", overflow: "hidden", aspectRatio: "16 / 9" }}>
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
              gap: "5px",
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
          padding: "clamp(4rem, 8vw, 7rem) clamp(1.25rem, 5vw, 2.5rem)",
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
            Camera matrimoniale con bagno privato in appartamento condiviso.
            Un ambiente curato, essenziale nel tono, generoso nello spazio.
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
            Il soggiorno e la cucina sono condivisi con gli altri ospiti dell&rsquo;appartamento,
            in un clima sereno e familiare. Il bagno, riservato esclusivamente alla camera,
            garantisce la riservatezza che ti aspetti.
            Su richiesta è disponibile un lettino supplementare a €20 a notte.
          </p>

        </div>
      </section>

      {/* ── DOTAZIONI ───────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: c.sabbia,
          padding: "clamp(3.5rem, 7vw, 6rem) clamp(1.25rem, 5vw, 2.5rem)",
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

      {/* ── PREZZO E PRENOTAZIONE ───────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: c.lino,
          padding: "clamp(4rem, 8vw, 7rem) clamp(1.25rem, 5vw, 2.5rem)",
        }}
      >
        <div ref={prezzoRef} style={{ maxWidth: 1100, margin: "0 auto", ...fade(prezzoInView) }}>
          <div className="rs-prezzo-layout">

            {/* Prezzi + CTA */}
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
                Tariffe
              </p>

              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                <span
                  style={{
                    color: c.lino,
                    fontSize: "clamp(2rem, 4.5vw, 2.8rem)",
                    fontWeight: 300,
                    letterSpacing: "-0.01em",
                  }}
                >
                  da €55
                </span>
                <span style={{ color: c.cammello, fontSize: "0.82rem", letterSpacing: "0.04em" }}>
                  / notte
                </span>
              </div>

              <p
                style={{
                  color: c.sabbia,
                  fontSize: "0.75rem",
                  fontWeight: 300,
                  lineHeight: 1.65,
                  opacity: 0.7,
                }}
              >
                Tariffa dinamica fino a €80 / notte.<br />
                Lettino aggiuntivo disponibile a €20 / notte.
              </p>

              <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.07)" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <a
                  href="https://www.booking.com/Share-KLD1dK0"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#003580",
                    color: "#fff",
                    textDecoration: "none",
                    fontSize: "0.7rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    padding: "1rem 1.5rem",
                    transition: "opacity 0.2s",
                    fontWeight: 400,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.82"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                >
                  Prenota su Booking.com
                </a>

                <a
                  href="https://www.airbnb.it/rooms/1151100346729188269"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#FF5A5F",
                    color: "#fff",
                    textDecoration: "none",
                    fontSize: "0.7rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    padding: "1rem 1.5rem",
                    transition: "opacity 0.2s",
                    fontWeight: 400,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.82"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                >
                  Prenota su Airbnb
                </a>

                <a
                  href="tel:+393661033691"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `1px solid ${c.cammello}`,
                    color: c.lino,
                    textDecoration: "none",
                    fontSize: "0.68rem",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    padding: "0.9rem 1.5rem",
                    transition: "background-color 0.25s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = c.cammello; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
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

      {/* ── CALENDARIO ──────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: "#F0EBE0",
          padding: "clamp(3.5rem, 7vw, 6rem) clamp(1.25rem, 5vw, 2.5rem)",
        }}
      >
        <div ref={calRef} style={{ maxWidth: 1100, margin: "0 auto", ...fade(calInView) }}>
          <p
            style={{
              color: "#8B7355",
              fontSize: "0.62rem",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              marginBottom: "0.6rem",
              opacity: 0.5,
            }}
          >
            Verifica date
          </p>
          <h2
            style={{
              color: "#2C2416",
              fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)",
              fontWeight: 300,
              marginBottom: "2.5rem",
            }}
          >
            Disponibilità
          </h2>

          {calLoading ? (
            <p style={{ color: "#8B7355", fontSize: "0.82rem", fontWeight: 300 }}>
              Caricamento calendario…
            </p>
          ) : (
            <div className="rs-calendar-months">
              {[0, 1].map((offset) => {
                const d = new Date();
                d.setDate(1);
                d.setMonth(d.getMonth() + offset);
                return renderMonth(d.getFullYear(), d.getMonth(), busyDates);
              })}
            </div>
          )}

          <div style={{ display: "flex", gap: "1.75rem", marginTop: "2rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ width: 12, height: 12, backgroundColor: "#c0392b", borderRadius: "2px", flexShrink: 0 }} />
              <span style={{ color: "#2C2416", fontSize: "0.72rem", fontWeight: 300 }}>Occupato</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ width: 12, height: 12, backgroundColor: "#2e7d52", borderRadius: "2px", flexShrink: 0 }} />
              <span style={{ color: "#2C2416", fontSize: "0.72rem", fontWeight: 300 }}>Libero</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAPPA ───────────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: c.tabacco,
          padding: "clamp(3rem, 6vw, 5rem) clamp(1.25rem, 5vw, 2.5rem)",
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

          <div style={{ overflow: "hidden", backgroundColor: c.sabbia }}>
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
        style={{
          backgroundColor: c.tabacco,
          padding: "3rem clamp(1.25rem, 5vw, 2.5rem)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
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
              <a href="https://rshospitality.it" style={{ color: c.sabbia, textDecoration: "none", fontSize: "0.72rem", letterSpacing: "0.08em" }}>
                rshospitality.it
              </a>
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
