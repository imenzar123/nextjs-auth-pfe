'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email) {
      setError('Veuillez entrer votre adresse e-mail.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? 'Erreur serveur. Veuillez réessayer.');
        return;
      }

      setSubmitted(true);
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
            Réinitialisation<br />sécurisée
          </h1>
          <p className="login-subline">
            Nous vous enverrons un lien de réinitialisation par e-mail.
            Le lien est valide pendant 60 minutes.
          </p>

          <ul className="login-features">
            <li>
              <span className="login-feature-icon">
                <i className="fas fa-clock" />
              </span>
              <span>Lien valide 60 minutes à partir de l&apos;envoi</span>
            </li>
            <li>
              <span className="login-feature-icon">
                <i className="fas fa-key" />
              </span>
              <span>Jeton à usage unique — expiration après utilisation</span>
            </li>
            <li>
              <span className="login-feature-icon">
                <i className="fas fa-shield-alt" />
              </span>
              <span>Votre mot de passe actuel reste inchangé jusqu&apos;à la réinitialisation</span>
            </li>
          </ul>
        </div>
      </div>

      {/* ── RIGHT — Form panel ─────────────────────────── */}
      <div className="login-form-panel">
        <div className="login-card">

          <div className="login-card-header">
            <div className="login-card-icon">
              <i className="fas fa-envelope-open-text" />
            </div>
            <h2 className="login-card-title">Mot de passe oublié</h2>
            <p className="login-card-sub">
              {submitted
                ? 'Vérifiez votre boîte e-mail'
                : 'Entrez votre e-mail pour recevoir un lien'}
            </p>
          </div>

          {/* Success state */}
          {submitted ? (
            <>
              <div className="login-alert login-alert--success" role="status">
                <i className="fas fa-check-circle" />
                <span>
                  Si <strong>{email}</strong> est associé à un compte, un lien de
                  réinitialisation a été envoyé. Pensez à vérifier vos spams.
                </span>
              </div>
              <p className="login-footer-note">
                <Link href="/login" className="login-link">
                  <i className="fas fa-arrow-left" />
                  &nbsp;Retour à la connexion
                </Link>
              </p>
            </>
          ) : (
            <>
              {error && (
                <div className="login-alert" role="alert">
                  <i className="fas fa-exclamation-circle" />
                  <span>{error}</span>
                </div>
              )}

              <form className="login-form" onSubmit={handleSubmit} noValidate>
                <div className="login-field">
                  <label htmlFor="email" className="login-label">Adresse e-mail</label>
                  <div className="login-input-wrap">
                    <i className="fas fa-envelope login-input-icon" />
                    <input
                      id="email"
                      type="email"
                      name="email"
                      className="login-input"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      autoComplete="email"
                      autoFocus
                      disabled={isLoading}
                    />
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
                      Envoi en cours…
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane" />
                      Envoyer le lien
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
