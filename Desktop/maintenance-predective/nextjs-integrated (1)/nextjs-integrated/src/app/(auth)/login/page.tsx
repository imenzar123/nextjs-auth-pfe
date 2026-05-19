'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { LoginCredentials } from '@/types/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Safe redirect target: must be a relative path, must not loop back to /login.
  const from = searchParams.get('from') ?? '';
  const redirectTo = from.startsWith('/') && from !== '/login' ? from : '/';

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!credentials.email || !credentials.password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? 'Erreur de connexion.');
        return;
      }

      // Cookie is set server-side (HttpOnly) — navigate to the original destination.
      router.push(redirectTo);
      router.refresh(); // re-render server components with the new auth state
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* ── LEFT — Brand panel ─────────────────────────── */}
      <div className="login-brand-panel">

        {/* Decorative background rings */}
        <span className="login-ring login-ring-1" aria-hidden="true" />
        <span className="login-ring login-ring-2" aria-hidden="true" />
        <span className="login-ring login-ring-3" aria-hidden="true" />

        <div className="login-brand-content">

          {/* Logo + name */}
          <div className="login-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/brand-white.svg" alt="Logo" width={32} height={32} />
            <span className="login-logo-name">ThemeKit</span>
          </div>

          {/* Headline */}
          <h1 className="login-headline">
            Surveillance prédictive<br />des moteurs industriels
          </h1>
          <p className="login-subline">
            Plateforme de monitoring en temps réel avec analyse IA,
            détection d&apos;anomalies et maintenance prédictive.
          </p>

          {/* Feature list */}
          <ul className="login-features">
            <li>
              <span className="login-feature-icon">
                <i className="fas fa-broadcast-tower" />
              </span>
              <span>Monitoring temps réel — 12 moteurs supervisés</span>
            </li>
            <li>
              <span className="login-feature-icon">
                <i className="fas fa-chart-line" />
              </span>
              <span>Analyse DI &amp; RUL avec alertes intelligentes</span>
            </li>
            <li>
              <span className="login-feature-icon">
                <i className="fas fa-shield-alt" />
              </span>
              <span>Accès sécurisé par rôle — admin &amp; utilisateur</span>
            </li>
          </ul>

        </div>
      </div>

      {/* ── RIGHT — Form panel ─────────────────────────── */}
      <div className="login-form-panel">
        <div className="login-card">

          {/* Card header */}
          <div className="login-card-header">
            <div className="login-card-icon">
              <i className="fas fa-lock" />
            </div>
            <h2 className="login-card-title">Connexion</h2>
            <p className="login-card-sub">
              Accédez à votre espace de surveillance
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="login-alert" role="alert">
              <i className="fas fa-exclamation-circle" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div className="login-field">
              <label htmlFor="email" className="login-label">
                Adresse e-mail
              </label>
              <div className="login-input-wrap">
                <i className="fas fa-envelope login-input-icon" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="login-input"
                  placeholder="admin@example.com"
                  value={credentials.email}
                  onChange={handleChange}
                  autoComplete="email"
                  autoFocus
                  disabled={isLoading}
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field">
              <label htmlFor="password" className="login-label">
                Mot de passe
              </label>
              <div className="login-input-wrap">
                <i className="fas fa-lock login-input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="login-input login-input--password"
                  placeholder="••••••••"
                  value={credentials.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  tabIndex={-1}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: 'right', marginTop: '-0.4rem' }}>
              <Link href="/forgot-password" className="login-link" style={{ fontSize: '0.82rem' }}>
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className={`login-btn${isLoading ? ' login-btn--loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="login-spinner" aria-hidden="true" />
                  Connexion en cours…
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt" />
                  Se connecter
                </>
              )}
            </button>

          </form>

          {/* Footer note */}
          <p className="login-footer-note">
            <i className="fas fa-info-circle" />
            Contactez votre administrateur pour obtenir vos accès.
          </p>

        </div>
      </div>

    </div>
  );
}
