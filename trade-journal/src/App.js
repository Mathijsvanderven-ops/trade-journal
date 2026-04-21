import { useState, useEffect } from "react";

const SETUPS = ["OB", "FVG", "OB + FVG", "BOS", "CHOCH", "Liquidity Sweep", "Other"];
const SESSIONS = ["London", "New York", "Asia", "Overlap"];

const initialForm = {
  side: "", ticker: "", entry: "", sl: "", tp: "",
  setup: "", session: "", notes: "",
};

function calcRR(entry, sl, tp, side) {
  const e = parseFloat(entry), s = parseFloat(sl), t = parseFloat(tp);
  if (!e || !s || !t) return null;
  const risk = side === "long" ? e - s : s - e;
  const reward = side === "long" ? t - e : e - t;
  if (risk <= 0 || reward <= 0) return null;
  return (reward / risk).toFixed(2);
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 4,
    }}>
      <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#666", fontFamily: "'DM Mono', monospace" }}>{label}</span>
      <span style={{ fontSize: 28, fontWeight: 700, color: color || "#f0f0f0", fontFamily: "'DM Mono', monospace" }}>{value ?? "—"}</span>
      {sub && <span style={{ fontSize: 12, color: "#555" }}>{sub}</span>}
    </div>
  );
}

function Badge({ text }) {
  const map = {
    long:  { bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.3)",  color: "#34d399" },
    short: { bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)", color: "#f87171" },
    win:   { bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.3)",  color: "#34d399" },
    loss:  { bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)", color: "#f87171" },
    open:  { bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)",  color: "#fbbf24" },
    be:    { bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.3)", color: "#94a3b8" },
  };
  const c = map[text?.toLowerCase()] || map.open;
  return (
    <span style={{
      background: c.bg, border: `1px solid ${c.border}`, color: c.color,
      borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 600,
      letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap",
    }}>{text}</span>
  );
}

function FieldInput({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label style={{ fontSize: 11, color: "#666", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type} step="any"
        style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", color: "#f0f0f0", fontSize: 13, fontFamily: "'DM Mono', monospace", outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}

export default function App() {
  const [trades, setTrades] = useState(() => {
    try {
      const saved = localStorage.getItem("tradelog_trades");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [form, setForm] = useState(initialForm);
  const [view, setView] = useState("dashboard");
  const [showForm, setShowForm] = useState(false);
  const [editTrade, setEditTrade] = useState(null);
  const [closeForm, setCloseForm] = useState({ result: "", exitPrice: "", pnl: "" });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem("tradelog_trades", JSON.stringify(trades));
  }, [trades]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  const rr = calcRR(form.entry, form.sl, form.tp, form.side);

  const closedTrades = trades.filter(t => ["win", "loss", "be"].includes(t.result));
  const wins = trades.filter(t => t.result === "win").length;
  const losses = trades.filter(t => t.result === "loss").length;
  const winrate = closedTrades.length ? Math.round((wins / closedTrades.length) * 100) : null;
  const avgRR = closedTrades.length
    ? (closedTrades.reduce((a, t) => a + parseFloat(t.rr || 0), 0) / closedTrades.length).toFixed(2)
    : null;
  const totalPnl = trades.reduce((acc, t) => {
    const n = parseFloat((t.pnl || "").replace(/[€+]/g, ""));
    return acc + (isNaN(n) ? 0 : n);
  }, 0);

  function handleSubmit() {
    if (!form.side || !form.ticker || !form.entry || !form.sl || !form.tp) {
      showToast("Vul alle verplichte velden in (*)", "error"); return;
    }
    const now = new Date();
    const newTrade = {
      id: Date.now().toString(),
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
      side: form.side, ticker: form.ticker.toUpperCase(),
      entry: parseFloat(form.entry), sl: parseFloat(form.sl), tp: parseFloat(form.tp),
      setup: form.setup, session: form.session,
      rr: rr || "—", result: "open", exitPrice: null, pnl: "—", notes: form.notes,
    };
    setTrades(prev => [newTrade, ...prev]);
    setForm(initialForm);
    setShowForm(false);
    showToast("Trade opgeslagen ✓");
  }

  function handleClose() {
    if (!closeForm.result) { showToast("Kies een resultaat", "error"); return; }
    const rawPnl = parseFloat(closeForm.pnl);
    const formattedPnl = closeForm.pnl
      ? (rawPnl >= 0 ? `+€${Math.abs(rawPnl).toFixed(0)}` : `-€${Math.abs(rawPnl).toFixed(0)}`)
      : "—";
    setTrades(prev => prev.map(t =>
      t.id === editTrade.id
        ? { ...t, result: closeForm.result, exitPrice: closeForm.exitPrice ? parseFloat(closeForm.exitPrice) : null, pnl: formattedPnl }
        : t
    ));
    setEditTrade(null);
    setCloseForm({ result: "", exitPrice: "", pnl: "" });
    showToast("Trade bijgewerkt ✓");
  }

  function handleDelete(id) {
    if (!window.confirm("Trade verwijderen?")) return;
    setTrades(prev => prev.filter(t => t.id !== id));
    showToast("Trade verwijderd");
  }

  const setupBreakdown = SETUPS.map(s => ({
    name: s,
    count: trades.filter(t => t.setup === s).length,
    wins: trades.filter(t => t.setup === s && t.result === "win").length,
  })).filter(s => s.count > 0).sort((a, b) => b.count - a.count);

  const modalOverlay = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
    backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
    justifyContent: "center", zIndex: 200, padding: 24,
  };
  const modalBox = {
    background: "#111", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 20, padding: 32, width: "100%", maxWidth: 520,
    boxShadow: "0 40px 80px rgba(0,0,0,0.6)", maxHeight: "90vh", overflowY: "auto",
  };
  const labelStyle = {
    fontSize: 11, color: "#666", fontFamily: "'DM Mono', monospace",
    letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e0e0e0", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", paddingBottom: 80 }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 999,
          background: toast.type === "error" ? "rgba(248,113,113,0.15)" : "rgba(52,211,153,0.15)",
          border: `1px solid ${toast.type === "error" ? "rgba(248,113,113,0.4)" : "rgba(52,211,153,0.4)"}`,
          color: toast.type === "error" ? "#f87171" : "#34d399",
          borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, backdropFilter: "blur(10px)",
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "rgba(10,10,10,0.96)", backdropFilter: "blur(20px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #6ee7b7, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📈</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.02em" }}>TradeLog</div>
            <div style={{ fontSize: 11, color: "#555", fontFamily: "'DM Mono', monospace" }}>{trades.length} trades opgeslagen</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["dashboard", "Dashboard"], ["log", "Trades"]].map(([v, label]) => (
            <button key={v} onClick={() => setView(v)} style={{
              background: view === v ? "rgba(255,255,255,0.08)" : "transparent",
              border: "1px solid " + (view === v ? "rgba(255,255,255,0.15)" : "transparent"),
              color: view === v ? "#f0f0f0" : "#555",
              borderRadius: 8, padding: "6px 16px", cursor: "pointer", fontSize: 13, fontWeight: 500,
            }}>{label}</button>
          ))}
        </div>
        <button onClick={() => setShowForm(true)} style={{ background: "linear-gradient(135deg, #6ee7b7, #3b82f6)", border: "none", borderRadius: 10, padding: "8px 20px", color: "#0a0a0a", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          + Log Trade
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* DASHBOARD */}
        {view === "dashboard" && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 4 }}>Welkom terug 👋</div>
            <div style={{ color: "#555", fontSize: 14, marginBottom: 32 }}>
              {new Date().toLocaleDateString("nl-NL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 32 }}>
              <StatCard label="Totaal trades" value={trades.length} sub={`${trades.filter(t => t.result === "open").length} open`} />
              <StatCard label="Winrate" value={winrate !== null ? winrate + "%" : "—"} color={winrate >= 50 ? "#34d399" : winrate !== null ? "#f87171" : "#f0f0f0"} sub={`${wins}W / ${losses}L`} />
              <StatCard label="Gem. RR" value={avgRR ? "1:" + avgRR : "—"} color="#6ee7b7" />
              <StatCard label="Totaal P&L" value={totalPnl !== 0 ? (totalPnl > 0 ? `+€${totalPnl.toFixed(0)}` : `-€${Math.abs(totalPnl).toFixed(0)}`) : "€0"} color={totalPnl > 0 ? "#34d399" : totalPnl < 0 ? "#f87171" : "#f0f0f0"} />
            </div>

            {setupBreakdown.length > 0 && (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 24, marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#666", marginBottom: 16, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Setup verdeling</div>
                {setupBreakdown.map(s => {
                  const pct = Math.round((s.count / trades.length) * 100);
                  const wr = s.count > 0 ? Math.round((s.wins / s.count) * 100) : 0;
                  return (
                    <div key={s.name} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 13 }}>
                        <span style={{ color: "#aaa", fontFamily: "'DM Mono', monospace" }}>{s.name}</span>
                        <span style={{ color: "#555", fontSize: 12 }}>{s.count} trades · {wr}% WR</span>
                      </div>
                      <div style={{ height: 5, background: "rgba(255,255,255,0.05)", borderRadius: 4 }}>
                        <div style={{ height: 5, width: pct + "%", background: "linear-gradient(90deg,#6ee7b7,#3b82f6)", borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ fontSize: 11, fontWeight: 600, color: "#666", marginBottom: 12, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Recente trades</div>
            {trades.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#444", fontSize: 14 }}>
                Nog geen trades. Klik op <strong style={{ color: "#6ee7b7" }}>+ Log Trade</strong> om te beginnen.
              </div>
            ) : trades.slice(0, 5).map(t => (
              <div key={t.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 20px", marginBottom: 10, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <Badge text={t.side} />
                <span style={{ fontWeight: 700, fontSize: 14, fontFamily: "'DM Mono', monospace", minWidth: 70 }}>{t.ticker}</span>
                <span style={{ color: "#555", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>{t.date} {t.time}</span>
                {t.setup && <span style={{ color: "#666", fontSize: 12 }}>{t.setup}</span>}
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#aaa" }}>1:{t.rr}</span>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                  <Badge text={t.result} />
                  {t.result === "open" && (
                    <button onClick={() => { setEditTrade(t); setCloseForm({ result: "", exitPrice: "", pnl: "" }); }}
                      style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                      Sluiten
                    </button>
                  )}
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, color: t.pnl?.startsWith("+") ? "#34d399" : t.pnl?.startsWith("-") ? "#f87171" : "#666", minWidth: 60, textAlign: "right" }}>{t.pnl}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TRADES LOG */}
        {view === "log" && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 24 }}>Alle trades</div>
            {trades.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#444", fontSize: 14 }}>Nog geen trades gelogd.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      {["Datum", "Tijd", "Pair", "Side", "Entry", "Exit", "SL", "TP", "RR", "Setup", "Sessie", "Resultaat", "P&L", ""].map(h => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#555", fontWeight: 600, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((t, i) => (
                      <tr key={t.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                        <td style={{ padding: "12px 12px", fontFamily: "'DM Mono', monospace", color: "#666", whiteSpace: "nowrap" }}>{t.date}</td>
                        <td style={{ padding: "12px 12px", fontFamily: "'DM Mono', monospace", color: "#666" }}>{t.time}</td>
                        <td style={{ padding: "12px 12px", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{t.ticker}</td>
                        <td style={{ padding: "12px 12px" }}><Badge text={t.side} /></td>
                        <td style={{ padding: "12px 12px", fontFamily: "'DM Mono', monospace" }}>{t.entry}</td>
                        <td style={{ padding: "12px 12px", fontFamily: "'DM Mono', monospace", color: "#aaa" }}>{t.exitPrice ?? "—"}</td>
                        <td style={{ padding: "12px 12px", fontFamily: "'DM Mono', monospace", color: "#f87171" }}>{t.sl}</td>
                        <td style={{ padding: "12px 12px", fontFamily: "'DM Mono', monospace", color: "#34d399" }}>{t.tp}</td>
                        <td style={{ padding: "12px 12px", fontFamily: "'DM Mono', monospace", color: "#6ee7b7" }}>1:{t.rr}</td>
                        <td style={{ padding: "12px 12px", color: "#aaa" }}>{t.setup || "—"}</td>
                        <td style={{ padding: "12px 12px", color: "#666" }}>{t.session || "—"}</td>
                        <td style={{ padding: "12px 12px" }}><Badge text={t.result} /></td>
                        <td style={{ padding: "12px 12px", fontFamily: "'DM Mono', monospace", fontWeight: 700, color: t.pnl?.startsWith("+") ? "#34d399" : t.pnl?.startsWith("-") ? "#f87171" : "#666" }}>{t.pnl}</td>
                        <td style={{ padding: "12px 12px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            {t.result === "open" && (
                              <button onClick={() => { setEditTrade(t); setCloseForm({ result: "", exitPrice: "", pnl: "" }); }}
                                style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 11, whiteSpace: "nowrap" }}>
                                Sluiten
                              </button>
                            )}
                            <button onClick={() => handleDelete(t.id)}
                              style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)", color: "#f87171", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 11 }}>
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* LOG TRADE MODAL */}
      {showForm && (
        <div style={modalOverlay} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={modalBox}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, letterSpacing: "-0.02em" }}>Trade loggen</div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Richting *</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["long", "short"].map(s => (
                  <button key={s} onClick={() => setForm({ ...form, side: s })} style={{
                    flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 14,
                    border: form.side === s ? `1px solid ${s === "long" ? "#34d399" : "#f87171"}` : "1px solid rgba(255,255,255,0.08)",
                    background: form.side === s ? (s === "long" ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)") : "rgba(255,255,255,0.03)",
                    color: form.side === s ? (s === "long" ? "#34d399" : "#f87171") : "#555",
                    textTransform: "uppercase", letterSpacing: "0.08em", transition: "all 0.15s",
                  }}>{s}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <FieldInput label="Ticker *" value={form.ticker} onChange={v => setForm({ ...form, ticker: v })} placeholder="NQ, EURUSD, GC..." />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
              <FieldInput label="Entry *" value={form.entry} onChange={v => setForm({ ...form, entry: v })} placeholder="0.00" type="number" />
              <FieldInput label="Stop Loss *" value={form.sl} onChange={v => setForm({ ...form, sl: v })} placeholder="0.00" type="number" />
              <FieldInput label="Take Profit *" value={form.tp} onChange={v => setForm({ ...form, tp: v })} placeholder="0.00" type="number" />
            </div>

            {rr && (
              <div style={{ background: "rgba(110,231,183,0.08)", border: "1px solid rgba(110,231,183,0.2)", borderRadius: 10, padding: "10px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#6ee7b7", fontFamily: "'DM Mono', monospace" }}>R:R →</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#6ee7b7", fontFamily: "'DM Mono', monospace" }}>1:{rr}</span>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[["Setup", "setup", SETUPS], ["Sessie", "session", SESSIONS]].map(([label, key, opts]) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <select value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                    style={{ width: "100%", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 12px", color: form[key] ? "#f0f0f0" : "#555", fontSize: 13, outline: "none", boxSizing: "border-box" }}>
                    <option value="">Kies...</option>
                    {opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Notities</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="OB tap, confluences, gevoel..." rows={3}
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", color: "#f0f0f0", fontSize: 13, resize: "none", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px", color: "#555", cursor: "pointer", fontSize: 14 }}>Annuleren</button>
              <button onClick={handleSubmit} style={{ flex: 2, background: "linear-gradient(135deg, #6ee7b7, #3b82f6)", border: "none", borderRadius: 10, padding: "12px", color: "#0a0a0a", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Trade opslaan ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLOSE TRADE MODAL */}
      {editTrade && (
        <div style={modalOverlay} onClick={e => e.target === e.currentTarget && setEditTrade(null)}>
          <div style={{ ...modalBox, maxWidth: 400 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.02em" }}>Trade sluiten</div>
            <div style={{ fontSize: 13, color: "#555", marginBottom: 24, fontFamily: "'DM Mono', monospace" }}>
              {editTrade.side.toUpperCase()} {editTrade.ticker} @ {editTrade.entry}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Resultaat *</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["win","#34d399","rgba(52,211,153,0.12)"],["loss","#f87171","rgba(248,113,113,0.12)"],["be","#94a3b8","rgba(148,163,184,0.12)"]].map(([r,clr,bg]) => (
                  <button key={r} onClick={() => setCloseForm({ ...closeForm, result: r })} style={{
                    flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 13,
                    border: closeForm.result === r ? `1px solid ${clr}` : "1px solid rgba(255,255,255,0.08)",
                    background: closeForm.result === r ? bg : "rgba(255,255,255,0.03)",
                    color: closeForm.result === r ? clr : "#555",
                    textTransform: "uppercase", letterSpacing: "0.08em", transition: "all 0.15s",
                  }}>{r === "be" ? "B/E" : r}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              <FieldInput label="Exit prijs" value={closeForm.exitPrice} onChange={v => setCloseForm({ ...closeForm, exitPrice: v })} placeholder="0.00" type="number" />
              <FieldInput label="P&L (€)" value={closeForm.pnl} onChange={v => setCloseForm({ ...closeForm, pnl: v })} placeholder="150 of -80" type="number" />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setEditTrade(null)} style={{ flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px", color: "#555", cursor: "pointer", fontSize: 14 }}>Annuleren</button>
              <button onClick={handleClose} style={{ flex: 2, background: "linear-gradient(135deg, #6ee7b7, #3b82f6)", border: "none", borderRadius: 10, padding: "12px", color: "#0a0a0a", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Opslaan ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
