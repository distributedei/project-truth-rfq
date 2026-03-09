const { useState, useEffect, useCallback, useRef, useMemo } = React;

// ═══════════════════════════════════════════════════════
// SEED DATA — Endicott NY Solar Farm (from intake workbook)
// ═══════════════════════════════════════════════════════
const SEED_PROJECT = {
  id: "PRJ-2026-001",
  name: "Endicott NY Solar Farm",
  client: "True Green Capital",
  address: "525 Boswell Hill Road, Endicott, NY 13760",
  utility: "NYSEG",
  icFile: "#17408",
  poi: "34.5 kV Feeder #8109806",
  rfpReceived: "2025-07-08",
  bidDue: "2025-07-23",
  mobDate: "2025-09-01",
  status: "Draft",
  revision: 1,
  acMW: "5.0 MWac",
  dcMW: "6.739 MWdc (estimate basis)",
  dcAcRatio: "1.35 (estimate basis)",
  systemType: "Fixed Tilt (reverted from SAT)",
  modules: "11,520 x 585W (estimate basis)",
  moduleType: "Qcells 585W",
  inverters: "16x 312kW (estimate basis)",
  racking: "Fixed tilt (2026 estimate basis)",
  transformers: "2x 2,650 kVA",
  fence: "~4,471 ft",
  ugMvCable: "~786 ft",
  combiners: "20 (estimate basis)",
  grossParcel: "31.68 acres",
  buildableArea: "~20 ac",
  gcr: "48%",
  icVoltage: "34.5 kV",
  isaCapacity: "5,000 kW nonresidential PV",
  icCost: "$321,720 planning-grade",
  wetlands: "3 areas, ~10.63 ac total",
  floodZone: "Zone C, minimal",
  geotech: "Desktop DDR only — no field borings",
  designBases: [
    { label: "2023 90% (Fixed)", dc: "7.011 MWdc", ac: "5.0 MWac", ratio: "1.40", modules: "12,300 x 570W", racking: "Fixed tilt 25°", inverters: "40x CPS 125kW" },
    { label: "2024 Layout (SAT)", dc: "5.026 MWp", ac: "5.0 MW", ratio: "1.005", modules: "8,448 x 595W", racking: "Solargik SAT", inverters: "16x Sungrow 312kW" },
    { label: "2026 Estimate", dc: "6.739 MWdc", ac: "4.992 MWac", ratio: "1.35", modules: "11,520 x 585W", racking: "Fixed tilt", inverters: "16x 312kW" }
  ],
  risks: [
    "Design basis not frozen: Three different module counts, DC sizes, and racking types across documents.",
    "No field geotech: Desktop report only. Pile embedment, refusal depth, and foundation design unresolvable.",
    "No IFC drawings: 90% electrical set is 2023 vintage. 2024 SAT layout is a single sheet.",
    "IC equipment mismatch: CESIR assumed centralized inverters; current design shows string inverters.",
    "Construction permits outstanding: Building, electrical, highway access permits not evidenced.",
    "Owner-furnished equipment scope unclear: Pricing template suggests owner supply but not confirmed.",
    "Schedule: Estimate references Q2 2026 start. No NTP, mob date, or COD milestone found."
  ],
  permitting: [
    { permit: "SEQRA Negative Declaration", status: "Complete", date: "4/12/2022" },
    { permit: "ZBA Setback Variances", status: "Complete", date: "5/16/2022" },
    { permit: "Special Use Permit", status: "Complete", date: "5/17/2022" },
    { permit: "Site Plan (original)", status: "Complete", date: "5/17/2022" },
    { permit: "SAT Revised Site Plan Accepted", status: "Complete", date: "9/10/2024" },
    { permit: "SHPO No-Effect", status: "Complete", date: "10/20/2021" },
    { permit: "USACE Preliminary JD", status: "Complete (non-binding)", date: "3/28/2022" },
    { permit: "FAA No-Impact", status: "Complete", date: "5/5/2022" },
    { permit: "Decommissioning / PILOT / Host Comm.", status: "Approved by resolution", date: "11/6/2024" },
    { permit: "Decommissioning Bond ($175K)", status: "Required before bldg permit", date: "N/A" },
    { permit: "Final SWPPP", status: "NOT FOUND", date: "Required pre-permit" },
    { permit: "Building Permit", status: "NOT FOUND", date: "—" }
  ],
  diligence: [],
  documents: [],
  quantities: []
};

const SEED_DILIGENCE = [
  { field: "DC size (Wdc)", answer: "Conflict: 7,011,000 W (2023); 5,026,000 Wp (2024); 6,739,200 W (2026)", status: "Needs Review" },
  { field: "AC Size (Wac)", answer: "5,000,000 W nominal; estimate basis 4,992,000 W", status: "Partial" },
  { field: "DC/AC Ratio", answer: "Conflict: 1.40 (2023) vs 1.005 (2024)", status: "Needs Review" },
  { field: "System Type", answer: "Original fixed tilt; revised to SAT; 2026 reverts to fixed", status: "Answered" },
  { field: "Module Type/s", answer: "Conflict: Qcells 570W / 595W / 585W", status: "Needs Review" },
  { field: "Total Modules", answer: "Conflict: 12,300 / 8,448 / 11,520", status: "Needs Review" },
  { field: "Racking", answer: "Conflict: fixed tilt vs Solargik SAT", status: "Needs Review" },
  { field: "Inverter", answer: "Conflict: 40x CPS125KTL vs 16x SG350HX", status: "Needs Review" },
  { field: "Interconnection Utility", answer: "NYSEG", status: "Answered" },
  { field: "Interconnection Voltage", answer: "34.5 kV", status: "Answered" },
  { field: "ISA Available?", answer: "Yes", status: "Answered" },
  { field: "CESIR Available?", answer: "Yes", status: "Answered" },
  { field: "Geotech", answer: "Desktop DDR only; no field borings", status: "Partial" },
  { field: "GCR", answer: "48% current SAT layout", status: "Answered" },
  { field: "Wetlands", answer: "3 areas, ~10.63 ac", status: "Answered" },
  { field: "Building Permit", answer: "Not found", status: "Not Found" },
  { field: "Electrical Permit", answer: "Not found", status: "Not Found" },
  { field: "SWPPP", answer: "Required; final not found", status: "Partial" },
  { field: "Owner Equipment", answer: "Suggested but not confirmed", status: "Partial" },
  { field: "Warranty Requirements", answer: "Not found", status: "Not Found" },
  { field: "Schedule", answer: "Q2 2026 start; no NTP/COD milestone", status: "Partial" },
  { field: "Bond Required?", answer: "Decommissioning bond $175K before permit", status: "Answered" },
  { field: "Sales Tax Exempt?", answer: "Yes per bid materials", status: "Partial" },
  { field: "IRA Required?", answer: "Referenced; binding requirement unconfirmed", status: "Partial" }
];

const SEED_RFIS = [
  { id: "RFI-001", trade: "General", subject: "Design Basis Confirmation", question: "Which design basis (2023 fixed, 2024 SAT, 2026 estimate) is the current construction basis? Module count, racking type, and inverter config conflict across documents.", raisedBy: "DEI Pre-Sales", assignedTo: "True Green Capital", dateRaised: "2026-03-09", dueDate: "2026-03-16", status: "Open", impact: "Scope", response: "" },
  { id: "RFI-002", trade: "Civil", subject: "Field Geotech / Pile Testing", question: "Only a desktop DDR is present. Are field borings or pull/push testing planned before bid? Pile embedment cannot be confirmed without field data.", raisedBy: "DEI Pre-Sales", assignedTo: "True Green Capital", dueDate: "2026-03-16", dateRaised: "2026-03-09", status: "Open", impact: "Technical", response: "" },
  { id: "RFI-003", trade: "Electrical", subject: "IC Equipment Reconciliation", question: "CESIR assumed 2x centralized inverters. Current design shows 16 string inverters. Has NYSEG been notified of the configuration change?", raisedBy: "DEI Pre-Sales", assignedTo: "True Green Capital", dueDate: "2026-03-16", dateRaised: "2026-03-09", status: "Open", impact: "Commercial", response: "" },
  { id: "RFI-004", trade: "General", subject: "Owner-Furnished Equipment Scope", question: "Pricing template suggests owner supply for modules, racking, inverters, and transformers. Please confirm which equipment is owner-furnished vs. EPC-procured.", raisedBy: "DEI Pre-Sales", assignedTo: "True Green Capital", dueDate: "2026-03-16", dateRaised: "2026-03-09", status: "Open", impact: "Commercial", response: "" },
  { id: "RFI-005", trade: "General", subject: "Construction Permits Status", question: "Building permit, electrical permit, and highway access permit are not evidenced in the package. What is the expected timeline for permit issuance?", raisedBy: "DEI Pre-Sales", assignedTo: "True Green Capital", dueDate: "2026-03-16", dateRaised: "2026-03-09", status: "Open", impact: "Schedule", response: "" }
];

const SEED_RESPONDENTS = [
  { id: "R-001", company: "", trade: "Civil", contact: "", email: "", phone: "", invitedDate: "", confirmed: false, intentToBid: "", proposalDue: "2025-07-23", proposalReceived: "", amount: "", exclusions: "", notes: "", status: "Not Invited", rank: "" },
  { id: "R-002", company: "", trade: "Electrical", contact: "", email: "", phone: "", invitedDate: "", confirmed: false, intentToBid: "", proposalDue: "2025-07-23", proposalReceived: "", amount: "", exclusions: "", notes: "", status: "Not Invited", rank: "" },
  { id: "R-003", company: "", trade: "Mechanical / Racking", contact: "", email: "", phone: "", invitedDate: "", confirmed: false, intentToBid: "", proposalDue: "2025-07-23", proposalReceived: "", amount: "", exclusions: "", notes: "", status: "Not Invited", rank: "" },
  { id: "R-004", company: "", trade: "Equipment Vendor", contact: "", email: "", phone: "", invitedDate: "", confirmed: false, intentToBid: "", proposalDue: "2025-07-23", proposalReceived: "", amount: "", exclusions: "", notes: "", status: "Not Invited", rank: "" }
];

// ═══════════════════════════════════════════════════════
// STYLE CONSTANTS
// ═══════════════════════════════════════════════════════
const COLORS = {
  bg: "#0B0F14",
  surface: "#131920",
  surfaceAlt: "#1A2230",
  border: "#243044",
  borderLight: "#2D3D55",
  accent: "#E8A838",
  accentDim: "rgba(232,168,56,0.15)",
  accentHover: "#F0BC5E",
  danger: "#E05555",
  dangerDim: "rgba(224,85,85,0.12)",
  success: "#34C47C",
  successDim: "rgba(52,196,124,0.12)",
  warning: "#E8A838",
  warningDim: "rgba(232,168,56,0.12)",
  info: "#4A9EFF",
  infoDim: "rgba(74,158,255,0.12)",
  text: "#E8ECF1",
  textMuted: "#8B9BB4",
  textDim: "#5A6B82",
  partial: "#E8A838",
  needsReview: "#E05555",
  answered: "#34C47C",
  notFound: "#5A6B82"
};

const statusColor = (s) => {
  if (!s) return COLORS.textDim;
  const l = s.toLowerCase();
  if (l.includes("answer") || l.includes("complete")) return COLORS.success;
  if (l.includes("partial") || l.includes("approved")) return COLORS.warning;
  if (l.includes("needs") || l.includes("not found") || l.includes("open")) return COLORS.danger;
  if (l === "closed") return COLORS.info;
  return COLORS.textMuted;
};

const statusBg = (s) => {
  if (!s) return "transparent";
  const l = s.toLowerCase();
  if (l.includes("answer") || l.includes("complete")) return COLORS.successDim;
  if (l.includes("partial") || l.includes("approved")) return COLORS.warningDim;
  if (l.includes("needs") || l.includes("not found") || l.includes("open")) return COLORS.dangerDim;
  if (l === "closed") return COLORS.infoDim;
  return "transparent";
};

// ═══════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════
function RFQBuilder() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [project, setProject] = useState(SEED_PROJECT);
  const [diligence, setDiligence] = useState(SEED_DILIGENCE);
  const [rfis, setRfis] = useState(SEED_RFIS);
  const [respondents, setRespondents] = useState(SEED_RESPONDENTS);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tradeFilter, setTradeFilter] = useState("All");
  const [rfiStatusFilter, setRfiStatusFilter] = useState("All");
  const [rfqTrade, setRfqTrade] = useState("Civil");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState(null);
  const [editingRfi, setEditingRfi] = useState(null);
  const [editingResp, setEditingResp] = useState(null);
  const [pdfSection, setPdfSection] = useState("summary");
  const [draftMode, setDraftMode] = useState(true);
  const fileRef = useRef(null);

  const completeness = useMemo(() => {
    const total = diligence.length;
    const answered = diligence.filter(d => d.status === "Answered").length;
    const partial = diligence.filter(d => d.status === "Partial").length;
    const notFound = diligence.filter(d => d.status === "Not Found").length;
    const needsReview = diligence.filter(d => d.status === "Needs Review").length;
    const score = total > 0 ? Math.round(((answered + partial * 0.5) / total) * 100) : 0;
    return { total, answered, partial, notFound, needsReview, score };
  }, [diligence]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const sheets = {};
      wb.SheetNames.forEach(name => {
        sheets[name] = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: "" });
      });
      setImportData({ fileName: file.name, sheets, sheetNames: wb.SheetNames });
      setShowImportModal(true);
    } catch (err) {
      alert("Error parsing file: " + err.message);
    }
  };

  const TABS = [
    { id: "dashboard", label: "Dashboard", icon: "◫" },
    { id: "diligence", label: "Diligence", icon: "◈" },
    { id: "rfq", label: "RFQ Builder", icon: "◰" },
    { id: "rfi", label: "RFI Log", icon: "◱" },
    { id: "respondents", label: "Respondents", icon: "◲" },
    { id: "pdf", label: "PDF Preview", icon: "◳" },
  ];

  const TRADES = ["Civil", "Electrical", "Mechanical / Racking", "Equipment Vendor", "Specialty", "Custom"];

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: COLORS.bg, color: COLORS.text, overflow: "hidden" }}>
      {/* Fonts loaded in index.html */}

      {/* SIDEBAR */}
      <aside style={{
        width: sidebarCollapsed ? 56 : 220,
        background: COLORS.surface,
        borderRight: `1px solid ${COLORS.border}`,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease",
        flexShrink: 0,
        overflow: "hidden"
      }}>
        {/* Brand */}
        <div style={{ padding: sidebarCollapsed ? "16px 12px" : "20px 20px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
          <div style={{ width: 32, height: 32, background: `linear-gradient(135deg, ${COLORS.accent}, #D4892A)`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: COLORS.bg, flexShrink: 0 }}>RQ</div>
          {!sidebarCollapsed && <div style={{ overflow: "hidden" }}>
            <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>RFQ BUILDER</div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Project Truth Module</div>
          </div>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: sidebarCollapsed ? "10px 12px" : "10px 12px",
              background: activeTab === tab.id ? COLORS.accentDim : "transparent",
              border: "none", borderRadius: 6, color: activeTab === tab.id ? COLORS.accent : COLORS.textMuted,
              cursor: "pointer", fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
              fontFamily: "inherit", textAlign: "left", whiteSpace: "nowrap", transition: "all 0.15s"
            }}>
              <span style={{ fontSize: 16, width: 20, textAlign: "center", flexShrink: 0 }}>{tab.icon}</span>
              {!sidebarCollapsed && tab.label}
            </button>
          ))}
        </nav>

        {/* Import */}
        <div style={{ padding: sidebarCollapsed ? "12px 8px" : "12px 16px", borderTop: `1px solid ${COLORS.border}` }}>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileUpload} style={{ display: "none" }} />
          <button onClick={() => fileRef.current?.click()} style={{
            width: "100%", padding: sidebarCollapsed ? "8px" : "8px 12px",
            background: COLORS.accent, color: COLORS.bg, border: "none", borderRadius: 6,
            fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit"
          }}>
            {sidebarCollapsed ? "↑" : "Import .xlsx"}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, overflow: "auto", padding: 0 }}>
        {/* TOP BAR */}
        <header style={{
          padding: "12px 28px", borderBottom: `1px solid ${COLORS.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: COLORS.surface, position: "sticky", top: 0, zIndex: 50
        }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>{project.name}</h1>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
              {project.client} &nbsp;·&nbsp; {project.acMW} AC &nbsp;·&nbsp; Bid Due: {project.bidDue}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{
              padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: draftMode ? COLORS.warningDim : COLORS.successDim,
              color: draftMode ? COLORS.warning : COLORS.success,
              cursor: "pointer", letterSpacing: "0.04em"
            }} onClick={() => setDraftMode(!draftMode)}>
              {draftMode ? "DRAFT" : "FINAL"}
            </div>
            <div style={{ fontSize: 11, color: COLORS.textDim }}>Rev {project.revision}</div>
          </div>
        </header>

        <div style={{ padding: "24px 28px" }}>
          {activeTab === "dashboard" && <DashboardTab project={project} diligence={diligence} completeness={completeness} rfis={rfis} respondents={respondents} />}
          {activeTab === "diligence" && <DiligenceTab diligence={diligence} setDiligence={setDiligence} />}
          {activeTab === "rfq" && <RFQTab project={project} diligence={diligence} trade={rfqTrade} setTrade={setRfqTrade} trades={TRADES} draftMode={draftMode} />}
          {activeTab === "rfi" && <RFITab rfis={rfis} setRfis={setRfis} statusFilter={rfiStatusFilter} setStatusFilter={setRfiStatusFilter} editing={editingRfi} setEditing={setEditingRfi} />}
          {activeTab === "respondents" && <RespondentTab respondents={respondents} setRespondents={setRespondents} tradeFilter={tradeFilter} setTradeFilter={setTradeFilter} trades={TRADES} editing={editingResp} setEditing={setEditingResp} />}
          {activeTab === "pdf" && <PDFPreviewTab project={project} diligence={diligence} rfis={rfis} respondents={respondents} draftMode={draftMode} section={pdfSection} setSection={setPdfSection} />}
        </div>
      </main>

      {/* IMPORT MODAL */}
      {showImportModal && importData && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: COLORS.surface, borderRadius: 12, padding: 32, maxWidth: 600, width: "90%", border: `1px solid ${COLORS.border}`, maxHeight: "80vh", overflow: "auto" }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>Import Successful</h2>
            <p style={{ color: COLORS.textMuted, fontSize: 13, margin: "0 0 20px" }}>{importData.fileName} — {importData.sheetNames.length} sheets detected</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {importData.sheetNames.map(s => (
                <span key={s} style={{ padding: "4px 10px", background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4, fontSize: 12, color: COLORS.textMuted }}>{s} ({importData.sheets[s]?.length || 0} rows)</span>
              ))}
            </div>
            <p style={{ fontSize: 12, color: COLORS.textDim, margin: "0 0 20px" }}>
              Data has been parsed. The current project data is already seeded from this workbook. Future imports will overwrite the active project.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowImportModal(false)} style={{ padding: "8px 20px", background: COLORS.accent, color: COLORS.bg, border: "none", borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════
function Card({ children, title, subtitle, style, headerRight }) {
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: "hidden", ...style }}>
      {title && (
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{subtitle}</div>}
          </div>
          {headerRight}
        </div>
      )}
      <div style={{ padding: "14px 18px" }}>{children}</div>
    </div>
  );
}

function Badge({ label, color, bg }) {
  return (
    <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, color: color || COLORS.text, background: bg || COLORS.surfaceAlt, whiteSpace: "nowrap", letterSpacing: "0.02em" }}>
      {label}
    </span>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || COLORS.text, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
      <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
    </div>
  );
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${COLORS.border}`, marginBottom: 20 }}>
      {tabs.map(t => (
        <button key={t} onClick={() => onChange(t)} style={{
          padding: "8px 16px", background: "none", border: "none",
          borderBottom: active === t ? `2px solid ${COLORS.accent}` : "2px solid transparent",
          color: active === t ? COLORS.accent : COLORS.textMuted,
          fontWeight: active === t ? 600 : 400, fontSize: 13, cursor: "pointer", fontFamily: "inherit"
        }}>{t}</button>
      ))}
    </div>
  );
}

function Table({ columns, data, onRowClick }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>{columns.map((c, i) => (
            <th key={i} style={{ textAlign: "left", padding: "8px 12px", borderBottom: `1px solid ${COLORS.border}`, color: COLORS.textMuted, fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{c.label}</th>
          ))}</tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr key={ri} onClick={() => onRowClick?.(row, ri)} style={{ cursor: onRowClick ? "pointer" : "default", borderBottom: `1px solid ${COLORS.border}` }}
              onMouseEnter={e => e.currentTarget.style.background = COLORS.surfaceAlt}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              {columns.map((c, ci) => (
                <td key={ci} style={{ padding: "10px 12px", maxWidth: c.maxWidth || 400, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.render ? c.render(row, ri) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// DASHBOARD TAB
// ═══════════════════════════════════════════════════════
function DashboardTab({ project, diligence, completeness, rfis, respondents }) {
  const openRfis = rfis.filter(r => r.status === "Open").length;
  const invited = respondents.filter(r => r.status !== "Not Invited").length;

  return (
    <div>
      {/* Completeness / Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
        <Card style={{ textAlign: "center" }}>
          <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 8px" }}>
            <svg viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="40" cy="40" r="34" fill="none" stroke={COLORS.border} strokeWidth="6" />
              <circle cx="40" cy="40" r="34" fill="none" stroke={completeness.score >= 80 ? COLORS.success : completeness.score >= 50 ? COLORS.warning : COLORS.danger} strokeWidth="6" strokeDasharray={`${(completeness.score / 100) * 213.6} 213.6`} strokeLinecap="round" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 20, fontFamily: "'JetBrains Mono', monospace" }}>{completeness.score}%</div>
          </div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Completeness</div>
        </Card>
        <Card><Stat label="Answered" value={completeness.answered} color={COLORS.success} /></Card>
        <Card><Stat label="Partial" value={completeness.partial} color={COLORS.warning} /></Card>
        <Card><Stat label="Not Found" value={completeness.notFound} color={COLORS.textDim} /></Card>
        <Card><Stat label="Needs Review" value={completeness.needsReview} color={COLORS.danger} /></Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Project Summary */}
        <Card title="Project Summary" subtitle={project.id}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
            {[
              ["Client", project.client], ["Address", project.address], ["Utility", project.utility],
              ["AC Size", project.acMW], ["DC Size", project.dcMW], ["DC/AC Ratio", project.dcAcRatio],
              ["System Type", project.systemType], ["Modules", project.modules],
              ["Inverters", project.inverters], ["Racking", project.racking],
              ["Gross Parcel", project.grossParcel], ["Buildable", project.buildableArea],
              ["IC Voltage", project.icVoltage], ["Wetlands", project.wetlands],
              ["RFP Received", project.rfpReceived], ["Bid Due", project.bidDue]
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
                <span style={{ color: COLORS.text }}>{val}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Design Basis Conflict */}
        <Card title="Design Basis Conflict" subtitle="⚠ THREE CONFLICTING BASES">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>{["", "DC", "AC", "Ratio", "Modules", "Racking"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "6px 8px", borderBottom: `1px solid ${COLORS.border}`, color: COLORS.textMuted, fontWeight: 500, fontSize: 10, textTransform: "uppercase" }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {project.designBases.map((db, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i === 2 ? COLORS.accentDim : "transparent" }}>
                    <td style={{ padding: "6px 8px", fontWeight: 600, fontSize: 11, color: i === 2 ? COLORS.accent : COLORS.textMuted, whiteSpace: "nowrap" }}>{db.label}</td>
                    <td style={{ padding: "6px 8px" }}>{db.dc}</td>
                    <td style={{ padding: "6px 8px" }}>{db.ac}</td>
                    <td style={{ padding: "6px 8px" }}>{db.ratio}</td>
                    <td style={{ padding: "6px 8px" }}>{db.modules}</td>
                    <td style={{ padding: "6px 8px" }}>{db.racking}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Permitting */}
        <Card title="Permitting Status" subtitle={`${project.permitting.filter(p => p.status.toLowerCase().includes("complete")).length} of ${project.permitting.length} complete`}>
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {project.permitting.map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < project.permitting.length - 1 ? `1px solid ${COLORS.border}` : "none", fontSize: 12 }}>
                <span>{p.permit}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: COLORS.textDim }}>{p.date}</span>
                  <Badge label={p.status} color={statusColor(p.status)} bg={statusBg(p.status)} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Key Risks */}
        <Card title="Estimating Risks" subtitle={`${project.risks.length} identified`}>
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {project.risks.map((r, i) => (
              <div key={i} style={{ padding: "8px 0", borderBottom: i < project.risks.length - 1 ? `1px solid ${COLORS.border}` : "none", fontSize: 12, display: "flex", gap: 8 }}>
                <span style={{ color: COLORS.danger, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, flexShrink: 0 }}>{i + 1}.</span>
                <span style={{ color: COLORS.textMuted, lineHeight: 1.5 }}>{r}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card title="RFI Summary">
          <div style={{ display: "flex", gap: 32, padding: "8px 0" }}>
            <Stat label="Open" value={openRfis} color={COLORS.danger} />
            <Stat label="Total" value={rfis.length} color={COLORS.text} />
          </div>
        </Card>
        <Card title="Respondent Summary">
          <div style={{ display: "flex", gap: 32, padding: "8px 0" }}>
            <Stat label="Invited" value={invited} color={COLORS.info} />
            <Stat label="Slots" value={respondents.length} color={COLORS.text} />
          </div>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// DILIGENCE TAB
// ═══════════════════════════════════════════════════════
function DiligenceTab({ diligence, setDiligence }) {
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? diligence : diligence.filter(d => d.status === filter);
  const statuses = ["All", "Answered", "Partial", "Needs Review", "Not Found"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Diligence Matrix</h2>
        <div style={{ display: "flex", gap: 6 }}>
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: "4px 12px", borderRadius: 4, border: `1px solid ${filter === s ? COLORS.accent : COLORS.border}`,
              background: filter === s ? COLORS.accentDim : "transparent",
              color: filter === s ? COLORS.accent : COLORS.textMuted,
              fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit"
            }}>{s} {s !== "All" && `(${diligence.filter(d => d.status === s).length})`}</button>
          ))}
        </div>
      </div>
      <Card>
        <Table
          columns={[
            { label: "Field", key: "field", render: (r) => <span style={{ fontWeight: 500 }}>{r.field}</span> },
            { label: "Answer", key: "answer", render: (r) => <span style={{ color: COLORS.textMuted, fontSize: 12, lineHeight: 1.4 }}>{r.answer}</span>, maxWidth: 500 },
            { label: "Status", key: "status", render: (r) => <Badge label={r.status} color={statusColor(r.status)} bg={statusBg(r.status)} /> }
          ]}
          data={filtered}
        />
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// RFQ BUILDER TAB
// ═══════════════════════════════════════════════════════
function RFQTab({ project, diligence, trade, setTrade, trades, draftMode }) {
  const [sections, setSections] = useState([
    { id: "cover", title: "Cover Page", enabled: true, content: "" },
    { id: "invite", title: "Invitation to Bid", enabled: true, content: `Distributed Energy, Inc. (DEI) invites qualified ${trade.toLowerCase()} contractors to submit proposals for the ${project.name} located at ${project.address}.\n\nClient: ${project.client}\nCapacity: ${project.acMW} AC / ${project.dcMW} DC\nUtility: ${project.utility}\n\nBid Due Date: ${project.bidDue}` },
    { id: "overview", title: "Project Overview", enabled: true, content: `${project.name} is a ground-mount solar PV project located at ${project.address}. The facility is interconnected to ${project.utility} at ${project.icVoltage} under ISA capacity of ${project.isaCapacity}.\n\nGross parcel: ${project.grossParcel}\nBuildable area: ${project.buildableArea}\nSystem type: ${project.systemType}\nModules: ${project.modules}\nInverters: ${project.inverters}\nTransformers: ${project.transformers}` },
    { id: "scope", title: "Scope of Work", enabled: true, content: getTradeScope(trade, project) },
    { id: "schedule", title: "Schedule & Milestones", enabled: true, content: `Target Mobilization: ${project.mobDate}\nBid Due: ${project.bidDue}\n\nNote: No NTP, substantial completion, or COD milestone was found in the development package. Schedule is subject to confirmation by the Owner.` },
    { id: "commercial", title: "Commercial Requirements", enabled: true, content: "Pricing shall be submitted on a lump-sum basis.\nSales tax exempt: Per bid materials.\nPayment terms: Per EPC subcontract form (to be issued).\nBonding: Decommissioning bond of $175,000 required before building permit.\nInsurance: Per subcontract requirements.\nRetainage: TBD." },
    { id: "technical", title: "Technical Requirements", enabled: true, content: `Design basis is under review — three conflicting design sets exist in the package.\n\nEstimate basis (2026): ${project.dcMW} DC, ${project.modules}, ${project.inverters}, ${project.racking}.\n\nBidders should note that IFC drawings are not yet available. Current design set is 2023 vintage (90% fixed tilt).` },
    { id: "inclusions", title: "Inclusions", enabled: true, content: "Per attached scope of work and specifications." },
    { id: "exclusions", title: "Exclusions", enabled: true, content: "Owner-furnished equipment (modules, racking, inverters, transformers — subject to confirmation).\nEngineering and design.\nPermitting fees.\nInterconnection costs.\nLand acquisition." },
    { id: "assumptions", title: "Assumptions", enabled: true, content: "Normal working hours (M-F, 7AM–5PM).\nAccess road suitable for construction traffic.\nNo hazardous materials or contamination (Phase I ESA on file).\nWetland setbacks per delineation report.\nFinal SWPPP to be issued before mobilization." },
    { id: "pricing", title: "Pricing Form", enabled: true, content: "Submit lump-sum pricing broken down by:\n- Labor\n- Materials\n- Equipment\n- Subcontractors\n- General conditions\n- Fee/margin\n\nAlternate pricing for:\n- Unit rates (per pile, per module, per string, etc.)\n- Schedule acceleration\n- Domestic content adder" },
    { id: "submission", title: "Submission Instructions", enabled: true, content: `Submit proposals to:\nDistributed Energy, Inc.\nPre-Sales / Estimating\n\nDeadline: ${project.bidDue}\nFormat: PDF + Excel pricing form\nQuestions: Submit via RFI log` },
    { id: "contacts", title: "Contacts", enabled: true, content: "DEI Pre-Sales Team\nDistributed Energy, Inc.\nStuart, FL\n\nClient: True Green Capital" }
  ]);

  const updateSection = (id, content) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, content } : s));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>RFQ / RFP Builder</h2>
      </div>

      <TabBar tabs={trades} active={trade} onChange={setTrade} />

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16 }}>
        {/* Section List */}
        <Card title="Sections">
          {sections.map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: 12 }}>
              <input type="checkbox" checked={s.enabled} onChange={() => setSections(prev => prev.map(x => x.id === s.id ? { ...x, enabled: !x.enabled } : x))} />
              <span style={{ color: s.enabled ? COLORS.text : COLORS.textDim }}>{s.title}</span>
            </div>
          ))}
        </Card>

        {/* Editor */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sections.filter(s => s.enabled).map(s => (
            <Card key={s.id} title={s.title}>
              <textarea
                value={s.content}
                onChange={e => updateSection(s.id, e.target.value)}
                style={{
                  width: "100%", minHeight: 100, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`,
                  borderRadius: 6, color: COLORS.text, padding: 12, fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
                  resize: "vertical", lineHeight: 1.6, outline: "none"
                }}
              />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function getTradeScope(trade, project) {
  const scopes = {
    "Civil": `CIVIL SCOPE — ${project.name}\n\n- Site mobilization and temporary facilities\n- Clearing and grubbing (~${project.buildableArea})\n- Erosion and sediment control per SWPPP (final SWPPP pending)\n- Rough grading and fine grading\n- Access road construction\n- Equipment pad construction\n- Stormwater management\n- Perimeter fencing (~${project.fence})\n- Gate installation\n- Aggregate roads and laydown\n- Site restoration\n\nNote: Wetlands present (~10.63 ac). Adhere to delineation setbacks.`,
    "Electrical": `ELECTRICAL SCOPE — ${project.name}\n\n- DC wiring (modules to combiners to inverters)\n- AC wiring (inverters to transformers)\n- MV cable installation (~${project.ugMvCable})\n- Grounding system\n- DAS / monitoring system\n- POI equipment installation (GOAB, reclosers, metering)\n- Transformer installation (${project.transformers})\n- Commissioning support\n\nDesign basis under review. CESIR basis vs. current layout requires reconciliation.`,
    "Mechanical / Racking": `MECHANICAL / RACKING SCOPE — ${project.name}\n\n- Pile driving / foundation installation\n- Racking assembly and installation (${project.racking})\n- Module installation (${project.modules})\n- Torque tube and bearing installation\n- Tracker motor / controller installation (if SAT confirmed)\n\nNote: No field geotech available. Pile embedment TBD pending borings.`,
    "Equipment Vendor": `EQUIPMENT SUPPLY — ${project.name}\n\nRequired equipment (procurement responsibility TBD):\n- Modules: ${project.moduleType} x ${project.modules.split("x")[0].trim()}\n- Inverters: ${project.inverters}\n- Transformers: ${project.transformers}\n- Racking: ${project.racking}\n- Combiner boxes: ${project.combiners}\n\nOwner-furnished scope not yet confirmed. Bidders should price both owner-supply and self-procured scenarios.`,
    "Specialty": `SPECIALTY SCOPE — ${project.name}\n\nDefine custom scope items for this trade package.`,
    "Custom": `CUSTOM SCOPE — ${project.name}\n\nDefine custom scope items.`
  };
  return scopes[trade] || scopes["Custom"];
}

// ═══════════════════════════════════════════════════════
// RFI LOG TAB
// ═══════════════════════════════════════════════════════
function RFITab({ rfis, setRfis, statusFilter, setStatusFilter, editing, setEditing }) {
  const statuses = ["All", "Open", "Answered", "Closed"];
  const filtered = statusFilter === "All" ? rfis : rfis.filter(r => r.status === statusFilter);

  const addRfi = () => {
    const newId = `RFI-${String(rfis.length + 1).padStart(3, "0")}`;
    setRfis([...rfis, { id: newId, trade: "General", subject: "", question: "", raisedBy: "DEI Pre-Sales", assignedTo: "", dateRaised: new Date().toISOString().split("T")[0], dueDate: "", status: "Open", impact: "Scope", response: "" }]);
    setEditing(rfis.length);
  };

  const updateRfi = (idx, field, value) => {
    setRfis(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>RFI Log</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: "4px 12px", borderRadius: 4, border: `1px solid ${statusFilter === s ? COLORS.accent : COLORS.border}`,
              background: statusFilter === s ? COLORS.accentDim : "transparent",
              color: statusFilter === s ? COLORS.accent : COLORS.textMuted,
              fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit"
            }}>{s}</button>
          ))}
          <button onClick={addRfi} style={{ padding: "4px 14px", borderRadius: 4, border: "none", background: COLORS.accent, color: COLORS.bg, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>+ Add RFI</button>
        </div>
      </div>

      <Card>
        <Table
          columns={[
            { label: "RFI #", key: "id", render: r => <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 12, color: COLORS.accent }}>{r.id}</span> },
            { label: "Trade", key: "trade" },
            { label: "Subject", key: "subject", render: r => <span style={{ fontWeight: 500 }}>{r.subject || "—"}</span> },
            { label: "Raised", key: "dateRaised", render: r => <span style={{ fontSize: 12, color: COLORS.textMuted }}>{r.dateRaised}</span> },
            { label: "Due", key: "dueDate", render: r => <span style={{ fontSize: 12, color: COLORS.textMuted }}>{r.dueDate || "—"}</span> },
            { label: "Impact", key: "impact", render: r => <Badge label={r.impact} /> },
            { label: "Status", key: "status", render: r => <Badge label={r.status} color={statusColor(r.status)} bg={statusBg(r.status)} /> }
          ]}
          data={filtered}
          onRowClick={(row, idx) => setEditing(editing === idx ? null : idx)}
        />
      </Card>

      {editing !== null && rfis[editing] && (
        <Card title={`Edit ${rfis[editing].id}`} style={{ marginTop: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            {[
              ["subject", "Subject"], ["trade", "Trade"], ["assignedTo", "Assigned To"], ["impact", "Impact"],
              ["dateRaised", "Date Raised"], ["dueDate", "Due Date"], ["status", "Status"], ["raisedBy", "Raised By"]
            ].map(([key, label]) => (
              <div key={key}>
                <label style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
                {key === "status" ? (
                  <select value={rfis[editing][key]} onChange={e => updateRfi(editing, key, e.target.value)} style={{ width: "100%", padding: "6px 8px", background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4, color: COLORS.text, fontFamily: "inherit", fontSize: 13 }}>
                    {["Open", "Answered", "Closed", "Overdue"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input value={rfis[editing][key]} onChange={e => updateRfi(editing, key, e.target.value)} style={{ width: "100%", padding: "6px 8px", background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4, color: COLORS.text, fontFamily: "inherit", fontSize: 13, boxSizing: "border-box" }} />
                )}
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>Question</label>
            <textarea value={rfis[editing].question} onChange={e => updateRfi(editing, "question", e.target.value)} style={{ width: "100%", minHeight: 60, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4, color: COLORS.text, padding: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, resize: "vertical", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>Response</label>
            <textarea value={rfis[editing].response} onChange={e => updateRfi(editing, "response", e.target.value)} style={{ width: "100%", minHeight: 60, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4, color: COLORS.text, padding: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, resize: "vertical", boxSizing: "border-box" }} />
          </div>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// RESPONDENT LOG TAB
// ═══════════════════════════════════════════════════════
function RespondentTab({ respondents, setRespondents, tradeFilter, setTradeFilter, trades, editing, setEditing }) {
  const allTrades = ["All", ...trades];
  const filtered = tradeFilter === "All" ? respondents : respondents.filter(r => r.trade === tradeFilter);
  const respStatuses = ["Not Invited", "Invited", "Confirmed", "Proposal Received", "No Bid", "Awarded"];

  const addResp = () => {
    const newId = `R-${String(respondents.length + 1).padStart(3, "0")}`;
    setRespondents([...respondents, { id: newId, company: "", trade: tradeFilter === "All" ? "Civil" : tradeFilter, contact: "", email: "", phone: "", invitedDate: "", confirmed: false, intentToBid: "", proposalDue: "", proposalReceived: "", amount: "", exclusions: "", notes: "", status: "Not Invited", rank: "" }]);
    setEditing(respondents.length);
  };

  const updateResp = (idx, field, value) => {
    setRespondents(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Respondent Log</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {allTrades.map(t => (
            <button key={t} onClick={() => setTradeFilter(t)} style={{
              padding: "4px 12px", borderRadius: 4, border: `1px solid ${tradeFilter === t ? COLORS.accent : COLORS.border}`,
              background: tradeFilter === t ? COLORS.accentDim : "transparent",
              color: tradeFilter === t ? COLORS.accent : COLORS.textMuted,
              fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit"
            }}>{t}</button>
          ))}
          <button onClick={addResp} style={{ padding: "4px 14px", borderRadius: 4, border: "none", background: COLORS.accent, color: COLORS.bg, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>+ Add Bidder</button>
        </div>
      </div>

      <Card>
        <Table
          columns={[
            { label: "ID", key: "id", render: r => <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{r.id}</span> },
            { label: "Company", key: "company", render: r => <span style={{ fontWeight: 500 }}>{r.company || "—"}</span> },
            { label: "Trade", key: "trade" },
            { label: "Contact", key: "contact", render: r => r.contact || "—" },
            { label: "Proposal Due", key: "proposalDue", render: r => <span style={{ fontSize: 12, color: COLORS.textMuted }}>{r.proposalDue || "—"}</span> },
            { label: "Amount", key: "amount", render: r => r.amount ? <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{r.amount}</span> : "—" },
            { label: "Status", key: "status", render: r => {
              const sc = { "Not Invited": COLORS.textDim, "Invited": COLORS.info, "Confirmed": COLORS.warning, "Proposal Received": COLORS.success, "No Bid": COLORS.danger, "Awarded": COLORS.accent };
              const bg = { "Not Invited": "transparent", "Invited": COLORS.infoDim, "Confirmed": COLORS.warningDim, "Proposal Received": COLORS.successDim, "No Bid": COLORS.dangerDim, "Awarded": COLORS.accentDim };
              return <Badge label={r.status} color={sc[r.status]} bg={bg[r.status]} />;
            }}
          ]}
          data={filtered}
          onRowClick={(row, idx) => setEditing(editing === idx ? null : idx)}
        />
      </Card>

      {editing !== null && respondents[editing] && (
        <Card title={`Edit ${respondents[editing].id}`} style={{ marginTop: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            {[
              ["company", "Company"], ["trade", "Trade"], ["contact", "Contact"], ["email", "Email"],
              ["phone", "Phone"], ["invitedDate", "Invited Date"], ["proposalDue", "Proposal Due"], ["proposalReceived", "Received Date"],
              ["amount", "Amount"], ["rank", "Rank"]
            ].map(([key, label]) => (
              <div key={key}>
                <label style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
                <input value={respondents[editing][key]} onChange={e => updateResp(editing, key, e.target.value)} style={{ width: "100%", padding: "6px 8px", background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4, color: COLORS.text, fontFamily: "inherit", fontSize: 13, boxSizing: "border-box" }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</label>
              <select value={respondents[editing].status} onChange={e => updateResp(editing, "status", e.target.value)} style={{ width: "100%", padding: "6px 8px", background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4, color: COLORS.text, fontFamily: "inherit", fontSize: 13 }}>
                {respStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>Exclusions</label>
              <textarea value={respondents[editing].exclusions} onChange={e => updateResp(editing, "exclusions", e.target.value)} style={{ width: "100%", minHeight: 50, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4, color: COLORS.text, padding: 8, fontFamily: "inherit", fontSize: 12, resize: "vertical", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>Notes</label>
              <textarea value={respondents[editing].notes} onChange={e => updateResp(editing, "notes", e.target.value)} style={{ width: "100%", minHeight: 50, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4, color: COLORS.text, padding: 8, fontFamily: "inherit", fontSize: 12, resize: "vertical", boxSizing: "border-box" }} />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// PDF PREVIEW TAB
// ═══════════════════════════════════════════════════════
function PDFPreviewTab({ project, diligence, rfis, respondents, draftMode, section, setSection }) {
  const sections = ["summary", "rfi", "respondents", "permitting"];
  const printRef = useRef(null);

  const handlePrint = () => window.print();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>PDF Preview</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <TabBar tabs={["Summary", "RFI Log", "Respondents", "Permitting"]} active={section === "summary" ? "Summary" : section === "rfi" ? "RFI Log" : section === "respondents" ? "Respondents" : "Permitting"} onChange={v => setSection(v === "Summary" ? "summary" : v === "RFI Log" ? "rfi" : v === "Respondents" ? "respondents" : "permitting")} />
          <button onClick={handlePrint} style={{ padding: "4px 14px", borderRadius: 4, border: "none", background: COLORS.accent, color: COLORS.bg, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", height: 32 }}>Print / PDF</button>
        </div>
      </div>

      {/* Print Preview */}
      <div ref={printRef} style={{ background: "#fff", color: "#111", borderRadius: 8, padding: 48, maxWidth: 850, margin: "0 auto", fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.6, position: "relative", overflow: "hidden" }}>
        {/* Watermark */}
        {draftMode && (
          <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%, -50%) rotate(-35deg)", fontSize: 100, fontWeight: 900, color: "rgba(0,0,0,0.04)", letterSpacing: 20, whiteSpace: "nowrap", pointerEvents: "none", zIndex: 1 }}>DRAFT</div>
        )}

        {/* Header */}
        <div style={{ borderBottom: "3px solid #E8A838", paddingBottom: 16, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#888", marginBottom: 4 }}>Distributed Energy, Inc.</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#111" }}>{project.name}</div>
            <div style={{ fontSize: 12, color: "#666" }}>{project.client} &nbsp;·&nbsp; {project.acMW} AC &nbsp;·&nbsp; {project.address}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#888" }}>{draftMode ? "DRAFT" : "FINAL"} — Rev {project.revision}</div>
            <div style={{ fontSize: 10, color: "#888" }}>{new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {section === "summary" && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, borderBottom: "1px solid #ddd", paddingBottom: 8, marginBottom: 16 }}>Project Summary</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 24 }}>
              <tbody>
                {[
                  ["Client", project.client], ["Address", project.address], ["Utility", project.utility],
                  ["AC Size", project.acMW], ["DC Size", project.dcMW], ["System Type", project.systemType],
                  ["Modules", project.modules], ["Inverters", project.inverters],
                  ["Transformers", project.transformers], ["Gross Parcel", project.grossParcel],
                  ["IC Voltage", project.icVoltage], ["Bid Due", project.bidDue]
                ].map(([k, v]) => (
                  <tr key={k} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "6px 8px", fontWeight: 600, width: 160, color: "#555" }}>{k}</td>
                    <td style={{ padding: "6px 8px" }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 style={{ fontSize: 16, fontWeight: 700, borderBottom: "1px solid #ddd", paddingBottom: 8, marginBottom: 16 }}>Estimating Risks</h3>
            {project.risks.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 12 }}>
                <span style={{ fontWeight: 700, color: "#c00" }}>{i + 1}.</span>
                <span style={{ color: "#444" }}>{r}</span>
              </div>
            ))}
          </div>
        )}

        {section === "rfi" && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, borderBottom: "1px solid #ddd", paddingBottom: 8, marginBottom: 16 }}>RFI Register</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #ddd" }}>
                  {["RFI #", "Trade", "Subject", "Status", "Due", "Impact"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600, color: "#555", fontSize: 10, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rfis.map(r => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "6px 8px", fontWeight: 600 }}>{r.id}</td>
                    <td style={{ padding: "6px 8px" }}>{r.trade}</td>
                    <td style={{ padding: "6px 8px" }}>{r.subject}</td>
                    <td style={{ padding: "6px 8px", fontWeight: 600, color: r.status === "Open" ? "#c00" : r.status === "Closed" ? "#080" : "#666" }}>{r.status}</td>
                    <td style={{ padding: "6px 8px" }}>{r.dueDate}</td>
                    <td style={{ padding: "6px 8px" }}>{r.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {section === "respondents" && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, borderBottom: "1px solid #ddd", paddingBottom: 8, marginBottom: 16 }}>Respondent Log</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #ddd" }}>
                  {["ID", "Company", "Trade", "Contact", "Due", "Amount", "Status"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600, color: "#555", fontSize: 10, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {respondents.map(r => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "6px 8px", fontWeight: 600 }}>{r.id}</td>
                    <td style={{ padding: "6px 8px" }}>{r.company || "—"}</td>
                    <td style={{ padding: "6px 8px" }}>{r.trade}</td>
                    <td style={{ padding: "6px 8px" }}>{r.contact || "—"}</td>
                    <td style={{ padding: "6px 8px" }}>{r.proposalDue || "—"}</td>
                    <td style={{ padding: "6px 8px" }}>{r.amount || "—"}</td>
                    <td style={{ padding: "6px 8px" }}>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {section === "permitting" && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, borderBottom: "1px solid #ddd", paddingBottom: 8, marginBottom: 16 }}>Permitting Status</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #ddd" }}>
                  {["Permit / Approval", "Status", "Date"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600, color: "#555", fontSize: 10, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {project.permitting.map((p, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "6px 8px" }}>{p.permit}</td>
                    <td style={{ padding: "6px 8px", fontWeight: 600, color: p.status.includes("Complete") ? "#080" : p.status.includes("NOT") ? "#c00" : "#886600" }}>{p.status}</td>
                    <td style={{ padding: "6px 8px" }}>{p.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: "1px solid #ddd", marginTop: 32, paddingTop: 12, display: "flex", justifyContent: "space-between", fontSize: 9, color: "#aaa" }}>
          <span>CONFIDENTIAL — Distributed Energy, Inc. — DEI Pre-Sales</span>
          <span>Prepared {new Date().toLocaleDateString()} — {draftMode ? "DRAFT" : "FINAL"}</span>
        </div>
      </div>
    </div>
  );
}
