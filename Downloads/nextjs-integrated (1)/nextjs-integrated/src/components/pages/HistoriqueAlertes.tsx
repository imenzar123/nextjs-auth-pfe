'use client';
import { useState, useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import Pagination from '@/components/ui/Pagination';

interface Alerte { dd: string; df: string; motorId: number; nom: string; emplacement: string; parametre: string; min: number; max: number; statut: string; }

const ALERTES_DATA: Alerte[] = [
  { dd:'2026-03-30 08:15:22', df:'2026-03-30 08:45:30', motorId:1, nom:'Moteur 1600 App Cylindre v1',      emplacement:'Section B',  parametre:'temperature_Radial',   min:0, max:80,  statut:'N/A' },
  { dd:'2026-03-30 09:22:15', df:'2026-03-30 09:35:42', motorId:2, nom:'Moteur Pompe Centrifuge',           emplacement:'Section A',  parametre:'vibration_Radial_x',   min:0, max:10,  statut:'Attention' },
  { dd:'2026-03-30 10:05:00', df:'2026-03-30 10:12:18', motorId:4, nom:'Moteur Compresseur Air',            emplacement:'Section E1', parametre:'temperature_Moteur',   min:20,max:100, statut:'Warning' },
  { dd:'2026-03-30 11:30:45', df:'2026-03-30 11:55:20', motorId:3, nom:'Moteur Ventilation Principal',      emplacement:'Section C',  parametre:'vibration_Radial_y',   min:0, max:8,   statut:'Critique' },
  { dd:'2026-03-30 12:18:33', df:'2026-03-30 12:42:10', motorId:5, nom:'Moteur Convoyeur Bande A',          emplacement:'Section D',  parametre:'pression_Huile',        min:2, max:6,   statut:'N/A' },
  { dd:'2026-03-30 13:05:28', df:'2026-03-30 13:28:55', motorId:6, nom:'Moteur Refroidissement',            emplacement:'Section B',  parametre:'vibration_Axial',       min:0, max:12,  statut:'Warning' },
  { dd:'2026-03-30 14:22:11', df:'2026-03-30 14:38:42', motorId:8, nom:'Moteur Presse Hydraulique',         emplacement:'Section E2', parametre:'temperature_Radial',   min:0, max:85,  statut:'Critique' },
  { dd:'2026-03-30 15:10:05', df:'2026-03-30 15:25:30', motorId:7, nom:'Moteur Extraction Fumées',          emplacement:'Section F',  parametre:'vibration_Radial_x',   min:0, max:10,  statut:'Attention' },
  { dd:'2026-03-30 16:45:18', df:'2026-03-30 16:58:44', motorId:1, nom:'Moteur 1600 App Cylindre v1',      emplacement:'Section B',  parametre:'vibration_Radial_y',   min:0, max:8,   statut:'N/A' },
  { dd:'2026-03-30 17:30:22', df:'2026-03-30 17:52:15', motorId:2, nom:'Moteur Pompe Centrifuge',           emplacement:'Section A',  parametre:'temperature_Moteur',   min:20,max:90,  statut:'Warning' },
  { dd:'2026-03-29 08:00:10', df:'2026-03-29 08:15:45', motorId:3, nom:'Moteur Ventilation Principal',      emplacement:'Section C',  parametre:'pression_Huile',        min:2, max:5,   statut:'N/A' },
  { dd:'2026-03-29 09:22:33', df:'2026-03-29 09:45:18', motorId:4, nom:'Moteur Compresseur Air',            emplacement:'Section E1', parametre:'vibration_Axial',       min:0, max:15,  statut:'Critique' },
  { dd:'2026-03-29 10:15:00', df:'2026-03-29 10:32:22', motorId:5, nom:'Moteur Convoyeur Bande A',          emplacement:'Section D',  parametre:'temperature_Radial',   min:0, max:75,  statut:'Attention' },
  { dd:'2026-03-29 11:05:44', df:'2026-03-29 11:28:30', motorId:6, nom:'Moteur Refroidissement',            emplacement:'Section B',  parametre:'vibration_Radial_x',   min:0, max:10,  statut:'Warning' },
  { dd:'2026-03-29 12:45:18', df:'2026-03-29 13:02:55', motorId:7, nom:'Moteur Extraction Fumées',          emplacement:'Section F',  parametre:'temperature_Moteur',   min:20,max:95,  statut:'Critique' },
  { dd:'2026-03-29 14:20:30', df:'2026-03-29 14:38:42', motorId:8, nom:'Moteur Presse Hydraulique',         emplacement:'Section E2', parametre:'vibration_Radial_y',   min:0, max:8,   statut:'N/A' },
  { dd:'2026-03-29 15:10:15', df:'2026-03-29 15:25:38', motorId:1, nom:'Moteur 1600 App Cylindre v1',      emplacement:'Section B',  parametre:'pression_Huile',        min:2, max:6,   statut:'Attention' },
  { dd:'2026-03-29 16:35:22', df:'2026-03-29 16:55:10', motorId:2, nom:'Moteur Pompe Centrifuge',           emplacement:'Section A',  parametre:'temperature_Radial',   min:0, max:80,  statut:'N/A' },
  { dd:'2026-03-29 17:45:08', df:'2026-03-29 18:05:33', motorId:3, nom:'Moteur Ventilation Principal',      emplacement:'Section C',  parametre:'vibration_Axial',       min:0, max:12,  statut:'Warning' },
  { dd:'2026-03-28 08:30:15', df:'2026-03-28 08:48:42', motorId:4, nom:'Moteur Compresseur Air',            emplacement:'Section E1', parametre:'temperature_Moteur',   min:20,max:100, statut:'Critique' },
  { dd:'2026-03-28 09:15:28', df:'2026-03-28 09:32:10', motorId:5, nom:'Moteur Convoyeur Bande A',          emplacement:'Section D',  parametre:'vibration_Radial_x',   min:0, max:10,  statut:'N/A' },
  { dd:'2026-03-28 10:22:44', df:'2026-03-28 10:45:18', motorId:6, nom:'Moteur Refroidissement',            emplacement:'Section B',  parametre:'pression_Huile',        min:2, max:5,   statut:'Attention' },
  { dd:'2026-03-28 11:08:30', df:'2026-03-28 11:25:15', motorId:7, nom:'Moteur Extraction Fumées',          emplacement:'Section F',  parametre:'temperature_Radial',   min:0, max:75,  statut:'Warning' },
  { dd:'2026-03-28 12:45:18', df:'2026-03-28 13:02:42', motorId:8, nom:'Moteur Presse Hydraulique',         emplacement:'Section E2', parametre:'vibration_Radial_y',   min:0, max:8,   statut:'Critique' },
  { dd:'2026-03-28 14:20:05', df:'2026-03-28 14:38:30', motorId:1, nom:'Moteur 1600 App Cylindre v1',      emplacement:'Section B',  parametre:'temperature_Moteur',   min:20,max:90,  statut:'N/A' },
  { dd:'2026-03-27 09:30:22', df:'2026-03-27 09:48:45', motorId:6, nom:'Moteur Refroidissement',            emplacement:'Section B',  parametre:'temperature_Moteur',   min:20,max:95,  statut:'Attention' },
  { dd:'2026-03-27 10:15:08', df:'2026-03-27 10:32:30', motorId:7, nom:'Moteur Extraction Fumées',          emplacement:'Section F',  parametre:'vibration_Radial_y',   min:0, max:8,   statut:'Warning' },
  { dd:'2026-03-27 11:22:44', df:'2026-03-27 11:45:15', motorId:8, nom:'Moteur Presse Hydraulique',         emplacement:'Section E2', parametre:'pression_Huile',        min:2, max:5,   statut:'Critique' },
  { dd:'2026-03-27 13:45:18', df:'2026-03-27 14:02:55', motorId:2, nom:'Moteur Pompe Centrifuge',           emplacement:'Section A',  parametre:'vibration_Axial',       min:0, max:12,  statut:'Attention' },
  { dd:'2026-03-27 14:30:22', df:'2026-03-27 14:48:38', motorId:3, nom:'Moteur Ventilation Principal',      emplacement:'Section C',  parametre:'temperature_Moteur',   min:20,max:90,  statut:'Warning' },
  { dd:'2026-03-27 08:45:30', df:'2026-03-27 09:02:18', motorId:5, nom:'Moteur Convoyeur Bande A',          emplacement:'Section D',  parametre:'vibration_Radial_x',   min:0, max:10,  statut:'N/A' },
  { dd:'2026-03-28 15:10:22', df:'2026-03-28 15:28:45', motorId:2, nom:'Moteur Pompe Centrifuge',           emplacement:'Section A',  parametre:'vibration_Axial',       min:0, max:12,  statut:'Attention' },
  { dd:'2026-03-28 16:35:40', df:'2026-03-28 16:52:18', motorId:3, nom:'Moteur Ventilation Principal',      emplacement:'Section C',  parametre:'pression_Huile',        min:2, max:6,   statut:'Warning' },
  { dd:'2026-03-28 17:25:15', df:'2026-03-28 17:45:30', motorId:4, nom:'Moteur Compresseur Air',            emplacement:'Section E1', parametre:'temperature_Radial',   min:0, max:80,  statut:'Critique' },
  { dd:'2026-03-27 12:08:30', df:'2026-03-27 12:25:42', motorId:1, nom:'Moteur 1600 App Cylindre v1',      emplacement:'Section B',  parametre:'temperature_Radial',   min:0, max:75,  statut:'N/A' },
];

const badgeClass: Record<string,string> = { 'N/A':'badge-na', 'Attention':'badge-attention', 'Warning':'badge-warning', 'Critique':'badge-critique' };

type SortKey = 'dd'|'df'|'motorId'|'nom'|'emplacement'|'parametre'|'statut';

export default function HistoriqueAlertesPage() {
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');
  const [perPage, setPerPage] = useState(25);
  const [page, setPage]       = useState(1);
  const [sortCol, setSortCol] = useState<SortKey>('dd');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');

  const filtered = useMemo(() => {
    let data = [...ALERTES_DATA];
    if (filter !== 'all') data = data.filter(a => a.statut === filter);
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(a => a.nom.toLowerCase().includes(s) || a.emplacement.toLowerCase().includes(s) || a.parametre.toLowerCase().includes(s) || a.statut.toLowerCase().includes(s) || String(a.motorId).includes(s));
    }
    data.sort((a,b) => {
      const va = String(a[sortCol]).toLowerCase(), vb = String(b[sortCol]).toLowerCase();
      return sortDir==='asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return data;
  }, [search, filter, sortCol, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData   = filtered.slice((page-1)*perPage, page*perPage);
  const handleSort = (col: SortKey) => { if(sortCol===col) setSortDir(d=>d==='asc'?'desc':'asc'); else { setSortCol(col); setSortDir('asc'); } };

  const counts = {
    total:     ALERTES_DATA.length,
    na:        ALERTES_DATA.filter(a=>a.statut==='N/A').length,
    attention: ALERTES_DATA.filter(a=>a.statut==='Attention').length,
    warning:   ALERTES_DATA.filter(a=>a.statut==='Warning').length,
    critique:  ALERTES_DATA.filter(a=>a.statut==='Critique').length,
  };

  return (
    <AppShell>
      <div className="page-container">
        <div className="page-header">
          <div className="header-card history-header">
            <div className="header-info">
              <h1><i className="fas fa-history" /> Historique des alertes moteurs</h1>
              <p>Consultation et analyse de l&apos;historique des alertes</p>
            </div>
            <div className="header-stats">
              <div className="stat-box"><span className="stat-number">{counts.total}</span><span className="stat-label">Total</span></div>
              <div className="stat-box stat-na"><span className="stat-number">{counts.na}</span><span className="stat-label">N/A</span></div>
              <div className="stat-box stat-attention"><span className="stat-number">{counts.attention}</span><span className="stat-label">Attention</span></div>
              <div className="stat-box stat-warning"><span className="stat-number">{counts.warning}</span><span className="stat-label">Warning</span></div>
              <div className="stat-box stat-critique"><span className="stat-number">{counts.critique}</span><span className="stat-label">Critique</span></div>
            </div>
          </div>
        </div>

        <div className="filter-bar">
          <div className="filter-pills">
            {[{k:'all',l:'Tous'},{k:'N/A',l:'N/A'},{k:'Attention',l:'Attention'},{k:'Warning',l:'Warning'},{k:'Critique',l:'Critique'}].map(f=>(
              <button key={f.k} className={`filter-pill${filter===f.k?' active':''}`} onClick={()=>{setFilter(f.k);setPage(1);}}>
                <span className="pill-count">{f.k==='all'?counts.total:ALERTES_DATA.filter(a=>a.statut===f.k).length}</span>{f.l}
              </button>
            ))}
          </div>
          <div className="search-box"><i className="fas fa-search"/>
            <input type="text" placeholder="Rechercher..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
          </div>
        </div>

        <div className="table-card">
          <div className="table-header">
            <div className="show-entries">
              <label>Afficher</label>
              <select value={perPage} onChange={e=>{setPerPage(Number(e.target.value));setPage(1);}}>
                {[10,25,50,100].map(n=><option key={n} value={n}>{n}</option>)}
              </select>
              <label>entrées</label>
            </div>
          </div>
          <div className="table-responsive">
            <table className="history-table">
              <thead>
                <tr>
                  {([['dd','Début'],['df','Fin'],['motorId','ID Moteur'],['nom','Moteur'],['emplacement','Emplacement'],['parametre','Paramètre'],['statut','Statut']] as [SortKey,string][]).map(([col,lbl])=>(
                    <th key={col} className="sortable" onClick={()=>handleSort(col)}>
                      <span>{lbl} <i className={`fas fa-sort${sortCol===col?(sortDir==='asc'?'-up':'-down'):''} sort-icon`}/></span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.length===0 ? (
                  <tr><td colSpan={7} className="empty-row"><div className="empty-state"><i className="fas fa-history"/><p>Aucune alerte trouvée</p></div></td></tr>
                ) : pageData.map((a,i)=>(
                  <tr key={i}>
                    <td className="date-cell">{a.dd}</td>
                    <td className="date-cell">{a.df}</td>
                    <td><span className="motor-id">M{a.motorId}</span></td>
                    <td>{a.nom}</td>
                    <td>{a.emplacement}</td>
                    <td><span className="parametre-code">{a.parametre}</span></td>
                    <td><span className={`badge ${badgeClass[a.statut]||''}`}>{a.statut}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} perPage={perPage}/>
        </div>
      </div>
    </AppShell>
  );
}
