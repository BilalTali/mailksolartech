import { useState, useMemo } from "react";
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import SEOHead from '@/components/shared/SEOHead';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from "recharts";
import { Sun, Building2, Wallet, Key, Zap, TrendingDown, Lightbulb, Calculator } from "lucide-react";

/* ─── DATA (exact from table, verified) ─── */
const SYSTEMS = [
  { id:"3kw",   label:"3 kW",   cost:159500, subsidy:94800,  share:64700,  down:8500,  uMin:300, uMax:400  },
  { id:"3.3kw", label:"3.3 kW", cost:169000, subsidy:94800,  share:74200,  down:9000,  uMin:350, uMax:450  },
  { id:"4kw",   label:"4 kW",   cost:209000, subsidy:94800,  share:114200, down:22000, uMin:400, uMax:500  },
  { id:"5kw",   label:"5 kW",   cost:258500, subsidy:94800,  share:163700, down:26500, uMin:500, uMax:600  },
  { id:"5.5kw", label:"5.5 kW", cost:279000, subsidy:94800,  share:184200, down:28500, uMin:550, uMax:650  },
  { id:"6kw",   label:"6 kW",   cost:308000, subsidy:94800,  share:213200, down:28500, uMin:600, uMax:700  },
  { id:"7kw",   label:"7 kW",   cost:357500, subsidy:144300, share:213200, down:31800, uMin:600, uMax:700  },
  { id:"8kw",   label:"8 kW",   cost:407000, subsidy:144300, share:262700, down:37000, uMin:700, uMax:900  },
  { id:"9kw",   label:"9 kW",   cost:457000, subsidy:194300, share:262700, down:37000, uMin:700, uMax:1000 },
  { id:"10kw",  label:"10 kW",  cost:507000, subsidy:145300, share:361700, down:46600, uMin:900, uMax:1100 },
];

const inr  = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const fmtK = (n: number) => {
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  if (n >= 1000)   return "₹" + (n / 1000).toFixed(0) + "k";
  return "₹" + n;
};

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-xl text-sm animate-in zoom-in-95 duration-200">
      <p className="text-slate-500 font-bold mb-2 uppercase tracking-wide text-xs">Year {label}</p>
      <div className="space-y-1.5">
          {payload.map(p => (
            <div key={p.name} className="flex items-center justify-between gap-4 font-bold" style={{ color: p.color }}>
                <span>{p.name}</span>
                <span>{fmtK(Math.round(p.value))}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

export default function SolarCalculator() {
  const [selected, setSelected] = useState("4kw");
  const [rate, setRate]         = useState(6);

  const sys         = SYSTEMS.find(s => s.id === selected)!;
  const avgUnits    = (sys.uMin + sys.uMax) / 2;
  const monthlySave = Math.round(avgUnits * rate);
  const annualSave  = monthlySave * 12;
  const paybackYrs  = annualSave > 0 ? sys.share / annualSave : 0;
  const breakEvenYr = Math.ceil(paybackYrs);
  const subsidyPct  = Math.round((sys.subsidy / sys.cost) * 100);
  const netAt       = (yr: number) => Math.max(0, yr * annualSave - sys.share);

  const chartData = useMemo(() => Array.from({ length: 26 }, (_, yr) => ({
    year: yr,
    "Grid Bills (no solar)": Math.round(yr * annualSave),
    "Solar Investment":       Math.round(sys.share),
    "Your Net Savings":       Math.round(Math.max(0, yr * annualSave - sys.share)),
  })), [sys.share, annualSave]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col selection:bg-orange-100 selection:text-orange-900">
      <SEOHead 
          title="PM Surya Ghar Rooftop Solar Subsidy Calculator" 
          description="Calculate your PM Surya Ghar Muft Bijli Yojana subsidy, monthly savings, and ROI estimate with our easy-to-use solar capacity calculator."
      />
      <Navbar />
      <main className="flex-grow w-full relative">
      
      {/* Decorative Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-orange-50/80 via-white/40 to-transparent pointer-events-none" />

      {/* HERO SECTION */}
      <div className="relative pt-20 pb-16 px-6 text-center border-b border-slate-200/50 bg-white/40 backdrop-blur-3xl">
        <div className="inline-flex items-center gap-2 bg-orange-100/50 backdrop-blur-sm border border-orange-200 rounded-full px-5 py-2 text-sm color-orange-700 text-orange-700 font-bold mb-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Sun className="w-4 h-4 text-orange-500" /> PM Surya Ghar Muft Bijli Yojana
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
          Rooftop Solar <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">Savings Calculator</span>
        </h1>
        <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
          Select your system — see exactly the government subsidy you will receive, your net cost, and when your panels start earning you money.
        </p>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-8">

        {/* ══ CALCULATOR 1: BREAKDOWN ══ */}
        <section className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-[2rem] p-6 md:p-10 shadow-2xl shadow-slate-200/50 animate-in fade-in zoom-in-95 duration-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <h2 className="text-2xl font-black flex items-center gap-3">
                <Calculator className="w-8 h-8 text-indigo-500" />
                System & Subsidy Breakdown
            </h2>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 shadow-inner rounded-2xl px-5 py-3 transition-colors hover:border-orange-200 hover:bg-orange-50/30">
              <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Tariff Rate</span>
              <span className="font-black text-xl text-slate-300">|</span>
              <div className="flex items-center text-orange-600 font-black text-xl">
                  <span>₹</span>
                  <input
                    type="number" min="1" max="30" step="0.5" value={rate}
                    onChange={e => setRate(Math.max(1, Number(e.target.value) || 6))}
                    className="w-16 bg-transparent border-none text-center outline-none focus:ring-0 p-0 ml-1"
                  />
                  <span className="text-sm text-slate-400 font-bold lowercase ml-1">/unit</span>
              </div>
            </div>
          </div>

          {/* Capacity selection */}
          <div className="flex flex-wrap gap-3 mb-10 pb-8 border-b border-slate-100">
            {SYSTEMS.map(s => {
                const isSelected = selected === s.id;
                return (
                  <button 
                      key={s.id} 
                      onClick={() => setSelected(s.id)} 
                      className={`
                          px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ease-out flex-shrink-0
                          ${isSelected 
                              ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30 scale-105 border-transparent' 
                              : 'bg-slate-50 text-slate-500 border border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                          }
                      `}
                  >
                    {s.label}
                  </button>
                );
            })}
          </div>

          {/* Stat cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {[
              { label:"Project Cost",          value:inr(sys.cost),          sub:"Full installation",                icon: <Building2 className="w-5 h-5"/>, accent:false },
              { label:"Govt. Subsidy",         value:inr(sys.subsidy),       sub:`${subsidyPct}% of project cost`,   icon: <img src="/favicon.png" className="w-5 h-5 object-contain grayscale opacity-60" alt="" />, accent:true  },
              { label:"Your Final Share",      value:inr(sys.share),         sub:"What you actually pay",            icon: <Wallet className="w-5 h-5"/>, accent:false },
              { label:"Down Payment",          value:inr(sys.down),          sub:"To begin install",                 icon: <Key className="w-5 h-5"/>, accent:false },
              { label:"Units Generated",       value:`${sys.uMin}–${sys.uMax}`, sub:`avg ${avgUnits} kWh/month`,    icon: <Zap className="w-5 h-5"/>, accent:false },
              { label:"Monthly Save",          value:inr(monthlySave),       sub:`${avgUnits} units × ₹${rate}`,    icon: <TrendingDown className="w-5 h-5"/>, accent:true  },
            ].map(c => (
              <div key={c.label} className={`
                  relative overflow-hidden rounded-[1.5rem] p-6 border transition-all duration-300 hover:scale-[1.02]
                  ${c.accent ? 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/60 shadow-inner' : 'bg-slate-50 border-slate-200/60'}
              `}>
                <div className={`mb-4 w-10 h-10 rounded-full flex items-center justify-center ${c.accent ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : 'bg-white text-slate-400 border border-slate-200'}`}>
                    {c.icon}
                </div>
                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5">
                  {c.label}
                </div>
                <div className={`text-2xl font-black tracking-tight ${c.accent ? 'text-orange-600' : 'text-slate-900'}`}>
                  {c.value}
                </div>
                <div className="text-xs text-slate-400 font-medium mt-2">{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Subsidy Progress Bar */}
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
            <div className="flex justify-between text-sm mb-3">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Subsidy Coverage</span>
              <span className="text-orange-600 font-black">Saves {inr(sys.subsidy)} ({subsidyPct}%)</span>
            </div>
            <div className="h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner">
              <div 
                  className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-1000 ease-out relative" 
                  style={{ width: `${subsidyPct}%` }}
              >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]" />
              </div>
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-400 mt-3 px-1">
              <span>You pay: <strong className="text-slate-800">{inr(sys.share)}</strong></span>
              <span>Govt covers: <strong className="text-orange-600">{inr(sys.subsidy)}</strong></span>
            </div>
          </div>

          {sys.id === "7kw" || sys.id === "8kw" || sys.id === "9kw" || sys.id === "10kw" ? (
            <div className="mt-6 flex items-start gap-4 p-5 bg-blue-50/50 backdrop-blur-sm border border-blue-200/60 rounded-2xl text-blue-700">
              <div className="p-2 bg-blue-100 rounded-full text-blue-600 shrink-0"><Lightbulb className="w-4 h-4"/></div>
              <p className="text-sm font-medium leading-relaxed">
                  For <strong>{sys.label}</strong> systems, the effective subsidy includes additional state or scheme benefits beyond the standard ₹94,800 central cap.
              </p>
            </div>
          ) : null}
        </section>

        {/* ══ CALCULATOR 2: SAVINGS GRAPH ══ */}
        <section className="bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-[2rem] p-6 md:p-10 shadow-2xl shadow-slate-200/50">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-8 mb-10 pb-8 border-b border-slate-100">
            <div>
              <h2 className="text-2xl font-black mb-2 flex items-center gap-3">
                  <TrendingDown className="w-8 h-8 text-emerald-500" />
                  When Does It Pay For Itself?
              </h2>
              <p className="text-slate-500 font-medium">Viewing projection for {sys.label} system at ₹{rate}/unit tariff over 25 years.</p>
            </div>
            <div className="bg-orange-50/50 backdrop-blur-md border px-10 py-6 rounded-[2rem] border-orange-200 text-center shrink-0">
              <div className="text-[10px] text-orange-600 font-black uppercase tracking-widest mb-2">Breaks Even In</div>
              <div className="text-5xl font-black text-orange-600 tracking-tighter">
                {paybackYrs.toFixed(1)}<span className="text-xl font-bold ml-1.5">yrs</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
              {/* Row 1: Gross Savings */}
              <div>
                <div className="text-xs font-black text-slate-400 tracking-widest mb-5">ELECTRICITY BILLS AVOIDED (GROSS)</div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label:"1 Year",   val:inr(annualSave),       clr:"text-emerald-600" },
                    { label:"5 Years", val:inr(annualSave * 5),   clr:"text-emerald-600" },
                    { label:"10 Years",val:inr(annualSave * 10),  clr:"text-emerald-600" },
                    { label:"25 Years",val:inr(annualSave * 25),  clr:"text-emerald-600" },
                  ].map(p => (
                    <div key={p.label} className="bg-emerald-50/50 border border-emerald-100/60 rounded-2xl p-4 transition-all hover:bg-emerald-50">
                      <div className="text-[10px] text-emerald-600/60 font-black uppercase tracking-widest mb-1.5">{p.label}</div>
                      <div className={`text-xl font-black ${p.clr}`}>{p.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 2: Net Profit */}
              <div>
                <div className="text-xs font-black text-slate-400 tracking-widest mb-5 uppercase">
                    Net Profit After {fmtK(sys.share)} Investment
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label:"5 Years",  val: netAt(5)  > 0 ? inr(netAt(5))  : "Not yet", clr: netAt(5)  > 0 ? "text-blue-600" : "text-slate-400" },
                    { label:"10 Years", val: netAt(10) > 0 ? inr(netAt(10)) : "Not yet", clr: netAt(10) > 0 ? "text-indigo-600" : "text-slate-400" },
                    { label:"25 Years", val: inr(netAt(25)), clr:"text-orange-600", colSpan: true },
                  ].map(p => (
                    <div key={p.label} className={`border border-slate-100 rounded-2xl p-4 transition-all hover:border-slate-200 ${p.colSpan ? 'col-span-2 bg-orange-50/40 border-orange-100/60' : 'bg-slate-50'}`}>
                      <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5 flex justify-between">
                          {p.label}
                          {p.label === "5 Years" && netAt(5) > 0 && (
                            <span className="text-slate-300 font-medium normal-case tracking-normal">(Saved - Cost)</span>
                          )}
                      </div>
                      <div className={`text-xl md:text-2xl font-black ${p.clr}`}>{p.val}</div>
                    </div>
                  ))}
                </div>
              </div>
          </div>

          {/* Chart Wrapper */}
          <div className="h-80 md:h-[28rem] mb-8 bg-slate-50/50 rounded-3xl p-4 border border-slate-100">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top:20, right:20, left:0, bottom:10 }}>
                <defs>
                  <linearGradient id="gGrid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gSolar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.15}/>
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gSave" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false}/>
                <XAxis dataKey="year" tickFormatter={v=>`Yr ${v}`} tick={{ fill:"#94a3b8", fontSize:12, fontWeight: 600 }} axisLine={{ stroke:"#e2e8f0" }} tickLine={false} interval={4} dy={10}/>
                <YAxis tickFormatter={fmtK} tick={{ fill:"#94a3b8", fontSize:11, fontWeight: 600 }} axisLine={false} tickLine={false} width={68} dx={-10}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Legend wrapperStyle={{ fontSize: 13, fontWeight: 700, paddingTop: 20 }} iconType="circle"/>
                <ReferenceLine
                  x={breakEvenYr} stroke="#ea580c" strokeDasharray="6 4" strokeWidth={2}
                  label={{ value:`✓ Paid off ~Yr ${breakEvenYr}`, fill:"#ea580c", fontSize:12, fontWeight:800, position:"insideTopRight", offset: 15 }}
                />
                <Area type="monotone" dataKey="Grid Bills (no solar)"  stroke="#ef4444" strokeWidth={2} strokeDasharray="6 6" fill="url(#gGrid)"  dot={false}/>
                <Area type="monotone" dataKey="Solar Investment"        stroke="#f97316" strokeWidth={3}                   fill="url(#gSolar)" dot={false}/>
                <Area type="monotone" dataKey="Your Net Savings"        stroke="#10b981" strokeWidth={3}                   fill="url(#gSave)"  dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 rounded-3xl p-6 mb-10 border border-slate-100">
            {[
              { clr:"bg-red-500", lbl:"Grid Bills (no solar)",  desc:`${inr(annualSave)}/yr forever → ${inr(annualSave*25)} over 25 years` },
              { clr:"bg-orange-500", lbl:"Solar Investment",        desc:`One-time ${inr(sys.share)}. No electricity bill after that` },
              { clr:"bg-emerald-500", lbl:"Your Net Savings",        desc:`Pure profit post break-even → ${inr(netAt(25))} in 25 yrs` },
            ].map(l => (
              <div key={l.lbl} className="flex gap-4">
                <div className={`w-3.5 h-3.5 rounded-full ${l.clr} mt-1 shrink-0 shadow-sm`} />
                <div>
                  <div className="text-sm font-bold text-slate-800 mb-1">{l.lbl}</div>
                  <div className="text-xs text-slate-500 leading-relaxed font-medium">{l.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Final Callout */}
          <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-3xl p-6 md:p-8 flex gap-5 md:items-center flex-col md:flex-row relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400 opacity-10 rounded-bl-full pointer-events-none" />
            <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl shrink-0 self-start md:self-center shadow-inner">
                <Lightbulb className="w-8 h-8" />
            </div>
            <div>
              <strong className="text-emerald-800 text-lg block mb-2">
                After year {breakEvenYr}, every unit of electricity is yours securely—free.
              </strong>
              <p className="text-emerald-700/80 text-sm font-medium leading-relaxed max-w-3xl">
                Your <strong className="text-emerald-800">{sys.label}</strong> system generates ~{avgUnits} units/month. At ₹{rate}/unit that's{" "}
                <strong className="text-emerald-800">{inr(monthlySave)}/month</strong> ({inr(annualSave)}/year) you no longer pay to the grid.
                Over 25 years: relying on the grid would have cost <strong className="text-emerald-800">{inr(annualSave*25)}</strong> versus your one-time{" "}
                solar cost of <strong className="text-emerald-800">{inr(sys.share)}</strong> — delivering a net total saving of <strong className="text-orange-600">{inr(netAt(25))}</strong>!
              </p>
            </div>
          </div>
        </section>

        <p className="text-center text-slate-400 text-xs mt-8 max-w-4xl mx-auto px-4 leading-relaxed font-medium">
          * Generation estimates based on average irradiance. Savings assume full self-consumption at ₹{rate}/unit.
          For 7–10 kW systems, effective subsidy includes state + central scheme benefits. Consult your empanelled vendor for exact figures customized to your roof direction.
        </p>
      </div>

      </main>
      <Footer />
    </div>
  );
}