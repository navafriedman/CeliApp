'use client';

import { useState, useEffect } from 'react';

type Dish = {
  id: string;
  name: string;
  description: string | null;
  isSafe: boolean;
  notes: string | null;
  rating: number | null;
};

type Restaurant = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  cuisineType: string | null;
  glutenFreeMenu: boolean;
  safetyRating: number | null;
  notes: string | null;
  lastVisited: string | null;
  dishes: Dish[];
};

const cuisineTypes = [
  'American', 'Italian', 'Mexican', 'Chinese', 'Japanese', 'Thai', 'Indian',
  'Mediterranean', 'French', 'Korean', 'Vietnamese', 'Greek', 'Other'
];

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [newDish, setNewDish] = useState({ name: '', description: '', isSafe: true, notes: '', rating: 0 });
  const [showDishForm, setShowDishForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    website: '',
    cuisineType: '',
    glutenFreeMenu: false,
    safetyRating: 0,
    notes: '',
    lastVisited: '',
  });

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    const res = await fetch('/api/restaurants');
    const data = await res.json();
    setRestaurants(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await fetch('/api/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        safetyRating: formData.safetyRating || null,
      }),
    });

    setFormData({
      name: '',
      address: '',
      phone: '',
      website: '',
      cuisineType: '',
      glutenFreeMenu: false,
      safetyRating: 0,
      notes: '',
      lastVisited: '',
    });
    setShowForm(false);
    fetchRestaurants();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this restaurant and all its dishes?')) return;
    await fetch(`/api/restaurants/${id}`, { method: 'DELETE' });
    setSelectedRestaurant(null);
    fetchRestaurants();
  };

  const addDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurant) return;

    await fetch(`/api/restaurants/${selectedRestaurant.id}/dishes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDish),
    });

    setNewDish({ name: '', description: '', isSafe: true, notes: '', rating: 0 });
    setShowDishForm(false);
    fetchRestaurants();

    // Refresh selected restaurant
    const res = await fetch(`/api/restaurants/${selectedRestaurant.id}`);
    const data = await res.json();
    setSelectedRestaurant(data);
  };

  const deleteDish = async (dishId: string) => {
    if (!selectedRestaurant) return;

    await fetch(`/api/restaurants/${selectedRestaurant.id}/dishes`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dishId }),
    });

    fetchRestaurants();
    const res = await fetch(`/api/restaurants/${selectedRestaurant.id}`);
    const data = await res.json();
    setSelectedRestaurant(data);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-amber-800">Restaurant Tracker</h1>
          <p className="text-gray-600 mt-1">Keep track of safe places to eat</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Restaurant'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-amber-200 mb-8">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., The Green Kitchen"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine Type</label>
              <select
                value={formData.cuisineType}
                onChange={(e) => setFormData({ ...formData, cuisineType: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Select cuisine...</option>
                {cuisineTypes.map((cuisine) => (
                  <option key={cuisine} value={cuisine}>{cuisine}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full address"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://..."
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Has GF Menu?</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.glutenFreeMenu}
                    onChange={(e) => setFormData({ ...formData, glutenFreeMenu: e.target.checked })}
                    className="mr-2"
                  />
                  <span>Yes, dedicated GF menu</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Safety Rating</label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, safetyRating: star })}
                    className={`text-2xl ${formData.safetyRating >= star ? 'text-green-500' : 'text-gray-300'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">How knowledgeable/safe are they?</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Visited</label>
              <input
                type="date"
                value={formData.lastVisited}
                onChange={(e) => setFormData({ ...formData, lastVisited: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Tips for ordering, what to avoid, staff knowledge, etc."
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            Save Restaurant
          </button>
        </form>
      )}

      {/* Restaurant detail modal */}
      {selectedRestaurant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedRestaurant.name}</h2>
                  {selectedRestaurant.cuisineType && (
                    <span className="text-sm text-gray-500">{selectedRestaurant.cuisineType}</span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedRestaurant(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {selectedRestaurant.glutenFreeMenu && (
                  <span className="bg-green-100 text-green-700 text-sm px-2 py-1 rounded">
                    ✓ GF Menu
                  </span>
                )}
                {selectedRestaurant.safetyRating && (
                  <span className="text-green-600">
                    {'★'.repeat(selectedRestaurant.safetyRating)}{'☆'.repeat(5 - selectedRestaurant.safetyRating)}
                  </span>
                )}
              </div>

              {selectedRestaurant.address && (
                <p className="text-gray-600 mb-2">📍 {selectedRestaurant.address}</p>
              )}
              {selectedRestaurant.phone && (
                <p className="text-gray-600 mb-2">📞 {selectedRestaurant.phone}</p>
              )}
              {selectedRestaurant.website && (
                <p className="text-gray-600 mb-2">
                  🌐 <a href={selectedRestaurant.website} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">
                    {selectedRestaurant.website}
                  </a>
                </p>
              )}
              {selectedRestaurant.lastVisited && (
                <p className="text-gray-500 text-sm mb-4">
                  Last visited: {formatDate(selectedRestaurant.lastVisited)}
                </p>
              )}

              {selectedRestaurant.notes && (
                <div className="bg-amber-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold text-gray-800 mb-2">Notes</h3>
                  <p className="text-gray-600">{selectedRestaurant.notes}</p>
                </div>
              )}

              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-800">Safe Dishes</h3>
                  <button
                    onClick={() => setShowDishForm(!showDishForm)}
                    className="text-sm text-amber-600 hover:text-amber-700"
                  >
                    {showDishForm ? 'Cancel' : '+ Add Dish'}
                  </button>
                </div>

                {showDishForm && (
                  <form onSubmit={addDish} className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        value={newDish.name}
                        onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                        placeholder="Dish name"
                        className="p-2 border rounded"
                        required
                      />
                      <input
                        type="text"
                        value={newDish.description}
                        onChange={(e) => setNewDish({ ...newDish, description: e.target.value })}
                        placeholder="Description (optional)"
                        className="p-2 border rounded"
                      />
                    </div>
                    <div className="flex gap-4 items-center mb-3">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={newDish.isSafe}
                          onChange={() => setNewDish({ ...newDish, isSafe: true })}
                          className="mr-1"
                        />
                        <span className="text-sm text-green-600">Safe</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={!newDish.isSafe}
                          onChange={() => setNewDish({ ...newDish, isSafe: false })}
                          className="mr-1"
                        />
                        <span className="text-sm text-red-600">Avoid</span>
                      </label>
                      <div className="flex gap-1 ml-auto">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewDish({ ...newDish, rating: star })}
                            className={`text-lg ${newDish.rating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-amber-600 text-white py-1.5 rounded hover:bg-amber-700 text-sm"
                    >
                      Add Dish
                    </button>
                  </form>
                )}

                {selectedRestaurant.dishes.length === 0 ? (
                  <p className="text-gray-500 text-sm">No dishes recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedRestaurant.dishes.map((dish) => (
                      <div
                        key={dish.id}
                        className={`flex justify-between items-center p-3 rounded-lg ${
                          dish.isSafe ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        <div>
                          <span className="font-medium">{dish.name}</span>
                          {dish.description && (
                            <span className="text-gray-500 text-sm ml-2">- {dish.description}</span>
                          )}
                          {dish.rating && (
                            <span className="ml-2 text-yellow-500">
                              {'★'.repeat(dish.rating)}
                            </span>
                          )}
                          {!dish.isSafe && (
                            <span className="ml-2 text-xs text-red-600">(avoid)</span>
                          )}
                        </div>
                        <button
                          onClick={() => deleteDish(dish.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleDelete(selectedRestaurant.id)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Delete Restaurant
              </button>
            </div>
          </div>
        </div>
      )}

      {restaurants.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-amber-200">
          <div className="text-4xl mb-4">🍽️</div>
          <p className="text-gray-600 mb-4">No restaurants saved yet. Start building your safe dining list!</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-amber-600 hover:text-amber-700 font-medium"
          >
            Add your first restaurant →
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              onClick={() => setSelectedRestaurant(restaurant)}
              className="bg-white p-4 rounded-xl border border-amber-200 hover:border-amber-400 cursor-pointer transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">{restaurant.name}</h3>
                  {restaurant.cuisineType && (
                    <p className="text-sm text-gray-500">{restaurant.cuisineType}</p>
                  )}
                </div>
                {restaurant.glutenFreeMenu && (
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">
                    GF Menu
                  </span>
                )}
              </div>
              <div className="flex gap-3 mt-3 text-sm text-gray-500">
                {restaurant.safetyRating && (
                  <span className="text-green-600">
                    {'★'.repeat(restaurant.safetyRating)}{'☆'.repeat(5 - restaurant.safetyRating)}
                  </span>
                )}
                {restaurant.dishes.length > 0 && (
                  <span>{restaurant.dishes.length} dishes saved</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
