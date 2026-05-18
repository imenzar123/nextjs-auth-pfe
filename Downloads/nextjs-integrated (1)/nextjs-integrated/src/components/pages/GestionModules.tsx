'use client';
import { useState, useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';

interface Module { id: number; nom: string; lien: string; order: number; icone: string; statut: string; description: string; dateMAJ: string; }

const INITIAL_MODULES: Module[] = [
  { id: 1,  nom: 'Aperçu général',           lien: 'vue-ensemble',      order: 1,    icone: 'fa-chart-line',    statut: 'Activé',    description: 'Vue d\'ensemble du système avec KPIs et graphiques',            dateMAJ: '2026-03-30 14:22:18' },
  { id: 2,  nom: 'Configuration des Alertes', lien: 'alertes-moteurs',   order: 5,    icone: 'fa-bell',          statut: 'Activé',    description: 'Gestion des paramètres d\'alerte pour les moteurs',             dateMAJ: '2026-03-30 10:15:42' },
  { id: 3,  nom: 'Configuration des moteurs', lien: 'moteurs',           order: 7,    icone: 'fa-cog',           statut: 'Activé',    description: 'Configuration et gestion des moteurs supervisés',               dateMAJ: '2026-03-29 16:45:33' },
  { id: 4,  nom: 'Gestion des modules',       lien: 'gestion-modules',   order: 30,   icone: 'fa-th-large',      statut: 'Activé',    description: 'Interface d\'administration des modules du dashboard',          dateMAJ: '2026-03-30 09:00:00' },
  { id: 5,  nom: 'Gestion des Utilisateurs',  lien: 'gestion-utilisateurs', order: 8, icone: 'fa-user-cog',      statut: 'Activé',    description: 'Gestion des utilisateurs et de leurs permissions',             dateMAJ: '2026-03-28 11:30:15' },
  { id: 6,  nom: 'Historique des moteurs',    lien: 'historique-graphe', order: 4,    icone: 'fa-history',       statut: 'Activé',    description: 'Consultation de l\'historique des données moteurs',            dateMAJ: '2026-03-27 08:22:45' },
  { id: 7,  nom: 'Historique et comparaison', lien: 'historique-alertes', order: 40, icone: 'fa-clipboard-list', statut: 'Activé',    description: 'Outils avancés d\'analyse comparative des données historiques', dateMAJ: '2026-03-26 14:18:22' },
  { id: 8,  nom: 'Monitoring temps réel',     lien: 'temps-reel',        order: 2,    icone: 'fa-tachometer-alt', statut: 'Activé',   description: 'Tableau de bord temps réel avec visualisations SVG',           dateMAJ: '2026-03-22 15:10:25' },
  { id: 9,  nom: 'Rapports automatisés',      lien: 'rapports_auto',     order: 60,   icone: 'fa-file-alt',      statut: 'Désactivé', description: 'Génération automatique de rapports de performance',             dateMAJ: '2026-03-21 10:05:30' },
  { id: 10, nom: 'Maintenance prédictive',    lien: 'prediction',        order: 25,   icone: 'fa-tools',         statut: 'Activé',    description: 'Analyse prédictive pour la maintenance préventive',            dateMAJ: '2026-03-20 13:40:15' },
  { id: 11, nom: 'Audit système',             lien: 'audit_systeme',     order: 75,   icone: 'fa-search',        statut: 'Désactivé', description: 'Outils d\'audit et de diagnostic du système',                  dateMAJ: '2026-03-19 08:25:20' },
  { id: 12, nom: 'Export données',            lien: 'export_donnees',    order: 35,   icone: 'fa-download',      statut: 'Activé',    description: 'Module d\'exportation des données au format CSV/Excel',        dateMAJ: '2026-03-18 16:55:40' },
  { id: 13, nom: 'API Management',            lien: 'api_management',    order: 90,   icone: 'fa-server',        statut: 'Désactivé', description: 'Configuration et monitoring des API externes',                 dateMAJ: '2026-03-17 11:15:30' },
  { id: 14, nom: 'Notifications push',        lien: 'notifications_push', order: 15,  icone: 'fa-bell',          statut: 'Activé',    description: 'Gestion des notifications push vers les appareils mobiles',    dateMAJ: '2026-03-16 14:30:45' },
  { id: 15, nom: 'Journal connexions',        lien: 'journal-connexions', order: 50,  icone: 'fa-shield-alt',    statut: 'Activé',    description: 'Suivi des connexions et tentatives d\'accès au système',       dateMAJ: '2026-03-23 12:35:48' },
  { id: 16, nom: 'KPI Indicateurs',           lien: 'kpi-indicateurs',   order: 3,    icone: 'fa-chart-bar',     statut: 'Activé',    description: 'Indicateurs clés de performance et métriques opérationnelles', dateMAJ: '2026-03-24 09:00:00' },
];

const ICONES = ['fa-th-large','fa-cog','fa-clock','fa-chart-line','fa-bell','fa-cogs','fa-tachometer-alt','fa-industry','fa-server','fa-database','fa-shield-alt','fa-user-cog','fa-tools','fa-clipboard-list','fa-history','fa-file-alt','fa-download','fa-search','fa-eye','fa-chart-bar'];

type SortKey = keyof Module;

export default function GestionModulesPage() {
  const [modules, setModules] = useState<Module[]>(INITIAL_MODULES);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');
  const [perPage, setPerPage] = useState(25);
  const [page, setPage]       = useState(1);
  const [sortCol, setSortCol] = useState<SortKey>('order');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');

  const [showModal, setShowModal]       = useState(false);
  const [showDelete, setShowDelete]     = useState(false);
  const [editMod, setEditMod]           = useState<Module|null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Module|null>(null);
  const [form, setForm] = useState({ nom:'', lien:'', order:1, icone:'', statut:'Activé', description:'' });

  const filtered = useMemo(() => {
    let data = [...modules];
    if (filter !== 'all') data = data.filter(m => m.statut === filter);
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(m => m.nom.toLowerCase().includes(s) || m.lien.toLowerCase().includes(s) || m.description.toLowerCase().includes(s));
    }
    data.sort((a, b) => {
      const va = typeof a[sortCol] === 'number' ? a[sortCol] as number : String(a[sortCol]).toLowerCase();
      const vb = typeof b[sortCol] === 'number' ? b[sortCol] as number : String(b[sortCol]).toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [modules, search, filter, sortCol, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData   = filtered.slice((page-1)*perPage, page*perPage);

  const handleSort = (col: SortKey) => {
    if (sortCol === col) setSortDir(d => d==='asc'?'desc':'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const openAdd = () => {
    setEditMod(null);
    setForm({ nom:'', lien:'', order: modules.length+1, icone:'', statut:'Activé', description:'' });
    setShowModal(true);
  };

  const openEdit = (m: Module) => {
    setEditMod(m);
    setForm({ nom: m.nom, lien: m.lien, order: m.order, icone: m.icone, statut: m.statut, description: m.description });
    setShowModal(true);
  };

  const now = () => new Date().toISOString().replace('T',' ').substring(0,19);

  const saveMod = () => {
    if (!form.nom || !form.lien || !form.icone) return alert('Veuillez remplir tous les champs obligatoires');
    if (editMod) {
      setModules(ms => ms.map(m => m.id===editMod.id ? {...m, ...form, dateMAJ: now()} : m));
    } else {
      const newId = Math.max(0, ...modules.map(m=>m.id))+1;
      setModules(ms => [...ms, { id:newId, ...form, dateMAJ: now() }]);
    }
    setShowModal(false);
  };

  const confirmDelete = () => {
    if (deleteTarget) setModules(ms => ms.filter(m => m.id !== deleteTarget.id));
    setShowDelete(false); setDeleteTarget(null);
  };

  const counts = { total: modules.length, enabled: modules.filter(m=>m.statut==='Activé').length, disabled: modules.filter(m=>m.statut==='Désactivé').length };

  return (
    <AppShell>
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div className="header-card modules-header" style={{ background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)' }}>
            <div className="header-info">
              <h1><i className="fas fa-th-large" /> Gestion des modules</h1>
              <p>Configurez les modules du dashboard</p>
            </div>
            <div className="header-actions">
              <button className="btn-add-module" onClick={openAdd}><i className="fas fa-plus" /> Ajouter un module</button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-icon"><i className="fas fa-th-large" /></span>
            <div className="stat-content"><span className="stat-value">{counts.total}</span><span className="stat-label">Total modules</span></div>
          </div>
          <div className="stat-item stat-enabled">
            <span className="stat-icon"><i className="fas fa-check-circle" /></span>
            <div className="stat-content"><span className="stat-value">{counts.enabled}</span><span className="stat-label">Activés</span></div>
          </div>
          <div className="stat-item stat-disabled">
            <span className="stat-icon"><i className="fas fa-times-circle" /></span>
            <div className="stat-content"><span className="stat-value">{counts.disabled}</span><span className="stat-label">Désactivés</span></div>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <div className="filter-pills">
            {[{k:'all',l:'Tous'},{k:'Activé',l:'Activé'},{k:'Désactivé',l:'Désactivé'}].map(f => (
              <button key={f.k} className={`filter-pill${filter===f.k?' active':''}`} onClick={() => { setFilter(f.k); setPage(1); }}>
                <span className="pill-count">{f.k==='all' ? modules.length : modules.filter(m=>m.statut===f.k).length}</span>{f.l}
              </button>
            ))}
          </div>
          <div className="search-box"><i className="fas fa-search" />
            <input type="text" placeholder="Rechercher un module..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>

        {/* Table */}
        <div className="table-card">
          <div className="table-header">
            <div className="table-controls">
              <div className="show-entries">
                <label>Afficher</label>
                <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}>
                  {[10,25,50,100].map(n=><option key={n} value={n}>{n}</option>)}
                </select>
                <label>entrées</label>
              </div>
            </div>
          </div>
          <div className="table-responsive">
            <table className="modules-table">
              <thead>
                <tr>
                  {([['nom','Nom'],['lien','Lien'],['order','Ordre'],['icone','Icône'],['statut','Statut'],['description','Description'],['dateMAJ','Date MAJ']] as [SortKey,string][]).map(([col,lbl]) => (
                    <th key={col} className="sortable" onClick={() => handleSort(col)}>
                      <span>{lbl} <i className={`fas fa-sort${sortCol===col?(sortDir==='asc'?'-up':'-down'):''} sort-icon`} /></span>
                    </th>
                  ))}
                  <th><span>Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {pageData.length===0 ? (
                  <tr><td colSpan={8} className="empty-row"><div className="empty-state"><i className="fas fa-th-large"/><p>Aucun module trouvé</p></div></td></tr>
                ) : pageData.map(m => (
                  <tr key={m.id}>
                    <td><strong>{m.nom}</strong></td>
                    <td><span className="module-link">{m.lien}</span></td>
                    <td className={`order-cell${m.order>=100?' order-high':''}`}>{m.order}</td>
                    <td className="icon-cell"><i className={`fas ${m.icone}`} /></td>
                    <td><span className={`badge badge-${m.statut==='Activé'?'enabled':'disabled'}`}>{m.statut}</span></td>
                    <td className="description-cell" title={m.description}>{m.description}</td>
                    <td className="date-cell">{m.dateMAJ}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action btn-edit" title="Modifier" onClick={() => openEdit(m)}><i className="fas fa-edit"/></button>
                        <button className="btn-action btn-delete" title="Supprimer" onClick={() => { setDeleteTarget(m); setShowDelete(true); }}><i className="fas fa-trash-alt"/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} perPage={perPage} />
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        titleIcon={editMod ? 'fas fa-edit' : 'fas fa-plus-circle'}
        title={editMod ? 'Modifier le module' : 'Ajouter un module'}
        footer={<><button className="btn-modal btn-cancel" onClick={() => setShowModal(false)}>Annuler</button><button className="btn-modal btn-save" onClick={saveMod}><i className="fas fa-save"/> Enregistrer</button></>}>
        <div className="form-row">
          <div className="form-group">
            <label>Nom du module</label>
            <div className="input-wrapper"><i className="fas fa-tag"/>
              <input type="text" placeholder="Nom du module" value={form.nom} onChange={e=>setForm(f=>({...f,nom:e.target.value}))}/>
            </div>
          </div>
          <div className="form-group">
            <label>Lien (route)</label>
            <div className="input-wrapper"><i className="fas fa-link"/>
              <input type="text" placeholder="nom-page" value={form.lien} onChange={e=>setForm(f=>({...f,lien:e.target.value}))}/>
            </div>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Ordre d'affichage</label>
            <div className="input-wrapper"><i className="fas fa-sort-numeric-up"/>
              <input type="number" placeholder="1" value={form.order} onChange={e=>setForm(f=>({...f,order:Number(e.target.value)}))}/>
            </div>
          </div>
          <div className="form-group">
            <label>Icône (FontAwesome)</label>
            <div className="input-wrapper"><i className="fas fa-icons"/>
              <select value={form.icone} onChange={e=>setForm(f=>({...f,icone:e.target.value}))}>
                <option value="">Sélectionner...</option>
                {ICONES.map(ic=><option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="form-group">
          <label>Statut</label>
          <div className="input-wrapper"><i className="fas fa-toggle-on"/>
            <select value={form.statut} onChange={e=>setForm(f=>({...f,statut:e.target.value}))}>
              <option value="Activé">Activé</option><option value="Désactivé">Désactivé</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Description</label>
          <div className="input-wrapper"><i className="fas fa-align-left" style={{top:'22px'}}/>
            <textarea placeholder="Description du module..." value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3}/>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} titleIcon="fas fa-exclamation-triangle" title="Confirmer la suppression" deleteHeader small
        footer={<><button className="btn-modal btn-cancel" onClick={() => setShowDelete(false)}>Annuler</button><button className="btn-modal btn-delete-confirm" onClick={confirmDelete}><i className="fas fa-trash"/> Confirmer</button></>}>
        <div className="delete-message">
          <i className="fas fa-trash-alt"/>
          <p>Êtes-vous sûr de vouloir supprimer ce module ?</p>
          <p className="delete-item-name">{deleteTarget?.nom}</p>
        </div>
      </Modal>
    </AppShell>
  );
}
