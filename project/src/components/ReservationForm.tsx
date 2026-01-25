import { useState, useEffect } from 'react';
import { reservationAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { TableType, Reservation } from '../types';
import { Calendar, Users, Clock, DollarSign, Loader, CheckCircle } from 'lucide-react';

interface ReservationFormProps {
  onReservationComplete?: (reservationId: string) => void;
}

export function ReservationForm({ onReservationComplete }: ReservationFormProps) {
  const { user } = useAuth();
  const [tableTypes, setTableTypes] = useState<TableType[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [reservationId, setReservationId] = useState('');

  const [formData, setFormData] = useState({
    table_type: '',
    reservation_date: '',
    start_time: '12:00',
    end_time: '14:00',
    num_people: 2,
  });

  const [estimatedPrice, setEstimatedPrice] = useState(0);

  useEffect(() => {
    loadTableTypes();
  }, []);

  useEffect(() => {
    calculatePrice();
  }, [formData.table_type, formData.start_time, formData.end_time]);

  const loadTableTypes = async () => {
    try {
      setLoading(true);
      const data = await reservationAPI.getTableTypes();
      setTableTypes(data);
    } catch (err: any) {
      setError('Erreur lors du chargement des types de tables');
      console.error('Error loading table types:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = () => {
    if (!formData.table_type || !formData.start_time || !formData.end_time) {
      setEstimatedPrice(0);
      return;
    }

    const table = tableTypes.find(t => t.name === formData.table_type);
    if (!table) return;

    const [startH, startM] = formData.start_time.split(':').map(Number);
    const [endH, endM] = formData.end_time.split(':').map(Number);

    let hours = endH - startH + (endM - startM) / 60;
    if (hours <= 0) hours = 1;

    setEstimatedPrice(Math.ceil(hours * table.price_per_hour * 100) / 100);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSubmitting(true);

    try {
      if (!formData.table_type) {
        throw new Error('Veuillez sélectionner un type de table');
      }

      const table = tableTypes.find(t => t.name === formData.table_type);
      if (!table || formData.num_people < table.capacity_min || formData.num_people > table.capacity_max) {
        throw new Error('Nombre de personnes incompatible avec le type de table sélectionné');
      }

      const reservationData = {
        table_type: formData.table_type,
        reservation_date: formData.reservation_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        num_people: parseInt(formData.num_people.toString()),
      };

      const reservation = await reservationAPI.createReservation(reservationData);

      // Convert backend integer ID to string for compatibility
      const newReservationId = String(reservation.id);
      setReservationId(newReservationId);
      setSuccess(true);

      setFormData({
        table_type: '',
        reservation_date: '',
        start_time: '12:00',
        end_time: '14:00',
        num_people: 2,
      });

      if (onReservationComplete && newReservationId) {
        setTimeout(() => onReservationComplete(newReservationId), 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la réservation');
      console.error('Error creating reservation:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Réservation créée!</h3>
        <p className="text-gray-600 mb-4">
          Votre réservation a été créée avec succès. Elle est en attente de confirmation. 
          Vous serez redirigé vers "Mes Réservations" pour la confirmer ou l'annuler.
        </p>
        <p className="text-sm text-gray-500">
          ID de réservation: <span className="font-mono">{reservationId}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center space-x-3">
        <Calendar size={32} className="text-orange-500" />
        <span>Réserver une Table</span>
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-orange-500" size={32} />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de table *
              </label>
              <select
                name="table_type"
                value={formData.table_type}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                required
              >
                <option value="">Sélectionnez un type</option>
                {tableTypes.map(table => (
                  <option key={table.name} value={table.name}>
                    {table.name} ({table.capacity_min}-{table.capacity_max} personnes) - {table.price_per_hour}DT/h
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de réservation *
              </label>
              <input
                type="date"
                name="reservation_date"
                value={formData.reservation_date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <Clock size={18} className="text-orange-500" />
                <span>Heure de début *</span>
              </label>
              <input
                type="time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <Clock size={18} className="text-orange-500" />
                <span>Heure de fin *</span>
              </label>
              <input
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <Users size={18} className="text-orange-500" />
                <span>Nombre de personnes *</span>
              </label>
              <input
                type="number"
                name="num_people"
                value={formData.num_people}
                onChange={handleChange}
                min="1"
                max="50"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <DollarSign size={18} className="text-orange-500" />
                <span>Prix estimé</span>
              </label>
              <div className="px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg text-2xl font-bold text-orange-600">
                {estimatedPrice.toFixed(2)} DT
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center justify-center text-lg"
          >
            {submitting ? (
              <>
                <Loader className="animate-spin mr-2" size={20} />
                Création en cours...
              </>
            ) : (
              'Confirmer la réservation'
            )}
          </button>
        </form>
      )}
    </div>
  );
}
