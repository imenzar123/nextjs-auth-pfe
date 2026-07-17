'use client';
import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useRealTime, MotorState, SensorLive } from '@/hooks/useRealTime';

// ── status palette ────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  normal:   '#22c55e',
  warning:  '#f59e0b',
  critical: '#ef4444',
};
const STATUS_LABEL: Record<string, string> = {
  normal:   'Normal',
  warning:  'Attention',
  critical: 'Alarme',
};

// ── sub-components ────────────────────────────────────────────────────────────

function GaugeBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.max(0, (value / (max || 1)) * 100));
  return (
    <div style={{ background: 'rgba(0,0,0,0.06)', borderRadius: '6px', height: '8px', overflow: 'hidden', marginTop: '4px' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '6px', transition: 'width 0.5s ease' }} />
    </div>
  );
}

function SensorCard({ sensor }: { sensor: SensorLive }) {
  const v   = sensor.valeur_actuelle ?? 0;
  const max = sensor.seuil_max ?? 100;
  const min = sensor.seuil_min ?? 0;

  let color = STATUS_COLOR.normal;
  if (sensor.seuil_max !== null && v > sensor.seuil_max) color = STATUS_COLOR.critical;
  else if (sensor.seuil_min !== null && v < sensor.seuil_min) color = STATUS_COLOR.critical;
  else if (sensor.seuil_max !== null && sensor.seuil_min !== null) {
    const range = sensor.seuil_max - sensor.seuil_min;
    const margin = range * 0.15;
    if (range > 0 && (v > sensor.seuil_max - margin || v < sensor.seuil_min + margin)) {
      color = STATUS_COLOR.warning;
    }
  }

  return (
    <div style={{ padding: '10px 12px', background: 'rgba(53,130,141,0.04)', borderRadius: '9px', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-body)', marginBottom: '3px' }}>{sensor.nom}</div>
      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--mono)' }}>
        {sensor.valeur_actuelle !== null ? sensor.valeur_actuelle : '—'}
        {' '}<span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-body)' }}>{sensor.unite}</span>
      </div>
      <GaugeBar value={v} max={max || 100} color={color} />
    </div>
  );
}

function MotorCard({ state }: { state: MotorState }) {
  const border = STATUS_COLOR[state.status] ?? STATUS_COLOR.normal;

  const alertSensors = state.sensors.filter(s => {
    const v = s.valeur_actuelle;
    if (v === null) return false;
    return (s.seuil_max !== null && v > s.seuil_max) || (s.seuil_min !== null && v < s.seuil_min);
  });

  return (
    <div
      style={{ background: 'var(--bg-card)', borderRadius: '14px', border: `1px solid ${border}33`, boxShadow: `0 4px 16px ${border}18`, overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 28px ${border}28`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 16px ${border}18`; }}
    >
      {/* card header */}
      <div style={{ background: `linear-gradient(135deg,${border}22,${border}08)`, padding: '14px 18px', borderBottom: `1px solid ${border}22`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>{state.motor.nom}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-body)', marginTop: '2px', fontFamily: 'var(--mono)' }}>
            {state.motor.fabricant ?? '—'} · {state.motor.emplacement ?? '—'}
          </div>
        </div>
        <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: `${border}18`, color: border, border: `1px solid ${border}33` }}>
          {STATUS_LABEL[state.status] ?? state.status}
        </span>
      </div>

      {/* motor specs row */}
      <div style={{ padding: '12px 18px 0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        {[
          { l: 'Puissance', v: state.motor.puissance, u: 'kW' },
          { l: 'Tension',   v: state.motor.tension,   u: 'V' },
          { l: 'Vitesse',   v: state.motor.vitesse,   u: 'RPM' },
        ].map(({ l, v, u }) => (
          <div key={l} style={{ textAlign: 'center', padding: '6px', background: 'rgba(53,130,141,0.04)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-body)' }}>{l}</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--mono)' }}>
              {v ?? '—'} <span style={{ fontSize: '10px', fontWeight: 400 }}>{u}</span>
            </div>
          </div>
        ))}
      </div>

      {/* live sensor gauges */}
      {state.sensors.length > 0 && (
        <div style={{ padding: '12px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
          {state.sensors.map(s => <SensorCard key={s.id} sensor={s} />)}
        </div>
      )}

      {/* alerts */}
      {alertSensors.length > 0 && (
        <div style={{ margin: '0 18px 12px', padding: '10px 12px', background: 'rgba(239,68,68,0.06)', borderRadius: '9px', border: '1px solid rgba(239,68,68,0.2)' }}>
          {alertSensors.map(s => (
            <div key={s.id} style={{ fontSize: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '3px' }}>
              <i className="fas fa-exclamation-circle" />
              {s.nom}: {s.valeur_actuelle} {s.unite}
              {s.seuil_max !== null && ` (max ${s.seuil_max})`}
            </div>
          ))}
        </div>
      )}

      {/* last-update timestamp */}
      <div style={{ padding: '0 18px 12px', fontSize: '10px', color: 'var(--text-body)', fontFamily: 'var(--mono)' }}>
        MàJ : {new Date(state.lastUpdate).toLocaleTimeString('fr-FR')}
      </div>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function TempsReelPage() {
  const [search, setSearch] = useState('');

  // Single hook — seeds from API then patches in real time via WS.
  const { motorMap, isConnected, wsStatus, lastUpdate, eventCount, loading } = useRealTime();

  const allMotors = Object.values(motorMap);
  const filtered  = allMotors.filter(s =>
    s.motor.nom.toLowerCase().includes(search.toLowerCase()) ||
    (s.motor.emplacement ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const counts = {
    normal:   allMotors.filter(m => m.status === 'normal').length,
    warning:  allMotors.filter(m => m.status === 'warning').length,
    critical: allMotors.filter(m => m.status === 'critical').length,
  };

  const dotColor = wsStatus === 'connected' ? '#22c55e' : wsStatus === 'error' ? '#ef4444' : '#f59e0b';

  return (
    <AppShell>
      <div style={{ padding: '20px 24px 40px', maxWidth: '1600px' }}>

        {/* ── header bar ─────────────────────────────────────────────────────── */}
        <div style={{ background: 'var(--bg-card)', padding: '16px 24px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', boxShadow: '0 2px 12px var(--shadow)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg,var(--primary),var(--primary-dark))', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px' }}>
              <i className="fas fa-industry" />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
                Monitoring Temps Réel
              </h1>
              <p style={{ fontSize: '12px', color: 'var(--text-body)', margin: '3px 0 0' }}>
                {lastUpdate
                  ? <>MàJ&nbsp;<strong>{new Date(lastUpdate).toLocaleTimeString('fr-FR')}</strong>&nbsp;·&nbsp;{eventCount} évt reçu{eventCount !== 1 ? 's' : ''}</>
                  : 'En attente du premier événement…'}
                <span style={{ marginLeft: '10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: dotColor, display: 'inline-block', animation: isConnected ? 'pulse 2s infinite' : 'none' }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: dotColor }}>
                    {wsStatus === 'connected' ? 'LIVE' : wsStatus === 'error' ? 'ERREUR WS' : 'CONNEXION…'}
                  </span>
                </span>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {([['normal', '#f0fdf4', 'Actifs'], ['warning', '#fffbeb', 'Attention'], ['critical', '#fff5f5', 'Alarmes']] as const).map(([k, bg, label]) => (
              <div key={k} style={{ textAlign: 'center', padding: '10px 18px', borderRadius: '10px', background: bg, minWidth: '80px' }}>
                <span style={{ display: 'block', fontSize: '26px', fontWeight: 800, color: STATUS_COLOR[k], fontFamily: 'var(--mono)' }}>{counts[k]}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: STATUS_COLOR[k] }}>{label}</span>
              </div>
            ))}
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '9px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-heading)', outline: 'none', width: '180px' }}
            />
          </div>
        </div>

        {/* ── motor grid ──────────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-body)' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '28px', marginBottom: '14px', display: 'block' }} />
            Chargement des moteurs…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-body)' }}>
            {allMotors.length === 0
              ? "Aucun moteur trouvé. Vérifiez la connexion à l'API."
              : 'Aucun résultat pour cette recherche.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
            {filtered.map(state => <MotorCard key={state.motor.id} state={state} />)}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.4)} }
      `}</style>
    </AppShell>
  );
}
