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

const statusColors = {
  safe: 'bg-green-100 border-green-300 text-green-800',
  unsafe: 'bg-red-100 border-red-300 text-red-800',
  check: 'bg-yellow-100 border-yellow-300 text-yellow-800',
};

const statusLabels = {
  safe: '✓ Safe',
  unsafe: '✗ Unsafe',
  check: '? Check',
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
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-amber-800">Gluten Guide</h1>
          <p className="text-gray-600 mt-1">Quick reference for ingredients and foods</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Item'}
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white rounded-xl border border-amber-200">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-sm ${statusColors.safe}`}>✓ Safe</span>
          <span className="text-sm text-gray-600">Naturally gluten-free</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-sm ${statusColors.check}`}>? Check</span>
          <span className="text-sm text-gray-600">Read label or ask</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-sm ${statusColors.unsafe}`}>✗ Unsafe</span>
          <span className="text-sm text-gray-600">Contains gluten</span>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-amber-200 mb-8">
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Chickpea flour"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                {categories.slice(1).map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="safe">Safe</option>
                <option value="check">Check</option>
                <option value="unsafe">Unsafe</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tips</label>
            <input
              type="text"
              value={formData.tips}
              onChange={(e) => setFormData({ ...formData, tips: e.target.value })}
              placeholder="Helpful tips..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            Add to Guide
          </button>
        </form>
      )}

      {/* Search and filters */}
      <div className="bg-white p-4 rounded-xl border border-amber-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ingredients..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
        <div className="text-center py-12 bg-white rounded-xl border border-amber-200">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-600">No items found matching your search.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border-2 ${statusColors[item.status as keyof typeof statusColors]}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${statusColors[item.status as keyof typeof statusColors]}`}>
                      {statusLabels[item.status as keyof typeof statusLabels]}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">{item.category}</span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                  {item.tips && (
                    <p className="text-sm text-gray-500 mt-1 italic">💡 {item.tips}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick tips */}
      <div className="mt-8 p-6 bg-white rounded-xl border border-amber-200">
        <h3 className="text-lg font-semibold text-amber-800 mb-4">Quick Tips for Staying Safe</h3>
        <ul className="space-y-2 text-gray-600">
          <li>• <strong>Always read labels</strong> - ingredients can change</li>
          <li>• <strong>Watch for cross-contamination</strong> - shared fryers, toasters, cutting boards</li>
          <li>• <strong>&quot;Wheat-free&quot; ≠ Gluten-free</strong> - may contain barley or rye</li>
          <li>• <strong>Ask questions at restaurants</strong> - how food is prepared matters</li>
          <li>• <strong>When in doubt, go without</strong> - better safe than sick</li>
        </ul>
      </div>
    </div>
  );
}
