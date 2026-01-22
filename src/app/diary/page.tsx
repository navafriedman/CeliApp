'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
    setEntries(data);
    setLoading(false);
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
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-amber-800">Food Diary</h1>
          <p className="text-gray-600 mt-1">Track your meals and how they make you feel</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Entry'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-amber-200 mb-8">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
              <select
                value={formData.mealType}
                onChange={(e) => setFormData({ ...formData, mealType: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                {mealTypes.map((meal) => (
                  <option key={meal} value={meal}>
                    {meal.charAt(0).toUpperCase() + meal.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">What did you eat?</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Grilled chicken with rice and vegetables"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients (optional)</label>
            <input
              type="text"
              value={formData.ingredients}
              onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
              placeholder="e.g., chicken, rice, broccoli, olive oil"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Safe for you?</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={formData.isSafe}
                    onChange={() => setFormData({ ...formData, isSafe: true })}
                    className="mr-2"
                  />
                  <span className="text-green-600">✓ Safe</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!formData.isSafe}
                    onChange={() => setFormData({ ...formData, isSafe: false })}
                    className="mr-2"
                  />
                  <span className="text-red-600">✗ Not Safe</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className={`text-2xl ${formData.rating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">How did you feel? (optional)</label>
            <textarea
              value={formData.reaction}
              onChange={(e) => setFormData({ ...formData, reaction: e.target.value })}
              placeholder="Any symptoms, energy levels, or how you felt after eating..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              rows={2}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Where you ate, who made it, brand names, etc."
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              rows={2}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            Save Entry
          </button>
        </form>
      )}

      {entries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-amber-200">
          <div className="text-4xl mb-4">📔</div>
          <p className="text-gray-600 mb-4">No entries yet. Start tracking your meals!</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-amber-600 hover:text-amber-700 font-medium"
          >
            Add your first entry →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={`bg-white p-4 rounded-xl border-2 ${
                entry.isSafe ? 'border-green-200' : 'border-red-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getMealIcon(entry.mealType)}</span>
                    <span className="font-medium text-gray-800">{entry.description}</span>
                    {!entry.isSafe && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                        Not Safe
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(entry.date)} • {entry.mealType}
                    {entry.rating && (
                      <span className="ml-2">
                        {'★'.repeat(entry.rating)}{'☆'.repeat(5 - entry.rating)}
                      </span>
                    )}
                  </div>
                  {entry.ingredients && (
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Ingredients:</span> {entry.ingredients}
                    </p>
                  )}
                  {entry.reaction && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Reaction:</span> {entry.reaction}
                    </p>
                  )}
                  {entry.notes && (
                    <p className="text-sm text-gray-500 mt-1 italic">{entry.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-gray-400 hover:text-red-500 ml-2"
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
