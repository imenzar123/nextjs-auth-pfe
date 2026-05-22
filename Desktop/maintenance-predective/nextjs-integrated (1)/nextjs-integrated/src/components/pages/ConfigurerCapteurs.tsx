'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/frontend/hooks/useAuth';

// ── Types ──────────────────────────────────────────────────────────────────
type SensorType   = 'vibration' | 'courant' | 'temperature' | 'vitesse' | 'pression';
type SensorStatut = 'actif' | 'inactif' | 'attention' | 'alarme';

interface Motor {
  id: number;
  nom: string;
}

interface Sensor {
  id: number;
  motor_id: number;
  motor?: Motor;
  nom: string;
  type: SensorType;
  unite: string;
  valeur_actuelle: number | null;
  seuil_min: number | null;
  seuil_max: number | null;
  statut: SensorStatut;
  emplacement: string | null;
  description: string | null;
  derniere_lecture_at: string | null;
}

interface SensorForm {
  motor_id: number | '';
  nom: string;
  type: SensorType;
  unite: string;
  valeur_actuelle: string;
  seuil_min: string;
  seuil_max: string;
  statut: SensorStatut;
  emplacement: string;
  description: string;
}

// ── Constants ─────────────────────────────────────────────────────────────
const SENSOR_TYPES: { value: SensorType; label: string; icon: string; defaultUnite: string }[] = [
  { value: 'vibration',   label: 'Vibration',   icon: 'fas fa-wave-square',    defaultUnite: 'mm/s' },
  { value: 'courant',     label: 'Courant',      icon: 'fas fa-bolt',           defaultUnite: 'A'    },
  { value: 'temperature', label: 'Température',  icon: 'fas fa-thermometer-half', defaultUnite: '°C' },
  { value: 'vitesse',     label: 'Vitesse',      icon: 'fas fa-tachometer-alt', defaultUnite: 'RPM'  },
  { value: 'pression',    label: 'Pression',     icon: 'fas fa-compress-alt',   defaultUnite: 'bar'  },
];

const STATUT_CONFIG: Record<SensorStatut, { label: string; color: string; bg: string; border: string }> = {
  actif:     { label: 'Actif',     color: '#22c55e', bg: '#f0fdf4', border: 'rgba(34,197,94,0.25)'  },
  inactif:   { label: 'Inactif',   color: '#94a3b8', bg: '#f8fafc', border: 'rgba(148,163,184,0.25)' },
  attention: { label: 'Attention', color: '#f59e0b', bg: '#fffbeb', border: 'rgba(245,158,11,0.25)' },
  alarme:    { label: 'Alarme',    color: '#ef4444', bg: '#fff5f5', border: 'rgba(239,68,68,0.25)'   },
};

const TYPE_ICON: Record<SensorType, string> = {
  vibration:   'fas fa-wave-square',
  courant:     'fas fa-bolt',
  temperature: 'fas fa-thermometer-half',
  vitesse:     'fas fa-tachometer-alt',
  pression:    'fas fa-compress-alt',
};

const BLANK_FORM: SensorForm = {
  motor_id: '',
  nom: '',
  type: 'vibration',
  unite: 'mm/s',
  valeur_actuelle: '',
  seuil_min: '',
  seuil_max: '',
  statut: 'actif',
  emplacement: '',
  description: '',
};

// ── Component ─────────────────────────────────────────────────────────────
export default function ConfigurerCapteursPage() {
  return (
    <AppShell>
      <ConfigurerCapteursContent />
    </AppShell>
  );
}

function ConfigurerCapteursContent() {
  const { user } = useAuth();
  const isElevated = user?.role === 'admin' || user?.role === 'operator';

  // ── Data state ──────────────────────────────────────────────────────────
  const [sensors, setSensors]   = useState<Sensor[]>([]);
  const [motors, setMotors]     = useState<Motor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError]   = useState('');

  // ── Filters ──────────────────────────────────────────────────────────────
  const [search, setSearch]         = useState('');
  const [motorFilter, setMotorFilter] = useState<number | 'all'>('all');
  const [typeFilter, setTypeFilter]   = useState<SensorType | 'all'>('all');
  const [statutFilter, setStatutFilter] = useState<SensorStatut | 'all'>('all');

  // ── Modal state ──────────────────────────────────────────────────────────
  const [showModal, setShowModal]     = useState(false);
  const [showDelete, setShowDelete]   = useState(false);
  const [editSensor, setEditSensor]   = useState<Sensor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sensor | null>(null);
  const [form, setForm]               = useState<SensorForm>({ ...BLANK_FORM });
  const [isSaving, setIsSaving]       = useState(false);
  const [modalError, setModalError]   = useState('');

  // ── Load data ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setApiError('');
    try {
      const [sensorsRes, motorsRes] = await Promise.all([
        fetch('/api/sensors'),
        fetch('/api/motors'),
      ]);
      if (!sensorsRes.ok || !motorsRes.ok) throw new Error();
      const [sensorsData, motorsData] = await Promise.all([
        sensorsRes.json() as Promise<Sensor[]>,
        motorsRes.json()  as Promise<Motor[]>,
      ]);
      setSensors(sensorsData);
      setMotors(motorsData);
    } catch {
      setApiError('Impossible de charger les données. Vérifiez que le serveur est démarré.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Filtered list ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return sensors.filter(s => {
      if (motorFilter !== 'all' && s.motor_id !== motorFilter) return false;
      if (typeFilter  !== 'all' && s.type     !== typeFilter)  return false;
      if (statutFilter !== 'all' && s.statut  !== statutFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const motorNom = motors.find(m => m.id === s.motor_id)?.nom ?? '';
        return (
          s.nom.toLowerCase().includes(q) ||
          motorNom.toLowerCase().includes(q) ||
          (s.emplacement ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [sensors, motors, motorFilter, typeFilter, statutFilter, search]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const counts = {
    total:     sensors.length,
    actif:     sensors.filter(s => s.statut === 'actif').length,
    attention: sensors.filter(s => s.statut === 'attention').length,
    alarme:    sensors.filter(s => s.statut === 'alarme').length,
    inactif:   sensors.filter(s => s.statut === 'inactif').length,
  };

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditSensor(null);
    setForm({ ...BLANK_FORM });
    setModalError('');
    setShowModal(true);
  };

  const openEdit = (s: Sensor) => {
    setEditSensor(s);
    setForm({
      motor_id:        s.motor_id,
      nom:             s.nom,
      type:            s.type,
      unite:           s.unite,
      valeur_actuelle: s.valeur_actuelle !== null ? String(s.valeur_actuelle) : '',
      seuil_min:       s.seuil_min       !== null ? String(s.seuil_min)       : '',
      seuil_max:       s.seuil_max       !== null ? String(s.seuil_max)       : '',
      statut:          s.statut,
      emplacement:     s.emplacement  ?? '',
      description:     s.description  ?? '',
    });
    setModalError('');
    setShowModal(true);
  };

  const handleTypeChange = (type: SensorType) => {
    const def = SENSOR_TYPES.find(t => t.value === type)!;
    setForm(f => ({ ...f, type, unite: def.defaultUnite }));
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const saveSensor = async () => {
    if (!form.motor_id || !form.nom.trim() || !form.type || !form.unite.trim()) {
      setModalError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setIsSaving(true);
    setModalError('');

    const payload = {
      motor_id:        Number(form.motor_id),
      nom:             form.nom.trim(),
      type:            form.type,
      unite:           form.unite.trim(),
      valeur_actuelle: form.valeur_actuelle !== '' ? Number(form.valeur_actuelle) : null,
      seuil_min:       form.seuil_min       !== '' ? Number(form.seuil_min)       : null,
      seuil_max:       form.seuil_max       !== '' ? Number(form.seuil_max)       : null,
      statut:          form.statut,
      emplacement:     form.emplacement.trim() || null,
      description:     form.description.trim() || null,
    };

    try {
      const url    = editSensor ? `/api/sensors/${editSensor.id}` : '/api/sensors';
      const method = editSensor ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setModalError(data.message ?? 'Erreur lors de l\'enregistrement.');
        return;
      }

      if (editSensor) {
        setSensors(ss => ss.map(s => s.id === editSensor.id ? data : s));
      } else {
        setSensors(ss => [...ss, data]);
      }
      setShowModal(false);
    } catch {
      setModalError('Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/sensors/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message ?? 'Erreur lors de la suppression.');
        return;
      }
      setSensors(ss => ss.filter(s => s.id !== deleteTarget.id));
    } catch {
      alert('Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setShowDelete(false);
      setDeleteTarget(null);
    }
  };

  const motorNomOf = (id: number) => motors.find(m => m.id === id)?.nom ?? `Moteur #${id}`;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="page-container">

        {/* Header */}
        <div className="page-header">
          <div className="header-card users-header">
            <div className="header-info">
              <h1><i className="fas fa-microchip" /> Configuration des Capteurs</h1>
              <p>Gérez les capteurs industriels associés à vos moteurs</p>
            </div>
            <div className="header-actions">
              {isElevated && (
                <button className="btn-add-user" onClick={openAdd}>
                  <i className="fas fa-plus" /> Ajouter un capteur
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-icon"><i className="fas fa-microchip" /></span>
            <div className="stat-content">
              <span className="stat-value">{counts.total}</span>
              <span className="stat-label">Total capteurs</span>
            </div>
          </div>
          <div className="stat-item stat-active">
            <span className="stat-icon"><i className="fas fa-check-circle" /></span>
            <div className="stat-content">
              <span className="stat-value">{counts.actif}</span>
              <span className="stat-label">Actifs</span>
            </div>
          </div>
          <div className="stat-item" style={{ borderLeft: '3px solid #f59e0b' }}>
            <span className="stat-icon" style={{ color: '#f59e0b' }}><i className="fas fa-exclamation-triangle" /></span>
            <div className="stat-content">
              <span className="stat-value" style={{ color: '#f59e0b' }}>{counts.attention}</span>
              <span className="stat-label">Attention</span>
            </div>
          </div>
          <div className="stat-item stat-inactive">
            <span className="stat-icon"><i className="fas fa-exclamation-circle" /></span>
            <div className="stat-content">
              <span className="stat-value">{counts.alarme}</span>
              <span className="stat-label">Alarmes</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <div className="filter-group" style={{ flexWrap: 'wrap', gap: '8px' }}>
            {/* Statut filter */}
            <div className="filter-pills">
              {([
                { k: 'all',       l: 'Tous' },
                { k: 'actif',     l: 'Actif' },
                { k: 'attention', l: 'Attention' },
                { k: 'alarme',    l: 'Alarme' },
                { k: 'inactif',   l: 'Inactif' },
              ] as { k: string; l: string }[]).map(f => (
                <button
                  key={f.k}
                  className={`filter-pill${statutFilter === f.k ? ' active' : ''}`}
                  onClick={() => setStatutFilter(f.k as SensorStatut | 'all')}
                >
                  {f.k !== 'all' && (
                    <span style={{
                      display: 'inline-block', width: '7px', height: '7px',
                      borderRadius: '50%', marginRight: '5px',
                      background: f.k === 'all' ? undefined : STATUT_CONFIG[f.k as SensorStatut]?.color,
                    }} />
                  )}
                  {f.l}
                </button>
              ))}
            </div>

            {/* Type filter */}
            <div className="filter-pills">
              <button
                className={`filter-pill${typeFilter === 'all' ? ' active' : ''}`}
                onClick={() => setTypeFilter('all')}
              >Tous types</button>
              {SENSOR_TYPES.map(t => (
                <button
                  key={t.value}
                  className={`filter-pill${typeFilter === t.value ? ' active' : ''}`}
                  onClick={() => setTypeFilter(t.value)}
                >
                  <i className={t.icon} style={{ marginRight: '5px' }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Motor filter */}
            <div className="input-wrapper" style={{ minWidth: '180px', margin: 0 }}>
              <i className="fas fa-cog" />
              <select
                value={motorFilter}
                onChange={e => setMotorFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              >
                <option value="all">Tous les moteurs</option>
                {motors.map(m => (
                  <option key={m.id} value={m.id}>{m.nom}</option>
                ))}
              </select>
            </div>
            {/* Search */}
            <div className="search-box">
              <i className="fas fa-search" />
              <input
                type="text"
                placeholder="Rechercher un capteur..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table card */}
        <div className="table-card">
          <div className="table-responsive">
            <table className="users-table">
              <thead>
                <tr>
                  <th><span>Capteur</span></th>
                  <th><span>Type</span></th>
                  <th><span>Moteur</span></th>
                  <th><span>Emplacement</span></th>
                  <th><span>Valeur actuelle</span></th>
                  <th><span>Seuils</span></th>
                  <th><span>Statut</span></th>
                  <th><span>Dernière lecture</span></th>
                  {isElevated && <th><span>Actions</span></th>}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={isElevated ? 9 : 8} className="empty-row">
                    <div className="empty-state">
                      <i className="fas fa-spinner fa-spin" /><p>Chargement…</p>
                    </div>
                  </td></tr>
                ) : apiError ? (
                  <tr><td colSpan={isElevated ? 9 : 8} className="empty-row">
                    <div className="empty-state">
                      <i className="fas fa-exclamation-triangle" /><p style={{ color: '#ef4444' }}>{apiError}</p>
                    </div>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={isElevated ? 9 : 8} className="empty-row">
                    <div className="empty-state">
                      <i className="fas fa-microchip" /><p>Aucun capteur trouvé</p>
                    </div>
                  </td></tr>
                ) : filtered.map(s => {
                  const st = STATUT_CONFIG[s.statut];
                  const typeInfo = SENSOR_TYPES.find(t => t.value === s.type)!;
                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                            background: 'linear-gradient(135deg,var(--primary),var(--primary-dark))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: '13px',
                          }}>
                            <i className={TYPE_ICON[s.type]} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: '14px' }}>{s.nom}</div>
                            {s.description && (
                              <div style={{ fontSize: '11px', color: 'var(--text-body)', marginTop: '1px' }}>{s.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                          background: 'rgba(53,130,141,0.08)', color: 'var(--primary)',
                          border: '1px solid rgba(53,130,141,0.2)',
                        }}>
                          <i className={typeInfo.icon} />
                          {typeInfo.label}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--text-heading)', fontWeight: 500 }}>
                          <i className="fas fa-cog" style={{ marginRight: '5px', color: 'var(--text-body)', fontSize: '11px' }} />
                          {motorNomOf(s.motor_id)}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--text-body)' }}>
                          {s.emplacement || '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text-heading)', fontSize: '14px' }}>
                          {s.valeur_actuelle !== null ? `${s.valeur_actuelle} ${s.unite}` : '—'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: 'var(--text-body)', lineHeight: 1.7 }}>
                          <div>
                            <span style={{ color: '#22c55e', fontWeight: 600 }}>Min:</span>{' '}
                            {s.seuil_min !== null ? `${s.seuil_min} ${s.unite}` : '—'}
                          </div>
                          <div>
                            <span style={{ color: '#ef4444', fontWeight: 600 }}>Max:</span>{' '}
                            {s.seuil_max !== null ? `${s.seuil_max} ${s.unite}` : '—'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                          background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: st.color, display: 'inline-block' }} />
                          {st.label}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--text-body)' }}>
                          {s.derniere_lecture_at
                            ? new Date(s.derniere_lecture_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
                            : '—'}
                        </span>
                      </td>
                      {isElevated && (
                        <td>
                          <div className="action-buttons">
                            <button className="btn-action btn-edit" title="Modifier" onClick={() => openEdit(s)}>
                              <i className="fas fa-edit" />
                            </button>
                            <button className="btn-action btn-delete" title="Supprimer" onClick={() => { setDeleteTarget(s); setShowDelete(true); }}>
                              <i className="fas fa-trash-alt" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!isLoading && !apiError && (
            <div style={{ padding: '12px 20px', fontSize: '13px', color: 'var(--text-body)', borderTop: '1px solid var(--border)' }}>
              {filtered.length} capteur{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''} sur {sensors.length}
            </div>
          )}
        </div>
      </div>

      {/* ── Add / Edit Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        titleIcon={editSensor ? 'fas fa-edit' : 'fas fa-plus-circle'}
        title={editSensor ? 'Modifier le capteur' : 'Ajouter un capteur'}
        footer={
          <>
            <button className="btn-modal btn-cancel" onClick={() => setShowModal(false)} disabled={isSaving}>
              Annuler
            </button>
            <button className="btn-modal btn-save" onClick={saveSensor} disabled={isSaving}>
              {isSaving
                ? <><i className="fas fa-spinner fa-spin" /> Enregistrement…</>
                : <><i className="fas fa-save" /> Enregistrer</>}
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

        {/* Motor */}
        <div className="form-group">
          <label>Moteur associé *</label>
          <div className="input-wrapper">
            <i className="fas fa-cog" />
            <select
              value={form.motor_id}
              onChange={e => setForm(f => ({ ...f, motor_id: Number(e.target.value) }))}
            >
              <option value="">— Sélectionner un moteur —</option>
              {motors.map(m => (
                <option key={m.id} value={m.id}>{m.nom}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Nom */}
        <div className="form-group">
          <label>Nom du capteur *</label>
          <div className="input-wrapper">
            <i className="fas fa-microchip" />
            <input
              type="text"
              placeholder="Ex: Capteur Vibration X - Palier avant"
              value={form.nom}
              onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
            />
          </div>
        </div>

        {/* Type + Unité */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Type *</label>
            <div className="input-wrapper">
              <i className="fas fa-tag" />
              <select value={form.type} onChange={e => handleTypeChange(e.target.value as SensorType)}>
                {SENSOR_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Unité *</label>
            <div className="input-wrapper">
              <i className="fas fa-ruler" />
              <input
                type="text"
                placeholder="mm/s, A, °C…"
                value={form.unite}
                onChange={e => setForm(f => ({ ...f, unite: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Valeur + Statut */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Valeur actuelle</label>
            <div className="input-wrapper">
              <i className="fas fa-chart-line" />
              <input
                type="number"
                step="any"
                placeholder="Ex: 2.4"
                value={form.valeur_actuelle}
                onChange={e => setForm(f => ({ ...f, valeur_actuelle: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Statut *</label>
            <div className="input-wrapper">
              <i className="fas fa-toggle-on" />
              <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value as SensorStatut }))}>
                <option value="actif">Actif</option>
                <option value="attention">Attention</option>
                <option value="alarme">Alarme</option>
                <option value="inactif">Inactif</option>
              </select>
            </div>
          </div>
        </div>

        {/* Seuils */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Seuil minimum</label>
            <div className="input-wrapper">
              <i className="fas fa-arrow-down" style={{ color: '#22c55e' }} />
              <input
                type="number"
                step="any"
                placeholder="Ex: 0"
                value={form.seuil_min}
                onChange={e => setForm(f => ({ ...f, seuil_min: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Seuil maximum</label>
            <div className="input-wrapper">
              <i className="fas fa-arrow-up" style={{ color: '#ef4444' }} />
              <input
                type="number"
                step="any"
                placeholder="Ex: 10"
                value={form.seuil_max}
                onChange={e => setForm(f => ({ ...f, seuil_max: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Emplacement */}
        <div className="form-group" style={{ marginTop: '12px' }}>
          <label>Emplacement</label>
          <div className="input-wrapper">
            <i className="fas fa-map-marker-alt" />
            <input
              type="text"
              placeholder="Ex: Palier avant, Axe principal…"
              value={form.emplacement}
              onChange={e => setForm(f => ({ ...f, emplacement: e.target.value }))}
            />
          </div>
        </div>

        {/* Description */}
        <div className="form-group">
          <label>Description</label>
          <div className="input-wrapper" style={{ alignItems: 'flex-start' }}>
            <i className="fas fa-align-left" style={{ marginTop: '10px' }} />
            <textarea
              placeholder="Description optionnelle du capteur…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              style={{ resize: 'vertical', padding: '8px 12px', width: '100%', fontFamily: 'inherit', fontSize: '14px', border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-heading)' }}
            />
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ──────────────────────────────────────────── */}
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
          <i className="fas fa-microchip" />
          <p>Êtes-vous sûr de vouloir supprimer ce capteur ?</p>
          <p className="delete-item-name">{deleteTarget?.nom}</p>
        </div>
      </Modal>
    </>
  );
}
