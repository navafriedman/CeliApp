'use client';

import { useState, useEffect, useRef } from 'react';

type FoodEntry = {
  id: string;
  date: string;
  mealType: string;
  description: string;
  ingredients: string;
  isSafe: boolean;
  notes: string | null;
  reaction: string | null;
  rating: number | null;
};

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function DiaryPage() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    mealType: 'lunch',
    description: '',
    ingredients: '',
    isSafe: true,
    notes: '',
    reaction: '',
    rating: 0,
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    const res = await fetch('/api/diary');
    const data = await res.json();
    if (Array.isArray(data)) {
      setEntries(data);
    } else {
      setEntries([]);
    }
    setLoading(false);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImagePreview(base64);

      // Analyze the image
      setAnalyzing(true);
      try {
        const res = await fetch('/api/analyze-food', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 }),
        });

        const data = await res.json();

        if (data.error) {
          alert('Could not analyze image: ' + data.error);
        } else {
          // Pre-fill the form with AI suggestions
          setFormData(prev => ({
            ...prev,
            description: data.description || prev.description,
            ingredients: data.ingredients || prev.ingredients,
            isSafe: data.isSafe ?? prev.isSafe,
            notes: data.notes ? `AI Note: ${data.notes}` : prev.notes,
          }));
        }
      } catch (err) {
        console.error('Analysis error:', err);
        alert('Failed to analyze image');
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await fetch('/api/diary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    setFormData({
      mealType: 'lunch',
      description: '',
      ingredients: '',
      isSafe: true,
      notes: '',
      reaction: '',
      rating: 0,
      date: new Date().toISOString().split('T')[0],
    });
    setImagePreview(null);
    setShowForm(false);
    fetchEntries();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return;

    await fetch(`/api/diary/${id}`, { method: 'DELETE' });
    fetchEntries();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getMealIcon = (meal: string) => {
    const icons: Record<string, string> = {
      breakfast: '🌅',
      lunch: '☀️',
      dinner: '🌙',
      snack: '🍎',
    };
    return icons[meal] || '🍽️';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-4xl animate-bounce">📔</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">
            Food Diary
          </h1>
          <p className="text-gray-500 mt-1">Track your meals and how they make you feel</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`px-5 py-2.5 rounded-full font-semibold transition-all ${
            showForm
              ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              : 'bg-gradient-to-r from-teal-400 to-emerald-400 text-white shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50'
          }`}
        >
          {showForm ? 'Cancel' : '+ Add Entry'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-xl shadow-teal-500/10 border border-teal-100 mb-8">

          {/* Photo Upload Section */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📸 Snap a photo of your food
            </label>

            {!imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-teal-200 rounded-2xl p-8 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/50 transition-all"
              >
                <div className="text-4xl mb-2">📷</div>
                <p className="text-gray-500 text-sm">Tap to take a photo or upload an image</p>
                <p className="text-gray-400 text-xs mt-1">AI will guess what you&apos;re eating!</p>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Food preview"
                  className="w-full h-48 object-cover rounded-2xl"
                />
                {analyzing && (
                  <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="text-3xl animate-pulse mb-2">🔍</div>
                      <p className="text-sm">Analyzing your food...</p>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-600 rounded-full p-2 shadow-md transition-all"
                >
                  ✕
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Meal Type</label>
              <select
                value={formData.mealType}
                onChange={(e) => setFormData({ ...formData, mealType: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
              >
                {mealTypes.map((meal) => (
                  <option key={meal} value={meal}>
                    {getMealIcon(meal)} {meal.charAt(0).toUpperCase() + meal.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              What did you eat?
              {imagePreview && !analyzing && (
                <span className="text-teal-500 font-normal ml-2">✨ AI-suggested - edit if needed</span>
              )}
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Grilled chicken with rice and vegetables"
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ingredients (optional)
              {imagePreview && !analyzing && formData.ingredients && (
                <span className="text-teal-500 font-normal ml-2">✨ AI-suggested</span>
              )}
            </label>
            <input
              type="text"
              value={formData.ingredients}
              onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
              placeholder="e.g., chicken, rice, broccoli, olive oil"
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Safe for you?
                {imagePreview && !analyzing && (
                  <span className="text-teal-500 font-normal ml-2">✨ AI-suggested</span>
                )}
              </label>
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isSafe: true })}
                  className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                    formData.isSafe
                      ? 'bg-gradient-to-r from-teal-400 to-emerald-400 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ✓ Safe
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isSafe: false })}
                  className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                    !formData.isSafe
                      ? 'bg-gradient-to-r from-red-400 to-pink-400 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ✗ Not Safe
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className={`text-3xl transition-transform hover:scale-110 ${
                      formData.rating >= star ? 'text-amber-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">How did you feel? (optional)</label>
            <textarea
              value={formData.reaction}
              onChange={(e) => setFormData({ ...formData, reaction: e.target.value })}
              placeholder="Any symptoms, energy levels, or how you felt after eating..."
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
              rows={2}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes (optional)
              {imagePreview && !analyzing && formData.notes && (
                <span className="text-teal-500 font-normal ml-2">✨ AI note included</span>
              )}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Where you ate, who made it, brand names, etc."
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
              rows={2}
            />
          </div>

          <button
            type="submit"
            disabled={analyzing}
            className="w-full bg-gradient-to-r from-teal-400 to-emerald-400 text-white py-3 rounded-xl font-semibold shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transition-all disabled:opacity-50"
          >
            {analyzing ? 'Analyzing...' : 'Save Entry'}
          </button>
        </form>
      )}

      {/* Entries List */}
      {entries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="text-6xl mb-4 animate-bounce">📔</div>
          <p className="text-gray-500 mb-4 text-lg">No entries yet. Start tracking your meals!</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-teal-500 hover:text-teal-600 font-semibold text-lg"
          >
            Add your first entry →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={`card-pop bg-white p-5 rounded-2xl border-2 transition-all ${
                entry.isSafe
                  ? 'border-teal-200 hover:border-teal-300'
                  : 'border-red-200 hover:border-red-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getMealIcon(entry.mealType)}</span>
                    <span className="font-semibold text-gray-800 text-lg">{entry.description}</span>
                    {!entry.isSafe && (
                      <span className="text-xs bg-gradient-to-r from-red-400 to-pink-400 text-white px-2.5 py-1 rounded-full font-medium">
                        Not Safe
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400 flex items-center gap-2">
                    <span>{formatDate(entry.date)}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span className="capitalize">{entry.mealType}</span>
                    {entry.rating && (
                      <>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className="text-amber-400">
                          {'★'.repeat(entry.rating)}
                          <span className="text-gray-300">{'★'.repeat(5 - entry.rating)}</span>
                        </span>
                      </>
                    )}
                  </div>
                  {entry.ingredients && (
                    <p className="text-sm text-gray-500 mt-3 bg-gray-50 px-3 py-2 rounded-lg">
                      <span className="font-medium text-gray-600">Ingredients:</span> {entry.ingredients}
                    </p>
                  )}
                  {entry.reaction && (
                    <p className="text-sm text-gray-500 mt-2">
                      <span className="font-medium text-gray-600">Reaction:</span> {entry.reaction}
                    </p>
                  )}
                  {entry.notes && (
                    <p className="text-sm text-gray-400 mt-2 italic">{entry.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-gray-300 hover:text-red-400 ml-4 text-xl transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
