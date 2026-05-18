'use client';
import { useState, useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';

interface User { id: number; nom: string; email: string; role: string; statut: string; }

const INITIAL_USERS: User[] = [
  { id: 1,  nom: 'Jean Dupont',     email: 'jean.dupont@exemple.com',     role: 'Administrateur',          statut: 'actif' },
  { id: 2,  nom: 'Marie Martin',    email: 'marie.martin@exemple.com',    role: 'Responsable maintenance', statut: 'actif' },
  { id: 3,  nom: 'Pierre Durant',   email: 'pierre.durant@exemple.com',   role: 'Consultant',              statut: 'actif' },
  { id: 4,  nom: 'Sophie Bernard',  email: 'sophie.bernard@exemple.com',  role: 'Opérateur',               statut: 'actif' },
  { id: 5,  nom: 'Lucas Moreau',    email: 'lucas.moreau@exemple.com',    role: 'Opérateur',               statut: 'inactif' },
  { id: 6,  nom: 'Emma Petit',      email: 'emma.petit@exemple.com',      role: 'Responsable maintenance', statut: 'actif' },
  { id: 7,  nom: 'Thomas Blanc',    email: 'thomas.blanc@exemple.com',    role: 'Consultant',              statut: 'actif' },
  { id: 8,  nom: 'Camille Roux',    email: 'camille.roux@exemple.com',    role: 'Opérateur',               statut: 'inactif' },
  { id: 9,  nom: 'Antoine Girard',  email: 'antoine.girard@exemple.com',  role: 'Administrateur',          statut: 'actif' },
  { id: 10, nom: 'Julie Mercier',   email: 'julie.mercier@exemple.com',   role: 'Responsable maintenance', statut: 'actif' },
  { id: 11, nom: 'Nicolas Simon',   email: 'nicolas.simon@exemple.com',   role: 'Consultant',              statut: 'inactif' },
  { id: 12, nom: 'Laura Laurent',   email: 'laura.laurent@exemple.com',   role: 'Opérateur',               statut: 'actif' },
];

const roleBadge: Record<string, string> = {
  'Administrateur':          'badge-admin',
  'Responsable maintenance': 'badge-resp',
  'Consultant':              'badge-consult',
  'Opérateur':               'badge-oper',
};

const ROLES = ['Administrateur', 'Responsable maintenance', 'Consultant', 'Opérateur'];

export default function GestionUtilisateursPage() {
  const [users, setUsers]               = useState<User[]>(INITIAL_USERS);
  const [search, setSearch]             = useState('');
  const [roleFilter, setRoleFilter]     = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [perPage, setPerPage]           = useState(25);
  const [page, setPage]                 = useState(1);
  const [sortCol, setSortCol]           = useState<keyof User>('nom');
  const [sortDir, setSortDir]           = useState<'asc'|'desc'>('asc');

  // Modal state
  const [showModal, setShowModal]       = useState(false);
  const [showDelete, setShowDelete]     = useState(false);
  const [editUser, setEditUser]         = useState<User|null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User|null>(null);
  const [showPwd, setShowPwd]           = useState(false);
  const [form, setForm] = useState({ nom:'', email:'', role:'', statut:'actif', password:'' });

  const filtered = useMemo(() => {
    let data = [...users];
    if (roleFilter !== 'all') data = data.filter(u => u.role === roleFilter);
    if (statusFilter !== 'all') data = data.filter(u => u.statut === statusFilter);
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(u => u.nom.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.role.toLowerCase().includes(s));
    }
    data.sort((a, b) => {
      const va = String(a[sortCol]).toLowerCase();
      const vb = String(b[sortCol]).toLowerCase();
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return data;
  }, [users, search, roleFilter, statusFilter, sortCol, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData   = filtered.slice((page - 1) * perPage, page * perPage);

  const handleSort = (col: keyof User) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const openAdd = () => {
    setEditUser(null);
    setForm({ nom:'', email:'', role:'', statut:'actif', password:'' });
    setShowPwd(true);
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ nom: u.nom, email: u.email, role: u.role, statut: u.statut, password:'' });
    setShowPwd(false);
    setShowModal(true);
  };

  const saveUser = () => {
    if (!form.nom || !form.email || !form.role) return alert('Veuillez remplir tous les champs obligatoires');
    if (editUser) {
      setUsers(us => us.map(u => u.id === editUser.id ? { ...u, ...form } : u));
    } else {
      const newId = Math.max(0, ...users.map(u => u.id)) + 1;
      setUsers(us => [...us, { id: newId, nom: form.nom, email: form.email, role: form.role, statut: form.statut }]);
    }
    setShowModal(false);
  };

  const confirmDelete = () => {
    if (deleteTarget) setUsers(us => us.filter(u => u.id !== deleteTarget.id));
    setShowDelete(false); setDeleteTarget(null);
  };

  const counts = {
    total:    users.length,
    active:   users.filter(u => u.statut === 'actif').length,
    inactive: users.filter(u => u.statut === 'inactif').length,
    admin:    users.filter(u => u.role === 'Administrateur').length,
  };

  return (
    <AppShell>
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div className="header-card users-header">
            <div className="header-info">
              <h1><i className="fas fa-users-cog" /> Gestion des utilisateurs</h1>
              <p>Gérez les utilisateurs et leurs permissions</p>
            </div>
            <div className="header-actions">
              <button className="btn-add-user" onClick={openAdd}>
                <i className="fas fa-plus" /> Ajouter un utilisateur
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-icon"><i className="fas fa-users" /></span>
            <div className="stat-content">
              <span className="stat-value">{counts.total}</span>
              <span className="stat-label">Total utilisateurs</span>
            </div>
          </div>
          <div className="stat-item stat-active">
            <span className="stat-icon"><i className="fas fa-user-check" /></span>
            <div className="stat-content">
              <span className="stat-value">{counts.active}</span>
              <span className="stat-label">Actifs</span>
            </div>
          </div>
          <div className="stat-item stat-inactive">
            <span className="stat-icon"><i className="fas fa-user-times" /></span>
            <div className="stat-content">
              <span className="stat-value">{counts.inactive}</span>
              <span className="stat-label">Inactifs</span>
            </div>
          </div>
          <div className="stat-item stat-admin">
            <span className="stat-icon"><i className="fas fa-user-shield" /></span>
            <div className="stat-content">
              <span className="stat-value">{counts.admin}</span>
              <span className="stat-label">Administrateurs</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <div className="filter-group">
            <div className="filter-pills">
              {[{k:'all',l:'Tous'}, {k:'Administrateur',l:'Administrateur'}, {k:'Responsable maintenance',l:'Responsable'}, {k:'Consultant',l:'Consultant'}, {k:'Opérateur',l:'Opérateur'}].map(f => (
                <button key={f.k} className={`filter-pill${roleFilter===f.k?' active':''}`} onClick={() => { setRoleFilter(f.k); setPage(1); }}>
                  <span className="pill-count">{f.k==='all' ? users.length : users.filter(u=>u.role===f.k).length}</span>
                  {f.l}
                </button>
              ))}
            </div>
            <div className="filter-pills" style={{marginLeft:'8px'}}>
              {[{k:'all',l:'Tous'},{k:'actif',l:'Actif'},{k:'inactif',l:'Inactif'}].map(f => (
                <button key={f.k} className={`filter-pill${statusFilter===f.k?' active':''}`} onClick={() => { setStatusFilter(f.k); setPage(1); }}>
                  {f.l}
                </button>
              ))}
            </div>
          </div>
          <div className="search-box">
            <i className="fas fa-search" />
            <input type="text" placeholder="Rechercher un utilisateur..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>

        {/* Table Card */}
        <div className="table-card">
          <div className="table-header">
            <div className="table-controls">
              <div className="show-entries">
                <label>Afficher</label>
                <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}>
                  {[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <label>entrées</label>
              </div>
            </div>
          </div>
          <div className="table-responsive">
            <table className="users-table">
              <thead>
                <tr>
                  {[{col:'nom' as keyof User, label:'Nom'},{col:'email' as keyof User, label:'Email'},{col:'role' as keyof User, label:'Rôle'},{col:'statut' as keyof User, label:'Statut'}].map(({col,label}) => (
                    <th key={col} className="sortable" onClick={() => handleSort(col)}>
                      <span>{label} <i className={`fas fa-sort${sortCol===col ? (sortDir==='asc'?'-up':'-down') : ''} sort-icon`} /></span>
                    </th>
                  ))}
                  <th><span>Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {pageData.length === 0 ? (
                  <tr><td colSpan={5} className="empty-row">
                    <div className="empty-state">
                      <i className="fas fa-user-slash" /><p>Aucun utilisateur trouvé</p>
                    </div>
                  </td></tr>
                ) : pageData.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.nom}</strong></td>
                    <td><span className="email-cell">{u.email}</span></td>
                    <td><span className={`badge ${roleBadge[u.role] || ''}`}>{u.role}</span></td>
                    <td><span className={`badge badge-${u.statut}`}>{u.statut}</span></td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action btn-edit" title="Modifier" onClick={() => openEdit(u)}><i className="fas fa-edit" /></button>
                        <button className="btn-action btn-delete" title="Supprimer" onClick={() => { setDeleteTarget(u); setShowDelete(true); }}><i className="fas fa-trash-alt" /></button>
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
        titleIcon={editUser ? 'fas fa-user-edit' : 'fas fa-user-plus'}
        title={editUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
        footer={
          <>
            <button className="btn-modal btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
            <button className="btn-modal btn-save" onClick={saveUser}><i className="fas fa-save" /> Enregistrer</button>
          </>
        }>
        <div className="form-group">
          <label htmlFor="uNom">Nom complet</label>
          <div className="input-wrapper">
            <i className="fas fa-user" />
            <input id="uNom" type="text" placeholder="Entrez le nom complet" value={form.nom} onChange={e => setForm(f=>({...f, nom:e.target.value}))} />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="uEmail">Email</label>
          <div className="input-wrapper">
            <i className="fas fa-envelope" />
            <input id="uEmail" type="email" placeholder="entre@exemple.com" value={form.email} onChange={e => setForm(f=>({...f, email:e.target.value}))} />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="uRole">Rôle</label>
          <div className="input-wrapper">
            <i className="fas fa-user-tag" />
            <select id="uRole" value={form.role} onChange={e => setForm(f=>({...f, role:e.target.value}))}>
              <option value="">Sélectionner un rôle...</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="uStatut">Statut</label>
          <div className="input-wrapper">
            <i className="fas fa-toggle-on" />
            <select id="uStatut" value={form.statut} onChange={e => setForm(f=>({...f, statut:e.target.value}))}>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
          </div>
        </div>
        {!editUser && (
          <div className="form-group">
            <label htmlFor="uPwd">Mot de passe</label>
            <div className="input-wrapper">
              <i className="fas fa-lock" />
              <input id="uPwd" type={showPwd ? 'text' : 'password'} placeholder="Entrez le mot de passe"
                value={form.password} onChange={e => setForm(f=>({...f, password:e.target.value}))} />
              <button type="button" className="password-toggle" onClick={() => setShowPwd(v=>!v)}>
                <i className={`fas fa-eye${showPwd?'-slash':''}`} />
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)}
        titleIcon="fas fa-exclamation-triangle" title="Confirmer la suppression"
        deleteHeader small
        footer={
          <>
            <button className="btn-modal btn-cancel" onClick={() => setShowDelete(false)}>Annuler</button>
            <button className="btn-modal btn-delete-confirm" onClick={confirmDelete}><i className="fas fa-trash" /> Confirmer</button>
          </>
        }>
        <div className="delete-message">
          <i className="fas fa-trash-alt" />
          <p>Êtes-vous sûr de vouloir supprimer cet utilisateur ?</p>
          <p className="delete-item-name">{deleteTarget?.nom}</p>
        </div>
      </Modal>
    </AppShell>
  );
}
