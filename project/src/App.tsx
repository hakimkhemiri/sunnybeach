import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { Tips } from './components/Tips';
import { HomeMenu } from './components/HomeMenu';
import { MenuPage } from './components/MenuPage';
import { About } from './components/About';
import { Map } from './components/Map';
import { Contact } from './components/Contact';
import { ImageGallery } from './components/ImageGallery';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';
import { AdminDashboard } from './components/AdminDashboard';

type DashboardInitialTab = 'profile' | 'reservation' | null;

function App() {
  const { user, isAdmin } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showMenuPage, setShowMenuPage] = useState(false);
  const [dashboardInitialTab, setDashboardInitialTab] = useState<DashboardInitialTab>(null);
  const [scrollToSectionOnMount, setScrollToSectionOnMount] = useState<string | null>(null);

  const openDashboard = (tab: DashboardInitialTab = null) => {
    setShowMenuPage(false);
    setShowDashboard(true);
    setDashboardInitialTab(tab);
  };

  const openMenuPage = () => {
    setShowDashboard(false);
    setShowMenuPage(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReserveTable = () => {
    if (user) {
      if (isAdmin) {
        openDashboard(null);
      } else {
        openDashboard('reservation');
      }
    } else {
      setShowLoginModal(true);
    }
  };

  const handleNavigateToSection = (sectionId: string) => {
    if (sectionId === 'menu') {
      openMenuPage();
      return;
    }

    setShowMenuPage(false);
    setShowDashboard(false);
    setScrollToSectionOnMount(sectionId);
  };

  useEffect(() => {
    if (!showDashboard && scrollToSectionOnMount) {
      const tid = setTimeout(() => {
        const el = document.getElementById(scrollToSectionOnMount);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        setScrollToSectionOnMount(null);
      }, 50);
      return () => clearTimeout(tid);
    }
  }, [showDashboard, scrollToSectionOnMount]);

  if (showDashboard && user) {
    // Show admin dashboard for admin users, regular dashboard for others
    if (isAdmin) {
      return (
        <div className="min-h-screen bg-white">
          <Navigation
            onLoginClick={() => setShowLoginModal(true)}
            onSignupClick={() => setShowSignupModal(true)}
            onDashboardClick={() => openDashboard(null)}
            onNavigateToSection={handleNavigateToSection}
          />
          <button
            onClick={() => handleNavigateToSection('home')}
            className="fixed top-24 left-4 z-40 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
          >
            Retour à l&apos;accueil
          </button>
          <AdminDashboard />
          <Footer />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-white">
        <Navigation
          onLoginClick={() => setShowLoginModal(true)}
          onSignupClick={() => setShowSignupModal(true)}
          onDashboardClick={() => openDashboard(null)}
          onNavigateToSection={handleNavigateToSection}
        />
        <button
          onClick={() => handleNavigateToSection('home')}
          className="fixed top-24 left-4 z-40 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
        >
          Retour à l&apos;accueil
        </button>
        <Dashboard initialTab={dashboardInitialTab ?? 'profile'} />
        <Footer />
      </div>
    );
  }

  if (showMenuPage) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation
          onLoginClick={() => setShowLoginModal(true)}
          onSignupClick={() => setShowSignupModal(true)}
          onDashboardClick={() => openDashboard(null)}
          onNavigateToSection={handleNavigateToSection}
        />

        <button
          onClick={() => handleNavigateToSection('home')}
          className="fixed top-24 left-4 z-40 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
        >
          Retour à l&apos;accueil
        </button>

        <MenuPage />
        <Footer />

        <AuthModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => {
            setShowDashboard(false);
            setShowMenuPage(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSwitchMode={() => { setShowLoginModal(false); setShowSignupModal(true); }}
          mode="login"
        />

        <AuthModal
          isOpen={showSignupModal}
          onClose={() => setShowSignupModal(false)}
          onSwitchMode={() => { setShowSignupModal(false); setShowLoginModal(true); }}
          mode="signup"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation
        onLoginClick={() => setShowLoginModal(true)}
        onSignupClick={() => setShowSignupModal(true)}
        onDashboardClick={() => openDashboard(null)}
        onNavigateToSection={handleNavigateToSection}
      />

      <Hero onReserveTable={handleReserveTable} />
      <Tips />
      <HomeMenu onSeeAll={openMenuPage} />
      <About />
      <Map />
      <Contact />
      <ImageGallery />
      <Footer />

      <AuthModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowDashboard(false);
          setScrollToSectionOnMount('menu');
        }}
        onSwitchMode={() => { setShowLoginModal(false); setShowSignupModal(true); }}
        mode="login"
      />

      <AuthModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchMode={() => { setShowSignupModal(false); setShowLoginModal(true); }}
        mode="signup"
      />
    </div>
  );
}

export default App;
