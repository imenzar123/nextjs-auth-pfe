'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/frontend/hooks/useAuth';

// ── Types ──────────────────────────────────────────────────────
type Role = 'admin' | 'user' | 'operator';

interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  statut: 'actif' | 'inactif';
  telephone: string | null;
  date_naissance: string | null;
  genre: 'homme' | 'femme' | null;
  poste: string | null;
  departement: string | null;
  adresse: string | null;
  date_embauche: string | null;
}

interface FormState {
  name: string;
  email: string;
  role: Role;
  statut: 'actif' | 'inactif';
  telephone: string;
  date_naissance: string;
  genre: '' | 'homme' | 'femme';
  poste: string;
  departement: string;
  adresse: string;
  date_embauche: string;
}

// ── Helpers ────────────────────────────────────────────────────
const ROLE_LABEL: Record<Role, string> = {
  admin:    'Administrateur',
  user:     'Utilisateur',
  operator: 'Opérateur',
};

const ROLE_BADGE: Record<Role, string> = {
  admin:    'badge-admin',
  user:     'badge-user',
  operator: 'badge-operator',
};

const BLANK_FORM: FormState = {
  name: '', email: '', role: 'user', statut: 'actif',
  telephone: '', date_naissance: '', genre: '', poste: '', departement: '', adresse: '', date_embauche: '',
};

// ── Component ──────────────────────────────────────────────────
// Rendered as a child of AppShell so it sits inside AuthProvider (see useAuth() below).
function GestionUtilisateursContent() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [users, setUsers]               = useState<User[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [fetchError, setFetchError]     = useState('');

  const [search, setSearch]             = useState('');
  const [roleFilter, setRoleFilter]     = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [perPage, setPerPage]           = useState(25);
  const [page, setPage]                 = useState(1);
  const [sortCol, setSortCol]           = useState<keyof User>('name');
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('asc');

  const [showModal, setShowModal]       = useState(false);
  const [showDelete, setShowDelete]     = useState(false);
  const [editUser, setEditUser]         = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [form, setForm]                 = useState<FormState>(BLANK_FORM);
  const [isSaving, setIsSaving]         = useState(false);
  const [modalError, setModalError]     = useState('');

  // ── Fetch users from API ──────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setFetchError('');
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: User[] = await res.json();
      setUsers(data);
    } catch {
      setFetchError('Impossible de charger les utilisateurs. Vérifiez votre connexion.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Filtered + sorted + paginated data ───────────────────────
  const filtered = useMemo(() => {
    let data = [...users];
    if (roleFilter !== 'all')   data = data.filter(u => u.role === roleFilter);
    if (statusFilter !== 'all') data = data.filter(u => u.statut === statusFilter);
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(u =>
        u.name.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        ROLE_LABEL[u.role].toLowerCase().includes(s),
      );
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

  // ── Modal helpers ─────────────────────────────────────────────
  const openAdd = () => {
    setEditUser(null);
    setForm(BLANK_FORM);
    setModalError('');
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({
      name: u.name, email: u.email, role: u.role, statut: u.statut,
      telephone: u.telephone ?? '',
      date_naissance: u.date_naissance ?? '',
      genre: u.genre ?? '',
      poste: u.poste ?? '',
      departement: u.departement ?? '',
      adresse: u.adresse ?? '',
      date_embauche: u.date_embauche ?? '',
    });
    setModalError('');
    setShowModal(true);
  };

  // ── Save (create or update) ───────────────────────────────────
  const saveUser = async () => {
    // À la création, tous les champs (y compris les 7 champs profil) sont obligatoires
    // (StoreUserRequest les valide en required) ; en modification ils restent optionnels
    // (UpdateUserRequest — sometimes|nullable), donc non re-vérifiés ici.
    const missingCore = !form.name.trim() || !form.email.trim() || !form.role;
    const missingProfile = !editUser && (
      !form.telephone.trim() || !form.date_naissance || !form.genre ||
      !form.poste.trim() || !form.departement.trim() || !form.adresse.trim() || !form.date_embauche
    );

    if (missingCore || missingProfile) {
      setModalError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setIsSaving(true);
    setModalError('');

    try {
      // Le statut n'est modifiable que par un admin (champ masqué sinon, cf. JSX) — on ne
      // l'envoie donc que dans ce cas pour ne jamais écraser la valeur en base autrement.
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        ...(isAdmin ? { statut: form.statut } : {}),
        telephone: form.telephone.trim() || null,
        date_naissance: form.date_naissance || null,
        genre: form.genre || null,
        poste: form.poste.trim() || null,
        departement: form.departement.trim() || null,
        adresse: form.adresse.trim() || null,
        date_embauche: form.date_embauche || null,
      };

      if (editUser) {
        // ── Update ──
        const res = await fetch(`/api/users/${editUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) { setModalError(data.message ?? 'Erreur lors de la mise à jour.'); return; }

        setUsers(us => us.map(u => (u.id === editUser.id ? data : u)));
      } else {
        // ── Create ──
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) { setModalError(data.message ?? 'Erreur lors de la création.'); return; }

        setUsers(us => [...us, data]);
      }

      setShowModal(false);
    } catch {
      setModalError('Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message ?? 'Erreur lors de la suppression.');
        return;
      }
      setUsers(us => us.filter(u => u.id !== deleteTarget.id));
    } catch {
      alert('Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setShowDelete(false);
      setDeleteTarget(null);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────
  const counts = {
    total:    users.length,
    active:   users.filter(u => u.statut === 'actif').length,
    inactive: users.filter(u => u.statut === 'inactif').length,
    admin:    users.filter(u => u.role === 'admin').length,
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <>
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
            {/* Role filter */}
            <div className="filter-pills">
              {([
                { k: 'all',      l: 'Tous' },
                { k: 'admin',    l: 'Administrateur' },
                { k: 'operator', l: 'Opérateur' },
                { k: 'user',     l: 'Utilisateur' },
              ] as { k: string; l: string }[]).map(f => (
                <button
                  key={f.k}
                  className={`filter-pill${roleFilter === f.k ? ' active' : ''}`}
                  onClick={() => { setRoleFilter(f.k); setPage(1); }}
                >
                  <span className="pill-count">
                    {f.k === 'all' ? users.length : users.filter(u => u.role === f.k).length}
                  </span>
                  {f.l}
                </button>
              ))}
            </div>
            {/* Status filter */}
            <div className="filter-pills" style={{ marginLeft: '8px' }}>
              {([
                { k: 'all',      l: 'Tous' },
                { k: 'actif',    l: 'Actif' },
                { k: 'inactif',  l: 'Inactif' },
              ] as { k: string; l: string }[]).map(f => (
                <button
                  key={f.k}
                  className={`filter-pill${statusFilter === f.k ? ' active' : ''}`}
                  onClick={() => { setStatusFilter(f.k); setPage(1); }}
                >
                  {f.l}
                </button>
              ))}
            </div>
          </div>
          <div className="search-box">
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* Table card */}
        <div className="table-card">
          <div className="table-header">
            <div className="table-controls">
              <div className="show-entries">
                <label>Afficher</label>
                <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}>
                  {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <label>entrées</label>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="users-table">
              <thead>
                <tr>
                  {([
                    { col: 'name'   as keyof User, label: 'Nom' },
                    { col: 'email'  as keyof User, label: 'Email' },
                    { col: 'role'   as keyof User, label: 'Rôle' },
                    { col: 'statut' as keyof User, label: 'Statut' },
                  ]).map(({ col, label }) => (
                    <th key={col} className="sortable" onClick={() => handleSort(col)}>
                      <span>
                        {label}{' '}
                        <i className={`fas fa-sort${sortCol === col ? (sortDir === 'asc' ? '-up' : '-down') : ''} sort-icon`} />
                      </span>
                    </th>
                  ))}
                  <th><span>Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="empty-row">
                    <div className="empty-state">
                      <i className="fas fa-spinner fa-spin" /><p>Chargement…</p>
                    </div>
                  </td></tr>
                ) : fetchError ? (
                  <tr><td colSpan={5} className="empty-row">
                    <div className="empty-state">
                      <i className="fas fa-exclamation-triangle" /><p>{fetchError}</p>
                    </div>
                  </td></tr>
                ) : pageData.length === 0 ? (
                  <tr><td colSpan={5} className="empty-row">
                    <div className="empty-state">
                      <i className="fas fa-user-slash" /><p>Aucun utilisateur trouvé</p>
                    </div>
                  </td></tr>
                ) : pageData.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong></td>
                    <td><span className="email-cell">{u.email}</span></td>
                    <td>
                      <span className={`badge ${ROLE_BADGE[u.role]}`}>
                        {ROLE_LABEL[u.role]}
                      </span>
                    </td>
                    <td><span className={`badge badge-${u.statut}`}>{u.statut}</span></td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action btn-edit"   title="Modifier"   onClick={() => openEdit(u)}><i className="fas fa-edit" /></button>
                        <button className="btn-action btn-delete" title="Supprimer"  onClick={() => { setDeleteTarget(u); setShowDelete(true); }}><i className="fas fa-trash-alt" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filtered.length}
            perPage={perPage}
          />
        </div>
      </div>

      {/* ── Add / Edit Modal ──────────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        titleIcon={editUser ? 'fas fa-user-edit' : 'fas fa-user-plus'}
        title={editUser ? "Modifier l'utilisateur" : 'Ajouter un utilisateur'}
        footer={
          <>
            <button className="btn-modal btn-cancel" onClick={() => setShowModal(false)} disabled={isSaving}>
              Annuler
            </button>
            <button className="btn-modal btn-save" onClick={saveUser} disabled={isSaving}>
              {isSaving
                ? <><i className="fas fa-spinner fa-spin" /> Enregistrement…</>
                : <><i className="fas fa-save" /> Enregistrer</>
              }
            </button>
          </>
        }
      >
        {modalError && (
          <div style={{ marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', color: '#dc2626', fontSize: '0.85rem' }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }} />
            {modalError}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="uName">Nom complet</label>
          <div className="input-wrapper">
            <i className="fas fa-user" />
            <input id="uName" type="text" placeholder="Entrez le nom complet"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="uEmail">Email</label>
          <div className="input-wrapper">
            <i className="fas fa-envelope" />
            <input id="uEmail" type="email" placeholder="exemple@domaine.com"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              readOnly={!!editUser} disabled={!!editUser}
              style={editUser ? { opacity: 0.7, cursor: 'not-allowed' } : undefined} />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="uRole">Rôle</label>
          <div className="input-wrapper">
            <i className="fas fa-user-tag" />
            <select id="uRole" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}>
              <option value="user">Utilisateur</option>
              <option value="operator">Opérateur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
        </div>

        {isAdmin && (
          <div className="form-group">
            <label htmlFor="uStatut">Statut</label>
            <div className="input-wrapper">
              <i className="fas fa-toggle-on" />
              <select id="uStatut" value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value as 'actif' | 'inactif' }))}>
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
              </select>
            </div>
          </div>
        )}

        <>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: '1 1 220px' }}>
                <label htmlFor="uTelephone">Téléphone</label>
                <div className="input-wrapper">
                  <i className="fas fa-phone" />
                  <input id="uTelephone" type="tel" placeholder="+216 ..."
                    value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} />
                </div>
              </div>
              <div className="form-group" style={{ flex: '1 1 220px' }}>
                <label htmlFor="uDateNaissance">Date de naissance</label>
                <div className="input-wrapper">
                  <i className="fas fa-birthday-cake" />
                  <input id="uDateNaissance" type="date"
                    value={form.date_naissance} onChange={e => setForm(f => ({ ...f, date_naissance: e.target.value }))} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: '1 1 220px' }}>
                <label htmlFor="uGenre">Genre</label>
                <div className="input-wrapper">
                  <i className="fas fa-venus-mars" />
                  <select id="uGenre" value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value as FormState['genre'] }))}>
                    <option value="">Non précisé</option>
                    <option value="homme">Homme</option>
                    <option value="femme">Femme</option>
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ flex: '1 1 220px' }}>
                <label htmlFor="uPoste">Poste</label>
                <div className="input-wrapper">
                  <i className="fas fa-briefcase" />
                  <input id="uPoste" type="text" placeholder="Ex. Technicien de maintenance"
                    value={form.poste} onChange={e => setForm(f => ({ ...f, poste: e.target.value }))} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: '1 1 220px' }}>
                <label htmlFor="uDepartement">Département</label>
                <div className="input-wrapper">
                  <i className="fas fa-building" />
                  <input id="uDepartement" type="text" placeholder="Ex. Maintenance"
                    value={form.departement} onChange={e => setForm(f => ({ ...f, departement: e.target.value }))} />
                </div>
              </div>
              <div className="form-group" style={{ flex: '1 1 220px' }}>
                <label htmlFor="uDateEmbauche">Date d&apos;embauche</label>
                <div className="input-wrapper">
                  <i className="fas fa-calendar-check" />
                  <input id="uDateEmbauche" type="date"
                    value={form.date_embauche} onChange={e => setForm(f => ({ ...f, date_embauche: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="uAdresse">Adresse</label>
              <div className="input-wrapper">
                <i className="fas fa-map-marker-alt" style={{ top: '22px' }} />
                <textarea id="uAdresse" rows={3} placeholder="Adresse complète"
                  value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} />
              </div>
            </div>
        </>

        {!editUser && (
          <div style={{ marginTop: '0.5rem', padding: '12px 14px', borderRadius: '8px', background: 'rgba(53,130,141,0.07)', border: '1px solid rgba(53,130,141,0.2)', fontSize: '0.83rem', color: '#35828d' }}>
            <i className="fas fa-info-circle" style={{ marginRight: '8px' }} />
            Un mot de passe sécurisé sera généré automatiquement et envoyé par e-mail à l&apos;utilisateur.
          </div>
        )}
      </Modal>

      {/* ── Delete Confirmation Modal ─────────────────────────── */}
      <Modal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        titleIcon="fas fa-exclamation-triangle"
        title="Confirmer la suppression"
        deleteHeader
        small
        footer={
          <>
            <button className="btn-modal btn-cancel" onClick={() => setShowDelete(false)}>Annuler</button>
            <button className="btn-modal btn-delete-confirm" onClick={confirmDelete}>
              <i className="fas fa-trash" /> Confirmer
            </button>
          </>
        }
      >
        <div className="delete-message">
          <i className="fas fa-trash-alt" />
          <p>Êtes-vous sûr de vouloir supprimer cet utilisateur ?</p>
          <p className="delete-item-name">{deleteTarget?.name}</p>
        </div>
      </Modal>
    </>
  );
}

export default function GestionUtilisateursPage() {
  return (
    <AppShell>
      <GestionUtilisateursContent />
    </AppShell>
  );
}
