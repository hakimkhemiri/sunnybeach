import { useState, useEffect } from 'react';
import { reservationAPI } from '../lib/api';
import { Calendar, Clock, Users, DollarSign, CheckCircle, XCircle, ClockIcon, Loader } from 'lucide-react';

interface Reservation {
  id: string;
  table_type: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  num_people: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at?: string;
}

export function ReservationHistory() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await reservationAPI.getMyReservations();
      setReservations(data);
    } catch (err: any) {
      setError('Erreur lors du chargement des réservations');
      console.error('Error loading reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      setUpdating(id);
      await reservationAPI.confirmReservation(id);
      await loadReservations();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la confirmation');
    } finally {
      setUpdating(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation?')) {
      return;
    }
    try {
      setUpdating(id);
      await reservationAPI.cancelReservation(id);
      await loadReservations();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'annulation');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
      completed: 'bg-blue-100 text-blue-800 border-blue-300',
    };

    const icons = {
      pending: <ClockIcon size={16} />,
      confirmed: <CheckCircle size={16} />,
      cancelled: <XCircle size={16} />,
      completed: <CheckCircle size={16} />,
    };

    const labels = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      cancelled: 'Annulée',
      completed: 'Terminée',
    };

    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-semibold border ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        <span>{labels[status as keyof typeof labels]}</span>
      </span>
    );
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) {
      return dateString.toString();
    }
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <Calendar size={28} className="text-orange-500" />
          <span>Historique des Réservations</span>
        </h2>
        <button
          onClick={loadReservations}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Actualiser
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {reservations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">Aucune réservation trouvée</p>
          <p className="text-gray-500 mt-2">Créez votre première réservation dans l'onglet "Réserver une Table"</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((reservation) => (
            <div
              key={reservation.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">{reservation.table_type}</h3>
                    {getStatusBadge(reservation.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar size={18} className="text-orange-500" />
                      <span>{formatDate(reservation.reservation_date)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Clock size={18} className="text-orange-500" />
                      <span>{reservation.start_time} - {reservation.end_time}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Users size={18} className="text-orange-500" />
                      <span>{reservation.num_people} personne{reservation.num_people > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <DollarSign size={18} className="text-orange-500" />
                      <span className="font-semibold">{reservation.total_price.toFixed(2)} DT</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {reservation.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleConfirm(reservation.id)}
                        disabled={updating === reservation.id}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        {updating === reservation.id ? (
                          <Loader className="animate-spin" size={16} />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        <span>Confirmer</span>
                      </button>
                      <button
                        onClick={() => handleCancel(reservation.id)}
                        disabled={updating === reservation.id}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        {updating === reservation.id ? (
                          <Loader className="animate-spin" size={16} />
                        ) : (
                          <XCircle size={16} />
                        )}
                        <span>Annuler</span>
                      </button>
                    </>
                  )}
                  {reservation.status === 'confirmed' && (
                    <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg flex items-center space-x-2">
                      <CheckCircle size={16} />
                      <span>Réservation confirmée</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
