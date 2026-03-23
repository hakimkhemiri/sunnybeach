import { useEffect, useState } from 'react';
import { X, Mail, Lock, Loader, User, Phone, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../lib/api';
import logo from '../images/logo sunny beach png.png';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (email: string) => void;
  onSwitchMode?: () => void;
  mode: 'login' | 'signup';
}

export function AuthModal({ isOpen, onClose, onSuccess, onSwitchMode, mode }: AuthModalProps) {
  const [view, setView] = useState<'auth' | 'forgot-request' | 'forgot-reset' | 'phone-request' | 'phone-verify' | 'signup-verify'>('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneLogin, setPhoneLogin] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [signupCode, setSignupCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { signIn, signUp, verifySignUpPhone, signInWithPhone } = useAuth();
  const isForgotResetView = mode === 'login' && view === 'forgot-reset';

  useEffect(() => {
    if (!isOpen) {
      setView('auth');
      setError('');
      setSuccess('');
      setResetToken('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setPhoneLogin('');
      setPhoneCode('');
      setSignupCode('');
    }

    if (mode !== 'login') {
      setView('auth');
    }
  }, [isOpen, mode]);

  const handleClose = () => {
    setView('auth');
    setError('');
    setSuccess('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPhoneLogin('');
    setPhoneCode('');
    setSignupCode('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(signInError.message);
        } else {
          setSuccess('Connexion réussie!');
          setTimeout(() => {
            handleClose();
            const loggedInEmail = email;
            setEmail('');
            setPassword('');
            if (onSuccess) {
              onSuccess(loggedInEmail);
            }
          }, 1000);
        }
      } else {
        const { error: signUpError, requiresPhoneVerification, devCode } = await signUp(email, password, {
          first_name: firstName,
          last_name: lastName,
          phone: phone || undefined,
        });
        if (signUpError) {
          setError(signUpError.message);
        } else if (requiresPhoneVerification) {
          setView('signup-verify');
          setSuccess(devCode ? `Code dev: ${devCode}` : 'Code SMS envoye. Entrez-le pour activer votre compte.');
        } else {
          setSuccess('Compte créé avec succès! Vous pouvez maintenant vous connecter.');
          setTimeout(() => {
            handleClose();
            setEmail('');
            setPassword('');
            setFirstName('');
            setLastName('');
            setPhone('');
          }, 2000);
        }
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupPhoneVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!email || !phone || !signupCode) {
        setError('Email, telephone et code sont obligatoires.');
        return;
      }

      const { error: verifyError } = await verifySignUpPhone(email, phone, signupCode);
      if (verifyError) {
        setError(verifyError.message);
      } else {
        setSuccess('Compte verifie et connecte avec succes!');
        setTimeout(() => {
          handleClose();
          if (onSuccess) {
            onSuccess(email);
          }
        }, 900);
      }
    } catch (err: any) {
      setError(err?.message || 'Impossible de verifier le code.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!email) {
        setError('Veuillez saisir votre email.');
        return;
      }

      await authAPI.forgotPassword(email);
      setSuccess('Code envoyé par email. Vérifiez votre boite mail.');
      setView('forgot-reset');
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de lenvoi du code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!email || !resetToken || !newPassword) {
        setError('Email, code et nouveau mot de passe sont obligatoires.');
        return;
      }

      if (newPassword.length < 6) {
        setError('Le nouveau mot de passe doit contenir au moins 6 caracteres.');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('La confirmation du mot de passe ne correspond pas.');
        return;
      }

      await authAPI.checkResetToken(email, resetToken);
      await authAPI.resetPassword(email, resetToken, newPassword);

      setSuccess('Mot de passe modifie avec succes. Connectez-vous maintenant.');
      setView('auth');
      setPassword('');
      setResetToken('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.message || 'Code invalide ou expire.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!email) {
        setError('Veuillez saisir votre email.');
        return;
      }

      await authAPI.resendForgotPasswordEmail(email);
      setSuccess('Nouveau code envoyé.');
    } catch (err: any) {
      setError(err?.message || 'Impossible de renvoyer le code.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneCodeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!phoneLogin) {
        setError('Veuillez saisir votre numero de telephone.');
        return;
      }

      const response = await authAPI.requestPhoneLoginCode(phoneLogin);
      setSuccess(response?.dev_code ? `Code dev: ${response.dev_code}` : 'Code SMS envoye.');
      setView('phone-verify');
    } catch (err: any) {
      setError(err?.message || 'Impossible denvoyer le code SMS.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLoginVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!phoneLogin || !phoneCode) {
        setError('Numero et code sont obligatoires.');
        return;
      }

      const { error: phoneLoginError } = await signInWithPhone(phoneLogin, phoneCode);
      if (phoneLoginError) {
        setError(phoneLoginError.message);
      } else {
        setSuccess('Connexion reussie!');
        setTimeout(() => {
          handleClose();
          if (onSuccess) {
            onSuccess(phoneLogin);
          }
        }, 800);
      }
    } catch (err: any) {
      setError(err?.message || 'Code invalide ou expire.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full relative overflow-hidden ${isForgotResetView ? 'max-w-sm' : 'max-w-md'}`}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        <div className={isForgotResetView ? 'p-5' : 'p-8'}>
          <div className={isForgotResetView ? 'text-center mb-5' : 'text-center mb-8'}>
            <img
              src={logo}
              alt="Sunny Beach"
              className={isForgotResetView ? 'w-14 h-14 mx-auto mb-3 rounded-full' : 'w-20 h-20 mx-auto mb-4 rounded-full'}
            />
            <h2 className={`font-bold text-gray-900 ${isForgotResetView ? 'text-2xl' : 'text-3xl'}`}>
              {mode === 'login' && view === 'forgot-request'
                ? 'Mot de Passe Oublie'
                : mode === 'login' && view === 'forgot-reset'
                  ? 'Reinitialiser le Mot de Passe'
                  : mode === 'login' && view === 'phone-request'
                    ? 'Connexion par Telephone'
                    : mode === 'login' && view === 'phone-verify'
                      ? 'Entrer le Code SMS'
                    : mode === 'signup' && view === 'signup-verify'
                      ? 'Verifier Votre Numero'
                  : mode === 'login'
                    ? 'Connexion'
                    : 'Créer un compte'}
            </h2>
            <p className="text-gray-600 mt-2">
              {mode === 'login' && view === 'forgot-request'
                ? 'Entrez votre email pour recevoir le code'
                : mode === 'login' && view === 'forgot-reset'
                  ? 'Entrez le code et votre nouveau mot de passe'
                  : mode === 'login' && view === 'phone-request'
                    ? 'Saisissez votre numero pour recevoir un code SMS'
                    : mode === 'login' && view === 'phone-verify'
                      ? 'Entrez le code recu par SMS pour vous connecter'
                      : mode === 'signup' && view === 'signup-verify'
                        ? 'Entrez le code SMS pour terminer la creation du compte'
                  : mode === 'login'
                ? 'Bienvenue! Connectez-vous à votre compte'
                : 'Rejoignez-nous pour une expérience unique'}
            </p>
          </div>

          {mode === 'signup' && view === 'signup-verify' && (
            <form onSubmit={handleSignupPhoneVerification} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Numero de telephone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code SMS</label>
                <input
                  type="text"
                  value={signupCode}
                  onChange={(e) => setSignupCode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  placeholder="Ex: 123456"
                  required
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-600 text-sm">{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin mr-2" size={20} />
                    Chargement...
                  </>
                ) : (
                  'Verifier et se connecter'
                )}
              </button>

              <p className="text-center text-sm text-gray-600 mt-4">
                <button type="button" onClick={() => { setView('auth'); setError(''); setSuccess(''); }} className="text-orange-500 hover:text-orange-600 font-semibold transition-colors">
                  Retour a l'inscription
                </button>
              </p>
            </form>
          )}

          {mode === 'login' && view === 'phone-request' && (
            <form onSubmit={handlePhoneCodeRequest} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Numero de telephone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="tel"
                    value={phoneLogin}
                    onChange={(e) => setPhoneLogin(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    placeholder="+216 20 123 456"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-600 text-sm">{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin mr-2" size={20} />
                    Chargement...
                  </>
                ) : (
                  'Envoyer le code SMS'
                )}
              </button>

              <p className="text-center text-sm text-gray-600 mt-4">
                <button type="button" onClick={() => { setView('auth'); setError(''); setSuccess(''); }} className="text-orange-500 hover:text-orange-600 font-semibold transition-colors">
                  Retour a la connexion
                </button>
              </p>
            </form>
          )}

          {mode === 'login' && view === 'phone-verify' && (
            <form onSubmit={handlePhoneLoginVerify} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Numero de telephone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="tel"
                    value={phoneLogin}
                    onChange={(e) => setPhoneLogin(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    placeholder="+216 20 123 456"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code SMS</label>
                <input
                  type="text"
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  placeholder="Ex: 123456"
                  required
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-600 text-sm">{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin mr-2" size={20} />
                    Chargement...
                  </>
                ) : (
                  'Verifier et se connecter'
                )}
              </button>

              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={() => setView('phone-request')} className="text-sm text-orange-500 hover:text-orange-600 font-semibold transition-colors">
                  Renvoyer le code
                </button>
                <button type="button" onClick={() => { setView('auth'); setError(''); setSuccess(''); }} className="text-sm text-gray-600 hover:text-gray-800 font-semibold transition-colors">
                  Retour a la connexion
                </button>
              </div>
            </form>
          )}

          {mode === 'login' && view === 'forgot-request' && (
            <form onSubmit={handleForgotPasswordRequest} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-600 text-sm">{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin mr-2" size={20} />
                    Chargement...
                  </>
                ) : (
                  'Envoyer le code'
                )}
              </button>

              <p className="text-center text-sm text-gray-600 mt-4">
                <button type="button" onClick={() => { setView('auth'); setError(''); setSuccess(''); }} className="text-orange-500 hover:text-orange-600 font-semibold transition-colors">
                  Retour a la connexion
                </button>
              </p>
            </form>
          )}

          {mode === 'login' && view === 'forgot-reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code de reinitialisation</label>
                <input
                  type="text"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  placeholder="Ex: 123456"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-600 text-sm">{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin mr-2" size={20} />
                    Chargement...
                  </>
                ) : (
                  'Reinitialiser le mot de passe'
                )}
              </button>

              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={handleResendCode} className="text-sm text-orange-500 hover:text-orange-600 font-semibold transition-colors">
                  Renvoyer le code
                </button>
                <button type="button" onClick={() => { setView('auth'); setError(''); setSuccess(''); }} className="text-sm text-gray-600 hover:text-gray-800 font-semibold transition-colors">
                  Retour a la connexion
                </button>
              </div>
            </form>
          )}

          {view === 'auth' && (
            <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                        placeholder="Prénom"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                        placeholder="Nom"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      placeholder="06 12 34 56 78"
                    />
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {mode === 'signup' && (
                <p className="text-sm text-gray-500 mt-2">Minimum 6 caractères</p>
              )}
              {mode === 'login' && (
                <p className="text-right text-sm mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setView('forgot-request');
                      setError('');
                      setSuccess('');
                    }}
                    className="text-orange-500 hover:text-orange-600 font-semibold transition-colors"
                  >
                    Mot de passe oublie ?
                  </button>
                </p>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600 text-sm">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin mr-2" size={20} />
                  Chargement...
                </>
              ) : mode === 'login' ? (
                'Se connecter'
              ) : (
                "S'inscrire"
              )}
            </button>

            {onSwitchMode && (
              <p className="text-center text-sm text-gray-600 mt-4">
                {mode === 'login' ? (
                  <>Pas encore de compte ?{' '}
                    <button type="button" onClick={() => { setView('auth'); onSwitchMode(); }} className="text-orange-500 hover:text-orange-600 font-semibold transition-colors">
                      S'inscrire
                    </button>
                  </>
                ) : (
                  <>Déjà un compte ?{' '}
                    <button type="button" onClick={() => { setView('auth'); onSwitchMode(); }} className="text-orange-500 hover:text-orange-600 font-semibold transition-colors">
                      Se connecter
                    </button>
                  </>
                )}
              </p>
            )}
          </form>
          )}
        </div>
      </div>
    </div>
  );
}
