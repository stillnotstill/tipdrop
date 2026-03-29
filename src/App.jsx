import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase } from "./supabase.js";

const UPLOAD_PIN = "8686";

const VENUES = {
  br86: {
    name: "Break Room 86",
    short: "BR86",
    accent: "#ff1a1a",
    accentAlt: "#ff4466",
    accentGlow: "rgba(255,26,26,0.35)",
    accentGlowAlt: "rgba(255,68,102,0.2)",
    gradientFrom: "#1a0808",
    cardBg: "rgba(40,10,10,0.55)",
    cardBorder: "rgba(255,26,26,0.1)",
    cardHover: "rgba(55,15,15,0.65)",
    emoji: "🎤",
  },
  kkbb: {
    name: "KKBB",
    short: "KKBB",
    accent: "#f0c040",
    accentAlt: "#e8762a",
    accentGlow: "rgba(240,192,64,0.3)",
    accentGlowAlt: "rgba(232,118,42,0.2)",
    gradientFrom: "#181208",
    cardBg: "rgba(35,28,10,0.55)",
    cardBorder: "rgba(240,192,64,0.1)",
    cardHover: "rgba(50,38,14,0.65)",
    emoji: "🪩",
  },
};

function formatDate(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

function formatUploadTime(ts) {
  const d = new Date(ts);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
}

/* ── Break Room 86 Logo ───────────────────────────────── */
function BR86Logo() {
  return (
    <div style={{ position: "relative", height: 44, display: "flex", alignItems: "center" }}>
      <svg width="170" height="44" viewBox="0 0 170 44" style={{ position: "absolute", left: -4, top: 0 }}>
        <defs>
          <linearGradient id="laser1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff1a1a" stopOpacity="0" />
            <stop offset="20%" stopColor="#ff1a1a" stopOpacity="0.6" />
            <stop offset="80%" stopColor="#ff4466" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ff4466" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="laser2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff4466" stopOpacity="0" />
            <stop offset="30%" stopColor="#ff1a1a" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#ff1a1a" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ff1a1a" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1="38" x2="170" y2="28" stroke="url(#laser1)" strokeWidth="1.5" />
        <line x1="0" y1="41" x2="170" y2="34" stroke="url(#laser2)" strokeWidth="1" />
        <line x1="10" y1="44" x2="160" y2="38" stroke="url(#laser1)" strokeWidth="0.8" opacity="0.5" />
      </svg>
      <div style={{
        fontFamily: "'Caveat', cursive", fontSize: 30, fontWeight: 700, color: "#ff1a1a",
        position: "relative", zIndex: 1,
        textShadow: "0 0 20px rgba(255,26,26,0.8), 0 0 40px rgba(255,26,26,0.4), 0 0 80px rgba(255,26,26,0.2)",
        letterSpacing: 1, lineHeight: 1,
      }}>
        Break Room
        <span style={{
          fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700,
          marginLeft: 4, color: "#ff4466",
          textShadow: "0 0 15px rgba(255,68,102,0.7), 0 0 30px rgba(255,68,102,0.3)",
        }}>86</span>
      </div>
    </div>
  );
}

/* ── KKBB Logo ────────────────────────────────────────── */
function KKBBLogo() {
  return (
    <div style={{ position: "relative", height: 44, display: "flex", alignItems: "center" }}>
      <svg width="52" height="44" viewBox="0 0 52 44" style={{ position: "absolute", left: 56, top: 0, opacity: 0.25 }}>
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const x2 = 26 + Math.cos(angle) * 28;
          const y2 = 22 + Math.sin(angle) * 28;
          return <line key={i} x1="26" y1="22" x2={x2} y2={y2} stroke="#f0c040" strokeWidth="1" opacity={0.4 + (i % 3) * 0.2} />;
        })}
      </svg>
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <div style={{
          fontFamily: "'Bungee Shade', cursive", fontSize: 24, fontWeight: 400, color: "#f0c040", lineHeight: 1,
          textShadow: "0 0 20px rgba(240,192,64,0.6), 0 0 40px rgba(240,192,64,0.25)",
          letterSpacing: 3,
        }}>KKBB</div>
        <div style={{
          fontSize: 8, color: "#f0c040", opacity: 0.45,
          fontFamily: "'Space Mono', monospace", letterSpacing: 3, textTransform: "uppercase", marginTop: 2,
        }}>Kiss Kiss Bang Bang</div>
      </div>
    </div>
  );
}

/* ── Cassette Tape Background (BR86) ──────────────────── */
function CassetteBackground() {
  const tapes = useMemo(() => {
    const arr = [];
    for (let row = 0; row < 14; row++) {
      for (let col = 0; col < 6; col++) {
        arr.push({ x: col * 68 + (row % 2 ? 34 : 0), y: row * 42, hue: (row * 47 + col * 83) % 360 });
      }
    }
    return arr;
  }, []);
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden", opacity: 0.04 }}>
      <svg width="100%" height="100%" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
        {tapes.map((t, i) => (
          <g key={i} transform={`translate(${t.x}, ${t.y})`}>
            <rect x="2" y="2" width="60" height="36" rx="3" fill="none" stroke={`hsl(${t.hue}, 40%, 50%)`} strokeWidth="1" />
            <circle cx="20" cy="20" r="7" fill="none" stroke={`hsl(${t.hue}, 40%, 50%)`} strokeWidth="0.8" />
            <circle cx="42" cy="20" r="7" fill="none" stroke={`hsl(${t.hue}, 40%, 50%)`} strokeWidth="0.8" />
            <rect x="14" y="28" width="34" height="6" rx="1" fill="none" stroke={`hsl(${t.hue}, 40%, 50%)`} strokeWidth="0.5" />
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ── Disco Floor Background (KKBB) ───────────────────── */
function DiscoFloorBackground() {
  const tiles = useMemo(() => {
    const arr = [];
    const colors = ["#f0c040", "#e8762a", "#e05090", "#40c0e0", "#60e060", "#c060e0"];
    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 10; col++) {
        arr.push({ x: col * 44, y: row * 44, color: colors[(row * 3 + col * 7) % colors.length], opacity: 0.03 + ((row + col) % 4) * 0.015 });
      }
    }
    return arr;
  }, []);
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden", perspective: "600px" }}>
      <div style={{ position: "absolute", bottom: "-10%", left: "-5%", right: "-5%", height: "70%", transform: "rotateX(55deg)", transformOrigin: "center bottom" }}>
        <svg width="100%" height="100%" viewBox="0 0 440 700" preserveAspectRatio="xMidYMid slice">
          {tiles.map((t, i) => (
            <rect key={i} x={t.x} y={t.y} width="42" height="42" rx="1" fill={t.color} opacity={t.opacity} stroke={t.color} strokeWidth="0.5" strokeOpacity={t.opacity * 0.8} />
          ))}
        </svg>
      </div>
    </div>
  );
}

function VenueBackground({ venue }) {
  const v = VENUES[venue];
  return (
    <>
      {venue === "br86" ? <CassetteBackground /> : <DiscoFloorBackground />}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: 0, left: "-20%", right: "-20%", height: "35%", background: `radial-gradient(ellipse at 50% 100%, ${v.accentGlow}, transparent 70%)`, opacity: 0.2 }} />
        <div style={{ position: "absolute", top: -80, right: -80, width: 350, height: 350, background: `radial-gradient(circle, ${v.accentGlowAlt}, transparent 70%)`, opacity: 0.1 }} />
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)", opacity: 0.6 }} />
      </div>
    </>
  );
}

/* ── Venue Switcher ────────────────────────────────────── */
function VenueSwitcher({ venue, setVenue }) {
  return (
    <div style={{ display: "flex", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.4)" }}>
      {Object.entries(VENUES).map(([key, vn]) => (
        <button key={key} onClick={() => setVenue(key)} style={{
          flex: 1, padding: "12px 6px", border: "none", cursor: "pointer",
          background: venue === key ? `linear-gradient(135deg, ${vn.accent}15, ${vn.accentAlt}10)` : "transparent",
          color: venue === key ? vn.accent : "#5a5a6a",
          fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700,
          letterSpacing: 0.5, transition: "all 0.3s ease",
          borderBottom: venue === key ? `2px solid ${vn.accent}` : "2px solid transparent",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        }}>
          <span style={{ fontSize: 18 }}>{vn.emoji}</span>
          <span>{vn.short}</span>
        </button>
      ))}
    </div>
  );
}

/* ── Placeholder Thumbnail ─────────────────────────────── */
function PlaceholderThumb({ venue, large }) {
  const v = VENUES[venue];
  const rows = large ? 14 : 5;
  return (
    <div style={{
      width: "100%", height: large ? 400 : "100%",
      background: `linear-gradient(135deg, ${v.gradientFrom}, ${v.cardHover})`,
      borderRadius: large ? 12 : 8,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden", minHeight: large ? 400 : 64,
    }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.12, display: "flex", flexDirection: "column", gap: large ? 8 : 4, padding: large ? 20 : 8 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ height: large ? 14 : 6, background: v.accent, borderRadius: 2, width: `${45 + Math.sin(i * 1.7) * 35}%`, opacity: 0.6 }} />
        ))}
      </div>
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <div style={{ fontSize: large ? 36 : 18 }}>📊</div>
        {large && <div style={{ color: `${v.accent}88`, fontSize: 11, marginTop: 6, fontFamily: "'Space Mono', monospace", letterSpacing: 1.5, textTransform: "uppercase" }}>Tip Sheet</div>}
      </div>
    </div>
  );
}

/* ── PIN Screen ────────────────────────────────────────── */
function PinScreen({ venue, onVerified, onBack }) {
  const v = VENUES[venue];
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  function submit() {
    if (pin === UPLOAD_PIN) onVerified();
    else { setError(true); setPin(""); }
  }
  return (
    <div style={{ padding: 24, maxWidth: 400, margin: "0 auto", textAlign: "center", paddingTop: 48, position: "relative" }}>
      <button onClick={onBack} style={{ position: "absolute", top: 0, left: 0, background: "none", border: "none", color: "#6a6a7a", fontSize: 14, cursor: "pointer", fontFamily: "'Space Mono', monospace" }}>← back</button>
      <div style={{ width: 72, height: 72, borderRadius: "50%", margin: "0 auto 20px", background: `linear-gradient(135deg, ${v.accent}15, ${v.accentAlt}10)`, border: `2px solid ${v.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🔒</div>
      <h2 style={{ color: "#e0e0e8", fontSize: 20, fontFamily: "'Space Mono', monospace", fontWeight: 700, marginBottom: 6 }}>Staff PIN</h2>
      <p style={{ color: "#5a5a6a", fontSize: 13, fontFamily: "'Space Mono', monospace", marginBottom: 32 }}>Enter PIN to upload</p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            width: 48, height: 56, borderRadius: 12,
            border: `2px solid ${error ? "#ff4444" : pin.length > i ? v.accent : "rgba(255,255,255,0.08)"}`,
            background: pin.length > i ? `${v.accent}08` : "rgba(255,255,255,0.02)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, color: v.accent, fontFamily: "'Space Mono', monospace",
            transition: "all 0.2s ease", boxShadow: pin.length > i ? `0 0 16px ${v.accent}20` : "none",
          }}>{pin[i] ? "●" : ""}</div>
        ))}
      </div>
      <input ref={inputRef} type="tel" inputMode="numeric" maxLength={4} value={pin}
        onChange={e => { setPin(e.target.value.replace(/\D/g, "")); setError(false); }}
        onKeyDown={e => e.key === "Enter" && submit()}
        style={{
          width: 180, padding: "14px 16px", borderRadius: 12, border: `2px solid ${error ? "#ff4444" : "rgba(255,255,255,0.06)"}`,
          background: "rgba(255,255,255,0.02)", color: "#e0e0e8", fontSize: 22, textAlign: "center", letterSpacing: 14,
          fontFamily: "'Space Mono', monospace", outline: "none", marginBottom: 20,
        }}
      />
      {error && <p style={{ color: "#ff4444", fontSize: 13, fontFamily: "'Space Mono', monospace", marginBottom: 16 }}>Wrong PIN</p>}
      <br />
      <button onClick={submit} disabled={pin.length < 4} style={{
        padding: "14px 48px", borderRadius: 12, border: "none",
        background: pin.length === 4 ? v.accent : "rgba(255,255,255,0.05)",
        color: pin.length === 4 ? "#0a0a10" : "#4a4a5a",
        fontSize: 16, fontWeight: 700, cursor: pin.length === 4 ? "pointer" : "default",
        fontFamily: "'Space Mono', monospace", transition: "all 0.25s ease",
        boxShadow: pin.length === 4 ? `0 4px 24px ${v.accentGlow}` : "none",
      }}>Unlock</button>
    </div>
  );
}

/* ── Upload Form ───────────────────────────────────────── */
function UploadForm({ venue, onUpload, onBack }) {
  const v = VENUES[venue];
  const [label, setLabel] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  function convertToJpeg(file) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.85);
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);

    try {
      // Convert to JPEG to handle HEIF/HEIC and ensure browser compatibility
      const uploadBlob = await convertToJpeg(selectedFile);
      const fileName = `${venue}/${Date.now()}.jpg`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("tipsheets")
        .upload(fileName, uploadBlob, { contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("tipsheets")
        .getPublicUrl(fileName);

      // Insert record into database
      const { data: record, error: dbError } = await supabase
        .from("sheets")
        .insert({
          venue,
          date,
          label: label || "Tip Sheet",
          image_url: urlData.publicUrl,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setSuccess(true);
      onUpload(record);
      setTimeout(() => onBack(), 1400);
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Upload failed. Try again.");
      setUploading(false);
    }
  }

  if (success) return (
    <div style={{ padding: 24, maxWidth: 400, margin: "0 auto", textAlign: "center", paddingTop: 80 }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", margin: "0 auto 24px", background: `${v.accent}15`, border: `2px solid ${v.accent}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, color: v.accent }}>✓</div>
      <h2 style={{ color: v.accent, fontSize: 22, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>Uploaded</h2>
      <p style={{ color: "#5a5a6a", fontSize: 13, fontFamily: "'Space Mono', monospace" }}>Everyone can see it now</p>
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 400, margin: "0 auto" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#6a6a7a", fontSize: 14, cursor: "pointer", padding: "8px 0", marginBottom: 24, fontFamily: "'Space Mono', monospace" }}>← back</button>
      <h2 style={{ color: "#e0e0e8", fontSize: 20, fontFamily: "'Space Mono', monospace", fontWeight: 700, marginBottom: 6 }}>Upload tip sheet</h2>
      <p style={{ color: v.accent, fontSize: 13, fontFamily: "'Space Mono', monospace", marginBottom: 28, opacity: 0.7 }}>{VENUES[venue].name}</p>

      <div onClick={() => fileRef.current?.click()} style={{
        width: "100%", height: previewUrl ? "auto" : 180, borderRadius: 16,
        border: `2px dashed ${previewUrl ? v.accent : "rgba(255,255,255,0.08)"}`,
        background: previewUrl ? "transparent" : "rgba(255,255,255,0.02)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        cursor: "pointer", marginBottom: 24, overflow: "hidden", transition: "all 0.2s ease",
        boxShadow: previewUrl ? `0 0 32px ${v.accentGlow}` : "none",
      }}>
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" style={{ width: "100%", borderRadius: 14, display: "block" }} />
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📸</div>
            <p style={{ color: "#5a5a6a", fontSize: 14, fontFamily: "'Space Mono', monospace", margin: 0 }}>Tap to snap or choose photo</p>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: "none" }} />

      <label style={{ display: "block", color: "#5a5a6a", fontSize: 11, fontFamily: "'Space Mono', monospace", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Date</label>
      <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{
        width: "100%", padding: "13px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)", color: "#e0e0e8", fontSize: 15, fontFamily: "'Space Mono', monospace",
        outline: "none", marginBottom: 18, boxSizing: "border-box",
      }} />

      <label style={{ display: "block", color: "#5a5a6a", fontSize: 11, fontFamily: "'Space Mono', monospace", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Label (optional)</label>
      <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder='"Friday Main Floor"' style={{
        width: "100%", padding: "13px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)", color: "#e0e0e8", fontSize: 15, fontFamily: "'Space Mono', monospace",
        outline: "none", marginBottom: 24, boxSizing: "border-box",
      }} />

      {error && <p style={{ color: "#ff4444", fontSize: 13, fontFamily: "'Space Mono', monospace", marginBottom: 16, textAlign: "center" }}>{error}</p>}

      <button onClick={handleUpload} disabled={!selectedFile || uploading} style={{
        width: "100%", padding: "16px", borderRadius: 14, border: "none",
        background: selectedFile && !uploading ? v.accent : "rgba(255,255,255,0.05)",
        color: selectedFile && !uploading ? "#0a0a10" : "#4a4a5a",
        fontSize: 16, fontWeight: 700, cursor: selectedFile && !uploading ? "pointer" : "default",
        fontFamily: "'Space Mono', monospace", transition: "all 0.25s ease",
        boxShadow: selectedFile && !uploading ? `0 4px 24px ${v.accentGlow}` : "none",
      }}>{uploading ? "Uploading..." : "Upload"}</button>
    </div>
  );
}

function UploadView({ venue, onUpload, onBack }) {
  const [verified, setVerified] = useState(false);
  if (!verified) return <PinScreen venue={venue} onVerified={() => setVerified(true)} onBack={onBack} />;
  return <UploadForm venue={venue} onUpload={onUpload} onBack={onBack} />;
}

/* ── Detail View ───────────────────────────────────────── */
function DetailView({ sheet, venue, onBack }) {
  return (
    <div style={{ padding: 24, maxWidth: 500, margin: "0 auto" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#6a6a7a", fontSize: 14, cursor: "pointer", padding: "8px 0", marginBottom: 24, fontFamily: "'Space Mono', monospace" }}>← back</button>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ color: "#e0e0e8", fontSize: 20, fontFamily: "'Space Mono', monospace", fontWeight: 700, marginBottom: 6 }}>{sheet.label}</h2>
        <p style={{ color: "#5a5a6a", fontSize: 13, fontFamily: "'Space Mono', monospace", margin: 0 }}>
          {formatDate(sheet.date)} · {formatUploadTime(sheet.created_at)}
        </p>
      </div>
      {sheet.image_url ? (
        <img src={sheet.image_url} alt={sheet.label} style={{ width: "100%", borderRadius: 12, display: "block" }} />
      ) : (
        <PlaceholderThumb venue={venue} large />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN APP
   ══════════════════════════════════════════════════════════ */
export default function App() {
  const [venue, setVenue] = useState("br86");
  const [view, setView] = useState("list");
  const [sheets, setSheets] = useState({ br86: [], kkbb: [] });
  const [search, setSearch] = useState("");
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const v = VENUES[venue];

  // Fetch sheets from Supabase on mount and venue change
  const fetchSheets = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sheets")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error && data) {
      const grouped = { br86: [], kkbb: [] };
      data.forEach(s => {
        if (grouped[s.venue]) grouped[s.venue].push(s);
      });
      setSheets(grouped);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSheets(); }, [fetchSheets]);

  const currentSheets = sheets[venue] || [];

  const grouped = useMemo(() => {
    const filtered = currentSheets.filter(s => {
      if (!search) return true;
      const q = search.toLowerCase();
      return s.label.toLowerCase().includes(q) || s.date.includes(q) || formatDate(s.date).toLowerCase().includes(q);
    });
    const groups = {};
    filtered.forEach(s => { if (!groups[s.date]) groups[s.date] = []; groups[s.date].push(s); });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [currentSheets, search]);

  function handleUpload(record) {
    setSheets(prev => ({ ...prev, [record.venue]: [record, ...(prev[record.venue] || [])] }));
  }

  const containerStyle = {
    background: `linear-gradient(180deg, ${v.gradientFrom} 0%, #08080c 35%, #08080c 100%)`,
    minHeight: "100vh", color: "#e0e0e8", fontFamily: "'Space Mono', monospace",
    position: "relative", transition: "background 0.5s ease",
  };

  if (view === "upload") return (
    <div style={containerStyle}><VenueBackground venue={venue} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <UploadView venue={venue} onUpload={handleUpload} onBack={() => setView("list")} />
      </div>
    </div>
  );

  if (view === "detail" && selectedSheet) return (
    <div style={containerStyle}><VenueBackground venue={venue} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <DetailView sheet={selectedSheet} venue={venue} onBack={() => setView("list")} />
      </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <VenueBackground venue={venue} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ padding: "20px 20px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              {venue === "br86" ? <BR86Logo /> : <KKBBLogo />}
              <p style={{ color: "#4a4a5a", fontSize: 10, fontFamily: "'Space Mono', monospace", margin: "8px 0 0", letterSpacing: 1.5, textTransform: "uppercase" }}>
                Tip Sheets · {currentSheets.length} total
              </p>
            </div>
            <button onClick={() => setView("upload")} style={{
              padding: "11px 18px", borderRadius: 12, border: "none", background: v.accent,
              color: "#0a0a0a", fontSize: 14, fontWeight: 700, cursor: "pointer",
              fontFamily: "'Space Mono', monospace", display: "flex", alignItems: "center", gap: 5,
              boxShadow: `0 4px 20px ${v.accentGlow}`, transition: "all 0.2s ease",
            }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Upload
            </button>
          </div>

          <div style={{ marginBottom: 16 }}>
            <VenueSwitcher venue={venue} setVenue={v => { setVenue(v); setSearch(""); }} />
          </div>

          <div style={{ position: "relative", marginBottom: 8 }}>
            <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#4a4a5a", fontSize: 14, pointerEvents: "none" }}>🔍</div>
            <input type="text" placeholder="Search date or label..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", padding: "13px 14px 13px 40px", borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)",
                color: "#e0e0e8", fontSize: 14, fontFamily: "'Space Mono', monospace",
                outline: "none", boxSizing: "border-box", transition: "border-color 0.2s ease",
              }}
              onFocus={e => e.target.style.borderColor = `${v.accent}30`}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.06)"}
            />
          </div>
        </div>

        <div style={{ padding: "4px 20px 100px" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#4a4a5a", fontFamily: "'Space Mono', monospace", fontSize: 14 }}>
              Loading...
            </div>
          )}

          {!loading && grouped.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#3a3a4a", fontFamily: "'Space Mono', monospace", fontSize: 14 }}>
              {search ? "No sheets match that search" : "No tip sheets yet. Upload the first one!"}
            </div>
          )}

          {!loading && grouped.map(([date, dateSheets]) => (
            <div key={date} style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "4px 0" }}>
                <h3 style={{ color: "#7a7a8a", fontSize: 13, fontFamily: "'Space Mono', monospace", fontWeight: 700, margin: 0, whiteSpace: "nowrap" }}>
                  {formatDate(date)}
                </h3>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.04)" }} />
                {dateSheets.length > 1 && (
                  <span style={{
                    color: v.accent, fontSize: 10, fontFamily: "'Space Mono', monospace",
                    background: `${v.accent}10`, padding: "3px 8px", borderRadius: 6,
                    border: `1px solid ${v.accent}18`, whiteSpace: "nowrap",
                  }}>{dateSheets.length} sheets</span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {dateSheets.map(sheet => (
                  <div key={sheet.id}
                    onClick={() => { setSelectedSheet(sheet); setView("detail"); }}
                    style={{
                      background: v.cardBg, borderRadius: 14, padding: 12,
                      cursor: "pointer", display: "flex", gap: 12, alignItems: "center",
                      border: `1px solid ${v.cardBorder}`, transition: "all 0.2s ease",
                      backdropFilter: "blur(8px)",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = v.cardHover; e.currentTarget.style.borderColor = `${v.accent}25`; e.currentTarget.style.boxShadow = `0 2px 16px ${v.accentGlow}`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = v.cardBg; e.currentTarget.style.borderColor = v.cardBorder; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <div style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                      {sheet.image_url ? (
                        <img src={sheet.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <PlaceholderThumb venue={venue} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ color: "#e0e0e8", fontSize: 15, fontFamily: "'Space Mono', monospace", fontWeight: 600, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sheet.label}</h4>
                      <p style={{ color: "#4a4a5a", fontSize: 11, fontFamily: "'Space Mono', monospace", margin: 0 }}>{formatUploadTime(sheet.created_at)}</p>
                    </div>
                    <div style={{ color: `${v.accent}50`, fontSize: 20, flexShrink: 0 }}>›</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
