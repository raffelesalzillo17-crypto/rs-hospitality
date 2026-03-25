"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Credenziali non valide. Riprova.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F0EBE0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #D4C9B5",
          borderRadius: "4px",
          padding: "48px 40px",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        {/* Logo / header */}
        <div style={{ marginBottom: "40px", textAlign: "center" }}>
          <div
            style={{
              fontSize: "11px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#8B7355",
              marginBottom: "8px",
            }}
          >
            RS Hospitality
          </div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 500,
              color: "#2C2416",
              margin: 0,
            }}
          >
            RS Central
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontSize: "12px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#8B7355",
                marginBottom: "8px",
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #D4C9B5",
                borderRadius: "3px",
                fontSize: "15px",
                color: "#2C2416",
                backgroundColor: "#FDFAF6",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "28px" }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                fontSize: "12px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#8B7355",
                marginBottom: "8px",
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #D4C9B5",
                borderRadius: "3px",
                fontSize: "15px",
                color: "#2C2416",
                backgroundColor: "#FDFAF6",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                marginBottom: "20px",
                padding: "10px 14px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: "3px",
                fontSize: "13px",
                color: "#b91c1c",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: loading ? "#8B7355" : "#2C2416",
              color: "#F0EBE0",
              border: "none",
              borderRadius: "3px",
              fontSize: "13px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: loading ? "default" : "pointer",
              transition: "background-color 0.2s",
            }}
          >
            {loading ? "Accesso in corso…" : "Accedi"}
          </button>
        </form>
      </div>
    </div>
  );
}
