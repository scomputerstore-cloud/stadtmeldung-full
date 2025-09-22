import React, { useState, useEffect } from "react";
import { MessageSquarePlus, Trash2, Reply, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export default function ForumBoard({ currentUser }) {
  const [threads, setThreads] = useState(() => {
    try {
      const saved = localStorage.getItem("stadt_forum");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 1, title: "Begrüßung", author: "System", text: "Willkommen im Saalekreis-Forum! Bitte freundlich bleiben. 😊", createdAt: Date.now()-3600000, comments: [] },
    ];
  });
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [reply, setReply] = useState({ threadId: null, text: "" });

  useEffect(() => {
    try { localStorage.setItem("stadt_forum", JSON.stringify(threads)); } catch {}
  }, [threads]);

  const createThread = () => {
    if (!title.trim() || !text.trim()) return;
    setThreads(prev => [
      { id: Date.now(), title: title.trim(), author: currentUser?.name || "Gast", text: text.trim(), createdAt: Date.now(), comments: [] },
      ...prev
    ]);
    setTitle(""); setText("");
  };

  const deleteThread = (id) => {
    if (!(currentUser?.isAdmin || currentUser?.isModerator)) return alert("Nur Admin/Moderator.");
    if (!confirm("Thread löschen?")) return;
    setThreads(prev => prev.filter(t => t.id !== id));
  };

  const addReply = (threadId) => {
    if (!reply.text.trim()) return;
    setThreads(prev => prev.map(t => t.id === threadId ? {
      ...t, comments: [...t.comments, { id: uid(), author: currentUser?.name || "Gast", text: reply.text.trim(), at: Date.now() }]
    } : t));
    setReply({ threadId: null, text: "" });
  };

  const deleteReply = (threadId, commentId) => {
    if (!(currentUser?.isAdmin || currentUser?.isModerator)) return alert("Nur Admin/Moderator.");
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, comments: t.comments.filter(c => c.id !== commentId) } : t));
  };

  return (
    <div className="grid gap-3">
      <h3 className="font-semibold flex items-center gap-2"><MessageSquarePlus size={16}/> Forum (Demo)</h3>

      {/* Create */}
      <div className="border rounded p-3 grid gap-2">
        <Input placeholder="Titel" value={title} onChange={(e)=>setTitle(e.target.value)} />
        <Textarea placeholder="Was möchtest du teilen/fragen?" value={text} onChange={(e)=>setText(e.target.value)} />
        <div className="flex gap-2">
          <Button className="bg-blue-600 text-white" onClick={createThread}><MessageSquarePlus size={16}/> Thread erstellen</Button>
          <span className="text-xs text-gray-500">Hinweis: Keine personenbezogenen Daten posten. Bilder nur, wenn du die Rechte besitzt.</span>
        </div>
      </div>

      {/* List */}
      <div className="grid gap-3">
        {threads.map(t => (
          <div key={t.id} className="border rounded p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{t.title}</div>
                <div className="text-xs text-gray-500">von {t.author} · {new Date(t.createdAt).toLocaleString()}</div>
              </div>
              {(currentUser?.isAdmin || currentUser?.isModerator) && (
                <Button variant="destructive" onClick={()=>deleteThread(t.id)}><Trash2 size={16}/> Löschen</Button>
              )}
            </div>
            <p className="mt-2">{t.text}</p>

            {/* Comments */}
            <div className="mt-3 grid gap-2">
              {t.comments.map(c => (
                <div key={c.id} className="border rounded p-2 flex items-start justify-between">
                  <div>
                    <div className="text-sm"><b>{c.author}</b> · <span className="text-gray-500 text-xs">{new Date(c.at).toLocaleString()}</span></div>
                    <div className="text-sm">{c.text}</div>
                  </div>
                  {(currentUser?.isAdmin || currentUser?.isModerator) && (
                    <button className="text-gray-500 hover:text-red-600" onClick={()=>deleteReply(t.id, c.id)} title="Kommentar löschen">
                      <Shield size={16}/>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Reply box */}
            <div className="mt-2 flex gap-2">
              <input
                className="border border-gray-300 rounded px-3 py-2 text-sm flex-1"
                placeholder="Antwort schreiben…"
                value={reply.threadId === t.id ? reply.text : ""}
                onChange={(e)=>setReply({ threadId: t.id, text: e.target.value })}
                onKeyDown={(e)=> e.key === "Enter" && addReply(t.id)}
              />
              <Button variant="outline" onClick={()=>addReply(t.id)}><Reply size={16}/> Antworten</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
