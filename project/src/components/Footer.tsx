import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img src="/image.png" alt="Sunny Beach" className="h-12 w-12 rounded-full" />
              <span className="text-xl font-bold text-orange-400">Sunny Beach</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Une expérience culinaire unique face à la mer. Saveurs authentiques et cadre paradisiaque.
            </p>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <a href="#home" className="text-gray-400 hover:text-orange-400 transition-colors">
                  Accueil
                </a>
              </li>
              <li>
                <a href="#tips" className="text-gray-400 hover:text-orange-400 transition-colors">
                  Conseils
                </a>
              </li>
              <li>
                <a href="#about" className="text-gray-400 hover:text-orange-400 transition-colors">
                  À Propos
                </a>
              </li>
              <li>
                <a href="#map" className="text-gray-400 hover:text-orange-400 transition-colors">
                  Localisation
                </a>
              </li>
              <li>
                <a href="#contact" className="text-gray-400 hover:text-orange-400 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <MapPin size={18} className="text-orange-400 mt-1 flex-shrink-0" />
                <span className="text-gray-400 text-sm">123 Boulevard de la Plage, Nice</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone size={18} className="text-orange-400 flex-shrink-0" />
                <span className="text-gray-400 text-sm">+33 4 93 00 00 00</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail size={18} className="text-orange-400 flex-shrink-0" />
                <span className="text-gray-400 text-sm">contact@sunnybeach.fr</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Suivez-nous</h3>
            <div className="flex space-x-4">
              <a
                href="#"
                className="bg-white/5 p-3 rounded-lg hover:bg-orange-500 transition-all duration-300 transform hover:scale-110"
              >
                <Facebook size={20} />
              </a>
              <a
                href="#"
                className="bg-white/5 p-3 rounded-lg hover:bg-orange-500 transition-all duration-300 transform hover:scale-110"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="bg-white/5 p-3 rounded-lg hover:bg-orange-500 transition-all duration-300 transform hover:scale-110"
              >
                <Twitter size={20} />
              </a>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              Restez informé de nos actualités et offres spéciales
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Sunny Beach Restaurant. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
