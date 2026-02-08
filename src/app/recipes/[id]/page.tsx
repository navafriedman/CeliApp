'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

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
};

export default function SharedRecipePage() {
  const params = useParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await fetch(`/api/recipes/${params.id}`);
        if (!res.ok) {
          setError('Recipe not found');
          setLoading(false);
          return;
        }
        const data = await res.json();
        setRecipe(data);
      } catch (err) {
        setError('Failed to load recipe');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchRecipe();
    }
  }, [params.id]);

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe?.title,
          text: `Check out this gluten-free recipe: ${recipe?.title}`,
          url,
        });
      } catch (err) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-4xl animate-bounce">👩‍🍳</div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Recipe Not Found</h1>
        <p className="text-gray-500 mb-6">This recipe may have been deleted or the link is incorrect.</p>
        <Link
          href="/recipes"
          className="inline-flex items-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-xl font-semibold hover:bg-pink-600 transition-all"
        >
          <span>Browse Recipes</span>
          <span>→</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header with branding */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
          <Image
            src="/celia-logo.svg"
            alt="Celia"
            width={40}
            height={40}
            className="group-hover:scale-110 transition-transform"
          />
          <span className="text-xl font-semibold text-violet-600" style={{ fontFamily: 'var(--font-poppins)' }}>
            CeliApp
          </span>
        </Link>
        <p className="text-gray-500 text-sm">Shared Gluten-Free Recipe</p>
      </div>

      {/* Recipe Card */}
      <div className="bg-white rounded-3xl shadow-xl shadow-pink-500/10 border border-pink-100 overflow-hidden">
        {/* Header */}
        <div className="bg-pink-500 p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{recipe.title}</h1>
              {recipe.description && (
                <p className="text-white/90">{recipe.description}</p>
              )}
            </div>
            <button
              onClick={handleShare}
              className="flex-shrink-0 ml-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-all flex items-center gap-2"
            >
              {copied ? (
                <>
                  <span>✓</span>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <span>🔗</span>
                  <span>Share</span>
                </>
              )}
            </button>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-3 mt-4">
            {recipe.prepTime && (
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                ⏱️ Prep: {recipe.prepTime} min
              </span>
            )}
            {recipe.cookTime && (
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                🍳 Cook: {recipe.cookTime} min
              </span>
            )}
            {recipe.servings && (
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                🍽️ Serves: {recipe.servings}
              </span>
            )}
            {recipe.category && (
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm capitalize">
                📂 {recipe.category}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Ingredients */}
          <div className="mb-6">
            <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-lg">
              <span className="text-xl">🥗</span> Ingredients
            </h2>
            <div className="bg-pink-50 p-4 rounded-2xl">
              {recipe.ingredients.split('\n').map((ing, i) => (
                <div key={i} className="py-1.5 border-b border-pink-100 last:border-0 text-gray-700">
                  {ing}
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-6">
            <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-lg">
              <span className="text-xl">📝</span> Instructions
            </h2>
            <div className="whitespace-pre-wrap text-gray-600 leading-relaxed">
              {recipe.instructions}
            </div>
          </div>

          {/* Notes */}
          {recipe.notes && (
            <div className="mb-6 bg-amber-50 p-4 rounded-2xl">
              <h2 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span>💡</span> Notes
              </h2>
              <p className="text-gray-600 italic">{recipe.notes}</p>
            </div>
          )}

          {/* Source */}
          {recipe.source && (
            <div className="text-sm text-gray-400 mb-6">
              Source: {recipe.source}
            </div>
          )}

          {/* CTA */}
          <div className="border-t border-gray-100 pt-6 mt-6">
            <div className="bg-violet-50 rounded-2xl p-5 text-center">
              <p className="text-gray-600 mb-3">
                Want to save this recipe and discover more gluten-free meals?
              </p>
              <Link
                href="/recipes"
                className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-all"
              >
                <span>Explore CeliApp</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Back link */}
      <div className="text-center mt-6">
        <Link
          href="/recipes"
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← Back to Recipe Box
        </Link>
      </div>
    </div>
  );
}
