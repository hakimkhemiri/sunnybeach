import { useEffect, useState } from 'react';
import { Utensils, Loader2 } from 'lucide-react';
import { foodAPI, getUploadsBaseUrl } from '../lib/api';
import { FoodItem } from '../types';

interface HomeMenuProps {
  onSeeAll?: () => void;
}

export function HomeMenu({ onSeeAll }: HomeMenuProps) {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const previewItems = foodItems.slice(0, 6);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const items = await foodAPI.getFoodItems();
        const availableItems = (items || []).filter((item: FoodItem) => item.available);
        setFoodItems(availableItems);
      } catch (err) {
        setError('Impossible de charger le menu pour le moment.');
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, []);

  return (
    <section id="menu" className="py-20 bg-gradient-to-b from-white to-orange-50/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Utensils className="text-orange-500" size={38} />
            <span>Notre Menu</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Découvrez nos plats et boissons disponibles aujourd&apos;hui.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-orange-500" size={34} />
          </div>
        )}

        {!loading && error && (
          <div className="max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
            {error}
          </div>
        )}

        {!loading && !error && foodItems.length === 0 && (
          <div className="max-w-2xl mx-auto p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-center">
            Aucun article de menu disponible pour le moment.
          </div>
        )}

        {!loading && !error && foodItems.length > 0 && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {previewItems.map((item) => (
              <article key={item.id} className="bg-white rounded-2xl shadow-md border border-orange-100 overflow-hidden hover:shadow-xl transition-shadow">
                <div className="h-48 bg-gray-100">
                  {item.image_path ? (
                    <img
                      src={`${getUploadsBaseUrl()}/uploads/${item.image_path}`}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-bold">
                      {item.name.slice(0, 1)}
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">{item.name}</h3>
                    <span className="text-orange-600 font-extrabold whitespace-nowrap">{item.price} DT</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                    {item.category}
                  </span>
                </div>
              </article>
              ))}
            </div>

            {foodItems.length > 6 && (
              <div className="mt-8 text-center">
                <button
                  onClick={onSeeAll}
                  className="px-8 py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-black transition-all"
                >
                  Voir tout le menu
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}