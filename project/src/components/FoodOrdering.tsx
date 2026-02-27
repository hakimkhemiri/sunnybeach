import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { foodAPI, ordersAPI, reservationAPI, getUploadsBaseUrl } from '../lib/api';
import { FoodItem, Reservation } from '../types';
import { ShoppingCart, Loader, CheckCircle, Umbrella, Home, ArrowLeft, ClipboardList, X } from 'lucide-react';

interface FoodOrderingProps {
  reservationId?: string;
}

export function FoodOrdering({ reservationId }: FoodOrderingProps) {
  const { user } = useAuth();
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [cart, setCart] = useState<Map<string, { item: FoodItem; quantity: number }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [existingOrders, setExistingOrders] = useState<Record<string, any[]>>({});
  const [viewingOrdersFor, setViewingOrdersFor] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadReservations();
    loadFoodItems();
  }, [user]);

  useEffect(() => {
    if (user) loadMyOrders();
  }, [user]);

  // If a reservationId was passed as prop, auto-select it
  useEffect(() => {
    if (reservationId && reservations.length > 0) {
      const found = reservations.find(r => r.id === reservationId);
      if (found) setSelectedReservation(found);
    }
  }, [reservationId, reservations]);

  const loadFoodItems = async () => {
    try {
      const data = await foodAPI.getFoodItems();
      setFoodItems(data || []);
    } catch (err) {
      setError('Erreur lors du chargement du menu');
      console.error('Error loading food items:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReservations = async () => {
    if (!user) return;
    try {
      const list = await reservationAPI.getMyReservations();
      const arr = Array.isArray(list) ? list : [];

      // Only accepted reservations with date >= today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const valid = arr.filter((r: any) => {
        if (r.status !== 'accepted') return false;
        const rDate = new Date(r.reservation_date);
        rDate.setHours(0, 0, 0, 0);
        return rDate >= today;
      });

      const sorted = [...valid].sort((a: any, b: any) => {
        return new Date(a.reservation_date).getTime() - new Date(b.reservation_date).getTime();
      });
      setReservations(sorted);
    } catch (err) {
      console.error('Error loading reservations:', err);
    }
  };

  const loadMyOrders = async () => {
    if (!user) return;
    try {
      const orders = await ordersAPI.getMyOrders();
      // Group orders by reservation_id
      const grouped: Record<string, any[]> = {};
      for (const order of orders) {
        const resId = order.reservation_id;
        if (!resId) continue;
        if (!grouped[resId]) grouped[resId] = [];
        grouped[resId].push(order);
      }
      setExistingOrders(grouped);
    } catch (err) {
      console.error('Error loading my orders:', err);
    }
  };

  const getTableTypeIcon = (type: string) => {
    if (type === 'Parasol' || type === 'parasol') return '☂️';
    if (type === 'Mini Cabane' || type === 'mini cabane') return '🏠';
    if (type === 'Cabane' || type === 'cabane') return '🏡';
    return '🪑';
  };

  const addToCart = (item: FoodItem) => {
    const newCart = new Map(cart);
    const existing = newCart.get(item.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      newCart.set(item.id, { item, quantity: 1 });
    }
    setCart(newCart);
  };

  const removeFromCart = (itemId: string) => {
    const newCart = new Map(cart);
    newCart.delete(itemId);
    setCart(newCart);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    const newCart = new Map(cart);
    if (quantity <= 0) {
      newCart.delete(itemId);
    } else {
      const item = newCart.get(itemId);
      if (item) item.quantity = quantity;
    }
    setCart(newCart);
  };

  const getTotalPrice = () => {
    let total = 0;
    cart.forEach(({ item, quantity }) => {
      total += item.price * quantity;
    });
    return total;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSubmitting(true);

    try {
      if (cart.size === 0) {
        throw new Error('Votre panier est vide');
      }

      if (!selectedReservation?.id) {
        throw new Error('Veuillez sélectionner une réservation');
      }

      const items = Array.from(cart.entries()).map(([_, { item, quantity }]) => ({
        food_item_id: item.id,
        quantity,
        unit_price: item.price,
      }));

      await ordersAPI.createOrder({
        reservation_id: selectedReservation.id,
        items,
      });

      setSuccess(true);
      setCart(new Map());
      setSelectedReservation(null);
      loadMyOrders();

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la commande');
      console.error('Error creating food order:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Commande confirmée!</h3>
        <p className="text-gray-600 mb-4">
          Votre commande a été créée avec succès. Elle sera préparée pour votre réservation.
        </p>
      </div>
    );
  }

  // Step 1: Select a reservation
  if (!selectedReservation) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center space-x-3">
          <ShoppingCart size={32} className="text-orange-500" />
          <span>Commander</span>
        </h2>
        <p className="text-gray-600 mb-8">
          Sélectionnez votre réservation pour commander à manger
        </p>

        {reservations.length === 0 ? (
          <div className="text-center py-12">
            <Umbrella className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">Aucune réservation acceptée</p>
            <p className="text-gray-400 text-sm">
              Vous devez avoir une réservation acceptée (aujourd'hui ou à venir) pour passer commande.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {reservations.map(res => {
              const tableType = (res as any).table_type || res.table_type_id || 'N/A';
              const resOrders = existingOrders[res.id!] || [];
              const hasOrders = resOrders.length > 0;
              return (
                <div key={res.id} className="relative">
                  <button
                    onClick={() => setSelectedReservation(res)}
                    className="w-full p-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl border-2 border-orange-200 hover:border-orange-500 transition-all transform hover:scale-105 text-left group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{getTableTypeIcon(tableType)}</span>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                          {tableType}
                        </h3>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          Acceptée
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>📅 {res.reservation_date}</div>
                      <div>👥 {res.num_people} personnes</div>
                      <div>💰 {res.total_price} DT</div>
                    </div>
                  </button>

                  {/* Existing orders icon */}
                  {hasOrders && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingOrdersFor(viewingOrdersFor === res.id ? null : res.id!);
                      }}
                      className="absolute top-3 right-3 bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-orange-600 transition-colors z-10"
                      title="Voir les commandes existantes"
                    >
                      <ClipboardList size={16} />
                    </button>
                  )}

                  {/* Orders popup */}
                  {viewingOrdersFor === res.id && hasOrders && (
                    <div className="absolute top-12 right-0 z-20 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 animate-in fade-in">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-gray-900 text-sm">Commandes existantes</h4>
                        <button
                          onClick={(e) => { e.stopPropagation(); setViewingOrdersFor(null); }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {resOrders.map((order: any) => {
                          const statusLabels: Record<string, string> = {
                            pending: 'En attente',
                            confirmed: 'Confirmée',
                            ready: 'Prête',
                            completed: 'Terminée',
                          };
                          const statusColors: Record<string, string> = {
                            pending: 'bg-yellow-100 text-yellow-800',
                            confirmed: 'bg-blue-100 text-blue-800',
                            ready: 'bg-green-100 text-green-800',
                            completed: 'bg-gray-100 text-gray-600',
                          };
                          return (
                            <div key={order.id} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-gray-500">#{order.id?.slice(0, 8)}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                                  {statusLabels[order.status] || order.status}
                                </span>
                              </div>
                              <div className="space-y-1">
                                {(order.items || []).map((it: any, idx: number) => (
                                  <div key={idx} className="flex justify-between text-xs text-gray-700">
                                    <span>{it.quantity}x {it.name}</span>
                                    <span className="font-semibold">{it.subtotal?.toFixed(2)} DT</span>
                                  </div>
                                ))}
                              </div>
                              <div className="border-t border-gray-200 mt-2 pt-1 flex justify-between text-xs font-bold text-orange-600">
                                <span>Total</span>
                                <span>{order.total_price?.toFixed(2)} DT</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Step 2: Menu & cart
  const selectedTableType = (selectedReservation as any).table_type || selectedReservation.table_type_id || 'N/A';

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <ShoppingCart size={32} className="text-orange-500" />
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Commander</h2>
            <p className="text-sm text-gray-500">
              {getTableTypeIcon(selectedTableType)} {selectedTableType} — {selectedReservation.reservation_date} — {selectedReservation.num_people} pers.
            </p>
          </div>
        </div>
        <button
          onClick={() => { setSelectedReservation(null); setCart(new Map()); }}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Changer
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-6">Menu</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {foodItems.map(item => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow flex gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                  {item.image_path ? (
                    <img
                      src={`${getUploadsBaseUrl()}/uploads/${item.image_path}`}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-bold">{item.name.slice(0, 1)}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-gray-900">{item.name}</h4>
                    <span className="text-lg font-bold text-orange-600">{item.price} DT</span>
                  </div>
                  <p className="text-sm text-gray-600">{item.description}</p>
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full mt-2">
                    {item.category}
                  </span>

                  {cart.has(item.id) ? (
                    <div className="flex items-center justify-between mt-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, (cart.get(item.id)?.quantity || 1) - 1)}
                        className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="font-semibold">{cart.get(item.id)?.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, (cart.get(item.id)?.quantity || 1) + 1)}
                        className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Retirer
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addToCart(item)}
                      className="w-full mt-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                    >
                      Ajouter au panier
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t-2 pt-6">
          <div className="bg-orange-50 rounded-lg p-6 mb-6">
            <div className="space-y-2 mb-4">
              {Array.from(cart.entries()).map(([itemId, { item, quantity }]) => (
                <div key={itemId} className="flex justify-between">
                  <span>{quantity}x {item.name}</span>
                  <span className="font-semibold">{(item.price * quantity).toFixed(2)} DT</span>
                </div>
              ))}
            </div>
            <div className="border-t-2 pt-4">
              <div className="flex justify-between text-2xl font-bold text-orange-600">
                <span>Total:</span>
                <span>{getTotalPrice().toFixed(2)} DT</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || cart.size === 0}
            className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center justify-center text-lg"
          >
            {submitting ? (
              <>
                <Loader className="animate-spin mr-2" size={20} />
                Traitement...
              </>
            ) : (
              `Confirmer la commande - ${getTotalPrice().toFixed(2)} DT`
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
