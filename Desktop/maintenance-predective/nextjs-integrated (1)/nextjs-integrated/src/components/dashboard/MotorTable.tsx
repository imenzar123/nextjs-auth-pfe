import { motorData } from '@/services/navigationData';

const riskLabel: Record<string, string> = {
  high: 'ÉLEVÉ',
  mod:  'MODÉRÉ',
  low:  'FAIBLE',
};

export default function MotorTable() {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Rapport d&apos;État — Tous les Moteurs</div>
          <div className="card-sub">Données détaillées · DI · RUL · Niveau de risque · Recommandation</div>
        </div>
        <div className="card-badge">12 moteurs</div>
      </div>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Moteur</th>
              <th>DI</th>
              <th>RUL (jours)</th>
              <th>Niveau de risque</th>
              <th>Recommandation</th>
            </tr>
          </thead>
          <tbody>
            {motorData.map((motor) => {
              const diBarW = Math.round(motor.di * 70);
              const rulBarW = Math.min(Math.round((motor.rul / 150) * 100), 100);
              const diBarBg = motor.risk === 'low' ? 'var(--secondary)' : 'var(--primary-deeper)';

              return (
                <tr key={motor.id}>
                  <td className="td-bold">{motor.id}</td>
                  <td>
                    <div className="di-wrap">
                      <div className="di-bar" style={{ width: `${diBarW}px`, background: diBarBg }} />
                      <span className="mono">{motor.di.toFixed(2)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="rul-wrap">
                      <div className="rul-bar" style={{ width: `${Math.max(4, rulBarW * 0.8)}px` }} />
                      <span className="rul-txt">
                        {motor.rul >= 150 ? '>150 j' : `${motor.rul} j`}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${motor.risk}`}>
                      {riskLabel[motor.risk]}
                    </span>
                  </td>
                  <td className="td-rec">{motor.recommendation}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
