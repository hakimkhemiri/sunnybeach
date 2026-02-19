import { useState, useEffect, type ReactNode } from 'react';
import { reservationAPI } from '../lib/api';
import { Calendar, Users, DollarSign, CheckCircle, XCircle, ClockIcon, Loader } from 'lucide-react';

interface Reservation {
  id: string;
  table_type: string;
  reservation_date: string;
  start_time?: string;
  end_time?: string;
  num_people: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'accepted' | 'denied';
  created_at?: string;
}

type SortBy = 'created_at' | 'reservation_date';

export function ReservationHistory() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('created_at');

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await reservationAPI.getMyReservations();
      const sorted = [...(data || [])].sort((a, b) => {
        const da = new Date((a as any).created_at || (a as any).createdAt || 0).getTime();
        const db = new Date((b as any).created_at || (b as any).createdAt || 0).getTime();
        return db - da;
      });
      setReservations(sorted);
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
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      accepted: 'bg-green-100 text-green-800 border-green-300',
      denied: 'bg-red-100 text-red-800 border-red-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
      completed: 'bg-blue-100 text-blue-800 border-blue-300',
    };

    const icons: Record<string, ReactNode> = {
      pending: <ClockIcon size={16} />,
      confirmed: <ClockIcon size={16} />,
      accepted: <CheckCircle size={16} />,
      denied: <XCircle size={16} />,
      cancelled: <XCircle size={16} />,
      completed: <CheckCircle size={16} />,
    };

    const labels: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'En attente de validation',
      accepted: 'Acceptée',
      denied: 'Refusée',
      cancelled: 'Annulée',
      completed: 'Terminée',
    };

    const s = styles[status] || 'bg-gray-100 text-gray-800 border-gray-300';
    const icon = icons[status] || <ClockIcon size={16} />;
    const label = labels[status] || status;

    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-semibold border ${s}`}>
        {icon}
        <span>{label}</span>
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

      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-700 self-center mr-2">Trier par :</span>
        {[
          { value: 'created_at' as const, label: 'Date de création' },
          { value: 'reservation_date' as const, label: 'Date de réservation' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setSortBy(value)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              sortBy === value
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">Aucune réservation trouvée</p>
          <p className="text-gray-500 mt-2">Créez votre première réservation dans l'onglet "Réserver une Table"</p>
        </div>
      ) : (() => {
        const sorted = [...reservations].sort((a, b) => {
          if (sortBy === 'created_at') {
            const da = new Date((a as any).created_at || (a as any).createdAt || 0).getTime();
            const db = new Date((b as any).created_at || (b as any).createdAt || 0).getTime();
            return db - da;
          }
          const da = new Date(a.reservation_date).getTime();
          const db = new Date(b.reservation_date).getTime();
          return db - da;
        });
        return (
        <div className="space-y-4">
          {sorted.map((reservation) => {
            const isAccepted = reservation.status === 'accepted';
            const isDenied = reservation.status === 'denied';
            const cardClassName = isAccepted
              ? "bg-green-50 border-2 border-green-300 rounded-lg p-6 hover:shadow-lg transition-shadow"
              : isDenied
              ? "bg-red-50 border-2 border-red-300 rounded-lg p-6 hover:shadow-lg transition-shadow"
              : "bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow";
            const textColor = isAccepted ? 'text-green-800' : isDenied ? 'text-red-800' : 'text-gray-900';
            const detailColor = isAccepted ? 'text-green-700' : isDenied ? 'text-red-700' : 'text-gray-600';
            const iconColor = isAccepted ? 'text-green-600' : isDenied ? 'text-red-600' : 'text-orange-500';
            
            return (
            <div
              key={reservation.id}
              className={cardClassName}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xl font-bold ${textColor}`}>
                      {reservation.table_type}
                    </h3>
                    {getStatusBadge(reservation.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className={`flex items-center space-x-2 ${detailColor}`}>
                      <Calendar size={18} className={iconColor} />
                      <span>{formatDate(reservation.reservation_date)}</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${detailColor}`}>
                      <Users size={18} className={iconColor} />
                      <span>{reservation.num_people} personne{reservation.num_people > 1 ? 's' : ''}</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${detailColor}`}>
                      <DollarSign size={18} className={iconColor} />
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
                    <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg flex items-center space-x-2">
                      <ClockIcon size={16} />
                      <span>En attente de validation</span>
                    </div>
                  )}
                  {reservation.status === 'accepted' && (
                    <div className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center space-x-2 font-semibold">
                      <CheckCircle size={16} />
                      <span>Réservation acceptée ✓</span>
                    </div>
                  )}
                  {reservation.status === 'denied' && (
                    <div className="px-4 py-2 bg-red-500 text-white rounded-lg flex items-center space-x-2 font-semibold">
                      <XCircle size={16} />
                      <span>Réservation refusée</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
        );
      })()}
    </div>
  );
}
