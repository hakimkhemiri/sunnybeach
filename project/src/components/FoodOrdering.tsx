import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FoodItem, Reservation, FoodOrder, FoodOrderItem } from '../types';
import { ShoppingCart, Loader, CheckCircle, MapPin, Truck } from 'lucide-react';

interface FoodOrderingProps {
  reservationId?: string;
}

export function FoodOrdering({ reservationId }: FoodOrderingProps) {
  const { user } = useAuth();
  const [orderType, setOrderType] = useState<'enligne' | 'sur_place' | null>(null);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState(reservationId || '');
  const [cart, setCart] = useState<Map<string, { item: FoodItem; quantity: number }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');

  useEffect(() => {
    loadFoodItems();
    if (!reservationId) {
      loadReservations();
    }
  }, []);

  const loadFoodItems = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('food_items')
        .select('*')
        .eq('available', true);

      if (fetchError) throw fetchError;
      setFoodItems(data || []);
    } catch (err) {
      setError('Erreur lors du chargement du menu');
      console.error('Error loading food items:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReservations = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'confirmed');

      if (fetchError) throw fetchError;
      setReservations(data || []);
    } catch (err) {
      console.error('Error loading reservations:', err);
    }
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

      if (!orderType) {
        throw new Error('Veuillez sélectionner le type de commande');
      }

      if (orderType === 'sur_place' && !selectedReservation) {
        throw new Error('Veuillez sélectionner une réservation');
      }

      if (orderType === 'enligne' && !deliveryAddress) {
        throw new Error('Veuillez entrer votre adresse de livraison');
      }

      const totalPrice = getTotalPrice();

      const foodOrder: FoodOrder = {
        user_id: user!.id,
        reservation_id: orderType === 'sur_place' ? selectedReservation : undefined,
        order_type: orderType,
        total_price: totalPrice,
        status: 'pending',
        delivery_address: orderType === 'enligne' ? deliveryAddress : undefined,
      };

      const { data: orderData, error: orderError } = await supabase
        .from('food_orders')
        .insert([foodOrder])
        .select('id');

      if (orderError) throw orderError;

      const orderId = orderData?.[0]?.id;

      const orderItems: FoodOrderItem[] = Array.from(cart.entries()).map(
        ([_, { item, quantity }]) => ({
          food_order_id: orderId,
          food_item_id: item.id,
          quantity,
          unit_price: item.price,
        })
      );

      const { error: itemsError } = await supabase
        .from('food_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      setSuccess(true);
      setCart(new Map());
      setOrderType(null);
      setDeliveryAddress('');
      setSelectedReservation('');

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
          Votre commande a été créée avec succès. Nous vous contacterons bientôt.
        </p>
      </div>
    );
  }

  if (!orderType) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center space-x-3">
          <ShoppingCart size={32} className="text-orange-500" />
          <span>Commander</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => setOrderType('sur_place')}
            className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-300 hover:border-blue-500 transition-all transform hover:scale-105 text-center"
          >
            <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Sur Place</h3>
            <p className="text-gray-600">
              Manger au restaurant avec votre réservation
            </p>
          </button>

          <button
            onClick={() => setOrderType('enligne')}
            className="p-8 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border-2 border-orange-300 hover:border-orange-500 transition-all transform hover:scale-105 text-center"
          >
            <Truck className="w-12 h-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">En Ligne</h3>
            <p className="text-gray-600">
              Commander et vous faire livrer
            </p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <ShoppingCart size={32} className="text-orange-500" />
          <span className="text-3xl font-bold text-gray-900">
            {orderType === 'sur_place' ? 'Commande - Sur Place' : 'Commande - En Ligne'}
          </span>
        </div>
        <button
          onClick={() => setOrderType(null)}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 font-semibold"
        >
          Changer
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="space-y-6">
        {orderType === 'sur_place' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionnez une réservation *
            </label>
            <select
              value={selectedReservation}
              onChange={(e) => setSelectedReservation(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              required
            >
              <option value="">Choisir une réservation</option>
              {reservations.map(res => (
                <option key={res.id} value={res.id || ''}>
                  {res.reservation_date} - {res.start_time} à {res.end_time} ({res.num_people} personnes)
                </option>
              ))}
            </select>
            {reservations.length === 0 && (
              <p className="text-orange-600 text-sm mt-2">
                Vous n'avez pas de réservation. Veuillez d'abord réserver une table.
              </p>
            )}
          </div>
        )}

        {orderType === 'enligne' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse de livraison *
            </label>
            <input
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              placeholder="123 Rue de l'Exemple"
              required
            />
          </div>
        )}

        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-6">Menu</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {foodItems.map(item => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  </div>
                  <span className="text-lg font-bold text-orange-600">{item.price} DT</span>
                </div>
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full mb-4">
                  {item.category}
                </span>

                {cart.has(item.id) ? (
                  <div className="flex items-center justify-between">
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
                    className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                  >
                    Ajouter au panier
                  </button>
                )}
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
