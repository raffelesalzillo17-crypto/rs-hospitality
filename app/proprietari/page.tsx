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

const passi = [
  {
    n: "01",
    titolo: "Ci incontriamo",
    testo: "Parliamo del tuo immobile, valutiamo insieme il potenziale e ti spieghiamo come lavoriamo. Nessun impegno.",
  },
  {
    n: "02",
    titolo: "Gestiamo tutto",
    testo: "Annunci, prenotazioni, check-in, pulizie, comunicazione con gli ospiti. Tu non devi fare nulla.",
  },
  {
    n: "03",
    titolo: "Ricevi il rendiconto",
    testo: "Ogni mese un rendiconto chiaro: entrate, uscite, commissioni. Trasparenza totale.",
  },
];

const servizi = [
  "Pubblicazione e gestione annunci su Booking.com e Airbnb",
  "Fotografia professionale dell'alloggio",
  "Gestione completa delle prenotazioni e comunicazioni",
  "Check-in e check-out con referente in loco",
  "Pulizie e cambio biancheria tra un soggiorno e l'altro",
  "Assistenza agli ospiti durante il soggiorno",
  "Gestione delle recensioni",
  "Rendiconto mensile con estratto delle prenotazioni",
  "Ottimizzazione delle tariffe in base alla stagionalità",
];

const faq = [
  {
    q: "Quanto prende RS Hospitality?",
    a: "La commissione è tra il 15% e il 25% del fatturato lordo, in base al tipo di immobile e ai servizi inclusi. Te lo diciamo prima, senza sorprese.",
  },
  {
    q: "Devo fare qualcosa io come proprietario?",
    a: "No. Una volta siglato l'accordo gestiamo tutto: annunci, ospiti, pulizie, rendiconti. Ti aggiorniamo ogni mese.",
  },
  {
    q: "Quanto tempo ci vuole per iniziare?",
    a: "Di solito una o due settimane dalla firma — il tempo di fare le foto, creare gli annunci e impostare il calendario.",
  },
  {
    q: "Posso usare il mio immobile durante certi periodi?",
    a: "Sì. Basta bloccare le date nel calendario con adeguato preavviso. Il tuo immobile rimane tuo.",
  },
  {
    q: "Lavorate solo a Marcianise?",
    a: "Per ora ci concentriamo sull'area di Marcianise e Caserta. Se hai un immobile nella zona, parliamone.",
  },
];

export default function Proprietari() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Gestione affitti brevi Marcianise — Per i proprietari | RS Hospitality";
  }, []);

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
  const [passiRef, passiInView] = useInView();
  const [serviziRef, serviziInView] = useInView();
  const [commRef, commInView] = useInView();
  const [faqRef, faqInView] = useInView();
  const [ctaRef, ctaInView] = useInView();

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
          backgroundColor: c.tabacco,
          minHeight: "62svh",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "8rem clamp(1.25rem, 5vw, 2.5rem) 5rem",
        }}
      >
        <div style={{ maxWidth: 1100, width: "100%", margin: "0 auto" }}>
          <div ref={heroRef} style={{ ...fade(heroInView, 0.1) }}>
            <p
              style={{
                color: c.cammello,
                fontSize: "0.68rem",
                letterSpacing: "0.4em",
                textTransform: "uppercase",
                marginBottom: "1.5rem",
              }}
            >
              RS Hospitality · Per i proprietari
            </p>
            <h1
              style={{
                color: c.lino,
                fontSize: "clamp(2.2rem, 6vw, 4.8rem)",
                fontWeight: 300,
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
                maxWidth: 780,
                marginBottom: "2rem",
              }}
            >
              Il tuo immobile lavora.
              <br />
              <span style={{ color: c.cammello }}>Tu no.</span>
            </h1>
            <p
              style={{
                color: c.sabbia,
                fontSize: "clamp(0.95rem, 2vw, 1.05rem)",
                fontWeight: 300,
                lineHeight: 1.85,
                maxWidth: 500,
              }}
            >
              Gestiamo i tuoi affitti brevi a Marcianise dall&rsquo;annuncio al checkout.
              Tu ricevi il rendiconto ogni mese.
            </p>
          </div>
        </div>
      </section>

      {/* ── COME FUNZIONA ───────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: c.lino,
          padding: "clamp(4rem, 8vw, 7rem) clamp(1.25rem, 5vw, 2.5rem)",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div ref={passiRef} style={{ ...fade(passiInView) }}>
            <p
              style={{
                color: c.cammello,
                fontSize: "0.68rem",
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                marginBottom: "0.8rem",
              }}
            >
              Come funziona
            </p>
            <h2
              style={{
                color: c.tabacco,
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                fontWeight: 300,
                letterSpacing: "0.01em",
                marginBottom: "3.5rem",
              }}
            >
              Tre passi, nessuna complicazione
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "2rem",
            }}
          >
            {passi.map((p, i) => (
              <div key={p.n} style={{ ...fade(passiInView, i * 0.12) }}>
                <p
                  style={{
                    color: c.sabbia,
                    fontSize: "2.5rem",
                    fontWeight: 300,
                    lineHeight: 1,
                    marginBottom: "1rem",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {p.n}
                </p>
                <p
                  style={{
                    color: c.tabacco,
                    fontSize: "0.95rem",
                    fontWeight: 400,
                    letterSpacing: "0.02em",
                    marginBottom: "0.6rem",
                  }}
                >
                  {p.titolo}
                </p>
                <p
                  style={{
                    color: c.tabacco,
                    fontSize: "0.85rem",
                    fontWeight: 300,
                    lineHeight: 1.75,
                    opacity: 0.65,
                  }}
                >
                  {p.testo}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVIZI ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: c.sabbia,
          padding: "clamp(4rem, 8vw, 7rem) clamp(1.25rem, 5vw, 2.5rem)",
        }}
      >
        <div ref={serviziRef} style={{ maxWidth: 1100, margin: "0 auto", ...fade(serviziInView) }}>
          <p
            style={{
              color: c.tabacco,
              fontSize: "0.68rem",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              marginBottom: "0.8rem",
              opacity: 0.5,
            }}
          >
            Cosa include
          </p>
          <h2
            style={{
              color: c.tabacco,
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 300,
              letterSpacing: "0.01em",
              marginBottom: "3rem",
            }}
          >
            Servizi inclusi nella gestione
          </h2>

          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {servizi.map((s, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  ...fade(serviziInView, i * 0.05),
                }}
              >
                <span
                  style={{
                    color: c.cammello,
                    fontSize: "0.7rem",
                    lineHeight: "1.6",
                    flexShrink: 0,
                  }}
                >
                  —
                </span>
                <span
                  style={{
                    color: c.tabacco,
                    fontSize: "0.88rem",
                    fontWeight: 300,
                    lineHeight: 1.65,
                  }}
                >
                  {s}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── COMMISSIONI ─────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: c.tabacco,
          padding: "clamp(4rem, 8vw, 7rem) clamp(1.25rem, 5vw, 2.5rem)",
        }}
      >
        <div ref={commRef} style={{ maxWidth: 820, margin: "0 auto", ...fade(commInView) }}>
          <p
            style={{
              color: c.cammello,
              fontSize: "0.68rem",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              marginBottom: "0.8rem",
            }}
          >
            Commissioni
          </p>
          <h2
            style={{
              color: c.lino,
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 300,
              marginBottom: "2.5rem",
            }}
          >
            Trasparenza prima di tutto
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1px", backgroundColor: "rgba(255,255,255,0.07)", marginBottom: "2.5rem" }}>
            {[
              { range: "15%", label: "Gestione base", note: "annunci + prenotazioni" },
              { range: "20%", label: "Gestione completa", note: "+ check-in/out + pulizie" },
              { range: "25%", label: "Tutto incluso", note: "+ fotografia + ottimizzazione" },
            ].map((tier) => (
              <div
                key={tier.range}
                style={{
                  backgroundColor: c.tabacco,
                  padding: "1.75rem 1.5rem",
                  textAlign: "center",
                }}
              >
                <p style={{ color: c.lino, fontSize: "2rem", fontWeight: 300, marginBottom: "0.4rem" }}>{tier.range}</p>
                <p style={{ color: c.cammello, fontSize: "0.75rem", fontWeight: 400, marginBottom: "0.3rem" }}>{tier.label}</p>
                <p style={{ color: "rgba(212,201,181,0.5)", fontSize: "0.65rem" }}>{tier.note}</p>
              </div>
            ))}
          </div>

          <p
            style={{
              color: c.sabbia,
              fontSize: "0.82rem",
              fontWeight: 300,
              lineHeight: 1.8,
              opacity: 0.75,
            }}
          >
            La commissione si applica sul fatturato lordo delle prenotazioni.
            Non ci sono costi fissi mensili — guadagniamo solo quando guadagni tu.
            Il pacchetto definitivo si stabilisce dopo il primo incontro, in base all&rsquo;immobile.
          </p>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: c.lino,
          padding: "clamp(4rem, 8vw, 7rem) clamp(1.25rem, 5vw, 2.5rem)",
        }}
      >
        <div ref={faqRef} style={{ maxWidth: 820, margin: "0 auto", ...fade(faqInView) }}>
          <p
            style={{
              color: c.cammello,
              fontSize: "0.68rem",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              marginBottom: "0.8rem",
            }}
          >
            Domande frequenti
          </p>
          <h2
            style={{
              color: c.tabacco,
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 300,
              marginBottom: "3rem",
            }}
          >
            FAQ
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {faq.map((item, i) => (
              <div
                key={i}
                style={{
                  borderTop: `1px solid ${c.sabbia}`,
                  ...(i === faq.length - 1 ? { borderBottom: `1px solid ${c.sabbia}` } : {}),
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "none",
                    padding: "1.25rem 0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1rem",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      color: c.tabacco,
                      fontSize: "0.88rem",
                      fontWeight: 400,
                      lineHeight: 1.5,
                    }}
                  >
                    {item.q}
                  </span>
                  <span
                    style={{
                      color: c.cammello,
                      fontSize: "1.1rem",
                      fontWeight: 300,
                      flexShrink: 0,
                      transform: openFaq === i ? "rotate(45deg)" : "none",
                      transition: "transform 0.25s ease",
                    }}
                  >
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <p
                    style={{
                      color: c.tabacco,
                      fontSize: "0.85rem",
                      fontWeight: 300,
                      lineHeight: 1.8,
                      opacity: 0.7,
                      paddingBottom: "1.25rem",
                    }}
                  >
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINALE ──────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: c.tabacco,
          padding: "clamp(4rem, 8vw, 7rem) clamp(1.25rem, 5vw, 2.5rem)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          ref={ctaRef}
          style={{
            maxWidth: 680,
            margin: "0 auto",
            textAlign: "center",
            ...fade(ctaInView),
          }}
        >
          <p
            style={{
              color: c.cammello,
              fontSize: "0.68rem",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              marginBottom: "1.5rem",
            }}
          >
            Iniziamo
          </p>
          <h2
            style={{
              color: c.lino,
              fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)",
              fontWeight: 300,
              lineHeight: 1.2,
              marginBottom: "1.5rem",
            }}
          >
            Hai un immobile a Marcianise?
          </h2>
          <p
            style={{
              color: c.sabbia,
              fontSize: "0.9rem",
              fontWeight: 300,
              lineHeight: 1.85,
              opacity: 0.75,
              marginBottom: "3rem",
            }}
          >
            Scrivici su WhatsApp — ti rispondiamo entro un&rsquo;ora.
            Un primo incontro, nessun impegno.
          </p>
          <a
            href="https://wa.me/393661033691?text=Ciao%2C%20ho%20un%20immobile%20a%20Marcianise%20e%20vorrei%20saperne%20di%20pi%C3%B9"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.4rem",
              backgroundColor: "#25D366",
              color: "#fff",
              textDecoration: "none",
              fontSize: "0.72rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              padding: "1.1rem 3rem",
              transition: "opacity 0.25s",
              fontWeight: 400,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            Scrivici su WhatsApp
            <span style={{ fontSize: "0.62rem", letterSpacing: "0.06em", textTransform: "none", fontWeight: 300, opacity: 0.9 }}>
              +39 366 103 3691
            </span>
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
