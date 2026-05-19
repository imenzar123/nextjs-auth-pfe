'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password || !form.password_confirmation) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (form.password !== form.password_confirmation) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? 'Erreur lors de la création du compte.');
        return;
      }

      router.push('/');
      router.refresh();
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
            Rejoignez la<br />plateforme
          </h1>
          <p className="login-subline">
            Créez votre compte pour accéder au système de surveillance
            prédictive des moteurs industriels.
          </p>

          <ul className="login-features">
            <li>
              <span className="login-feature-icon">
                <i className="fas fa-broadcast-tower" />
              </span>
              <span>Surveillance en temps réel — 12 moteurs supervisés</span>
            </li>
            <li>
              <span className="login-feature-icon">
                <i className="fas fa-bell" />
              </span>
              <span>Alertes intelligentes et analyse IA des anomalies</span>
            </li>
            <li>
              <span className="login-feature-icon">
                <i className="fas fa-user-shield" />
              </span>
              <span>Accès sécurisé selon votre rôle</span>
            </li>
          </ul>
        </div>
      </div>

      {/* ── RIGHT — Form panel ─────────────────────────── */}
      <div className="login-form-panel">
        <div className="login-card">

          <div className="login-card-header">
            <div className="login-card-icon">
              <i className="fas fa-user-plus" />
            </div>
            <h2 className="login-card-title">Créer un compte</h2>
            <p className="login-card-sub">Remplissez les informations ci-dessous</p>
          </div>

          {error && (
            <div className="login-alert" role="alert">
              <i className="fas fa-exclamation-circle" />
              <span>{error}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit} noValidate>

            {/* Name */}
            <div className="login-field">
              <label htmlFor="name" className="login-label">Nom complet</label>
              <div className="login-input-wrap">
                <i className="fas fa-user login-input-icon" />
                <input
                  id="name"
                  type="text"
                  name="name"
                  className="login-input"
                  placeholder="Jean Dupont"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  autoFocus
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email */}
            <div className="login-field">
              <label htmlFor="email" className="login-label">Adresse e-mail</label>
              <div className="login-input-wrap">
                <i className="fas fa-envelope login-input-icon" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="login-input"
                  placeholder="jean@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field">
              <label htmlFor="password" className="login-label">Mot de passe</label>
              <div className="login-input-wrap">
                <i className="fas fa-lock login-input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="login-input login-input--password"
                  placeholder="8 caractères minimum"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
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

            {/* Confirm password */}
            <div className="login-field">
              <label htmlFor="password_confirmation" className="login-label">
                Confirmer le mot de passe
              </label>
              <div className="login-input-wrap">
                <i className="fas fa-lock login-input-icon" />
                <input
                  id="password_confirmation"
                  type={showConfirm ? 'text' : 'password'}
                  name="password_confirmation"
                  className="login-input login-input--password"
                  placeholder="Répétez le mot de passe"
                  value={form.password_confirmation}
                  onChange={handleChange}
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
                  Création en cours…
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus" />
                  Créer mon compte
                </>
              )}
            </button>

          </form>

          <p className="login-footer-note">
            Déjà un compte ?&nbsp;
            <Link href="/login" className="login-link">
              Se connecter
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
}
