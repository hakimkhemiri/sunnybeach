import { useState } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
  onDashboardClick: () => void;
  onNavigateToSection?: (sectionId: string) => void;
}

export function Navigation({ onLoginClick, onSignupClick, onDashboardClick, onNavigateToSection }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  const handleSectionClick = (sectionId: string) => {
    if (onNavigateToSection) {
      onNavigateToSection(sectionId);
      setIsOpen(false);
    } else {
      scrollToSection(sectionId);
    }
  };

  return (
    <nav className="fixed top-0 w-full bg-gray-900/95 backdrop-blur-sm shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-3">
            <img src="/image.png" alt="Sunny Beach" className="h-14 w-14 rounded-full" />
            <span className="text-2xl font-bold text-orange-400">Sunny Beach</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => handleSectionClick('home')}
              className="text-gray-200 hover:text-orange-400 transition-colors font-medium"
            >
              Accueil
            </button>
            <button
              onClick={() => handleSectionClick('tips')}
              className="text-gray-200 hover:text-orange-400 transition-colors font-medium"
            >
              Conseils
            </button>
            <button
              onClick={() => handleSectionClick('about')}
              className="text-gray-200 hover:text-orange-400 transition-colors font-medium"
            >
              À Propos
            </button>
            <button
              onClick={() => handleSectionClick('map')}
              className="text-gray-200 hover:text-orange-400 transition-colors font-medium"
            >
              Localisation
            </button>
            <button
              onClick={() => handleSectionClick('contact')}
              className="text-gray-200 hover:text-orange-400 transition-colors font-medium"
            >
              Contact
            </button>

            {user ? (
              <div className="flex items-center space-x-4">
                <button
                  onClick={onDashboardClick}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <User size={18} />
                  <span>Tableau de Bord</span>
                </button>
                <button
                  onClick={signOut}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <LogOut size={18} />
                  <span>Déconnexion</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <button
                  onClick={onLoginClick}
                  className="px-6 py-2 text-gray-200 hover:text-orange-400 transition-colors font-medium"
                >
                  Connexion
                </button>
                <button
                  onClick={onSignupClick}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all transform hover:scale-105 font-medium"
                >
                  S'inscrire
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-200 hover:text-orange-400 transition-colors"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => handleSectionClick('home')}
                className="text-gray-200 hover:text-orange-400 transition-colors text-left py-2"
              >
                Accueil
              </button>
              <button
                onClick={() => handleSectionClick('tips')}
                className="text-gray-200 hover:text-orange-400 transition-colors text-left py-2"
              >
                Conseils
              </button>
              <button
                onClick={() => handleSectionClick('about')}
                className="text-gray-200 hover:text-orange-400 transition-colors text-left py-2"
              >
                À Propos
              </button>
              <button
                onClick={() => handleSectionClick('map')}
                className="text-gray-200 hover:text-orange-400 transition-colors text-left py-2"
              >
                Localisation
              </button>
              <button
                onClick={() => handleSectionClick('contact')}
                className="text-gray-200 hover:text-orange-400 transition-colors text-left py-2"
              >
                Contact
              </button>

              {user ? (
                <>
                  <button
                    onClick={onDashboardClick}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-left"
                  >
                    Tableau de Bord
                  </button>
                  <button
                    onClick={signOut}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-left"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onLoginClick}
                    className="px-4 py-2 text-gray-200 hover:text-orange-400 transition-colors text-left"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={onSignupClick}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    S'inscrire
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
