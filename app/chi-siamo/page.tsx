"use client";

import { useState, useEffect, useRef } from "react";

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

export default function ChiSiamo() {
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

  const [heroRef, heroInView] = useInView(0.05);
  const [textRef, textInView] = useInView();

  const navLinks = [
    { label: "Alloggi",   href: "/#alloggi" },
    { label: "Chi siamo", href: "/chi-siamo" },
    { label: "Contatti",  href: "/#footer" },
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
        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <a href="tel:+393661033691" style={{ color: c.cammello, textDecoration: "none", fontSize: "0.85rem", letterSpacing: "0.08em" }}>
            +39 366 103 3691
          </a>
          <a href="mailto:info@rshospitality.it" style={{ color: c.sabbia, textDecoration: "none", fontSize: "0.8rem" }}>
            info@rshospitality.it
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
          backgroundColor: c.tabacco,
          minHeight: "60svh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "8rem clamp(1.25rem, 5vw, 2rem) 5rem",
          textAlign: "center",
        }}
      >
        <div ref={heroRef} style={{ ...fade(heroInView, 0.1) }}>
          <p
            style={{
              color: c.cammello,
              fontSize: "0.68rem",
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              marginBottom: "2rem",
            }}
          >
            RS Hospitality
          </p>
          <h1
            style={{
              color: c.lino,
              fontSize: "clamp(2rem, 5vw, 3.8rem)",
              fontWeight: 300,
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
              maxWidth: 700,
            }}
          >
            Chi siamo
          </h1>
        </div>
      </section>

      {/* ── TESTO ───────────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: c.lino,
          padding: "clamp(5rem, 10vw, 8rem) clamp(1.25rem, 5vw, 2.5rem)",
        }}
      >
        <div
          ref={textRef}
          style={{
            maxWidth: 680,
            margin: "0 auto",
            ...fade(textInView),
          }}
        >
          <p
            style={{
              color: c.cammello,
              fontSize: "0.65rem",
              letterSpacing: "0.38em",
              textTransform: "uppercase",
              marginBottom: "2.5rem",
            }}
          >
            La nostra storia
          </p>

          <p
            style={{
              color: c.tabacco,
              fontSize: "clamp(1.05rem, 2.2vw, 1.2rem)",
              fontWeight: 300,
              lineHeight: 1.9,
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
              color: c.tabacco,
              fontSize: "clamp(1.05rem, 2.2vw, 1.2rem)",
              fontWeight: 300,
              lineHeight: 1.9,
              letterSpacing: "0.01em",
              opacity: 0.78,
              marginBottom: "3.5rem",
            }}
          >
            Poi le cose hanno cominciato a diventare serie. RS Hospitality è
            il modo in cui metto cura e attenzione in ogni soggiorno. Una firma
            personale su ogni dettaglio.
          </p>

          <div style={{ height: 1, backgroundColor: c.sabbia, marginBottom: "3.5rem" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <span
              style={{
                color: c.tabacco,
                fontSize: "0.82rem",
                fontWeight: 400,
                letterSpacing: "0.04em",
              }}
            >
              Raffaele Salzillo
            </span>
            <span
              style={{
                color: c.cammello,
                fontSize: "0.72rem",
                letterSpacing: "0.06em",
                fontWeight: 300,
              }}
            >
              Fondatore, RS Hospitality · Marcianise
            </span>
          </div>
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
              <a href="mailto:info@rshospitality.it" style={{ color: c.cammello, textDecoration: "none", fontSize: "0.72rem" }}>
                info@rshospitality.it
              </a>
              <a href="tel:+393661033691" style={{ color: c.cammello, textDecoration: "none", fontSize: "0.72rem", letterSpacing: "0.04em" }}>
                +39 366 103 3691
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
