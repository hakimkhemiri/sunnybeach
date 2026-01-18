import { Heart, Users, Leaf, Award } from 'lucide-react';

export function About() {
  const values = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Passion',
      description: 'Chaque plat est préparé avec amour et dévouement',
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Famille',
      description: 'Une ambiance chaleureuse et conviviale',
    },
    {
      icon: <Leaf className="w-8 h-8" />,
      title: 'Fraîcheur',
      description: 'Ingrédients locaux et bio de première qualité',
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Excellence',
      description: 'Un service irréprochable à chaque visite',
    },
  ];

  return (
    <section id="about" className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              À Propos de <span className="text-orange-400">Sunny Beach</span>
            </h2>
            <div className="space-y-6 text-lg text-gray-300 leading-relaxed">
              <p>
                Depuis plus d'une décennie, Sunny Beach est devenu une destination culinaire
                incontournable pour les amateurs de cuisine raffinée et de vues spectaculaires
                sur l'océan.
              </p>
              <p>
                Notre restaurant familial allie tradition et innovation pour créer des
                expériences gastronomiques mémorables. Chaque plat raconte une histoire,
                chaque ingrédient est soigneusement sélectionné pour sa qualité exceptionnelle.
              </p>
              <p>
                Que vous veniez pour un déjeuner en famille, un dîner romantique ou une
                célébration spéciale, notre équipe dévouée s'assure que chaque moment passé
                chez nous soit inoubliable.
              </p>
            </div>

            <div className="mt-8 flex gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400">2013</div>
                <div className="text-sm text-gray-400">Année de création</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400">5★</div>
                <div className="text-sm text-gray-400">Note moyenne</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400">24/7</div>
                <div className="text-sm text-gray-400">Service client</div>
              </div>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-6">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="text-orange-400 mb-4">{value.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                  <p className="text-gray-400 text-sm">{value.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 backdrop-blur-sm p-8 rounded-2xl border border-orange-500/30">
              <h3 className="text-2xl font-bold mb-4 text-orange-400">Notre Chef</h3>
              <p className="text-gray-300 leading-relaxed">
                Chef Jean-Pierre Martinez, avec plus de 20 ans d'expérience dans la haute
                cuisine, dirige notre équipe culinaire avec passion et créativité. Sa vision
                unique combine les saveurs méditerranéennes traditionnelles avec des
                techniques modernes innovantes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
