'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

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

type YelpRestaurant = {
  yelpId: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  cuisineType: string;
  rating: number;
  reviewCount: number;
  price?: string;
  imageUrl: string;
  distance?: number;
};

type SuggestedItem = {
  name: string;
  description: string;
  isGlutenFree: boolean;
  isVegetarian: boolean;
};

type YelpRestaurantDetails = {
  id: string;
  name: string;
  imageUrl: string;
  url: string;
  rating: number;
  reviewCount: number;
  price?: string;
  categories: string;
  address: string;
  phone: string;
  photos: string[];
  isOpenNow?: boolean;
  suggestedItems: SuggestedItem[];
  dataSource?: 'website' | 'google_photos' | 'none';
  dataSourceUrl?: string | null;
  googlePhotosFound?: number;
};

const cuisineTypes = [
  'American', 'Italian', 'Mexican', 'Chinese', 'Japanese', 'Thai', 'Indian',
  'Mediterranean', 'French', 'Korean', 'Vietnamese', 'Greek', 'Ethiopian',
  'Vegan', 'Vegetarian', 'Health Food', 'Bakery/Cafe', 'Other'
];

function RestaurantsPageContent() {
  const searchParams = useSearchParams();

  // Read initial values from URL params
  const initialTerm = searchParams.get('term') || '';
  const initialLocation = searchParams.get('location') || '11216';

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

  // Discover tab state - default to discover since it's the main feature
  const [activeTab, setActiveTab] = useState<'saved' | 'discover'>('discover');
  const [yelpRestaurants, setYelpRestaurants] = useState<YelpRestaurant[]>([]);
  const [yelpLoading, setYelpLoading] = useState(false);
  const [yelpError, setYelpError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [hasMoreYelp, setHasMoreYelp] = useState(false);
  const [searchLocation, setSearchLocation] = useState(initialLocation);
  const [searchTerm, setSearchTerm] = useState(initialTerm);
  const [selectedYelpRestaurant, setSelectedYelpRestaurant] = useState<YelpRestaurantDetails | null>(null);
  const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);
  const [initialSearchDone, setInitialSearchDone] = useState(false);

  // Effect to handle URL params on initial load
  useEffect(() => {
    seedAndFetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Separate effect to trigger search after component mounts with URL params
  useEffect(() => {
    if (!initialSearchDone) {
      // Update state from URL params if they changed
      const urlTerm = searchParams.get('term') || '';
      const urlLocation = searchParams.get('location') || '11216';
      setSearchTerm(urlTerm);
      setSearchLocation(urlLocation);
      setInitialSearchDone(true);
      // Trigger search with URL params
      fetchYelpRestaurantsWithParams(urlLocation, urlTerm);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, initialSearchDone]);

  const fetchYelpRestaurantsWithParams = async (loc: string, term: string, pageToken: string | null = null, append = false) => {
    setYelpLoading(true);
    setYelpError(null);

    try {
      const params = new URLSearchParams({ location: loc });
      if (term) params.set('term', term);
      if (pageToken) params.set('pageToken', pageToken);

      const res = await fetch(`/api/restaurants/yelp?${params}`);
      const data = await res.json();

      if (data.error) {
        setYelpError(data.error);
        return;
      }

      if (append) {
        setYelpRestaurants((prev) => [...prev, ...data.restaurants]);
      } else {
        setYelpRestaurants(data.restaurants || []);
      }
      setHasMoreYelp(data.hasMore || false);
      setNextPageToken(data.nextPageToken || null);
    } catch {
      setYelpError('Failed to fetch restaurants');
    } finally {
      setYelpLoading(false);
    }
  };

  const seedAndFetch = async () => {
    // Seed restaurants if empty
    await fetch('/api/restaurants/seed', { method: 'POST' });
    fetchRestaurants();
  };

  const fetchRestaurants = async () => {
    const res = await fetch('/api/restaurants');
    const data = await res.json();
    if (Array.isArray(data)) {
      setRestaurants(data);
    } else {
      setRestaurants([]);
    }
    setLoading(false);
  };

  const fetchYelpRestaurants = async (pageToken: string | null = null, append = false) => {
    // Use current state values
    await fetchYelpRestaurantsWithParams(searchLocation, searchTerm, pageToken, append);
  };

  const fetchYelpDetails = async (yelpId: string) => {
    setLoadingDetailsId(yelpId);
    try {
      const res = await fetch(`/api/restaurants/yelp/${yelpId}`);
      const data = await res.json();
      if (data.error) {
        alert('Failed to load restaurant details');
      } else {
        setSelectedYelpRestaurant(data);
      }
    } catch {
      alert('Failed to load restaurant details');
    } finally {
      setLoadingDetailsId(null);
    }
  };

  const handleDiscoverTab = () => {
    setActiveTab('discover');
    if (yelpRestaurants.length === 0 && !yelpError) {
      fetchYelpRestaurants();
    }
  };

  const addFromYelp = async (yelp: YelpRestaurant) => {
    await fetch('/api/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: yelp.name,
        address: yelp.address,
        phone: yelp.phone,
        website: yelp.website,
        cuisineType: yelp.cuisineType,
        glutenFreeMenu: false,
        safetyRating: null,
        notes: `Yelp rating: ${yelp.rating}/5 (${yelp.reviewCount} reviews)${yelp.price ? ` | Price: ${yelp.price}` : ''}`,
      }),
    });
    fetchRestaurants();
    alert(`${yelp.name} added to your saved restaurants!`);
  };

  const isAlreadySaved = (yelpName: string) => {
    return restaurants.some(r => r.name.toLowerCase() === yelpName.toLowerCase());
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-violet-600">
            Restaurant Tracker
          </h1>
          <p className="text-gray-500 mt-1">Keep track of safe places to eat</p>
        </div>
        {activeTab === 'saved' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className={`px-5 py-2.5 rounded-full font-semibold transition-all ${
              showForm
                ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                : 'bg-violet-500 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:bg-violet-600'
            }`}
          >
            {showForm ? 'Cancel' : '+ Add Restaurant'}
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={handleDiscoverTab}
          className={`px-5 py-2.5 rounded-full font-medium transition-all ${
            activeTab === 'discover'
              ? 'bg-violet-500 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-violet-50 border border-gray-200'
          }`}
        >
          🔍 Discover & Analyze
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`px-5 py-2.5 rounded-full font-medium transition-all ${
            activeTab === 'saved'
              ? 'bg-violet-500 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-violet-50 border border-gray-200'
          }`}
        >
          My Restaurants ({restaurants.length})
        </button>
      </div>

      {/* SAVED RESTAURANTS TAB */}
      {activeTab === 'saved' && (
        <>
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
        </>
      )}

      {/* DISCOVER TAB */}
      {activeTab === 'discover' && (
        <div>
          {/* Search Controls */}
          <div className="bg-white p-4 rounded-xl border border-amber-200 mb-6">
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Restaurant Name (optional)
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="e.g., Sweetgreen, Chipotle"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  placeholder="ZIP code or neighborhood"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setNextPageToken(null);
                    fetchYelpRestaurants(null, false);
                  }}
                  disabled={yelpLoading}
                  className="w-full bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {yelpLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {searchTerm ? `Searching for "${searchTerm}" near ${searchLocation}` : 'Searching for vegetarian, vegan, and gluten-free friendly restaurants via Google Maps'}
            </p>
          </div>

          {/* Error State */}
          {yelpError && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6">
              <p className="text-red-700">{yelpError}</p>
              {yelpError.includes('API key') && (
                <div className="mt-3 text-sm text-red-600">
                  <p className="font-medium">To set up Google Places API:</p>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                    <li>Enable the Places API (New) for your project</li>
                    <li>Create an API key</li>
                    <li>Add <code className="bg-red-100 px-1 rounded">GOOGLE_PLACES_API_KEY=your_key</code> to <code className="bg-red-100 px-1 rounded">.env.local</code></li>
                    <li>Restart the dev server</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {yelpLoading && yelpRestaurants.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4 animate-pulse">🔍</div>
              <p className="text-gray-600">Searching for GF-friendly restaurants...</p>
            </div>
          )}

          {/* Results */}
          {yelpRestaurants.length > 0 && (
            <>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {yelpRestaurants.map((restaurant) => (
                  <div
                    key={restaurant.yelpId}
                    className="bg-white rounded-xl border border-amber-200 overflow-hidden"
                  >
                    {restaurant.imageUrl && (
                      <div
                        className="h-32 bg-cover bg-center"
                        style={{ backgroundImage: `url(${restaurant.imageUrl})` }}
                      />
                    )}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-800">{restaurant.name}</h3>
                          <p className="text-sm text-gray-500">{restaurant.cuisineType}</p>
                        </div>
                        {restaurant.price && (
                          <span className="text-green-600 font-medium">{restaurant.price}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">📍 {restaurant.address}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <span className="text-yellow-500">★</span>
                        <span>{restaurant.rating}/5</span>
                        <span className="text-gray-300">|</span>
                        <span>{restaurant.reviewCount} reviews</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => fetchYelpDetails(restaurant.yelpId)}
                          disabled={loadingDetailsId === restaurant.yelpId}
                          className="w-full text-center text-sm text-violet-600 border border-violet-300 py-1.5 rounded-lg hover:bg-violet-50 disabled:opacity-50"
                        >
                          {loadingDetailsId === restaurant.yelpId ? 'Analyzing menu...' : '🍽️ View GF/Veggie Items'}
                        </button>
                        <div className="flex gap-2">
                          <a
                            href={restaurant.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-center text-sm text-amber-600 border border-amber-300 py-1.5 rounded-lg hover:bg-amber-50"
                          >
                            Maps
                          </a>
                          {isAlreadySaved(restaurant.name) ? (
                            <button
                              disabled
                              className="flex-1 text-sm text-gray-400 bg-gray-100 py-1.5 rounded-lg cursor-not-allowed"
                            >
                              ✓ Saved
                            </button>
                          ) : (
                            <button
                              onClick={() => addFromYelp(restaurant)}
                              className="flex-1 text-sm text-white bg-amber-600 py-1.5 rounded-lg hover:bg-amber-700"
                            >
                              + Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {hasMoreYelp && (
                <div className="text-center">
                  <button
                    onClick={() => fetchYelpRestaurants(nextPageToken, true)}
                    disabled={yelpLoading || !nextPageToken}
                    className="bg-white border border-amber-300 text-amber-700 px-6 py-2 rounded-lg hover:bg-amber-50 disabled:opacity-50"
                  >
                    {yelpLoading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!yelpLoading && !yelpError && yelpRestaurants.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-amber-200">
              <div className="text-4xl mb-4">🌱</div>
              <p className="text-gray-600 mb-2">Discover GF-friendly restaurants near you</p>
              <p className="text-sm text-gray-500">Enter a location and click Search to find new spots!</p>
            </div>
          )}

          {/* Yelp Restaurant Details Modal */}
          {selectedYelpRestaurant && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="relative">
                  {selectedYelpRestaurant.imageUrl && (
                    <div
                      className="h-48 bg-cover bg-center rounded-t-xl"
                      style={{ backgroundImage: `url(${selectedYelpRestaurant.imageUrl})` }}
                    />
                  )}
                  <button
                    onClick={() => setSelectedYelpRestaurant(null)}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-600 rounded-full p-2 shadow-md"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{selectedYelpRestaurant.name}</h2>
                      <p className="text-sm text-gray-500">{selectedYelpRestaurant.categories}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <span>★</span>
                        <span className="text-gray-700 font-medium">{selectedYelpRestaurant.rating}/5</span>
                      </div>
                      <p className="text-xs text-gray-500">{selectedYelpRestaurant.reviewCount} reviews</p>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-4 space-y-1">
                    <p>📍 {selectedYelpRestaurant.address}</p>
                    {selectedYelpRestaurant.phone && <p>📞 {selectedYelpRestaurant.phone}</p>}
                    {selectedYelpRestaurant.isOpenNow !== undefined && (
                      <p className={selectedYelpRestaurant.isOpenNow ? 'text-green-600' : 'text-red-600'}>
                        {selectedYelpRestaurant.isOpenNow ? '✓ Open Now' : '✗ Closed'}
                      </p>
                    )}
                  </div>

                  {/* Suggested GF/Vegetarian Items */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 flex-wrap">
                      🥗 {selectedYelpRestaurant.dataSource === 'google_photos' ? 'Dish Types to Ask About' : 'Likely GF & Vegetarian Items'}
                      {selectedYelpRestaurant.dataSource === 'google_photos' && (
                        <a
                          href={selectedYelpRestaurant.dataSourceUrl || `https://www.google.com/maps/search/${encodeURIComponent(selectedYelpRestaurant.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-normal bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full hover:bg-blue-200 transition-colors cursor-pointer"
                        >
                          from food photos ↗
                        </a>
                      )}
                      {selectedYelpRestaurant.dataSource === 'website' && (
                        <a
                          href={selectedYelpRestaurant.dataSourceUrl || selectedYelpRestaurant.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-normal bg-green-100 text-green-700 px-2 py-0.5 rounded-full hover:bg-green-200 transition-colors cursor-pointer"
                        >
                          from website menu ↗
                        </a>
                      )}
                    </h3>

                    {selectedYelpRestaurant.dataSource === 'google_photos' && selectedYelpRestaurant.suggestedItems.length > 0 && (
                      <p className="text-sm text-gray-500 mb-3">
                        Based on food photos, this restaurant appears to serve these types of dishes. Ask the staff about specific menu items!
                      </p>
                    )}

                    {selectedYelpRestaurant.suggestedItems.length === 0 ? (
                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                        <p className="text-amber-800 text-sm">
                          No menu data available for this restaurant. This could be because:
                        </p>
                        <ul className="text-amber-700 text-sm mt-2 list-disc list-inside space-y-1">
                          <li>The restaurant doesn&apos;t have an online menu</li>
                          <li>Their website couldn&apos;t be accessed</li>
                          <li>Menu format wasn&apos;t recognized</li>
                        </ul>
                        <p className="text-amber-800 text-sm mt-3">
                          Try checking their Yelp page or calling ahead to ask about GF options.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedYelpRestaurant.suggestedItems.map((item, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 p-3 rounded-lg border border-gray-100"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-800">{item.name}</span>
                              <div className="flex gap-1">
                                {item.isGlutenFree && (
                                  <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                                    GF
                                  </span>
                                )}
                                {item.isVegetarian && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                    Veggie
                                  </span>
                                )}
                              </div>
                            </div>
                            {item.description && (
                              <p className="text-sm text-gray-600">{item.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-4 italic">
                      * {selectedYelpRestaurant.dataSource === 'google_photos'
                        ? 'Dish types identified from food photos - not exact menu items. Ask staff for actual menu names and GF options.'
                        : selectedYelpRestaurant.dataSource === 'website'
                        ? "Items analyzed by AI from the restaurant's website. Always confirm with the restaurant about ingredients and cross-contamination."
                        : 'Always confirm with the restaurant about ingredients and cross-contamination.'
                      }
                    </p>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <a
                      href={selectedYelpRestaurant.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50"
                    >
                      View on Google Maps
                    </a>
                    <button
                      onClick={() => setSelectedYelpRestaurant(null)}
                      className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RestaurantsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading restaurants...</p>
        </div>
      </div>
    }>
      <RestaurantsPageContent />
    </Suspense>
  );
}
