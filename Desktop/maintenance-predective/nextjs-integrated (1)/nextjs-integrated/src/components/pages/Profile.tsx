'use client';

import { useState, useEffect, FormEvent } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/frontend/hooks/useAuth';

type AlertState = { type: 'success' | 'error'; text: string } | null;

function firstError(errors: Record<string, string[]>): string {
  return Object.values(errors)[0]?.[0] ?? '';
}

// Rendered as a child of AppShell so it sits inside AuthProvider.
function ProfileContent() {
  const { user, isLoading, refreshUser } = useAuth();

  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd]         = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [alert, setAlert]       = useState<AlertState>(null);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Controls whether the password section is expanded.
  // When collapsed the fields are not in the DOM → no browser autofill,
  // no accidental wantsPwd = true, no validation surprises.
  const [pwdOpen, setPwdOpen] = useState(false);

  const togglePwdSection = () => {
    if (pwdOpen) {
      // Closing: discard any half-entered password data
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setShowCurrent(false); setShowNew(false); setShowConfirm(false);
    }
    setPwdOpen((v) => !v);
  };

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAlert(null);

    // Determine intent: user wants to change password only if any pwd field is touched
    const wantsPwd = !!(currentPwd || newPwd || confirmPwd);

    if (wantsPwd) {
      if (!currentPwd || !newPwd || !confirmPwd) {
        setAlert({ type: 'error', text: 'Pour modifier le mot de passe, remplissez les trois champs.' });
        return;
      }
      if (newPwd.length < 8) {
        setAlert({ type: 'error', text: 'Le nouveau mot de passe doit comporter au moins 8 caractères.' });
        return;
      }
      if (newPwd !== confirmPwd) {
        setAlert({ type: 'error', text: 'La confirmation ne correspond pas au nouveau mot de passe.' });
        return;
      }
    }

    setIsSaving(true);

    try {
      // ── Step 1: profile info (always) ──────────────────────────
      const profileRes = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const profileData = await profileRes.json();

      if (!profileRes.ok) {
        const msg = profileData.errors
          ? firstError(profileData.errors)
          : (profileData.message ?? 'Erreur lors de la mise à jour du profil.');
        setAlert({ type: 'error', text: msg });
        return;
      }

      // ── Step 2: password (only if requested) ───────────────────
      if (wantsPwd) {
        const pwdRes = await fetch('/api/profile/password', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            current_password:          currentPwd,
            new_password:              newPwd,
            new_password_confirmation: confirmPwd,
          }),
        });
        const pwdData = await pwdRes.json();

        if (!pwdRes.ok) {
          const msg = pwdData.errors
            ? firstError(pwdData.errors)
            : (pwdData.message ?? 'Erreur lors du changement de mot de passe.');
          setAlert({ type: 'error', text: msg });
          return;
        }

        setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
        setShowCurrent(false); setShowNew(false); setShowConfirm(false);
      }

      await refreshUser();
      setAlert({
        type: 'success',
        text: wantsPwd
          ? 'Profil et mot de passe mis à jour avec succès.'
          : 'Profil mis à jour avec succès.',
      });
    } catch {
      setAlert({ type: 'error', text: 'Erreur réseau. Veuillez réessayer.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="page-container">
        <div className="profile-loading">
          <span className="profile-spinner profile-spinner--lg" />
        </div>
      </div>
    );
  }

  const roleLabel = user.role === 'admin' ? 'Administrateur' : user.role === 'operator' ? 'Opérateur' : 'Utilisateur';
  const roleBadgeClass = user.role === 'admin' ? 'badge-admin' : user.role === 'operator' ? 'badge-operator' : 'badge-actif';

  return (
    <div className="page-container">

      {/* ── Identity banner ────────────────────────────────────── */}
      <div className="page-header">
        <div className="header-card">
          <div className="header-info profile-identity">
            <div className="profile-avatar-xl" aria-hidden="true">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1>{user.name}</h1>
              <p>{user.email}</p>
            </div>
          </div>
          <div className="header-actions">
            <span className={`badge ${roleBadgeClass}`}
              style={{ fontSize: '12px', padding: '6px 16px' }}>
              <i className={`fas ${user.role === 'admin' ? 'fa-shield-alt' : user.role === 'operator' ? 'fa-user-cog' : 'fa-user'}`} />
              {' '}{roleLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ── Unified form card ──────────────────────────────────── */}
      <div className="table-card profile-form-card">

        <div className="profile-card-header">
          <h2 className="profile-card-title">
            <i className="fas fa-user-edit" />
            Modifier le profil
          </h2>
        </div>

        <div className="profile-card-body">

          {/* Global feedback */}
          {alert && (
            <div className={`profile-alert profile-alert-${alert.type}`} role="alert">
              <i className={`fas ${alert.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />
              {alert.text}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* ── Section 1: Personal info ───────────────────── */}
            <div className="form-section-title">
              <i className="fas fa-id-card" />
              Informations personnelles
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="profile-name">Nom complet</label>
                <div className="input-wrapper">
                  <i className="fas fa-user" />
                  <input
                    id="profile-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isSaving}
                    placeholder="Votre nom complet"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="profile-email">Adresse e-mail</label>
                <div className="input-wrapper">
                  <i className="fas fa-envelope" />
                  <input
                    id="profile-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSaving}
                    placeholder="votre@email.com"
                    autoComplete="email"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Rôle</label>
              <div className="input-wrapper">
                <i className="fas fa-shield-alt" />
                <div className="profile-readonly-field">
                  {roleLabel}
                  <span className="profile-readonly-badge">lecture seule</span>
                </div>
              </div>
            </div>

            {/* ── Section 2: Password (collapsible) ─────────── */}
            <button
              type="button"
              className={`profile-pwd-toggle${pwdOpen ? ' profile-pwd-toggle--open' : ''}`}
              onClick={togglePwdSection}
              aria-expanded={pwdOpen}
            >
              <span className="profile-pwd-toggle-label">
                <i className="fas fa-lock" />
                Modifier le mot de passe
              </span>
              <i className={`fas fa-chevron-${pwdOpen ? 'up' : 'down'} profile-pwd-chevron`} />
            </button>

            {pwdOpen && (
              <div className="profile-pwd-fields">
                <div className="form-group">
                  <label htmlFor="profile-current-pwd">Mot de passe actuel</label>
                  <div className="input-wrapper">
                    <i className="fas fa-lock" />
                    <input
                      id="profile-current-pwd"
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)}
                      disabled={isSaving}
                      placeholder="••••••••"
                      autoComplete="off"
                      className="has-toggle"
                      autoFocus
                    />
                    <button type="button" className="password-toggle"
                      onClick={() => setShowCurrent((v) => !v)}
                      aria-label={showCurrent ? 'Masquer' : 'Afficher'} tabIndex={-1}>
                      <i className={`fas ${showCurrent ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="profile-new-pwd">Nouveau mot de passe</label>
                    <div className="input-wrapper">
                      <i className="fas fa-key" />
                      <input
                        id="profile-new-pwd"
                        type={showNew ? 'text' : 'password'}
                        value={newPwd}
                        onChange={(e) => setNewPwd(e.target.value)}
                        disabled={isSaving}
                        placeholder="Min. 8 caractères"
                        autoComplete="new-password"
                        className="has-toggle"
                      />
                      <button type="button" className="password-toggle"
                        onClick={() => setShowNew((v) => !v)}
                        aria-label={showNew ? 'Masquer' : 'Afficher'} tabIndex={-1}>
                        <i className={`fas ${showNew ? 'fa-eye-slash' : 'fa-eye'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="profile-confirm-pwd">Confirmer le mot de passe</label>
                    <div className="input-wrapper">
                      <i className="fas fa-key" />
                      <input
                        id="profile-confirm-pwd"
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPwd}
                        onChange={(e) => setConfirmPwd(e.target.value)}
                        disabled={isSaving}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="has-toggle"
                      />
                      <button type="button" className="password-toggle"
                        onClick={() => setShowConfirm((v) => !v)}
                        aria-label={showConfirm ? 'Masquer' : 'Afficher'} tabIndex={-1}>
                        <i className={`fas ${showConfirm ? 'fa-eye-slash' : 'fa-eye'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Single action button ───────────────────────── */}
            <div className="profile-submit-row">
              <button type="submit" className="btn-modal btn-save profile-btn-save" disabled={isSaving}>
                {isSaving ? (
                  <><span className="profile-spinner" />Enregistrement…</>
                ) : (
                  <><i className="fas fa-save" />Enregistrer les modifications</>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>

    </div>
  );
}

// AppShell provides AuthProvider + ThemeProvider + layout chrome.
// ProfileContent must be a child of AppShell so useAuth() is inside the provider tree.
export default function ProfilePage() {
  return (
    <AppShell>
      <ProfileContent />
    </AppShell>
  );
}
