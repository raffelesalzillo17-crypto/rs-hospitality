"use client";

import { useState } from "react";

const c = {
  tabacco:  "#2C2416",
  cammello: "#8B7355",
  sabbia:   "#D4C9B5",
} as const;

export default function WifiCard({ wifiName, wifiPassword }: { wifiName: string | null; wifiPassword: string | null }) {
  const [copiato, setCopiato] = useState(false);

  function copiaPassword() {
    if (!wifiPassword) return;
    navigator.clipboard.writeText(wifiPassword).then(() => {
      setCopiato(true);
      setTimeout(() => setCopiato(false), 2000);
    });
  }

  return (
    <button
      onClick={copiaPassword}
      style={{
        background: c.sabbia, borderRadius: 10, padding: "1rem 0.75rem",
        textAlign: "center", border: "none", cursor: wifiPassword ? "pointer" : "default",
        width: "100%",
      }}>
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: c.cammello, margin: "0 0 0.4rem" }}>Wi-Fi</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: c.tabacco, margin: "0 0 0.2rem", wordBreak: "break-all" }}>{wifiName ?? "—"}</p>
      <p style={{ fontSize: 11, color: c.cammello, margin: 0 }}>
        {copiato ? "Password copiata" : wifiPassword ? "Tocca per copiare" : "—"}
      </p>
    </button>
  );
}
