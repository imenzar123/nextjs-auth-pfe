<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenue sur la plateforme</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          {{-- Header --}}
          <tr>
            <td style="background:linear-gradient(135deg,#1e4a5c 0%,#35828d 100%);border-radius:16px 16px 0 0;padding:40px 40px 32px;text-align:center;">
              <p style="margin:0 0 16px;font-size:13px;font-weight:600;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;">
                Système de Surveillance Industrielle
              </p>
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                Bienvenue sur la plateforme
              </h1>
              <p style="margin:12px 0 0;font-size:14px;color:rgba(255,255,255,0.8);line-height:1.6;">
                Votre compte a été créé par un administrateur.
              </p>
            </td>
          </tr>

          {{-- Body --}}
          <tr>
            <td style="background:#ffffff;padding:40px;">

              <p style="margin:0 0 24px;font-size:16px;color:#1e293b;line-height:1.6;">
                Bonjour <strong>{{ $user->name }}</strong>,
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.7;">
                Un accès a été créé pour vous sur la plateforme de surveillance prédictive
                des moteurs industriels. Voici vos identifiants de connexion :
              </p>

              {{-- Credentials box --}}
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:28px;">

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom:18px;border-bottom:1px solid #e2e8f0;">
                          <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">
                            Adresse e-mail
                          </p>
                          <p style="margin:0;font-size:16px;font-weight:600;color:#1e293b;">
                            {{ $user->email }}
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:18px;">
                          <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">
                            Mot de passe temporaire
                          </p>
                          <p style="margin:0;font-size:22px;font-weight:700;color:#35828d;letter-spacing:3px;font-family:'Courier New',monospace;">
                            {{ $plainPassword }}
                          </p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              {{-- CTA button --}}
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="{{ env('FRONTEND_URL', 'http://localhost:3000') }}/login"
                       style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#1e4a5c,#35828d);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:0.3px;">
                      Accéder à la plateforme
                    </a>
                  </td>
                </tr>
              </table>

              {{-- Security notice --}}
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;">
                    <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                      <strong>⚠ Sécurité :</strong> Ce mot de passe vous est transmis une seule fois.
                      Nous vous recommandons de le changer dès votre première connexion.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          {{-- Footer --}}
          <tr>
            <td style="background:#f8fafc;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                Cet e-mail a été envoyé automatiquement — merci de ne pas y répondre.<br />
                Plateforme de Surveillance Prédictive des Moteurs Industriels
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
