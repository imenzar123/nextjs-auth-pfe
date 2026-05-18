'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';

const KPIS = [
  { icon:'fas fa-industry',           label:'Moteurs actifs',     value:'12',  unit:'',  chip:'Tous opérationnels', chipType:'low' as const },
  { icon:'fas fa-chart-line',         label:'Santé globale',      value:'87',  unit:'%', chip:'Bon état général',    chipType:'low' as const },
  { icon:'fas fa-exclamation-triangle', label:'Anomalies actives', value:'3',   unit:'',  chip:'Intervention requise',chipType:'high' as const },
  { icon:'fas fa-clock',              label:'Uptime système',     value:'99.8',unit:'%', chip:'Stable',              chipType:'low' as const },
];

const MODULES = [
  { href:'/moteurs',           icon:'fas fa-cog',           title:'Configuration des moteurs',  desc:'Ajout et gestion des caractéristiques techniques des moteurs électriques', badge:'⚡ 12 moteurs actifs' },
  { href:'/historique-graphe', icon:'fas fa-chart-line',    title:'Historique des données',      desc:'Consultation graphique des grandeurs physiques des moteurs entre deux dates', badge:'📅 30 jours de données' },
  { href:'/alertes-moteurs',   icon:'fas fa-exclamation-circle', title:'Liste des alertes',     desc:'Gestion des seuils min/max d\'alerte pour chaque paramètre et moteur', badge:'⚙ 8 seuils configurés' },
  { href:'/historique-alertes',icon:'fas fa-clipboard-list',title:'Log des alertes',            desc:'Affichage des événements d\'alerte enregistrés par les moteurs', badge:'🔔 3 alertes récentes' },
  { href:'/temps-reel',        icon:'fas fa-bolt',          title:'Temps Réel',                 desc:'Surveillance en direct des valeurs physiques mesurées par moteur', badge:'● Live' },
  { href:'/kpi-indicateurs',   icon:'fas fa-chart-pie',     title:'Tableaux prédictifs',        desc:'Visualisation avancée avec algorithmes prédictifs en version expérimentale', badge:'🔬 Expérimental' },
];

export default function VueEnsemblePage() {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(()=>setAnimated(true),80); return ()=>clearTimeout(t); }, []);

  return (
    <AppShell>
      <div className="page-container">
        {/* Header */}
        <div style={{marginBottom:'28px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
            <div style={{width:'48px',height:'48px',background:'linear-gradient(135deg,var(--primary-deeper),var(--primary))',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'22px',boxShadow:'0 4px 12px rgba(53,130,141,0.25)'}}>
              <i className="fas fa-eye"/>
            </div>
            <div>
              <h1 style={{fontSize:'1.5rem',fontWeight:700,color:'var(--text-heading)',margin:0,display:'flex',alignItems:'center',gap:'14px'}}>Aperçu Général</h1>
              <p style={{color:'var(--text-body)',fontSize:'0.9rem',margin:'4px 0 0'}}>Vue consolidée de l&apos;état de santé de l&apos;ensemble du parc moteurs</p>
            </div>
          </div>
        </div>

        {/* KPI Row */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'20px',marginBottom:'28px'}}>
          {KPIS.map((k,i)=>(
            <div key={i} className="kpi-card" style={{opacity:animated?1:0,transform:animated?'translateY(0)':'translateY(15px)',transition:`opacity 0.5s ease ${i*0.1}s, transform 0.5s ease ${i*0.1}s`}}>
              <div className="kpi-icon"><i className={k.icon}/></div>
              <div>
                <div className="kpi-label">{k.label}</div>
                <div className="kpi-value">{k.value}<span> {k.unit}</span></div>
                <div className={`kpi-chip chip-${k.chipType}`}>{k.chip}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Modules Grid */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'24px'}}>
          {MODULES.map((m,i)=>(
            <div key={i} className="card" style={{
              position:'relative',overflow:'hidden',
              opacity:animated?1:0,
              transform:animated?'translateY(0)':'translateY(20px)',
              transition:`opacity 0.6s ease ${0.15+i*0.1}s, transform 0.6s ease ${0.15+i*0.1}s`,
            }}>
              {/* Left accent bar */}
              <div style={{position:'absolute',left:0,top:0,bottom:0,width:'4px',background:'linear-gradient(180deg,var(--primary-deeper),var(--primary))',borderRadius:'16px 0 0 16px'}}/>
              <div style={{paddingLeft:'8px'}}>
                <div className="card-header" style={{background:'transparent',padding:'0 0 16px',marginBottom:'14px',borderBottom:'1px solid var(--border)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div style={{width:'52px',height:'52px',borderRadius:'13px',background:'linear-gradient(135deg,var(--accent-light),var(--secondary))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',color:'var(--primary-deeper)',boxShadow:'0 4px 14px rgba(53,130,141,0.2)'}}>
                      <i className={m.icon}/>
                    </div>
                    <span style={{fontSize:'11px',fontWeight:600,padding:'5px 11px',borderRadius:'20px',background:'rgba(53,130,141,0.1)',color:'var(--primary-dark)',border:'1px solid var(--border)'}}>
                      {m.badge}
                    </span>
                  </div>
                </div>
                <h3 style={{fontSize:'15px',fontWeight:700,color:'var(--text-heading)',margin:'0 0 8px'}}>{m.title}</h3>
                <p style={{fontSize:'13px',color:'var(--text-body)',lineHeight:1.55,margin:'0 0 16px'}}>{m.desc}</p>
                <div style={{borderTop:'1px solid var(--border)',paddingTop:'14px'}}>
                  <Link href={m.href} style={{
                    display:'inline-flex',alignItems:'center',gap:'7px',
                    padding:'9px 18px',background:'linear-gradient(135deg,var(--primary),var(--primary-dark))',
                    color:'white',borderRadius:'9px',fontSize:'13px',fontWeight:600,
                    textDecoration:'none',transition:'transform 0.2s,box-shadow 0.2s',
                    boxShadow:'0 3px 10px rgba(53,130,141,0.3)',
                  }}>
                    Voir plus <i className="fas fa-arrow-right"/>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
