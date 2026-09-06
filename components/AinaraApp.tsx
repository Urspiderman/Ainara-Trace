"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  Bell,
  Bot,
  ChevronRight,
  CircleHelp,
  FileCheck2,
  FileText,
  Gem,
  LayoutDashboard,
  Menu,
  MessageCircle,
  PackageCheck,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { batches as fallbackBatches, suppliers as fallbackSuppliers, type GoldBatch, type Supplier } from "@/lib/mockData";

type PageKey = "overview" | "batches" | "suppliers" | "documents" | "reports";
type ChatMessage = { role: "user" | "assistant"; content: string };

const nav = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "batches", label: "Gold Batches", icon: Gem },
  { key: "suppliers", label: "Suppliers", icon: Users },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "reports", label: "Reports", icon: FileCheck2 },
] as const;

const statusClass: Record<string, string> = {
  Verified: "badge badge-green",
  Traceable: "badge badge-green",
  Pending: "badge badge-amber",
  "Under Review": "badge badge-amber",
  Review: "badge badge-amber",
};

export default function AinaraApp() {
  const [page, setPage] = useState<PageKey>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [query, setQuery] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>(fallbackSuppliers);
  const [batches, setBatches] = useState<GoldBatch[]>(fallbackBatches);
  const [selectedBatch, setSelectedBatch] = useState<GoldBatch | null>(fallbackBatches[0]);
  const [chat, setChat] = useState<ChatMessage[]>([
    { role: "assistant", content: "Halo, saya AINARA Assistant. Saya bisa membantu menjelaskan traceability, batch, supplier, dokumen, dan laporan di AINARA." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const load = async () => {
      const [{ data: supplierRows }, { data: batchRows }] = await Promise.all([
        supabase.from("suppliers").select("code,name,type,status,last_transaction").order("created_at", { ascending: false }),
        supabase.from("gold_batches").select("batch_code,weight_grams,purity,status,updated_at,source,suppliers(name)").order("updated_at", { ascending: false }),
      ]);

      if (supplierRows?.length) {
        setSuppliers(supplierRows.map((r) => ({
          id: r.code,
          name: r.name,
          type: r.type,
          status: r.status,
          lastTransaction: r.last_transaction ? new Date(r.last_transaction).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—",
        })));
      }
      if (batchRows?.length) {
        const mapped = batchRows.map((r) => ({
          id: r.batch_code,
          supplier: "Unknown supplier",
          weight: Number(r.weight_grams),
          purity: r.purity ? `${r.purity}%` : "—",
          status: r.status,
          updatedAt: new Date(r.updated_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
          source: r.source ?? "Recycled gold",
        }));
        setBatches(mapped);
        setSelectedBatch(mapped[0]);
      }
    };

    void load();

    const channel = supabase
      .channel("ainara-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "gold_batches" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "suppliers" }, () => void load())
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, []);

  const filteredBatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return batches;
    return batches.filter((b) => [b.id, b.supplier, b.status, b.source].some((x) => x.toLowerCase().includes(q)));
  }, [batches, query]);

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || sending) return;
    const next = [...chat, { role: "user" as const, content: text }];
    setChat(next);
    setChatInput("");
    setSending(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next.slice(-8) }) });
      const data = await res.json();
      setChat((current) => [...current, { role: "assistant", content: data.content || "Maaf, saya belum memiliki jawaban." }]);
    } catch {
      setChat((current) => [...current, { role: "assistant", content: "Koneksi ke AINARA Assistant bermasalah. Silakan coba lagi." }]);
    } finally {
      setSending(false);
    }
  };

  const title = nav.find((n) => n.key === page)?.label ?? "Overview";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : "collapsed"} ${mobileNav ? "mobile-open" : ""}`}>
        <div className="brand-block">
          <div className="brand-mark"><span>✦</span></div>
          {sidebarOpen && <div><div className="brand-name">AINARA</div><div className="brand-sub">Trace</div></div>}
          <button className="icon-btn sidebar-toggle" onClick={() => setSidebarOpen((v) => !v)} aria-label="Toggle sidebar">
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        </div>

        <div className="nav-section-label">Workspace</div>
        <nav className="nav-list">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.key} className={`nav-item ${page === item.key ? "active" : ""}`} onClick={() => { setPage(item.key); setMobileNav(false); }}>
                <Icon size={18} strokeWidth={1.8} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />
        {sidebarOpen && (
          <div className="sidebar-card">
            <div className="mini-icon"><ShieldCheck size={16} /></div>
            <div><strong>Protected workspace</strong><p>Traceability data stays scoped to your organization.</p></div>
          </div>
        )}
        <div className="profile-row"><div className="avatar">AR</div>{sidebarOpen && <div><strong>Aruna Raya</strong><span>Workspace Admin</span></div>}</div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu icon-btn" onClick={() => setMobileNav((v) => !v)}><Menu size={21} /></button>
            <div><span className="eyebrow">AINARA TRACE</span><h1>{title}</h1></div>
          </div>
          <div className="topbar-actions">
            <div className="search-box"><Search size={16} /><input placeholder="Search batch, supplier..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
            <button className="icon-btn notification" aria-label="Notifications"><Bell size={18} /><span /></button>
            <button className="chat-trigger" onClick={() => setChatOpen(true)}><MessageCircle size={17} /> Ask AINARA</button>
          </div>
        </header>

        <div className="page-content">
          {page === "overview" && <Overview batches={batches} suppliers={suppliers} onSelectBatch={(b) => { setSelectedBatch(b); setPage("batches"); }} />}
          {page === "batches" && <BatchesPage batches={filteredBatches} selected={selectedBatch} onSelect={setSelectedBatch} />}
          {page === "suppliers" && <SuppliersPage suppliers={suppliers} />}
          {page === "documents" && <DocumentsPage />}
          {page === "reports" && <ReportsPage />}
        </div>
      </main>

      {chatOpen && <Chatbot messages={chat} input={chatInput} setInput={setChatInput} onSend={sendChat} sending={sending} onClose={() => setChatOpen(false)} />}
    </div>
  );
}

function Overview({ batches, suppliers, onSelectBatch }: { batches: GoldBatch[]; suppliers: Supplier[]; onSelectBatch: (b: GoldBatch) => void }) {
  const verified = batches.filter((b) => b.status !== "Under Review").length;
  return <>
    <div className="hero-row">
      <div><h2>Good morning, Aruna.</h2><p>Here is the latest traceability picture across your recycled gold network.</p></div>
      <button className="gold-btn" onClick={() => document.getElementById("latest-batches")?.scrollIntoView({ behavior: "smooth" })}><ArrowDownToLine size={17} /> Export overview</button>
    </div>

    <div className="metric-grid">
      <Metric icon={<PackageCheck size={18} />} label="Traceable Gold Batches" value="1,248" change="+8.4%" sub="vs. last month" />
      <Metric icon={<Users size={18} />} label="Active Suppliers" value={String(Math.max(12, suppliers.length + 8))} change="+2" sub="this month" />
      <Metric icon={<ShieldCheck size={18} />} label="Verification Coverage" value="96.8%" change="+3.1%" sub="vs. last month" />
      <Metric icon={<AlertTriangle size={18} />} label="Risk Alerts" value="07" change="2 open" sub="needs review" warm />
    </div>

    <div className="grid-2-1">
      <section className="panel trace-hero">
        <div className="panel-head"><div><div className="eyebrow">TRACEABILITY FLOW</div><h3>From source to jewelry</h3></div><span className="live-dot">Live</span></div>
        <div className="flow-line">
          <FlowNode icon={<Users size={20} />} label="Collector" sub="12 sources" done />
          <FlowArrow />
          <FlowNode icon={<Truck size={20} />} label="Recycler" sub="8 active" done />
          <FlowArrow />
          <FlowNode icon={<Sparkles size={20} />} label="Refiner" sub="4 active" done />
          <FlowArrow />
          <FlowNode icon={<Gem size={20} />} label="Jewelry" sub="24 SKUs" done />
        </div>
        <div className="flow-caption">AINARA links supplier, batch, transaction and verification evidence in one traceable record.</div>
      </section>
      <section className="panel alert-panel">
        <div className="panel-head"><div><div className="eyebrow">ATTENTION</div><h3>Open risk alerts</h3></div><span className="alert-count">07</span></div>
        <div className="alert-item"><div className="alert-icon"><AlertTriangle size={16} /></div><div><strong>Weight inconsistency</strong><p>Batch AIN-2026-00123</p></div><ChevronRight size={17} /></div>
        <div className="alert-item"><div className="alert-icon soft"><FileText size={16} /></div><div><strong>Missing document</strong><p>Supplier SUP-003</p></div><ChevronRight size={17} /></div>
        <button className="text-btn">Review all alerts <ChevronRight size={15} /></button>
      </section>
    </div>

    <div className="section-title" id="latest-batches"><div><div className="eyebrow">LATEST RECORDS</div><h3>Recent gold batches</h3></div><button className="text-btn" onClick={() => onSelectBatch(batches[0])}>View all <ChevronRight size={15} /></button></div>
    <section className="panel table-panel">
      <div className="table-wrap"><table><thead><tr><th>Batch ID</th><th>Supplier</th><th>Weight</th><th>Status</th><th>Updated</th></tr></thead>
      <tbody>{batches.slice(0, 4).map((b) => <tr key={b.id} onClick={() => onSelectBatch(b)} className="click-row"><td><span className="mono">{b.id}</span></td><td>{b.supplier}</td><td>{b.weight.toFixed(1)} g</td><td><span className={statusClass[b.status]}>{b.status}</span></td><td>{b.updatedAt}</td></tr>)}</tbody></table></div>
    </section>
    <div className="tiny-note"><ShieldCheck size={14} /> Demo workspace. Connect Supabase to replace demo metrics with live data.</div>
  </>;
}

function BatchesPage({ batches, selected, onSelect }: { batches: GoldBatch[]; selected: GoldBatch | null; onSelect: (b: GoldBatch) => void }) {
  return <div className="page-stack">
    <div className="hero-row"><div><h2>Gold batches</h2><p>Track material identity, status and chain-of-custody evidence.</p></div><button className="gold-btn"><QrCode size={17} /> New Gold ID</button></div>
    <div className="batch-layout">
      <section className="panel table-panel"><div className="panel-head"><div><h3>Batch registry</h3><p className="panel-sub">Every material lot receives a persistent digital record.</p></div></div>
        <div className="table-wrap"><table><thead><tr><th>Batch ID</th><th>Source</th><th>Supplier</th><th>Weight</th><th>Status</th></tr></thead><tbody>{batches.map((b) => <tr className={`click-row ${selected?.id === b.id ? "selected-row" : ""}`} key={b.id} onClick={() => onSelect(b)}><td className="mono">{b.id}</td><td>{b.source}</td><td>{b.supplier}</td><td>{b.weight.toFixed(1)} g</td><td><span className={statusClass[b.status]}>{b.status}</span></td></tr>)}</tbody></table></div>
      </section>
      {selected && <BatchDetail batch={selected} />}
    </div>
  </div>;
}

function BatchDetail({ batch }: { batch: GoldBatch }) {
  return <section className="panel batch-detail"><div className="detail-top"><div><div className="eyebrow">DIGITAL GOLD ID</div><h3>{batch.id}</h3><span className={statusClass[batch.status]}>{batch.status}</span></div><div className="gold-orb">✦</div></div>
    <div className="detail-grid"><Info label="Weight" value={`${batch.weight.toFixed(1)} g`} /><Info label="Purity" value={batch.purity} /><Info label="Supplier" value={batch.supplier} /><Info label="Source" value={batch.source} /></div>
    <div className="timeline"><TimelineItem icon={<Users size={15} />} title="Source registered" actor={batch.supplier} date="02 Sep 2026" done /><TimelineItem icon={<PackageCheck size={15} />} title="Recycler received" actor="Nusantara Recycle Metals" date="03 Sep 2026" done /><TimelineItem icon={<ShieldCheck size={15} />} title="Verification record" actor="Verification Partner" date="05 Sep 2026" done /><TimelineItem icon={<Gem size={15} />} title="Ready for jewelry" actor="AINARA status" date="Today" /></div>
    <button className="outline-btn full"><QrCode size={16} /> View QR / Gold ID</button>
  </section>;
}

function SuppliersPage({ suppliers }: { suppliers: Supplier[] }) {
  return <div className="page-stack"><div className="hero-row"><div><h2>Suppliers</h2><p>Manage the participants that feed your traceability network.</p></div><button className="gold-btn"><Users size={17} /> Add supplier</button></div><section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Supplier</th><th>Type</th><th>Status</th><th>Last transaction</th><th></th></tr></thead><tbody>{suppliers.map((s) => <tr key={s.id}><td><div className="supplier-cell"><div className="supplier-avatar">{s.name.slice(0, 1)}</div><div><strong>{s.name}</strong><span>{s.id}</span></div></div></td><td>{s.type}</td><td><span className={statusClass[s.status]}>{s.status}</span></td><td>{s.lastTransaction}</td><td><button className="row-btn"><ChevronRight size={17} /></button></td></tr>)}</tbody></table></div></section></div>;
}

function DocumentsPage() {
  return <div className="page-stack"><div className="hero-row"><div><h2>Documents</h2><p>Turn invoices, receipts and verification files into structured evidence.</p></div><button className="gold-btn"><FileText size={17} /> Upload document</button></div><div className="upload-card panel"><div className="upload-icon"><FileText size={23} /></div><h3>AI Document Intelligence</h3><p>Upload a document and AINARA can extract supplier, date, weight, purity and batch references for review.</p><div className="upload-actions"><button className="gold-btn">Choose file</button><span>PDF, JPG, PNG up to 10 MB</span></div></div><div className="doc-grid"><DocCard title="Invoice #INV-0821" meta="Nusantara Recycle Metals · 05 Sep 2026" status="Extracted" /><DocCard title="Assay Report #AS-1290" meta="Verification Partner · 05 Sep 2026" status="Verified" /><DocCard title="Receipt #R-00487" meta="Mutiara Gold Store · 04 Sep 2026" status="Needs review" /></div></div>;
}

function ReportsPage() {
  return <div className="page-stack"><div className="hero-row"><div><h2>Reports</h2><p>Prepare traceability evidence for internal review, verification and compliance workflows.</p></div><button className="gold-btn"><ArrowDownToLine size={17} /> Download report</button></div><div className="report-grid"><ReportMetric title="Traceability coverage" value="96.8%" sub="+3.1% vs prior month" /><ReportMetric title="Verified batches" value="1,206" sub="96.6% of total" /><ReportMetric title="Open evidence gaps" value="17" sub="7 require action" /></div><section className="panel report-preview"><div className="panel-head"><div><div className="eyebrow">REPORT PREVIEW</div><h3>Traceability summary — September 2026</h3></div><span className="badge badge-green">Ready</span></div><div className="report-paper"><div className="report-logo"><div className="brand-mark small">✦</div><div><strong>AINARA Trace</strong><span>Digital Traceability Report</span></div></div><div className="report-meta"><span>Coverage period: 01–06 Sep 2026</span><span>Generated: Today</span></div><div className="report-box"><strong>Purpose</strong><p>Consolidated evidence of supplier, batch, transaction and verification records.</p></div><div className="report-box"><strong>Verification note</strong><p>AINARA provides digital records and evidence. External verification remains with competent third-party partners.</p></div></div></section></div>;
}

function Chatbot({ messages, input, setInput, onSend, sending, onClose }: { messages: ChatMessage[]; input: string; setInput: (v: string) => void; onSend: () => void; sending: boolean; onClose: () => void }) {
  return <div className="chat-panel"><div className="chat-head"><div><div className="bot-avatar"><Bot size={18} /></div></div><div><strong>AINARA Assistant</strong><span>Traceability copilot</span></div><button className="icon-btn close-chat" onClick={onClose}><X size={18} /></button></div><div className="chat-body">{messages.map((m, i) => <div key={i} className={`chat-bubble ${m.role}`}>{m.content}</div>)}{sending && <div className="chat-bubble assistant typing">AINARA sedang mengetik…</div>}</div><div className="chat-suggestions"><button onClick={() => setInput("Bagaimana cara kerja Gold Digital ID?")}>Gold Digital ID</button><button onClick={() => setInput("Apa yang dimaksud traceability?")}>Traceability</button><button onClick={() => setInput("Apa yang bisa saya lihat di laporan?")}>Reports</button></div><div className="chat-input"><input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void onSend(); }} placeholder="Tanya tentang AINARA..." /><button onClick={() => void onSend()} disabled={sending || !input.trim()}><ChevronRight size={18} /></button></div></div>;
}

function Metric({ icon, label, value, change, sub, warm }: { icon: React.ReactNode; label: string; value: string; change: string; sub: string; warm?: boolean }) { return <div className="metric-card"><div className={`metric-icon ${warm ? "warm" : ""}`}>{icon}</div><div className="metric-main"><span>{label}</span><strong>{value}</strong><div><b className={warm ? "warm-text" : "green-text"}>{change}</b> <small>{sub}</small></div></div></div>; }
function FlowNode({ icon, label, sub, done }: { icon: React.ReactNode; label: string; sub: string; done?: boolean }) { return <div className={`flow-node ${done ? "done" : ""}`}><div className="flow-icon">{icon}</div><strong>{label}</strong><span>{sub}</span></div>; }
function FlowArrow() { return <div className="flow-arrow"><ChevronRight size={18} /></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="info-cell"><span>{label}</span><strong>{value}</strong></div>; }
function TimelineItem({ icon, title, actor, date, done }: { icon: React.ReactNode; title: string; actor: string; date: string; done?: boolean }) { return <div className="timeline-item"><div className={`timeline-icon ${done ? "done" : ""}`}>{icon}</div><div><strong>{title}</strong><span>{actor}</span></div><time>{date}</time></div>; }
function DocCard({ title, meta, status }: { title: string; meta: string; status: string }) { return <div className="doc-card panel"><div className="doc-top"><div className="doc-file"><FileText size={18} /></div><span className="badge badge-green">{status}</span></div><strong>{title}</strong><span>{meta}</span><button className="text-btn">Open document <ChevronRight size={14} /></button></div>; }
function ReportMetric({ title, value, sub }: { title: string; value: string; sub: string }) { return <div className="report-metric panel"><span>{title}</span><strong>{value}</strong><small>{sub}</small></div>; }
