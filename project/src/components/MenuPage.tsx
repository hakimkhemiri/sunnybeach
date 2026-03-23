import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, UtensilsCrossed, Loader2 } from 'lucide-react';
import { foodAPI, getUploadsBaseUrl } from '../lib/api';
import { FoodItem } from '../types';

type SortOption = 'name-asc' | 'price-asc' | 'price-desc';

export function MenuPage() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');

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

  const categories = useMemo(() => {
    const unique = Array.from(new Set(foodItems.map((item) => item.category).filter(Boolean)));
    return ['all', ...unique];
  }, [foodItems]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const byFilter = foodItems.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.description.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });

    const sorted = [...byFilter].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return a.name.localeCompare(b.name, 'fr');
    });

    return sorted;
  }, [foodItems, searchTerm, selectedCategory, sortBy]);

  return (
    <section className="min-h-screen pt-28 pb-20 bg-[radial-gradient(circle_at_top_right,_rgba(251,146,60,0.18),_transparent_45%),linear-gradient(to_bottom,_#fff7ed,_#ffffff)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.25em] text-orange-600 font-semibold mb-2">Sunny Beach</p>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900">Tout le Menu</h1>
          <p className="text-gray-600 mt-3 text-lg max-w-3xl">
            Explorez tous nos plats et boissons. Utilisez les filtres pour trouver rapidement ce que vous cherchez.
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur rounded-2xl border border-orange-100 shadow-lg p-4 sm:p-6 mb-8">
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                type="text"
                placeholder="Rechercher un plat, une boisson..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none"
              />
            </div>

            <div className="relative">
              <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none bg-white"
              >
                <option value="name-asc">Tri: Nom (A-Z)</option>
                <option value="price-asc">Tri: Prix croissant</option>
                <option value="price-desc">Tri: Prix décroissant</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map((category) => {
              const isActive = selectedCategory === category;
              const label = category === 'all' ? 'Tous' : category;

              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-orange-500 text-white shadow'
                      : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-orange-500" size={34} />
          </div>
        )}

        {!loading && error && (
          <div className="max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
            {error}
          </div>
        )}

        {!loading && !error && filteredItems.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow p-10 text-center">
            <UtensilsCrossed className="mx-auto text-gray-400 mb-4" size={42} />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun résultat</h2>
            <p className="text-gray-600">Essayez une autre recherche ou une autre catégorie.</p>
          </div>
        )}

        {!loading && !error && filteredItems.length > 0 && (
          <>
            <div className="mb-4 text-sm text-gray-600 font-medium">
              {filteredItems.length} article{filteredItems.length > 1 ? 's' : ''} trouvé{filteredItems.length > 1 ? 's' : ''}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <article key={item.id} className="group bg-white rounded-2xl border border-orange-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden">
                  <div className="h-52 bg-gray-100 overflow-hidden">
                    {item.image_path ? (
                      <img
                        src={`${getUploadsBaseUrl()}/uploads/${item.image_path}`}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-5xl font-bold">
                        {item.name.slice(0, 1)}
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                      <span className="text-orange-600 text-lg font-extrabold whitespace-nowrap">{item.price} DT</span>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed mb-4 min-h-[56px]">{item.description}</p>

                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                      {item.category}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}