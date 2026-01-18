import { Utensils, Clock, Star, Award } from 'lucide-react';

export function Tips() {
  const tips = [
    {
      icon: <Utensils className="w-12 h-12 text-orange-400" />,
      title: 'Spécialités Fraîches',
      description: 'Nos plats sont préparés avec des ingrédients frais du jour, directement de la mer à votre assiette.',
    },
    {
      icon: <Clock className="w-12 h-12 text-orange-400" />,
      title: 'Heures d\'Ouverture',
      description: 'Ouvert tous les jours de 11h à 23h. Réservation recommandée pour les week-ends et jours fériés.',
    },
    {
      icon: <Star className="w-12 h-12 text-orange-400" />,
      title: 'Menu du Jour',
      description: 'Découvrez notre menu spécial du jour avec des créations uniques de notre chef étoilé.',
    },
    {
      icon: <Award className="w-12 h-12 text-orange-400" />,
      title: 'Prix Excellence',
      description: 'Restaurant primé pour sa cuisine exceptionnelle et son service de qualité supérieure.',
    },
  ];

  return (
    <section id="tips" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Conseils & <span className="text-orange-500">Informations</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tout ce que vous devez savoir pour profiter pleinement de votre expérience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {tips.map((tip, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100"
            >
              <div className="mb-6 bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center">
                {tip.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{tip.title}</h3>
              <p className="text-gray-600 leading-relaxed">{tip.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-8 sm:p-12 text-white shadow-2xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-4">Offre Spéciale du Mois</h3>
              <p className="text-lg mb-6 text-orange-50">
                Réservez maintenant et bénéficiez de 20% de réduction sur votre première visite.
                Offre valable du lundi au jeudi.
              </p>
              <button className="px-8 py-3 bg-white text-orange-600 rounded-full font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-300">
                Profiter de l'offre
              </button>
            </div>
            <div className="hidden md:block text-right">
              <div className="text-6xl font-bold">-20%</div>
              <div className="text-xl text-orange-50">Sur votre première visite</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
