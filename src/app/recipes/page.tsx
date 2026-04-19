'use client';

import { useState, useEffect } from 'react';

type Recipe = {
  id: string;
  title: string;
  description: string | null;
  ingredients: string;
  instructions: string;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  category: string | null;
  source: string | null;
  notes: string | null;
  isFavorite: boolean;
};

type DiscoveredRecipe = {
  title: string;
  description: string;
  ingredients: string;
  instructions: string;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  category: string | null;
  source: string;
};

const categories = ['breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'side', 'sauce', 'other'];

// Get daily recipe based on date
function getDailyRecipeIndex(recipesLength: number): number {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return dayOfYear % recipesLength;
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedDiscovered, setSelectedDiscovered] = useState<DiscoveredRecipe | null>(null);
  const [filter, setFilter] = useState('all');
  const [dailyRecipe, setDailyRecipe] = useState<Recipe | null>(null);
  const [activeTab, setActiveTab] = useState<'myrecipes' | 'discover'>('myrecipes');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DiscoveredRecipe[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ingredients: '',
    instructions: '',
    prepTime: '',
    cookTime: '',
    servings: '',
    category: 'dinner',
    source: '',
    notes: '',
  });

  useEffect(() => {
    seedAndFetch();
  }, []);

  const seedAndFetch = async () => {
    // Seed recipes if empty
    await fetch('/api/recipes/seed', { method: 'POST' });
    fetchRecipes();
  };

  const fetchRecipes = async () => {
    const res = await fetch('/api/recipes');
    const data = await res.json();
    if (Array.isArray(data)) {
      setRecipes(data);
      if (data.length > 0) {
        setDailyRecipe(data[getDailyRecipeIndex(data.length)]);
      }
    } else {
      setRecipes([]);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        prepTime: formData.prepTime ? parseInt(formData.prepTime) : null,
        cookTime: formData.cookTime ? parseInt(formData.cookTime) : null,
        servings: formData.servings ? parseInt(formData.servings) : null,
      }),
    });

    setFormData({
      title: '',
      description: '',
      ingredients: '',
      instructions: '',
      prepTime: '',
      cookTime: '',
      servings: '',
      category: 'dinner',
      source: '',
      notes: '',
    });
    setShowForm(false);
    fetchRecipes();
  };

  const toggleFavorite = async (recipe: Recipe) => {
    await fetch(`/api/recipes/${recipe.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...recipe, isFavorite: !recipe.isFavorite }),
    });
    fetchRecipes();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recipe?')) return;
    const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert('Failed to delete recipe: ' + (data.error || `HTTP ${res.status}`));
      return;
    }
    setSelectedRecipe(null);
    fetchRecipes();
  };

  const handleShare = async (recipe: Recipe) => {
    const url = `${window.location.origin}/recipes/${recipe.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: `Check out this gluten-free recipe: ${recipe.title}`,
          url,
        });
      } catch {
        // User cancelled or share failed, fall back to clipboard
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setHasSearched(true);
    setSearchResults([]);

    try {
      const res = await fetch(`/api/recipes/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();

      if (data.error) {
        alert('Search error: ' + data.error);
      } else if (data.recipes) {
        setSearchResults(data.recipes);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to search for recipes');
    } finally {
      setSearching(false);
    }
  };

  const saveDiscoveredRecipe = async (recipe: DiscoveredRecipe) => {
    setSavingRecipe(recipe.title);
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: recipe.title,
          description: recipe.description,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          servings: recipe.servings,
          category: recipe.category,
          source: recipe.source,
          notes: null,
          isFavorite: false,
        }),
      });

      if (res.ok) {
        fetchRecipes();
        setSelectedDiscovered(null);
        setActiveTab('myrecipes');
      } else {
        const data = await res.json();
        alert('Failed to save recipe: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save recipe');
    } finally {
      setSavingRecipe(null);
    }
  };

  const filteredRecipes = recipes
    .filter((recipe) => {
      if (filter === 'all') return true;
      if (filter === 'favorites') return recipe.isFavorite;
      return recipe.category === filter;
    })
    .sort((a, b) => {
      if (filter !== 'all') return 0;
      return Number(b.isFavorite) - Number(a.isFavorite);
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-4xl animate-bounce">👩‍🍳</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-pink-600">
            Recipe Box
          </h1>
          <p className="text-gray-500 mt-1">Your collection of gluten-free recipes</p>
        </div>
        {activeTab === 'myrecipes' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className={`px-5 py-2.5 rounded-full font-semibold transition-all ${
              showForm
                ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                : 'bg-pink-500 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:bg-pink-600'
            }`}
          >
            {showForm ? 'Cancel' : '+ Add Recipe'}
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('discover')}
          className={`px-5 py-2.5 rounded-full font-medium transition-all ${
            activeTab === 'discover'
              ? 'bg-pink-500 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-pink-50 border border-gray-200'
          }`}
        >
          🔍 Discover Recipes
        </button>
        <button
          onClick={() => setActiveTab('myrecipes')}
          className={`px-5 py-2.5 rounded-full font-medium transition-all ${
            activeTab === 'myrecipes'
              ? 'bg-pink-500 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-pink-50 border border-gray-200'
          }`}
        >
          📔 My Recipes ({recipes.length})
        </button>
      </div>

      {/* DISCOVER TAB */}
      {activeTab === 'discover' && (
        <>
          {/* Search Form */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100 mb-8">
            <form onSubmit={handleSearch}>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400">🔍</span>
                  <input
                    type="text"
                    placeholder="Search for gluten-free recipes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching || !searchQuery.trim()}
                  className="bg-pink-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-pink-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {searching ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <span>Search</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-gray-400 text-sm mt-3">
                AI will generate delicious gluten-free recipe ideas based on your search
              </p>
            </form>
          </div>

          {/* Search Results */}
          {searching && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Finding delicious gluten-free recipes...</p>
            </div>
          )}

          {!searching && hasSearched && searchResults.length === 0 && (
            <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
              <div className="text-5xl mb-4">🍳</div>
              <p className="text-gray-500">No recipes found. Try a different search term!</p>
            </div>
          )}

          {!searching && searchResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Found {searchResults.length} recipe ideas for &quot;{searchQuery}&quot;
              </h3>
              {searchResults.map((recipe, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedDiscovered(recipe)}
                  className="card-pop bg-white p-5 rounded-2xl border border-gray-100 cursor-pointer hover:border-pink-200 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg">{recipe.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{recipe.description}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        saveDiscoveredRecipe(recipe);
                      }}
                      disabled={savingRecipe === recipe.title}
                      className="ml-4 px-4 py-2 bg-pink-100 text-pink-600 rounded-xl font-medium hover:bg-pink-200 transition-all disabled:opacity-50"
                    >
                      {savingRecipe === recipe.title ? 'Saving...' : '+ Save'}
                    </button>
                  </div>
                  <div className="flex gap-2 mt-4 text-xs">
                    {recipe.category && (
                      <span className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full font-medium">
                        {recipe.category}
                      </span>
                    )}
                    {recipe.prepTime && recipe.cookTime && (
                      <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                        {recipe.prepTime + recipe.cookTime} min
                      </span>
                    )}
                    {recipe.servings && (
                      <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                        Serves {recipe.servings}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!hasSearched && (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
              <div className="text-6xl mb-4">🍳</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Discover New Recipes</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Search for any dish or ingredient and we&apos;ll generate delicious gluten-free recipe ideas for you to try!
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {['chocolate brownies', 'chicken stir fry', 'banana bread', 'pizza', 'tacos'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setSearchQuery(suggestion);
                    }}
                    className="px-4 py-2 bg-pink-50 text-pink-600 rounded-full text-sm hover:bg-pink-100 transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* MY RECIPES TAB */}
      {activeTab === 'myrecipes' && (
        <>
          {/* Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-xl shadow-pink-500/10 border border-pink-100 mb-8">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Recipe Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., GF Banana Pancakes"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the dish"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ingredients *</label>
                <textarea
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                  placeholder="List each ingredient on a new line:&#10;2 ripe bananas&#10;1 cup GF flour blend&#10;2 eggs"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                  rows={5}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Instructions *</label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Step by step instructions..."
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                  rows={5}
                  required
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Prep Time (mins)</label>
                  <input
                    type="number"
                    value={formData.prepTime}
                    onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cook Time (mins)</label>
                  <input
                    type="number"
                    value={formData.cookTime}
                    onChange={(e) => setFormData({ ...formData, cookTime: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Servings</label>
                  <input
                    type="number"
                    value={formData.servings}
                    onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Source (optional)</label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    placeholder="URL, cookbook, or where you found it"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (optional)</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Tips, variations, etc."
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-pink-500 text-white py-3 rounded-xl font-semibold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:bg-pink-600 transition-all"
              >
                Save Recipe
              </button>
            </form>
          )}

          {/* Daily Recipe */}
          {dailyRecipe && !showForm && (
            <div
              onClick={() => setSelectedRecipe(dailyRecipe)}
              className="relative overflow-hidden bg-pink-500 p-6 rounded-3xl mb-8 cursor-pointer hover:shadow-xl transition-all text-white"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl bounce-gentle">✨</span>
                  <span className="text-sm font-bold uppercase tracking-wider text-white/90">Recipe of the Day</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">{dailyRecipe.title}</h3>
                {dailyRecipe.description && (
                  <p className="text-white/90 mb-4">{dailyRecipe.description}</p>
                )}
                <div className="flex gap-4 text-sm text-white/80">
                  {dailyRecipe.prepTime && dailyRecipe.cookTime && (
                    <span className="flex items-center gap-1">
                      <span>⏱️</span> {dailyRecipe.prepTime + dailyRecipe.cookTime} min
                    </span>
                  )}
                  {dailyRecipe.servings && (
                    <span className="flex items-center gap-1">
                      <span>🍽️</span> Serves {dailyRecipe.servings}
                    </span>
                  )}
                  {dailyRecipe.category && (
                    <span className="capitalize flex items-center gap-1">
                      <span>📂</span> {dailyRecipe.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Filter bar */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === 'all'
                  ? 'bg-pink-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-pink-50 border border-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('favorites')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === 'favorites'
                  ? 'bg-pink-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-pink-50 border border-gray-200'
              }`}
            >
              ❤️ Favorites
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  filter === cat
                    ? 'bg-pink-500 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-pink-50 border border-gray-200'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Recipes Grid */}
          {filteredRecipes.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="text-6xl mb-4 animate-bounce">👩‍🍳</div>
              <p className="text-gray-500 mb-4 text-lg">
                {filter === 'all'
                  ? 'No recipes yet. Start building your collection!'
                  : `No ${filter} recipes found.`}
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="text-pink-500 hover:text-pink-600 font-semibold text-lg"
              >
                Add your first recipe →
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  onClick={() => setSelectedRecipe(recipe)}
                  className="card-pop bg-white p-5 rounded-2xl border border-gray-100 cursor-pointer hover:border-pink-200 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg">{recipe.title}</h3>
                      {recipe.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{recipe.description}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(recipe);
                      }}
                      className="text-2xl hover:scale-110 transition-transform"
                    >
                      {recipe.isFavorite ? '❤️' : '🤍'}
                    </button>
                  </div>
                  <div className="flex gap-2 mt-4 text-xs">
                    {recipe.category && (
                      <span className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full font-medium">
                        {recipe.category}
                      </span>
                    )}
                    {recipe.prepTime && recipe.cookTime && (
                      <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                        {recipe.prepTime + recipe.cookTime} min
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Recipe detail modal - for saved recipes */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedRecipe.title}</h2>
                  {selectedRecipe.description && (
                    <p className="text-gray-500 mt-1">{selectedRecipe.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="flex gap-4 text-sm text-gray-500 mb-6">
                {selectedRecipe.prepTime && (
                  <span className="bg-pink-50 px-3 py-1 rounded-full">Prep: {selectedRecipe.prepTime} min</span>
                )}
                {selectedRecipe.cookTime && (
                  <span className="bg-pink-50 px-3 py-1 rounded-full">Cook: {selectedRecipe.cookTime} min</span>
                )}
                {selectedRecipe.servings && (
                  <span className="bg-pink-50 px-3 py-1 rounded-full">Serves: {selectedRecipe.servings}</span>
                )}
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">🥗</span> Ingredients
                </h3>
                <div className="bg-pink-50 p-4 rounded-2xl">
                  {selectedRecipe.ingredients.split('\n').map((ing, i) => (
                    <div key={i} className="py-1.5 border-b border-pink-100 last:border-0 text-gray-700">{ing}</div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">📝</span> Instructions
                </h3>
                <div className="whitespace-pre-wrap text-gray-600 leading-relaxed">{selectedRecipe.instructions}</div>
              </div>

              {selectedRecipe.notes && (
                <div className="mb-6 bg-amber-50 p-4 rounded-2xl">
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <span>💡</span> Notes
                  </h3>
                  <p className="text-gray-600 italic">{selectedRecipe.notes}</p>
                </div>
              )}

              {selectedRecipe.source && (
                <div className="text-sm text-gray-400 mb-6">
                  Source: {selectedRecipe.source}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => toggleFavorite(selectedRecipe)}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                    selectedRecipe.isFavorite
                      ? 'bg-pink-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {selectedRecipe.isFavorite ? '❤️ Favorited' : '🤍 Add to Favorites'}
                </button>
                <button
                  onClick={() => handleShare(selectedRecipe)}
                  className="px-6 py-3 rounded-xl bg-violet-50 text-violet-600 hover:bg-violet-100 font-medium transition-colors flex items-center gap-2"
                >
                  {copied ? '✓ Copied!' : '🔗 Share'}
                </button>
                <button
                  onClick={() => handleDelete(selectedRecipe.id)}
                  className="px-6 py-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discovered recipe detail modal */}
      {selectedDiscovered && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedDiscovered.title}</h2>
                  {selectedDiscovered.description && (
                    <p className="text-gray-500 mt-1">{selectedDiscovered.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedDiscovered(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="flex gap-4 text-sm text-gray-500 mb-6">
                {selectedDiscovered.prepTime && (
                  <span className="bg-pink-50 px-3 py-1 rounded-full">Prep: {selectedDiscovered.prepTime} min</span>
                )}
                {selectedDiscovered.cookTime && (
                  <span className="bg-pink-50 px-3 py-1 rounded-full">Cook: {selectedDiscovered.cookTime} min</span>
                )}
                {selectedDiscovered.servings && (
                  <span className="bg-pink-50 px-3 py-1 rounded-full">Serves: {selectedDiscovered.servings}</span>
                )}
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">🥗</span> Ingredients
                </h3>
                <div className="bg-pink-50 p-4 rounded-2xl">
                  {selectedDiscovered.ingredients.split('\n').map((ing, i) => (
                    <div key={i} className="py-1.5 border-b border-pink-100 last:border-0 text-gray-700">{ing}</div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">📝</span> Instructions
                </h3>
                <div className="whitespace-pre-wrap text-gray-600 leading-relaxed">{selectedDiscovered.instructions}</div>
              </div>

              {selectedDiscovered.source && (
                <div className="text-sm text-gray-400 mb-6">
                  Source: {selectedDiscovered.source}
                </div>
              )}

              <button
                onClick={() => saveDiscoveredRecipe(selectedDiscovered)}
                disabled={savingRecipe === selectedDiscovered.title}
                className="w-full bg-pink-500 text-white py-3 rounded-xl font-semibold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:bg-pink-600 transition-all disabled:opacity-50"
              >
                {savingRecipe === selectedDiscovered.title ? 'Saving...' : '💾 Save to My Recipes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
