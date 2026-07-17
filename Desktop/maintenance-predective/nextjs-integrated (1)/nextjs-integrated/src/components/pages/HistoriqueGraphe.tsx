'use client';
import { useState, useEffect, useRef } from 'react';
import AppShell from '@/components/layout/AppShell';

interface Motor         { id: number; nom: string; }
interface Sensor        { id: number; motor_id: number; nom: string; type: string; unite: string; }
interface SensorHistory { id: number; sensor_id: number; motor_id: number; measured_value: number; unit: string; status: string; measured_at: string; }
interface TableRow      { date: string; moteur: string; parametre: string; valeur: string; unite: string; statut: string; }
interface ChartSerie    { name: string; data: [number, number][]; color: string; lineWidth: number; }

const RANGES = ['1J','1S','1M','3M','6M','1A','Tout'];

function rangeToFrom(r: string): string | null {
  const days = r==='1J'?1:r==='1S'?7:r==='1M'?30:r==='3M'?90:r==='6M'?180:r==='1A'?365:null;
  if (!days) return null;
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 19);
}

function statusLabel(s: string): string {
  return s === 'normal' ? 'Normal' : s === 'warning' ? 'Attention' : s === 'critical' ? 'Warning' : s;
}

declare global { interface Window { Highcharts?: Record<string, unknown>; } }

export default function HistoriqueGraphePage() {
  const [selectedMoteurs, setSelectedMoteurs] = useState<string[]>([]);
  const [selectedParam, setSelectedParam]     = useState('');
  const [range, setRange]                     = useState('1M');
  const [showDropdown, setShowDropdown]       = useState(false);
  const [search, setSearch]                   = useState('');
  const [page, setPage]                       = useState(1);

  const [motors, setMotors]               = useState<Motor[]>([]);
  const [sensors, setSensors]             = useState<Sensor[]>([]);
  const [tableRows, setTableRows]         = useState<TableRow[]>([]);
  const [chartSeries, setChartSeries]     = useState<ChartSerie[]>([]);
  const [hcReady, setHcReady]             = useState(false);
  const [isLoadingMotors, setIsLoadingMotors] = useState(true);
  const [isLoadingData, setIsLoadingData]     = useState(false);
  const [errorMotors, setErrorMotors]     = useState('');

  const chartRef  = useRef<HTMLDivElement>(null);
  const chartInst = useRef<{destroy?:()=>void}|null>(null);
  const perPage   = 10;

  // Load Highcharts Stock dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as Window & typeof globalThis & {Highcharts?: unknown}).Highcharts) { setHcReady(true); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/highcharts@11.4.8/highstock.min.js';
    s.onload = () => setHcReady(true);
    document.head.appendChild(s);
    return () => { try { document.head.removeChild(s); } catch {} };
  }, []);

  // Re-render chart when Highcharts is ready or data changes
  useEffect(() => {
    if (!hcReady) return;
    renderChart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hcReady, chartSeries, selectedParam]);

  // Load all motors and all sensors on mount, then auto-select first
  useEffect(() => {
    Promise.all([
      fetch('/api/motors').then(r => r.json()),
      fetch('/api/sensors').then(r => r.json()),
    ])
      .then(([motorData, sensorData]: [Motor[], Sensor[]]) => {
        setMotors(motorData);
        setSensors(sensorData);
        if (motorData.length > 0) {
          const first = motorData[0];
          setSelectedMoteurs([first.nom]);
          const firstSensor = sensorData.find(s => s.motor_id === first.id);
          if (firstSensor) setSelectedParam(firstSensor.type);
        }
      })
      .catch(() => setErrorMotors('Impossible de charger les moteurs. Vérifiez que le serveur est démarré.'))
      .finally(() => setIsLoadingMotors(false));
  }, []);

  // Fetch history data whenever selection or range changes
  useEffect(() => {
    if (selectedMoteurs.length === 0 || !selectedParam || motors.length === 0 || sensors.length === 0) return;

    let cancelled = false;
    setIsLoadingData(true);

    const from = rangeToFrom(range);
    const primaryMotor  = motors.find(m => m.nom === selectedMoteurs[0]);
    const primarySensor = sensors.find(s => s.motor_id === primaryMotor?.id && s.type === selectedParam);

    const fetches = selectedMoteurs.map(motorNom => {
      const motorObj = motors.find(m => m.nom === motorNom);
      const sensor   = motorObj
        ? sensors.find(s => s.motor_id === motorObj.id && s.type === (primarySensor?.type ?? selectedParam))
        : null;
      if (!sensor) return Promise.resolve({ motorNom, histories: [] as SensorHistory[] });

      const qs = new URLSearchParams({ sensor_id: String(sensor.id) });
      if (from) qs.append('from', from);

      return fetch(`/api/sensor-histories?${qs}`)
        .then(r => r.json())
        .then((data: SensorHistory[]) => ({ motorNom, histories: Array.isArray(data) ? data : [] }))
        .catch(() => ({ motorNom, histories: [] as SensorHistory[] }));
    });

    Promise.all(fetches).then(results => {
      if (cancelled) return;
      const colors = ['#35828d','#85cfd8','#1a4f55','#b0e1e8','#266870'];

      setChartSeries(results.map((r, i) => ({
        name: r.motorNom,
        data: r.histories.map(h => [new Date(h.measured_at).getTime(), h.measured_value] as [number, number]),
        color: colors[i % 5],
        lineWidth: 2,
      })));

      const rows: TableRow[] = results.flatMap(r =>
        r.histories.map(h => ({
          date:      h.measured_at.replace('T', ' ').slice(0, 19),
          moteur:    r.motorNom,
          parametre: selectedParam,
          valeur:    h.measured_value.toFixed(2),
          unite:     h.unit,
          statut:    statusLabel(h.status),
        }))
      ).sort((a, b) => b.date.localeCompare(a.date));

      setTableRows(rows);
      setIsLoadingData(false);
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMoteurs.join(','), selectedParam, range, motors.length, sensors.length]);

  const renderChart = () => {
    const HC = (window as Window & typeof globalThis & {Highcharts?: unknown}).Highcharts as ({stockChart: (...args: unknown[]) => {destroy?: ()=>void}} | undefined);
    if (!HC || !chartRef.current) return;
    if (chartInst.current?.destroy) chartInst.current.destroy();
    chartInst.current = HC.stockChart(chartRef.current, {
      chart:{ backgroundColor:'transparent', style:{ fontFamily:'DM Sans,sans-serif' } },
      title:{ text:'' },
      xAxis:{ type:'datetime', labels:{ style:{color:'#64748b'} } },
      yAxis:{ title:{ text:selectedParam, style:{color:'#35828d'} }, gridLineColor:'rgba(53,130,141,0.15)', labels:{ style:{color:'#64748b'} } },
      legend:{ enabled:true, itemStyle:{color:'#1e293b'} },
      series: chartSeries,
      rangeSelector:{ enabled:false },
      navigator:{ enabled:true },
      scrollbar:{ enabled:false },
      credits:{ enabled:false },
      tooltip:{ shared:true, valueDecimals:2 },
    } as unknown as Parameters<typeof HC.stockChart>[1]);
  };

  const toggleMoteur = (m: string) => {
    setSelectedMoteurs(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  // Unique sensor types for the primary selected motor
  const primaryMotorObj  = motors.find(m => m.nom === selectedMoteurs[0]);
  const availableParams  = sensors
    .filter(s => s.motor_id === primaryMotorObj?.id)
    .map(s => s.type)
    .filter((t, i, arr) => arr.indexOf(t) === i);

  const filtered   = tableRows.filter(r => {
    const s = search.toLowerCase();
    return r.moteur.toLowerCase().includes(s) || r.parametre.toLowerCase().includes(s) || r.statut.toLowerCase().includes(s);
  });
  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData   = filtered.slice((page - 1) * perPage, page * perPage);
  const statBadge: Record<string,string> = { 'Normal':'badge-actif','Attention':'badge-attention','Warning':'badge-warning' };

  return (
    <AppShell>
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div style={{ background:'linear-gradient(135deg,#379ba9 0%,#2c7a8b 100%)', borderRadius:'12px', padding:'20px 24px', color:'white', marginBottom:'20px' }}>
            <h1 style={{margin:'0 0 5px',fontSize:'22px',fontWeight:700}}><i className="fas fa-chart-line"/> Historique V2</h1>
            <p style={{margin:0,opacity:0.9,fontSize:'13px'}}>Visualisation historique des données moteurs avec graphique interactif</p>
          </div>
        </div>

        {errorMotors && (
          <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:'8px', padding:'12px 16px', marginBottom:'16px', color:'#dc2626', fontSize:'13px' }}>
            <i className="fas fa-exclamation-circle" style={{marginRight:'8px'}}/>{errorMotors}
          </div>
        )}

        {/* Controls */}
        <div style={{ background:'var(--bg-card)', borderRadius:'12px', padding:'20px', marginBottom:'20px', boxShadow:'0 2px 10px var(--shadow)', border:'1px solid var(--border)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'16px' }}>
            {/* Moteur Multi-select */}
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:600, color:'var(--text-heading)', marginBottom:'8px' }}>Sélectionner les moteurs</label>
              <div style={{ position:'relative' }}>
                <div onClick={()=>setShowDropdown(v=>!v)} style={{ display:'flex', flexWrap:'wrap', gap:'5px', minHeight:'44px', padding:'8px 12px', border:'2px solid var(--border)', borderRadius:'8px', background:'var(--bg-card)', cursor:'pointer' }}>
                  {selectedMoteurs.length===0 ? <span style={{color:'var(--text-body)'}}>Sélectionner...</span> :
                    selectedMoteurs.map(m=>(
                      <span key={m} style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'3px 10px', background:'rgba(53,130,141,0.1)', borderRadius:'20px', fontSize:'13px', color:'var(--primary)' }}>
                        {m}
                        <span onClick={e=>{e.stopPropagation();toggleMoteur(m);}} style={{cursor:'pointer',color:'#ef4444',fontWeight:'bold'}}>×</span>
                      </span>
                    ))
                  }
                </div>
                {showDropdown && (
                  <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'8px', boxShadow:'0 4px 15px var(--shadow)', zIndex:100, maxHeight:'200px', overflowY:'auto' }}>
                    {isLoadingMotors
                      ? <div style={{padding:'12px 16px',color:'var(--text-body)',fontSize:'13px'}}>Chargement...</div>
                      : motors.map(m=>(
                          <div key={m.id} onClick={()=>toggleMoteur(m.nom)} style={{ padding:'10px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', background: selectedMoteurs.includes(m.nom) ? 'rgba(53,130,141,0.08)' : 'transparent', color:'var(--text-heading)', fontSize:'14px' }}>
                            <i className={`fas fa-${selectedMoteurs.includes(m.nom)?'check-square':'square'}`} style={{color:selectedMoteurs.includes(m.nom)?'var(--primary)':'var(--text-body)'}}/>
                            {m.nom}
                          </div>
                        ))
                    }
                  </div>
                )}
              </div>
            </div>
            {/* Parametre select */}
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:600, color:'var(--text-heading)', marginBottom:'8px' }}>Paramètre</label>
              <select value={selectedParam} onChange={e=>setSelectedParam(e.target.value)}
                style={{ width:'100%', padding:'11px 14px', border:'2px solid var(--border)', borderRadius:'8px', fontSize:'14px', background:'var(--bg-card)', color:'var(--text-heading)', outline:'none' }}>
                {availableParams.length === 0
                  ? <option value="">— aucun capteur —</option>
                  : availableParams.map(p=><option key={p} value={p}>{p}</option>)
                }
              </select>
            </div>
          </div>
          {/* Range buttons */}
          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
            {RANGES.map(r=>(
              <button key={r} onClick={()=>setRange(r)} style={{
                padding:'8px 14px', border:'2px solid', borderRadius:'6px', cursor:'pointer', fontSize:'13px', fontWeight:500, transition:'all 0.25s',
                background: range===r ? 'var(--primary)' : 'var(--bg-card)',
                borderColor: range===r ? 'var(--primary)' : 'var(--border)',
                color: range===r ? 'white' : 'var(--text-body)',
              }}>{r}</button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div style={{ background:'var(--bg-card)', borderRadius:'12px', padding:'20px', marginBottom:'20px', boxShadow:'0 2px 10px var(--shadow)', border:'1px solid var(--border)' }}>
          {isLoadingData && (
            <div style={{ textAlign:'center', padding:'16px 0', color:'var(--text-body)', fontSize:'13px' }}>
              <i className="fas fa-spinner fa-spin" style={{marginRight:'8px'}}/>Chargement des données...
            </div>
          )}
          <div ref={chartRef} style={{ height:'380px', minHeight:'300px' }} />
        </div>

        {/* Data Table */}
        <div className="table-card">
          <div className="table-header">
            <h4 style={{margin:0,fontSize:'15px',fontWeight:700,color:'var(--text-heading)'}}>
              <i className="fas fa-table" style={{marginRight:'8px',color:'var(--primary)'}}/>Données tabulaires
            </h4>
            <div className="search-box" style={{position:'relative',width:'240px'}}>
              <i className="fas fa-search" style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',color:'var(--text-body)'}}/>
              <input type="text" placeholder="Filtrer les données..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
                style={{width:'100%',padding:'9px 12px 9px 36px',border:'1px solid var(--border)',borderRadius:'8px',fontSize:'13px',background:'var(--bg-card)',color:'var(--text-heading)',outline:'none'}}/>
            </div>
          </div>
          <div className="table-responsive">
            <table className="history-table" style={{minWidth:'700px'}}>
              <thead>
                <tr>
                  <th>Date / Heure</th><th>Moteur</th><th>Paramètre</th><th>Valeur</th><th>Unité</th><th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {pageData.length === 0 ? (
                  <tr><td colSpan={6} style={{textAlign:'center',padding:'24px',color:'var(--text-body)',fontSize:'13px'}}>
                    {isLoadingData ? 'Chargement...' : 'Aucune donnée pour cette sélection.'}
                  </td></tr>
                ) : pageData.map((r,i)=>(
                  <tr key={i}>
                    <td className="date-cell">{r.date}</td>
                    <td><span className="motor-id">{r.moteur}</span></td>
                    <td><span className="parametre-code">{r.parametre}</span></td>
                    <td className="value-cell">{r.valeur}</td>
                    <td style={{color:'var(--text-body)',fontSize:'12px'}}>{r.unite}</td>
                    <td><span className={`badge ${statBadge[r.statut]||''}`}>{r.statut}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span className="showing-info">Affichage de {filtered.length===0?0:(page-1)*perPage+1} à {Math.min(page*perPage,filtered.length)} sur {filtered.length} entrées</span>
            {totalPages>1 && (
              <div className="pagination">
                <button className="page-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}><i className="fas fa-chevron-left"/></button>
                {Array.from({length:Math.min(totalPages,5)},(_,i)=>i+1).map(p=>(
                  <button key={p} className={`page-btn${page===p?' active':''}`} onClick={()=>setPage(p)}>{p}</button>
                ))}
                <button className="page-btn" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}><i className="fas fa-chevron-right"/></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
