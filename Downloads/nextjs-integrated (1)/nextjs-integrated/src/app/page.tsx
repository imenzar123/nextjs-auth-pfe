import AppShell from '@/components/layout/AppShell';
import KpiCard from '@/components/dashboard/KpiCard';
import AnomalyChart from '@/components/dashboard/AnomalyChart';
import DonutChart from '@/components/dashboard/DonutChart';
import ScatterPlot from '@/components/dashboard/ScatterPlot';
import HorizontalBars from '@/components/dashboard/HorizontalBars';
import MotorTable from '@/components/dashboard/MotorTable';
import { kpiData } from '@/services/navigationData';

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="dashboard">

        {/* ── KPI SECTION ─────────────────────────────── */}
        <div className="section-label">Indicateurs clés</div>
        <div className="kpi-row">
          {kpiData.map((kpi, i) => (
            <KpiCard key={i} data={kpi} />
          ))}
        </div>

        {/* ── ROW 1: Anomaly Curve + Donut ────────────── */}
        <div className="section-label">Analyse des dégradations</div>
        <div className="grid-2">
          <AnomalyChart />
          <DonutChart />
        </div>

        {/* ── ROW 2: Scatter Plot ──────────────────────── */}
        <div className="section-label">Scatter Plot — Criticité RUL × DI</div>
        <div className="grid-full">
          <ScatterPlot />
        </div>

        {/* ── ROW 3: Horizontal Bars ───────────────────── */}
        <div className="section-label">Indice de Dégradation (DI) — Barres horizontales</div>
        <div className="grid-full">
          <HorizontalBars />
        </div>

        {/* ── ROW 4: Summary Table ─────────────────────── */}
        <div className="section-label">Tableau de synthèse complet</div>
        <div className="grid-full">
          <MotorTable />
        </div>

      </div>
    </AppShell>
  );
}
