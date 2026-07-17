'use client';
import { useState, useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import Pagination from '@/components/ui/Pagination';

interface Connexion { id: number; email: string; ip: string; agent: string; resultat: string; message: string; date: string; }

const CONNEXIONS: Connexion[] = [
  { id:65, email:'medchrifa@gmail.com',  ip:'10.212.134.18',  agent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',               resultat:'Succès', message:'Connexion réussie',       date:'2026-03-25 11:57:38' },
  { id:64, email:'medchrifa@gmail.com',  ip:'10.212.134.18',  agent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',               resultat:'Échec',  message:'Mot de passe incorrect',  date:'2026-03-25 11:57:27' },
  { id:63, email:'medchrifa@gmail.com',  ip:'10.34.0.28',     agent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/119.0.0.0',         resultat:'Succès', message:'Connexion réussie',       date:'2026-03-17 12:01:09' },
  { id:62, email:'admin@test.com',       ip:'192.168.1.45',   agent:'Mozilla/5.0 (X11; Linux x86_64) Chrome/118.0.0.0',                        resultat:'Succès', message:'Connexion réussie',       date:'2026-03-16 09:23:15' },
  { id:61, email:'admin@test.com',       ip:'192.168.1.45',   agent:'Mozilla/5.0 (X11; Linux x86_64) Chrome/118.0.0.0',                        resultat:'Échec',  message:'Compte verrouillé',       date:'2026-03-16 09:22:58' },
  { id:60, email:'medchrifa@gmail.com',  ip:'10.212.134.18',  agent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1',                   resultat:'Succès', message:'Connexion réussie',       date:'2026-03-15 14:30:22' },
  { id:59, email:'medchrifa@gmail.com',  ip:'10.212.134.18',  agent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',               resultat:'Échec',  message:'Email non trouvé',        date:'2026-03-14 16:45:10' },
  { id:58, email:'user@test.fr',         ip:'172.16.0.89',    agent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',          resultat:'Succès', message:'Connexion réussie',       date:'2026-03-13 11:12:33' },
  { id:57, email:'user@test.fr',         ip:'172.16.0.89',    agent:'Mozilla/5.0 (Windows NT 10.0; rv:109.0) Firefox/121.0',                    resultat:'Échec',  message:'Mot de passe incorrect',  date:'2026-03-13 11:11:45' },
  { id:56, email:'medchrifa@gmail.com',  ip:'10.212.134.18',  agent:'Mozilla/5.0 (Linux; Android 14) Chrome/120.0.0.0 Mobile',                  resultat:'Succès', message:'Connexion réussie',       date:'2026-03-12 08:30:00' },
  { id:55, email:'admin@test.com',       ip:'192.168.1.100',  agent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119.0.0.0',               resultat:'Succès', message:'Connexion réussie',       date:'2026-03-11 15:22:18' },
  { id:54, email:'medchrifa@gmail.com',  ip:'10.212.134.18',  agent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/118.0.0.0',         resultat:'Échec',  message:'Session expirée',         date:'2026-03-10 13:45:32' },
  { id:53, email:'test@exemple.com',     ip:'10.50.0.15',     agent:'Mozilla/5.0 (X11; Ubuntu; Linux x86_64) Firefox/120.0',                    resultat:'Succès', message:'Connexion réussie',       date:'2026-03-09 10:00:00' },
  { id:52, email:'test@exemple.com',     ip:'10.50.0.15',     agent:'Mozilla/5.0 (X11; Ubuntu; Linux x86_64) Firefox/120.0',                    resultat:'Échec',  message:'Mot de passe incorrect',  date:'2026-03-09 09:58:44' },
  { id:51, email:'medchrifa@gmail.com',  ip:'10.212.134.18',  agent:'Mozilla/5.0 (iPad; CPU OS 17_0) Safari/604.1',                             resultat:'Succès', message:'Connexion réussie',       date:'2026-03-08 17:30:15' },
  { id:50, email:'admin@test.com',       ip:'10.0.0.1',       agent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0',                 resultat:'Succès', message:'Connexion réussie',       date:'2026-03-07 09:15:00' },
  { id:49, email:'user2@exemple.com',    ip:'192.168.0.55',   agent:'Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/121.0.0.0',                 resultat:'Échec',  message:'Mot de passe incorrect',  date:'2026-03-06 14:22:10' },
  { id:48, email:'user2@exemple.com',    ip:'192.168.0.55',   agent:'Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/121.0.0.0',                 resultat:'Succès', message:'Connexion réussie',       date:'2026-03-06 14:23:05' },
  { id:47, email:'medchrifa@gmail.com',  ip:'10.212.134.18',  agent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',               resultat:'Succès', message:'Connexion réussie',       date:'2026-03-05 10:00:00' },
  { id:46, email:'operator1@usine.fr',   ip:'172.20.0.10',    agent:'Mozilla/5.0 (X11; Linux x86_64) Firefox/119.0',                            resultat:'Succès', message:'Connexion réussie',       date:'2026-03-04 08:05:30' },
  { id:45, email:'operator1@usine.fr',   ip:'172.20.0.10',    agent:'Mozilla/5.0 (X11; Linux x86_64) Firefox/119.0',                            resultat:'Échec',  message:'Compte inactif',          date:'2026-03-04 08:04:55' },
  { id:44, email:'admin@test.com',       ip:'10.0.0.1',       agent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',               resultat:'Succès', message:'Connexion réussie',       date:'2026-03-03 16:40:00' },
  { id:43, email:'test@exemple.com',     ip:'10.50.0.15',     agent:'Mozilla/5.0 (X11; Ubuntu; Linux x86_64) Chrome/118.0.0.0',                 resultat:'Succès', message:'Connexion réussie',       date:'2026-03-02 11:30:22' },
];

type SortKey = keyof Connexion;

export default function JournalConnexionsPage() {
  const [search, setSearch]   = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage]       = useState(1);
  const [sortCol, setSortCol] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');

  const filtered = useMemo(() => {
    let data = [...CONNEXIONS];
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(c => c.email.toLowerCase().includes(s) || c.ip.includes(s) || c.resultat.toLowerCase().includes(s) || c.message.toLowerCase().includes(s) || c.date.includes(s));
    }
    data.sort((a,b) => {
      const va = typeof a[sortCol]==='number' ? a[sortCol] as number : String(a[sortCol]).toLowerCase();
      const vb = typeof b[sortCol]==='number' ? b[sortCol] as number : String(b[sortCol]).toLowerCase();
      if (va < vb) return sortDir==='asc'?-1:1;
      if (va > vb) return sortDir==='asc'?1:-1;
      return 0;
    });
    return data;
  }, [search, sortCol, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData   = filtered.slice((page-1)*perPage, page*perPage);
  const handleSort = (col: SortKey) => { if(sortCol===col) setSortDir(d=>d==='asc'?'desc':'asc'); else { setSortCol(col); setSortDir('asc'); } };

  return (
    <AppShell>
      <div className="page-container">
        <div className="page-header">
          <div className="header-card">
            <div className="header-info">
              <h1><i className="fas fa-history" style={{color:'#FFA500'}} /> Journal des connexions</h1>
              <p>Historique des connexions des utilisateurs</p>
            </div>
          </div>
        </div>

        <div className="table-card">
          <div className="table-header">
            <div className="table-controls">
              <div className="show-entries">
                <label>Afficher</label>
                <select value={perPage} onChange={e=>{setPerPage(Number(e.target.value));setPage(1);}}>
                  {[10,25,50,100].map(n=><option key={n} value={n}>{n}</option>)}
                </select>
                <label>entrées</label>
              </div>
              <div className="search-box" style={{position:'relative'}}>
                <i className="fas fa-search" style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',color:'var(--text-body)'}}/>
                <input type="text" placeholder="Rechercher..." value={search}
                  onChange={e=>{setSearch(e.target.value);setPage(1);}}
                  style={{padding:'8px 12px 8px 36px',border:'1px solid var(--border)',borderRadius:'8px',fontSize:'14px',background:'var(--bg-card)',color:'var(--text-heading)',outline:'none',width:'200px'}}/>
              </div>
            </div>
          </div>
          <div className="table-responsive">
            <table className="connexions-table" style={{minWidth:'900px'}}>
              <thead>
                <tr>
                  {([['id','#'],['email','Email'],['ip','IP'],['agent','Agent'],['resultat','Résultat'],['message','Message'],['date','Date']] as [SortKey,string][]).map(([col,lbl])=>(
                    <th key={col} className="sortable" onClick={()=>handleSort(col)}>
                      {lbl} <i className={`fas fa-sort${sortCol===col?(sortDir==='asc'?'-up':'-down'):''} sort-icon`}/>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.length===0 ? (
                  <tr><td colSpan={7} className="empty-row"><div className="empty-state"><i className="fas fa-sign-in-alt"/><p>Aucune connexion trouvée</p></div></td></tr>
                ) : pageData.map(c=>(
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td className="email-cell">{c.email}</td>
                    <td className="ip-cell">{c.ip}</td>
                    <td className="agent-cell" title={c.agent}>{c.agent}</td>
                    <td><span className={`badge badge-${c.resultat==='Succès'?'success':'danger'}`}>{c.resultat}</span></td>
                    <td>{c.message}</td>
                    <td className="date-cell">{c.date}</td>
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
