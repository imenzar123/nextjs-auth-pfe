'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Guard: if the link is missing token or email, show an error immediately.
  const isLinkValid = Boolean(token && email);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!password || !passwordConfirmation) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? 'Erreur lors de la réinitialisation.');
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
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
        <span className="login-ring login-ring-1" aria-hidden="true" />
        <span className="login-ring login-ring-2" aria-hidden="true" />
        <span className="login-ring login-ring-3" aria-hidden="true" />

        <div className="login-brand-content">
          <div className="login-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/brand-white.svg" alt="Logo" width={32} height={32} />
            <span className="login-logo-name">ThemeKit</span>
          </div>

          <h1 className="login-headline">
            Nouveau<br />mot de passe
          </h1>
          <p className="login-subline">
            Choisissez un mot de passe sécurisé pour protéger votre compte
            de surveillance industrielle.
          </p>

          <ul className="login-features">
            <li>
              <span className="login-feature-icon">
                <i className="fas fa-check-circle" />
              </span>
              <span>Minimum 8 caractères requis</span>
            </li>
            <li>
              <span className="login-feature-icon">
                <i className="fas fa-sign-out-alt" />
              </span>
              <span>Toutes vos sessions actives seront déconnectées</span>
            </li>
            <li>
              <span className="login-feature-icon">
                <i className="fas fa-link" />
              </span>
              <span>Ce lien est valide une seule fois</span>
            </li>
          </ul>
        </div>
      </div>

      {/* ── RIGHT — Form panel ─────────────────────────── */}
      <div className="login-form-panel">
        <div className="login-card">

          <div className="login-card-header">
            <div className="login-card-icon">
              <i className="fas fa-lock" />
            </div>
            <h2 className="login-card-title">Réinitialiser le mot de passe</h2>
            <p className="login-card-sub">
              {success
                ? 'Mot de passe mis à jour avec succès'
                : 'Choisissez votre nouveau mot de passe'}
            </p>
          </div>

          {/* Invalid link state */}
          {!isLinkValid && (
            <>
              <div className="login-alert" role="alert">
                <i className="fas fa-exclamation-triangle" />
                <span>
                  Lien invalide ou expiré. Veuillez relancer une demande de
                  réinitialisation.
                </span>
              </div>
              <p className="login-footer-note">
                <Link href="/forgot-password" className="login-link">
                  <i className="fas fa-redo" />
                  &nbsp;Nouvelle demande
                </Link>
              </p>
            </>
          )}

          {/* Success state */}
          {isLinkValid && success && (
            <>
              <div className="login-alert login-alert--success" role="status">
                <i className="fas fa-check-circle" />
                <span>
                  Mot de passe réinitialisé. Redirection vers la connexion dans
                  quelques secondes…
                </span>
              </div>
              <p className="login-footer-note">
                <Link href="/login" className="login-link">
                  <i className="fas fa-sign-in-alt" />
                  &nbsp;Se connecter maintenant
                </Link>
              </p>
            </>
          )}

          {/* Form state */}
          {isLinkValid && !success && (
            <>
              {error && (
                <div className="login-alert" role="alert">
                  <i className="fas fa-exclamation-circle" />
                  <span>{error}</span>
                </div>
              )}

              <form className="login-form" onSubmit={handleSubmit} noValidate>

                <div className="login-field">
                  <label htmlFor="password" className="login-label">
                    Nouveau mot de passe
                  </label>
                  <div className="login-input-wrap">
                    <i className="fas fa-lock login-input-icon" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="login-input login-input--password"
                      placeholder="8 caractères minimum"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      autoComplete="new-password"
                      autoFocus
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="login-eye-btn"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Masquer' : 'Afficher'}
                      tabIndex={-1}
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                </div>

                <div className="login-field">
                  <label htmlFor="password_confirmation" className="login-label">
                    Confirmer le mot de passe
                  </label>
                  <div className="login-input-wrap">
                    <i className="fas fa-lock login-input-icon" />
                    <input
                      id="password_confirmation"
                      type={showConfirm ? 'text' : 'password'}
                      className="login-input login-input--password"
                      placeholder="Répétez le mot de passe"
                      value={passwordConfirmation}
                      onChange={(e) => {
                        setPasswordConfirmation(e.target.value);
                        if (error) setError('');
                      }}
                      autoComplete="new-password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="login-eye-btn"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? 'Masquer' : 'Afficher'}
                      tabIndex={-1}
                    >
                      <i className={`fas ${showConfirm ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`login-btn${isLoading ? ' login-btn--loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="login-spinner" aria-hidden="true" />
                      Mise à jour…
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check" />
                      Réinitialiser le mot de passe
                    </>
                  )}
                </button>

              </form>

              <p className="login-footer-note">
                <Link href="/login" className="login-link">
                  <i className="fas fa-arrow-left" />
                  &nbsp;Retour à la connexion
                </Link>
              </p>
            </>
          )}

        </div>
      </div>

    </div>
  );
}
