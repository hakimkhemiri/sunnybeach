import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { Tips } from './components/Tips';
import { About } from './components/About';
import { Map } from './components/Map';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';

function App() {
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  if (showDashboard && user) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation
          onLoginClick={() => setShowLoginModal(true)}
          onSignupClick={() => setShowSignupModal(true)}
          onDashboardClick={() => setShowDashboard(true)}
        />
        <button
          onClick={() => setShowDashboard(false)}
          className="fixed top-24 left-4 z-40 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
        >
          Retour à l'accueil
        </button>
        <Dashboard />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation
        onLoginClick={() => setShowLoginModal(true)}
        onSignupClick={() => setShowSignupModal(true)}
        onDashboardClick={() => setShowDashboard(true)}
      />

      <Hero />
      <Tips />
      <About />
      <Map />
      <Contact />
      <Footer />

      <AuthModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        mode="login"
      />

      <AuthModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        mode="signup"
      />
    </div>
  );
}

export default App;
