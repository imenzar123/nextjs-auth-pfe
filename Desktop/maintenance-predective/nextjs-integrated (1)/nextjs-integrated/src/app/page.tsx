'use client';
import AppShell from '@/components/layout/AppShell';
import KpiCard from '@/components/dashboard/KpiCard';
import AnomalyChart from '@/components/dashboard/AnomalyChart';
import DonutChart from '@/components/dashboard/DonutChart';
import ScatterPlot from '@/components/dashboard/ScatterPlot';
import HorizontalBars from '@/components/dashboard/HorizontalBars';
import MotorTable from '@/components/dashboard/MotorTable';
import { kpiData } from '@/services/navigationData';
import { useRealTime } from '@/hooks/useRealTime';
import Link from 'next/link';

const STATUS_COLOR: Record<string, string> = {
  normal:   '#22c55e',
  warning:  '#f59e0b',
  critical: '#ef4444',
};

export default function DashboardPage() {
  const { motorMap, isConnected, lastUpdate, eventCount } = useRealTime();

  const motors = Object.values(motorMap);
  const counts = {
    normal:   motors.filter(m => m.status === 'normal').length,
    warning:  motors.filter(m => m.status === 'warning').length,
    critical: motors.filter(m => m.status === 'critical').length,
  };
  const hasData = motors.length > 0;

  return (
    <AppShell>
      <div className="dashboard">

        {/* ── REAL-TIME STATUS BAR ──────────────────────────────── */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '14px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 2px 12px var(--shadow)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isConnected ? '#22c55e' : '#94a3b8', display: 'inline-block', animation: isConnected ? 'pulse 2s infinite' : 'none' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: isConnected ? '#22c55e' : 'var(--text-body)' }}>
              {isConnected ? 'WebSocket connecté' : 'Connexion WebSocket…'}
            </span>
            {lastUpdate && (
              <span style={{ fontSize: '12px', color: 'var(--text-body)' }}>
                · MàJ {new Date(lastUpdate).toLocaleTimeString('fr-FR')} · {eventCount} évt
              </span>
            )}
          </div>

          {hasData && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {([['normal', 'Actifs'], ['warning', 'Attention'], ['critical', 'Alarmes']] as const).map(([k, label]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '8px', background: `${STATUS_COLOR[k]}18`, border: `1px solid ${STATUS_COLOR[k]}33` }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: STATUS_COLOR[k], fontFamily: 'var(--mono)' }}>{counts[k]}</span>
                  <span style={{ fontSize: '11px', color: STATUS_COLOR[k], fontWeight: 600 }}>{label}</span>
                </div>
              ))}
              <Link href="/temps-reel" style={{ padding: '5px 14px', background: 'var(--primary)', color: 'white', borderRadius: '8px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <i className="fas fa-satellite-dish" /> Temps réel
              </Link>
            </div>
          )}
        </div>

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

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(1.4); } }
      `}</style>
    </AppShell>
  );
}
