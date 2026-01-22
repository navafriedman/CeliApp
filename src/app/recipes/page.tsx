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

const categories = ['breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'side', 'sauce', 'other'];

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [filter, setFilter] = useState('all');
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
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    const res = await fetch('/api/recipes');
    const data = await res.json();
    setRecipes(data);
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
    await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
    setSelectedRecipe(null);
    fetchRecipes();
  };

  const filteredRecipes = recipes.filter((recipe) => {
    if (filter === 'all') return true;
    if (filter === 'favorites') return recipe.isFavorite;
    return recipe.category === filter;
  });

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-amber-800">Recipe Box</h1>
          <p className="text-gray-600 mt-1">Your collection of gluten-free recipes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Recipe'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-amber-200 mb-8">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., GF Banana Pancakes"
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
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the dish"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients *</label>
            <textarea
              value={formData.ingredients}
              onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
              placeholder="List each ingredient on a new line:&#10;2 ripe bananas&#10;1 cup GF flour blend&#10;2 eggs"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              rows={5}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions *</label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Step by step instructions..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              rows={5}
              required
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (mins)</label>
              <input
                type="number"
                value={formData.prepTime}
                onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cook Time (mins)</label>
              <input
                type="number"
                value={formData.cookTime}
                onChange={(e) => setFormData({ ...formData, cookTime: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
              <input
                type="number"
                value={formData.servings}
                onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source (optional)</label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="URL, cookbook, or where you found it"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Tips, variations, etc."
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            Save Recipe
          </button>
        </form>
      )}

      {/* Filter bar */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
            filter === 'all' ? 'bg-amber-600 text-white' : 'bg-white text-gray-600 hover:bg-amber-100'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('favorites')}
          className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
            filter === 'favorites' ? 'bg-amber-600 text-white' : 'bg-white text-gray-600 hover:bg-amber-100'
          }`}
        >
          ❤️ Favorites
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              filter === cat ? 'bg-amber-600 text-white' : 'bg-white text-gray-600 hover:bg-amber-100'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Recipe detail modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedRecipe.title}</h2>
                  {selectedRecipe.description && (
                    <p className="text-gray-600 mt-1">{selectedRecipe.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="flex gap-4 text-sm text-gray-500 mb-4">
                {selectedRecipe.prepTime && <span>Prep: {selectedRecipe.prepTime} min</span>}
                {selectedRecipe.cookTime && <span>Cook: {selectedRecipe.cookTime} min</span>}
                {selectedRecipe.servings && <span>Serves: {selectedRecipe.servings}</span>}
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Ingredients</h3>
                <div className="bg-amber-50 p-4 rounded-lg">
                  {selectedRecipe.ingredients.split('\n').map((ing, i) => (
                    <div key={i} className="py-1">{ing}</div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Instructions</h3>
                <div className="whitespace-pre-wrap text-gray-600">{selectedRecipe.instructions}</div>
              </div>

              {selectedRecipe.notes && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-2">Notes</h3>
                  <p className="text-gray-600 italic">{selectedRecipe.notes}</p>
                </div>
              )}

              {selectedRecipe.source && (
                <div className="text-sm text-gray-500 mb-4">
                  Source: {selectedRecipe.source}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => toggleFavorite(selectedRecipe)}
                  className={`px-4 py-2 rounded-lg ${
                    selectedRecipe.isFavorite
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {selectedRecipe.isFavorite ? '❤️ Favorited' : '🤍 Add to Favorites'}
                </button>
                <button
                  onClick={() => handleDelete(selectedRecipe.id)}
                  className="px-4 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredRecipes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-amber-200">
          <div className="text-4xl mb-4">👩‍🍳</div>
          <p className="text-gray-600 mb-4">
            {filter === 'all'
              ? 'No recipes yet. Start building your collection!'
              : `No ${filter} recipes found.`}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="text-amber-600 hover:text-amber-700 font-medium"
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
              className="bg-white p-4 rounded-xl border border-amber-200 hover:border-amber-400 cursor-pointer transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">{recipe.title}</h3>
                  {recipe.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{recipe.description}</p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(recipe);
                  }}
                  className="text-xl"
                >
                  {recipe.isFavorite ? '❤️' : '🤍'}
                </button>
              </div>
              <div className="flex gap-3 mt-3 text-xs text-gray-500">
                {recipe.category && (
                  <span className="bg-amber-100 px-2 py-0.5 rounded">
                    {recipe.category}
                  </span>
                )}
                {recipe.prepTime && recipe.cookTime && (
                  <span>{recipe.prepTime + recipe.cookTime} min total</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
