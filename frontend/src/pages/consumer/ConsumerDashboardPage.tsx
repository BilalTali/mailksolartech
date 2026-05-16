import { useQuery } from '@tanstack/react-query';
import {
  FileText, ClipboardCheck, MapPin, Landmark, Banknote,
  Truck, Package, PackageCheck, ShieldCheck, Wrench, ScanLine, Star,
  CheckCircle2, Clock, Loader2, Phone, UserCircle2, Zap, RefreshCw,
  Activity, AlertCircle
} from 'lucide-react';
import api from '@/services/axios';

interface PipelineStep { key: string; label: string; icon: string; desc: string; state: 'done'|'current'|'pending'; }
interface SurveyReq { system_capacity_kw:string; panel_quantity:number; panel_model_make:string; inverter_model_make:string; wire_length_meters:string; earthing_kit_required:boolean; lightning_arrester_required:boolean; additional_accessories:{item:string;qty:string}[]; site_notes:string|null; }
interface DispatchInfo { vehicle_number:string; driver_name:string; driver_mobile:string; receipt_number:string|null; dispatched_at:string; }
interface Lead { ulid:string; beneficiary_name:string; beneficiary_mobile:string; beneficiary_district:string; beneficiary_state:string; system_capacity:string|null; status:string; govt_application_number:string|null; disbursement_reference:string|null; assigned_agent:{name:string;mobile:string}|null; assigned_installer:{name:string;mobile:string}|null; assigned_surveyor:{name:string;mobile:string}|null; created_at:string; updated_at:string; survey_requirement:SurveyReq|null; installation_scheduled_at?:string; }
interface InventoryItem { id:number; name:string; quantity:number; serial_number:string|null; dispatched_at:string|null; }
interface StatusLog { from:string; to:string; notes:string|null; date:string; time:string; }
interface DashData { lead:Lead; pipeline:PipelineStep[]; dispatch:DispatchInfo|null; inventory:InventoryItem[]; status_logs:StatusLog[]; }

const ICON_MAP: Record<string, React.ElementType> = {
  file: FileText, 'clipboard-check': ClipboardCheck, 'map-pin': MapPin,
  landmark: Landmark, banknote: Banknote, truck: Truck, package: Package,
  'package-check': PackageCheck, 'shield-check': ShieldCheck, wrench: Wrench,
  'scan-line': ScanLine, star: Star, 'check-circle': CheckCircle2,
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  NEW:                         { label:'Application Received',       color:'text-slate-600', bg:'bg-slate-100' },
  REGISTERED:                  { label:'Portal Registered',          color:'text-blue-700',  bg:'bg-blue-100' },
  SURVEY_DONE:                 { label:'Survey Completed',           color:'text-indigo-700',bg:'bg-indigo-100' },
  LEAD_DOCUMENTS_PRINTED:      { label:'Documents Prepared',         color:'text-violet-700',bg:'bg-violet-100' },
  SIGNATURE_PENDING:           { label:'Awaiting Signature',         color:'text-orange-700',bg:'bg-orange-100' },
  SIGNATURE_DONE:              { label:'Signature Done',             color:'text-orange-700',bg:'bg-orange-100' },
  FILE_DISBURSED:              { label:'Loan Disbursed',             color:'text-green-700', bg:'bg-green-100' },
  DISBURSEMENT_VERIFIED:       { label:'Disbursement Verified',      color:'text-green-700', bg:'bg-green-100' },
  DISPATCH_INITIATED:          { label:'Materials Dispatched',       color:'text-cyan-700',  bg:'bg-cyan-100' },
  IN_TRANSIT:                  { label:'In Transit',                 color:'text-cyan-700',  bg:'bg-cyan-100' },
  DELIVERED:                   { label:'Delivered',                  color:'text-teal-700',  bg:'bg-teal-100' },
  MATERIAL_VERIFIED_BY_CONSUMER:   { label:'You Verified Materials', color:'text-emerald-700',bg:'bg-emerald-100' },
  INSTALLATION_SCHEDULED:      { label:'Installation Scheduled',     color:'text-emerald-700',bg:'bg-emerald-100' },
  INSTALLATION_IN_PROGRESS:    { label:'Installation in Progress',   color:'text-emerald-700',bg:'bg-emerald-100' },
  SOLAR_INSTALLED:             { label:'Solar Installed',            color:'text-emerald-700',bg:'bg-emerald-100' },
  POD_INSPECTION_INITIATED:    { label:'POD Inspection Started',     color:'text-purple-700', bg:'bg-purple-100' },
  POD_REJECTED:                { label:'POD Rejected',               color:'text-red-700',    bg:'bg-red-100' },
  POD_SUCCESSFUL:              { label:'POD Successful',             color:'text-purple-700', bg:'bg-purple-100' },
  PROJECT_COMMISSIONING:       { label:'Project Commissioning',      color:'text-purple-700', bg:'bg-purple-100' },
  SUBSIDY_REQUEST:             { label:'Subsidy Requested',          color:'text-pink-700',   bg:'bg-pink-100' },
  SUBSIDY_DISBURSED:           { label:'Subsidy Disbursed',          color:'text-pink-700',   bg:'bg-pink-100' },
  LEAD_COMPLETED:              { label:'Project Complete 🎉',        color:'text-emerald-800',bg:'bg-emerald-200' },
  REJECTED:                    { label:'Rejected',                   color:'text-red-700',    bg:'bg-red-100' },
};

export default function ConsumerDashboardPage() {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['consumer-dashboard'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: DashData }>('/consumer/dashboard');
      return res.data.data;
    },
    refetchInterval: 30000, // 30 seconds
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      <p className="text-slate-500 font-medium animate-pulse">Loading your portal...</p>
    </div>
  );
  if (isError) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8">
      <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-rose-400" />
      </div>
      <h2 className="text-xl font-black text-slate-700">Unable to load your portal</h2>
      <p className="text-slate-400 text-sm max-w-sm">There was a problem connecting to the server. Please check your connection and try again.</p>
      <button
        onClick={() => refetch()}
        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
  if (!data) return null;

  const { lead, pipeline, dispatch, inventory, status_logs } = data;
  const done = pipeline.filter(s => s.state === 'done').length;
  const pct = Math.round((done / pipeline.length) * 100);
  const current = pipeline.find(s => s.state === 'current');
  const meta = STATUS_META[lead.status] || { label: lead.status.replace(/_/g,' '), color:'text-slate-600', bg:'bg-slate-100' };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -right-10 w-1/2 h-full bg-indigo-500/20 blur-[100px] rounded-full rotate-12"/>
          <div className="absolute -bottom-1/2 -left-10 w-1/2 h-full bg-emerald-500/15 blur-[120px] rounded-full -rotate-12"/>
        </div>
        <div className="relative p-6 sm:p-10 flex flex-col sm:flex-row justify-between items-start gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold text-indigo-200 uppercase tracking-wider">
              <Activity className="w-3 h-3 text-emerald-400"/> ID: {lead.ulid.slice(-8)}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-emerald-300">{lead.beneficiary_name}</span>
            </h1>
            <div className="flex flex-wrap gap-3 text-sm font-medium text-slate-300">
              <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                <MapPin className="w-4 h-4 text-indigo-400"/>{lead.beneficiary_district}, {lead.beneficiary_state}
              </div>
              {lead.system_capacity && (
                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  <Zap className="w-4 h-4 text-amber-400"/>{lead.system_capacity} kW
                </div>
              )}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${meta.bg} ${meta.color}`}>
                {meta.label}
              </div>
            </div>
          </div>
          <button onClick={() => refetch()} disabled={isRefetching} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition text-slate-300 hover:text-white disabled:opacity-50">
            <RefreshCw className={`w-5 h-5 ${isRefetching ? 'animate-spin text-indigo-400' : ''}`}/>
          </button>
        </div>
        {/* Progress bar */}
        <div className="relative border-t border-white/10 bg-black/20 p-6 sm:px-10">
          <div className="flex justify-between items-end mb-3">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Milestone</div>
              <div className="text-lg font-black">{current ? current.label : 'Project Complete 🎉'}</div>
              {current && (
                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                  {current.desc}
                  {lead.status === 'INSTALLATION_SCHEDULED' && lead.installation_scheduled_at && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-lg font-black uppercase tracking-tighter border border-emerald-500/30">
                      Date: {new Date(lead.installation_scheduled_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">{pct}%</div>
          </div>
          <div className="h-3 bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-1000" style={{ width:`${pct}%` }}/>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <ScanLine className="w-5 h-5 text-indigo-600"/>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Installation Journey</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Track your progress</p>
            </div>
          </div>
          <div className="max-h-[500px] overflow-y-auto pr-1 space-y-0">
            {pipeline.map((step, i) => {
              const Icon = ICON_MAP[step.icon] || Clock;
              const isLast = i === pipeline.length - 1;
              return (
                <div key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all ${
                      step.state==='done' ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                      : step.state==='current' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-white border-slate-200 text-slate-300'
                    }`}>
                      {step.state==='done' ? <CheckCircle2 className="w-4 h-4"/> : <Icon className={`w-4 h-4 ${step.state==='current'?'animate-pulse':''}`}/>}
                    </div>
                    {!isLast && <div className={`w-0.5 flex-1 min-h-[20px] my-1 rounded-full ${step.state==='done'?'bg-emerald-300':'bg-slate-100'}`}/>}
                  </div>
                  <div className={`flex-1 pb-5 ${isLast?'pb-2':''}`}>
                    <div className="flex items-center justify-between gap-2 min-h-[36px]">
                      <div>
                        <span className={`font-bold text-sm ${step.state==='done'?'text-slate-700':step.state==='current'?'text-indigo-700':'text-slate-400'}`}>{step.label}</span>
                        {step.state==='current' && <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>}
                      </div>
                      {step.state==='current' && (
                        <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase border border-indigo-100">
                          <span className="w-1 h-1 rounded-full bg-indigo-500 animate-ping"/> Active
                        </span>
                      )}
                      {step.state==='done' && <span className="text-[10px] font-black text-emerald-600 shrink-0">✓</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Status Badge */}
          <div className={`rounded-2xl p-5 border ${meta.bg} border-opacity-50`}>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Current Status</p>
            <p className={`text-lg font-black ${meta.color}`}>{meta.label}</p>
            <p className="text-xs text-slate-500 mt-1">Last updated: {lead.updated_at}</p>
          </div>

          {/* Team */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <UserCircle2 className="w-4 h-4 text-indigo-400"/> Your Team
            </h3>
            <div className="space-y-3">
              {[
                { role:'Sales Executive', person:lead.assigned_agent },
                { role:'Site Surveyor', person:lead.assigned_surveyor },
                { role:'Installer', person:lead.assigned_installer },
              ].map((m,i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{m.role}</div>
                  {m.person ? (
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-sm truncate">{m.person.name}</span>
                      <a href={`tel:${m.person.mobile}`} className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition shrink-0 ml-2">
                        <Phone className="w-3.5 h-3.5"/>
                      </a>
                    </div>
                  ) : <span className="text-sm text-slate-400">To be assigned</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Project Details */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400"/> Project Details
            </h3>
            <div className="space-y-3">
              {[
                { label:'Govt. App No.', value:lead.govt_application_number||'Pending' },
                { label:'Loan Reference', value:lead.disbursement_reference||'Processing' },
                { label:'Applied On', value:new Date(lead.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) },
              ].map((item,i) => (
                <div key={i} className="flex flex-col gap-0.5 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                  <span className="text-xs font-bold text-slate-400">{item.label}</span>
                  <span className="text-sm font-semibold text-slate-700">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Survey Requirements */}
      {lead.survey_requirement && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-orange-50 flex items-center justify-between">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-500"/> Your System Specifications
            </h3>
            <span className="text-[10px] font-black bg-white px-3 py-1 rounded-full text-orange-600 border border-orange-200 uppercase tracking-widest">Survey Verified</span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              {[
                { label:'Capacity', value:`${lead.survey_requirement.system_capacity_kw} kW` },
                { label:'Panels', value:`${lead.survey_requirement.panel_quantity} units` },
                { label:'Panel Model', value:lead.survey_requirement.panel_model_make },
                { label:'Inverter', value:lead.survey_requirement.inverter_model_make },
                { label:'DC Wire', value:`${lead.survey_requirement.wire_length_meters} m` },
                { label:'Earthing Kit', value:lead.survey_requirement.earthing_kit_required?'Required':'Not Required' },
                { label:'Lightning Arrester', value:lead.survey_requirement.lightning_arrester_required?'Required':'Not Required' },
              ].map((s,i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                  <p className="text-sm font-black text-slate-800">{s.value}</p>
                </div>
              ))}
            </div>
            {lead.survey_requirement.additional_accessories.length > 0 && (
              <div>
                <p className="text-xs font-black text-slate-600 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-500"/> Additional Accessories Ordered:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {lead.survey_requirement.additional_accessories.map((acc, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl">
                      <span className="text-sm font-bold text-slate-700">{acc.item}</span>
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">Qty: {acc.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {lead.survey_requirement.site_notes && (
              <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-100 flex gap-3">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5"/>
                <p className="text-sm text-amber-800">{lead.survey_requirement.site_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dispatch Info + Inventory */}
      {dispatch && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-cyan-50 flex items-center justify-between">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <Truck className="w-5 h-5 text-cyan-600"/> Dispatch & Delivery Details
            </h3>
            <span className="text-[10px] font-black bg-white px-3 py-1 rounded-full text-cyan-600 border border-cyan-200 uppercase tracking-widest">Dispatched</span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              {[
                { label:'Dispatched On', value:dispatch.dispatched_at },
                { label:'Driver', value:dispatch.driver_name },
                { label:'Driver Mobile', value:dispatch.driver_mobile },
                { label:'Vehicle No.', value:dispatch.vehicle_number },
                ...(dispatch.receipt_number?[{ label:'Receipt No.', value:dispatch.receipt_number }]:[]),
              ].map((d,i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{d.label}</p>
                  <p className="text-sm font-black text-slate-800">{d.value}</p>
                </div>
              ))}
            </div>

            {inventory.length > 0 && (
              <div>
                <p className="text-xs font-black text-slate-600 mb-3 flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-teal-500"/> Materials in This Shipment:
                </p>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                  {inventory.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Qty: {item.quantity}{item.dispatched_at ? ` · Dispatched: ${item.dispatched_at}` : ''}</p>
                      </div>
                      {item.serial_number && (
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded shrink-0">SN: {item.serial_number}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {inventory.length === 0 && (
              <div className="text-center py-4 text-slate-400 text-sm">Inventory details will appear here once materials are recorded.</div>
            )}
          </div>
        </div>
      )}

      {/* Support Notifications */}
      {status_logs.some(l => l.notes?.includes('SUPPORT_RESOLVED')) && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-2 duration-300">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black text-emerald-900 uppercase tracking-wider">Support Query Resolved</h4>
            <p className="text-xs text-emerald-700 font-medium">Your recent support query has been addressed by our team. Check the activity log below for details.</p>
          </div>
        </div>
      )}

      {/* Activity Log */}
      {status_logs.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400"/> Recent Activity
          </h3>
          <div className="space-y-4">
            {status_logs.map((log, i) => {
              const isSupport = log.notes?.includes('SUPPORT_RESOLVED');
              const displayNote = isSupport 
                ? log.notes?.replace('SUPPORT_RESOLVED:', 'Support Update:') 
                : log.notes;

              return (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full ${isSupport ? 'bg-emerald-500' : 'bg-indigo-400'} shrink-0 mt-1.5`}/>
                    {i < status_logs.length-1 && <div className="w-px flex-1 bg-slate-100 my-1"/>}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm font-bold ${isSupport ? 'text-emerald-700' : 'text-slate-800'}`}>{log.to}</p>
                        {displayNote && !displayNote.includes('ADMIN_ACTION_REQUIRED') && !displayNote.includes('TEAM_ACTION_REQUIRED') && (
                          <p className="text-xs text-slate-500 mt-0.5">{displayNote}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-slate-500">{log.date}</p>
                        <p className="text-[10px] text-slate-400">{log.time}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
