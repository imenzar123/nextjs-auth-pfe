'use client';
import { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';

interface KpiMetric { valeur: number; unite?: string; tendance?: number | null; label_tendance: string; }

interface KpiSection1 {
  sante_globale: KpiMetric;
  anomalies_detectees: KpiMetric;
  alertes_resolues: KpiMetric;
  consommation_kwh: KpiMetric;
}

interface KpiCountMetric { valeur: number; unite?: string; }
interface KpiParcEntry { motor_id: number; nom: string; statut: string; di: number; }

interface KpiSection2 {
  taux_alertes: KpiCountMetric;
  di_moyen: KpiCountMetric;
  rul_moyen: KpiCountMetric;
  interventions_mois: KpiCountMetric;
  taches_en_attente: KpiCountMetric;
  taches_soumises: KpiCountMetric;
  liste_parc: KpiParcEntry[];
}

interface SanteMensuelleEntry { mois: number; label: string; sante_pct: number; }

interface KpiSection3 {
  sante_mensuelle: SanteMensuelleEntry[];
}

interface KpiThresholdMetric { valeur: number; unite: string; seuil: number; }
interface KpiTendanceEvolution { valeur: string; delta_pct: number; }
interface KpiCountOnly { valeur: number; }

interface KpiSection4 {
  vibration_moy: KpiThresholdMetric;
  temperature_moy: KpiThresholdMetric;
  depassements_seuils: KpiCountOnly;
  tendance_evolution: KpiTendanceEvolution;
}

interface KpiSection5 {
  mttr_heures: KpiCountMetric;
  moteurs_inspectes: KpiCountOnly;
  interventions_reussies: KpiCountOnly;
  cout_maintenance: KpiCountMetric;
}

interface KpiStatsResponse {
  periode: { mois: number; annee: number; label: string };
  section1: KpiSection1;
  section2: KpiSection2;
  section3: KpiSection3;
  section4: KpiSection4;
  section5: KpiSection5;
}

interface Periode { mois: number; annee: number; label: string; }

const BIG_KPIS_META: { key: keyof KpiSection1; icon: string; label: string }[] = [
  { key: 'sante_globale',       icon: 'fas fa-heartbeat',            label: 'Santé globale' },
  { key: 'anomalies_detectees', icon: 'fas fa-exclamation-triangle', label: 'Anomalies détectées' },
  { key: 'alertes_resolues',    icon: 'fas fa-check-circle',         label: 'Alertes résolues' },
  { key: 'consommation_kwh',    icon: 'fas fa-bolt',                 label: 'Consommation' },
];

function valueColor(key: keyof KpiSection1, valeur: number): string {
  if (key === 'sante_globale') return valeur >= 70 ? '#22c55e' : valeur >= 40 ? '#f59e0b' : '#ef4444';
  if (key === 'anomalies_detectees') return valeur > 0 ? '#f59e0b' : '#22c55e';
  return '#22c55e'; // alertes_resolues, consommation_kwh
}

/** tendance > 0 → vert + ↑ · tendance < 0 → rouge + ↓ · tendance null → rien affiché */
function trendDisplay(t: number | null | undefined, unite: string): { text: string; color: string } {
  if (t === null || t === undefined) return { text: '', color: 'transparent' };
  if (t > 0) return { text: `↑ +${t}${unite}`, color: '#22c55e' };
  if (t < 0) return { text: `↓ ${t}${unite}`, color: '#ef4444' };
  return { text: '— Stable', color: 'var(--text-body)' };
}

function SkeletonBar({ width, height = '14px' }: { width: string; height?: string }) {
  return <div className="kpi-skeleton" style={{ width, height, borderRadius: '6px' }} />;
}

const SECTION2_META: { key: keyof Omit<KpiSection2, 'liste_parc'>; icon: string; label: string }[] = [
  { key: 'taux_alertes',       icon: 'fas fa-bell',              label: 'Taux alertes' },
  { key: 'di_moyen',           icon: 'fas fa-chart-line',        label: 'DI moyen' },
  { key: 'rul_moyen',          icon: 'fas fa-hourglass-half',    label: 'RUL moyen du parc' },
  { key: 'interventions_mois', icon: 'fas fa-cogs',              label: 'Interventions ce mois' },
  { key: 'taches_en_attente',  icon: 'fas fa-clipboard-list',    label: 'Tâches en attente' },
  { key: 'taches_soumises',    icon: 'fas fa-clipboard-check',   label: 'Tâches soumises' },
];

function section2Color(key: keyof Omit<KpiSection2, 'liste_parc'>, valeur: number): string {
  switch (key) {
    case 'taux_alertes': return valeur > 15 ? '#f59e0b' : '#22c55e';
    case 'di_moyen':
      if (valeur > 90) return '#ef4444';
      if (valeur >= 75) return '#f59e0b';
      if (valeur >= 50) return '#eab308';
      return '#22c55e';
    case 'rul_moyen':
      if (valeur < 5) return '#ef4444';
      if (valeur < 15) return '#f59e0b';
      return '#22c55e';
    case 'interventions_mois': return 'var(--primary)';
    case 'taches_en_attente': return valeur > 0 ? '#ef4444' : '#22c55e';
    case 'taches_soumises': return '#22c55e';
    default: return 'var(--text-heading)';
  }
}

function section2Subtitle(key: keyof Omit<KpiSection2, 'liste_parc'>, valeur: number): string | null {
  if (key === 'taches_en_attente') return valeur > 0 ? 'À traiter' : 'Aucune tâche en attente';
  return null;
}

interface DisplayCard { value: string; color: string; subtitle: string; }

const SECTION4_META = [
  { icon: 'fas fa-wave-square',        label: 'Niveau vibration' },
  { icon: 'fas fa-chart-line',         label: 'Tendance évolution' },
  { icon: 'fas fa-exclamation-circle', label: 'Dépassement seuils' },
  { icon: 'fas fa-thermometer-half',   label: 'Température moy.' },
];

function buildSection4Cards(s4: KpiSection4): DisplayCard[] {
  const vib = s4.vibration_moy;
  const vibColor = vib.valeur < vib.seuil * 0.75 ? '#22c55e' : vib.valeur < vib.seuil ? '#f59e0b' : '#ef4444';
  const vibSubtitle = vib.valeur < vib.seuil * 0.75 ? 'Optimal' : vib.valeur < vib.seuil ? 'Attention' : 'Dépassement';

  const tend = s4.tendance_evolution;
  const tendColor = tend.valeur === 'En hausse' ? '#ef4444' : tend.valeur === 'En baisse' ? '#22c55e' : 'var(--primary)';
  const deltaSign = tend.delta_pct > 0 ? '+' : '';

  const dep = s4.depassements_seuils;
  const depColor = dep.valeur === 0 ? '#22c55e' : dep.valeur <= 2 ? '#f59e0b' : '#ef4444';
  const depSubtitle = dep.valeur === 0 ? 'Aucun dépassement' : 'capteurs en dépassement ce mois';

  const temp = s4.temperature_moy;
  const tempColor = temp.valeur < temp.seuil * 0.75 ? '#22c55e' : temp.valeur < temp.seuil ? '#f59e0b' : '#ef4444';
  const tempSubtitle = temp.valeur < temp.seuil * 0.75 ? 'Normal' : temp.valeur < temp.seuil ? 'Attention' : 'Critique';

  return [
    { value: `${vib.valeur} mm/s`,  color: vibColor,  subtitle: vibSubtitle },
    { value: tend.valeur,           color: tendColor, subtitle: `${deltaSign}${tend.delta_pct}%` },
    { value: String(dep.valeur),    color: depColor,  subtitle: depSubtitle },
    { value: `${temp.valeur} °C`,   color: tempColor, subtitle: tempSubtitle },
  ];
}

const SECTION5_META = [
  { icon: 'fas fa-wrench',      label: 'MTTR' },
  { icon: 'fas fa-search',      label: 'Moteurs inspectés' },
  { icon: 'fas fa-thumbs-up',   label: 'Interventions réussies' },
  { icon: 'fas fa-dollar-sign', label: 'Coût maintenance' },
];

/** interventionsMois vient de section2.interventions_mois — c'est le seul signal fiable pour distinguer "0 réparation" de "aucune intervention ce mois". */
function buildSection5Cards(s5: KpiSection5, interventionsMois: number): DisplayCard[] {
  const noInterventions = interventionsMois === 0;

  const mttrValue = noInterventions ? '--' : `${s5.mttr_heures.valeur.toFixed(1)} h`;
  const mttrColor = noInterventions ? 'var(--text-body)' : s5.mttr_heures.valeur < 1 ? '#22c55e' : s5.mttr_heures.valeur < 3 ? '#f59e0b' : '#ef4444';
  const mttrSubtitle = noInterventions ? 'Aucune intervention ce mois' : 'temps moyen de réparation';

  let reussiesColor: string;
  let reussiesSubtitle: string;
  if (noInterventions) {
    reussiesColor = 'var(--text-body)';
    reussiesSubtitle = 'Aucune intervention ce mois';
  } else if (s5.interventions_reussies.valeur === interventionsMois) {
    reussiesColor = '#22c55e';
    reussiesSubtitle = '100 % réussi';
  } else if (s5.interventions_reussies.valeur > 0) {
    reussiesColor = '#f59e0b';
    reussiesSubtitle = 'résultat = résolu ce mois';
  } else {
    reussiesColor = '#ef4444';
    reussiesSubtitle = 'résultat = résolu ce mois';
  }

  return [
    { value: mttrValue,                                    color: mttrColor,      subtitle: mttrSubtitle },
    { value: String(s5.moteurs_inspectes.valeur),           color: 'var(--primary)', subtitle: 'moteurs ayant eu une intervention' },
    { value: String(s5.interventions_reussies.valeur),      color: reussiesColor,  subtitle: reussiesSubtitle },
    { value: `${s5.cout_maintenance.valeur.toFixed(2)} DT`, color: 'var(--primary)', subtitle: 'coût total pièces ce mois' },
  ];
}

// SVG Bar chart — santé mensuelle réelle (section3.sante_mensuelle), une barre par mois avec données
function SanteMensuelleChart({ data, selectedMois, annee }: { data: SanteMensuelleEntry[]; selectedMois: number | null; annee: number | null }) {
  const W = 520, H = 160, PAD = 32;
  const maxV = 100;
  const slotW = (W - PAD - 10) / data.length;
  const barW = Math.max(14, Math.min(40, slotW * 0.55));

  return (
    <svg viewBox={`0 0 ${W} ${H+PAD+10}`} style={{width:'100%',display:'block'}}>
      {[0,25,50,75,100].map(v=>(
        <g key={v}>
          <line x1={PAD} y1={H-(v/maxV)*H} x2={W-10} y2={H-(v/maxV)*H} stroke="rgba(53,130,141,0.1)" strokeDasharray="4 3"/>
          <text x={PAD-4} y={H-(v/maxV)*H+4} textAnchor="end" fontSize={9} fill="#94a3b8">{v}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = PAD + i * slotW + (slotW - barW) / 2;
        const bh = (d.sante_pct / maxV) * H;
        const isSelected = d.mois === selectedMois;
        const color = isSelected ? '#22c55e' : 'var(--primary)';
        return (
          <g key={d.mois}>
            <rect x={x} y={H-bh} width={barW} height={bh} rx={4} fill={color} opacity={isSelected ? 1 : 0.85} stroke={isSelected ? '#16a34a' : 'none'} strokeWidth={isSelected ? 1.5 : 0}>
              <title>{`${d.label} ${annee ?? ''} : ${d.sante_pct.toFixed(1)} %`}</title>
            </rect>
            <text x={x+barW/2} y={H-bh-6} textAnchor="middle" fontSize={9} fill={color} fontWeight="700">{Math.round(d.sante_pct)}%</text>
            <text x={x+barW/2} y={H+PAD} textAnchor="middle" fontSize={9} fill={isSelected ? '#22c55e' : '#94a3b8'} fontWeight={isSelected ? 700 : 400}>{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function KpiIndicateursPage() {
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [periodesLoaded, setPeriodesLoaded] = useState(false);
  const [mois, setMois] = useState<number | null>(null);
  const [annee, setAnnee] = useState<number | null>(null);
  const [stats, setStats] = useState<KpiStatsResponse | null>(null);
  const [statsFailed, setStatsFailed] = useState(false);
  const [animated, setAnimated] = useState(false);

  useEffect(() => { const t = setTimeout(()=>setAnimated(true),100); return ()=>clearTimeout(t); },[]);

  // Mois disponibles = ceux ayant des prédictions en base ; sélectionne le plus récent par défaut.
  useEffect(() => {
    fetch('/api/kpi/mois-disponibles')
      .then((res) => {
        if (!res.ok) throw new Error('mois-disponibles fetch failed');
        return res.json();
      })
      .then((data: Periode[]) => {
        setPeriodes(data);
        if (data.length > 0) {
          const dernier = data[data.length - 1];
          setMois(dernier.mois);
          setAnnee(dernier.annee);
        }
      })
      .catch(() => {})
      .finally(() => setPeriodesLoaded(true));
  }, []);

  const fetchStats = useCallback(() => {
    if (mois === null || annee === null) return;
    fetch(`/api/kpi/stats?mois=${mois}&annee=${annee}`)
      .then((res) => {
        if (!res.ok) throw new Error('kpi stats fetch failed');
        return res.json();
      })
      .then((data: KpiStatsResponse) => {
        setStats(data);
        setStatsFailed(false);
      })
      .catch(() => {
        setStatsFailed(true);
      });
  }, [mois, annee]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const s1 = stats?.section1 ?? null;
  const s2 = stats?.section2 ?? null;
  const s3 = stats?.section3 ?? null;
  const santeMensuelle = s3?.sante_mensuelle ?? [];
  const s4 = stats?.section4 ?? null;
  const s5 = stats?.section5 ?? null;
  const section4Cards = s4 ? buildSection4Cards(s4) : null;
  const section5Cards = s5 ? buildSection5Cards(s5, s2?.interventions_mois.valeur ?? 0) : null;
  const periodeLabel = stats?.periode.label
    ?? periodes.find(p => p.mois === mois && p.annee === annee)?.label
    ?? (!periodesLoaded ? 'Chargement…' : periodes.length === 0 ? 'Aucune donnée disponible' : '');

  const handlePeriodeChange = (value: string) => {
    const [m, a] = value.split('-').map(Number);
    setMois(m);
    setAnnee(a);
  };

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
              <p style={{fontSize:'13px',color:'var(--text-body)',margin:'4px 0 0'}}>Tableau de bord des performances — {periodeLabel}{statsFailed ? ' · données indisponibles' : ''}</p>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <select
              value={mois !== null && annee !== null ? `${mois}-${annee}` : ''}
              onChange={e=>handlePeriodeChange(e.target.value)}
              disabled={periodes.length === 0}
              style={{padding:'10px 16px',border:'1px solid var(--border)',borderRadius:'8px',fontSize:'14px',background:'var(--bg-card)',color:'var(--text-heading)',outline:'none',cursor: periodes.length === 0 ? 'not-allowed' : 'pointer'}}
            >
              {periodes.length === 0 && (
                <option value="">{periodesLoaded ? 'Aucune donnée' : 'Chargement…'}</option>
              )}
              {periodes.map(p => (
                <option key={`${p.mois}-${p.annee}`} value={`${p.mois}-${p.annee}`}>{p.label}</option>
              ))}
            </select>
            <button style={{padding:'10px 20px',background:'var(--primary)',color:'white',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:'8px'}} onClick={()=>alert('Export KPI — fonctionnalité en cours de développement')}>
              <i className="fas fa-download"/> Exporter les KPI
            </button>
          </div>
        </div>

        {/* Big KPI cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginBottom:'24px'}}>
          {BIG_KPIS_META.map((meta, i) => {
            const metric = s1 ? s1[meta.key] : null;

            if (!metric) {
              return (
                <div key={i} className="kpi-card" style={{flexDirection:'column',alignItems:'flex-start',gap:'8px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',color:'var(--text-body)',fontSize:'13px'}}>
                    <i className={meta.icon}/><span>{meta.label}</span>
                  </div>
                  {statsFailed ? (
                    <>
                      <div style={{fontSize:'2.2rem',fontWeight:800,color:'var(--text-body)',lineHeight:1,fontFamily:'var(--mono)'}}>—</div>
                      <div style={{display:'flex',justifyContent:'space-between',width:'100%',fontSize:'12px'}}>
                        <span/>
                        <span style={{color:'var(--text-body)'}}>Indisponible</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <SkeletonBar width="60%" height="2.2rem" />
                      <SkeletonBar width="45%" height="12px" />
                    </>
                  )}
                </div>
              );
            }

            const suffix = meta.key === 'consommation_kwh' && metric.unite ? ` ${metric.unite}` : (metric.unite ?? '');
            const trend = meta.key === 'consommation_kwh' ? { text: '', color: 'transparent' } : trendDisplay(metric.tendance, meta.key === 'sante_globale' ? '%' : '');
            const color = valueColor(meta.key, metric.valeur);

            return (
              <div key={i} className="kpi-card" style={{flexDirection:'column',alignItems:'flex-start',gap:'8px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',color:'var(--text-body)',fontSize:'13px'}}>
                  <i className={meta.icon}/><span>{meta.label}</span>
                </div>
                <div style={{fontSize:'2.2rem',fontWeight:800,color,lineHeight:1,fontFamily:'var(--mono)'}}>
                  {animated ? metric.valeur : 0}{suffix}
                </div>
                <div style={{display:'flex',justifyContent:'space-between',width:'100%',fontSize:'12px'}}>
                  <span style={{color:trend.color,fontWeight:600}}>{trend.text}</span>
                  <span style={{color:'var(--text-body)'}}>{metric.label_tendance}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Section 2 — Vue Globale */}
        <h3 style={{fontSize:'16px',fontWeight:700,color:'var(--text-heading)',margin:'0 0 4px'}}>Vue Globale</h3>
        <p style={{fontSize:'13px',color:'var(--text-body)',margin:'0 0 16px'}}>Indicateurs de performance clés</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'14px',marginBottom:'24px'}}>
          {SECTION2_META.map((meta, i) => {
            const metric = s2 ? s2[meta.key] : null;

            if (!metric) {
              return (
                <div key={i} style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'12px',padding:'16px',boxShadow:'0 2px 8px var(--shadow)'}}>
                  <div style={{fontSize:'12px',color:'var(--text-body)',marginBottom:'8px',display:'flex',alignItems:'center',gap:'6px'}}><i className={meta.icon}/>{meta.label}</div>
                  {statsFailed
                    ? <div style={{fontSize:'1.6rem',fontWeight:800,color:'var(--text-body)',fontFamily:'var(--mono)'}}>—</div>
                    : <SkeletonBar width="50%" height="1.6rem" />
                  }
                </div>
              );
            }

            const suffix = meta.key === 'rul_moyen' ? ' h' : (metric.unite ?? '');
            const value = meta.key === 'rul_moyen' ? metric.valeur.toFixed(1) : metric.valeur;
            const color = section2Color(meta.key, metric.valeur);
            const subtitle = section2Subtitle(meta.key, metric.valeur);

            return (
              <div key={i} style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'12px',padding:'16px',boxShadow:'0 2px 8px var(--shadow)'}}>
                <div style={{fontSize:'12px',color:'var(--text-body)',marginBottom:'8px',display:'flex',alignItems:'center',gap:'6px'}}><i className={meta.icon}/>{meta.label}</div>
                <div style={{fontSize:'1.6rem',fontWeight:800,color,fontFamily:'var(--mono)'}}>{value}{suffix}</div>
                {subtitle && <div style={{fontSize:'11px',color,marginTop:'4px',fontWeight:600}}>{subtitle}</div>}
              </div>
            );
          })}
        </div>

        {/* Santé mensuelle */}
        <div style={{display:'grid',gridTemplateColumns:'1fr',gap:'20px',marginBottom:'24px'}}>
          <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'14px',padding:'20px',boxShadow:'0 2px 12px var(--shadow)'}}>
            <h4 style={{margin:'0 0 16px',color:'var(--text-heading)',fontSize:'14px',fontWeight:700}}><i className="fas fa-chart-bar" style={{marginRight:'8px',color:'var(--primary)'}}/>Santé mensuelle (%)</h4>
            {!stats && !statsFailed ? (
              <SkeletonBar width="100%" height="160px" />
            ) : santeMensuelle.length === 0 ? (
              <p style={{fontSize:'13px',color:'var(--text-body)',margin:0,textAlign:'center',padding:'40px 0'}}>Aucune donnée disponible pour cette période</p>
            ) : (
              <SanteMensuelleChart data={santeMensuelle} selectedMois={mois} annee={annee} />
            )}
          </div>
        </div>

        {/* Section 4 — Indicateurs d'État */}
        <h3 style={{fontSize:'16px',fontWeight:700,color:'var(--text-heading)',margin:'0 0 4px'}}>Indicateurs d&apos;État</h3>
        <p style={{fontSize:'13px',color:'var(--text-body)',margin:'0 0 16px'}}>État actuel des paramètres</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px',marginBottom:'24px'}}>
          {SECTION4_META.map((meta, i) => {
            const card = section4Cards ? section4Cards[i] : null;

            if (!card) {
              return (
                <div key={i} style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'12px',padding:'16px',boxShadow:'0 2px 8px var(--shadow)'}}>
                  <div style={{fontSize:'12px',color:'var(--text-body)',marginBottom:'8px',display:'flex',alignItems:'center',gap:'6px'}}><i className={meta.icon}/>{meta.label}</div>
                  {statsFailed
                    ? <div style={{fontSize:'1.4rem',fontWeight:800,color:'var(--text-body)',fontFamily:'var(--mono)'}}>—</div>
                    : <SkeletonBar width="50%" height="1.4rem" />
                  }
                </div>
              );
            }

            return (
              <div key={i} style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'12px',padding:'16px',boxShadow:'0 2px 8px var(--shadow)'}}>
                <div style={{fontSize:'12px',color:'var(--text-body)',marginBottom:'8px',display:'flex',alignItems:'center',gap:'6px'}}><i className={meta.icon}/>{meta.label}</div>
                <div style={{fontSize:'1.4rem',fontWeight:800,color:card.color,fontFamily:'var(--mono)',marginBottom:'6px'}}>{card.value}</div>
                <div style={{fontSize:'11px',color:card.color,fontWeight:700}}>{card.subtitle}</div>
              </div>
            );
          })}
        </div>

        {/* Section 5 — Indicateurs de Maintenance */}
        <h3 style={{fontSize:'16px',fontWeight:700,color:'var(--text-heading)',margin:'0 0 4px'}}>Indicateurs de Maintenance</h3>
        <p style={{fontSize:'13px',color:'var(--text-body)',margin:'0 0 16px'}}>Données de maintenance préventive</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px',marginBottom:'24px'}}>
          {SECTION5_META.map((meta, i) => {
            const card = section5Cards ? section5Cards[i] : null;

            if (!card) {
              return (
                <div key={i} style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'12px',padding:'16px',boxShadow:'0 2px 8px var(--shadow)'}}>
                  <div style={{fontSize:'12px',color:'var(--text-body)',marginBottom:'8px',display:'flex',alignItems:'center',gap:'6px'}}><i className={meta.icon}/>{meta.label}</div>
                  {statsFailed
                    ? <div style={{fontSize:'1.6rem',fontWeight:800,color:'var(--text-body)',fontFamily:'var(--mono)'}}>—</div>
                    : <SkeletonBar width="50%" height="1.6rem" />
                  }
                </div>
              );
            }

            return (
              <div key={i} style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'12px',padding:'16px',boxShadow:'0 2px 8px var(--shadow)'}}>
                <div style={{fontSize:'12px',color:'var(--text-body)',marginBottom:'8px',display:'flex',alignItems:'center',gap:'6px'}}><i className={meta.icon}/>{meta.label}</div>
                <div style={{fontSize:'1.6rem',fontWeight:800,color:card.color,fontFamily:'var(--mono)'}}>{card.value}</div>
                <div style={{fontSize:'11px',color:card.color,marginTop:'4px',fontWeight:600}}>{card.subtitle}</div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes kpi-skeleton-pulse { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
        .kpi-skeleton { background: var(--border); animation: kpi-skeleton-pulse 1.4s ease-in-out infinite; }
      `}</style>
    </AppShell>
  );
}
