'use client';
import AppShell from '@/components/layout/AppShell';

const KPIS = [
  { icon:'fas fa-heartbeat',   iconClass:'teal',    label:'INDICE GLOBAL',     value:'87', unit:'%',       chip:'Bon état',       chipType:'low' },
  { icon:'fas fa-exclamation-triangle', iconClass:'warning', label:'MOTEURS CRITIQUES',value:'3', unit:'',chip:'Intervention J+7',chipType:'high' },
  { icon:'fas fa-clock',       iconClass:'info',    label:'RUL MINIMUM',       value:'12', unit:'jours',   chip:'M4 critique',    chipType:'high' },
  { icon:'fas fa-shield-alt',  iconClass:'success', label:'MAINTENANCE OK',    value:'9',  unit:'moteurs', chip:'Planifiée',      chipType:'low' },
];

const MOTORS = [
  { id:'M1',  rul:142, di:0.32, risk:'normal',   trend:[40,42,38,44,41,43,45,42,44,43,41,42], label:'Moteur Principal A' },
  { id:'M2',  rul:89,  di:0.58, risk:'attention', trend:[50,52,55,54,58,61,59,63,65,62,68,65], label:'Moteur Ventilation B' },
  { id:'M3',  rul:34,  di:0.76, risk:'alarme',    trend:[60,65,70,72,75,78,80,82,85,88,90,92], label:'Moteur Pompe C' },
  { id:'M4',  rul:12,  di:0.91, risk:'critique',  trend:[70,76,80,83,87,90,93,95,97,98,99,99], label:'Moteur Convoyeur D' },
];

const RISK_COL: Record<string,string> = { normal:'#22c55e', attention:'#f59e0b', alarme:'#ef4444', critique:'#7f1d1d' };
const RISK_BG:  Record<string,string> = { normal:'#f0fdf4', attention:'#fffbeb', alarme:'#fff5f5', critique:'#fef2f2' };

function SparkLine({ data, color }: { data: number[], color: string }) {
  const W=140, H=40, PAD=4;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v,i) => {
    const x = PAD + i * ((W-2*PAD)/(data.length-1));
    const y = H-PAD - ((v-min)/(max-min||1)) * (H-2*PAD);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'140px',height:'40px',display:'block'}}>
      <defs>
        <linearGradient id={`gr${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`${pts} ${W-PAD},${H} ${PAD},${H}`} fill={`url(#gr${color.replace('#','')})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function RulGauge({ rul }: { rul: number }) {
  const pct = Math.min(100, (rul/180)*100);
  const color = rul<20?'#ef4444':rul<60?'#f59e0b':'#22c55e';
  return (
    <div style={{position:'relative',width:'90px',height:'90px',margin:'0 auto'}}>
      <svg viewBox="0 0 90 90" style={{width:'90px',height:'90px',transform:'rotate(-90deg)'}}>
        <circle cx="45" cy="45" r="36" fill="none" stroke="rgba(53,130,141,0.1)" strokeWidth="8"/>
        <circle cx="45" cy="45" r="36" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${2*Math.PI*36}`} strokeDashoffset={`${2*Math.PI*36*(1-pct/100)}`}
          strokeLinecap="round"/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <span style={{fontSize:'18px',fontWeight:800,color,fontFamily:'var(--mono)'}}>{rul}</span>
        <span style={{fontSize:'10px',color:'var(--text-body)'}}>jours</span>
      </div>
    </div>
  );
}

export default function PredictionPage() {
  return (
    <AppShell>
      <div className="page-container">
        {/* Header */}
        <div style={{marginBottom:'28px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
            <div style={{width:'48px',height:'48px',background:'linear-gradient(135deg,var(--primary-deeper),var(--primary))',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'22px'}}>
              <i className="fas fa-chart-line"/>
            </div>
            <div>
              <h1 style={{fontSize:'1.5rem',fontWeight:700,color:'var(--text-heading)',margin:0}}>Prédiction & Maintenance</h1>
              <p style={{color:'var(--text-body)',fontSize:'0.9rem',margin:'4px 0 0'}}>Modèles prédictifs basés sur l&apos;IA — Durée de vie résiduelle (RUL) et indice de dégradation (DI)</p>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'20px',marginBottom:'28px'}}>
          {KPIS.map((k,i)=>(
            <div key={i} className="kpi-card">
              <div className={`kpi-icon ${k.iconClass}`} style={{background: k.iconClass==='teal'?'linear-gradient(135deg,var(--accent-light),var(--secondary))':k.iconClass==='warning'?'linear-gradient(135deg,#fef3c7,#fcd34d)':k.iconClass==='info'?'linear-gradient(135deg,var(--secondary),var(--primary))':'linear-gradient(135deg,#d1fae5,#34d399)',color:k.iconClass==='warning'?'#b45309':k.iconClass==='info'?'white':'#065f46'}}>
                <i className={k.icon}/>
              </div>
              <div>
                <div className="kpi-label">{k.label}</div>
                <div className="kpi-value">{k.value}<span> {k.unit}</span></div>
                <div className={`kpi-chip chip-${k.chipType}`}>{k.chip}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Motor Cards */}
        <div style={{marginBottom:'24px'}}>
          <h3 style={{fontSize:'15px',fontWeight:700,color:'var(--text-heading)',margin:'0 0 16px',fontFamily:'var(--mono)',letterSpacing:'0.05em',textTransform:'uppercase',opacity:0.7}}>Analyse par moteur</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'18px'}}>
            {MOTORS.map(m=>(
              <div key={m.id} className="card" style={{background:RISK_BG[m.risk],borderColor:`${RISK_COL[m.risk]}33`}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <span style={{fontFamily:'var(--mono)',fontSize:'18px',fontWeight:800,color:'var(--text-heading)'}}>{m.id}</span>
                    <div>
                      <div style={{fontSize:'13px',fontWeight:600,color:'var(--text-heading)'}}>{m.label}</div>
                      <div style={{fontSize:'11px',color:'var(--text-body)'}}>DI: <strong style={{color:RISK_COL[m.risk]}}>{m.di}</strong></div>
                    </div>
                  </div>
                  <span style={{padding:'4px 12px',borderRadius:'20px',fontSize:'11px',fontWeight:700,background:`${RISK_COL[m.risk]}18`,color:RISK_COL[m.risk],border:`1px solid ${RISK_COL[m.risk]}33`,textTransform:'uppercase'}}>
                    {m.risk}
                  </span>
                </div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontSize:'11px',color:'var(--text-body)',marginBottom:'8px',fontWeight:600}}>Tendance DI (12 mois)</div>
                    <SparkLine data={m.trend} color={RISK_COL[m.risk]}/>
                  </div>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:'11px',color:'var(--text-body)',marginBottom:'8px',fontWeight:600}}>RUL estimé</div>
                    <RulGauge rul={m.rul}/>
                  </div>
                </div>
                <div style={{marginTop:'12px',padding:'10px 12px',background:'rgba(53,130,141,0.05)',borderRadius:'9px',border:'1px solid var(--border)',fontSize:'12px',color:'var(--text-body)'}}>
                  <i className="fas fa-info-circle" style={{marginRight:'6px',color:'var(--primary)'}}/> 
                  {m.risk==='critique' ? '⚠️ Arrêt planifié immédiat requis — risque de défaillance imminente' :
                   m.risk==='alarme'   ? '🔴 Intervention urgente recommandée dans les 7 prochains jours' :
                   m.risk==='attention'? '🟡 Surveiller — maintenance préventive à planifier sous 30 jours' :
                   '🟢 Opérationnel — état nominal, surveillance standard recommandée'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DI Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Indice de Dégradation — Vue comparative</div>
            <div className="card-sub">Tous les moteurs classés par criticité</div>
          </div>
          <div style={{padding:'8px 0'}}>
            {MOTORS.map(m=>(
              <div key={m.id} style={{display:'grid',gridTemplateColumns:'40px 1fr 60px',alignItems:'center',gap:'12px',marginBottom:'12px'}}>
                <span style={{fontFamily:'var(--mono)',fontSize:'13px',fontWeight:700,color:'var(--text-heading)',textAlign:'right'}}>{m.id}</span>
                <div style={{height:'18px',background:'rgba(53,130,141,0.07)',borderRadius:'20px',overflow:'hidden',border:'1px solid var(--border)'}}>
                  <div style={{height:'100%',width:`${m.di*100}%`,borderRadius:'20px',background:`linear-gradient(90deg,${RISK_COL[m.risk]},${RISK_COL[m.risk]}88)`,transition:'width 1s ease',boxShadow:`2px 0 8px ${RISK_COL[m.risk]}44`}}/>
                </div>
                <span style={{fontFamily:'var(--mono)',fontSize:'13px',fontWeight:700,color:'var(--text-heading)'}}>{m.di.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
