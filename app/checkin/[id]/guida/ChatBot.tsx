"use client";

import { useState, useRef, useEffect } from "react";

const c = {
  tabacco:  "#2C2416",
  lino:     "#F0EBE0",
  cammello: "#8B7355",
  sabbia:   "#D4C9B5",
} as const;

const FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";

type Message = { role: "user" | "assistant"; content: string };

export default function ChatBot({
  bookingId,
  guestName,
  propertyName,
}: {
  bookingId: string;
  guestName: string;
  propertyName: string;
}) {
  const primoMessaggio: Message = {
    role: "assistant",
    content: `Ciao${guestName ? ` ${guestName.split(" ")[0]}` : ""}! Sono l'assistente di RS Hospitality. Sono qui per aiutarti durante il tuo soggiorno${propertyName ? ` a ${propertyName}` : ""}. Cosa posso fare per te?`,
  };

  const [messages,  setMessages]  = useState<Message[]>([primoMessaggio]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const testo = input.trim();
    if (!testo || loading) return;

    const nuovi: Message[] = [...messages, { role: "user", content: testo }];
    setMessages(nuovi);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nuovi.map(m => ({ role: m.role, content: m.content })),
          bookingId,
          language: navigator.language,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Risposta non valida");

      // Streaming SSE
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let risposta  = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const { text } = JSON.parse(payload);
            if (text) {
              risposta += text;
              setMessages(prev => {
                const aggiornati = [...prev];
                aggiornati[aggiornati.length - 1] = { role: "assistant", content: risposta };
                return aggiornati;
              });
            }
          } catch { /* ignora chunk malformato */ }
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Mi dispiace, si e verificato un errore. Riprova tra un momento." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "2rem 1.5rem" }}>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: c.tabacco, margin: "0 0 0.4rem" }}>
          Assistente RS
        </h2>
        <p style={{ fontSize: 13, color: c.cammello, margin: 0 }}>
          Chiedimi qualsiasi cosa sul tuo soggiorno
        </p>
      </div>

      {/* Chat messages */}
      <div style={{
        minHeight: 320, maxHeight: 480,
        overflowY: "auto", WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
        display: "flex", flexDirection: "column", gap: "0.75rem",
        marginBottom: "1rem",
      } as React.CSSProperties}>

        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "82%",
              padding: "0.7rem 1rem",
              borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: msg.role === "user" ? c.tabacco : c.sabbia,
              color: msg.role === "user" ? c.lino : c.tabacco,
              fontSize: 14, lineHeight: 1.55, fontFamily: FONT,
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>
              {msg.content || (loading && i === messages.length - 1 ? "…" : "")}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
        <textarea
          ref={inputRef}
          rows={1}
          placeholder="Scrivi un messaggio…"
          value={input}
          onChange={e => {
            setInput(e.target.value);
            // auto-resize
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
          }}
          onKeyDown={handleKeyDown}
          disabled={loading}
          style={{
            flex: 1, padding: "0.75rem 1rem",
            border: `1px solid ${c.sabbia}`, borderRadius: 12,
            background: "#fff", color: c.tabacco,
            fontFamily: FONT, fontSize: 15, outline: "none",
            resize: "none", minHeight: 48, maxHeight: 120,
            overflowY: "auto", lineHeight: 1.5,
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            flexShrink: 0, width: 48, height: 48,
            background: loading || !input.trim() ? c.sabbia : c.tabacco,
            border: "none", borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: loading || !input.trim() ? "default" : "pointer",
            transition: "background 0.15s",
          }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={c.lino} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
