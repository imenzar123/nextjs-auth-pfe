export default function AnomalyChart() {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Taux d&apos;Anomalie par Moteur</div>
          <div className="card-sub">Indice de dégradation — ensemble du parc M1→M12</div>
        </div>
        <div className="card-badge">DI · 12 moteurs</div>
      </div>
      <svg className="anomaly-svg" viewBox="0 0 540 220" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgba(53,130,141,.22)" />
            <stop offset="100%" stopColor="rgba(53,130,141,0)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <g className="chart-grid">
          <line x1="48" y1="20"  x2="528" y2="20" />
          <line x1="48" y1="64"  x2="528" y2="64" />
          <line x1="48" y1="108" x2="528" y2="108" />
          <line x1="48" y1="152" x2="528" y2="152" />
          <line x1="48" y1="196" x2="528" y2="196" />
        </g>
        <text className="chart-lbl" x="42" y="23"  textAnchor="end">1.0</text>
        <text className="chart-lbl" x="42" y="67"  textAnchor="end">0.8</text>
        <text className="chart-lbl" x="42" y="111" textAnchor="end">0.6</text>
        <text className="chart-lbl" x="42" y="155" textAnchor="end">0.4</text>
        <text className="chart-lbl" x="42" y="199" textAnchor="end">0.0</text>
        <rect className="alert-area" x="48" y="20" width="480" height="70" />
        <line className="alert-line"  x1="48" y1="90" x2="528" y2="90" />
        <text className="alert-lbl" x="523" y="86" textAnchor="end">⚠ Seuil critique</text>
        <path
          d="M48,52 L92,71 L136,85 L180,99 L224,112 L268,127 L312,147 L356,157 L400,166 L444,175 L488,182 L528,187 L528,196 L48,196Z"
          fill="url(#ag)"
        />
        <polyline
          className="anomaly-line"
          filter="url(#glow)"
          points="48,52 92,71 136,85 180,99 224,112 268,127 312,147 356,157 400,166 444,175 488,182 528,187"
        />
        {[
          { cx: 48,  cy: 52  },
          { cx: 92,  cy: 71  },
          { cx: 136, cy: 85  },
          { cx: 180, cy: 99  },
          { cx: 224, cy: 112 },
          { cx: 268, cy: 127 },
          { cx: 312, cy: 147 },
          { cx: 356, cy: 157 },
          { cx: 400, cy: 166 },
          { cx: 444, cy: 175 },
          { cx: 488, cy: 182 },
          { cx: 528, cy: 187 },
        ].map((dot, i) => (
          <circle key={i} className="chart-dot" r="5" cx={dot.cx} cy={dot.cy} />
        ))}
        {['M1','M2','M3','M4','M5','M6','M7','M8','M9','M10','M11','M12'].map((label, i) => (
          <text
            key={label}
            className="chart-lbl"
            x={48 + i * 44}
            y="213"
            textAnchor="middle"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}
