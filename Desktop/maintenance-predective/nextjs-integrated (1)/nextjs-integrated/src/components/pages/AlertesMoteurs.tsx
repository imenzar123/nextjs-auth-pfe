'use client';
import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import Modal from '@/components/ui/Modal';

interface Alerte { id: number; designation: string; localisation: string; parametre: string; type: string; email: string; min: number; max: number; seuil: number; activation: boolean; autreInfo: string; }

const INITIAL: Alerte[] = [
  { id:1, designation:'Moteur 1', localisation:'Atelier A',  parametre:'temperature_Radial',   type:'Warning',   email:'tech@exemple.com',        min:0,  max:80,  seuil:75,  activation:true,  autreInfo:'Surveillance continue' },
  { id:2, designation:'Moteur 2', localisation:'Atelier A',  parametre:'vibration_Radial_x',   type:'Alert',     email:'tech@exemple.com',        min:0,  max:10,  seuil:8.5, activation:true,  autreInfo:'Contrôle mensuel' },
  { id:3, designation:'Moteur 3', localisation:'Atelier B',  parametre:'pression_Huile',        type:'Caution',   email:'maintenance@exemple.com', min:2,  max:5,   seuil:4.5, activation:true,  autreInfo:'' },
  { id:4, designation:'Moteur 1', localisation:'Atelier A',  parametre:'vibration_Radial_y',   type:'Attention', email:'tech@exemple.com',        min:0,  max:10,  seuil:7,   activation:false, autreInfo:'En maintenance' },
  { id:5, designation:'Moteur 4', localisation:'Entrepôt 1', parametre:'temperature_Moteur',   type:'Alert',     email:'urgent@exemple.com',      min:20, max:120, seuil:100, activation:true,  autreInfo:'Zone sensible' },
  { id:6, designation:'Moteur 5', localisation:'Entrepôt 2', parametre:'vibration_Axial',       type:'Warning',   email:'tech@exemple.com',        min:0,  max:15,  seuil:12,  activation:true,  autreInfo:'' },
  { id:7, designation:'Moteur 2', localisation:'Atelier A',  parametre:'temperature_Radial',   type:'Caution',   email:'tech@exemple.com',        min:0,  max:85,  seuil:70,  activation:true,  autreInfo:'Surveillance été' },
  { id:8, designation:'Moteur 3', localisation:'Atelier B',  parametre:'vibration_Radial_x',   type:'Attention', email:'maintenance@exemple.com', min:0,  max:12,  seuil:9,   activation:true,  autreInfo:'Nouveaux capteurs' },
];

const typeBadge: Record<string,string> = { 'Warning':'badge-warning','Alert':'badge-critique','Caution':'badge-na','Attention':'badge-attention' };
const MOTEURS = ['Moteur 1','Moteur 2','Moteur 3','Moteur 4','Moteur 5'];
const LOCALISATIONS = ['Atelier A','Atelier B','Entrepôt 1','Entrepôt 2'];
const PARAMETRES = ['temperature_Radial','vibration_Radial_x','vibration_Radial_y','vibration_Axial','pression_Huile','temperature_Moteur'];
const TYPES = ['Warning','Caution','Attention','Alert'];
const EMPTY_FORM = { designation:'', localisation:'', parametre:'', type:'', email:'', min:0, max:0, seuil:0, autreInfo:'' };

export default function AlertesMoteursPage() {
  const [alertes, setAlertes]   = useState<Alerte[]>(INITIAL);
  const [search, setSearch]     = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDel, setShowDel]   = useState(false);
  const [editA, setEditA]       = useState<Alerte|null>(null);
  const [delTarget, setDelTarget] = useState<Alerte|null>(null);
  const [form, setForm]         = useState({ ...EMPTY_FORM });

  const filtered = alertes.filter(a => {
    const s = search.toLowerCase();
    return a.designation.toLowerCase().includes(s) || a.localisation.toLowerCase().includes(s) || a.parametre.toLowerCase().includes(s) || a.type.toLowerCase().includes(s);
  });

  const openAdd  = () => { setEditA(null); setForm({...EMPTY_FORM}); setShowModal(true); };
  const openEdit = (a: Alerte) => { setEditA(a); setForm({ designation:a.designation, localisation:a.localisation, parametre:a.parametre, type:a.type, email:a.email, min:a.min, max:a.max, seuil:a.seuil, autreInfo:a.autreInfo }); setShowModal(true); };

  const save = () => {
    if (!form.designation || !form.parametre || !form.type) return alert('Veuillez remplir les champs obligatoires');
    if (editA) setAlertes(as => as.map(a => a.id===editA.id ? {...a,...form} : a));
    else { const newId = Math.max(0,...alertes.map(a=>a.id))+1; setAlertes(as=>[...as,{id:newId,...form,activation:true}]); }
    setShowModal(false);
  };

  const toggleActivation = (id: number) => setAlertes(as => as.map(a => a.id===id ? {...a, activation:!a.activation} : a));

  return (
    <AppShell>
      <div className="page-container">
        <div className="page-header">
          <div className="header-card">
            <div className="header-info">
              <h1><i className="fas fa-bell"/> Configuration des Alertes Moteurs</h1>
              <p>Gérez les alertes et notifications de vos moteurs industriels</p>
            </div>
            <div className="header-actions">
              <div className="search-wrapper"><i className="fas fa-search"/>
                <input type="text" placeholder="Rechercher une alerte..." value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <button className="btn-add" onClick={openAdd}><i className="fas fa-plus"/><span>Ajouter alerte</span></button>
            </div>
          </div>
        </div>

        <div className="alertes-table-container">
          <table className="alertes-table">
            <thead>
              <tr>
                <th>ID</th><th>Désignation</th><th>Localisation</th><th>Paramètre</th>
                <th>Type</th><th>Email</th><th>Min</th><th>Max</th><th>Seuil</th>
                <th>Activation</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan={11} className="empty-row"><div className="empty-state"><i className="fas fa-bell-slash"/><p>Aucune alerte trouvée</p></div></td></tr>
              ) : filtered.map(a=>(
                <tr key={a.id}>
                  <td><strong>{a.id}</strong></td>
                  <td><strong>{a.designation}</strong></td>
                  <td>{a.localisation}</td>
                  <td><span className="parametre-code">{a.parametre}</span></td>
                  <td><span className={`badge ${typeBadge[a.type]||''}`}>{a.type}</span></td>
                  <td style={{fontSize:'12px',color:'var(--primary)'}}>{a.email}</td>
                  <td className="value-cell">{a.min}</td>
                  <td className="value-cell">{a.max}</td>
                  <td className="value-cell">{a.seuil}</td>
                  <td>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={a.activation} onChange={()=>toggleActivation(a.id)}/>
                      <span className="toggle-slider"/>
                    </label>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action btn-edit" title="Modifier" onClick={()=>openEdit(a)}><i className="fas fa-edit"/></button>
                      <button className="btn-action btn-delete" title="Supprimer" onClick={()=>{setDelTarget(a);setShowDel(true);}}><i className="fas fa-trash-alt"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={()=>setShowModal(false)}
        titleIcon={editA?'fas fa-edit':'fas fa-bell'} title={editA?'Modifier l\'alerte':'Ajouter une alerte'}
        footer={<><button className="btn-modal btn-cancel" onClick={()=>setShowModal(false)}>Annuler</button><button className="btn-modal btn-save" onClick={save}><i className="fas fa-save"/> Enregistrer</button></>}>
        <div className="form-section">
          <div className="form-section-title"><i className="fas fa-cogs"/>Informations générales</div>
          <div className="form-grid">
            <div className="form-group"><label>Désignation</label>
              <div className="input-wrapper"><i className="fas fa-tag"/>
                <select value={form.designation} onChange={e=>setForm(f=>({...f,designation:e.target.value}))}>
                  <option value="">Sélectionner...</option>{MOTEURS.map(m=><option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group"><label>Localisation</label>
              <div className="input-wrapper"><i className="fas fa-map-marker-alt"/>
                <select value={form.localisation} onChange={e=>setForm(f=>({...f,localisation:e.target.value}))}>
                  <option value="">Sélectionner...</option>{LOCALISATIONS.map(l=><option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group"><label>Paramètre</label>
              <div className="input-wrapper"><i className="fas fa-tachometer-alt"/>
                <select value={form.parametre} onChange={e=>setForm(f=>({...f,parametre:e.target.value}))}>
                  <option value="">Sélectionner...</option>{PARAMETRES.map(p=><option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group"><label>Type d&apos;alerte</label>
              <div className="input-wrapper"><i className="fas fa-exclamation-triangle"/>
                <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                  <option value="">Sélectionner...</option>{TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="form-section">
          <div className="form-section-title"><i className="fas fa-sliders-h"/>Paramètres d&apos;alerte</div>
          <div className="form-grid">
            <div className="form-group"><label>Min</label>
              <div className="input-wrapper"><i className="fas fa-arrow-down"/>
                <input type="number" step="0.01" value={form.min} onChange={e=>setForm(f=>({...f,min:Number(e.target.value)}))}/>
              </div>
            </div>
            <div className="form-group"><label>Max</label>
              <div className="input-wrapper"><i className="fas fa-arrow-up"/>
                <input type="number" step="0.01" value={form.max} onChange={e=>setForm(f=>({...f,max:Number(e.target.value)}))}/>
              </div>
            </div>
            <div className="form-group"><label>Seuil d&apos;alerte</label>
              <div className="input-wrapper"><i className="fas fa-bell"/>
                <input type="number" step="0.01" value={form.seuil} onChange={e=>setForm(f=>({...f,seuil:Number(e.target.value)}))}/>
              </div>
            </div>
            <div className="form-group"><label>Email d&apos;alerte</label>
              <div className="input-wrapper"><i className="fas fa-envelope"/>
                <input type="email" placeholder="alerte@exemple.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDel} onClose={()=>setShowDel(false)} titleIcon="fas fa-exclamation-triangle" title="Confirmer la suppression" deleteHeader small
        footer={<><button className="btn-modal btn-cancel" onClick={()=>setShowDel(false)}>Annuler</button><button className="btn-modal btn-delete-confirm" onClick={()=>{if(delTarget)setAlertes(as=>as.filter(a=>a.id!==delTarget.id));setShowDel(false);}}><i className="fas fa-trash"/> Confirmer</button></>}>
        <div className="delete-message"><i className="fas fa-trash-alt"/><p>Supprimer cette alerte ?</p><p className="delete-item-name">{delTarget?.designation} — {delTarget?.parametre}</p></div>
      </Modal>
    </AppShell>
  );
}
