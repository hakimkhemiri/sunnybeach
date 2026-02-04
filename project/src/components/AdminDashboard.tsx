import { useState, useEffect, useRef } from 'react';
import { Shield, Calendar, ShoppingCart, MessageSquare, Loader, CheckCircle, XCircle, Clock, AlertCircle, Trash2, Mail, Archive, UtensilsCrossed, Plus, ImageIcon, Pencil } from 'lucide-react';
import { reservationAPI, contactMessageAPI, foodAPI, getUploadsBaseUrl } from '../lib/api';
import { Reservation, ContactMessage, FoodItem } from '../types';
import { useAuth } from '../contexts/AuthContext';

type AdminTab = 'reservations' | 'orders' | 'messages' | 'menu' | 'overview';
type ReservationFilter = 'all' | 'confirmed' | 'accepted' | 'denied';

export function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [reservationFilter, setReservationFilter] = useState<ReservationFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [menuItems, setMenuItems] = useState<FoodItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [menuForm, setMenuForm] = useState({ name: '', description: '', category: 'main', price: '', available: true });
  const [menuImage, setMenuImage] = useState<File | null>(null);
  const [menuSubmitting, setMenuSubmitting] = useState(false);
  const menuImageInputRef = useRef<HTMLInputElement | null>(null);
  const [editingPlat, setEditingPlat] = useState<FoodItem | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', category: 'main' as const, price: '', available: true });
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editRemoveImage, setEditRemoveImage] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const editImageInputRef = useRef<HTMLInputElement | null>(null);
  const [stats, setStats] = useState({
    totalReservations: 0,
    totalOrders: 0,
    totalMessages: 0,
    pendingReservations: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadReservations(), loadOrders(), loadMessages()]);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMenuItems = async () => {
    try {
      setMenuLoading(true);
      setMenuError(null);
      const data = await foodAPI.getAllAdmin();
      setMenuItems(data || []);
    } catch (err: any) {
      setMenuError(err?.message || 'Erreur chargement menu');
      setMenuItems([]);
    } finally {
      setMenuLoading(false);
    }
  };

  const handleAddPlat = async (e: React.FormEvent) => {
    e.preventDefault();
    setMenuError(null);
    setMenuSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', menuForm.name.trim());
      formData.append('description', menuForm.description.trim());
      formData.append('category', menuForm.category);
      formData.append('price', String(menuForm.price));
      formData.append('available', String(menuForm.available));
      if (menuImage) formData.append('image', menuImage);
      await foodAPI.createFoodItem(formData);
      setMenuForm({ name: '', description: '', category: 'main', price: '', available: true });
      setMenuImage(null);
      if (menuImageInputRef.current) menuImageInputRef.current.value = '';
      await loadMenuItems();
    } catch (err: any) {
      setMenuError(err?.message || 'Erreur lors de l\'ajout du plat');
    } finally {
      setMenuSubmitting(false);
    }
  };

  const handleDeletePlat = async (id: string) => {
    if (!confirm('Supprimer ce plat du menu ?')) return;
    try {
      await foodAPI.deleteFoodItem(id);
      await loadMenuItems();
      if (editingPlat?.id === id) setEditingPlat(null);
    } catch (err: any) {
      setMenuError(err?.message || 'Erreur lors de la suppression');
    }
  };

  const handleEditPlat = (item: FoodItem) => {
    setEditingPlat(item);
    setEditForm({ name: item.name, description: item.description || '', category: item.category, price: String(item.price), available: item.available });
    setEditImage(null);
    setEditRemoveImage(false);
    if (editImageInputRef.current) editImageInputRef.current.value = '';
  };

  const handleCancelEdit = () => {
    setEditingPlat(null);
    setEditForm({ name: '', description: '', category: 'main', price: '', available: true });
    setEditImage(null);
    setEditRemoveImage(false);
  };

  const handleUpdatePlat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlat) return;
    setMenuError(null);
    setEditSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', editForm.name.trim());
      formData.append('description', editForm.description.trim());
      formData.append('category', editForm.category);
      formData.append('price', String(editForm.price));
      formData.append('available', String(editForm.available));
      if (editRemoveImage) formData.append('remove_image', 'true');
      if (editImage) formData.append('image', editImage);
      await foodAPI.updateFoodItem(editingPlat.id, formData);
      handleCancelEdit();
      await loadMenuItems();
    } catch (err: any) {
      setMenuError(err?.message || 'Erreur lors de la modification');
    } finally {
      setEditSubmitting(false);
    }
  };

  const loadReservations = async () => {
    try {
      setError(null);
      console.log('Loading reservations...');
      console.log('Current user:', user);
      console.log('Is admin:', isAdmin);
      
      if (!user) {
        setError('Vous devez être connecté pour voir les réservations.');
        setReservations([]);
        return;
      }

      if (!isAdmin) {
        setError('Accès administrateur requis pour voir toutes les réservations.');
        setReservations([]);
        return;
      }

      const data = await reservationAPI.getAllReservations();
      console.log('Reservations data received:', data);
      
      // Handle case where data might be undefined or null
      if (!data) {
        console.warn('No reservations data returned from API');
        setReservations([]);
        setError(null); // No error, just no data
        return;
      }

      // Map backend data to frontend format
      const mappedReservations = Array.isArray(data) 
        ? data.map((r: any) => ({
            ...r,
            table_type_id: r.table_type, // Map table_type to table_type_id for compatibility
          }))
        : [];
      
      console.log('Mapped reservations:', mappedReservations);
      setReservations(mappedReservations);
      setError(null);
      setStats(prev => ({
        ...prev,
        totalReservations: mappedReservations.length,
        pendingReservations: mappedReservations.filter((r: Reservation) => r.status === 'confirmed').length, // Confirmé = en attente de décision admin
        confirmedReservations: mappedReservations.filter((r: Reservation) => r.status === 'accepted').length, // Accepté = historique
        cancelledReservations: mappedReservations.filter((r: Reservation) => r.status === 'denied').length, // Refusé
      }));
    } catch (err: any) {
      console.error('Error loading reservations:', err);
      console.error('Error details:', {
        message: err?.message,
        stack: err?.stack,
        response: err?.response
      });
      setReservations([]);
      
      // Set error message
      if (err?.message?.includes('401') || err?.message?.includes('Unauthorized')) {
        setError('Vous devez être connecté en tant qu\'administrateur pour voir les réservations.');
      } else if (err?.message?.includes('403') || err?.message?.includes('Admin access required')) {
        setError('Accès administrateur requis. Veuillez vous connecter avec un compte administrateur.');
      } else {
        setError(`Erreur lors du chargement des réservations: ${err?.message || 'Erreur inconnue'}`);
      }
    }
  };

  const loadOrders = async () => {
    try {
      // TODO: Implement when order API is available
      setOrders([]);
      setStats(prev => ({
        ...prev,
        totalOrders: 0,
      }));
    } catch (err) {
      console.error('Error loading orders:', err);
    }
  };

  const loadMessages = async () => {
    try {
      setError(null);
      const data = await contactMessageAPI.getAllMessages();
      setMessages(data || []);
      setStats(prev => ({
        ...prev,
        totalMessages: data?.length || 0,
      }));
    } catch (err: any) {
      console.error('Error loading messages:', err);
      setMessages([]);
      if (err?.message?.includes('401') || err?.message?.includes('Unauthorized')) {
        setError('Vous devez être connecté en tant qu\'administrateur pour voir les messages.');
      } else if (err?.message?.includes('403') || err?.message?.includes('Admin access required')) {
        setError('Accès administrateur requis.');
      }
    }
  };

  const updateReservationStatus = async (id: string, status: string) => {
    try {
      await reservationAPI.updateReservation(id, { status });
      await loadReservations();
    } catch (err) {
      console.error('Error updating reservation:', err);
      alert('Erreur lors de la mise à jour de la réservation');
    }
  };

  const acceptReservation = async (id: string) => {
    try {
      // Update status to 'accepted' instead of 'confirmed'
      await reservationAPI.updateReservation(id, { status: 'accepted' });
      await loadReservations();
    } catch (err) {
      console.error('Error accepting reservation:', err);
      alert('Erreur lors de l\'acceptation de la réservation');
    }
  };

  const denyReservation = async (id: string) => {
    try {
      // Update status to 'denied' instead of 'cancelled'
      await reservationAPI.updateReservation(id, { status: 'denied' });
      await loadReservations();
    } catch (err) {
      console.error('Error denying reservation:', err);
      alert('Erreur lors du refus de la réservation');
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      // TODO: Implement when order API is available
      console.log('Update order status:', id, status);
      await loadOrders();
    } catch (err) {
      console.error('Error updating order:', err);
    }
  };

  if (loading && activeTab === 'overview') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin text-orange-500" size={48} />
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-gray-900 flex items-center space-x-3 mb-4">
            <Shield size={40} className="text-red-500" />
            <span>Tableau de Bord Administrateur</span>
          </h1>
          <p className="text-xl text-gray-600">
            Gérez les réservations, commandes et messages
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/4 bg-gray-900">
              <div className="p-8 space-y-4">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full text-left px-6 py-4 rounded-lg font-semibold transition-all transform ${
                    activeTab === 'overview'
                      ? 'bg-red-500 text-white shadow-lg scale-105'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  Vue d'ensemble
                </button>
                <button
                  onClick={() => setActiveTab('reservations')}
                  className={`w-full text-left px-6 py-4 rounded-lg font-semibold transition-all transform ${
                    activeTab === 'reservations'
                      ? 'bg-red-500 text-white shadow-lg scale-105'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Calendar size={18} className="inline mr-2" />
                  Réservations
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full text-left px-6 py-4 rounded-lg font-semibold transition-all transform ${
                    activeTab === 'orders'
                      ? 'bg-red-500 text-white shadow-lg scale-105'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <ShoppingCart size={18} className="inline mr-2" />
                  Commandes
                </button>
                <button
                  onClick={() => setActiveTab('messages')}
                  className={`w-full text-left px-6 py-4 rounded-lg font-semibold transition-all transform ${
                    activeTab === 'messages'
                      ? 'bg-red-500 text-white shadow-lg scale-105'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <MessageSquare size={18} className="inline mr-2" />
                  Messages
                </button>
                <button
                  onClick={() => { setActiveTab('menu'); loadMenuItems(); }}
                  className={`w-full text-left px-6 py-4 rounded-lg font-semibold transition-all transform ${
                    activeTab === 'menu'
                      ? 'bg-red-500 text-white shadow-lg scale-105'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <UtensilsCrossed size={18} className="inline mr-2" />
                  Menu (plats)
                </button>
              </div>
            </div>

            <div className="md:w-3/4 p-8">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Vue d'ensemble</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                      <Calendar size={32} className="mb-4" />
                      <div className="text-3xl font-bold">{stats.totalReservations}</div>
                      <div className="text-blue-100">Total Réservations</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
                      <ShoppingCart size={32} className="mb-4" />
                      <div className="text-3xl font-bold">{stats.totalOrders}</div>
                      <div className="text-orange-100">Total Commandes</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                      <MessageSquare size={32} className="mb-4" />
                      <div className="text-3xl font-bold">{stats.totalMessages}</div>
                      <div className="text-green-100">Messages Reçus</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
                      <Clock size={32} className="mb-4" />
                      <div className="text-3xl font-bold">{stats.pendingReservations}</div>
                      <div className="text-yellow-100">Confirmé (En Attente)</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reservations' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">Gestion des Réservations</h2>
                    <button
                      onClick={() => {
                        setLoading(true);
                        loadReservations().finally(() => setLoading(false));
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-semibold flex items-center gap-2"
                      disabled={loading}
                    >
                      <Loader className={loading ? "animate-spin" : ""} size={16} />
                      Actualiser
                    </button>
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <button
                      onClick={() => setReservationFilter('all')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                        reservationFilter === 'all'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Toutes
                    </button>
                    <button
                      onClick={() => setReservationFilter('confirmed')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                        reservationFilter === 'confirmed'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Confirmé ({reservations.filter(r => r.status === 'confirmed').length})
                    </button>
                    <button
                      onClick={() => setReservationFilter('accepted')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm flex items-center gap-2 ${
                        reservationFilter === 'accepted'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <Clock size={16} />
                      Accepté - Historique ({reservations.filter(r => r.status === 'accepted').length})
                    </button>
                    <button
                      onClick={() => setReservationFilter('denied')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                        reservationFilter === 'denied'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Refusé ({reservations.filter(r => r.status === 'denied').length})
                    </button>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader className="animate-spin text-orange-500" size={32} />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                          <AlertCircle className="text-red-500 mt-0.5" size={20} />
                          <div className="flex-1">
                            <p className="text-red-800 font-semibold">Erreur</p>
                            <p className="text-red-600 text-sm mt-1">{error}</p>
                          </div>
                        </div>
                      )}
                      {!error && (() => {
                        // Filter reservations based on selected filter
                        // Note: Admin only sees confirmed, accepted, denied (not pending or cancelled by user)
                        let filteredReservations = reservations.filter(r => 
                          r.status === 'confirmed' || r.status === 'accepted' || r.status === 'denied'
                        );
                        
                        if (reservationFilter === 'confirmed') {
                          filteredReservations = reservations.filter(r => r.status === 'confirmed');
                        } else if (reservationFilter === 'accepted') {
                          filteredReservations = reservations.filter(r => r.status === 'accepted');
                        } else if (reservationFilter === 'denied') {
                          filteredReservations = reservations.filter(r => r.status === 'denied');
                        }

                        if (filteredReservations.length === 0) {
                          return (
                            <div className="text-center py-8">
                              <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                              <p className="text-gray-500 text-lg">
                                {reservationFilter === 'all' 
                                  ? 'Aucune réservation pour le moment'
                                  : reservationFilter === 'confirmed'
                                  ? 'Aucune réservation confirmée en attente'
                                  : reservationFilter === 'accepted'
                                  ? 'Aucune réservation acceptée'
                                  : 'Aucune réservation refusée'}
                              </p>
                            </div>
                          );
                        }

                        return filteredReservations.map((reservation) => {
                          // Get user info if populated
                          const userInfo = (reservation as any).user_id;
                          const userName = typeof userInfo === 'object' && userInfo 
                            ? `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() || userInfo.email
                            : 'Utilisateur';
                          const userEmail = typeof userInfo === 'object' && userInfo ? userInfo.email : '';
                          const tableType = (reservation as any).table_type || reservation.table_type_id || 'N/A';
                          
                          return (
                            <div key={reservation.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <div className="font-semibold text-lg">Réservation #{reservation.id?.slice(0, 8)}</div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    <strong>Client:</strong> {userName} {userEmail && `(${userEmail})`}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    <strong>Type:</strong> {tableType}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {reservation.reservation_date} • {reservation.start_time} - {reservation.end_time}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {reservation.num_people} personnes • {reservation.total_price} DT
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-4 ${
                                  reservation.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
                                  reservation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                  reservation.status === 'denied' ? 'bg-red-100 text-red-800' :
                                  reservation.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                                  reservation.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {reservation.status === 'confirmed' ? 'Confirmé' :
                                   reservation.status === 'accepted' ? 'Accepté' :
                                   reservation.status === 'denied' ? 'Refusé' :
                                   reservation.status === 'pending' ? 'En attente' :
                                   reservation.status === 'cancelled' ? 'Annulé' :
                                   reservation.status}
                                </span>
                              </div>
                              {/* Actions pour les réservations confirmées (en attente de décision admin) */}
                              {reservation.status === 'confirmed' && (
                                <div className="flex gap-2 mt-3">
                                  <button
                                    onClick={() => acceptReservation(reservation.id!)}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-semibold flex items-center gap-2"
                                  >
                                    <CheckCircle size={16} />
                                    Accepter
                                  </button>
                                  <button
                                    onClick={() => denyReservation(reservation.id!)}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold flex items-center gap-2"
                                  >
                                    <XCircle size={16} />
                                    Refuser
                                  </button>
                                </div>
                              )}
                              {/* Aucune action pour les réservations acceptées, refusées ou annulées */}
                              {(reservation.status === 'accepted' || reservation.status === 'denied' || reservation.status === 'cancelled') && (
                                <div className="mt-3 text-sm text-gray-500 italic">
                                  Aucune action disponible
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Gestion des Commandes</h2>
                  <div className="space-y-4">
                    {orders.length === 0 ? (
                      <p className="text-gray-500">Aucune commande pour le moment</p>
                    ) : (
                      orders.map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-semibold text-lg">Commande #{order.id?.slice(0, 8)}</div>
                              <div className="text-sm text-gray-600">
                                Type: {order.order_type === 'enligne' ? 'En ligne' : 'Sur place'}
                              </div>
                              <div className="text-sm text-gray-600">
                                Total: {order.total_price} DT
                              </div>
                              {order.delivery_address && (
                                <div className="text-sm text-gray-600">Adresse: {order.delivery_address}</div>
                              )}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="flex gap-2 mt-3">
                            {order.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateOrderStatus(order.id!, 'confirmed')}
                                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                                >
                                  Confirmer
                                </button>
                                <button
                                  onClick={() => updateOrderStatus(order.id!, 'ready')}
                                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                                >
                                  Prêt
                                </button>
                              </>
                            )}
                            {order.status === 'confirmed' && (
                              <button
                                onClick={() => updateOrderStatus(order.id!, 'ready')}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                              >
                                Marquer comme Prêt
                              </button>
                            )}
                            {order.status === 'ready' && (
                              <button
                                onClick={() => updateOrderStatus(order.id!, 'completed')}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                              >
                                Marquer comme Terminé
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'menu' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">Gestion du menu (plats)</h2>
                    <button
                      onClick={loadMenuItems}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-semibold flex items-center gap-2"
                      disabled={menuLoading}
                    >
                      <Loader className={menuLoading ? 'animate-spin' : ''} size={16} />
                      Actualiser
                    </button>
                  </div>
                  {menuError && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                      <AlertCircle className="text-red-500 mt-0.5" size={20} />
                      <p className="text-red-700">{menuError}</p>
                    </div>
                  )}
                  <form onSubmit={handleAddPlat} className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Plus size={20} />
                      Ajouter un plat
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                        <input
                          type="text"
                          value={menuForm.name}
                          onChange={(e) => setMenuForm(f => ({ ...f, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="ex. Salade Niçoise"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                        <select
                          value={menuForm.category}
                          onChange={(e) => setMenuForm(f => ({ ...f, category: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="appetizer">Entrée (appetizer)</option>
                          <option value="main">Plat principal (main)</option>
                          <option value="dessert">Dessert</option>
                          <option value="drink">Boisson (drink)</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={menuForm.description}
                        onChange={(e) => setMenuForm(f => ({ ...f, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Courte explication du plat..."
                        rows={2}
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prix (DT) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={menuForm.price}
                          onChange={(e) => setMenuForm(f => ({ ...f, price: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="12.00"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                        <div className="flex items-center gap-2">
                          <input
                            ref={menuImageInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={(e) => setMenuImage(e.target.files?.[0] || null)}
                            className="block w-full text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                          />
                          {menuImage && <span className="text-sm text-gray-600 truncate max-w-[140px]">{menuImage.name}</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">JPEG, PNG, GIF ou WebP. Max 5 Mo.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={menuForm.available}
                          onChange={(e) => setMenuForm(f => ({ ...f, available: e.target.checked }))}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Disponible</span>
                      </label>
                      <button
                        type="submit"
                        disabled={menuSubmitting || !menuForm.name.trim() || !menuForm.price}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
                      >
                        {menuSubmitting ? <Loader className="animate-spin" size={18} /> : <Plus size={18} />}
                        Ajouter le plat
                      </button>
                    </div>
                  </form>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Plats actuels</h3>
                    {menuLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader className="animate-spin text-orange-500" size={32} />
                      </div>
                    ) : menuItems.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                        <UtensilsCrossed className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-500">Aucun plat. Ajoutez-en avec le formulaire ci‑dessus.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {menuItems.map((item) =>
                          editingPlat?.id === item.id ? (
                            <form key={item.id} onSubmit={handleUpdatePlat} className="p-4 border-2 border-orange-200 rounded-xl bg-orange-50/50 space-y-4">
                              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Pencil size={18} />
                                Modifier « {item.name} »
                              </h4>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                                  <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                                  <select
                                    value={editForm.category}
                                    onChange={(e) => setEditForm(f => ({ ...f, category: e.target.value as 'appetizer' | 'main' | 'dessert' | 'drink' }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                  >
                                    <option value="appetizer">Entrée</option>
                                    <option value="main">Plat principal</option>
                                    <option value="dessert">Dessert</option>
                                    <option value="drink">Boisson</option>
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                  value={editForm.description}
                                  onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                  rows={2}
                                />
                              </div>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix (DT) *</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editForm.price}
                                    onChange={(e) => setEditForm(f => ({ ...f, price: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      ref={editImageInputRef}
                                      type="file"
                                      accept="image/jpeg,image/png,image/gif,image/webp"
                                      onChange={(e) => setEditImage(e.target.files?.[0] || null)}
                                      className="block w-full text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-700"
                                    />
                                    {editImage && <span className="text-sm text-gray-600 truncate max-w-[120px]">{editImage.name}</span>}
                                  </div>
                                  {item.image_path && (
                                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={editRemoveImage}
                                        onChange={(e) => setEditRemoveImage(e.target.checked)}
                                        className="rounded border-gray-300 text-orange-600"
                                      />
                                      <span className="text-sm text-gray-700">Supprimer l&apos;image actuelle</span>
                                    </label>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editForm.available}
                                    onChange={(e) => setEditForm(f => ({ ...f, available: e.target.checked }))}
                                    className="rounded border-gray-300 text-orange-600"
                                  />
                                  <span className="text-sm font-medium text-gray-700">Disponible</span>
                                </label>
                                <button
                                  type="submit"
                                  disabled={editSubmitting || !editForm.name.trim() || !editForm.price}
                                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold disabled:opacity-50 flex items-center gap-2"
                                >
                                  {editSubmitting ? <Loader className="animate-spin" size={18} /> : <Pencil size={18} />}
                                  Enregistrer
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                                >
                                  Annuler
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow">
                              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                                {item.image_path ? (
                                  <img
                                    src={`${getUploadsBaseUrl()}/uploads/${item.image_path}`}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon className="text-gray-400" size={24} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900">{item.name}</div>
                                <div className="text-sm text-gray-600">{item.description || '—'}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">{item.category}</span>
                                  <span className="font-semibold text-orange-600">{item.price} DT</span>
                                  {!item.available && <span className="text-xs text-red-600">Indisponible</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleEditPlat(item)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Modifier"
                                >
                                  <Pencil size={18} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePlat(item.id)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'messages' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">Messages de Contact</h2>
                    <button
                      onClick={() => {
                        setLoading(true);
                        loadMessages().finally(() => setLoading(false));
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-semibold flex items-center gap-2"
                      disabled={loading}
                    >
                      <Loader className={loading ? "animate-spin" : ""} size={16} />
                      Actualiser
                    </button>
                  </div>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader className="animate-spin text-orange-500" size={32} />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                          <AlertCircle className="text-red-500 mt-0.5" size={20} />
                          <div className="flex-1">
                            <p className="text-red-800 font-semibold">Erreur</p>
                            <p className="text-red-600 text-sm mt-1">{error}</p>
                          </div>
                        </div>
                      )}
                      {!error && messages.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
                          <p className="text-gray-500 text-lg">Aucun message pour le moment</p>
                        </div>
                      ) : (
                        messages.map((message) => {
                          const messageStatus = (message as any).status || 'new';
                          const isNew = messageStatus === 'new';
                          const isRead = messageStatus === 'read';
                          const isReplied = messageStatus === 'replied';
                          const isArchived = messageStatus === 'archived';

                          return (
                            <div 
                              key={message.id} 
                              className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                                isNew ? 'border-blue-300 bg-blue-50' :
                                isArchived ? 'border-gray-300 bg-gray-50' :
                                'border-gray-200 bg-white'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="font-semibold text-lg">{message.name}</div>
                                    {isNew && (
                                      <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full">
                                        Nouveau
                                      </span>
                                    )}
                                    {isReplied && (
                                      <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full">
                                        Répondu
                                      </span>
                                    )}
                                    {isArchived && (
                                      <span className="px-2 py-0.5 bg-gray-500 text-white text-xs font-semibold rounded-full">
                                        Archivé
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    <Mail size={14} className="inline mr-1" />
                                    {message.email}
                                  </div>
                                  {message.phone && (
                                    <div className="text-sm text-gray-600">Tél: {message.phone}</div>
                                  )}
                                  <div className="text-xs text-gray-500 mt-1">
                                    {message.created_at ? new Date(message.created_at).toLocaleString('fr-FR') : ''}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                                <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
                              </div>
                              <div className="flex gap-2 mt-3">
                                {isNew && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await contactMessageAPI.updateMessageStatus(message.id!, 'read');
                                        await loadMessages();
                                      } catch (err) {
                                        console.error('Error updating message status:', err);
                                        alert('Erreur lors de la mise à jour du statut');
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-semibold flex items-center gap-2"
                                  >
                                    <Mail size={14} />
                                    Marquer comme lu
                                  </button>
                                )}
                                {!isReplied && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await contactMessageAPI.updateMessageStatus(message.id!, 'replied');
                                        await loadMessages();
                                      } catch (err) {
                                        console.error('Error updating message status:', err);
                                        alert('Erreur lors de la mise à jour du statut');
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-semibold flex items-center gap-2"
                                  >
                                    <CheckCircle size={14} />
                                    Marquer comme répondu
                                  </button>
                                )}
                                {!isArchived && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await contactMessageAPI.updateMessageStatus(message.id!, 'archived');
                                        await loadMessages();
                                      } catch (err) {
                                        console.error('Error archiving message:', err);
                                        alert('Erreur lors de l\'archivage');
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-semibold flex items-center gap-2"
                                  >
                                    <Archive size={14} />
                                    Archiver
                                  </button>
                                )}
                                <button
                                  onClick={async () => {
                                    if (confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
                                      try {
                                        await contactMessageAPI.deleteMessage(message.id!);
                                        await loadMessages();
                                      } catch (err) {
                                        console.error('Error deleting message:', err);
                                        alert('Erreur lors de la suppression');
                                      }
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold flex items-center gap-2 ml-auto"
                                >
                                  <Trash2 size={14} />
                                  Supprimer
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
