const baseWrapper = (title, content) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 24px;
      background: linear-gradient(180deg, #fff7ed 0%, #ffffff 100%);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #1f2937;
    }
    .card {
      max-width: 620px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #fed7aa;
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(17, 24, 39, 0.08);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #111827, #1f2937);
      color: #ffffff;
      padding: 28px;
      text-align: center;
    }
    .brand {
      font-size: 26px;
      font-weight: 800;
      margin: 0;
      color: #fb923c;
      letter-spacing: 0.4px;
    }
    .content {
      padding: 26px 28px;
      line-height: 1.65;
      font-size: 15px;
    }
    .cta {
      display: inline-block;
      margin-top: 10px;
      padding: 12px 18px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 700;
    }
    .token-box {
      margin: 18px 0;
      font-size: 30px;
      letter-spacing: 8px;
      font-weight: 800;
      color: #ea580c;
      background: #fff7ed;
      border: 1px dashed #fdba74;
      border-radius: 12px;
      padding: 14px;
      text-align: center;
    }
    .footer {
      border-top: 1px solid #ffedd5;
      margin-top: 22px;
      padding-top: 14px;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <p class="brand">Sunny Beach</p>
    </div>
    <div class="content">
      ${content}
      <div class="footer">
        Sunny Beach Restaurant, Tunisia<br/>
        Si vous n'etes pas a l'origine de cette demande, ignorez cet email.
      </div>
    </div>
  </div>
</body>
</html>
`;

export const signUpConfirmationEmailTemplate = (
  nom,
  prenom,
  userId,
  resetPasswordToken,
  API_ENDPOINT
) => {
  const fullName = [prenom, nom].filter(Boolean).join(' ') || 'cher client';
  return baseWrapper(
    'Confirmation de votre inscription',
    `
      <h2>Bienvenue ${fullName},</h2>
      <p>Merci pour votre inscription. Cliquez sur le bouton ci-dessous pour activer votre compte.</p>
      <p>
        <a class="cta" href="${API_ENDPOINT}/activate-account/${userId}/${resetPasswordToken}">
          Activer mon compte
        </a>
      </p>
    `
  );
};

export const forgotPasswordEmailTemplate = (nom, email, API_ENDPOINT, token) => {
  const displayName = nom || 'cher client';
  return baseWrapper(
    'Reinitialisation du mot de passe',
    `
      <h2>Bonjour ${displayName},</h2>
      <p>Nous avons recu une demande de reinitialisation pour le compte <strong>${email}</strong>.</p>
      <p>Utilisez le code ci-dessous pour reinitialiser votre mot de passe:</p>
      <div class="token-box">${token}</div>
    `
  );
};

export const resetPasswordConfirmationEmailTemplate = (nom, API_ENDPOINT) => {
  const displayName = nom || 'cher client';
  return baseWrapper(
    'Mot de passe reinitialise',
    `
      <h2>Bonjour ${displayName},</h2>
      <p>Votre mot de passe a ete modifie avec succes.</p>
      <p>Si ce n'etait pas vous, contactez notre support immediatement.</p>
    `
  );
};

export const loginSuccessEmailTemplate = (nom, prenom, API_ENDPOINT) => {
  const fullName = [prenom, nom].filter(Boolean).join(' ') || 'cher client';
  return baseWrapper(
    'Connexion reussie',
    `
      <h2>Bonjour ${fullName},</h2>
      <p>Une connexion reussie a ete detectee sur votre compte Sunny Beach.</p>
      <p>Merci de votre confiance.</p>
    `
  );
};
