'use client';
import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';

interface Moteur { id: number; nom: string; modele: string; fabricant: string; puissance: number; tension: number; courant: number; vitesse: number; cosPhi: number; dateInstallation: string; emplacement: string; }

const SAMPLE_MOTEURS: Moteur[] = [
  { id:1, nom:'Moteur Principal A',     modele:'ABB-M2AA160M',  fabricant:'ABB',       puissance:15,  tension:400, courant:28, vitesse:1460, cosPhi:0.89, dateInstallation:'2023-01-15', emplacement:'Atelier A - Ligne 1' },
  { id:2, nom:'Moteur Ventilation B',   modele:'SIE-5IK90GU',   fabricant:'Siemens',   puissance:7.5, tension:380, courant:15, vitesse:1440, cosPhi:0.87, dateInstallation:'2023-03-22', emplacement:'Atelier B' },
  { id:3, nom:'Moteur Pompe C',         modele:'GRL-80K2',      fabricant:'Grundfos',  puissance:5.5, tension:400, courant:11, vitesse:2900, cosPhi:0.91, dateInstallation:'2022-11-10', emplacement:'Station pompage' },
  { id:4, nom:'Moteur Convoyeur D',     modele:'LEM-LMV2',      fabricant:'Lenze',     puissance:3,   tension:230, courant:12, vitesse:1750, cosPhi:0.85, dateInstallation:'2024-02-01', emplacement:'Atelier C' },
  { id:5, nom:'Moteur Compresseur E',   modele:'SCH-K2',        fabricant:'Schneider', puissance:22,  tension:400, courant:42, vitesse:1480, cosPhi:0.92, dateInstallation:'2023-06-18', emplacement:'Local compresseurs' },
];

const EMPTY_FORM = { nom:'', modele:'', fabricant:'', puissance:0, tension:0, courant:0, vitesse:0, cosPhi:0, dateInstallation:'', emplacement:'' };

export default function MoteursPage() {
  const [moteurs, setMoteurs]   = useState<Moteur[]>(SAMPLE_MOTEURS);
  const [search, setSearch]     = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDel, setShowDel]   = useState(false);
  const [editMot, setEditMot]   = useState<Moteur|null>(null);
  const [delTarget, setDelTarget] = useState<Moteur|null>(null);
  const [form, setForm]         = useState({ ...EMPTY_FORM });

  const filtered = moteurs.filter(m => {
    const s = search.toLowerCase();
    return m.nom.toLowerCase().includes(s) || m.modele.toLowerCase().includes(s) || m.fabricant.toLowerCase().includes(s) || m.emplacement.toLowerCase().includes(s);
  });

  const openAdd = () => { setEditMot(null); setForm({...EMPTY_FORM}); setShowModal(true); };
  const openEdit = (m: Moteur) => { setEditMot(m); setForm({ nom:m.nom, modele:m.modele, fabricant:m.fabricant, puissance:m.puissance, tension:m.tension, courant:m.courant, vitesse:m.vitesse, cosPhi:m.cosPhi, dateInstallation:m.dateInstallation, emplacement:m.emplacement }); setShowModal(true); };

  const save = () => {
    if (!form.nom || !form.modele || !form.fabricant || !form.emplacement) return alert('Veuillez remplir les champs obligatoires');
    if (editMot) {
      setMoteurs(ms => ms.map(m => m.id===editMot.id ? {...m, ...form} : m));
    } else {
      const newId = Math.max(0,...moteurs.map(m=>m.id))+1;
      setMoteurs(ms => [...ms, {id:newId, ...form}]);
    }
    setShowModal(false);
  };

  const confirmDel = () => {
    if (delTarget) setMoteurs(ms => ms.filter(m=>m.id!==delTarget.id));
    setShowDel(false); setDelTarget(null);
  };

  const f = (val: string | number) => setForm(prev => prev); // helper for type

  return (
    <AppShell>
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
                <input type="text" placeholder="Rechercher un moteur..." value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <button className="btn-add" onClick={openAdd}><i className="fas fa-plus"/><span>Ajouter</span></button>
            </div>
          </div>
        </div>

        <div className="list-container">
          {filtered.length===0 ? (
            <div className="empty-state" style={{textAlign:'center',padding:'60px 20px'}}>
              <i className="fas fa-database" style={{fontSize:'48px',color:'#d1d5db',display:'block',marginBottom:'14px'}}/>
              <p style={{color:'var(--text-body)'}}>Aucun moteur trouvé</p>
            </div>
          ) : filtered.map(m => (
            <div key={m.id} className="moteur-card">
              <div className="moteur-id-wrap">
                <div className="moteur-id-badge">M{m.id}</div>
              </div>
              <div className="moteur-main">
                <div className="moteur-title">{m.nom}</div>
                <div className="moteur-meta">
                  <div className="moteur-meta-item"><i className="fas fa-code"/>{m.modele}</div>
                  <div className="moteur-meta-item"><i className="fas fa-industry"/>{m.fabricant}</div>
                  <div className="moteur-meta-item"><i className="fas fa-map-marker-alt"/>{m.emplacement}</div>
                  <div className="moteur-meta-item"><i className="fas fa-calendar"/>{m.dateInstallation}</div>
                </div>
              </div>
              <div className="moteur-specs">
                <div className="spec-item"><div className="spec-value">{m.puissance}</div><div className="spec-label">kW</div></div>
                <div className="spec-item"><div className="spec-value">{m.tension}</div><div className="spec-label">V</div></div>
                <div className="spec-item"><div className="spec-value">{m.vitesse}</div><div className="spec-label">RPM</div></div>
                <div className="spec-item"><div className="spec-value">{m.cosPhi}</div><div className="spec-label">cos φ</div></div>
              </div>
              <div className="moteur-actions">
                <button className="btn-action btn-edit" title="Modifier" onClick={()=>openEdit(m)}><i className="fas fa-edit"/></button>
                <button className="btn-action btn-delete" title="Supprimer" onClick={()=>{setDelTarget(m);setShowDel(true);}}><i className="fas fa-trash-alt"/></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="moteur-modal-bg" onClick={e=>{if(e.target===e.currentTarget) setShowModal(false);}}>
          <div className="moteur-modal-content">
            <div className="moteur-modal-header">
              <span className="moteur-modal-title">{editMot ? 'Modifier le moteur' : 'Ajouter un moteur'}</span>
              <button className="moteur-modal-close" onClick={()=>setShowModal(false)}>&times;</button>
            </div>
            <div className="moteur-modal-body">
              <div className="form-section">
                <div className="form-section-title"><i className="fas fa-id-badge"/>Identifiants</div>
                <div className="form-grid">
                  <div className="input-group-modern">
                    <label>Nom du moteur *</label>
                    <div className="input-wrapper"><i className="fas fa-cog input-icon"/>
                      <input type="text" placeholder="Ex: Moteur Principal A" value={form.nom} onChange={e=>setForm(f=>({...f,nom:e.target.value}))}/>
                    </div>
                  </div>
                  <div className="input-group-modern">
                    <label>Modèle *</label>
                    <div className="input-wrapper"><i className="fas fa-hashtag input-icon"/>
                      <input type="text" placeholder="Ex: ABB-M2AA160M" value={form.modele} onChange={e=>setForm(f=>({...f,modele:e.target.value}))}/>
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
                      <input type="text" placeholder="Ex: ABB, Siemens..." value={form.fabricant} onChange={e=>setForm(f=>({...f,fabricant:e.target.value}))}/>
                    </div>
                  </div>
                  <div className="input-group-modern">
                    <label>Emplacement *</label>
                    <div className="input-wrapper"><i className="fas fa-map-marker-alt input-icon"/>
                      <input type="text" placeholder="Ex: Atelier A" value={form.emplacement} onChange={e=>setForm(f=>({...f,emplacement:e.target.value}))}/>
                    </div>
                  </div>
                  <div className="input-group-modern">
                    <label>Date d&apos;installation</label>
                    <div className="input-wrapper"><i className="fas fa-calendar input-icon"/>
                      <input type="date" value={form.dateInstallation} onChange={e=>setForm(f=>({...f,dateInstallation:e.target.value}))}/>
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-section">
                <div className="form-section-title"><i className="fas fa-bolt"/>Spécifications électriques</div>
                <div className="form-grid">
                  {[{k:'puissance',l:'Puissance (kW)',ph:'15'},{k:'tension',l:'Tension (V)',ph:'400'},{k:'courant',l:'Courant (A)',ph:'28'},{k:'vitesse',l:'Vitesse (RPM)',ph:'1460'},{k:'cosPhi',l:'Facteur de puissance (cos φ)',ph:'0.89'}].map(({k,l,ph})=>(
                    <div key={k} className="input-group-modern">
                      <label>{l}</label>
                      <div className="input-wrapper"><i className="fas fa-bolt input-icon"/>
                        <input type="number" step="any" placeholder={ph} value={(form as Record<string,number|string>)[k] || ''} onChange={e=>setForm(f=>({...f,[k]:Number(e.target.value)}))}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="moteur-modal-footer">
              <button className="btn-modal btn-cancel" onClick={()=>setShowModal(false)}>Annuler</button>
              <button className="btn-modal btn-save" onClick={save}><i className="fas fa-save"/> Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {showDel && (
        <div className="moteur-modal-bg" onClick={e=>{if(e.target===e.currentTarget) setShowDel(false);}}>
          <div className="moteur-modal-content" style={{maxWidth:'400px'}}>
            <div className="moteur-modal-header" style={{background:'linear-gradient(135deg,#ef4444,#dc2626)'}}>
              <span className="moteur-modal-title"><i className="fas fa-exclamation-triangle"/> Confirmer la suppression</span>
              <button className="moteur-modal-close" onClick={()=>setShowDel(false)}>&times;</button>
            </div>
            <div className="moteur-modal-body">
              <div className="delete-message">
                <i className="fas fa-trash-alt"/>
                <p>Êtes-vous sûr de vouloir supprimer ce moteur ?</p>
                <p className="delete-item-name">{delTarget?.nom}</p>
              </div>
            </div>
            <div className="moteur-modal-footer">
              <button className="btn-modal btn-cancel" onClick={()=>setShowDel(false)}>Annuler</button>
              <button className="btn-modal btn-delete-confirm" onClick={confirmDel}><i className="fas fa-trash"/> Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
