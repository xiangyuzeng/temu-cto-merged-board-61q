"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import { modules, QTYPE } from "./data";

const allCards = [];
const cardMap = {};
modules.forEach((mod) => {
  mod.cards.forEach((c) => {
    const entry = { ...c, modId: mod.id, modName: mod.name, modColor: mod.color, modIcon: mod.icon };
    allCards.push(entry);
    cardMap[c.id] = entry;
  });
});

function qt(t) { return QTYPE[t] || QTYPE.B; }

export default function Board() {
  const [sel, setSel] = useState(null);
  const [done, setDone] = useState({});
  const [q, setQ] = useState("");
  const [modF, setModF] = useState("all");
  const [typeF, setTypeF] = useState("all");
  const [collapsed, setCollapsed] = useState({});
  const [showStats, setShowStats] = useState(false);
  const [undone, setUndone] = useState(false);

  useEffect(() => {
    try { const s = localStorage.getItem("temu-cto-merged-done"); if (s) setDone(JSON.parse(s)); } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("temu-cto-merged-done", JSON.stringify(done)); } catch {}
  }, [done]);

  const total = allCards.length;
  const doneN = Object.keys(done).length;
  const pct = total > 0 ? Math.round((doneN / total) * 100) : 0;

  const toggle = useCallback((id) => {
    setDone((p) => { const n = { ...p }; if (n[id]) delete n[id]; else n[id] = 1; return n; });
  }, []);
  const togMod = useCallback((id) => {
    setCollapsed((p) => { const n = { ...p }; if (n[id]) delete n[id]; else n[id] = 1; return n; });
  }, []);

  const matchCards = useMemo(() => {
    const ql = q.toLowerCase();
    const m = new Set();
    allCards.forEach((c) => {
      if (modF !== "all" && c.modId !== modF) return;
      if (typeF !== "all" && c.qtype !== typeF) return;
      if (undone && done[c.id]) return;
      if (ql && !c.title.toLowerCase().includes(ql) && !c.answer.toLowerCase().includes(ql)) return;
      m.add(c.id);
    });
    return m;
  }, [q, modF, typeF, undone, done]);

  const visMods = useMemo(() => {
    return modules.map((mod) => {
      const visCards = mod.cards.filter((c) => matchCards.has(c.id));
      if (visCards.length === 0) return null;
      return { ...mod, visCards };
    }).filter(Boolean);
  }, [matchCards]);

  const openCard = (id) => { const c = cardMap[id]; if (c) setSel(c); };
  const navCard = (dir) => {
    if (!sel) return;
    const flat = [];
    visMods.forEach((m) => m.visCards.forEach((c) => flat.push(c.id)));
    const i = flat.indexOf(sel.id);
    if (i < 0) return;
    const ni = dir === 1 ? (i + 1) % flat.length : (i - 1 + flat.length) % flat.length;
    openCard(flat[ni]);
  };

  useEffect(() => {
    const handler = (e) => {
      if (!sel) return;
      if (e.key === "ArrowLeft") navCard(-1);
      if (e.key === "ArrowRight") navCard(1);
      if (e.key === "Escape") setSel(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const readMin = (cc) => Math.max(1, Math.ceil(cc / 280));

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F0", color: "#1a1a1a", fontFamily: "'Noto Sans SC', -apple-system, sans-serif" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", borderBottom: "1px solid #e0e0e0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "14px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: -0.5, color: "#D84315" }}>
                TEMU DBA · CTO终面答题板
              </h1>
              <p style={{ margin: "3px 0 0", fontSize: 11, color: "#888", letterSpacing: 0.5 }}>
                61题 · 8模块 · 含二轮面试自建MySQL洞察 · 行为40% · 项目25% · 技术20% · 文化15%
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 120, height: 6, borderRadius: 3, background: "#e8e8e4", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 3, background: pct === 100 ? "#2E7D32" : "#D84315", width: pct + "%", transition: "width 0.5s ease" }} />
              </div>
              <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: pct === 100 ? "#2E7D32" : "#D84315" }}>
                {doneN}/{total}
              </span>
              <button onClick={() => setShowStats(!showStats)} style={{ padding: "3px 8px", borderRadius: 6, border: "1px solid #ddd", background: showStats ? "#FFF3E0" : "#fff", color: showStats ? "#D84315" : "#888", fontSize: 11, cursor: "pointer" }}>📊</button>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 160px", minWidth: 140 }}>
              <input type="text" placeholder="搜索题目或答案..." value={q} onChange={(e) => setQ(e.target.value)}
                style={{ width: "100%", padding: "6px 28px 6px 30px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", color: "#1a1a1a", fontSize: 12, outline: "none" }} />
              <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 12, opacity: 0.4 }}>🔍</span>
              {q && <button onClick={() => setQ("")} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: 11 }}>✕</button>}
            </div>
            <div style={{ display: "flex", gap: 3, overflowX: "auto", flexShrink: 0 }}>
              <Chip active={modF === "all"} onClick={() => setModF("all")} color="#666">全部</Chip>
              {modules.map((m) => (
                <Chip key={m.id} active={modF === m.id} onClick={() => setModF(modF === m.id ? "all" : m.id)} color={m.color}>
                  {m.icon}{m.name.slice(0, 4)}
                </Chip>
              ))}
            </div>
            <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
              {Object.entries(QTYPE).map(([k, v]) => (
                <Chip key={k} active={typeF === k} onClick={() => setTypeF(typeF === k ? "all" : k)} color={v.color}>
                  {v.icon}{v.desc}
                </Chip>
              ))}
            </div>
            <Chip active={undone} onClick={() => setUndone(!undone)} color="#1565C0">{undone ? "📖未学" : "📖全部"}</Chip>
            <span style={{ fontSize: 11, color: "#888", fontFamily: "'JetBrains Mono', monospace" }}>{matchCards.size}题</span>
          </div>
        </div>
        {showStats && (
          <div style={{ maxWidth: 1400, margin: "0 auto", padding: "8px 20px 10px", borderTop: "1px solid #eee" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
              {modules.map((mod) => {
                const t = mod.cards.length;
                const d = mod.cards.filter((c) => done[c.id]).length;
                const p = t > 0 ? Math.round((d / t) * 100) : 0;
                return (
                  <div key={mod.id} onClick={() => setModF(mod.id)} style={{ cursor: "pointer", textAlign: "center", padding: "8px 6px", borderRadius: 10, background: "#fff", border: modF === mod.id ? "2px solid " + mod.color : "1px solid #eee", transition: "all 0.2s" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: mod.color }}>{d}/{t}</div>
                    <div style={{ width: "100%", height: 3, borderRadius: 2, background: "#eee", marginTop: 4 }}>
                      <div style={{ height: "100%", borderRadius: 2, background: mod.color, width: p + "%", transition: "width 0.3s" }} />
                    </div>
                    <div style={{ fontSize: 9, marginTop: 3, color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{mod.icon} {mod.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "16px 20px 60px" }}>
        {visMods.map((mod) => {
          const isCollapsed = collapsed[mod.id];
          const modDone = mod.visCards.filter((c) => done[c.id]).length;
          return (
            <section key={mod.id} style={{ marginBottom: 24 }}>
              <button onClick={() => togMod(mod.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 14, background: "#fff", border: "1px solid #e8e8e4", cursor: "pointer", textAlign: "left", transition: "all 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}>
                <span style={{ fontSize: 9, color: "#999", transition: "transform 0.2s", transform: isCollapsed ? "rotate(0)" : "rotate(90deg)" }}>▶</span>
                <span style={{ width: 4, height: 28, borderRadius: 2, background: mod.color, flexShrink: 0 }} />
                <span style={{ fontSize: 22 }}>{mod.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>{mod.name}</div>
                  <div style={{ fontSize: 10, color: "#999", marginTop: 2 }}>{mod.description}</div>
                </div>
                <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: modDone === mod.visCards.length && modDone > 0 ? "#2E7D32" : "#999", fontWeight: 600 }}>{modDone}/{mod.visCards.length}</span>
                <div style={{ width: 52, height: 4, borderRadius: 2, background: "#e8e8e4" }}>
                  <div style={{ height: "100%", borderRadius: 2, background: modDone === mod.visCards.length && modDone > 0 ? "#2E7D32" : mod.color, width: (mod.visCards.length > 0 ? (modDone / mod.visCards.length * 100) : 0) + "%", transition: "width 0.3s" }} />
                </div>
              </button>
              {!isCollapsed && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10, marginTop: 10, paddingLeft: 16 }}>
                  {mod.visCards.map((c) => {
                    const isDone = !!done[c.id];
                    const qInfo = qt(c.qtype);
                    return (
                      <div key={c.id} onClick={() => openCard(c.id)}
                        style={{ cursor: "pointer", background: "#fff", borderRadius: 12, border: "1px solid " + (isDone ? "#A5D6A7" : "#e8e8e4"), borderLeft: "3px solid " + (isDone ? "#2E7D32" : mod.color), padding: "14px 16px", transition: "all 0.2s", position: "relative" }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px " + mod.color + "18"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: qInfo.bg, color: qInfo.color, fontWeight: 600 }}>{qInfo.icon} {qInfo.desc}</span>
                            <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#bbb" }}>Q{c.num}</span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); toggle(c.id); }}
                            style={{ width: 20, height: 20, borderRadius: 10, border: "2px solid " + (isDone ? "#2E7D32" : "#ddd"), background: isDone ? "#E8F5E9" : "transparent", color: isDone ? "#2E7D32" : "transparent", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                            {isDone ? "✓" : ""}
                          </button>
                        </div>
                        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, lineHeight: 1.55, color: "#2a2a2a" }}>{c.title}</h3>
                        <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 10, color: "#bbb", fontFamily: "'JetBrains Mono', monospace" }}>{c.charCount}字 · ~{readMin(c.charCount)}分钟</span>
                          <span style={{ fontSize: 10, color: mod.color, opacity: 0, transition: "opacity 0.2s" }} className="view-hint">查看答案 →</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
        {visMods.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ color: "#999", fontSize: 14 }}>🔍 没有匹配的题目</p>
            <button onClick={() => { setQ(""); setModF("all"); setTypeF("all"); setUndone(false); }}
              style={{ marginTop: 8, fontSize: 12, color: "#D84315", background: "none", border: "none", textDecoration: "underline", cursor: "pointer" }}>清除筛选</button>
          </div>
        )}
      </main>

      {sel && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setSel(null); }}
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 12, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 820, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid #e0e0e0", boxShadow: "0 24px 64px rgba(0,0,0,0.15)", animation: "modalIn 0.25s ease-out" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #eee", flexShrink: 0, background: "#FAFAF8" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: qt(sel.qtype).bg, color: qt(sel.qtype).color, fontWeight: 600 }}>{qt(sel.qtype).icon} {qt(sel.qtype).label}</span>
                  <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: sel.modColor + "12", color: sel.modColor, fontWeight: 500 }}>{sel.modIcon} {sel.modName}</span>
                  <span style={{ fontSize: 10, color: "#999", fontFamily: "'JetBrains Mono', monospace" }}>Q{sel.num} · {sel.charCount}字 · ~{readMin(sel.charCount)}分钟</span>
                </div>
                <button onClick={() => setSel(null)} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #ddd", background: "#fff", color: "#999", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, lineHeight: 1.5, color: "#1a1a1a" }}>{sel.title}</h2>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", background: "#fff" }}>
              {sel.answer.split("\n\n").map((para, pi) => (
                <div key={pi} style={{ marginBottom: 10 }}>
                  {para.split("\n").map((line, li) => {
                    const t = line.trim();
                    if (!t) return null;
                    if (/^【⚠️/.test(t))
                      return <p key={li} style={{ fontSize: 14, fontWeight: 700, color: "#B71C1C", marginTop: 20, marginBottom: 6, borderLeft: "3px solid #E53935", paddingLeft: 10, background: "#FFF8E1", padding: "8px 12px", borderRadius: "0 6px 6px 0" }}>{t}</p>;
                    if (/^【/.test(t))
                      return <p key={li} style={{ fontSize: 14, fontWeight: 700, color: sel.modColor, marginTop: 16, marginBottom: 6, borderLeft: "3px solid " + sel.modColor, paddingLeft: 10 }}>{t}</p>;
                    if (/^第[一二三四五六七八九十]+[阶段步层,，]/.test(t))
                      return <p key={li} style={{ fontSize: 14, fontWeight: 700, color: sel.modColor, marginTop: 14, marginBottom: 4 }}>{t}</p>;
                    if (/^Phase\s/.test(t))
                      return <p key={li} style={{ fontSize: 14, fontWeight: 700, color: sel.modColor, marginTop: 14, marginBottom: 4 }}>{t}</p>;
                    if (/^[•·\-–►]/.test(t))
                      return <p key={li} style={{ fontSize: 13.5, lineHeight: 1.8, color: "#444", paddingLeft: 14, position: "relative" }}>
                        <span style={{ position: "absolute", left: 0, color: sel.modColor, fontWeight: 700 }}>·</span>
                        {t.replace(/^[•·\-–►]\s*/, '')}
                      </p>;
                    if (/^[0-9]+[.、)]/.test(t))
                      return <p key={li} style={{ fontSize: 13.5, lineHeight: 1.8, color: "#333", fontWeight: 500, marginTop: 4 }}>{t}</p>;
                    if (/^.{2,20}[：:]/.test(t) && t.indexOf('\uFF1A') < 20)
                      return <p key={li} style={{ fontSize: 13.5, lineHeight: 1.8, color: "#444", marginTop: 4 }}>
                        <span style={{ color: sel.modColor, fontWeight: 600 }}>{t.split(/[：:]/)[0]}：</span>
                        {t.split(/[：:]/).slice(1).join('：')}
                      </p>;
                    return <p key={li} style={{ fontSize: 13.5, lineHeight: 1.9, color: "#444", margin: "2px 0" }}>{t}</p>;
                  })}
                </div>
              ))}
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: "#FAFAF8" }}>
              <button onClick={() => toggle(sel.id)}
                style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: done[sel.id] ? "#E8F5E9" : "#f5f5f0", color: done[sel.id] ? "#2E7D32" : "#888", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
                {done[sel.id] ? "✓ 已复习" : "○ 标记已复习"}
              </button>
              <div style={{ display: "flex", gap: 6 }}>
                <NavBtn onClick={() => navCard(-1)}>← 上一题</NavBtn>
                <NavBtn onClick={() => navCard(1)}>下一题 →</NavBtn>
                <button onClick={() => setSel(null)} style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: sel.modColor, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>关闭</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer style={{ textAlign: "center", padding: "20px", borderTop: "1px solid #e8e8e4" }}>
        <p style={{ fontSize: 10, color: "#bbb", lineHeight: 1.6 }}>
          合并去重61题 · 8模块 · 含二轮面试自建MySQL洞察<br/>核心价值观: 本分 · 求责于己 · 积极主动 · 终局思维
        </p>
      </footer>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; }
        body { margin: 0; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #aaa; }
        @keyframes modalIn { from { transform: translateY(16px) scale(0.97); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        div:hover > .view-hint { opacity: 1 !important; }
      `}</style>
    </div>
  );
}

function Chip({ children, active, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
      border: active ? "1px solid " + color : "1px solid #e0e0e0",
      background: active ? color + "14" : "#fff",
      color: active ? color : "#999",
      transition: "all 0.15s"
    }}>{children}</button>
  );
}

function NavBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", color: "#666", fontSize: 12, cursor: "pointer", transition: "all 0.15s" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f5f0"; e.currentTarget.style.color = "#333"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#666"; }}>
      {children}
    </button>
  );
}
