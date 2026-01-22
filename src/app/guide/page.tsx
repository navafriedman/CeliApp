'use client';

import { useState, useEffect } from 'react';

type GlutenInfo = {
  id: string;
  name: string;
  category: string;
  status: string;
  description: string | null;
  tips: string | null;
};

const categories = [
  { value: 'all', label: 'All' },
  { value: 'grain', label: 'Grains' },
  { value: 'flour', label: 'Flours' },
  { value: 'sauce', label: 'Sauces' },
  { value: 'condiment', label: 'Condiments' },
  { value: 'additive', label: 'Additives' },
  { value: 'protein', label: 'Proteins' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'produce', label: 'Produce' },
  { value: 'snack', label: 'Snacks' },
  { value: 'beverage', label: 'Beverages' },
  { value: 'prepared food', label: 'Prepared Foods' },
  { value: 'sweets', label: 'Sweets' },
];

const statusStyles = {
  safe: {
    card: 'bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-200',
    badge: 'bg-gradient-to-r from-teal-400 to-emerald-400 text-white',
    icon: '✓',
  },
  unsafe: {
    card: 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200',
    badge: 'bg-gradient-to-r from-red-400 to-pink-400 text-white',
    icon: '✗',
  },
  check: {
    card: 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200',
    badge: 'bg-gradient-to-r from-amber-400 to-yellow-400 text-white',
    icon: '?',
  },
};

export default function GuidePage() {
  const [items, setItems] = useState<GlutenInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'grain',
    status: 'safe',
    description: '',
    tips: '',
  });

  useEffect(() => {
    seedAndFetch();
  }, []);

  const seedAndFetch = async () => {
    // Seed data if needed
    await fetch('/api/guide/seed', { method: 'POST' });
    fetchItems();
  };

  const fetchItems = async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category !== 'all') params.set('category', category);
    if (statusFilter !== 'all') params.set('status', statusFilter);

    const res = await fetch(`/api/guide?${params}`);
    const data = await res.json();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(fetchItems, 300);
      return () => clearTimeout(timer);
    }
  }, [search, category, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await fetch('/api/guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    setFormData({
      name: '',
      category: 'grain',
      status: 'safe',
      description: '',
      tips: '',
    });
    setShowForm(false);
    fetchItems();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-4xl animate-bounce">📚</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            Gluten Guide
          </h1>
          <p className="text-gray-500 mt-1">Quick reference for ingredients and foods</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`px-5 py-2.5 rounded-full font-semibold transition-all ${
            showForm
              ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50'
          }`}
        >
          {showForm ? 'Cancel' : '+ Add Item'}
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusStyles.safe.badge}`}>✓ Safe</span>
          <span className="text-sm text-gray-500">Naturally gluten-free</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusStyles.check.badge}`}>? Check</span>
          <span className="text-sm text-gray-500">Read label or ask</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusStyles.unsafe.badge}`}>✗ Unsafe</span>
          <span className="text-sm text-gray-500">Contains gluten</span>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-xl shadow-amber-500/10 border border-amber-100 mb-8">
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Chickpea flour"
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
              >
                {categories.slice(1).map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <div className="flex gap-2">
                {(['safe', 'check', 'unsafe'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({ ...formData, status })}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                      formData.status === status
                        ? statusStyles[status].badge + ' shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {statusStyles[status].icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description..."
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tips</label>
            <input
              type="text"
              value={formData.tips}
              onChange={(e) => setFormData({ ...formData, tips: e.target.value })}
              placeholder="Helpful tips..."
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white py-3 rounded-xl font-semibold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all"
          >
            Add to Guide
          </button>
        </form>
      )}

      {/* Search and filters */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ingredients..."
              className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
            >
              <option value="all">All Status</option>
              <option value="safe">Safe Only</option>
              <option value="check">Check Only</option>
              <option value="unsafe">Unsafe Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="text-6xl mb-4 animate-bounce">🔍</div>
          <p className="text-gray-500 text-lg">No items found matching your search.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const style = statusStyles[item.status as keyof typeof statusStyles];
            return (
              <div
                key={item.id}
                className={`card-pop p-5 rounded-2xl border-2 ${style.card}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-800 text-lg">{item.name}</h3>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${style.badge}`}>
                        {style.icon} {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                      <span className="text-xs text-gray-400 capitalize bg-white/50 px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                    )}
                    {item.tips && (
                      <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                        <span className="text-amber-500">💡</span> {item.tips}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick tips */}
      <div className="mt-8 relative overflow-hidden bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 rounded-3xl p-8 text-white">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

        <div className="relative">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="bounce-gentle">💪</span> Quick Tips for Staying Safe
          </h3>
          <ul className="space-y-3 text-white/90">
            <li className="flex items-start gap-2">
              <span className="text-white/70">•</span>
              <span><strong>Always read labels</strong> - ingredients can change</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-white/70">•</span>
              <span><strong>Watch for cross-contamination</strong> - shared fryers, toasters, cutting boards</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-white/70">•</span>
              <span><strong>&quot;Wheat-free&quot; ≠ Gluten-free</strong> - may contain barley or rye</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-white/70">•</span>
              <span><strong>Ask questions at restaurants</strong> - how food is prepared matters</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-white/70">•</span>
              <span><strong>When in doubt, go without</strong> - better safe than sick</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
