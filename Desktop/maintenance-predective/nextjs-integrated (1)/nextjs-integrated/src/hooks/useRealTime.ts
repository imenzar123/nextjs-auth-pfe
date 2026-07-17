'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getEcho, disconnectEcho } from '@/lib/echo';

// ── shared types ──────────────────────────────────────────────────────────────

export interface SensorLive {
  id: number;
  motor_id: number;
  nom: string;
  type: string;
  unite: string;
  valeur_actuelle: number | null;
  seuil_min: number | null;
  seuil_max: number | null;
  statut: string | null;
  emplacement: string | null;
  description: string | null;
  derniere_lecture_at: string | null;
}

export interface MotorLive {
  id: number;
  nom: string;
  modele: string | null;
  fabricant: string | null;
  emplacement: string | null;
  puissance: number | null;
  tension: number | null;
  courant: number | null;
  vitesse: number | null;
  cos_phi: number | null;
  date_installation: string | null;
}

export interface MotorState {
  motor: MotorLive;
  sensors: SensorLive[];
  status: 'normal' | 'warning' | 'critical';
  lastUpdate: string;
}

interface MotorEvent {
  motor: MotorLive;
  sensors: SensorLive[];
  status: 'normal' | 'warning' | 'critical';
  timestamp: string;
}

interface SensorEvent {
  sensor: SensorLive;
  motor: { id: number; nom: string } | null;
  status: 'normal' | 'warning' | 'critical';
  timestamp: string;
}

export interface UseRealTimeReturn {
  motorMap: Record<number, MotorState>;
  isConnected: boolean;
  wsStatus: 'connecting' | 'connected' | 'error' | 'disconnected';
  lastUpdate: string | null;
  eventCount: number;
  loading: boolean;
}

// ── hook ──────────────────────────────────────────────────────────────────────

export function useRealTime(): UseRealTimeReturn {
  const router = useRouter();

  // Single source of truth: HTTP seed + live WS patches all live here.
  const [motorMap, setMotorMap] = useState<Record<number, MotorState>>({});
  const [loading, setLoading]   = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('connecting');
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);

  // ── helpers ──────────────────────────────────────────────────────────────

  const applyMotorEvent = useCallback((event: MotorEvent) => {
    console.log('[TempsReel] MotorUpdated received', event.motor.nom, '→', event.status);
    setMotorMap(prev => ({
      ...prev,
      [event.motor.id]: {
        motor: event.motor,
        sensors: event.sensors,
        status: event.status,
        lastUpdate: event.timestamp,
      },
    }));
    setLastUpdate(event.timestamp);
    setEventCount(c => c + 1);
    console.log('[TempsReel] State updated successfully (motor)');
  }, []);

  const applySensorEvent = useCallback((event: SensorEvent) => {
    const motorId = event.sensor.motor_id;
    console.log('[TempsReel] SensorUpdated received', event.sensor.nom, motorId, '→', event.status);

    setMotorMap(prev => {
      const existing = prev[motorId];
      if (!existing) {
        // Motor not yet in state (created after initial seed) — ignore;
        // the next MotorUpdated event will add it.
        console.warn('[TempsReel] SensorUpdated for unknown motorId', motorId);
        return prev;
      }
      // Replace the sensor if it already exists, otherwise append it
      // (handles sensors created after the initial page load).
      const already = existing.sensors.some(s => s.id === event.sensor.id);
      const updatedSensors = already
        ? existing.sensors.map(s => s.id === event.sensor.id ? event.sensor : s)
        : [...existing.sensors, event.sensor];
      return {
        ...prev,
        [motorId]: {
          ...existing,
          sensors: updatedSensors,
          status: event.status,
          lastUpdate: event.timestamp,
        },
      };
    });

    setLastUpdate(event.timestamp);
    setEventCount(c => c + 1);
    console.log('[TempsReel] State updated successfully (sensor)');
  }, []);

  // ── initial HTTP seed (runs once) ─────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function seed() {
      try {
        const res = await fetch('/api/motors');
        if (!res.ok) return;
        const motors: MotorLive[] = await res.json();

        const entries = await Promise.all(
          motors.map(async (m) => {
            let sensors: SensorLive[] = [];
            try {
              const sr = await fetch(`/api/motors/${m.id}/sensors`);
              if (sr.ok) sensors = await sr.json();
            } catch { /* non-fatal */ }

            const status = computeStatus(sensors);
            return [m.id, { motor: m, sensors, status, lastUpdate: new Date().toISOString() }] as const;
          }),
        );

        if (!cancelled) {
          setMotorMap(Object.fromEntries(entries));
          console.log(`[TempsReel] Seeded ${entries.length} motors from API`);
        }
      } catch (e) {
        console.error('[TempsReel] Initial seed failed', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    seed();
    return () => { cancelled = true; };
  }, []);

  // ── WebSocket subscription ────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null;

    try {
      const echo = getEcho();
      console.log('[TempsReel] Connecting to motors-dashboard channel…');

      channel = echo.private('motors-dashboard');

      channel
        .subscribed(() => {
          if (!mounted) return;
          console.log('[TempsReel] WebSocket connected ✓');
          setIsConnected(true);
          setWsStatus('connected');
        })
        .error((err: unknown) => {
          if (!mounted) return;
          console.error('[TempsReel] WebSocket error', err);
          setIsConnected(false);
          setWsStatus('error');
          // 401 from broadcasting/auth → stale session, force re-login.
          const status = (err as { status?: number })?.status;
          if (status === 401) {
            router.push('/login?from=/temps-reel');
          }
        })
        .listen('.MotorUpdated', (event: MotorEvent) => {
          if (!mounted) return;
          applyMotorEvent(event);
        })
        .listen('.SensorUpdated', (event: SensorEvent) => {
          if (!mounted) return;
          applySensorEvent(event);
        });

    } catch (e) {
      console.error('[TempsReel] Echo init failed', e);
      setWsStatus('error');
    }

    return () => {
      mounted = false;
      if (channel) {
        channel.stopListening('.MotorUpdated');
        channel.stopListening('.SensorUpdated');
      }
      disconnectEcho();
      setIsConnected(false);
      setWsStatus('disconnected');
    };
  }, [applyMotorEvent, applySensorEvent]);

  return { motorMap, isConnected, wsStatus, lastUpdate, eventCount, loading };
}

// ── util ──────────────────────────────────────────────────────────────────────

function computeStatus(sensors: SensorLive[]): 'normal' | 'warning' | 'critical' {
  let status: 'normal' | 'warning' | 'critical' = 'normal';
  for (const s of sensors) {
    const v = s.valeur_actuelle;
    if (v === null) continue;
    if ((s.seuil_max !== null && v > s.seuil_max) || (s.seuil_min !== null && v < s.seuil_min)) {
      return 'critical';
    }
    if (s.seuil_max !== null && s.seuil_min !== null && status === 'normal') {
      const range = s.seuil_max - s.seuil_min;
      if (range > 0) {
        const m = range * 0.15;
        if (v > s.seuil_max - m || v < s.seuil_min + m) status = 'warning';
      }
    }
  }
  return status;
}
