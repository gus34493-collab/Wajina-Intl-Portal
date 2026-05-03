
"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Terminal, 
  Activity, 
  Lock, 
  User, 
  Download,
  AlertCircle,
  Database
} from "lucide-react";

export default function DirectorAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchLogs() {
      try {
        const response = await fetch("/api/audit-logs?limit=100");
        if (response.ok) {
          const data = await response.json();
          setLogs(data.logs || []);
        }
      } catch (err) {
        console.error("Audit Sync Failure:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.actor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        {/* Security Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-black text-brand-primary tracking-tight flex items-center gap-3">
              <ShieldCheck className="text-brand-tertiary" size={28} />
              Institutional Telemetry & Audit
            </h1>
            <p className="text-brand-primary/60 text-sm font-medium mt-1">
              Real-time monitoring of all administrative and instructional movements across the Wajina cluster.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <button className="bg-white border border-brand-primary/8 text-brand-primary px-5 py-3 rounded-xl shadow-sm font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <Download size={16} />
                Export Forensic Ledger
             </button>
             <div className="bg-brand-primary text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <Activity size={16} className="text-brand-tertiary animate-pulse" />
                Live Monitoring
             </div>
          </div>
        </div>

        {/* Security Pulse Strips */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <SecurityKPI label="Active Sessions" value="24" trend="Institutional High" icon={<User size={16}/>} />
           <SecurityKPI label="Auth Events" value="142" trend="Last 24h" icon={<Lock size={16}/>} />
           <SecurityKPI label="Data Queries" value="1.2k" trend="Normal Load" icon={<Database size={16}/>} />
           <SecurityKPI label="System Health" value="100%" trend="Zero Dropped Packets" icon={<ShieldCheck size={16} className="text-brand-forest"/>} />
        </div>

        {/* Audit Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-brand-primary/8 p-2 rounded-2xl">
           <div className="flex items-center gap-1 overflow-x-auto px-2">
              <LogFilter label="All Events" active />
              <LogFilter label="Authentication" />
              <LogFilter label="Academic" />
              <LogFilter label="Financial" />
              <LogFilter label="Administrative" />
           </div>
           <div className="relative md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-tertiary" size={14} />
              <input 
                type="text" 
                placeholder="Search by actor, action or entity..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-brand-blush/50 border border-brand-primary/8 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-brand-primary focus:outline-none"
              />
           </div>
        </div>

        {/* Console-Style Audit Ledger */}
        <div className="card p-0 overflow-hidden bg-[#0F172A] border-2 border-brand-primary/20 shadow-2xl">
           <div className="p-4 border-b border-white/5 bg-[#1E293B] flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <Terminal size={16} className="text-brand-tertiary" />
                 <h4 className="font-black text-white uppercase tracking-widest text-token-micro">Root Ledger Access</h4>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-brand-tertiary rounded-full animate-pulse" />
                 <span className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">Syslog Synchronized</span>
              </div>
           </div>

           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-token-micro font-black text-white/40 uppercase tracking-[0.25em] border-b border-white/5">
                    <th className="px-6 py-5">Timestamp</th>
                    <th className="px-6 py-5">Actor / Identity</th>
                    <th className="px-6 py-5">Movement / Action</th>
                    <th className="px-6 py-5">Entity Target</th>
                    <th className="px-6 py-5 text-right">Telemetry Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                   {loading ? (
                      Array(10).fill(0).map((_, i) => <tr key={i}><td colSpan={5} className="h-12 animate-pulse bg-white/5" /></tr>)
                   ) : filteredLogs.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-20 text-center text-white/40 text-xs italic">No telemetry data matching your query...</td></tr>
                   ) : filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors border-l-2 border-l-transparent hover:border-l-brand-tertiary">
                         <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-token-micro font-black text-white/50">{new Date(log.createdAt).toLocaleString('en-GB')}</span>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                               <div className="w-6 h-6 rounded bg-brand-tertiary/20 grid place-items-center text-brand-tertiary text-token-micro font-black">
                                  {log.actor?.role?.[0] || "U"}
                               </div>
                               <div>
                                  <p className="text-token-micro font-black text-white">{log.actor?.name || "System"}</p>
                                  <p className="text-token-micro font-bold text-white/30 uppercase">{log.actor?.role || "AUTOMATION"}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-token-micro font-black uppercase ${log.action.includes('FAIL') || log.action.includes('DELETE') ? 'bg-rose-600/10 text-rose-500' : 'bg-brand-tertiary/10 text-brand-tertiary'}`}>
                               {log.action}
                            </span>
                         </td>
                         <td className="px-6 py-4">
                            <p className="text-token-micro font-bold text-white/70">{log.entity || "GLOBAL"}</p>
                            <p className="text-token-micro font-bold text-white/30">{log.entityId || "IDX-000"}</p>
                         </td>
                         <td className="px-6 py-4 text-right">
                            <span className="text-token-micro font-black text-white/40 uppercase tracking-widest">{log.id.slice(-8)}</span>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
           </div>
        </div>

        {/* Security Alert Strip */}
        <div className="card bg-brand-accent/10 border-brand-accent/20 p-6 flex items-start gap-4">
           <AlertCircle size={20} className="text-brand-accent shrink-0" />
           <div>
              <h4 className="font-black text-xs text-brand-primary uppercase tracking-tight mb-2">Audit Storage Retention</h4>
              <p className="text-token-micro font-bold text-brand-primary/60 leading-relaxed">
                 Institutional telemetry is stored for 24 months as per mandated security protocol. Forensic logs older than 730 days are automatically archived to the encrypted vault.
              </p>
           </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function SecurityKPI({ label, value, trend, icon }: any) {
   return (
      <div className="card p-5 bg-white border border-brand-primary/8 rounded-2xl flex items-center justify-between shadow-sm">
         <div>
            <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-[0.15em] mb-1">{label}</p>
            <div className="flex items-baseline gap-2">
               <span className="text-2xl font-display font-black text-brand-primary tracking-tighter">{value}</span>
               <span className="text-token-micro font-bold text-brand-tertiary">{trend}</span>
            </div>
         </div>
         <div className="w-10 h-10 rounded-xl bg-brand-blush flex items-center justify-center text-brand-tertiary">
            {icon}
         </div>
      </div>
   );
}

function LogFilter({ label, active }: any) {
   return (
      <button className={`px-4 py-2 rounded-xl text-token-micro font-black uppercase tracking-widest whitespace-nowrap transition-all ${active ? 'bg-brand-primary text-white' : 'text-brand-tertiary hover:bg-black/5'}`}>
         {label}
      </button>
   );
}

