import { ChevronDown } from 'lucide-react';

interface HeroProps {
  onReserveTable?: () => void;
}

export function Hero({ onReserveTable }: HeroProps) {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleReserveClick = () => {
    if (onReserveTable) {
      onReserveTable();
    } else {
      scrollToSection('contact');
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,140,66,0.1),transparent_50%)]"></div>

      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <img
            src="/image.png"
            alt="Sunny Beach Restaurant"
            className="w-48 h-48 sm:w-64 sm:h-64 mx-auto rounded-full shadow-2xl transform hover:scale-105 transition-transform duration-500"
          />
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
          Bienvenue au
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400 mt-2">
            Sunny Beach
          </span>
        </h1>

        <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
          Découvrez une expérience culinaire unique face à la mer.
          Des saveurs authentiques dans un cadre paradisiaque.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <button
            onClick={handleReserveClick}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full font-semibold text-lg hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
          >
            Réserver une table
          </button>
          <button
            onClick={() => scrollToSection('about')}
            className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-full font-semibold text-lg hover:bg-white/20 transform hover:scale-105 transition-all duration-300 border-2 border-white/30"
          >
            En savoir plus
          </button>
        </div>

        <div className="flex justify-center gap-8 text-gray-300">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400">10+</div>
            <div className="text-sm">Années d'expérience</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400">50+</div>
            <div className="text-sm">Plats au menu</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400">1000+</div>
            <div className="text-sm">Clients satisfaits</div>
          </div>
        </div>
      </div>

      <button
        onClick={() => scrollToSection('tips')}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-orange-400 animate-bounce hover:text-orange-300 transition-colors"
      >
        <ChevronDown size={40} />
      </button>
    </section>
  );
}
