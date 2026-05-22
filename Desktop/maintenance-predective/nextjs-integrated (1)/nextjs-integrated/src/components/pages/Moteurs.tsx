'use client';
import { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/frontend/hooks/useAuth';

interface Moteur {
  id: number;
  nom: string;
  modele: string;
  fabricant: string;
  puissance: number | null;
  tension: number | null;
  courant: number | null;
  vitesse: number | null;
  cos_phi: number | null;
  date_installation: string | null;
  emplacement: string;
}

type SensorStatut = 'actif' | 'inactif' | 'attention' | 'alarme';

interface Sensor {
  id: number;
  motor_id: number;
  nom: string;
  type: string;
  unite: string;
  valeur_actuelle: number | null;
  seuil_min: number | null;
  seuil_max: number | null;
  statut: SensorStatut;
  emplacement: string | null;
  description: string | null;
  derniere_lecture_at: string | null;
}

const STATUT_COLOR: Record<SensorStatut, string> = {
  actif:     '#22c55e',
  inactif:   '#94a3b8',
  attention: '#f59e0b',
  alarme:    '#ef4444',
};
const STATUT_LABEL: Record<SensorStatut, string> = {
  actif: 'Actif', inactif: 'Inactif', attention: 'Attention', alarme: 'Alarme',
};
const TYPE_ICON: Record<string, string> = {
  vibration:   'fas fa-wave-square',
  courant:     'fas fa-bolt',
  temperature: 'fas fa-thermometer-half',
  vitesse:     'fas fa-tachometer-alt',
  pression:    'fas fa-compress-alt',
};

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

const EMPTY_FORM: MoteurForm = {
  nom: '', modele: '', fabricant: '', emplacement: '',
  puissance: 0, tension: 0, courant: 0, vitesse: 0, cos_phi: 0,
  date_installation: '',
};

// MoteursPage only mounts AppShell. All logic lives in MoteursContent,
// which is rendered as a child of AppShell — inside AuthProvider.
export default function MoteursPage() {
  return (
    <AppShell>
      <MoteursContent />
    </AppShell>
  );
}

function MoteursContent() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [moteurs, setMoteurs]     = useState<Moteur[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError]   = useState('');
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDel, setShowDel]     = useState(false);
  const [editMot, setEditMot]     = useState<Moteur | null>(null);
  const [delTarget, setDelTarget] = useState<Moteur | null>(null);
  const [form, setForm]           = useState<MoteurForm>({ ...EMPTY_FORM });
  const [saving, setSaving]       = useState(false);

  // ── Motor detail modal ─────────────────────────────────────────────
  const [detailMot, setDetailMot]         = useState<Moteur | null>(null);
  const [detailSensors, setDetailSensors] = useState<Sensor[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const openDetail = useCallback(async (m: Moteur) => {
    setDetailMot(m);
    setDetailSensors([]);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/motors/${m.id}/sensors`);
      if (res.ok) setDetailSensors(await res.json());
    } catch { /* show empty sensors list */ }
    finally { setDetailLoading(false); }
  }, []);

  const loadMoteurs = useCallback(async () => {
    setIsLoading(true);
    setApiError('');
    try {
      const res = await fetch('/api/motors');
      if (!res.ok) throw new Error();
      const data: Moteur[] = await res.json();
      setMoteurs(data);
    } catch {
      setApiError('Impossible de charger les moteurs. Vérifiez que le serveur est démarré.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadMoteurs(); }, [loadMoteurs]);

  const filtered = moteurs.filter(m => {
    const s = search.toLowerCase();
    return (
      m.nom.toLowerCase().includes(s) ||
      m.modele.toLowerCase().includes(s) ||
      m.fabricant.toLowerCase().includes(s) ||
      m.emplacement.toLowerCase().includes(s)
    );
  });

  const openAdd = () => {
    setEditMot(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEdit = (m: Moteur) => {
    setEditMot(m);
    setForm({
      nom:               m.nom,
      modele:            m.modele,
      fabricant:         m.fabricant,
      puissance:         m.puissance ?? 0,
      tension:           m.tension ?? 0,
      courant:           m.courant ?? 0,
      vitesse:           m.vitesse ?? 0,
      cos_phi:           m.cos_phi ?? 0,
      date_installation: m.date_installation ?? '',
      emplacement:       m.emplacement,
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.nom || !form.modele || !form.fabricant || !form.emplacement) {
      return alert('Veuillez remplir les champs obligatoires');
    }
    setSaving(true);
    try {
      const url    = editMot ? `/api/motors/${editMot.id}` : '/api/motors';
      const method = editMot ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        return alert(err.message ?? 'Erreur lors de l\'enregistrement.');
      }
      setShowModal(false);
      await loadMoteurs();
    } catch {
      alert('Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDel = async () => {
    if (!delTarget) return;
    try {
      const res = await fetch(`/api/motors/${delTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        return alert(err.message ?? 'Erreur lors de la suppression.');
      }
      setShowDel(false);
      setDelTarget(null);
      await loadMoteurs();
    } catch {
      alert('Erreur réseau. Vérifiez votre connexion.');
    }
  };

  return (
    <>
      <div className="page-container">
        <div className="page-header">
          <div className="header-card">
            <div className="header-info">
              <h1>Configuration des Moteurs</h1>
              <p>Gérez et surveillez tous vos moteurs industriels</p>
            </div>
            <div className="header-actions">
              <div className="search-wrapper">
                <i className="fas fa-search"/>
                <input
                  type="text"
                  placeholder="Rechercher un moteur..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              {isAdmin && (
                <button className="btn-add" onClick={openAdd}>
                  <i className="fas fa-plus"/><span>Ajouter</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="list-container">
          {isLoading ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '48px', color: '#d1d5db', display: 'block', marginBottom: '14px' }}/>
              <p style={{ color: 'var(--text-body)' }}>Chargement des moteurs…</p>
            </div>
          ) : apiError ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <i className="fas fa-exclamation-circle" style={{ fontSize: '48px', color: '#ef4444', display: 'block', marginBottom: '14px' }}/>
              <p style={{ color: '#ef4444' }}>{apiError}</p>
              <button
                onClick={loadMoteurs}
                style={{ marginTop: '12px', padding: '8px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                Réessayer
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <i className="fas fa-database" style={{ fontSize: '48px', color: '#d1d5db', display: 'block', marginBottom: '14px' }}/>
              <p style={{ color: 'var(--text-body)' }}>Aucun moteur trouvé</p>
            </div>
          ) : filtered.map(m => (
            <div key={m.id} className="moteur-card">
              <div className="moteur-id-wrap">
                <div className="moteur-id-badge">M{m.id}</div>
              </div>
              <div className="moteur-main">
                <div
                  className="moteur-title"
                  style={{ cursor: 'pointer', color: 'var(--primary)' }}
                  title="Voir les détails"
                  onClick={() => openDetail(m)}
                >{m.nom}</div>
                <div className="moteur-meta">
                  <div className="moteur-meta-item"><i className="fas fa-code"/>{m.modele}</div>
                  <div className="moteur-meta-item"><i className="fas fa-industry"/>{m.fabricant}</div>
                  <div className="moteur-meta-item"><i className="fas fa-map-marker-alt"/>{m.emplacement}</div>
                  <div className="moteur-meta-item"><i className="fas fa-calendar"/>{m.date_installation ?? '—'}</div>
                </div>
              </div>
              <div className="moteur-specs">
                <div className="spec-item"><div className="spec-value">{m.puissance ?? '—'}</div><div className="spec-label">kW</div></div>
                <div className="spec-item"><div className="spec-value">{m.tension ?? '—'}</div><div className="spec-label">V</div></div>
                <div className="spec-item"><div className="spec-value">{m.vitesse ?? '—'}</div><div className="spec-label">RPM</div></div>
                <div className="spec-item"><div className="spec-value">{m.cos_phi ?? '—'}</div><div className="spec-label">cos φ</div></div>
              </div>
              <div className="moteur-actions">
                <button
                  className="btn-action"
                  title="Voir les détails"
                  style={{ background: 'rgba(53,130,141,0.10)', color: 'var(--primary)', border: '1px solid rgba(53,130,141,0.25)' }}
                  onClick={() => openDetail(m)}
                >
                  <i className="fas fa-eye"/>
                </button>
                {isAdmin && (
                  <>
                    <button className="btn-action btn-edit"   title="Modifier"   onClick={() => openEdit(m)}><i className="fas fa-edit"/></button>
                    <button className="btn-action btn-delete" title="Supprimer"  onClick={() => { setDelTarget(m); setShowDel(true); }}><i className="fas fa-trash-alt"/></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal — admin only */}
      {showModal && isAdmin && (
        <div className="moteur-modal-bg" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="moteur-modal-content">
            <div className="moteur-modal-header">
              <span className="moteur-modal-title">{editMot ? 'Modifier le moteur' : 'Ajouter un moteur'}</span>
              <button className="moteur-modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="moteur-modal-body">
              <div className="form-section">
                <div className="form-section-title"><i className="fas fa-id-badge"/>Identifiants</div>
                <div className="form-grid">
                  <div className="input-group-modern">
                    <label>Nom du moteur *</label>
                    <div className="input-wrapper"><i className="fas fa-cog input-icon"/>
                      <input type="text" placeholder="Ex: Moteur Principal A" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}/>
                    </div>
                  </div>
                  <div className="input-group-modern">
                    <label>Modèle *</label>
                    <div className="input-wrapper"><i className="fas fa-hashtag input-icon"/>
                      <input type="text" placeholder="Ex: ABB-M2AA160M" value={form.modele} onChange={e => setForm(f => ({ ...f, modele: e.target.value }))}/>
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-section">
                <div className="form-section-title"><i className="fas fa-cogs"/>Informations générales</div>
                <div className="form-grid">
                  <div className="input-group-modern">
                    <label>Fabricant *</label>
                    <div className="input-wrapper"><i className="fas fa-industry input-icon"/>
                      <input type="text" placeholder="Ex: ABB, Siemens..." value={form.fabricant} onChange={e => setForm(f => ({ ...f, fabricant: e.target.value }))}/>
                    </div>
                  </div>
                  <div className="input-group-modern">
                    <label>Emplacement *</label>
                    <div className="input-wrapper"><i className="fas fa-map-marker-alt input-icon"/>
                      <input type="text" placeholder="Ex: Atelier A" value={form.emplacement} onChange={e => setForm(f => ({ ...f, emplacement: e.target.value }))}/>
                    </div>
                  </div>
                  <div className="input-group-modern">
                    <label>Date d&apos;installation</label>
                    <div className="input-wrapper"><i className="fas fa-calendar input-icon"/>
                      <input type="date" value={form.date_installation} onChange={e => setForm(f => ({ ...f, date_installation: e.target.value }))}/>
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-section">
                <div className="form-section-title"><i className="fas fa-bolt"/>Spécifications électriques</div>
                <div className="form-grid">
                  {(
                    [
                      { k: 'puissance', l: 'Puissance (kW)',            ph: '15' },
                      { k: 'tension',   l: 'Tension (V)',               ph: '400' },
                      { k: 'courant',   l: 'Courant (A)',               ph: '28' },
                      { k: 'vitesse',   l: 'Vitesse (RPM)',             ph: '1460' },
                      { k: 'cos_phi',   l: 'Facteur de puissance (cos φ)', ph: '0.89' },
                    ] as const
                  ).map(({ k, l, ph }) => (
                    <div key={k} className="input-group-modern">
                      <label>{l}</label>
                      <div className="input-wrapper"><i className="fas fa-bolt input-icon"/>
                        <input
                          type="number"
                          step="any"
                          placeholder={ph}
                          value={form[k] || ''}
                          onChange={e => setForm(f => ({ ...f, [k]: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="moteur-modal-footer">
              <button className="btn-modal btn-cancel" onClick={() => setShowModal(false)} disabled={saving}>Annuler</button>
              <button className="btn-modal btn-save"   onClick={save}                      disabled={saving}>
                {saving ? <><i className="fas fa-spinner fa-spin"/> Enregistrement…</> : <><i className="fas fa-save"/> Enregistrer</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Motor detail modal */}
      {detailMot && (
        <div className="moteur-modal-bg" onClick={e => { if (e.target === e.currentTarget) setDetailMot(null); }}>
          <div className="moteur-modal-content" style={{ maxWidth: '720px' }}>
            <div className="moteur-modal-header">
              <span className="moteur-modal-title">
                <i className="fas fa-cog" style={{ marginRight: '8px' }}/>
                {detailMot.nom}
              </span>
              <button className="moteur-modal-close" onClick={() => setDetailMot(null)}>&times;</button>
            </div>
            <div className="moteur-modal-body">

              {/* Motor specs */}
              <div className="form-section">
                <div className="form-section-title"><i className="fas fa-info-circle"/>Informations du moteur</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '10px' }}>
                  {[
                    { l: 'Modèle',       v: detailMot.modele },
                    { l: 'Fabricant',    v: detailMot.fabricant },
                    { l: 'Emplacement',  v: detailMot.emplacement },
                    { l: 'Installation', v: detailMot.date_installation ?? '—' },
                    { l: 'Puissance',    v: detailMot.puissance !== null ? `${detailMot.puissance} kW` : '—' },
                    { l: 'Tension',      v: detailMot.tension   !== null ? `${detailMot.tension} V`   : '—' },
                    { l: 'Courant',      v: detailMot.courant   !== null ? `${detailMot.courant} A`   : '—' },
                    { l: 'Vitesse',      v: detailMot.vitesse   !== null ? `${detailMot.vitesse} RPM` : '—' },
                    { l: 'Cos φ',        v: detailMot.cos_phi   !== null ? String(detailMot.cos_phi)  : '—' },
                  ].map(({ l, v }) => (
                    <div key={l} style={{ padding: '10px 12px', background: 'rgba(53,130,141,0.04)', borderRadius: '9px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-body)', marginBottom: '3px' }}>{l}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)', fontFamily: 'var(--mono)' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sensors */}
              <div className="form-section">
                <div className="form-section-title">
                  <i className="fas fa-microchip"/>
                  Capteurs associés
                  {!detailLoading && (
                    <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 400, color: 'var(--text-body)' }}>
                      ({detailSensors.length} capteur{detailSensors.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </div>
                {detailLoading ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-body)' }}>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}/>Chargement des capteurs…
                  </div>
                ) : detailSensors.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-body)' }}>
                    <i className="fas fa-microchip" style={{ fontSize: '32px', display: 'block', marginBottom: '10px', color: '#d1d5db' }}/>
                    Aucun capteur configuré pour ce moteur.
                    {isAdmin && (
                      <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--primary)' }}>
                        Accédez à <strong>Configurer Capteurs</strong> pour en ajouter.
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {detailSensors.map(s => {
                      const col = STATUT_COLOR[s.statut];
                      return (
                        <div key={s.id} style={{
                          display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: '12px', alignItems: 'center',
                          padding: '12px 14px', borderRadius: '10px', border: `1px solid ${col}33`,
                          background: `${col}08`,
                        }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                            background: 'linear-gradient(135deg,var(--primary),var(--primary-dark))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px',
                          }}>
                            <i className={TYPE_ICON[s.type] ?? 'fas fa-microchip'} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: '14px' }}>{s.nom}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-body)', marginTop: '2px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                              {s.emplacement && <span><i className="fas fa-map-marker-alt" style={{ marginRight: '4px' }}/>{s.emplacement}</span>}
                              {s.valeur_actuelle !== null && (
                                <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--text-heading)' }}>
                                  {s.valeur_actuelle} {s.unite}
                                </span>
                              )}
                              {(s.seuil_min !== null || s.seuil_max !== null) && (
                                <span>
                                  Seuils: <span style={{ color: '#22c55e' }}>{s.seuil_min ?? '—'}</span>
                                  {' / '}
                                  <span style={{ color: '#ef4444' }}>{s.seuil_max ?? '—'} {s.unite}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                            background: `${col}18`, color: col, border: `1px solid ${col}33`, whiteSpace: 'nowrap',
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: col, display: 'inline-block' }}/>
                            {STATUT_LABEL[s.statut]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="moteur-modal-footer">
              <button className="btn-modal btn-cancel" onClick={() => setDetailMot(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm — admin only */}
      {showDel && isAdmin && (
        <div className="moteur-modal-bg" onClick={e => { if (e.target === e.currentTarget) setShowDel(false); }}>
          <div className="moteur-modal-content" style={{ maxWidth: '400px' }}>
            <div className="moteur-modal-header" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
              <span className="moteur-modal-title"><i className="fas fa-exclamation-triangle"/> Confirmer la suppression</span>
              <button className="moteur-modal-close" onClick={() => setShowDel(false)}>&times;</button>
            </div>
            <div className="moteur-modal-body">
              <div className="delete-message">
                <i className="fas fa-trash-alt"/>
                <p>Êtes-vous sûr de vouloir supprimer ce moteur ?</p>
                <p className="delete-item-name">{delTarget?.nom}</p>
              </div>
            </div>
            <div className="moteur-modal-footer">
              <button className="btn-modal btn-cancel"        onClick={() => setShowDel(false)}>Annuler</button>
              <button className="btn-modal btn-delete-confirm" onClick={confirmDel}><i className="fas fa-trash"/> Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
