'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/frontend/hooks/useAuth';

// ── Types ──────────────────────────────────────────────────────────────────
interface Moteur {
  id: number;
  nom: string;
  modele: string;
  fabricant: string;
  emplacement: string;
  puissance: number | null;
  tension: number | null;
  courant: number | null;
  vitesse: number | null;
  cos_phi: number | null;
  date_installation: string | null;
}

type SensorType   = 'vibration' | 'courant' | 'temperature' | 'vitesse' | 'pression';
type SensorStatut = 'actif' | 'inactif' | 'attention' | 'alarme';

interface Sensor {
  id: number;
  motor_id: number;
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

interface MoteurForm {
  nom: string;
  modele: string;
  fabricant: string;
  puissance: number;
  tension: number;
  courant: number;
  vitesse: number;
  cos_phi: number;
  date_installation: string;
  emplacement: string;
}

// ── Constants ─────────────────────────────────────────────────────────────
const SENSOR_TYPES: { value: SensorType; label: string; icon: string; defaultUnite: string }[] = [
  { value: 'vibration',   label: 'Vibration',   icon: 'fas fa-wave-square',      defaultUnite: 'mm/s' },
  { value: 'courant',     label: 'Courant',      icon: 'fas fa-bolt',             defaultUnite: 'A'    },
  { value: 'temperature', label: 'Température',  icon: 'fas fa-thermometer-half', defaultUnite: '°C'   },
  { value: 'vitesse',     label: 'Vitesse',      icon: 'fas fa-tachometer-alt',   defaultUnite: 'RPM'  },
  { value: 'pression',    label: 'Pression',     icon: 'fas fa-compress-alt',     defaultUnite: 'bar'  },
];

const STATUT_CONFIG: Record<SensorStatut, { label: string; color: string; bg: string; border: string }> = {
  actif:     { label: 'Actif',     color: '#22c55e', bg: '#f0fdf4', border: 'rgba(34,197,94,0.25)'   },
  inactif:   { label: 'Inactif',   color: '#94a3b8', bg: '#f8fafc', border: 'rgba(148,163,184,0.25)' },
  attention: { label: 'Attention', color: '#f59e0b', bg: '#fffbeb', border: 'rgba(245,158,11,0.25)'  },
  alarme:    { label: 'Alarme',    color: '#ef4444', bg: '#fff5f5', border: 'rgba(239,68,68,0.25)'    },
};

const TYPE_ICON: Record<SensorType, string> = {
  vibration:   'fas fa-wave-square',
  courant:     'fas fa-bolt',
  temperature: 'fas fa-thermometer-half',
  vitesse:     'fas fa-tachometer-alt',
  pression:    'fas fa-compress-alt',
};

const BLANK_SENSOR: SensorForm = {
  nom: '', type: 'vibration', unite: 'mm/s',
  valeur_actuelle: '', seuil_min: '', seuil_max: '',
  statut: 'actif', emplacement: '', description: '',
};

const EMPTY_MOTEUR_FORM: MoteurForm = {
  nom: '', modele: '', fabricant: '', emplacement: '',
  puissance: 0, tension: 0, courant: 0, vitesse: 0, cos_phi: 0,
  date_installation: '',
};

// ── Page shell ─────────────────────────────────────────────────────────────
export default function MoteurDetailPage() {
  return (
    <AppShell>
      <MoteurDetailContent />
    </AppShell>
  );
}

// ── Content ────────────────────────────────────────────────────────────────
function MoteurDetailContent() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { user } = useAuth();

  const isAdmin    = user?.role === 'admin';
  const isElevated = user?.role === 'admin' || user?.role === 'operator';

  // ── Motor state ──────────────────────────────────────────────────────────
  const [motor,        setMotor]        = useState<Moteur | null>(null);
  const [motorLoading, setMotorLoading] = useState(true);
  const [motorError,   setMotorError]   = useState('');

  // ── Sensor state ─────────────────────────────────────────────────────────
  const [sensors,        setSensors]        = useState<Sensor[]>([]);
  const [sensorsLoading, setSensorsLoading] = useState(true);

  // ── Filters ──────────────────────────────────────────────────────────────
  const [search,        setSearch]        = useState('');
  const [typeFilter,    setTypeFilter]    = useState<SensorType | 'all'>('all');
  const [statutFilter,  setStatutFilter]  = useState<SensorStatut | 'all'>('all');

  // ── Sensor modal state ───────────────────────────────────────────────────
  const [showSensorModal, setShowSensorModal]   = useState(false);
  const [editSensor,      setEditSensor]        = useState<Sensor | null>(null);
  const [sensorForm,      setSensorForm]        = useState<SensorForm>({ ...BLANK_SENSOR });
  const [isSaving,        setIsSaving]          = useState(false);
  const [modalError,      setModalError]        = useState('');

  // ── Delete sensor ────────────────────────────────────────────────────────
  const [showDeleteSensor, setShowDeleteSensor] = useState(false);
  const [deleteSensorTarget, setDeleteSensorTarget] = useState<Sensor | null>(null);

  // ── Edit motor modal ─────────────────────────────────────────────────────
  const [showEditMotor,  setShowEditMotor]  = useState(false);
  const [motorForm,      setMotorForm]      = useState<MoteurForm>({ ...EMPTY_MOTEUR_FORM });
  const [motorSaving,    setMotorSaving]    = useState(false);

  // ── Delete motor ─────────────────────────────────────────────────────────
  const [showDeleteMotor, setShowDeleteMotor] = useState(false);

  // ── Load motor ───────────────────────────────────────────────────────────
  const loadMotor = useCallback(async () => {
    setMotorLoading(true);
    setMotorError('');
    try {
      const res = await fetch(`/api/motors/${id}`);
      if (res.status === 404) { setMotorError('Moteur introuvable.'); return; }
      if (!res.ok) throw new Error();
      setMotor(await res.json());
    } catch {
      setMotorError('Impossible de charger le moteur.');
    } finally {
      setMotorLoading(false);
    }
  }, [id]);

  // ── Load sensors ─────────────────────────────────────────────────────────
  const loadSensors = useCallback(async () => {
    setSensorsLoading(true);
    try {
      const res = await fetch(`/api/motors/${id}/sensors`);
      if (res.ok) setSensors(await res.json());
    } catch { /* keep empty list */ }
    finally { setSensorsLoading(false); }
  }, [id]);

  useEffect(() => { loadMotor(); }, [loadMotor]);
  useEffect(() => { loadSensors(); }, [loadSensors]);

  // ── Filtered sensors ─────────────────────────────────────────────────────
  const filtered = useMemo(() => sensors.filter(s => {
    if (typeFilter   !== 'all' && s.type   !== typeFilter)   return false;
    if (statutFilter !== 'all' && s.statut !== statutFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.nom.toLowerCase().includes(q) || (s.emplacement ?? '').toLowerCase().includes(q);
    }
    return true;
  }), [sensors, typeFilter, statutFilter, search]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const counts = {
    total:     sensors.length,
    actif:     sensors.filter(s => s.statut === 'actif').length,
    attention: sensors.filter(s => s.statut === 'attention').length,
    alarme:    sensors.filter(s => s.statut === 'alarme').length,
  };

  // ── Sensor modal helpers ──────────────────────────────────────────────────
  const openAddSensor = () => {
    setEditSensor(null);
    setSensorForm({ ...BLANK_SENSOR });
    setModalError('');
    setShowSensorModal(true);
  };

  const openEditSensor = (s: Sensor) => {
    setEditSensor(s);
    setSensorForm({
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
    setShowSensorModal(true);
  };

  const handleTypeChange = (type: SensorType) => {
    const def = SENSOR_TYPES.find(t => t.value === type)!;
    setSensorForm(f => ({ ...f, type, unite: def.defaultUnite }));
  };

  // ── Save sensor ───────────────────────────────────────────────────────────
  const saveSensor = async () => {
    if (!sensorForm.nom.trim() || !sensorForm.unite.trim()) {
      setModalError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setIsSaving(true);
    setModalError('');

    const payload = {
      motor_id:        Number(id),
      nom:             sensorForm.nom.trim(),
      type:            sensorForm.type,
      unite:           sensorForm.unite.trim(),
      valeur_actuelle: sensorForm.valeur_actuelle !== '' ? Number(sensorForm.valeur_actuelle) : null,
      seuil_min:       sensorForm.seuil_min       !== '' ? Number(sensorForm.seuil_min)       : null,
      seuil_max:       sensorForm.seuil_max       !== '' ? Number(sensorForm.seuil_max)       : null,
      statut:          sensorForm.statut,
      emplacement:     sensorForm.emplacement.trim() || null,
      description:     sensorForm.description.trim() || null,
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
      if (!res.ok) { setModalError(data.message ?? 'Erreur lors de l\'enregistrement.'); return; }

      if (editSensor) {
        setSensors(ss => ss.map(s => s.id === editSensor.id ? data : s));
      } else {
        setSensors(ss => [...ss, data]);
      }
      setShowSensorModal(false);
    } catch {
      setModalError('Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete sensor ─────────────────────────────────────────────────────────
  const confirmDeleteSensor = async () => {
    if (!deleteSensorTarget) return;
    try {
      const res = await fetch(`/api/sensors/${deleteSensorTarget.id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); alert(d.message ?? 'Erreur de suppression.'); return; }
      setSensors(ss => ss.filter(s => s.id !== deleteSensorTarget.id));
    } catch {
      alert('Erreur réseau.');
    } finally {
      setShowDeleteSensor(false);
      setDeleteSensorTarget(null);
    }
  };

  // ── Edit motor ────────────────────────────────────────────────────────────
  const openEditMotor = () => {
    if (!motor) return;
    setMotorForm({
      nom:               motor.nom,
      modele:            motor.modele,
      fabricant:         motor.fabricant,
      puissance:         motor.puissance ?? 0,
      tension:           motor.tension   ?? 0,
      courant:           motor.courant   ?? 0,
      vitesse:           motor.vitesse   ?? 0,
      cos_phi:           motor.cos_phi   ?? 0,
      date_installation: motor.date_installation ?? '',
      emplacement:       motor.emplacement,
    });
    setShowEditMotor(true);
  };

  const saveMotor = async () => {
    if (!motorForm.nom || !motorForm.modele || !motorForm.fabricant || !motorForm.emplacement) {
      alert('Veuillez remplir les champs obligatoires.');
      return;
    }
    setMotorSaving(true);
    try {
      const res = await fetch(`/api/motors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(motorForm),
      });
      if (!res.ok) { const d = await res.json(); alert(d.message ?? 'Erreur d\'enregistrement.'); return; }
      setMotor(await res.json());
      setShowEditMotor(false);
    } catch {
      alert('Erreur réseau.');
    } finally {
      setMotorSaving(false);
    }
  };

  // ── Delete motor ──────────────────────────────────────────────────────────
  const confirmDeleteMotor = async () => {
    try {
      const res = await fetch(`/api/motors/${id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); alert(d.message ?? 'Erreur de suppression.'); return; }
      router.push('/moteurs');
    } catch {
      alert('Erreur réseau.');
    }
  };

  // ── Render: loading / error ───────────────────────────────────────────────
  if (motorLoading) {
    return (
      <div className="page-container">
        <div className="empty-state" style={{ textAlign: 'center', padding: '80px 20px' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '48px', color: '#d1d5db', display: 'block', marginBottom: '14px' }} />
          <p style={{ color: 'var(--text-body)' }}>Chargement du moteur…</p>
        </div>
      </div>
    );
  }

  if (motorError || !motor) {
    return (
      <div className="page-container">
        <div className="empty-state" style={{ textAlign: 'center', padding: '80px 20px' }}>
          <i className="fas fa-exclamation-circle" style={{ fontSize: '48px', color: '#ef4444', display: 'block', marginBottom: '14px' }} />
          <p style={{ color: '#ef4444' }}>{motorError || 'Moteur introuvable.'}</p>
          <button
            onClick={() => router.push('/moteurs')}
            style={{ marginTop: '14px', padding: '10px 24px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}
          >
            <i className="fas fa-arrow-left" style={{ marginRight: '8px' }} />Retour aux moteurs
          </button>
        </div>
      </div>
    );
  }

  // ── Render: main ─────────────────────────────────────────────────────────
  return (
    <>
      <div className="page-container">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="page-header">
          <div className="header-card">
            <div className="header-info" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <button
                onClick={() => router.push('/moteurs')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '8px 16px', background: 'rgba(255,255,255,0.18)',
                  color: 'white', border: '1px solid rgba(255,255,255,0.35)',
                  borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                  transition: 'background 0.2s', flexShrink: 0,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.28)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}
              >
                <i className="fas fa-arrow-left" />Moteurs
              </button>
              <div>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className="fas fa-cog" />
                  {motor.nom}
                </h1>
                <p>{motor.fabricant} · {motor.modele} · {motor.emplacement}</p>
              </div>
            </div>
            <div className="header-actions">
              {isElevated && (
                <button
                  className="btn-add"
                  style={{ background: 'rgba(255,255,255,0.18)', color: 'white', border: '1px solid rgba(255,255,255,0.35)' }}
                  onClick={openEditMotor}
                >
                  <i className="fas fa-edit" /><span>Modifier</span>
                </button>
              )}
              {isAdmin && (
                <button
                  className="btn-add"
                  style={{ background: 'rgba(239,68,68,0.25)', color: 'white', border: '1px solid rgba(239,68,68,0.45)' }}
                  onClick={() => setShowDeleteMotor(true)}
                >
                  <i className="fas fa-trash-alt" /><span>Supprimer</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Motor specs ──────────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: '0 2px 12px var(--shadow)',
          padding: '24px 28px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '14px', flexShrink: 0,
            }}>
              <i className="fas fa-info-circle" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-heading)' }}>Informations du moteur</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Modèle',       value: motor.modele,                                          icon: 'fas fa-hashtag' },
              { label: 'Fabricant',    value: motor.fabricant,                                       icon: 'fas fa-industry' },
              { label: 'Emplacement',  value: motor.emplacement,                                     icon: 'fas fa-map-marker-alt' },
              { label: 'Installation', value: motor.date_installation ?? '—',                        icon: 'fas fa-calendar' },
              { label: 'Puissance',    value: motor.puissance !== null ? `${motor.puissance} kW` : '—', icon: 'fas fa-bolt' },
              { label: 'Tension',      value: motor.tension   !== null ? `${motor.tension} V`    : '—', icon: 'fas fa-plug' },
              { label: 'Courant',      value: motor.courant   !== null ? `${motor.courant} A`    : '—', icon: 'fas fa-bolt' },
              { label: 'Vitesse',      value: motor.vitesse   !== null ? `${motor.vitesse} RPM`  : '—', icon: 'fas fa-tachometer-alt' },
              { label: 'Cos φ',        value: motor.cos_phi   !== null ? String(motor.cos_phi)   : '—', icon: 'fas fa-chart-pie' },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{
                padding: '12px 14px',
                background: 'rgba(53,130,141,0.04)',
                borderRadius: '10px',
                border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-body)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <i className={icon} style={{ color: 'var(--primary)', fontSize: '10px' }} />
                  {label}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--mono)' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Sensors section header ────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '9px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '15px',
            }}>
              <i className="fas fa-microchip" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-heading)' }}>Capteurs associés</div>
              <div style={{ fontSize: '12px', color: 'var(--text-body)' }}>
                {counts.total} capteur{counts.total !== 1 ? 's' : ''} configuré{counts.total !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          {isElevated && (
            <button className="btn-add-user" onClick={openAddSensor}>
              <i className="fas fa-plus" /> Ajouter un capteur
            </button>
          )}
        </div>

        {/* ── Stats bar ─────────────────────────────────────────────────────── */}
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-icon"><i className="fas fa-microchip" /></span>
            <div className="stat-content">
              <span className="stat-value">{counts.total}</span>
              <span className="stat-label">Total</span>
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
            <span className="stat-icon" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}>
              <i className="fas fa-exclamation-triangle" />
            </span>
            <div className="stat-content">
              <span className="stat-value" style={{ color: '#f59e0b' }}>{counts.attention}</span>
              <span className="stat-label">Attention</span>
            </div>
          </div>
          <div className="stat-item stat-inactive">
            <span className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
              <i className="fas fa-exclamation-circle" />
            </span>
            <div className="stat-content">
              <span className="stat-value" style={{ color: '#ef4444' }}>{counts.alarme}</span>
              <span className="stat-label">Alarmes</span>
            </div>
          </div>
        </div>

        {/* ── Filters ───────────────────────────────────────────────────────── */}
        <div className="filter-bar">
          <div className="filter-group" style={{ flexWrap: 'wrap', gap: '8px' }}>
            {/* Statut pills */}
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
                      background: STATUT_CONFIG[f.k as SensorStatut]?.color,
                    }} />
                  )}
                  {f.l}
                </button>
              ))}
            </div>
            {/* Type pills */}
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
          <div className="search-box">
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder="Rechercher un capteur…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ── Sensors table ─────────────────────────────────────────────────── */}
        <div className="table-card">
          <div className="table-responsive">
            <table className="users-table">
              <thead>
                <tr>
                  <th><span>Capteur</span></th>
                  <th><span>Type</span></th>
                  <th><span>Emplacement</span></th>
                  <th><span>Valeur actuelle</span></th>
                  <th><span>Seuils</span></th>
                  <th><span>Statut</span></th>
                  <th><span>Dernière lecture</span></th>
                  {isElevated && <th><span>Actions</span></th>}
                </tr>
              </thead>
              <tbody>
                {sensorsLoading ? (
                  <tr><td colSpan={isElevated ? 8 : 7} className="empty-row">
                    <div className="empty-state">
                      <i className="fas fa-spinner fa-spin" /><p>Chargement des capteurs…</p>
                    </div>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={isElevated ? 8 : 7} className="empty-row">
                    <div className="empty-state">
                      <i className="fas fa-microchip" />
                      <p>{sensors.length === 0 ? 'Aucun capteur configuré pour ce moteur.' : 'Aucun capteur ne correspond aux filtres.'}</p>
                    </div>
                  </td></tr>
                ) : filtered.map(s => {
                  const st       = STATUT_CONFIG[s.statut];
                  const typeInfo = SENSOR_TYPES.find(t => t.value === s.type)!;
                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
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
                            <button className="btn-action btn-edit" title="Modifier" onClick={() => openEditSensor(s)}>
                              <i className="fas fa-edit" />
                            </button>
                            <button className="btn-action btn-delete" title="Supprimer" onClick={() => { setDeleteSensorTarget(s); setShowDeleteSensor(true); }}>
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
          {!sensorsLoading && (
            <div style={{ padding: '12px 20px', fontSize: '13px', color: 'var(--text-body)', borderTop: '1px solid var(--border)' }}>
              {filtered.length} capteur{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''} sur {sensors.length}
            </div>
          )}
        </div>
      </div>

      {/* ── Add / Edit sensor modal ──────────────────────────────────────── */}
      <Modal
        isOpen={showSensorModal}
        onClose={() => setShowSensorModal(false)}
        titleIcon={editSensor ? 'fas fa-edit' : 'fas fa-plus-circle'}
        title={editSensor ? 'Modifier le capteur' : 'Ajouter un capteur'}
        footer={
          <>
            <button className="btn-modal btn-cancel" onClick={() => setShowSensorModal(false)} disabled={isSaving}>
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

        {/* Moteur info banner — read-only */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
          background: 'rgba(53,130,141,0.06)', border: '1px solid rgba(53,130,141,0.18)',
          borderRadius: '9px', marginBottom: '16px',
        }}>
          <i className="fas fa-cog" style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-heading)', fontWeight: 600 }}>{motor.nom}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-body)' }}>— {motor.emplacement}</span>
        </div>

        {/* Nom */}
        <div className="form-group">
          <label>Nom du capteur *</label>
          <div className="input-wrapper">
            <i className="fas fa-microchip" />
            <input
              type="text"
              placeholder="Ex: Capteur Vibration X - Palier avant"
              value={sensorForm.nom}
              onChange={e => setSensorForm(f => ({ ...f, nom: e.target.value }))}
            />
          </div>
        </div>

        {/* Type + Unité */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Type *</label>
            <div className="input-wrapper">
              <i className="fas fa-tag" />
              <select value={sensorForm.type} onChange={e => handleTypeChange(e.target.value as SensorType)}>
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
                value={sensorForm.unite}
                onChange={e => setSensorForm(f => ({ ...f, unite: e.target.value }))}
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
                type="number" step="any" placeholder="Ex: 2.4"
                value={sensorForm.valeur_actuelle}
                onChange={e => setSensorForm(f => ({ ...f, valeur_actuelle: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Statut *</label>
            <div className="input-wrapper">
              <i className="fas fa-toggle-on" />
              <select value={sensorForm.statut} onChange={e => setSensorForm(f => ({ ...f, statut: e.target.value as SensorStatut }))}>
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
              <input type="number" step="any" placeholder="Ex: 0"
                value={sensorForm.seuil_min}
                onChange={e => setSensorForm(f => ({ ...f, seuil_min: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Seuil maximum</label>
            <div className="input-wrapper">
              <i className="fas fa-arrow-up" style={{ color: '#ef4444' }} />
              <input type="number" step="any" placeholder="Ex: 10"
                value={sensorForm.seuil_max}
                onChange={e => setSensorForm(f => ({ ...f, seuil_max: e.target.value }))}
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
              value={sensorForm.emplacement}
              onChange={e => setSensorForm(f => ({ ...f, emplacement: e.target.value }))}
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
              value={sensorForm.description}
              onChange={e => setSensorForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              style={{ resize: 'vertical', padding: '8px 12px', width: '100%', fontFamily: 'inherit', fontSize: '14px', border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-heading)' }}
            />
          </div>
        </div>
      </Modal>

      {/* ── Delete sensor modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={showDeleteSensor}
        onClose={() => setShowDeleteSensor(false)}
        titleIcon="fas fa-exclamation-triangle"
        title="Confirmer la suppression"
        deleteHeader
        small
        footer={
          <>
            <button className="btn-modal btn-cancel" onClick={() => setShowDeleteSensor(false)}>Annuler</button>
            <button className="btn-modal btn-delete-confirm" onClick={confirmDeleteSensor}>
              <i className="fas fa-trash" /> Confirmer
            </button>
          </>
        }
      >
        <div className="delete-message">
          <i className="fas fa-microchip" />
          <p>Êtes-vous sûr de vouloir supprimer ce capteur ?</p>
          <p className="delete-item-name">{deleteSensorTarget?.nom}</p>
        </div>
      </Modal>

      {/* ── Edit motor modal ─────────────────────────────────────────────── */}
      {showEditMotor && isElevated && (
        <div className="moteur-modal-bg" onClick={e => { if (e.target === e.currentTarget) setShowEditMotor(false); }}>
          <div className="moteur-modal-content">
            <div className="moteur-modal-header">
              <span className="moteur-modal-title"><i className="fas fa-edit" style={{ marginRight: '8px' }} />Modifier le moteur</span>
              <button className="moteur-modal-close" onClick={() => setShowEditMotor(false)}>&times;</button>
            </div>
            <div className="moteur-modal-body">
              <div className="form-section">
                <div className="form-section-title"><i className="fas fa-id-badge" />Identifiants</div>
                <div className="form-grid">
                  <div className="input-group-modern">
                    <label>Nom du moteur *</label>
                    <div className="input-wrapper"><i className="fas fa-cog input-icon" />
                      <input type="text" placeholder="Ex: Moteur Principal A" value={motorForm.nom} onChange={e => setMotorForm(f => ({ ...f, nom: e.target.value }))} />
                    </div>
                  </div>
                  <div className="input-group-modern">
                    <label>Modèle *</label>
                    <div className="input-wrapper"><i className="fas fa-hashtag input-icon" />
                      <input type="text" placeholder="Ex: ABB-M2AA160M" value={motorForm.modele} onChange={e => setMotorForm(f => ({ ...f, modele: e.target.value }))} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-section">
                <div className="form-section-title"><i className="fas fa-cogs" />Informations générales</div>
                <div className="form-grid">
                  <div className="input-group-modern">
                    <label>Fabricant *</label>
                    <div className="input-wrapper"><i className="fas fa-industry input-icon" />
                      <input type="text" placeholder="Ex: ABB, Siemens…" value={motorForm.fabricant} onChange={e => setMotorForm(f => ({ ...f, fabricant: e.target.value }))} />
                    </div>
                  </div>
                  <div className="input-group-modern">
                    <label>Emplacement *</label>
                    <div className="input-wrapper"><i className="fas fa-map-marker-alt input-icon" />
                      <input type="text" placeholder="Ex: Atelier A" value={motorForm.emplacement} onChange={e => setMotorForm(f => ({ ...f, emplacement: e.target.value }))} />
                    </div>
                  </div>
                  <div className="input-group-modern">
                    <label>Date d&apos;installation</label>
                    <div className="input-wrapper"><i className="fas fa-calendar input-icon" />
                      <input type="date" value={motorForm.date_installation} onChange={e => setMotorForm(f => ({ ...f, date_installation: e.target.value }))} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-section">
                <div className="form-section-title"><i className="fas fa-bolt" />Spécifications électriques</div>
                <div className="form-grid">
                  {([
                    { k: 'puissance', l: 'Puissance (kW)',              ph: '15' },
                    { k: 'tension',   l: 'Tension (V)',                 ph: '400' },
                    { k: 'courant',   l: 'Courant (A)',                 ph: '28' },
                    { k: 'vitesse',   l: 'Vitesse (RPM)',               ph: '1460' },
                    { k: 'cos_phi',   l: 'Facteur de puissance (cos φ)', ph: '0.89' },
                  ] as const).map(({ k, l, ph }) => (
                    <div key={k} className="input-group-modern">
                      <label>{l}</label>
                      <div className="input-wrapper"><i className="fas fa-bolt input-icon" />
                        <input
                          type="number" step="any" placeholder={ph}
                          value={motorForm[k] || ''}
                          onChange={e => setMotorForm(f => ({ ...f, [k]: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="moteur-modal-footer">
              <button className="btn-modal btn-cancel" onClick={() => setShowEditMotor(false)} disabled={motorSaving}>Annuler</button>
              <button className="btn-modal btn-save"   onClick={saveMotor}                    disabled={motorSaving}>
                {motorSaving ? <><i className="fas fa-spinner fa-spin" /> Enregistrement…</> : <><i className="fas fa-save" /> Enregistrer</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete motor modal ───────────────────────────────────────────── */}
      {showDeleteMotor && isAdmin && (
        <div className="moteur-modal-bg" onClick={e => { if (e.target === e.currentTarget) setShowDeleteMotor(false); }}>
          <div className="moteur-modal-content" style={{ maxWidth: '400px' }}>
            <div className="moteur-modal-header" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
              <span className="moteur-modal-title"><i className="fas fa-exclamation-triangle" /> Confirmer la suppression</span>
              <button className="moteur-modal-close" onClick={() => setShowDeleteMotor(false)}>&times;</button>
            </div>
            <div className="moteur-modal-body">
              <div className="delete-message">
                <i className="fas fa-cog" />
                <p>Êtes-vous sûr de vouloir supprimer ce moteur ?</p>
                <p className="delete-item-name">{motor.nom}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-body)', marginTop: '6px' }}>
                  Tous les capteurs associés seront également supprimés.
                </p>
              </div>
            </div>
            <div className="moteur-modal-footer">
              <button className="btn-modal btn-cancel"         onClick={() => setShowDeleteMotor(false)}>Annuler</button>
              <button className="btn-modal btn-delete-confirm" onClick={confirmDeleteMotor}><i className="fas fa-trash" /> Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
