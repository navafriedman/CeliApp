'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const features = [
  {
    href: '/diary',
    icon: '📔',
    title: 'Food Diary',
    description: 'Track your meals and discover what works for you',
    gradient: 'from-teal-400 to-emerald-400',
    bgGlow: 'bg-teal-500/20',
    iconBg: 'bg-teal-100',
    hoverText: 'text-teal-600',
  },
  {
    href: '/recipes',
    icon: '👩‍🍳',
    title: 'Recipe Box',
    description: 'Save and organize your favorite gluten-free recipes',
    gradient: 'from-pink-400 to-rose-400',
    bgGlow: 'bg-pink-500/20',
    iconBg: 'bg-pink-100',
    hoverText: 'text-pink-600',
  },
  {
    href: '/guide',
    icon: '📚',
    title: 'Gluten Guide',
    description: 'Quick reference for ingredients and hidden gluten',
    gradient: 'from-amber-400 to-orange-400',
    bgGlow: 'bg-amber-500/20',
    iconBg: 'bg-amber-100',
    hoverText: 'text-amber-600',
  },
];

export default function Home() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.set('term', searchTerm);
    if (location) params.set('location', location);
    router.push(`/restaurants?${params.toString()}`);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="relative text-center mb-16 py-8">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-10 w-32 h-32 bg-pink-300/30 rounded-full blur-3xl" />
        <div className="absolute top-10 right-10 w-40 h-40 bg-violet-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-36 h-36 bg-teal-300/30 rounded-full blur-3xl" />

        <div className="relative">
          <div className="inline-block mb-4">
            <span className="text-5xl float">✨</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-semibold mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
            <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">CeliApp</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Your playful companion for living your{' '}
            <span className="font-semibold text-violet-600">best gluten-free life</span>
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/diary" className="badge-teal px-4 py-1.5 rounded-full text-sm font-medium hover:opacity-80 transition-opacity cursor-pointer">
              Track Meals
            </Link>
            <Link href="/recipes" className="badge-pink px-4 py-1.5 rounded-full text-sm font-medium hover:opacity-80 transition-opacity cursor-pointer">
              Find Recipes
            </Link>
            <Link href="/restaurants" className="badge-purple px-4 py-1.5 rounded-full text-sm font-medium hover:opacity-80 transition-opacity cursor-pointer">
              Discover Restaurants
            </Link>
          </div>
        </div>
      </div>

      {/* Featured: Restaurant Search */}
      <div className="mb-10">
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 rounded-3xl p-8 text-white shadow-xl">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

          <div className="relative">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
                <span className="text-4xl">🍽️</span>
              </div>
              <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-3 ml-3">
                AI-Powered Menu Analysis
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                Find GF & Veggie Menu Items
              </h2>
              <p className="text-white/90 leading-relaxed max-w-xl mx-auto">
                Search any restaurant and instantly see which dishes are likely gluten-free and vegetarian.
              </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    placeholder="Restaurant name or cuisine..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-lg"
                  />
                </div>
                <div className="flex-1 sm:flex-initial sm:w-48 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">📍</span>
                  <input
                    type="text"
                    placeholder="ZIP or city..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-white text-violet-600 px-8 py-4 rounded-xl font-bold hover:bg-violet-50 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  <span>Search</span>
                  <span>→</span>
                </button>
              </div>
              <p className="text-center text-white/70 text-sm mt-4">
                Try &quot;Ethiopian&quot; in &quot;Brooklyn&quot; or just enter a ZIP code to explore nearby
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {features.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="card-pop group relative block p-6 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
          >
            {/* Glow effect on hover - positioned behind content */}
            <div className={`absolute inset-0 ${feature.bgGlow} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`} />

            <div className="relative z-10">
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-16 h-16 ${feature.iconBg} rounded-2xl mb-4`}>
                <span className="text-4xl wiggle">{feature.icon}</span>
              </div>

              {/* Content */}
              <h2 className={`text-2xl font-bold text-gray-800 mb-2 group-hover:${feature.hoverText} transition-colors`}>
                {feature.title}
              </h2>
              <p className="text-gray-500 leading-relaxed">
                {feature.description}
              </p>

              {/* Arrow indicator */}
              <div className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                <span>Get started</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Fun stats or tips could go here */}
      <div className="mt-12 grid grid-cols-3 gap-4 text-center">
        <div className="p-4">
          <div className="text-3xl mb-2">🥗</div>
          <p className="text-sm text-gray-500">Track your meals</p>
        </div>
        <div className="p-4">
          <div className="text-3xl mb-2">💪</div>
          <p className="text-sm text-gray-500">Feel your best</p>
        </div>
        <div className="p-4">
          <div className="text-3xl mb-2">🎉</div>
          <p className="text-sm text-gray-500">Live gluten-free</p>
        </div>
      </div>
    </div>
  );
}
