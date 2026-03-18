"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

const c = {
  tabacco: "#2C2416",
  lino: "#F0EBE0",
  cammello: "#8B7355",
  sabbia: "#D4C9B5",
} as const;

// ── Intersection Observer hook ───────────────────────────────────────────────
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

// ── Data ─────────────────────────────────────────────────────────────────────
const alloggi = [
  {
    categoria: "RS Comfort",
    nome: "Il Tulipano",
    desc: "Camera matrimoniale con bagno privato. Cucina e soggiorno in comune con gli altri ospiti.",
    prezzo: "da €55 / notte",
    imgSrc: "/images/tulipano/dettaglio letto.png",
    href: "/alloggi/il-tulipano",
    delay: 0.1,
  },
];

// ── Component ────────────────────────────────────────────────────────────────
export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const [alloggiRef, alloggiInView] = useInView();
  const [chiSiamoRef, chiSiamoInView] = useInView();
  const [propRef, propInView] = useInView();

  const navLinks = [
    { label: "Alloggi", href: "#alloggi" },
    { label: "Chi siamo", href: "#chi-siamo" },
    { label: "Contatti", href: "#footer" },
  ];

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
      {/* z-index 300 keeps the nav (and hamburger) above the overlay (250) */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
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
          {/* Logo */}
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

          {/* Desktop links */}
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

          {/* Hamburger — inside nav (z-index 300), always above overlay */}
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
          backgroundColor: c.tabacco,
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "8rem clamp(1.25rem, 5vw, 2rem) 6rem",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: c.cammello,
            fontSize: "0.68rem",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            marginBottom: "2rem",
          }}
        >
          Marcianise, Caserta — Italia
        </p>

        <h1
          style={{
            color: c.lino,
            fontSize: "clamp(2.2rem, 6vw, 4.8rem)",
            fontWeight: 300,
            lineHeight: 1.12,
            letterSpacing: "-0.01em",
            maxWidth: 820,
            marginBottom: "2rem",
          }}
        >
          Soggiorna a Marcianise.
        </h1>

        <p
          style={{
            color: c.sabbia,
            fontSize: "clamp(0.95rem, 2vw, 1.1rem)",
            fontWeight: 300,
            letterSpacing: "0.02em",
            lineHeight: 1.75,
            maxWidth: 480,
            marginBottom: "3rem",
          }}
        >
          Alloggi selezionati, curati nei dettagli e pronti per accoglierti.
          Scegli il comfort che fa per te.
        </p>

        <div style={{ width: 36, height: 1, backgroundColor: c.cammello, marginBottom: "3rem" }} />

        <a
          href="#alloggi"
          style={{
            display: "inline-block",
            border: `1px solid ${c.cammello}`,
            color: c.lino,
            textDecoration: "none",
            fontSize: "0.72rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            padding: "0.85rem 2.4rem",
            transition: "background-color 0.25s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = c.cammello; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
        >
          Vedi gli alloggi
        </a>
      </section>

      {/* ── ALLOGGI ─────────────────────────────────────────────────────────── */}
      <section
        id="alloggi"
        style={{
          backgroundColor: c.lino,
          padding: "clamp(4rem, 8vw, 7rem) clamp(1.25rem, 5vw, 2.5rem)",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* Section header */}
          <div ref={alloggiRef} style={{ marginBottom: "3.5rem", ...fade(alloggiInView) }}>
            <p
              style={{
                color: c.cammello,
                fontSize: "0.68rem",
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                marginBottom: "0.8rem",
              }}
            >
              Disponibili ora
            </p>
            <h2
              style={{
                color: c.tabacco,
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                fontWeight: 300,
                letterSpacing: "0.01em",
              }}
            >
              I nostri alloggi
            </h2>
          </div>

          {/* Cards */}
          <div className="rs-alloggi-grid">
            {alloggi.map((a) => (
              <div
                key={a.categoria}
                className="rs-alloggio-card"
                style={{ ...fade(alloggiInView, a.delay) }}
              >
                {/* Photo */}
                <div className="rs-alloggio-card-photo">
                  <Image
                    src={a.imgSrc}
                    alt={a.nome}
                    fill
                    style={{ objectFit: "cover", objectPosition: "center" }}
                    sizes="(max-width: 768px) 100vw, 58vw"
                    priority
                  />
                </div>

                {/* Card body */}
                <div className="rs-alloggio-card-body">
                  <p
                    style={{
                      color: c.cammello,
                      fontSize: "0.6rem",
                      letterSpacing: "0.35em",
                      textTransform: "uppercase",
                    }}
                  >
                    {a.categoria}
                  </p>
                  <h3
                    style={{
                      color: c.tabacco,
                      fontSize: "clamp(2rem, 4vw, 2.8rem)",
                      fontWeight: 300,
                      letterSpacing: "-0.01em",
                      lineHeight: 1.1,
                    }}
                  >
                    {a.nome}
                  </h3>
                  <p
                    style={{
                      color: c.tabacco,
                      fontSize: "clamp(0.88rem, 1.8vw, 0.95rem)",
                      fontWeight: 300,
                      lineHeight: 1.85,
                      opacity: 0.68,
                      maxWidth: 400,
                    }}
                  >
                    {a.desc}
                  </p>

                  <div style={{ height: 1, backgroundColor: c.sabbia, margin: "0.5rem 0" }} />

                  <span
                    style={{
                      color: c.tabacco,
                      fontSize: "1.05rem",
                      fontWeight: 400,
                      letterSpacing: "0.01em",
                    }}
                  >
                    {a.prezzo}
                  </span>

                  <div style={{ marginTop: "0.5rem" }}>
                    <a
                      href={a.href}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        backgroundColor: c.cammello,
                        color: c.lino,
                        textDecoration: "none",
                        fontSize: "0.68rem",
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        padding: "0.9rem 2rem",
                        transition: "background-color 0.25s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = c.tabacco; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = c.cammello; }}
                    >
                      Scopri l&apos;alloggio →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CHI SIAMO ───────────────────────────────────────────────────────── */}
      <section
        id="chi-siamo"
        style={{
          backgroundColor: c.tabacco,
          padding: "clamp(5rem, 10vw, 9rem) clamp(1.25rem, 5vw, 2.5rem)",
        }}
      >
        <div
          ref={chiSiamoRef}
          style={{ maxWidth: 1100, margin: "0 auto", ...fade(chiSiamoInView) }}
        >
          <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.07)", marginBottom: "3.5rem" }} />

          <div style={{ maxWidth: 680 }}>
            {/* Decorative quote mark */}
            <div
              style={{
                color: c.cammello,
                fontSize: "5rem",
                lineHeight: 0.75,
                fontWeight: 300,
                marginBottom: "2.25rem",
                opacity: 0.4,
                userSelect: "none",
              }}
            >
              &ldquo;
            </div>

            <p
              style={{
                color: c.sabbia,
                fontSize: "clamp(1.05rem, 2.4vw, 1.22rem)",
                fontWeight: 300,
                lineHeight: 1.95,
                letterSpacing: "0.01em",
                marginBottom: "1.75rem",
              }}
            >
              Sono Raffaele, un ragazzo di Marcianise. Ho iniziato con gli affitti
              brevi quasi per gioco — un appartamento, qualche curiosità, voglia
              di provare.
            </p>
            <p
              style={{
                color: c.sabbia,
                fontSize: "clamp(1rem, 2.2vw, 1.15rem)",
                fontWeight: 300,
                lineHeight: 1.95,
                letterSpacing: "0.01em",
                opacity: 0.65,
                marginBottom: "3rem",
              }}
            >
              Poi le cose hanno cominciato a diventare serie. RS Hospitality è
              il modo in cui metto cura e attenzione in ogni soggiorno. Una firma
              personale su ogni dettaglio.
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem" }}>
              <div>
                <p
                  style={{
                    color: c.lino,
                    fontSize: "0.88rem",
                    fontWeight: 400,
                    letterSpacing: "0.04em",
                    marginBottom: "0.25rem",
                  }}
                >
                  Raffaele Salzillo
                </p>
                <p
                  style={{
                    color: c.cammello,
                    fontSize: "0.7rem",
                    letterSpacing: "0.08em",
                    fontWeight: 300,
                  }}
                >
                  Fondatore · RS Hospitality
                </p>
              </div>
              <a
                href="/chi-siamo"
                style={{
                  color: c.cammello,
                  textDecoration: "none",
                  fontSize: "0.72rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  borderBottom: `1px solid ${c.cammello}`,
                  paddingBottom: "2px",
                  transition: "color 0.2s",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = c.lino; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = c.cammello; }}
              >
                Leggi di più →
              </a>
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.07)", marginTop: "3.5rem" }} />
        </div>
      </section>

      {/* ── PROPRIETARI (discreta) ───────────────────────────────────────────── */}
      <section
        id="proprietari"
        style={{
          backgroundColor: c.sabbia,
          padding: "clamp(3rem, 6vw, 5rem) clamp(1.25rem, 5vw, 2.5rem)",
        }}
      >
        <div
          ref={propRef}
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "2rem",
            ...fade(propInView),
          }}
        >
          <div>
            <p
              style={{
                color: c.tabacco,
                fontSize: "1rem",
                fontWeight: 300,
                lineHeight: 1.6,
                letterSpacing: "0.01em",
              }}
            >
              Hai un immobile a Marcianise?{" "}
              <span style={{ color: c.cammello }}>Gestiamolo noi.</span>
            </p>
            <p
              style={{
                color: c.tabacco,
                fontSize: "0.8rem",
                fontWeight: 300,
                opacity: 0.6,
                marginTop: "0.4rem",
                letterSpacing: "0.02em",
              }}
            >
              Affitti brevi, gestione completa, rendiconto mensile.
            </p>
          </div>
          <a
            href="/proprietari"
            style={{
              color: c.tabacco,
              textDecoration: "none",
              fontSize: "0.72rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              borderBottom: `1px solid ${c.cammello}`,
              paddingBottom: "2px",
              transition: "color 0.2s, border-color 0.2s",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = c.cammello;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = c.tabacco;
            }}
          >
            Scopri come →
          </a>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer
        id="footer"
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
