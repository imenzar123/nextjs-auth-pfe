'use client';
import { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';

interface Moteur { id: number; nom: string; code: string; type: string; x: number; y: number; z: number; temperature: number; courant: number; vitesse: number; statut: 'normal'|'attention'|'alarme'; alerts: string[]; }

const INITIAL_DATA: Moteur[] = [
  { id:1, nom:'Moteur 1600 App Cylindre', code:'68C11F06', type:'Moteur 1600 App Cylindre',  x:2.4, y:1.8, z:3.2, temperature:45, courant:32.5, vitesse:1450, statut:'normal',    alerts:[] },
  { id:2, nom:'Pompe Centrifuge',          code:'68C11F07', type:'Pompe Centrifuge',           x:5.8, y:4.2, z:6.1, temperature:72, courant:45.2, vitesse:1780, statut:'attention', alerts:['Vibration élevée'] },
  { id:3, nom:'Ventilation Principal',     code:'68C11F08', type:'Ventilation Principal',      x:1.2, y:0.9, z:1.5, temperature:38, courant:18.3, vitesse:1420, statut:'normal',    alerts:[] },
  { id:4, nom:'Compresseur Air',           code:'68C11F09', type:'Compresseur Principal',      x:8.9, y:7.5, z:9.2, temperature:95, courant:58.7, vitesse:2950, statut:'alarme',    alerts:['Température critique','Vibration excessive'] },
  { id:5, nom:'Convoyeur Bande A',         code:'68C11F10', type:'Convoyeur Bande',            x:3.1, y:2.7, z:4.0, temperature:52, courant:28.9, vitesse:720,  statut:'normal',    alerts:[] },
  { id:6, nom:'Refroidissement',           code:'68C11F11', type:'Tour de Refroidissement',    x:4.5, y:3.8, z:5.2, temperature:65, courant:35.4, vitesse:960,  statut:'attention', alerts:['Température élevée'] },
  { id:7, nom:'Extraction Fumées',         code:'68C11F12', type:'Extraction',                 x:1.8, y:1.4, z:2.1, temperature:42, courant:22.1, vitesse:1440, statut:'normal',    alerts:[] },
  { id:8, nom:'Presse Hydraulique',        code:'68C11F13', type:'Presse Hydraulique',         x:7.2, y:6.5, z:8.0, temperature:88, courant:52.8, vitesse:2100, statut:'alarme',    alerts:['Surintensité','Vibration critique'] },
];

const statusColor: Record<string,string> = { normal:'#22c55e', attention:'#f59e0b', alarme:'#ef4444' };
const statusLabel: Record<string,string> = { normal:'Normal', attention:'Attention', alarme:'Alarme' };

function jitter(v: number, range=0.15) { return parseFloat(Math.max(0, v + (Math.random()-0.5)*v*range).toFixed(1)); }

function GaugeBar({value,max,color}:{value:number,max:number,color:string}) {
  const pct = Math.min(100, (value/max)*100);
  return (
    <div style={{background:'rgba(0,0,0,0.06)',borderRadius:'6px',height:'8px',overflow:'hidden',marginTop:'4px'}}>
      <div style={{width:`${pct}%`,height:'100%',background:color,borderRadius:'6px',transition:'width 0.8s ease'}}/>
    </div>
  );
}

export default function TempsReelPage() {
  const [moteurs, setMoteurs]   = useState<Moteur[]>(INITIAL_DATA);
  const [search, setSearch]     = useState('');
  const [lastUpdate, setLastUpdate] = useState('');
  const [updating, setUpdating] = useState(false);

  const updateTime = () => setLastUpdate(new Date().toLocaleTimeString('fr-FR'));

  const actualiser = useCallback(() => {
    setUpdating(true);
    setTimeout(() => {
      setMoteurs(ms => ms.map(m => ({ ...m, x: jitter(m.x), y: jitter(m.y), z: jitter(m.z), temperature: jitter(m.temperature,0.1), courant: jitter(m.courant,0.12), vitesse: jitter(m.vitesse,0.05) })));
      updateTime();
      setUpdating(false);
    }, 600);
  }, []);

  useEffect(() => { updateTime(); const t = setInterval(actualiser, 8000); return () => clearInterval(t); }, [actualiser]);

  const filtered = moteurs.filter(m => m.nom.toLowerCase().includes(search.toLowerCase()) || m.code.toLowerCase().includes(search.toLowerCase()) || m.type.toLowerCase().includes(search.toLowerCase()));
  const counts = { normal: moteurs.filter(m=>m.statut==='normal').length, attention: moteurs.filter(m=>m.statut==='attention').length, alarme: moteurs.filter(m=>m.statut==='alarme').length };

  return (
    <AppShell>
      <div style={{padding:'20px 24px 40px',maxWidth:'1600px'}}>
        {/* Dashboard Header */}
        <div style={{ background:'var(--bg-card)', padding:'16px 24px', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'16px', marginBottom:'24px', boxShadow:'0 2px 12px var(--shadow)', border:'1px solid var(--border)' }}>
          <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
            <div style={{width:'48px',height:'48px',background:'linear-gradient(135deg,var(--primary),var(--primary-dark))',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'20px'}}>
              <i className="fas fa-industry"/>
            </div>
            <div>
              <h1 style={{fontSize:'20px',fontWeight:700,color:'var(--text-heading)',margin:0}}>Monitoring Temps Réel</h1>
              <p style={{fontSize:'12px',color:'var(--text-body)',margin:'3px 0 0'}}>
                Dernière mise à jour : <strong>{lastUpdate}</strong>
                <span style={{marginLeft:'8px',display:'inline-flex',alignItems:'center',gap:'4px'}}>
                  <span style={{width:'7px',height:'7px',borderRadius:'50%',background:'#22c55e',display:'inline-block',animation:'pulse 2s infinite'}}/>
                  <span style={{fontSize:'11px',color:'#22c55e',fontWeight:700}}>LIVE</span>
                </span>
              </p>
            </div>
          </div>
          <div style={{display:'flex',gap:'12px',alignItems:'center',flexWrap:'wrap'}}>
            {[{k:'normal',l:'Actifs'},{k:'attention',l:'Attentions'},{k:'alarme',l:'Alarmes'}].map(({k,l})=>(
              <div key={k} style={{textAlign:'center',padding:'10px 18px',borderRadius:'10px',background:k==='normal'?'#f0fdf4':k==='attention'?'#fffbeb':'#fff5f5',minWidth:'80px'}}>
                <span style={{display:'block',fontSize:'26px',fontWeight:800,color:statusColor[k],fontFamily:'var(--mono)'}}>{(counts as Record<string,number>)[k]}</span>
                <span style={{fontSize:'11px',fontWeight:600,color:statusColor[k]}}>{l}</span>
              </div>
            ))}
            <input type="text" placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{padding:'9px 14px',border:'1px solid var(--border)',borderRadius:'8px',fontSize:'14px',background:'var(--bg-card)',color:'var(--text-heading)',outline:'none',width:'180px'}}/>
            <button onClick={actualiser} disabled={updating}
              style={{padding:'9px 18px',background:updating?'#94a3b8':'var(--primary)',color:'white',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:'7px',transition:'background 0.2s'}}>
              <i className={`fas fa-sync-alt${updating?' fa-spin':''}`}/> Actualiser
            </button>
          </div>
        </div>

        {/* Moteurs Grid */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:'18px'}}>
          {filtered.map(m=>{
            const border = statusColor[m.statut];
            return (
              <div key={m.id} style={{ background:'var(--bg-card)', borderRadius:'14px', border:`1px solid ${border}33`, boxShadow:`0 4px 16px ${border}18`, overflow:'hidden', transition:'transform 0.2s,box-shadow 0.2s' }}
                onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLDivElement).style.boxShadow=`0 12px 28px ${border}28`;}}
                onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(0)';(e.currentTarget as HTMLDivElement).style.boxShadow=`0 4px 16px ${border}18`;}}>
                {/* Card header */}
                <div style={{background:`linear-gradient(135deg,${border}22,${border}08)`,padding:'14px 18px',borderBottom:`1px solid ${border}22`,display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div>
                    <div style={{fontSize:'14px',fontWeight:700,color:'var(--text-heading)'}}>{m.nom}</div>
                    <div style={{fontSize:'11px',color:'var(--text-body)',marginTop:'2px',fontFamily:'var(--mono)'}}>{m.code} · {m.type}</div>
                  </div>
                  <span style={{padding:'4px 12px',borderRadius:'20px',fontSize:'11px',fontWeight:700,background:`${border}18`,color:border,border:`1px solid ${border}33`}}>
                    {statusLabel[m.statut]}
                  </span>
                </div>
                {/* Data grid */}
                <div style={{padding:'14px 18px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                  {[
                    {l:'Vibration X',v:m.x,unit:'mm/s',max:10,color:'var(--primary)'},
                    {l:'Vibration Y',v:m.y,unit:'mm/s',max:10,color:'var(--secondary)'},
                    {l:'Vibration Z',v:m.z,unit:'mm/s',max:10,color:'var(--primary-dark)'},
                    {l:'Courant',v:m.courant,unit:'A',max:80,color:'#f59e0b'},
                  ].map(({l,v,unit,max,color})=>(
                    <div key={l} style={{padding:'10px 12px',background:'rgba(53,130,141,0.04)',borderRadius:'9px',border:'1px solid var(--border)'}}>
                      <div style={{fontSize:'11px',color:'var(--text-body)',marginBottom:'3px'}}>{l}</div>
                      <div style={{fontSize:'16px',fontWeight:700,color:'var(--text-heading)',fontFamily:'var(--mono)'}}>{v} <span style={{fontSize:'11px',fontWeight:400,color:'var(--text-body)'}}>{unit}</span></div>
                      <GaugeBar value={v} max={max} color={color}/>
                    </div>
                  ))}
                </div>
                {/* Temperature + vitesse row */}
                <div style={{padding:'0 18px 14px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                  <div style={{padding:'10px 12px',background: m.temperature>=90?'rgba(239,68,68,0.05)':m.temperature>=70?'rgba(245,158,11,0.05)':'rgba(34,197,94,0.05)',borderRadius:'9px',border:`1px solid ${m.temperature>=90?'rgba(239,68,68,0.2)':m.temperature>=70?'rgba(245,158,11,0.2)':'rgba(34,197,94,0.2)'}`}}>
                    <div style={{fontSize:'11px',color:'var(--text-body)',marginBottom:'3px'}}>Température</div>
                    <div style={{fontSize:'18px',fontWeight:800,color:m.temperature>=90?'#ef4444':m.temperature>=70?'#f59e0b':'#22c55e',fontFamily:'var(--mono)'}}>{m.temperature}°C</div>
                    <GaugeBar value={m.temperature} max={120} color={m.temperature>=90?'#ef4444':m.temperature>=70?'#f59e0b':'#22c55e'}/>
                  </div>
                  <div style={{padding:'10px 12px',background:'rgba(53,130,141,0.04)',borderRadius:'9px',border:'1px solid var(--border)'}}>
                    <div style={{fontSize:'11px',color:'var(--text-body)',marginBottom:'3px'}}>Vitesse</div>
                    <div style={{fontSize:'18px',fontWeight:800,color:'var(--primary)',fontFamily:'var(--mono)'}}>{m.vitesse} <span style={{fontSize:'11px',fontWeight:400,color:'var(--text-body)'}}>RPM</span></div>
                    <GaugeBar value={m.vitesse} max={3000} color="var(--primary)"/>
                  </div>
                </div>
                {/* Alerts */}
                {m.alerts.length>0 && (
                  <div style={{margin:'0 18px 14px',padding:'10px 12px',background:'rgba(239,68,68,0.06)',borderRadius:'9px',border:'1px solid rgba(239,68,68,0.2)'}}>
                    {m.alerts.map((a,i)=>(
                      <div key={i} style={{fontSize:'12px',color:'#ef4444',display:'flex',alignItems:'center',gap:'7px',marginBottom:i<m.alerts.length-1?'5px':0}}>
                        <i className="fas fa-exclamation-circle"/>{a}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(1.4); } }
      `}</style>
    </AppShell>
  );
}
