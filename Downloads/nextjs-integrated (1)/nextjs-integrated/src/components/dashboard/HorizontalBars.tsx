import { motorData } from '@/services/navigationData';

export default function HorizontalBars() {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Niveau de Dégradation par Moteur</div>
          <div className="card-sub">Barre proportionnelle au DI · Échelle 0 → 1 avec graduations à 25%</div>
        </div>
        <div className="card-badge">Animation CSS</div>
      </div>

      {/* Scale header */}
      <div className="hbar-scale-header">
        <div />
        <div className="hbar-scale-ticks">
          <span>0</span><span>0.25</span><span>0.50</span><span>0.75</span><span>1.0</span>
        </div>
        <div className="hbar-scale-unit">DI</div>
      </div>

      <div className="hbar-list">
        {motorData.map((motor) => {
          const widthPct = Math.round(motor.di * 100);
          const fillClass = motor.risk === 'high'
            ? 'hbar-fill-high'
            : motor.risk === 'mod'
              ? 'hbar-fill-mod'
              : 'hbar-fill-low';

          return (
            <div key={motor.id} className="hbar-row">
              <div className="hbar-lbl">{motor.id}</div>
              <div className="hbar-track">
                <div className={`hbar-fill ${fillClass}`} style={{ width: `${widthPct}%` }} />
              </div>
              <div className="hbar-val">{motor.di.toFixed(2)}</div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="hbar-legend">
        <div className="hbar-leg-item">
          <div className="hbar-leg-swatch swatch-high" />
          Élevé (DI ≥ 0.60)
        </div>
        <div className="hbar-leg-item">
          <div className="hbar-leg-swatch swatch-mod" />
          Modéré (0.35 ≤ DI &lt; 0.60)
        </div>
        <div className="hbar-leg-item">
          <div className="hbar-leg-swatch swatch-low" />
          Faible (DI &lt; 0.35)
        </div>
      </div>
    </div>
  );
}
