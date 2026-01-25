import { useState } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { Profile } from './Profile';
import { ReservationForm } from './ReservationForm';
import { FoodOrdering } from './FoodOrdering';
import { ReservationHistory } from './ReservationHistory';

type DashboardTab = 'profile' | 'reservation' | 'history' | 'food';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('profile');
  const [reservationId, setReservationId] = useState<string>('');

  const handleReservationComplete = (resId: string) => {
    setReservationId(resId);
    setActiveTab('history'); // Redirect to history instead of food
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-gray-900 flex items-center space-x-3 mb-4">
            <LayoutDashboard size={40} className="text-orange-500" />
            <span>Tableau de Bord</span>
          </h1>
          <p className="text-xl text-gray-600">
            Gérez votre profil, réservations et commandes
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/4 bg-gray-900">
              <div className="p-8 space-y-4">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-6 py-4 rounded-lg font-semibold transition-all transform ${
                    activeTab === 'profile'
                      ? 'bg-orange-500 text-white shadow-lg scale-105'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  Mon Profil
                </button>
                <button
                  onClick={() => setActiveTab('reservation')}
                  className={`w-full text-left px-6 py-4 rounded-lg font-semibold transition-all transform ${
                    activeTab === 'reservation'
                      ? 'bg-orange-500 text-white shadow-lg scale-105'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  Réserver une Table
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`w-full text-left px-6 py-4 rounded-lg font-semibold transition-all transform ${
                    activeTab === 'history'
                      ? 'bg-orange-500 text-white shadow-lg scale-105'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  Mes Réservations
                </button>
                <button
                  onClick={() => setActiveTab('food')}
                  className={`w-full text-left px-6 py-4 rounded-lg font-semibold transition-all transform ${
                    activeTab === 'food'
                      ? 'bg-orange-500 text-white shadow-lg scale-105'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  Commander
                </button>
              </div>
            </div>

            <div className="md:w-3/4 p-8">
              {activeTab === 'profile' && <Profile />}
              {activeTab === 'reservation' && (
                <ReservationForm onReservationComplete={handleReservationComplete} />
              )}
              {activeTab === 'history' && <ReservationHistory />}
              {activeTab === 'food' && <FoodOrdering reservationId={reservationId} />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
