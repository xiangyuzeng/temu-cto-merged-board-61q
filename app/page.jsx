"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import { modules, QTYPE } from "./data";

// Build flat card lookup
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

  // Load progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("temu-cto-merged-done");
      if (saved) setDone(JSON.parse(saved));
    } catch {}
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

  // Filtered cards
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

  // Visible modules
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

  // Keyboard nav
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

  // Estimate reading time
  const readMin = (cc) => Math.max(1, Math.ceil(cc / 280));

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e2e2e8", fontFamily: "'Noto Sans SC', -apple-system, sans-serif" }}>
      {/* ===== HEADER ===== */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(10,10,15,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "14px 20px" }}>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: -0.5, background: "linear-gradient(135deg,#ff6b35,#f7c948)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                TEMU DBA · CTO终面答题板
              </h1>
              <p style={{ margin: "3px 0 0", fontSize: 11, color: "#666", letterSpacing: 0.5 }}>
                61题 · TI01+TI02+面试脚本V1+V2+CTO深度场景 · 8模块 · 行为40% · 项目深挖25% · 技术场景20% · 文化适配15%
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 120, height: 6, borderRadius: 3, background: "#1a1a24", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 3, background: pct === 100 ? "linear-gradient(90deg,#22c55e,#4ade80)" : "linear-gradient(90deg,#ff6b35,#f7c948)", width: `${pct}%`, transition: "width 0.5s ease" }} />
              </div>
              <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: pct === 100 ? "#4ade80" : "#f7c948" }}>
                {doneN}/{total}
              </span>
              <button onClick={() => setShowStats(!showStats)} style={{ padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: showStats ? "rgba(247,201,72,0.15)" : "transparent", color: showStats ? "#f7c948" : "#666", fontSize: 11, cursor: "pointer" }}>📊</button>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative", flex: "1 1 160px", minWidth: 140 }}>
              <input type="text" placeholder="搜索题目或答案..." value={q} onChange={(e) => setQ(e.target.value)}
                style={{ width: "100%", padding: "6px 28px 6px 30px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "#12121a", color: "#e2e2e8", fontSize: 12, outline: "none" }} />
              <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 12, opacity: 0.4 }}>🔍</span>
              {q && <button onClick={() => setQ("")} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 11 }}>✕</button>}
            </div>

            {/* Module filters */}
            <div style={{ display: "flex", gap: 3, overflowX: "auto", flexShrink: 0 }}>
              <Chip active={modF === "all"} onClick={() => setModF("all")} color="#888">全部</Chip>
              {modules.map((m) => (
                <Chip key={m.id} active={modF === m.id} onClick={() => setModF(modF === m.id ? "all" : m.id)} color={m.color}>
                  {m.icon}{m.name.slice(0, 4)}
                </Chip>
              ))}
            </div>

            {/* Type filters */}
            <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
              {Object.entries(QTYPE).map(([k, v]) => (
                <Chip key={k} active={typeF === k} onClick={() => setTypeF(typeF === k ? "all" : k)} color={v.color}>
                  {v.icon}{v.desc}
                </Chip>
              ))}
            </div>

            {/* Undone toggle */}
            <Chip active={undone} onClick={() => setUndone(!undone)} color="#60a5fa">{undone ? "📖未学" : "📖全部"}</Chip>
            <span style={{ fontSize: 11, color: "#555", fontFamily: "'JetBrains Mono', monospace" }}>{matchCards.size}题</span>
          </div>
        </div>

        {/* Stats panel */}
        {showStats && (
          <div style={{ maxWidth: 1400, margin: "0 auto", padding: "8px 20px 10px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
              {modules.map((mod) => {
                const t = mod.cards.length;
                const d = mod.cards.filter((c) => done[c.id]).length;
                const p = t > 0 ? Math.round((d / t) * 100) : 0;
                return (
                  <div key={mod.id} onClick={() => setModF(mod.id)} style={{ cursor: "pointer", textAlign: "center", padding: "8px 6px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: modF === mod.id ? `1px solid ${mod.color}40` : "1px solid transparent", transition: "all 0.2s" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: mod.color }}>{d}/{t}</div>
                    <div style={{ width: "100%", height: 3, borderRadius: 2, background: "#1a1a24", marginTop: 4 }}>
                      <div style={{ height: "100%", borderRadius: 2, background: mod.color, width: `${p}%`, transition: "width 0.3s" }} />
                    </div>
                    <div style={{ fontSize: 9, marginTop: 3, color: "#555", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{mod.icon} {mod.name}</div>
                  </div>
                );
              })}
            </div>
            {/* Source legend */}
            <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.03)" }}>
              <span style={{ fontSize: 9, color: "#555" }}>🗣️ 行为面试 {allCards.filter(c => c.qtype === 'B').length}题</span>
              <span style={{ fontSize: 9, color: "#555" }}>🔍 项目深挖 {allCards.filter(c => c.qtype === 'P').length}题</span>
              <span style={{ fontSize: 9, color: "#555" }}>⚙️ 技术场景 {allCards.filter(c => c.qtype === 'T').length}题</span>
              <span style={{ fontSize: 9, color: "#555" }}>💼 文化适配 {allCards.filter(c => c.qtype === 'C').length}题</span>
            </div>
          </div>
        )}
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "16px 20px 60px" }}>
        {visMods.map((mod) => {
          const isCollapsed = collapsed[mod.id];
          const modDone = mod.visCards.filter((c) => done[c.id]).length;
          return (
            <section key={mod.id} style={{ marginBottom: 24 }}>
              {/* Module header */}
              <button onClick={() => togMod(mod.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", textAlign: "left", transition: "background 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}>
                <span style={{ fontSize: 9, color: "#555", transition: "transform 0.2s", transform: isCollapsed ? "rotate(0)" : "rotate(90deg)" }}>▶</span>
                <span style={{ width: 4, height: 28, borderRadius: 2, background: mod.color, flexShrink: 0 }} />
                <span style={{ fontSize: 22 }}>{mod.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e2e8" }}>{mod.name}</div>
                  <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{mod.description}</div>
                </div>
                <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: modDone === mod.visCards.length && modDone > 0 ? "#4ade80" : "#555", fontWeight: 600 }}>{modDone}/{mod.visCards.length}</span>
                <div style={{ width: 52, height: 4, borderRadius: 2, background: "#1a1a24" }}>
                  <div style={{ height: "100%", borderRadius: 2, background: modDone === mod.visCards.length && modDone > 0 ? "#22c55e" : mod.color, width: `${mod.visCards.length > 0 ? (modDone / mod.visCards.length * 100) : 0}%`, transition: "width 0.3s" }} />
                </div>
              </button>

              {/* Cards grid */}
              {!isCollapsed && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10, marginTop: 10, paddingLeft: 16 }}>
                  {mod.visCards.map((c) => {
                    const isDone = !!done[c.id];
                    const qInfo = qt(c.qtype);
                    return (
                      <div key={c.id} onClick={() => openCard(c.id)}
                        style={{ cursor: "pointer", background: "#12121a", borderRadius: 12, border: `1px solid ${isDone ? "#22c55e30" : "rgba(255,255,255,0.06)"}`, borderLeft: `3px solid ${isDone ? "#22c55e" : mod.color + "60"}`, padding: "14px 16px", transition: "all 0.2s", position: "relative" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#16161f"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${mod.color}10`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#12121a"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: qInfo.bg + "20", color: qInfo.color, fontWeight: 600 }}>{qInfo.icon} {qInfo.desc}</span>
                            <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#444" }}>Q{c.num}</span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); toggle(c.id); }}
                            style={{ width: 20, height: 20, borderRadius: 10, border: `2px solid ${isDone ? "#22c55e" : "#333"}`, background: isDone ? "#22c55e20" : "transparent", color: isDone ? "#22c55e" : "transparent", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                            {isDone ? "✓" : ""}
                          </button>
                        </div>
                        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, lineHeight: 1.55, color: "#d0d0d8" }}>{c.title}</h3>
                        <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 10, color: "#333", fontFamily: "'JetBrains Mono', monospace" }}>{c.charCount}字 · ~{readMin(c.charCount)}分钟</span>
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
            <p style={{ color: "#444", fontSize: 14 }}>🔍 没有匹配的题目</p>
            <button onClick={() => { setQ(""); setModF("all"); setTypeF("all"); setUndone(false); }}
              style={{ marginTop: 8, fontSize: 12, color: "#f7c948", background: "none", border: "none", textDecoration: "underline", cursor: "pointer" }}>清除筛选</button>
          </div>
        )}
      </main>

      {/* ===== DETAIL MODAL ===== */}
      {sel && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setSel(null); }}
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 12, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
          <div style={{ background: "#12121a", borderRadius: 20, width: "100%", maxWidth: 820, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", boxShadow: `0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px ${sel.modColor}15`, animation: "modalIn 0.25s ease-out" }}>
            {/* Modal header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: qt(sel.qtype).bg + "20", color: qt(sel.qtype).color, fontWeight: 600 }}>{qt(sel.qtype).icon} {qt(sel.qtype).label}</span>
                  <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: sel.modColor + "15", color: sel.modColor, fontWeight: 500 }}>{sel.modIcon} {sel.modName}</span>
                  <span style={{ fontSize: 10, color: "#444", fontFamily: "'JetBrains Mono', monospace" }}>Q{sel.num} · {sel.charCount}字 · ~{readMin(sel.charCount)}分钟</span>
                </div>
                <button onClick={() => setSel(null)} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#666", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, lineHeight: 1.5, color: "#e8e8ee" }}>{sel.title}</h2>
            </div>

            {/* Modal body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {sel.answer.split("\n\n").map((para, pi) => (
                <div key={pi} style={{ marginBottom: 10 }}>
                  {para.split("\n").map((line, li) => {
                    const t = line.trim();
                    if (!t) return null;
                    // Section headers with 【】
                    if (/^【/.test(t))
                      return <p key={li} style={{ fontSize: 14, fontWeight: 700, color: "#f7c948", marginTop: 16, marginBottom: 6, borderLeft: `3px solid ${sel.modColor}`, paddingLeft: 10 }}>{t}</p>;
                    // Phase headers
                    if (/^第[一二三四五六七八九十]+[阶段步层,，]/.test(t))
                      return <p key={li} style={{ fontSize: 14, fontWeight: 700, color: sel.modColor, marginTop: 14, marginBottom: 4 }}>{t}</p>;
                    // Brackets
                    if (/^[[\[]/.test(t) && t.length < 60)
                      return <p key={li} style={{ fontSize: 14, fontWeight: 700, color: "#f7c948", marginTop: 14, marginBottom: 4 }}>{t}</p>;
                    // Bullets
                    if (/^[•·\-–►]/.test(t))
                      return <p key={li} style={{ fontSize: 13.5, lineHeight: 1.8, color: "#b8b8c4", paddingLeft: 14, position: "relative" }}>
                        <span style={{ position: "absolute", left: 0, color: sel.modColor }}>·</span>
                        {t.replace(/^[•·\-–►]\s*/, '')}
                      </p>;
                    // Numbered items
                    if (/^[0-9]+[.、)]/.test(t))
                      return <p key={li} style={{ fontSize: 13.5, lineHeight: 1.8, color: "#c8c8d4", fontWeight: 500, marginTop: 4 }}>{t}</p>;
                    // Keywords in bold-like format
                    if (/^.{2,20}[：:]/.test(t) && t.indexOf('：') < 20)
                      return <p key={li} style={{ fontSize: 13.5, lineHeight: 1.8, color: "#d0d0dc", marginTop: 4 }}>
                        <span style={{ color: sel.modColor, fontWeight: 600 }}>{t.split(/[：:]/)[0]}：</span>
                        {t.split(/[：:]/).slice(1).join('：')}
                      </p>;
                    // Default
                    return <p key={li} style={{ fontSize: 13.5, lineHeight: 1.9, color: "#b0b0bc", margin: "2px 0" }}>{t}</p>;
                  })}
                </div>
              ))}
            </div>

            {/* Modal footer */}
            <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: "rgba(0,0,0,0.2)" }}>
              <button onClick={() => toggle(sel.id)}
                style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: done[sel.id] ? "#22c55e20" : "#1a1a24", color: done[sel.id] ? "#4ade80" : "#888", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
                {done[sel.id] ? "✓ 已复习" : "○ 标记已复习"}
              </button>
              <div style={{ display: "flex", gap: 6 }}>
                <NavBtn onClick={() => navCard(-1)}>← 上一题</NavBtn>
                <NavBtn onClick={() => navCard(1)}>下一题 →</NavBtn>
                <button onClick={() => setSel(null)} style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: sel.modColor, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "opacity 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>关闭</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== FOOTER ===== */}
      <footer style={{ textAlign: "center", padding: "20px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <p style={{ fontSize: 10, color: "#333", lineHeight: 1.6 }}>
          TI01(127卡技术板) + TI02(39卡行为板) + 面试脚本V1(25题) + V2(21题) + CTO深度场景(6题) → 合并去重61题 · 8模块
          <br/>
          核心价值观: 本分 · 求责于己 · 积极主动 · 终局思维
        </p>
      </footer>

      {/* Global styles */}
      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; }
        body { margin: 0; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #555; }
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
      border: active ? `1px solid ${color}40` : "1px solid transparent",
      background: active ? `${color}18` : "transparent",
      color: active ? color : "#555",
      transition: "all 0.15s"
    }}>{children}</button>
  );
}

function NavBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#888", fontSize: 12, cursor: "pointer", transition: "all 0.15s" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#1a1a24"; e.currentTarget.style.color = "#ccc"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#888"; }}>
      {children}
    </button>
  );
}
