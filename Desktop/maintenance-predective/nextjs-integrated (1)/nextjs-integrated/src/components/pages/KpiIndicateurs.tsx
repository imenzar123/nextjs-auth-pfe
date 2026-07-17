'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';

interface KpiCard { icon: string; label: string; value: string; suffix: string; trend: string; trendLabel: string; color: string; }

const BIG_KPIS: KpiCard[] = [
  { icon:'fas fa-heartbeat',          label:'Santé globale',       value:'87',   suffix:'%',  trend:'↑ +2%',  trendLabel:'vs mois dernier', color:'#22c55e' },
  { icon:'fas fa-exclamation-triangle', label:'Anomalies détectées', value:'12',  suffix:'',   trend:'↓ -5',   trendLabel:'ce mois',         color:'#f59e0b' },
  { icon:'fas fa-clock',              label:'Uptime',               value:'99.8', suffix:'%',  trend:'✓ Stable', trendLabel:'30 jours',       color:'#22c55e' },
  { icon:'fas fa-bolt',               label:'Consommation',         value:'142',  suffix:'',   trend:'↑ +5',   trendLabel:'kWh/jour',        color:'#22c55e' },
];

const SMALL_KPIS_1 = [
  { icon:'fas fa-check-circle',      label:'Disponibilité équipements', value:'98.6%', trend:'↑ +2.3%', color:'#22c55e' },
  { icon:'fas fa-clock',             label:'MTBF',                      value:'120h',  trend:'↑ +1.5h', color:'#22c55e' },
  { icon:'fas fa-bell',              label:'Taux alertes',               value:'12%',   trend:'↓ -3%',  color:'#f59e0b' },
  { icon:'fas fa-bullseye',          label:'Pertinence alertes',         value:'87%',   trend:'↑ +5%',  color:'#379ba9' },
];

const SMALL_KPIS_2 = [
  { icon:'fas fa-sliders-h',         label:'Réglage vs dégradation',    value:'35%',   trend:'↓ -8%',  color:'#ef4444' },
  { icon:'fas fa-exclamation-triangle', label:'Prob. panne/système',    value:'23%',   trend:'— Stable', color:'#22c55e' },
  { icon:'fas fa-times-circle',      label:'Taux défaillance',           value:'5%',    trend:'↓ -2%',  color:'#22c55e' },
];

const ETAT_KPIS = [
  { icon:'fas fa-wave-square',       label:'Niveau vibration',          value:'7.3 mm/s', info:'Seuil: 8.0mm/s', statut:'Optimal',  statusColor:'#22c55e' },
  { icon:'fas fa-chart-line',        label:'Tendance évolution',         value:'Stable',   info:'MAJ: Aujourd\'hui',statut:'Normal',   statusColor:'#22c55e' },
  { icon:'fas fa-exclamation-circle',label:'Dépassement seuils',         value:'2',        info:'Actifs ce mois',  statut:'Attention',statusColor:'#f59e0b' },
  { icon:'fas fa-thermometer-half',  label:'Température moy.',           value:'67.4 °C',  info:'Seuil: 90°C',    statut:'Normal',   statusColor:'#22c55e' },
];

const MAINT_KPIS = [
  { icon:'fas fa-wrench',            label:'MTTR',                      value:'2.3h',     trend:'↑ +0.3h', color:'#f59e0b' },
  { icon:'fas fa-hard-hat',          label:'Incidents opérateurs',      value:'4',         trend:'↓ -2',    color:'#ef4444' },
  { icon:'fas fa-cogs',              label:'Interventions planifiées',   value:'3',         trend:'— Stable',color:'#379ba9' },
  { icon:'fas fa-dollar-sign',       label:'Coût maintenance',           value:'12.4k€',   trend:'↓ -8%',   color:'#22c55e' },
];

// SVG Bar chart for monthly data
function MonthlyBarChart() {
  const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  const values = [82,85,78,91,87,89,93,88,85,90,87,0];
  const W=520, H=160, PAD=32, BAR_W=28;
  const maxV=100;
  return (
    <svg viewBox={`0 0 ${W} ${H+PAD+10}`} style={{width:'100%',display:'block'}}>
      {[0,25,50,75,100].map(v=>(
        <g key={v}>
          <line x1={PAD} y1={H-(v/maxV)*H} x2={W-10} y2={H-(v/maxV)*H} stroke="rgba(53,130,141,0.1)" strokeDasharray="4 3"/>
          <text x={PAD-4} y={H-(v/maxV)*H+4} textAnchor="end" fontSize={9} fill="#94a3b8">{v}</text>
        </g>
      ))}
      {months.map((m,i)=>{
        const x = PAD+i*((W-PAD-10)/12)+6;
        const bh = values[i]>0 ? (values[i]/maxV)*H : 0;
        const color = values[i]>=90?'#22c55e':values[i]>=75?'#35828d':'#ef4444';
        return (
          <g key={m}>
            {values[i]>0 && <rect x={x} y={H-bh} width={BAR_W} height={bh} rx={4} fill={color} opacity={0.85}/>}
            {values[i]>0 && <text x={x+BAR_W/2} y={H-bh-4} textAnchor="middle" fontSize={9} fill={color} fontWeight="700">{values[i]}%</text>}
            <text x={x+BAR_W/2} y={H+PAD} textAnchor="middle" fontSize={9} fill="#94a3b8">{m}</text>
          </g>
        );
      })}
    </svg>
  );
}

// SVG Radar / spider chart
function SpiderChart() {
  const axes = ['Disponibilité','Performance','Qualité','Maintenabilité','Fiabilité','Sécurité'];
  const values = [98,87,93,76,89,95];
  const cx=130, cy=130, r=100;
  const points = axes.map((_,i)=>{
    const angle = (i/axes.length)*2*Math.PI - Math.PI/2;
    return { x: cx+Math.cos(angle)*r, y: cy+Math.sin(angle)*r };
  });
  const dataPoints = values.map((v,i)=>{
    const angle = (i/axes.length)*2*Math.PI - Math.PI/2;
    return { x: cx+Math.cos(angle)*(v/100)*r, y: cy+Math.sin(angle)*(v/100)*r };
  });
  const poly = dataPoints.map(p=>`${p.x},${p.y}`).join(' ');
  return (
    <svg viewBox="0 0 260 260" style={{width:'100%',maxWidth:'260px',display:'block',margin:'0 auto'}}>
      {[25,50,75,100].map(p=>{
        const pts = axes.map((_,i)=>{const a=(i/axes.length)*2*Math.PI-Math.PI/2;return `${cx+Math.cos(a)*(p/100)*r},${cy+Math.sin(a)*(p/100)*r}`;}).join(' ');
        return <polygon key={p} points={pts} fill="none" stroke="rgba(53,130,141,0.15)" strokeWidth={1}/>;
      })}
      {points.map((p,i)=><line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(53,130,141,0.2)" strokeWidth={1}/>)}
      <polygon points={poly} fill="rgba(53,130,141,0.2)" stroke="#35828d" strokeWidth={2}/>
      {dataPoints.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={5} fill="#35828d" stroke="white" strokeWidth={2}/>)}
      {points.map((p,i)=>{
        const label = axes[i];
        const tx = cx+(p.x-cx)*1.22, ty = cy+(p.y-cy)*1.22;
        return <text key={i} x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize={9.5} fill="#64748b" fontWeight="600">{label}</text>;
      })}
    </svg>
  );
}

export default function KpiIndicateursPage() {
  const [year, setYear]     = useState('2026');
  const [animated, setAnimated] = useState(false);

  useEffect(() => { const t = setTimeout(()=>setAnimated(true),100); return ()=>clearTimeout(t); },[]);

  return (
    <AppShell>
      <div className="page-container">
        {/* Page header */}
        <div style={{ background:'var(--bg-card)', padding:'18px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 12px var(--shadow)', borderRadius:'16px', marginBottom:'24px', flexWrap:'wrap', gap:'16px', border:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
            <div style={{ width:'48px', height:'48px', background:'linear-gradient(135deg,#379ba9,#35828d)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'20px' }}>
              <i className="fas fa-chart-bar"/>
            </div>
            <div>
              <h1 style={{fontSize:'22px',fontWeight:700,color:'var(--text-heading)',margin:0}}>Tableau de Bord KPI</h1>
              <p style={{fontSize:'13px',color:'var(--text-body)',margin:'4px 0 0'}}>Tableau de bord des performances — {year}</p>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <select value={year} onChange={e=>setYear(e.target.value)} style={{padding:'10px 16px',border:'1px solid var(--border)',borderRadius:'8px',fontSize:'14px',background:'var(--bg-card)',color:'var(--text-heading)',outline:'none',cursor:'pointer'}}>
              <option value="2026">2026</option><option value="2025">2025</option><option value="2024">2024</option>
            </select>
            <button style={{padding:'10px 20px',background:'var(--primary)',color:'white',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:'8px'}} onClick={()=>alert('Export KPI — fonctionnalité en cours de développement')}>
              <i className="fas fa-download"/> Exporter les KPI
            </button>
          </div>
        </div>

        {/* Big KPI cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginBottom:'24px'}}>
          {BIG_KPIS.map((k,i)=>(
            <div key={i} className="kpi-card" style={{flexDirection:'column',alignItems:'flex-start',gap:'8px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px',color:'var(--text-body)',fontSize:'13px'}}>
                <i className={k.icon}/><span>{k.label}</span>
              </div>
              <div style={{fontSize:'2.2rem',fontWeight:800,color:k.color,lineHeight:1,fontFamily:'var(--mono)'}}>
                {animated ? k.value : '0'}{k.suffix}
              </div>
              <div style={{display:'flex',justifyContent:'space-between',width:'100%',fontSize:'12px'}}>
                <span style={{color:k.color,fontWeight:600}}>{k.trend}</span>
                <span style={{color:'var(--text-body)'}}>{k.trendLabel}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Section 1 */}
        <h3 style={{fontSize:'16px',fontWeight:700,color:'var(--text-heading)',margin:'0 0 4px'}}>Vue Globale</h3>
        <p style={{fontSize:'13px',color:'var(--text-body)',margin:'0 0 16px'}}>Indicateurs de performance clés</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px',marginBottom:'16px'}}>
          {SMALL_KPIS_1.map((k,i)=>(
            <div key={i} style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'12px',padding:'16px',boxShadow:'0 2px 8px var(--shadow)'}}>
              <div style={{fontSize:'12px',color:'var(--text-body)',marginBottom:'8px',display:'flex',alignItems:'center',gap:'6px'}}><i className={k.icon}/>{k.label}</div>
              <div style={{fontSize:'1.6rem',fontWeight:800,color:k.color,fontFamily:'var(--mono)'}}>{k.value}</div>
              <div style={{fontSize:'11px',color:k.color,marginTop:'4px',fontWeight:600}}>{k.trend}</div>
            </div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'14px',marginBottom:'24px'}}>
          {SMALL_KPIS_2.map((k,i)=>(
            <div key={i} style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'12px',padding:'16px',boxShadow:'0 2px 8px var(--shadow)'}}>
              <div style={{fontSize:'12px',color:'var(--text-body)',marginBottom:'8px',display:'flex',alignItems:'center',gap:'6px'}}><i className={k.icon}/>{k.label}</div>
              <div style={{fontSize:'1.6rem',fontWeight:800,color:k.color,fontFamily:'var(--mono)'}}>{k.value}</div>
              <div style={{fontSize:'11px',color:k.color,marginTop:'4px',fontWeight:600}}>{k.trend}</div>
            </div>
          ))}
        </div>

        {/* Section 2 + Chart row */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px',marginBottom:'24px'}}>
          <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'14px',padding:'20px',boxShadow:'0 2px 12px var(--shadow)'}}>
            <h4 style={{margin:'0 0 16px',color:'var(--text-heading)',fontSize:'14px',fontWeight:700}}><i className="fas fa-chart-bar" style={{marginRight:'8px',color:'var(--primary)'}}/>Santé mensuelle (%)</h4>
            <MonthlyBarChart/>
          </div>
          <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'14px',padding:'20px',boxShadow:'0 2px 12px var(--shadow)'}}>
            <h4 style={{margin:'0 0 16px',color:'var(--text-heading)',fontSize:'14px',fontWeight:700}}><i className="fas fa-spider" style={{marginRight:'8px',color:'var(--primary)'}}/>Radar Performance</h4>
            <SpiderChart/>
          </div>
        </div>

        {/* Section état */}
        <h3 style={{fontSize:'16px',fontWeight:700,color:'var(--text-heading)',margin:'0 0 4px'}}>Indicateurs d&apos;État</h3>
        <p style={{fontSize:'13px',color:'var(--text-body)',margin:'0 0 16px'}}>État actuel des paramètres</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px',marginBottom:'24px'}}>
          {ETAT_KPIS.map((k,i)=>(
            <div key={i} style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'12px',padding:'16px',boxShadow:'0 2px 8px var(--shadow)'}}>
              <div style={{fontSize:'12px',color:'var(--text-body)',marginBottom:'8px',display:'flex',alignItems:'center',gap:'6px'}}><i className={k.icon}/>{k.label}</div>
              <div style={{fontSize:'1.4rem',fontWeight:800,color:'var(--text-heading)',fontFamily:'var(--mono)',marginBottom:'6px'}}>{k.value}</div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'11px'}}>
                <span style={{color:'var(--text-body)'}}>{k.info}</span>
                <span style={{color:k.statusColor,fontWeight:700}}>{k.statut}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Maintenance section */}
        <h3 style={{fontSize:'16px',fontWeight:700,color:'var(--text-heading)',margin:'0 0 4px'}}>Indicateurs de Maintenance</h3>
        <p style={{fontSize:'13px',color:'var(--text-body)',margin:'0 0 16px'}}>Données de maintenance préventive</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px',marginBottom:'24px'}}>
          {MAINT_KPIS.map((k,i)=>(
            <div key={i} style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'12px',padding:'16px',boxShadow:'0 2px 8px var(--shadow)'}}>
              <div style={{fontSize:'12px',color:'var(--text-body)',marginBottom:'8px',display:'flex',alignItems:'center',gap:'6px'}}><i className={k.icon}/>{k.label}</div>
              <div style={{fontSize:'1.6rem',fontWeight:800,color:k.color,fontFamily:'var(--mono)'}}>{k.value}</div>
              <div style={{fontSize:'11px',color:k.color,marginTop:'4px',fontWeight:600}}>{k.trend}</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
