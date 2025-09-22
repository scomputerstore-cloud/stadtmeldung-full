import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X } from "lucide-react";

const canned = [
  { q: /hallo|hi|hey/i, a: "Hallo! Wie kann ich helfen? 😊" },
  { q: /status/i, a: "Du kannst den Status deiner Meldung in der Liste sehen. Grün = erledigt." },
  { q: /konto|account|anonym/i, a: "Du kannst anonym melden. Mit Login erhältst du Verlauf & Benachrichtigungen." },
  { q: /datenschutz|privacy/i, a: "Wir speichern Daten nur lokal (Demo). Live-Geocoding nutzt Nominatim." },
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("stadt_chat");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [{ from: "bot", text: "Willkommen beim StadtMeldung Chat! (Demo)" }];
  });
  const endRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem("stadt_chat", JSON.stringify(messages)); } catch {}
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const onSend = () => {
    const txt = (input || "").trim();
    if (!txt) return;
    setMessages(prev => [...prev, { from: "me", text: txt }]);
    setInput("");
    const hit = canned.find(c => c.q.test(txt));
    const answer = hit ? hit.a : "Danke! Ein Teammitglied meldet sich, wenn Moderation aktiv ist. (Demo)";
    setTimeout(() => setMessages(prev => [...prev, { from: "bot", text: answer }]), 200);
  };

  return (
    <>
      <button
        aria-label="Chat öffnen"
        onClick={() => setOpen(v => !v)}
        style={{
          position: "fixed", right: 16, bottom: 16, zIndex: 1000,
          background: "#2563eb", color: "#fff", border: "none", borderRadius: 999,
          padding: "12px 14px", boxShadow: "0 6px 18px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: 8,
        }}
      >
        <MessageCircle size={18} /> Chat
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Chat"
          style={{
            position: "fixed", right: 16, bottom: 76, zIndex: 1000,
            width: 320, maxHeight: 420, background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
            boxShadow: "0 12px 30px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column",
          }}
        >
          <div style={{ padding: 10, borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>Bürger-Chat (Demo)</strong>
            <button onClick={() => setOpen(false)} aria-label="Chat schließen" style={{ border: "none", background: "transparent" }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 10, gap: 8, display: "grid" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ justifySelf: m.from === "me" ? "end" : "start", maxWidth: "85%" }}>
                <div style={{ background: m.from === "me" ? "#2563eb" : "#f3f4f6", color: m.from === "me" ? "#fff" : "#111827", padding: "8px 10px", borderRadius: 10, fontSize: 14 }}>{m.text}</div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div style={{ display: "flex", gap: 6, padding: 8, borderTop: "1px solid #e5e7eb" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nachricht schreiben…"
              style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }}
              onKeyDown={(e) => e.key === "Enter" && onSend()}
            />
            <button onClick={onSend} aria-label="Senden" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", background: "#fff" }}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
