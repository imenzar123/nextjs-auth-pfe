export default function DonutChart() {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Répartition des Niveaux de Risque</div>
          <div className="card-sub">Distribution globale — 12 moteurs</div>
        </div>
        <div className="card-badge">Temps réel</div>
      </div>
      <div className="donut-wrap">
        <div className="donut-ctr">
          <div className="donut" />
          <div className="donut-hole">
            <div className="donut-val">12</div>
            <div className="donut-lbl">Moteurs<br />analysés</div>
          </div>
        </div>
        <div className="legend">
          <div className="leg-item">
            <div className="leg-dot" style={{ background: 'var(--risk-low)' }} />
            <div>
              <div className="leg-name">Risque Faible</div>
              <div className="leg-sub">M7—M12 · 6 moteurs</div>
            </div>
            <div className="leg-pct" style={{ color: 'var(--risk-low-text)' }}>76%</div>
          </div>
          <div className="leg-item">
            <div className="leg-dot" style={{ background: 'var(--risk-mod)' }} />
            <div>
              <div className="leg-name">Risque Modéré</div>
              <div className="leg-sub">M4—M6 · 3 moteurs</div>
            </div>
            <div className="leg-pct" style={{ color: 'var(--risk-mod-text)' }}>14%</div>
          </div>
          <div className="leg-item">
            <div className="leg-dot" style={{ background: 'var(--risk-high)' }} />
            <div>
              <div className="leg-name">Risque Élevé</div>
              <div className="leg-sub">M1—M3 · 3 moteurs</div>
            </div>
            <div className="leg-pct" style={{ color: 'var(--risk-high-text)' }}>10%</div>
          </div>
          <div className="legend-bar-wrap">
            <div className="legend-bar-lbl">Gradient de criticité global</div>
            <div className="legend-bar" />
          </div>
        </div>
      </div>
    </div>
  );
}
