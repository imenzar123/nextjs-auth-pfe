const motors = [
  { id: 'M1',  cx: 140, cy: 79,  ring: 27, dot: 18, type: 'high' as const },
  { id: 'M2',  cx: 169, cy: 110, ring: 25, dot: 17, type: 'high' as const },
  { id: 'M3',  cx: 203, cy: 132, ring: 23, dot: 16, type: 'high' as const },
  { id: 'M4',  cx: 253, cy: 154, ring: 22, dot: 15, type: 'mod' as const },
  { id: 'M5',  cx: 288, cy: 173, ring: 20, dot: 14, type: 'mod' as const },
  { id: 'M6',  cx: 366, cy: 199, ring: 19, dot: 13, type: 'mod' as const },
  { id: 'M7',  cx: 435, cy: 229, ring: 17, dot: 11, type: 'low' as const },
  { id: 'M8',  cx: 499, cy: 246, ring: 17, dot: 11, type: 'low' as const },
  { id: 'M9',  cx: 548, cy: 260, ring: 16, dot: 10, type: 'low' as const },
  { id: 'M10', cx: 622, cy: 274, ring: 15, dot: 9,  type: 'low' as const },
  { id: 'M11', cx: 696, cy: 285, ring: 15, dot: 9,  type: 'low' as const },
  { id: 'M12', cx: 814, cy: 294, ring: 14, dot: 8,  type: 'low' as const },
];

export default function ScatterPlot() {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Nuage de Points — Durée de Vie Résiduelle vs Indice de Dégradation</div>
          <div className="card-sub">Axe X → RUL (jours) · Axe Y → DI · Couleur + taille → niveau de risque · 12 moteurs</div>
        </div>
        <div className="card-badge">SVG · axes propres</div>
      </div>
      <svg className="scatter-svg" viewBox="0 0 950 370" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="zh" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="rgba(26,79,85,.09)" />
            <stop offset="100%" stopColor="rgba(26,79,85,0)" />
          </linearGradient>
          <linearGradient id="zl" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="rgba(176,225,232,0)" />
            <stop offset="100%" stopColor="rgba(176,225,232,.14)" />
          </linearGradient>
        </defs>
        {/* Zone fills */}
        <rect x="80" y="28" width="200" height="280" fill="url(#zh)" rx="6" />
        <rect x="560" y="28" width="310" height="280" fill="url(#zl)" rx="6" />
        {/* Grid */}
        <g className="s-grid">
          <line x1="80"  y1="98"  x2="870" y2="98" />
          <line x1="80"  y1="168" x2="870" y2="168" />
          <line x1="80"  y1="238" x2="870" y2="238" />
          <line x1="278" y1="28"  x2="278" y2="308" />
          <line x1="476" y1="28"  x2="476" y2="308" />
          <line x1="674" y1="28"  x2="674" y2="308" />
        </g>
        {/* Axes */}
        <line x1="80" y1="28"  x2="80"  y2="312" stroke="var(--border)" strokeWidth="1.5" />
        <line x1="80" y1="308" x2="878" y2="308" stroke="var(--border)" strokeWidth="1.5" />
        {/* Y labels */}
        {[{v:'1.0',y:32},{v:'0.75',y:102},{v:'0.50',y:172},{v:'0.25',y:242},{v:'0.0',y:312}].map(l => (
          <text key={l.v} className="s-ax-lbl" x="72" y={l.y} textAnchor="end">{l.v}</text>
        ))}
        {/* X labels */}
        {[{v:'0',x:80},{v:'40',x:278},{v:'80',x:476},{v:'120',x:674},{v:'160',x:870}].map(l => (
          <text key={l.v} className="s-ax-lbl" x={l.x} y="326" textAnchor="middle">{l.v}</text>
        ))}
        {/* Axis titles */}
        <text className="s-ax-title" x="475" y="348" textAnchor="middle">RUL — Durée de vie résiduelle (jours)</text>
        <text className="s-ax-title" x="20"  y="168" textAnchor="middle" transform="rotate(-90,20,168)">DI — Indice de dégradation</text>
        {/* Zone labels */}
        <text fontSize="9" fontFamily="var(--mono)" fill="var(--primary-deeper)" opacity=".65" x="88"  y="44" fontWeight="700" letterSpacing=".06em">ZONE CRITIQUE</text>
        <text fontSize="9" fontFamily="var(--mono)" fill="var(--primary)"         opacity=".65" x="700" y="44" fontWeight="700" letterSpacing=".06em">ZONE SÛRE</text>
        {/* Motor dots */}
        {motors.map(m => (
          <g key={m.id}>
            <circle className={`s-ring s-ring-${m.type}`} cx={m.cx} cy={m.cy} r={m.ring} />
            <circle className={`s-dot s-dot-${m.type}`}   cx={m.cx} cy={m.cy} r={m.dot} />
            <text className={`s-lbl${m.type === 'low' ? ' s-lbl-dark' : ''}`} x={m.cx} y={m.cy}>{m.id}</text>
          </g>
        ))}
        {/* Legend */}
        <circle cx="728" cy="54" r="7" fill="var(--primary-deeper)" />
        <text fontSize="10" fontFamily="'DM Sans',sans-serif" fill="#64748b" x="740" y="58">Risque Élevé</text>
        <circle cx="728" cy="74" r="7" fill="var(--primary)" />
        <text fontSize="10" fontFamily="'DM Sans',sans-serif" fill="#64748b" x="740" y="78">Risque Modéré</text>
        <circle cx="728" cy="94" r="7" fill="var(--secondary)" />
        <text fontSize="10" fontFamily="'DM Sans',sans-serif" fill="#64748b" x="740" y="98">Risque Faible</text>
      </svg>
    </div>
  );
}
